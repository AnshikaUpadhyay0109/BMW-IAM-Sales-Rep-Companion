import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} from "@aws-sdk/client-transcribe";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── AWS clients (S3 + Transcribe + Bedrock share the same credentials chain) ─
const AWS_REGION = process.env.AWS_REGION || "eu-central-1";
const s3         = new S3Client({ region: AWS_REGION });
const transcribe = new TranscribeClient({ region: AWS_REGION });
const bedrock    = new BedrockRuntimeClient({ region: AWS_REGION });
const S3_BUCKET  = process.env.S3_BUCKET;

// Bedrock model used for /api/ai/generate (summarize, pitch, etc.)
// If your region requires a cross-region inference profile, set BEDROCK_MODEL_ID
// in .env to something like `eu.anthropic.claude-haiku-4-5-20251001-v1:0`.
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID
  || "anthropic.claude-haiku-4-5-20251001-v1:0";

// ── Azure OpenAI config (server-side — NEVER sent to browser) ───────────────
const AZURE_CONFIG = {
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview",
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
};

// ── Demo credentials (POC only) ────────────────────────────────────────────
const DEMO_EMAIL = process.env.DEMO_EMAIL || "demo.agenticai@corporate.com";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "AgenticAI@2026";
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || "manager.demo@corporate.com";
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD || "Manager@2026";

