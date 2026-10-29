import { useRef, useState, useCallback } from 'react';
import { api } from '../services/api';

// Picks the best supported audio format for the current browser/OS.
// iOS Safari records as audio/mp4; Android Chrome as audio/webm;codecs=opus.
function getSupportedMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

// Pause/resume aren't universal (older Safari). Feature-detect so the UI can
// hide the Pause control and fall back to plain record/stop where unsupported.
const PAUSE_SUPPORTED =
  typeof MediaRecorder !== 'undefined' &&
  typeof MediaRecorder.prototype.pause === 'function';

export function useVoiceRecorder({ onTranscript, onAudioStored, visitId, folder = 'dealer' }) {
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const mimeTypeRef = useRef('');
  // Input-level monitoring, so we can skip transcription when nothing was said.
  const audioCtxRef      = useRef(null);
  const rafRef           = useRef(null);
  const soundDetectedRef = useRef(false);
  const isPausedRef      = useRef(false);

  const [isRecording,    setIsRecording]    = useState(false);
  const [isPaused,       setIsPaused]       = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error,          setError]          = useState(null);

  const start = useCallback(async () => {
    setError(null);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone access and try again.'
          : 'Could not access microphone. Please try again.'
      );
      return;
    }

    const mimeType = getSupportedMimeType();
    mimeTypeRef.current = mimeType;
    chunksRef.current   = [];
    soundDetectedRef.current = false;
    isPausedRef.current = false;
    setIsPaused(false);

    // Watch the mic input level; mark that real sound occurred so a silent
    // recording can be discarded without calling the transcription API.
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      const SILENCE_THRESHOLD = 10; // deviation from the 128 midpoint; silence ≈ 0–3
      const checkLevel = () => {
        analyser.getByteTimeDomainData(samples);
        let peak = 0;
        for (let i = 0; i < samples.length; i++) {
          const dev = Math.abs(samples[i] - 128);
          if (dev > peak) peak = dev;
        }
        // Ignore ambient sound while paused — only count audio that's recorded.
        if (!isPausedRef.current && peak > SILENCE_THRESHOLD) soundDetectedRef.current = true;
        rafRef.current = requestAnimationFrame(checkLevel);
      };
      checkLevel();
      audioCtxRef.current = audioCtx;
    } catch {
      // Web Audio unavailable — fall back to always transcribing.
      soundDetectedRef.current = true;
    }

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }

      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || 'audio/webm' });
      // Nothing captured, or only silence → skip the transcription round-trip.
      if (blob.size === 0 || !soundDetectedRef.current) {
        setError('No speech detected — nothing was recorded.');
        return;
      }
      await transcribeAndStore(blob);
    };

    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);
  }, [visitId, folder]); // eslint-disable-line react-hooks/exhaustive-deps

  const pause = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause();   // suspends capture; chunks keep accumulating
      isPausedRef.current = true;
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume();
      isPausedRef.current = false;
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    recorderRef.current?.stop();       // onstop builds ONE blob from all chunks
    setIsRecording(false);
    setIsPaused(false);
    isPausedRef.current = false;
  }, []);

  async function transcribeAndStore(blob) {
    setIsTranscribing(true);
    setError(null);
    try {
      const { transcript, audioKey } = await api.transcribeAudio(blob, { visitId, folder });

      if (transcript?.trim()) {
        onTranscript(transcript.trim());
      }
      if (audioKey && onAudioStored) {
        onAudioStored(audioKey);
      }
    } catch (err) {
      // OFFLINE PLACEHOLDER: if offline STT is ever needed, queue `blob` to
      // IndexedDB here and retry on the `online` event. For now the app
      // requires internet, so we just surface the error.
      setError('Transcription failed. Please check your connection and try again.');
      console.error('[useVoiceRecorder] transcribeAndStore error:', err.message);
    } finally {
      setIsTranscribing(false);
    }
  }

  return { isRecording, isPaused, isTranscribing, error, start, pause, resume, stop, pauseSupported: PAUSE_SUPPORTED };
}
