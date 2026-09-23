import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, ChevronRight, RefreshCw, ArrowUpDown, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';

const PRIORITY_COLORS = {
  CRITICAL: { color: '#f87171', bg: 'rgba(239,68,68,0.15)', border: '#ef4444' },
  HIGH:     { color: '#fb923c', bg: 'rgba(249,115,22,0.15)', border: '#f97316' },
  MEDIUM:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', border: '#f59e0b' },
  LOW:      { color: '#34d399', bg: 'rgba(16,185,129,0.15)',  border: '#10b981' },
};

const STATUS_COLORS = {
  NEW:          { color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' },
  OPEN:         { color: '#fb923c', bg: 'rgba(249,115,22,0.12)' },
  UNDER_REVIEW: { color: '#c084fc', bg: 'rgba(168,85,247,0.15)' },
  RESOLVED:     { color: '#34d399', bg: 'rgba(16,185,129,0.15)' },
  CLOSED:       { color: '#94a3b8', bg: 'rgba(100,116,139,0.15)' },
};

const PriorityBadge = ({ priority }) => {
  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS.HIGH;
  return (
    <span style={{
      backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: '4px', padding: '2px 6px', fontSize: '0.66rem', fontWeight: 800,
      letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase',
      whiteSpace: 'nowrap'
    }}>{priority}</span>
  );
};

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.NEW;
  return (
    <span style={{
      backgroundColor: c.bg, color: c.color,
      borderRadius: '4px', padding: '2px 7px', fontSize: '0.66rem', fontWeight: 700,
      letterSpacing: '0.04em', whiteSpace: 'nowrap'
    }}>{status?.replace('_', ' ')}</span>
  );
};