// ── Helper: call Azure OpenAI ──────────────────────────────────────────────
async function callAzureOpenAI({ messages, maxTokens = 500, temperature = 0.7 }) {
  const url = `${AZURE_CONFIG.endpoint}/openai/deployments/${AZURE_CONFIG.deployment}/chat/completions?api-version=${AZURE_CONFIG.apiVersion}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": AZURE_CONFIG.apiKey,
    },
    body: JSON.stringify({
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Azure OpenAI error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ── Helper: call AWS Bedrock (Claude) ──────────────────────────────────────
// Used by /api/ai/generate for summarize, pitch generation, etc.
// Uses the Converse API which is model-agnostic across Bedrock's providers.
async function callBedrock({ systemPrompt, userPrompt, maxTokens = 500, temperature = 0.7 }) {
  const response = await bedrock.send(new ConverseCommand({
    modelId:  BEDROCK_MODEL_ID,
    system:   systemPrompt ? [{ text: systemPrompt }] : undefined,
    messages: [{ role: "user", content: [{ text: userPrompt }] }],
    inferenceConfig: { maxTokens, temperature },
  }));
  const text = response?.output?.message?.content?.[0]?.text || "";
  return text.trim();
}

// ── API Routes ─────────────────────────────────────────────────────────────

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Auth ───────────────────────────────────────────────────────────────────
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};

  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    return res.json({
      success: true,
      token: "demo-token-poc",
      user: {
        name: "Marcus Schmidt",
        role: "C1 Europe Sales Executive",
        territory: "C1 Europe",
        isManager: false,
      },
    });
  }

  if (email === MANAGER_EMAIL && password === MANAGER_PASSWORD) {
    return res.json({
      success: true,
      token: "manager-token-poc",
      user: {
        name: "Anna Weber",
        role: "Regional Sales Manager",
        territory: "C1 Europe",
        isManager: true,
      },
    });
  }

  return res.status(401).json({
    success: false,
    error: "Invalid Username & Password",
  });
});

// ── AI: Chat (for ChatBot) ─────────────────────────────────────────────────
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, systemContext } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const allMessages = [];
    if (systemContext) {
      allMessages.push({ role: "system", content: systemContext });
    }
    allMessages.push(...messages);

    const reply = await callAzureOpenAI({
      messages: allMessages,
      maxTokens: 500,
      temperature: 0.7,
    });

    res.json({ reply });
  } catch (err) {
    console.error("[/api/ai/chat] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── AI: Generate (pitch, summary, email — general purpose) ────────────────
// Runs on AWS Bedrock (Claude Haiku). /api/ai/chat still uses Azure OpenAI.
app.post("/api/ai/generate", async (req, res) => {
  try {
    const { systemPrompt, userPrompt, maxTokens = 350, temperature = 0.7 } = req.body || {};

    if (!systemPrompt || !userPrompt) {
      return res.status(400).json({ error: "systemPrompt and userPrompt are required" });
    }

    const reply = await callBedrock({ systemPrompt, userPrompt, maxTokens, temperature });
    res.json({ reply });
  } catch (err) {
    console.error("[/api/ai/generate] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── AI: Summarize visit (2-3 sentence dealer card summary) ────────────────
app.post("/api/ai/summarize-visit", async (req, res) => {
  try {
    const { dealerName, topics, notes, actions, challenge, opportunity, status } = req.body || {};
    const actionsText = (actions || []).map(a => a.text || a.action || a.t).filter(Boolean).join("; ");
    const userPrompt = [
      `Dealer: ${dealerName || "Unknown"}`,
      topics?.length ? `Topics discussed: ${topics.join(", ")}` : "",
      notes ? `Visit notes: ${notes}` : "",
      challenge ? `Biggest challenge: ${challenge}` : "",
      opportunity ? `Biggest opportunity: ${opportunity}` : "",
      actionsText ? `Actions agreed: ${actionsText}` : "",
      status ? `Overall visit status: ${status}` : "",
    ].filter(Boolean).join("\n");

    const reply = await callBedrock({
      systemPrompt: "You are a BMW IAM sales assistant. Write a concise 2-3 sentence summary of a dealer visit for display on a dashboard card. Focus on the key findings, agreed actions, and dealer status. Be factual and professional. Do not use bullet points or headings — just plain sentences. Do not start with 'The visit' or 'During the visit'.",
      userPrompt,
      maxTokens: 150,
      temperature: 0.3,
    });
    res.json({ summary: reply });
  } catch (err) {
    console.error("[/api/ai/summarize-visit] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ai/summarize-transcript", async (req, res) => {
  try {
    const { transcript, dealerName } = req.body || {};
    if (!transcript) return res.status(400).json({ error: "transcript is required" });

    const reply = await callBedrock({
      systemPrompt: "You are a BMW IAM sales assistant. Summarize the following multi-speaker visit transcript. For each speaker (Person 1, Person 2, etc.), write one sentence describing what they discussed or said. Keep it concise and factual. Use the format: 'Person 1 discussed... Person 2 mentioned...' Do not use bullet points or headings.",
      userPrompt: `Dealer: ${dealerName || "Unknown"}\n\nTranscript:\n${transcript}`,
      maxTokens: 250,
      temperature: 0.3,
    });
    res.json({ summary: reply });
  } catch (err) {
    console.error("[/api/ai/summarize-transcript] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Voice-to-Form Extractor (T067) ─────────────────────────────────────────
//
// Turns a free-text visit transcript into a structured, schema-valid draft that
// maps onto the dealer / IR form_data. The LLM only extracts what is explicitly
// stated in the transcript; anything not mentioned is left empty. A server-side
// validation pass then drops any value the model invented that is not in the
// allowed option set, so the UI never receives an out-of-schema field.

// Allowed option sets — kept in sync with the form constants in
// DealerVisitFormNew.jsx / IRVisitFormNew.jsx. These are authoritative: the
// extractor result is filtered against them before it is returned.
const EXTRACT_SCHEMA = {
  dealer: {
    topics:        ["Stock", "Delivery", "PL24", "AOS", "Marketing", "Competition", "Pricing", "Reporting", "Other"],
    challenges:    ["Stock shortages", "Competitive pressure", "Pricing concerns", "Training needs", "CRM burden", "Delivery delays", "Budget constraints", "Seasonal slowdown", "Other"],
    opportunities: ["Fleet renewal", "Accessories bundle", "Maintenance restock", "Campaign qualification", "New account", "Warranty upsell", "Volume discount", "Other"],
    toolsUsage:    ["Using well", "Needs help", "Not using"],
    owners:        ["Marcus Schmidt", "Anna Weber"],
    priorities:    ["High", "Medium", "Low"],
    statuses:      ["Good", "Monitor", "Needs Support"],
  },
  ir: {
    topics:           ["Pricing", "Stock Availability", "PL24", "Delivery", "Rewards Program", "Technical Support", "Competition", "Marketing", "Warranty", "Other"],
    buyingBehaviours: ["Regular & Growing", "Captive Parts Only", "Buying Competitive Parts Elsewhere", "Inconsistent / Seasonal"],
    competitors:      ["LKQ", "Bosch", "Autodoc", "Inter-Team", "Other"],
    categoriesLost:   ["Brake Parts", "Filters", "Engine Oil", "Tyres", "Electrical", "Other"],
    responsible:      ["Rep", "Dealer", "Both"],
    priorities:       ["High", "Medium", "Low"],
    actionStatuses:   ["Open", "In Progress", "Closed"],
    visitOutcomes:    ["Order Generated", "Opportunity Identified", "No Progress"],
  },
};

// Build the extraction instruction + the exact JSON shape expected back.
function buildExtractionPrompt(formType) {
  const s = EXTRACT_SCHEMA[formType];
  const list = (arr) => arr.map((v) => `"${v}"`).join(", ");

  if (formType === "ir") {
    return `You extract structured data from an Independent Repairer (IR) sales-visit transcript.

RULES:
- Only extract information that is EXPLICITLY stated in the transcript. Never guess or infer.
- If something is not mentioned, use "" for strings, [] for arrays, and false for booleans. Do NOT invent values.
- For fields with an allowed list, choose ONLY from that list. If nothing fits, use "Other" (where available) or "".
- "visit_notes" must be a faithful 2-4 sentence factual summary of what was discussed — no opinions, no fabricated numbers.
- Return ONLY valid JSON. No markdown, no commentary.

ALLOWED VALUES:
- topics_discussed (array, pick any that apply): ${list(s.topics)}
- buying_behaviour (single): ${list(s.buyingBehaviours)}
- competitor_insight.competitor (single): ${list(s.competitors)}
- competitor_insight.category_lost (single): ${list(s.categoriesLost)}
- competitor_insight.mode (single): "Observed" or "Not Observed"
- actions_agreed[].responsible (single): ${list(s.responsible)}
- actions_agreed[].priority (single): ${list(s.priorities)}
- actions_agreed[].status (single): ${list(s.actionStatuses)}
- visit_outcome (single): ${list(s.visitOutcomes)}
- new_irs_identified (single): "No" or "Yes — added to CRM"

RETURN THIS EXACT JSON SHAPE:
{
  "topics_discussed": [],
  "other_topic": "",
  "visit_notes": "",
  "contact_met": "",
  "buying_behaviour": "",
  "competitor_insight": { "mode": "Not Observed", "competitor": "", "category_lost": "", "reason": "" },
  "direct_sale": { "sale_achieved": false, "products": [ { "product": "", "qty": "", "unitPrice": "" } ] },
  "actions_agreed": [ { "action": "", "responsible": "", "dueDate": "", "priority": "", "status": "Open" } ],
  "visit_outcome": "",
  "new_irs_identified": "No"
}
Notes: omit the products/actions arrays entirely (use []) if none were mentioned. "dueDate" must be ISO yyyy-mm-dd or "". "qty"/"unitPrice" are numeric strings or "".`;
  }

  // dealer
  return `You extract structured data from a BMW dealer sales-visit transcript.

RULES:
- Only extract information that is EXPLICITLY stated in the transcript. Never guess or infer.
- If something is not mentioned, use "" for strings and [] for arrays. Do NOT invent values.
- For fields with an allowed list, choose ONLY from that list. If nothing fits, use "Other" (where available) or "".
- "visit_notes" must be a faithful 2-4 sentence factual summary of what was discussed — no opinions, no fabricated numbers.
- Return ONLY valid JSON. No markdown, no commentary.

ALLOWED VALUES:
- topics_discussed (array, pick any that apply): ${list(s.topics)}
- biggest_challenge (single): ${list(s.challenges)}
- biggest_opportunity (single): ${list(s.opportunities)}
- tools_usage.pl24 (single): ${list(s.toolsUsage)}
- tools_usage.aos (single): ${list(s.toolsUsage)}
- competitor_activity.mode (single): "Observed" or "Not Observed"
- actions_agreed[].owner (single): ${list(s.owners)}
- actions_agreed[].priority (single): ${list(s.priorities)}
- overall_status (single): ${list(s.statuses)}

RETURN THIS EXACT JSON SHAPE:
{
  "topics_discussed": [],
  "other_topic": "",
  "visit_notes": "",
  "biggest_challenge": "",
  "biggest_opportunity": "",
  "tools_usage": { "pl24": "", "aos": "" },
  "competitor_activity": { "mode": "Not Observed", "comment": "" },
  "actions_agreed": [ { "action": "", "owner": "", "dueDate": "", "priority": "" } ],
  "overall_status": ""
}
Notes: use [] for actions_agreed if none were mentioned. "dueDate" must be ISO yyyy-mm-dd or "". tools_usage captures how the dealer is using PL24 and AOS tools — only fill if explicitly mentioned.`;
}

// Robustly parse a JSON object out of an LLM reply (handles ```json fences).
function parseJsonObject(text) {
  if (!text) return null;
  let s = text.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) return null;
  try {
    return JSON.parse(s.slice(first, last + 1));
  } catch {
    return null;
  }
}

