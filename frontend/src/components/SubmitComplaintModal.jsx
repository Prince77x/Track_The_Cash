import React, { useState } from 'react';
import { X, Send, AlertCircle, IndianRupee } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir'
];

const CATEGORIES = [
  'ATM Cash-Out Anomaly',
  'OTP Fraud',
  'Account Takeover',
  'Phishing Attack',
  'SIM Swap Fraud',
  'UPI Fraud',
  'Mule Account Activity',
  'Card Cloning',
  'Identity Theft',
];

export const SubmitComplaintModal = ({ onClose, onSuccess, getAuthHeader }) => {
  const [form, setForm] = useState({
    complainant_name: '',
    contact_phone: '',
    category: CATEGORIES[0],
    description: '',
    amount_inr: '',
    state: '',
    district: '',
    atm_id: '',
    transaction_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.state || !form.district || !form.amount_inr) {
      setError('State, District, and Amount are required.');
      return;
    }
    const amt = parseFloat(form.amount_inr);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          ...form,
          amount_inr: amt,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onSuccess?.(data);
      onClose();
    } catch (err) {
      setError('Submission failed. ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle = {
    backgroundColor: '#060d1e', border: '1px solid #17233d',
    borderRadius: '6px', color: '#f1f5f9', fontSize: '0.82rem',
    padding: '0.45rem 0.75rem', outline: 'none', width: '100%',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: '0.7rem', fontWeight: 700, color: '#4d6080',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    display: 'block', marginBottom: '0.3rem'
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9100,
      backgroundColor: 'rgba(0,0,0,0.82)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        backgroundColor: '#0c1322', border: '1px solid #17233d',
        borderRadius: '14px', width: '100%', maxWidth: '560px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.4rem', borderBottom: '1px solid #17233d',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9' }}>File New Complaint</div>
            <div style={{ fontSize: '0.7rem', color: '#4d6080' }}>NatGrid Cybercrime Ingestion — I4C Portal</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.2rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <div>
              <label style={labelStyle}>Complainant Name</label>
              <input value={form.complainant_name} onChange={e => set('complainant_name', e.target.value)}
                placeholder="Full name" style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contact Phone</label>
              <input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
                placeholder="+91 XXXXX XXXXX" style={fieldStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Complaint Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} style={fieldStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <div>
              <label style={labelStyle}>State *</label>
              <select value={form.state} onChange={e => set('state', e.target.value)} style={fieldStyle} required>
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>District *</label>
              <input value={form.district} onChange={e => set('district', e.target.value)}
                placeholder="District name" style={fieldStyle} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <div>
              <label style={labelStyle}>ATM ID (optional)</label>
              <input value={form.atm_id} onChange={e => set('atm_id', e.target.value)}
                placeholder="ATM-XX-..." style={{ ...fieldStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem' }} />
            </div>
            <div>
              <label style={labelStyle}>Transaction ID (optional)</label>
              <input value={form.transaction_id} onChange={e => set('transaction_id', e.target.value)}
                placeholder="TXN-2026-..." style={{ ...fieldStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem' }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Suspect Amount (₹ INR) *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#4d6080' }}>
                <IndianRupee size={14} />
              </span>
              <input type="number" min="1" value={form.amount_inr} onChange={e => set('amount_inr', e.target.value)}
                placeholder="0.00" required style={{ ...fieldStyle, paddingLeft: '2rem' }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Describe the suspicious activity in detail..." rows={3}
              style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5 }} />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171', fontSize: '0.8rem', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', paddingTop: '0.25rem' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '0.5rem 1.1rem', backgroundColor: 'transparent', border: '1px solid #17233d', borderRadius: '6px', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1.2rem', backgroundColor: '#0284c7', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
              <Send size={14} />
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