export const ComplaintTable = ({ getAuthHeader, onSelectComplaint, liveUpdates = [] }) => {
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const fetchComplaints = async (opts = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: LIMIT,
        offset: opts.offset ?? offset,
        ...(opts.status ?? statusFilter) && { status: opts.status ?? statusFilter },
        ...((opts.priority ?? priorityFilter) !== 'ALL') && { priority: opts.priority ?? priorityFilter },
        ...((opts.search ?? search).trim()) && { search: (opts.search ?? search).trim() },
      });
      const res = await fetch(`/complaints?${params}`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setComplaints(data.items || []);
      setTotal(data.total || 0);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchComplaints({ offset: 0 }); setOffset(0); }, [statusFilter, priorityFilter]);
  useEffect(() => {
    const t = setTimeout(() => { fetchComplaints({ offset: 0, search }); setOffset(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Merge live WebSocket updates
  useEffect(() => {
    if (!liveUpdates.length) return;
    const latest = liveUpdates[liveUpdates.length - 1];
    if (!latest?.data) return;
    setComplaints(prev => {
      const existing = prev.findIndex(c => c.complaint_id === latest.data.complaint_id);
      if (existing !== -1) {
        const next = [...prev];
        next[existing] = latest.data;
        return next;
      }
      if (latest.event === 'NEW_COMPLAINT') return [latest.data, ...prev];
      return prev;
    });
  }, [liveUpdates]);

  const amtFmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
  const timeFmt = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const handlePage = (dir) => {
    const newOff = Math.max(0, offset + dir * LIMIT);
    setOffset(newOff);
    fetchComplaints({ offset: newOff });
  };

  return (
    <div style={{ backgroundColor: '#0c1322', border: '1px solid #17233d', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Table Header */}
      <div style={{ padding: '0.85rem 1.1rem', borderBottom: '1px solid #17233d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={16} color="#38bdf8" />
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f1f5f9' }}>Active Complaint Intel</span>
          <span style={{ backgroundColor: 'rgba(56,189,248,0.1)', color: '#38bdf8', borderRadius: '999px', padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>{total}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {[['active', 'Active'], ['resolved', 'Resolved'], ['', 'All']].map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val)}
                style={{
                  padding: '0.25rem 0.65rem', borderRadius: '5px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                  border: '1px solid',
                  borderColor: statusFilter === val ? '#0284c7' : '#17233d',
                  backgroundColor: statusFilter === val ? 'rgba(2,132,199,0.15)' : 'transparent',
                  color: statusFilter === val ? '#38bdf8' : '#566d8a'
                }}>{label}</button>
            ))}
          </div>

          {/* Priority filter */}
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            style={{ backgroundColor: '#060d1e', border: '1px solid #17233d', borderRadius: '5px', color: '#94a3b8', fontSize: '0.75rem', padding: '0.25rem 0.6rem', outline: 'none', cursor: 'pointer' }}>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#060d1e', border: '1px solid #17233d', borderRadius: '5px', padding: '0.25rem 0.6rem' }}>
            <Search size={13} color="#4d6080" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search complaints..." style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '0.75rem', width: '160px' }} />
          </div>

          <button onClick={() => fetchComplaints()} title="Refresh"
            style={{ backgroundColor: 'transparent', border: '1px solid #17233d', borderRadius: '5px', padding: '0.3rem', cursor: 'pointer', color: '#566d8a', display: 'flex' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* 🚀 Scrollable Table Container */}
      <div style={{ maxHeight: '360px', overflowY: 'auto', overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', position: 'relative' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#0c1322', zIndex: 10 }}>
            <tr style={{ borderBottom: '1px solid #17233d' }}>
              {['Complaint ID', 'Priority', 'Category', 'Location', 'Amount (₹)', 'Status', 'Officer', 'Received', ''].map(h => (
                <th key={h} style={{ padding: '0.55rem 0.8rem', textAlign: 'left', fontSize: '0.67rem', fontWeight: 700, color: '#4d6080', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', backgroundColor: '#0c1322' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#4d6080', fontSize: '0.85rem' }}>
                Loading complaints...
              </td></tr>
            ) : complaints.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '2.5rem', textAlign: 'center', color: '#4d6080', fontSize: '0.85rem' }}>
                No complaints found.
              </td></tr>
            ) : complaints.map(c => (
              <tr key={c.complaint_id}
                style={{ borderBottom: '1px solid #0e1726', cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => onSelectComplaint(c)}>
                <td style={{ padding: '0.6rem 0.8rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>{c.complaint_id}</td>
                <td style={{ padding: '0.6rem 0.8rem' }}><PriorityBadge priority={c.priority} /></td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#e2e8f0', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.category}</td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{c.district}, {c.state}</td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#fbbf24', fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>{amtFmt(c.amount_inr)}</td>
                <td style={{ padding: '0.6rem 0.8rem' }}><StatusBadge status={c.status} /></td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#94a3b8', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.assigned_officer}</td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#4d6080', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>{timeFmt(c.timestamp)}</td>
                <td style={{ padding: '0.6rem 0.8rem' }}>
                  <button onClick={e => { e.stopPropagation(); onSelectComplaint(c); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', backgroundColor: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '4px', color: '#38bdf8', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', cursor: 'pointer' }}>
                    <Eye size={11} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div style={{ padding: '0.6rem 1.1rem', borderTop: '1px solid #17233d', display: 'flex', alignItems: 'center', justifyContent: 'space-system' }}>
          <span style={{ fontSize: '0.72rem', color: '#4d6080' }}>
            Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button disabled={offset === 0} onClick={() => handlePage(-1)}
              style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid #17233d', backgroundColor: 'transparent', color: offset === 0 ? '#2a3850' : '#94a3b8', cursor: offset === 0 ? 'not-allowed' : 'pointer', fontSize: '0.75rem' }}>
              ← Prev
            </button>
            <button disabled={offset + LIMIT >= total} onClick={() => handlePage(1)}
              style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid #17233d', backgroundColor: 'transparent', color: offset + LIMIT >= total ? '#2a3850' : '#94a3b8', cursor: offset + LIMIT >= total ? 'not-allowed' : 'pointer', fontSize: '0.75rem' }}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};