const keepEnum = (val, allowed) => {
  if (!val) return "";
  const exact = allowed.find(a => a === val);
  if (exact) return exact;
  const lower = val.toLowerCase();
  const match = allowed.find(a => a.toLowerCase() === lower);
  return match || "";
};
const keepEnumArray = (arr, allowed) =>
  Array.isArray(arr) ? arr.map(v => keepEnum(v, allowed)).filter(Boolean) : [];

// Drop any model-invented values that are not in the schema (grounding gate).
function validateExtraction(formType, raw) {
  if (!raw || typeof raw !== "object") return null;
  const s = EXTRACT_SCHEMA[formType];
  const str = (v) => (typeof v === "string" ? v.trim() : "");

  if (formType === "ir") {
    const ci = raw.competitor_insight || {};
    const ds = raw.direct_sale || {};
    return {
      topics_discussed: keepEnumArray(raw.topics_discussed, s.topics),
      other_topic: str(raw.other_topic),
      visit_notes: str(raw.visit_notes),
      contact_met: str(raw.contact_met),
      buying_behaviour: keepEnum(str(raw.buying_behaviour), s.buyingBehaviours),
      competitor_insight: {
        mode: ["Observed", "Not Observed"].includes(ci.mode) ? ci.mode : "Not Observed",
        competitor: keepEnum(str(ci.competitor), s.competitors),
        category_lost: keepEnum(str(ci.category_lost), s.categoriesLost),
        reason: str(ci.reason),
      },
      direct_sale: {
        sale_achieved: ds.sale_achieved === true,
        products: Array.isArray(ds.products)
          ? ds.products
              .filter((p) => p && str(p.product))
              .map((p) => ({ product: str(p.product), qty: str(p.qty), unitPrice: str(p.unitPrice) }))
          : [],
      },
      actions_agreed: Array.isArray(raw.actions_agreed)
        ? raw.actions_agreed
            .filter((a) => a && str(a.action))
            .map((a) => ({
              action: str(a.action),
              responsible: keepEnum(str(a.responsible), s.responsible),
              dueDate: str(a.dueDate),
              priority: keepEnum(str(a.priority), s.priorities),
              status: keepEnum(str(a.status), s.actionStatuses) || "Open",
            }))
        : [],
      visit_outcome: keepEnum(str(raw.visit_outcome), s.visitOutcomes),
      new_irs_identified: ["No", "Yes — added to CRM"].includes(raw.new_irs_identified) ? raw.new_irs_identified : "No",
    };
  }

  // dealer
  const ca = raw.competitor_activity || {};
  const tu = raw.tools_usage || {};
  return {
    topics_discussed: keepEnumArray(raw.topics_discussed, s.topics),
    other_topic: str(raw.other_topic),
    visit_notes: str(raw.visit_notes),
    biggest_challenge: keepEnum(str(raw.biggest_challenge), s.challenges),
    biggest_opportunity: keepEnum(str(raw.biggest_opportunity), s.opportunities),
    tools_usage: {
      pl24: keepEnum(str(tu.pl24), s.toolsUsage),
      aos: keepEnum(str(tu.aos), s.toolsUsage),
    },
    competitor_activity: {
      mode: ["Observed", "Not Observed"].includes(ca.mode) ? ca.mode : "Not Observed",
      comment: str(ca.comment),
    },
    actions_agreed: Array.isArray(raw.actions_agreed)
      ? raw.actions_agreed
          .filter((a) => a && str(a.action))
          .map((a) => ({
            action: str(a.action),
            owner: keepEnum(str(a.owner), s.owners),
            dueDate: str(a.dueDate),
            priority: keepEnum(str(a.priority), s.priorities),
          }))
      : [],
    overall_status: keepEnum(str(raw.overall_status), s.statuses),
  };
}

