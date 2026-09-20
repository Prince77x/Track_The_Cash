import React, { useState } from 'react';
import {
  X, FileText, User, MapPin, Building, Clock, CheckCircle,
  AlertTriangle, Shield, MessageSquare, Send, ChevronRight,
  Hash, Phone, CreditCard, ArrowUpCircle, UserCheck
} from 'lucide-react';

const PRIORITY_COLORS = {
  CRITICAL: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: '#ef4444' },
  HIGH:     { bg: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '#f97316' },
  MEDIUM:   { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '#f59e0b' },
  LOW:      { bg: 'rgba(16,185,129,0.15)',  color: '#34d399', border: '#10b981' },
};

const STATUS_COLORS = {
  NEW:          { bg: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '#0284c7' },
  OPEN:         { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: '#f97316' },
  UNDER_REVIEW: { bg: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '#a855f7' },
  RESOLVED:     { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: '#10b981' },
  CLOSED:       { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '#64748b' },
};

const Badge = ({ text, colorSet }) => (
  <span style={{
    backgroundColor: colorSet?.bg || 'rgba(56,189,248,0.1)',
    color: colorSet?.color || '#38bdf8',
    border: `1px solid ${colorSet?.border || '#0284c7'}`,
    borderRadius: '5px',
    padding: '2px 8px',
    fontSize: '0.68rem',
    fontWeight: 800,
    letterSpacing: '0.07em',
    fontFamily: 'JetBrains Mono, monospace',
    textTransform: 'uppercase'
  }}>{text}</span>
);

