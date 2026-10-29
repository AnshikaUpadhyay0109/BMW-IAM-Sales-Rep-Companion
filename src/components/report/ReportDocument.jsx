import React from 'react';
import { Icon } from '../primitives/Icon';
import { REPS, ME } from '../../data/reps';
import { TOPIC_IC, statusStyle, toolStyle, prioStyle, statusLbl } from '../../data/pickLists';
import { fmtLong, fmtDM, TODAY, nowT } from '../../utils/formatters';

export default function ReportDocument({ report, dealer, draft }) {
  const rep = REPS[report.rep || ME];
  const pill = (t, c, bg) => <span className="pill s" style={{ color: c, background: bg }}>{t}</span>;
  const toolPill = (v) => {
    if (!v) return <span style={{ color: 'var(--dim)' }}>Not captured</span>;
    const s = toolStyle(v);
    return pill(v, s.c, s.bg);
  };

  return (
    <div className="paper">
      <div className="ph">
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#0A0E1A,#2D3748)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="store" size={20} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--dim)' }}>BMW IAM Copilot · Visit report</div>
          <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.01em', margin: '3px 0 2px' }}>{dealer.name}</div>
          <div style={{ fontSize: 12, color: 'var(--sub)' }}>{dealer.code} · {dealer.contact}{dealer.ctitle ? `, ${dealer.ctitle}` : ''}</div>
        </div>
        {draft && <span className="pill" style={{ color: '#A35F00', background: '#FFF4DC' }}>Draft · not submitted</span>}
        {!draft && report.submitted && <span className="pill" style={{ color: '#11834A', background: '#E8F7EF' }}>Submitted</span>}
      </div>

      <div className="pgrid">
        <div><div className="ml">Visit date</div><div className="mv">{fmtLong(report.date || TODAY)}</div></div>
        <div><div className="ml">Time</div><div className="mv">{report.time || nowT()}</div></div>
        <div>
          <div className="ml">Visited by</div>
          <div className="mv" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="ava" style={{ width: 20, height: 20, background: rep?.color || '#A100FF', fontSize: 8 }}>{rep?.ini}</div>
            {rep?.name}
          </div>
        </div>
        <div><div className="ml">Territory</div><div className="mv">{rep?.territory}</div></div>
      </div>

      <div className="ps">
        <h4>Discussion topics</h4>
        {report.topics?.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {report.topics.map(t => (
              <span key={t} className="tchip on" style={{ padding: '4px 10px', fontSize: 12 }}>
                <Icon name={TOPIC_IC[t] || 'dots'} size={12} color="var(--ac)" />{t}
              </span>
            ))}
          </div>
        ) : <p className="none">None selected</p>}
      </div>

      <div className="ps">
        <h4>Overall visit notes</h4>
        {report.notes ? <p>{report.notes}</p> : <p className="none">Not captured</p>}
      </div>

      <div className="ps">
        <h4>Tools usage</h4>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 4 }}>PL24</div>
            {toolPill(report.pl24)}
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 4 }}>AOS</div>
            {toolPill(report.aos)}
          </div>
        </div>
      </div>

      <div className="ps">
        <h4>Biggest challenge</h4>
        {report.challenge ? <p style={{ fontWeight: 500 }}>{report.challenge}</p> : <p className="none">Not captured</p>}
      </div>

      <div className="ps">
        <h4>Biggest opportunity</h4>
        {report.opportunity ? <p style={{ fontWeight: 500 }}>{report.opportunity}</p> : <p className="none">Not captured</p>}
      </div>

      <div className="ps">
        <h4>Competitor activities</h4>
        {report.comp ? <p>{report.comp}</p> : <p className="none">No competitor activity reported</p>}
        {report.photos?.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
            {report.photos.map((im, i) => (
              <figure key={i} style={{ margin: 0 }}>
                <img src={im.src} alt={im.name} style={{ width: 176, height: 128, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--bd)', display: 'block' }} />
                <figcaption style={{ fontSize: 10.5, color: 'var(--dim)', marginTop: 4, maxWidth: 176 }}>{im.name}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      <div className="ps">
        <h4>Actions agreed</h4>
        {report.actions?.length > 0 ? (
          <table className="ptbl">
            <thead><tr><th>Action</th><th>Owner</th><th>Due date</th><th>Priority</th></tr></thead>
            <tbody>
              {report.actions.map((a, i) => {
                const prio = a.prio || a.pri || a.priority || 'Medium';
                const p = prioStyle(prio);
                return (
                  <tr key={i}>
                    <td>{a.text || a.t || a.action}</td>
                    <td>{a.owner || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{(a.due || a.dueDate) ? fmtDM(a.due || a.dueDate) : <span style={{ color: 'var(--dim)' }}>No date</span>}</td>
                    <td><span className="pill s" style={{ color: p.c, background: p.bg }}>{prio}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p className="none">No actions agreed</p>}
      </div>

      <div className="ps">
        <h4>Overall visit status</h4>
        {report.status ? (() => {
          const x = statusStyle(report.status);
          return <span className="pill s" style={{ fontSize: 12.5, padding: '5px 13px', color: x.c, background: x.bg }}>{statusLbl(report.status)}</span>;
        })() : <p className="none">Not captured</p>}
      </div>

      <div style={{ marginTop: 2, paddingTop: 12, fontSize: 10.5, color: 'var(--dim)', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <span>{draft ? 'Prepared by' : 'Submitted by'} {rep?.name} · {fmtLong(report.date || TODAY)}</span>
        <span>Generated with IAM Copilot</span>
      </div>
    </div>
  );
}