// ── AI: Voice-to-Form Extractor (T067) ─────────────────────────────────────
// Body: { transcript: string, formType: "dealer" | "ir" }
// Returns: { extracted: <schema-valid form_data subset> }
app.post("/api/ai/extract-visit", async (req, res) => {
  try {
    const { transcript, formType = "dealer" } = req.body || {};

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: "transcript is required" });
    }
    if (!EXTRACT_SCHEMA[formType]) {
      return res.status(400).json({ error: `formType must be one of ${Object.keys(EXTRACT_SCHEMA).join(", ")}` });
    }

    const reply = await callBedrock({
      systemPrompt: buildExtractionPrompt(formType),
      userPrompt: `TRANSCRIPT:\n${transcript.trim()}`,
      maxTokens: 900,
      temperature: 0,
    });

    const parsed = parseJsonObject(reply);
    const extracted = validateExtraction(formType, parsed);

    if (!extracted) {
      return res.status(502).json({ error: "Could not parse a structured result from the transcript." });
    }

    res.json({ extracted });
  } catch (err) {
    console.error("[/api/ai/extract-visit] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── AI: Transcribe audio → text (AWS Transcribe) + store the audio ─────────
// The client sends ONE complete recording (start/pause/resume/stop is handled in
// the browser, producing a single blob), so there is NO server-side concatenation:
// upload once → transcribe → return.
// Expects JSON body: { audio: "data:<mimeType>;base64,...", mimeType, visitId, folder }
// Returns: { transcript: string, audioKey: string | null }
app.post("/api/ai/transcribe", async (req, res) => {
  try {
    const { audio, mimeType = "audio/webm", visitId, folder = "dealer" } = req.body || {};
    if (!audio) return res.status(400).json({ error: "audio is required" });
    if (!S3_BUCKET) return res.status(500).json({ error: "S3_BUCKET is not configured" });

    // Decode base64 data URL → Buffer. MIME types like "audio/webm;codecs=opus"
    // contain semicolons so we locate ";base64," by index, not regex.
    const base64Marker = ";base64,";
    const markerIndex = audio.indexOf(base64Marker);
    if (markerIndex === -1) return res.status(400).json({ error: "Invalid audio data URL" });
    const audioBuffer = Buffer.from(audio.substring(markerIndex + base64Marker.length), "base64");
    const ext = mimeType.includes("mp4") ? "mp4" : "webm";

    const fileId        = visitId || randomUUID();
    const finalAudioKey = `voice-notes/${folder}/${fileId}.${ext}`;

    // ── Step 1: Upload the complete recording (Transcribe reads from S3) ────
    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: finalAudioKey,
      Body: audioBuffer,
      ContentType: mimeType,
      StorageClass: "INTELLIGENT_TIERING",
    }));

    // ── Step 2: Transcribe it ──────────────────────────────────────────────
    const jobName     = `visit-${fileId}-${Date.now()}`;
    const mediaFormat = ext === "mp4" ? "mp4" : "webm";

    await transcribe.send(new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: "en-US",            // future: pass from request for multi-language
      MediaFormat:  mediaFormat,
      Media:        { MediaFileUri: `s3://${S3_BUCKET}/${finalAudioKey}` },
      Settings: {
        ShowSpeakerLabels: true,
        MaxSpeakerLabels: 5,
      },
    }));

    let transcript = "";
    let completed = false;
    const MAX_ATTEMPTS = 60;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const { TranscriptionJob: job } = await transcribe.send(
        new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })
      );
      const status = job?.TranscriptionJobStatus;
      if (status === "COMPLETED") {
        completed = true;
        const transcriptUri = job.Transcript?.TranscriptFileUri;
        const transcriptRes = await fetch(transcriptUri);
        const data = await transcriptRes.json();
        // Build speaker-tagged transcript from segments
        const segments = data?.results?.speaker_labels?.segments;
        if (segments?.length) {
          const items = data.results.items || [];
          let currentSpeaker = null;
          const parts = [];
          for (const item of items) {
            if (item.type === "pronunciation") {
              const seg = segments.find(s => s.items?.some(si =>
                si.start_time === item.start_time && si.end_time === item.end_time
              ));
              const spk = seg?.items?.find(si =>
                si.start_time === item.start_time && si.end_time === item.end_time
              )?.speaker_label;
              if (spk && spk !== currentSpeaker) {
                currentSpeaker = spk;
                const personNum = parseInt(spk.replace("spk_", ""), 10) + 1;
                parts.push(`\n[Person ${personNum}]: `);
              }
              parts.push(item.alternatives?.[0]?.content || "");
              parts.push(" ");
            } else if (item.type === "punctuation") {
              // Remove trailing space before punctuation
              if (parts.length && parts[parts.length - 1] === " ") parts.pop();
              parts.push(item.alternatives?.[0]?.content || "");
              parts.push(" ");
            }
          }
          transcript = parts.join("").trim();
        } else {
          transcript = data?.results?.transcripts?.[0]?.transcript || "";
        }
        break;
      }
      if (status === "FAILED") {
        throw new Error(`Transcription job failed: ${job?.FailureReason || "unknown"}`);
      }
    }

    // Only a genuine timeout (job never completed) is an error.
    if (!completed) {
      return res.status(504).json({ error: "Transcription timed out" });
    }

    // Completed but no speech — drop the silent audio and tell the client nothing
    // was recorded (no error).
    if (!transcript.trim()) {
      await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: finalAudioKey })).catch(() => {});
      return res.json({ transcript: "", audioKey: null });
    }

    res.json({ transcript, audioKey: finalAudioKey });
  } catch (err) {
    console.error("[/api/ai/transcribe] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Photo pre-signed URL ───────────────────────────────────────────────────
app.get("/api/photo-url", async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "key is required" });
    if (!S3_BUCKET) return res.status(500).json({ error: "S3_BUCKET is not configured" });

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      { expiresIn: 3600 }
    );
    res.json({ url });
  } catch (err) {
    console.error("[/api/photo-url] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Photo upload → S3 ─────────────────────────────────────────────────────
app.post("/api/upload-photo", async (req, res) => {
  try {
    const { base64, fileName, folder = "misc" } = req.body || {};
    if (!base64 || !fileName) {
      return res.status(400).json({ error: "base64 and fileName are required" });
    }
    if (!S3_BUCKET) {
      return res.status(500).json({ error: "S3_BUCKET is not configured" });
    }

    const matches = base64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: "Invalid base64 data URL" });
    }
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const ext = fileName.split(".").pop() || "jpg";
    const key = `competitor-photos/${folder}/${randomUUID()}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));

    const region = process.env.AWS_REGION || "eu-central-1";
    const url = `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
    res.json({ url, key });
  } catch (err) {
    console.error("[/api/upload-photo] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Serve static files from dist (production) ──────────────────────────────
app.use(express.static(path.join(__dirname, "dist")));

// React Router support — all non-API routes serve index.html
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ── Start server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || "development"}`);
  console.log(`   API:   http://localhost:${PORT}/api`);
});