const InfoRow = ({ icon: Icon, label, value, mono = false }) => (
  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.55rem' }}>
    <Icon size={13} color="#4d6080" style={{ marginTop: '2px', flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <span style={{ fontSize: '0.67rem', color: '#4d6080', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit' }}>{value || '—'}</span>
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{
    fontSize: '0.68rem', fontWeight: 800, color: '#4d6080',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    borderBottom: '1px solid #17233d', paddingBottom: '0.35rem', marginBottom: '0.75rem'
  }}>{children}</div>
);

export const ComplaintDetailModal = ({ complaint, onClose, onUpdate, getAuthHeader, username }) => {
  const [noteText, setNoteText] = useState('');
  const [assignOfficer, setAssignOfficer] = useState('');
  const [submitting, setSubmitting] = useState('');
  const [localComplaint, setLocalComplaint] = useState(complaint);

  if (!localComplaint) return null;

  const pr = PRIORITY_COLORS[localComplaint.priority] || PRIORITY_COLORS.HIGH;
  const st = STATUS_COLORS[localComplaint.status] || STATUS_COLORS.NEW;
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const amtFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(localComplaint.amount_inr);

  const apiCall = async (url, method, body) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const handleStatusChange = async (newStatus) => {
    setSubmitting('status');
    try {
      const updated = await apiCall(`/complaints/${localComplaint.complaint_id}/status`, 'PATCH', {
        status: newStatus,
        officer_name: username,
        resolution_summary: newStatus === 'RESOLVED' ? `Resolved by ${username}.` : undefined
      });
      setLocalComplaint(updated);
      onUpdate?.(updated);
    } catch (e) { console.error(e); }
    setSubmitting('');
  };

  const handlePriorityChange = async (newPriority) => {
    setSubmitting('priority');
    try {
      const updated = await apiCall(`/complaints/${localComplaint.complaint_id}/priority`, 'PATCH', { priority: newPriority });
      setLocalComplaint(updated);
      onUpdate?.(updated);
    } catch (e) { console.error(e); }
    setSubmitting('');
  };

  const handleAssign = async () => {
    if (!assignOfficer.trim()) return;
    setSubmitting('assign');
    try {
      const updated = await apiCall(`/complaints/${localComplaint.complaint_id}/assign`, 'PATCH', { assigned_officer: assignOfficer.trim() });
      setLocalComplaint(updated);
      onUpdate?.(updated);
      setAssignOfficer('');
    } catch (e) { console.error(e); }
    setSubmitting('');
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSubmitting('note');
    try {
      const updated = await apiCall(`/complaints/${localComplaint.complaint_id}/notes`, 'POST', {
        author: username || 'LEA Officer',
        note: noteText.trim()
      });
      setLocalComplaint(updated);
      onUpdate?.(updated);
      setNoteText('');
    } catch (e) { console.error(e); }
    setSubmitting('');
  };

  const isResolved = ['RESOLVED', 'CLOSED'].includes(localComplaint.status);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      backgroundColor: 'rgba(0,0,0,0.82)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        backgroundColor: '#0c1322', border: '1px solid #17233d',
        borderRadius: '14px', width: '100%', maxWidth: '860px',
        maxHeight: '92vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.4rem', borderBottom: '1px solid #17233d',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: 'rgba(56,189,248,0.12)', padding: '0.5rem', borderRadius: '8px' }}>
              <FileText size={18} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
                {localComplaint.complaint_id}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#4d6080', marginTop: '1px' }}>
                {localComplaint.category} · {fmtDate(localComplaint.timestamp)}
              </div>
            </div>
            <Badge text={localComplaint.priority} colorSet={pr} />
            <Badge text={localComplaint.status} colorSet={st} />
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body — two columns */}
        <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
          {/* Left panel */}
          <div style={{ padding: '1.2rem 1.4rem', borderRight: '1px solid #17233d' }}>
            <SectionTitle>Incident Details</SectionTitle>
            <InfoRow icon={Hash} label="Transaction ID" value={localComplaint.transaction_id} mono />
            <InfoRow icon={CreditCard} label="ATM ID" value={localComplaint.atm_id} mono />
            <InfoRow icon={AlertTriangle} label="Crime Type" value={localComplaint.crime_type?.replace(/_/g, ' ').toUpperCase()} />
            <InfoRow icon={MapPin} label="Location" value={`${localComplaint.district}, ${localComplaint.state}`} />
            <InfoRow icon={ArrowUpCircle} label="Amount" value={amtFormatted} />
            {localComplaint.atm_details && (
              <InfoRow icon={Building} label="Bank / ATM" value={localComplaint.atm_details.bank_name} />
            )}

            <SectionTitle style={{ marginTop: '1.2rem' }}>Complainant</SectionTitle>
            <InfoRow icon={User} label="Name" value={localComplaint.complainant_name} />
            <InfoRow icon={Phone} label="Contact" value={localComplaint.contact_phone} mono />
            {localComplaint.atm_details?.risk_score != null && (
              <InfoRow icon={Shield} label="ATM Risk Score"
                value={`${(localComplaint.atm_details.risk_score * 100).toFixed(1)}% (${localComplaint.atm_details.risk_score > 0.7 ? 'HIGH' : localComplaint.atm_details.risk_score > 0.4 ? 'MEDIUM' : 'LOW'})`} />
            )}

            {localComplaint.description && (
              <>
                <SectionTitle style={{ marginTop: '1.2rem' }}>Description</SectionTitle>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{localComplaint.description}</p>
              </>
            )}

            {/* Resolution info */}
            {isResolved && (
              <div style={{ marginTop: '1rem', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399', marginBottom: '0.3rem' }}>✓ RESOLUTION SUMMARY</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{localComplaint.resolution_summary || 'Complaint resolved.'}</div>
                <div style={{ fontSize: '0.7rem', color: '#4d6080', marginTop: '0.3rem' }}>Resolved: {fmtDate(localComplaint.resolved_at)}</div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div style={{ padding: '1.2rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Controls */}
            {!isResolved && (
              <div>
                <SectionTitle>Investigation Controls</SectionTitle>

                {/* Status */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#4d6080', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Update Status</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'].map(s => (
                      <button key={s} disabled={submitting === 'status'} onClick={() => handleStatusChange(s)}
                        style={{
                          padding: '0.3rem 0.65rem', borderRadius: '5px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                          border: `1px solid ${STATUS_COLORS[s]?.border || '#334155'}`,
                          backgroundColor: localComplaint.status === s ? STATUS_COLORS[s]?.bg : 'transparent',
                          color: STATUS_COLORS[s]?.color || '#94a3b8',
                          opacity: submitting === 'status' ? 0.5 : 1
                        }}>{s.replace('_', ' ')}</button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#4d6080', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Change Priority</div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                      <button key={p} disabled={submitting === 'priority'} onClick={() => handlePriorityChange(p)}
                        style={{
                          padding: '0.3rem 0.65rem', borderRadius: '5px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                          border: `1px solid ${PRIORITY_COLORS[p]?.border}`,
                          backgroundColor: localComplaint.priority === p ? PRIORITY_COLORS[p]?.bg : 'transparent',
                          color: PRIORITY_COLORS[p]?.color,
                          opacity: submitting === 'priority' ? 0.5 : 1
                        }}>{p}</button>
                    ))}
                  </div>
                </div>

                {/* Assign Officer */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#4d6080', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Assigned: <span style={{ color: '#38bdf8' }}>{localComplaint.assigned_officer}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input value={assignOfficer} onChange={e => setAssignOfficer(e.target.value)}
                      placeholder="Officer ID / Name"
                      style={{ flex: 1, backgroundColor: '#060d1e', border: '1px solid #17233d', borderRadius: '5px', color: '#f1f5f9', fontSize: '0.78rem', padding: '0.35rem 0.6rem', outline: 'none' }} />
                    <button onClick={handleAssign} disabled={submitting === 'assign' || !assignOfficer.trim()}
                      style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '5px', padding: '0.35rem 0.8rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <UserCheck size={14} /> Assign
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Investigation Notes Timeline */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <SectionTitle>Investigation Audit Trail</SectionTitle>
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.2rem', maxHeight: '220px' }}>
                {(localComplaint.investigation_notes || []).length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: '#4d6080', textAlign: 'center', paddingTop: '1rem' }}>No notes yet.</div>
                ) : (
                  [...(localComplaint.investigation_notes || [])].reverse().map((note, i) => (
                    <div key={i} style={{ borderLeft: '2px solid #17233d', paddingLeft: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8' }}>{note.author}</span>
                        <span style={{ fontSize: '0.67rem', color: '#4d6080' }}>{fmtDate(note.timestamp)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>{note.note}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note */}
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#4d6080', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Add Investigation Note</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
                    placeholder="Enter field observation, evidence note, or action taken..."
                    style={{ backgroundColor: '#060d1e', border: '1px solid #17233d', borderRadius: '6px', color: '#f1f5f9', fontSize: '0.78rem', padding: '0.5rem 0.7rem', resize: 'vertical', outline: 'none', lineHeight: 1.5 }} />
                  <button onClick={handleAddNote} disabled={submitting === 'note' || !noteText.trim()}
                    style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '5px', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', opacity: submitting === 'note' || !noteText.trim() ? 0.5 : 1 }}>
                    <Send size={13} /> {submitting === 'note' ? 'Submitting...' : 'Add Note'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
