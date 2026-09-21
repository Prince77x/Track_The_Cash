import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, AlertTriangle, FileText, CheckCircle2, Clock, Upload, Download,
  Search, Filter, Plus, ArrowRight, ArrowLeft, RefreshCw, Send, Star,
  Bell, Eye, Lock, PhoneCall, ExternalLink, HelpCircle, ChevronRight,
  UserCheck, AlertCircle, Info, FileSpreadsheet, Image as ImageIcon,
  Building2, CreditCard, DollarSign, Smartphone, MessageSquare, BookOpen,
  Award, Check, X, ShieldAlert, QrCode, Briefcase, MapPin, Hash, Printer
} from 'lucide-react';

export const CitizenView = () => {
  const location = useLocation();
  const { user, getAuthHeader } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return tab && ['overview', 'report', 'complaints', 'intel', 'guides', 'profile', 'notifications'].includes(tab) ? tab : 'overview';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['overview', 'report', 'complaints', 'intel', 'guides', 'profile', 'notifications'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [guides, setGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [intelReports, setIntelReports] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [ackModalData, setAckModalData] = useState(null);

  // Response / Message input state inside dossier
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // 7-Step Report Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [reportForm, setReportForm] = useState({
    crime_type: 'UPI Fraud',
    category: 'UPI QR Code Phishing',
    amount_inr: '',
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: '14:00',
    state: 'Maharashtra',
    district: 'Mumbai City',
    city: 'Mumbai',
    complainant_name: user?.full_name || 'Rohan Mehta',
    contact_phone: '+91 98765 43210',
    transaction_id: '',
    description: '',
    priority: 'HIGH',
    financial_details: {
      bank_name: '',
      account_number: '',
      utr_number: '',
      payment_channel: 'UPI / Google Pay'
    },
    suspect_details: {
      suspect_name: '',
      suspect_phone: '',
      suspect_upi: '',
      suspect_bank_acc: '',
      suspect_platform: 'WhatsApp / Call'
    }
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  // Suspicious Activity Intel Form
  const [intelForm, setIntelForm] = useState({
    report_type: 'phishing_url',
    identifier: '',
    description: '',
    target_bank: ''
  });
  const [intelSubmitting, setIntelSubmitting] = useState(false);
  const [intelSuccess, setIntelSuccess] = useState(null);

  // Profile Edit State
  const [profileEdit, setProfileEdit] = useState({
    full_name: '',
    phone: '',
    city: '',
    district: '',
    state: '',
    address: ''
  });
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Change Password State
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [pwUpdating, setPwUpdating] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  const fileInputRef = useRef(null);

  // Load Dashboard Data
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/citizen/dashboard', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error('Failed to load citizen dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  // Load Complaints List
  const loadComplaints = async () => {
    try {
      let url = `/citizen/complaints?`;
      if (statusFilter !== 'ALL') url += `status_filter=${statusFilter}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      const res = await fetch(url, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (e) {
      console.error('Failed to load complaints', e);
    }
  };

  // Load Guides
  const loadGuides = async () => {
    try {
      const res = await fetch('/citizen/safety-guides');
      if (res.ok) {
        const data = await res.json();
        setGuides(data);
      }
    } catch (e) {
      console.error('Failed to load guides', e);
    }
  };

  // Load Suspicious Activity Reports
  const loadIntelReports = async () => {
    try {
      const res = await fetch('/citizen/suspicious-activity', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setIntelReports(data);
      }
    } catch (e) {
      console.error('Failed to load intel reports', e);
    }
  };

  // Load Profile
  const loadProfile = async () => {
    try {
      const res = await fetch('/citizen/profile', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setProfileEdit({
          full_name: data.full_name || '',
          phone: data.phone || '',
          city: data.city || '',
          district: data.district || '',
          state: data.state || '',
          address: data.address || ''
        });
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadComplaints();
    loadGuides();
  }, []);

  useEffect(() => {
    if (activeTab === 'complaints') {
      loadComplaints();
    } else if (activeTab === 'intel') {
      loadIntelReports();
    } else if (activeTab === 'profile') {
      loadProfile();
    }
  }, [activeTab, statusFilter, searchQuery]);

  // Open Detailed Dossier
  const openComplaintDossier = async (complaintId) => {
    setDossierLoading(true);
    try {
      const res = await fetch(`/citizen/complaints/${complaintId}`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setSelectedDossier(data);
        setFeedbackSubmitted(!!data.feedback?.rating);
      }
    } catch (e) {
      console.error('Failed to open complaint dossier', e);
    } finally {
      setDossierLoading(false);
    }
  };

  // Send Communication Response
  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedDossier) return;
    setReplySubmitting(true);
    try {
      const res = await fetch(`/citizen/complaints/${selectedDossier.complaint_id}/updates`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CITIZEN_RESPONSE',
          message: replyMessage
        })
      });
      if (res.ok) {
        setReplyMessage('');
        // Refresh dossier
        await openComplaintDossier(selectedDossier.complaint_id);
      }
    } catch (e) {
      console.error('Failed to send reply', e);
    } finally {
      setReplySubmitting(false);
    }
  };

  // Handle Evidence Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedDossier) return;
    setUploadingEvidence(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/citizen/complaints/${selectedDossier.complaint_id}/evidence`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData
      });
      if (res.ok) {
        await openComplaintDossier(selectedDossier.complaint_id);
      }
    } catch (err) {
      console.error('Evidence upload failed', err);
    } finally {
      setUploadingEvidence(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Feedback Submission
  const handleFeedbackSubmit = async () => {
    if (!selectedDossier) return;
    try {
      const res = await fetch(`/citizen/complaints/${selectedDossier.complaint_id}/feedback`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment })
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
      }
    } catch (e) {
      console.error('Feedback submit failed', e);
    }
  };

  // Fetch Acknowledgement Receipt
  const handleViewAck = async (complaintId) => {
    try {
      const res = await fetch(`/citizen/complaints/${complaintId}/acknowledgement`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setAckModalData(data);
      }
    } catch (e) {
      console.error('Failed to fetch acknowledgement', e);
    }
  };

  // Handle 7-Step Report Submission
  const handleReportSubmit = async (isDraft = false) => {
    setFormSubmitting(true);
    try {
      const payload = {
        ...reportForm,
        amount_inr: parseFloat(reportForm.amount_inr) || 0,
        is_draft: isDraft
      };
      const res = await fetch('/citizen/complaints', {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissionSuccess(data);
        loadDashboard();
      }
    } catch (e) {
      console.error('Failed to submit report', e);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Suspicious Activity Report
  const handleIntelSubmit = async (e) => {
    e.preventDefault();
    setIntelSubmitting(true);
    try {
      const res = await fetch('/citizen/suspicious-activity', {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(intelForm)
      });
      if (res.ok) {
        const data = await res.json();
        setIntelSuccess(data);
        setIntelForm({ report_type: 'phishing_url', identifier: '', description: '', target_bank: '' });
        loadIntelReports();
      }
    } catch (e) {
      console.error('Failed to report suspicious activity', e);
    } finally {
      setIntelSubmitting(false);
    }
  };

  // Handle Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileUpdating(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/citizen/profile', {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(profileEdit)
      });
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
        loadProfile();
      } else {
        setProfileMsg({ type: 'error', text: 'Failed to update profile' });
      }
    } catch (e) {
      setProfileMsg({ type: 'error', text: 'Network error updating profile' });
    } finally {
      setProfileUpdating(false);
    }
  };

  // Handle Change Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setPwUpdating(true);
    setPwMsg(null);
    try {
      const res = await fetch('/citizen/change-password', {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: pwForm.old_password, new_password: pwForm.new_password })
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: 'success', text: 'Password changed successfully!' });
        setPwForm({ old_password: '', new_password: '', confirm_password: '' });
      } else {
        setPwMsg({ type: 'error', text: data.detail || 'Failed to change password' });
      }
    } catch (e) {
      setPwMsg({ type: 'error', text: 'Network error changing password' });
    } finally {
      setPwUpdating(false);
    }
  };

  const getStatusBadge = (status, isDraft) => {
    if (isDraft) {
      return (
        <span style={{
          backgroundColor: '#334155',
          color: '#94a3b8',
          border: '1px solid #475569',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          DRAFT
        </span>
      );
    }
    switch (status) {
      case 'NEW':
        return (
          <span style={{
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            color: '#60a5fa',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            LODGED
          </span>
        );
      case 'UNDER_INVESTIGATION':
        return (
          <span style={{
            backgroundColor: 'rgba(234, 179, 8, 0.15)',
            color: '#facc15',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            UNDER INVESTIGATION
          </span>
        );
      case 'EVIDENCE_REQUESTED':
      case 'ACTION_REQUIRED':
        return (
          <span style={{
            backgroundColor: 'rgba(249, 115, 22, 0.2)',
            color: '#fb923c',
            border: '1px solid rgba(249, 115, 22, 0.4)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <AlertTriangle size={12} />
            ACTION REQUIRED
          </span>
        );
      case 'RESOLVED':
        return (
          <span style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <CheckCircle2 size={12} />
            RESOLVED
          </span>
        );
      default:
        return (
          <span style={{
            backgroundColor: '#1e293b',
            color: '#cbd5e1',
            border: '1px solid #334155',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      backgroundColor: '#080b13',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.07) 0%, transparent 60%)',
      color: '#f1f5f9',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      paddingBottom: '3rem'
    }}>
      {/* 1. TOP CITIZEN BANNER */}
      <div style={{
        backgroundColor: '#0c1120',
        borderBottom: '1px solid #1c2436',
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                CITIZEN CYBERCRIME PROTECTION PORTAL
              </h1>
              <span style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '1px 7px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                I4C / MHA VERIFIED
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#7c8aa5', margin: '3px 0 0', fontFamily: 'JetBrains Mono, monospace' }}>
              Complainant: <span style={{ color: '#93c5fd', fontWeight: 700 }}>{user?.full_name || 'Rohan Mehta'}</span> • Citizen ID: <span style={{ color: '#00e5ff' }}>{user?.public_user_id || 'TTC-USER-00124'}</span>
            </p>
          </div>
        </div>

        {/* Emergency 1930 Helpline Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.2rem',
          backgroundColor: '#080d1a',
          border: '1px solid #1c2742',
          borderRadius: '8px',
          padding: '0.6rem 1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <PhoneCall size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#8896ab', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                National Cyber Helpline
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>
                DIAL 1930
              </div>
            </div>
          </div>

          <button
            onClick={() => { setWizardStep(1); setActiveTab('report'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.55rem 0.95rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}
          >
            <Plus size={15} />
            Report New Fraud
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION SUB-HEADER TABS */}
      <div style={{
        backgroundColor: '#0a0e19',
        borderBottom: '1px solid #1c2436',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: 'Overview & Actions', icon: Shield },
          { id: 'report', label: 'Report Incident (Wizard)', icon: Plus },
          { id: 'complaints', label: 'My Complaints & Dossier', icon: FileText },
          { id: 'intel', label: 'Report Suspicious Activity', icon: AlertTriangle },
          { id: 'guides', label: 'Cyber Safety & Guides', icon: BookOpen },
          { id: 'profile', label: 'My Profile & Security', icon: UserCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'transparent',
                color: isActive ? '#38bdf8' : '#7c8aa5',
                border: 'none',
                borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.75rem 2rem' }}>

        {/* TAB 1: OVERVIEW & ACTIONS */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              <div style={{
                backgroundColor: '#0c1120',
                border: '1px solid #1c2436',
                borderRadius: '10px',
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c8aa5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Total Incidents Filed
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', margin: '0.4rem 0', fontFamily: 'JetBrains Mono, monospace' }}>
                  {dashboardData?.metrics?.total_complaints ?? 3}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {dashboardData?.metrics?.drafts_count || 0} Draft(s) in progress
                </div>
              </div>

              <div style={{
                backgroundColor: '#0c1120',
                border: '1px solid #1c2436',
                borderRadius: '10px',
                padding: '1.25rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c8aa5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Active Investigations
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#38bdf8', margin: '0.4rem 0', fontFamily: 'JetBrains Mono, monospace' }}>
                  {dashboardData?.metrics?.active_cases ?? 2}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Assigned to Cyber Crime Cells
                </div>
              </div>

              <div style={{
                backgroundColor: '#0c1120',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                padding: '1.25rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Total Recovered / Frozen
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10b981', margin: '0.4rem 0', fontFamily: 'JetBrains Mono, monospace' }}>
                  ₹{(dashboardData?.metrics?.total_frozen_inr || 230000).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
                  Lien placed on suspect mule accounts
                </div>
              </div>

              <div style={{
                backgroundColor: '#0c1120',
                border: dashboardData?.metrics?.pending_actions > 0 ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid #1c2436',
                borderRadius: '10px',
                padding: '1.25rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Pending Complainant Actions
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f97316', margin: '0.4rem 0', fontFamily: 'JetBrains Mono, monospace' }}>
                  {dashboardData?.metrics?.pending_actions ?? 1}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#fb923c' }}>
                  Evidence / Info requested by Officer
                </div>
              </div>
            </div>

            {/* Quick Action / Alert Notice */}
            {dashboardData?.metrics?.pending_actions > 0 && (
              <div style={{
                backgroundColor: 'rgba(249, 115, 22, 0.08)',
                border: '1px solid rgba(249, 115, 22, 0.35)',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                marginBottom: '1.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <AlertCircle size={22} color="#fb923c" />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fed7aa' }}>
                      Investigating Officer has requested additional evidence for your case
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                      Please upload the stamped bank statement or chat logs so the Cyber Crime Unit can file Sec 91 CrPC notice.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveTab('complaints'); setStatusFilter('EVIDENCE_REQUESTED'); }}
                  style={{
                    backgroundColor: '#ea580c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 0.9rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View & Respond
                </button>
              </div>
            )}

            {/* 2-Column Split: Recent Cases vs Live Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
              {/* Left Column: Recent Complaints */}
              <div style={{
                backgroundColor: '#0c1120',
                border: '1px solid #1c2436',
                borderRadius: '12px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f1f5f9' }}>
                    My Incident Reports
                  </h3>
                  <button
                    onClick={() => setActiveTab('complaints')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    View All <ChevronRight size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(dashboardData?.recent_complaints || []).map((c) => (
                    <div
                      key={c.complaint_id}
                      style={{
                        backgroundColor: '#080d1a',
                        border: '1px solid #1c2436',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                            {c.public_complaint_id}
                          </span>
                          {getStatusBadge(c.status, c.is_draft)}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                          {c.crime_type} • ₹{(c.amount_inr || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                          Assigned: {c.assigned_officer || 'Cyber Cell Triage'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => { openComplaintDossier(c.complaint_id); setActiveTab('complaints'); }}
                          style={{
                            backgroundColor: '#1e293b',
                            color: '#38bdf8',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          View Dossier
                        </button>
                        {!c.is_draft && (
                          <button
                            onClick={() => handleViewAck(c.complaint_id)}
                            title="Download Official Receipt"
                            style={{
                              backgroundColor: '#0f172a',
                              color: '#cbd5e1',
                              border: '1px solid #1e293b',
                              borderRadius: '6px',
                              padding: '0.4rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Download size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Case Alerts & Notifications */}
              <div style={{
                backgroundColor: '#0c1120',
                border: '1px solid #1c2436',
                borderRadius: '12px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Bell size={16} color="#38bdf8" /> Case Notifications & Alerts
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        backgroundColor: '#080d1a',
                        border: n.type === 'ACTION_REQUIRED' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid #1c2436',
                        borderRadius: '8px',
                        padding: '0.85rem'
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: n.type === 'ACTION_REQUIRED' ? '#fb923c' : '#7dd3fc', marginBottom: '0.2rem' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.4rem', fontFamily: 'JetBrains Mono, monospace' }}>
                        {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REPORT INCIDENT (7-STEP WIZARD) */}
        {activeTab === 'report' && (
          <div style={{
            backgroundColor: '#0c1120',
            border: '1px solid #1c2436',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {/* Wizard Step Progression Bar */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
                  STEP {wizardStep} OF 7: {[
                    'Fraud Classification',
                    'Financial Transaction',
                    'Suspect Profile',
                    'Date & Jurisdiction',
                    'Incident Description',
                    'Evidence & Files',
                    'Statutory Confirmation'
                  ][wizardStep - 1]}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {Math.round((wizardStep / 7) * 100)}% Completed
                </span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(wizardStep / 7) * 100}%`,
                  background: 'linear-gradient(90deg, #3b82f6 0%, #00e5ff 100%)',
                  transition: 'width 0.25s ease'
                }} />
              </div>
            </div>

            {submissionSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: '#10b981'
                }}>
                  <CheckCircle2 size={36} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#f8fafc' }}>
                  Complaint Lodged Successfully!
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 1.5rem' }}>
                  Your case has been recorded on the National Cyber Crime Network.
                </p>
                <div style={{
                  backgroundColor: '#080d1a',
                  border: '1px solid #1c2436',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  display: 'inline-block',
                  marginBottom: '1.5rem',
                  fontFamily: 'JetBrains Mono, monospace'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>OFFICIAL PUBLIC ACKNOWLEDGEMENT ID</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00e5ff', marginTop: '0.2rem' }}>
                    {submissionSuccess.public_complaint_id}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                  <button
                    onClick={() => {
                      handleViewAck(submissionSuccess.complaint_id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Printer size={16} /> View Official Acknowledgement Slip
                  </button>
                  <button
                    onClick={() => {
                      setSubmissionSuccess(null);
                      setWizardStep(1);
                      setActiveTab('complaints');
                    }}
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#cbd5e1',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Track in My Complaints
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* STEP 1: Fraud Classification */}
                {wizardStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      Select Cyber Fraud Category
                    </h3>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                        Primary Crime Classification
                      </label>
                      <select
                        value={reportForm.crime_type}
                        onChange={(e) => setReportForm({ ...reportForm, crime_type: e.target.value })}
                        style={{
                          width: '100%',
                          backgroundColor: '#080d1a',
                          border: '1px solid #232d44',
                          color: '#f8fafc',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="UPI Fraud">UPI / QR Code / Payment Gateway Fraud</option>
                        <option value="Digital Arrest / Extortion">Digital Arrest / Fake Police / CBI Video Extortion</option>
                        <option value="Job / Telegram Scam">Part-time Job / YouTube Like / Telegram Task Scam</option>
                        <option value="ATM Withdrawal Fraud">ATM Cash-out / Card Skimming / Unauthorized ATM Debit</option>
                        <option value="Investment / Crypto Scam">Fake Trading App / High-Yield Crypto Investment</option>
                        <option value="Malicious APK / SMS Phishing">Electricity Bill / Bank KYC Malicious APK SMS</option>
                        <option value="Identity Theft / SIM Swap">SIM Swap / Aadhaar Loan Identity Misuse</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                        Sub-Category Specification
                      </label>
                      <input
                        type="text"
                        value={reportForm.category}
                        onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                        placeholder="e.g. OLX QR code collect request, Fake FedEx courier call"
                        style={{
                          width: '100%',
                          backgroundColor: '#080d1a',
                          border: '1px solid #232d44',
                          color: '#f8fafc',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: Financial Details */}
                {wizardStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      Financial & Transaction Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                          Total Financial Loss (INR ₹) *
                        </label>
                        <input
                          type="number"
                          value={reportForm.amount_inr}
                          onChange={(e) => setReportForm({ ...reportForm, amount_inr: e.target.value })}
                          placeholder="85000"
                          required
                          style={{
                            width: '100%',
                            backgroundColor: '#080d1a',
                            border: '1px solid #232d44',
                            color: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 700,
                            fontFamily: 'JetBrains Mono, monospace'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                          Victim Bank / Debit Card Issuer
                        </label>
                        <input
                          type="text"
                          value={reportForm.financial_details.bank_name}
                          onChange={(e) => setReportForm({
                            ...reportForm,
                            financial_details: { ...reportForm.financial_details, bank_name: e.target.value }
                          })}
                          placeholder="e.g. HDFC Bank, SBI, ICICI"
                          style={{
                            width: '100%',
                            backgroundColor: '#080d1a',
                            border: '1px solid #232d44',
                            color: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                          12-Digit UTR / Transaction Reference ID
                        </label>
                        <input
                          type="text"
                          value={reportForm.transaction_id}
                          onChange={(e) => setReportForm({ ...reportForm, transaction_id: e.target.value })}
                          placeholder="e.g. 409283749201"
                          style={{
                            width: '100%',
                            backgroundColor: '#080d1a',
                            border: '1px solid #232d44',
                            color: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontFamily: 'JetBrains Mono, monospace'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                          Payment Mode
                        </label>
                        <select
                          value={reportForm.financial_details.payment_channel}
                          onChange={(e) => setReportForm({
                            ...reportForm,
                            financial_details: { ...reportForm.financial_details, payment_channel: e.target.value }
                          })}
                          style={{
                            width: '100%',
                            backgroundColor: '#080d1a',
                            border: '1px solid #232d44',
                            color: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                          }}
                        >
                          <option value="UPI / Google Pay / PhonePe">UPI / Google Pay / PhonePe</option>
                          <option value="IMPS / Netbanking">IMPS / Netbanking</option>
                          <option value="Debit Card / ATM Cash-out">Debit Card / ATM Cash-out</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Crypto Transfer">Crypto / USDT Transfer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Suspect Profile */}
                {wizardStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      Suspect / Fraudster Details (If known)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                          Suspect Contact Number / WhatsApp
                        </label>
                        <input
                          type="text"
                          value={reportForm.suspect_details.suspect_phone}
                          onChange={(e) => setReportForm({
                            ...reportForm,
                            suspect_details: { ...reportForm.suspect_details, suspect_phone: e.target.value }
                          })}
                          placeholder="+91 98XXX XXXXX"
                          style={{
                            width: '100%',
                            backgroundColor: '#080d1a',
                            border: '1px solid #232d44',
                            color: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                          Suspect UPI ID / Mule VPA
                        </label>
                        <input
                          type="text"
                          value={reportForm.suspect_details.suspect_upi}
                          onChange={(e) => setReportForm({
                            ...reportForm,
                            suspect_details: { ...reportForm.suspect_details, suspect_upi: e.target.value }
                          })}
                          placeholder="e.g. tradesmart88@okaxis"
                          style={{
                            width: '100%',
                            backgroundColor: '#080d1a',
                            border: '1px solid #232d44',
                            color: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                          Suspect Bank Account (Mule Account)
                        </label>
                        <input
                          type="text"
                          value={reportForm.suspect_details.suspect_bank_acc}
                          onChange={(e) => setReportForm({
                            ...reportForm,
                            suspect_details: { ...reportForm.suspect_details, suspect_bank_acc: e.target.value }
                          })}
                          placeholder="e.g. IndusInd Bank - 201004928192"
                          style={{
                            width: '100%',
                            backgroundColor: '#080d1a',
                            border: '1px solid #232d44',
                            color: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                          Platform Used by Scammer
                        </label>
                        <input
                          type="text"
                          value={reportForm.suspect_details.suspect_platform}
                          onChange={(e) => setReportForm({
                            ...reportForm,
                            suspect_details: { ...reportForm.suspect_details, suspect_platform: e.target.value }
                          })}
                          placeholder="e.g. WhatsApp, Skype, Telegram, OLX"
                          style={{
                            width: '100%',
                            backgroundColor: '#080d1a',
                            border: '1px solid #232d44',
                            color: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Date & Jurisdiction */}
                {wizardStep === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      Incident Date & Jurisdiction
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                          Incident Date
                        </label>
                        <input
                          type="date"
                          value={reportForm.incident_date}
                          onChange={(e) => setReportForm({ ...reportForm, incident_date: e.target.value })}
                          style={{
                            width: '100%',
                            backgroundColor: '#080d1a',
                            border: '1px solid #232d44',
                            color: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                          Approximate Time
                        </label>
                        <input
                          type="time"
                          value={reportForm.incident_time}
                          onChange={(e) => setReportForm({ ...reportForm, incident_time: e.target.value })}
                          style={{
                            width: '100%',
                            backgroundColor: '#080d1a',
                            border: '1px solid #232d44',
                            color: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                          State
                        </label>
                        <input
                          type="text"
                          value={reportForm.state}
                          onChange={(e) => setReportForm({ ...reportForm, state: e.target.value })}
                          placeholder="Maharashtra"
                          style={{
                            width: '100%',
                            backgroundColor: '#080d1a',
                            border: '1px solid #232d44',
                            color: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                          District / Jurisdiction
                        </label>
                        <input
                          type="text"
                          value={reportForm.district}
                          onChange={(e) => setReportForm({ ...reportForm, district: e.target.value })}
                          placeholder="Mumbai City"
                          style={{
                            width: '100%',
                            backgroundColor: '#080d1a',
                            border: '1px solid #232d44',
                            color: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                          City / Locality
                        </label>
                        <input
                          type="text"
                          value={reportForm.city}
                          onChange={(e) => setReportForm({ ...reportForm, city: e.target.value })}
                          placeholder="Bandra West, Mumbai"
                          style={{
                            width: '100%',
                            backgroundColor: '#080d1a',
                            border: '1px solid #232d44',
                            color: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: Incident Description */}
                {wizardStep === 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      Detailed Incident Narrative
                    </h3>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                        Provide exact sequence of events, modus operandi, and interactions with the fraudster:
                      </label>
                      <textarea
                        rows={6}
                        value={reportForm.description}
                        onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                        placeholder="State clearly what happened: who contacted you, what claim was made, links clicked, OTPs requested, and payment transfers done..."
                        style={{
                          width: '100%',
                          backgroundColor: '#080d1a',
                          border: '1px solid #232d44',
                          color: '#f8fafc',
                          padding: '0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          lineHeight: '1.5'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 6: Evidence & Document Upload Notice */}
                {wizardStep === 6 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      Evidence & Digital Proofs
                    </h3>
                    <div style={{
                      border: '2px dashed #232d44',
                      borderRadius: '10px',
                      padding: '2rem',
                      textAlign: 'center',
                      backgroundColor: '#080d1a'
                    }}>
                      <Upload size={36} color="#38bdf8" style={{ margin: '0 auto 0.75rem' }} />
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>
                        Evidence Vault Integration
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '450px', margin: '0.4rem auto 0' }}>
                        You can immediately attach bank receipts, WhatsApp chat screenshots, call recordings, or malicious APKs after finalizing the incident record in the next step.
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 7: Statutory Confirmation */}
                {wizardStep === 7 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      Statutory Review & Submission
                    </h3>
                    <div style={{
                      backgroundColor: '#080d1a',
                      border: '1px solid #1c2436',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div><strong>Crime Category:</strong> {reportForm.crime_type}</div>
                        <div><strong>Claimed Loss:</strong> ₹{parseFloat(reportForm.amount_inr || 0).toLocaleString('en-IN')}</div>
                        <div><strong>Complainant:</strong> {reportForm.complainant_name}</div>
                        <div><strong>Contact:</strong> {reportForm.contact_phone}</div>
                        <div><strong>Jurisdiction:</strong> {reportForm.district}, {reportForm.state}</div>
                        <div><strong>Transaction ID:</strong> {reportForm.transaction_id || 'N/A'}</div>
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      padding: '1rem',
                      fontSize: '0.78rem',
                      color: '#93c5fd',
                      lineHeight: '1.5'
                    }}>
                      <strong>Statutory Declaration:</strong> I hereby declare that the facts stated above are true to the best of my knowledge and belief. I understand that filing a false cyber incident report is a punishable offense under Section 182/211 IPC / BNSS and the IT Act 2000.
                    </div>
                  </div>
                )}

                {/* Step Controls Buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '2rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid #1c2436'
                }}>
                  {wizardStep > 1 ? (
                    <button
                      onClick={() => setWizardStep(wizardStep - 1)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: '#1e293b',
                        color: '#cbd5e1',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '0.65rem 1.1rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                  ) : <div />}

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleReportSubmit(true)}
                      disabled={formSubmitting}
                      style={{
                        backgroundColor: '#0f172a',
                        color: '#94a3b8',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '0.65rem 1.1rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Save as Draft
                    </button>

                    {wizardStep < 7 ? (
                      <button
                        onClick={() => setWizardStep(wizardStep + 1)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.65rem 1.25rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Next Step <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReportSubmit(false)}
                        disabled={formSubmitting}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.65rem 1.4rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: formSubmitting ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                        }}
                      >
                        {formSubmitting ? 'Lodging Report...' : 'Lodge Cyber Complaint'}
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY COMPLAINTS & DOSSIER */}
        {activeTab === 'complaints' && (
          <div>
            {/* Filter & Search Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['ALL', 'NEW', 'UNDER_INVESTIGATION', 'EVIDENCE_REQUESTED', 'RESOLVED', 'DRAFTS'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: statusFilter === st ? '1px solid #38bdf8' : '1px solid #1c2436',
                      backgroundColor: statusFilter === st ? 'rgba(56, 189, 248, 0.15)' : '#0c1120',
                      color: statusFilter === st ? '#38bdf8' : '#7c8aa5',
                      cursor: 'pointer'
                    }}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#0c1120',
                border: '1px solid #1c2436',
                borderRadius: '8px',
                padding: '0.4rem 0.75rem',
                gap: '0.5rem',
                minWidth: '260px'
              }}>
                <Search size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search Public ID, UTR, crime type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {/* Complaints Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
              {complaints.map((c) => (
                <div
                  key={c.complaint_id}
                  style={{
                    backgroundColor: '#0c1120',
                    border: '1px solid #1c2436',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                        {c.public_complaint_id || 'DRAFT INCIDENT'}
                      </span>
                      {getStatusBadge(c.status, c.is_draft)}
                    </div>

                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.4rem' }}>
                      {c.crime_type}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4', marginBottom: '0.6rem' }}>
                      {c.description?.slice(0, 100)}...
                    </div>

                    <div style={{
                      backgroundColor: '#080d1a',
                      borderRadius: '6px',
                      padding: '0.6rem 0.8rem',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.4rem',
                      fontSize: '0.75rem',
                      color: '#cbd5e1'
                    }}>
                      <div>Loss: <strong style={{ color: '#f87171' }}>₹{(c.amount_inr || 0).toLocaleString('en-IN')}</strong></div>
                      <div>Date: {c.incident_date || 'Recent'}</div>
                      <div>City: {c.city || c.district}</div>
                      <div>Updates: {c.public_updates_count || 0} event(s)</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #1c2436', paddingTop: '0.75rem' }}>
                    <button
                      onClick={() => openComplaintDossier(c.complaint_id)}
                      style={{
                        flex: 1,
                        backgroundColor: '#1d3fb8',
                        color: '#e0e9ff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.55rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Open Case Dossier
                    </button>
                    {!c.is_draft && (
                      <button
                        onClick={() => handleViewAck(c.complaint_id)}
                        title="Download Statutory Acknowledgement Slip"
                        style={{
                          backgroundColor: '#1e293b',
                          color: '#38bdf8',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          padding: '0.55rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Printer size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: REPORT SUSPICIOUS ACTIVITY (INTEL TIP-OFF) */}
        {activeTab === 'intel' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
            <div style={{
              backgroundColor: '#0c1120',
              border: '1px solid #1c2436',
              borderRadius: '12px',
              padding: '1.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <ShieldAlert size={22} color="#f59e0b" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                  Report Suspicious Cyber Activity / Scam Lead
                </h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Help national cyber defense by submitting malicious phishing links, fake banking APKs, mule bank accounts, or extortion callers before anyone loses money.
              </p>

              {intelSuccess && (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  color: '#34d399',
                  fontSize: '0.85rem'
                }}>
                  <CheckCircle2 size={18} />
                  <span>Intel report recorded with Reference ID: <strong>{intelSuccess.reference_id}</strong>. Thank you for securing the cyber ecosystem!</span>
                </div>
              )}

              <form onSubmit={handleIntelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Activity / Indicator Type
                  </label>
                  <select
                    value={intelForm.report_type}
                    onChange={(e) => setIntelForm({ ...intelForm, report_type: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#080d1a',
                      border: '1px solid #232d44',
                      color: '#f8fafc',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="phishing_url">Phishing Website / Fake Bank Portal Link</option>
                    <option value="fake_apk">Malicious Android APK File</option>
                    <option value="scam_phone">Extortion Caller / Scam WhatsApp Phone Number</option>
                    <option value="mule_upi">Suspicious Mule UPI ID / QR Code</option>
                    <option value="telegram_channel">Fraudulent Telegram Job / Investment Channel</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Suspicious Identifier (URL / Phone / Handle / Account) *
                  </label>
                  <input
                    type="text"
                    required
                    value={intelForm.identifier}
                    onChange={(e) => setIntelForm({ ...intelForm, identifier: e.target.value })}
                    placeholder="e.g. https://sbi-reward-claim.xyz or +91 99887 76655"
                    style={{
                      width: '100%',
                      backgroundColor: '#080d1a',
                      border: '1px solid #232d44',
                      color: '#f8fafc',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Context / Modus Description
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={intelForm.description}
                    onChange={(e) => setIntelForm({ ...intelForm, description: e.target.value })}
                    placeholder="Describe where you saw this, what SMS was sent, or what fake promise was offered..."
                    style={{
                      width: '100%',
                      backgroundColor: '#080d1a',
                      border: '1px solid #232d44',
                      color: '#f8fafc',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      lineHeight: '1.4'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={intelSubmitting}
                  style={{
                    backgroundColor: '#d97706',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: intelSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {intelSubmitting ? 'Transmitting Threat Intel...' : 'Submit Threat Intelligence'}
                </button>
              </form>
            </div>

            {/* Submitted Intel Log */}
            <div style={{
              backgroundColor: '#0c1120',
              border: '1px solid #1c2436',
              borderRadius: '12px',
              padding: '1.75rem'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem', color: '#f8fafc' }}>
                My Submitted Tip-Offs
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {intelReports.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No threat tips submitted yet.</div>
                ) : (
                  intelReports.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        backgroundColor: '#080d1a',
                        border: '1px solid #1c2436',
                        borderRadius: '8px',
                        padding: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
                          {r.reference_id}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                          {r.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#f1f5f9', fontWeight: 600 }}>
                        {r.identifier}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        {r.description}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CYBER SAFETY & GUIDES */}
        {activeTab === 'guides' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                National Cyber Safety Knowledge Base
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#7c8aa5', margin: '4px 0 0' }}>
                Verified safety protocols, scam indicators, and immediate golden-hour actions.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {guides.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setSelectedGuide(g)}
                  style={{
                    backgroundColor: '#0c1120',
                    border: '1px solid #1c2436',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      marginBottom: '0.75rem',
                      textTransform: 'uppercase'
                    }}>
                      {g.category}
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#f8fafc' }}>
                      {g.title}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>
                      {g.summary}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #1c2436',
                    paddingTop: '0.75rem',
                    marginTop: '1rem',
                    fontSize: '0.75rem',
                    color: '#38bdf8',
                    fontWeight: 600
                  }}>
                    <span>Read Prevention Guide</span>
                    <ChevronRight size={15} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: MY PROFILE & SECURITY */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Edit Profile Information */}
            <div style={{
              backgroundColor: '#0c1120',
              border: '1px solid #1c2436',
              borderRadius: '12px',
              padding: '1.75rem'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem', color: '#f8fafc' }}>
                Complainant Identity Details
              </h3>

              {profileMsg && (
                <div style={{
                  backgroundColor: profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.82rem',
                  color: profileMsg.type === 'success' ? '#34d399' : '#f87171'
                }}>
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={profileEdit.full_name}
                    onChange={(e) => setProfileEdit({ ...profileEdit, full_name: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#080d1a',
                      border: '1px solid #232d44',
                      color: '#f8fafc',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Primary Phone
                    </label>
                    <input
                      type="text"
                      value={profileEdit.phone}
                      onChange={(e) => setProfileEdit({ ...profileEdit, phone: e.target.value })}
                      style={{
                        width: '100%',
                        backgroundColor: '#080d1a',
                        border: '1px solid #232d44',
                        color: '#f8fafc',
                        padding: '0.7rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      City
                    </label>
                    <input
                      type="text"
                      value={profileEdit.city}
                      onChange={(e) => setProfileEdit({ ...profileEdit, city: e.target.value })}
                      style={{
                        width: '100%',
                        backgroundColor: '#080d1a',
                        border: '1px solid #232d44',
                        color: '#f8fafc',
                        padding: '0.7rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      District
                    </label>
                    <input
                      type="text"
                      value={profileEdit.district}
                      onChange={(e) => setProfileEdit({ ...profileEdit, district: e.target.value })}
                      style={{
                        width: '100%',
                        backgroundColor: '#080d1a',
                        border: '1px solid #232d44',
                        color: '#f8fafc',
                        padding: '0.7rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      State
                    </label>
                    <input
                      type="text"
                      value={profileEdit.state}
                      onChange={(e) => setProfileEdit({ ...profileEdit, state: e.target.value })}
                      style={{
                        width: '100%',
                        backgroundColor: '#080d1a',
                        border: '1px solid #232d44',
                        color: '#f8fafc',
                        padding: '0.7rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={profileEdit.address}
                    onChange={(e) => setProfileEdit({ ...profileEdit, address: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#080d1a',
                      border: '1px solid #232d44',
                      color: '#f8fafc',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileUpdating}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: profileUpdating ? 'not-allowed' : 'pointer',
                    marginTop: '0.5rem'
                  }}
                >
                  {profileUpdating ? 'Saving Profile...' : 'Update Details'}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div style={{
              backgroundColor: '#0c1120',
              border: '1px solid #1c2436',
              borderRadius: '12px',
              padding: '1.75rem'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem', color: '#f8fafc' }}>
                Security & Passphrase
              </h3>

              {pwMsg && (
                <div style={{
                  backgroundColor: pwMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${pwMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.82rem',
                  color: pwMsg.type === 'success' ? '#34d399' : '#f87171'
                }}>
                  {pwMsg.text}
                </div>
              )}

              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={pwForm.old_password}
                    onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#080d1a',
                      border: '1px solid #232d44',
                      color: '#f8fafc',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    New Passphrase
                  </label>
                  <input
                    type="password"
                    required
                    value={pwForm.new_password}
                    onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#080d1a',
                      border: '1px solid #232d44',
                      color: '#f8fafc',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Confirm New Passphrase
                  </label>
                  <input
                    type="password"
                    required
                    value={pwForm.confirm_password}
                    onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#080d1a',
                      border: '1px solid #232d44',
                      color: '#f8fafc',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwUpdating}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: pwUpdating ? 'not-allowed' : 'pointer',
                    marginTop: '0.5rem'
                  }}
                >
                  {pwUpdating ? 'Updating...' : 'Change Passphrase'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* 3. CASE DOSSIER FULL MODAL */}
      {selectedDossier && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            backgroundColor: '#0c1120',
            border: '1px solid #1c2436',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#080d1a',
              borderBottom: '1px solid #1c2436',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00e5ff', fontFamily: 'JetBrains Mono, monospace' }}>
                    {selectedDossier.public_complaint_id}
                  </span>
                  {getStatusBadge(selectedDossier.status, selectedDossier.is_draft)}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#7c8aa5', marginTop: '2px' }}>
                  Filed on {selectedDossier.timestamp ? new Date(selectedDossier.timestamp).toLocaleDateString() : 'N/A'} • Investigating Officer: <strong style={{ color: '#93c5fd' }}>{selectedDossier.assigned_officer}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={() => handleViewAck(selectedDossier.complaint_id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={14} /> Receipt
                </button>
                <button
                  onClick={() => setSelectedDossier(null)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.4rem'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Incident Summary Card */}
              <div style={{
                backgroundColor: '#080d1a',
                border: '1px solid #1c2436',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                fontSize: '0.85rem'
              }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem' }}>CRIME CLASSIFICATION</div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>{selectedDossier.crime_type}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem' }}>REPORTED FINANCIAL LOSS</div>
                  <div style={{ fontWeight: 800, color: '#f87171', marginTop: '2px' }}>₹{(selectedDossier.amount_inr || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem' }}>FROZEN / LIEN MARKED</div>
                  <div style={{ fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                    ₹{(selectedDossier.financial_details?.frozen_amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem' }}>TRANSACTION REFERENCE (UTR)</div>
                  <div style={{ fontWeight: 700, color: '#cbd5e1', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                    {selectedDossier.transaction_id || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Modus Operandi & Narrative */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7c8aa5', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Incident Description
                </h4>
                <div style={{
                  backgroundColor: '#080d1a',
                  border: '1px solid #1c2436',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  color: '#cbd5e1'
                }}>
                  {selectedDossier.description}
                </div>
              </div>

              {/* Public Investigation Timeline */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7c8aa5', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Investigation Milestones & Public Updates
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {(selectedDossier.public_updates || []).map((u, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: '#080d1a',
                        borderLeft: '3px solid #3b82f6',
                        borderRadius: '0 6px 6px 0',
                        padding: '0.75rem 1rem',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ color: '#93c5fd' }}>{u.author}</strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                          {u.timestamp ? new Date(u.timestamp).toLocaleString() : ''}
                        </span>
                      </div>
                      <div style={{ color: '#cbd5e1' }}>{u.message}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Vault */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7c8aa5', textTransform: 'uppercase', margin: 0 }}>
                    Evidence Vault & Attachments ({selectedDossier.evidence_files?.length || 0})
                  </h4>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingEvidence}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Upload size={14} />
                      {uploadingEvidence ? 'Uploading...' : 'Upload Evidence File'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                  {(selectedDossier.evidence_files || []).map((ef) => (
                    <div
                      key={ef.id}
                      style={{
                        backgroundColor: '#080d1a',
                        border: '1px solid #1c2436',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                        <FileText size={20} color="#38bdf8" />
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {ef.original_filename}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            {(ef.file_size / 1024).toFixed(1)} KB • {ef.uploaded_by}
                          </div>
                        </div>
                      </div>
                      <a
                        href={`/citizen/complaints/${selectedDossier.complaint_id}/evidence/${ef.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: '#1e293b',
                          color: '#38bdf8',
                          padding: '0.35rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          textDecoration: 'none',
                          fontWeight: 700
                        }}
                      >
                        <Download size={13} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Two-Way Officer Communication Thread */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7c8aa5', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Two-Way Communication with Investigating Officer
                </h4>
                <div style={{
                  backgroundColor: '#080d1a',
                  border: '1px solid #1c2436',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {(selectedDossier.updates || []).map((up) => (
                    <div
                      key={up.id}
                      style={{
                        backgroundColor: up.sender_role === 'lea' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        border: `1px solid ${up.sender_role === 'lea' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        borderRadius: '8px',
                        padding: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <strong style={{ fontSize: '0.8rem', color: up.sender_role === 'lea' ? '#60a5fa' : '#34d399' }}>
                          {up.sender_name} ({up.sender_role.toUpperCase()})
                        </strong>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          {up.created_at ? new Date(up.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#f1f5f9', lineHeight: '1.4' }}>
                        {up.message}
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your response or additional information for the officer..."
                      style={{
                        flex: 1,
                        backgroundColor: '#040711',
                        border: '1px solid #232d44',
                        color: '#f8fafc',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem'
                      }}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={replySubmitting || !replyMessage.trim()}
                      style={{
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.65rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: replySubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Send size={15} /> Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Feedback Section if Resolved */}
              {selectedDossier.status === 'RESOLVED' && (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '1.25rem'
                }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', margin: '0 0 0.5rem' }}>
                    Complainant Satisfaction & Resolution Feedback
                  </h4>
                  {feedbackSubmitted ? (
                    <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                      Thank you! Your rating and feedback have been recorded for the Cyber Cell performance review.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Rate investigation experience:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={20}
                            fill={star <= feedbackRating ? '#facc15' : 'transparent'}
                            color={star <= feedbackRating ? '#facc15' : '#64748b'}
                            onClick={() => setFeedbackRating(star)}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Add review or feedback comments..."
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        style={{
                          backgroundColor: '#080d1a',
                          border: '1px solid #232d44',
                          color: '#f8fafc',
                          padding: '0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.85rem'
                        }}
                      />
                      <button
                        onClick={handleFeedbackSubmit}
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.5rem 1rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Submit Review
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. STATUTORY ACKNOWLEDGEMENT RECEIPT MODAL */}
      {ackModalData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '650px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            borderRadius: '8px',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
            fontFamily: 'Inter, sans-serif'
          }}>
            <button
              onClick={() => setAckModalData(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={22} />
            </button>

            {/* Receipt Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em', color: '#1e293b' }}>
                GOVERNMENT OF INDIA • MINISTRY OF HOME AFFAIRS / I4C
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0.3rem 0', color: '#0f172a' }}>
                CYBER INCIDENT ACKNOWLEDGEMENT RECEIPT
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                Generated pursuant to IT Act 2000 & BNSS Directives
              </div>
            </div>

            {/* Receipt Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>PUBLIC REFERENCE NO.</span>
                <strong style={{ fontSize: '1rem', color: '#0369a1', fontFamily: 'monospace' }}>
                  {ackModalData.acknowledgement_no}
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>FILING DATE & TIME</span>
                <strong>{ackModalData.filing_timestamp ? new Date(ackModalData.filing_timestamp).toLocaleString() : 'Recent'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>COMPLAINANT</span>
                <strong>{ackModalData.complainant?.name}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>CONTACT</span>
                <strong>{ackModalData.complainant?.phone}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>CRIME TYPE</span>
                <strong>{ackModalData.incident?.crime_type}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>CLAIMED LOSS</span>
                <strong style={{ color: '#b91c1c' }}>₹{(ackModalData.incident?.amount_claimed_inr || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>INVESTIGATING UNIT</span>
                <strong>{ackModalData.assigned_jurisdiction?.police_unit}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>TRANSACTION / UTR</span>
                <strong style={{ fontFamily: 'monospace' }}>{ackModalData.incident?.transaction_id || 'N/A'}</strong>
              </div>
            </div>

            {/* QR / Verification Code Block */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                  DIGITAL VERIFICATION HASH
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                  {ackModalData.qr_verification_code}
                </div>
              </div>
              <QrCode size={40} color="#0f172a" />
            </div>

            <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: '1.4', marginBottom: '1.25rem' }}>
              {ackModalData.statutory_notice}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.6rem 1.2rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Printer size={15} /> Print Official Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. GUIDE DETAIL MODAL */}
      {selectedGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '700px',
            backgroundColor: '#0c1120',
            border: '1px solid #1c2436',
            borderRadius: '12px',
            padding: '2rem',
            position: 'relative',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setSelectedGuide(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8'
              }}
            >
              <X size={22} />
            </button>

            <div style={{
              display: 'inline-block',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              marginBottom: '0.75rem'
            }}>
              {selectedGuide.category}
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 1rem', color: '#f8fafc' }}>
              {selectedGuide.title}
            </h2>

            <div style={{
              fontSize: '0.88rem',
              color: '#cbd5e1',
              lineHeight: '1.6',
              whiteSpace: 'pre-line'
            }}>
              {selectedGuide.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenView;
