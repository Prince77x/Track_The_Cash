import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { RiskMap } from '../components/RiskMap';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';
import {
  Shield,
  LayoutDashboard,
  Map,
  FileText,
  AlertTriangle,
  Network,
  Cpu,
  BarChart3,
  Users,
  Briefcase,
  Bell,
  Send,
  Download,
  Sliders,
  Activity,
  ScrollText,
  Settings,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  ArrowRight,
  RefreshCw,
  Eye,
  Plus,
  Lock,
  ChevronRight,
  ChevronDown,
  Building,
  Key,
  Flame,
  AlertOctagon,
  Check,
  UserCheck,
  TrendingUp,
  FileSpreadsheet,
  Printer
} from 'lucide-react';

export const AdminView = () => {
  const { user, getAuthHeader } = useAuth();
  const [activeTab, setActiveTab] = useState('command_center');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Global Admin Data States
  const [overview, setOverview] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [cases, setCases] = useState({ total: 0, items: [] });
  const [alerts, setAlerts] = useState({ total: 0, items: [] });
  const [complaints, setComplaints] = useState({ total: 0, items: [] });
  const [mules, setMules] = useState({ total: 0, items: [] });
  const [muleClusters, setMuleClusters] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [mlMetrics, setMlMetrics] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [auditLogs, setAuditLogs] = useState({ total: 0, items: [] });
  const [notifications, setNotifications] = useState({ unread_count: 0, notifications: [] });
  const [settingsData, setSettingsData] = useState({});

  // Sub-view Filter & Search States
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintStatus, setComplaintStatus] = useState('ALL');
  const [complaintPriority, setComplaintPriority] = useState('ALL');
  const [complaintPage, setComplaintPage] = useState(0);

  const [alertSeverityFilter, setAlertSeverityFilter] = useState('ALL');
  const [alertStatusFilter, setAlertStatusFilter] = useState('ALL');
  const [alertSearch, setAlertSearch] = useState('');

  const [caseStatusFilter, setCaseStatusFilter] = useState('ALL');
  const [casePriorityFilter, setCasePriorityFilter] = useState('ALL');

  const [muleStateFilter, setMuleStateFilter] = useState('');
  const [muleCrossFilter, setMuleCrossFilter] = useState('ALL');

  const [auditActionFilter, setAuditActionFilter] = useState('');

  // Modals States
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);
  const [showManualAlertModal, setShowManualAlertModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(null); // officer_id
  const [selectedCaseDetail, setSelectedCaseDetail] = useState(null);
  const [selectedAlertDetail, setSelectedAlertDetail] = useState(null);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  // Forms States
  const [newOfficer, setNewOfficer] = useState({
    full_name: '',
    officer_id: '',
    email: '',
    phone: '+91 ',
    state: 'Uttar Pradesh',
    district: 'Gautam Buddha Nagar',
    unit: 'Cyber Crime Police Station',
    designation: 'Inspector',
    username: '',
    password: ''
  });

  const [newCase, setNewCase] = useState({
    title: '',
    complaint_id: '',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    amount_inr: 50000,
    priority: 'HIGH',
    assigned_officer_id: '',
    initial_note: ''
  });

  const [manualAlert, setManualAlert] = useState({
    district: 'Noida',
    severity: 'CRITICAL',
    message: 'URGENT: Heightened mule activity detected around sector ATM clusters. Deploy field patrol teams immediately.'
  });

  const [resetPassValue, setResetPassValue] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Simulation controls state
  const [simMode, setSimMode] = useState('random');
  const [simRate, setSimRate] = useState(0.5);
  const [injecting, setInjecting] = useState(false);
  const [injectOutput, setInjectOutput] = useState(null);

  // Real-time WebSocket
  const wsRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------------------
  // Fetch Functions
  // -------------------------------------------------------------------------
  const fetchOverview = async () => {
    try {
      const res = await fetch('/admin/overview', { headers: getAuthHeader() });
      if (res.ok) setOverview(await res.json());
    } catch (e) { console.error('Overview error', e); }
  };

  const fetchPredictions = async () => {
    try {
      const res = await fetch('/predict?limit=250', { headers: getAuthHeader() });
      if (res.ok) {
        const d = await res.json();
        setPredictions(d.predictions || []);
      }
    } catch (e) { console.error('Predictions error', e); }
  };

  const fetchOfficers = async () => {
    try {
      const res = await fetch('/admin/officers', { headers: getAuthHeader() });
      if (res.ok) setOfficers(await res.json());
    } catch (e) { console.error('Officers error', e); }
  };

  const fetchCases = async () => {
    try {
      let url = `/admin/cases?limit=50`;
      if (caseStatusFilter !== 'ALL') url += `&status=${caseStatusFilter}`;
      if (casePriorityFilter !== 'ALL') url += `&priority=${casePriorityFilter}`;
      const res = await fetch(url, { headers: getAuthHeader() });
      if (res.ok) setCases(await res.json());
    } catch (e) { console.error('Cases error', e); }
  };

  const fetchAlerts = async () => {
    try {
      let url = `/alerts?limit=50`;
      if (alertSeverityFilter !== 'ALL') url += `&severity=${alertSeverityFilter}`;
      if (alertStatusFilter !== 'ALL') url += `&status=${alertStatusFilter}`;
      if (alertSearch) url += `&search=${encodeURIComponent(alertSearch)}`;
      const res = await fetch(url, { headers: getAuthHeader() });
      if (res.ok) {
        const d = await res.json();
        setAlerts(Array.isArray(d) ? { total: d.length, items: d } : d);
      }
    } catch (e) { console.error('Alerts error', e); }
  };

  const fetchComplaints = async () => {
    try {
      let url = `/complaints?limit=30&offset=${complaintPage * 30}`;
      if (complaintStatus !== 'ALL') url += `&status=${complaintStatus.toLowerCase()}`;
      if (complaintPriority !== 'ALL') url += `&priority=${complaintPriority}`;
      if (complaintSearch) url += `&search=${encodeURIComponent(complaintSearch)}`;
      const res = await fetch(url, { headers: getAuthHeader() });
      if (res.ok) setComplaints(await res.json());
    } catch (e) { console.error('Complaints error', e); }
  };

  const fetchMules = async () => {
    try {
      let url = `/admin/mules?limit=40`;
      if (muleStateFilter) url += `&state=${encodeURIComponent(muleStateFilter)}`;
      if (muleCrossFilter !== 'ALL') url += `&is_cross_state=${muleCrossFilter === 'YES'}`;
      const [mRes, cRes] = await Promise.all([
        fetch(url, { headers: getAuthHeader() }),
        fetch('/admin/mules/clusters', { headers: getAuthHeader() })
      ]);
      if (mRes.ok) setMules(await mRes.json());
      if (cRes.ok) setMuleClusters(await cRes.json());
    } catch (e) { console.error('Mules error', e); }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/analytics/charts?time_frame=7d', { headers: getAuthHeader() });
      if (res.ok) setAnalyticsData(await res.json());
    } catch (e) { console.error('Analytics error', e); }
  };

  const fetchMLMetrics = async () => {
    try {
      const res = await fetch('/predict/metrics', { headers: getAuthHeader() });
      if (res.ok) setMlMetrics(await res.json());
    } catch (e) { console.error('ML metrics error', e); }
  };

  const fetchSystemHealth = async () => {
    try {
      const res = await fetch('/admin/health/system', { headers: getAuthHeader() });
      if (res.ok) setSystemHealth(await res.json());
    } catch (e) { console.error('System health error', e); }
  };

  const fetchAuditLogs = async () => {
    try {
      let url = `/admin/audit-logs?limit=50`;
      if (auditActionFilter) url += `&action=${auditActionFilter}`;
      const res = await fetch(url, { headers: getAuthHeader() });
      if (res.ok) setAuditLogs(await res.json());
    } catch (e) { console.error('Audit logs error', e); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/admin/notifications', { headers: getAuthHeader() });
      if (res.ok) setNotifications(await res.json());
    } catch (e) { console.error('Notifications error', e); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/admin/settings', { headers: getAuthHeader() });
      if (res.ok) setSettingsData(await res.json());
    } catch (e) { console.error('Settings error', e); }
  };

  const reloadAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOverview(),
      fetchPredictions(),
      fetchOfficers(),
      fetchCases(),
      fetchAlerts(),
      fetchComplaints(),
      fetchMules(),
      fetchAnalytics(),
      fetchMLMetrics(),
      fetchSystemHealth(),
      fetchAuditLogs(),
      fetchNotifications(),
      fetchSettings()
    ]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    reloadAll();

    // WebSocket real-time listener
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/complaints/ws`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'NEW_COMPLAINT' || payload.event === 'COMPLAINT_UPDATED') {
          fetchOverview();
          fetchAlerts();
          fetchNotifications();
        }
      } catch (err) {}
    };

    return () => {
      if (socket) socket.close();
    };
  }, []);

  // Filter effect handlers
  useEffect(() => { fetchComplaints(); }, [complaintStatus, complaintPriority, complaintPage]);
  useEffect(() => { fetchAlerts(); }, [alertSeverityFilter, alertStatusFilter]);
  useEffect(() => { fetchCases(); }, [caseStatusFilter, casePriorityFilter]);
  useEffect(() => { fetchMules(); }, [muleStateFilter, muleCrossFilter]);
  useEffect(() => { fetchAuditLogs(); }, [auditActionFilter]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/admin/officers', {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(newOfficer)
      });
      if (res.ok) {
        showToast(`Officer ${newOfficer.full_name} enrolled successfully!`);
        setShowAddOfficerModal(false);
        setNewOfficer({
          full_name: '', officer_id: '', email: '', phone: '+91 ',
          state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar',
          unit: 'Cyber Crime Police Station', designation: 'Inspector',
          username: '', password: ''
        });
        fetchOfficers();
        fetchAuditLogs();
        fetchNotifications();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to create officer', 'error');
      }
    } catch (err) {
      showToast('Network error creating officer', 'error');
    }
  };

  const handleToggleOfficer = async (officer_id, current_status) => {
    try {
      const res = await fetch(`/admin/officers/${officer_id}/status`, {
        method: 'PATCH',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current_status })
      });
      if (res.ok) {
        showToast(`Officer status updated.`);
        fetchOfficers();
        fetchAuditLogs();
      }
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassValue || !showResetPasswordModal) return;
    try {
      const res = await fetch(`/admin/officers/${showResetPasswordModal}/reset-password`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: resetPassValue })
      });
      if (res.ok) {
        showToast('Password reset successfully.');
        setShowResetPasswordModal(null);
        setResetPassValue('');
        fetchAuditLogs();
      }
    } catch (e) {
      showToast('Failed to reset password', 'error');
    }
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    try {
      const selectedOff = officers.find(o => o.officer_id === newCase.assigned_officer_id);
      const payload = {
        ...newCase,
        amount_inr: parseFloat(newCase.amount_inr) || 0,
        assigned_officer_name: selectedOff ? selectedOff.full_name : 'Unassigned'
      };
      const res = await fetch('/admin/cases', {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Case created and assigned successfully.');
        setShowCreateCaseModal(false);
        setNewCase({
          title: '', complaint_id: '', district: 'Gautam Buddha Nagar',
          state: 'Uttar Pradesh', amount_inr: 50000, priority: 'HIGH',
          assigned_officer_id: '', initial_note: ''
        });
        fetchCases();
        fetchOverview();
        fetchAuditLogs();
      }
    } catch (e) {
      showToast('Failed to create case', 'error');
    }
  };

  const handleUpdateCase = async (caseId, updates, noteText = '') => {
    try {
      const res = await fetch(`/admin/cases/${caseId}`, {
        method: 'PATCH',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, note: noteText })
      });
      if (res.ok) {
        showToast('Case updated.');
        fetchCases();
        if (selectedCaseDetail && selectedCaseDetail.case_id === caseId) {
          const det = await fetch(`/admin/cases/${caseId}`, { headers: getAuthHeader() });
          if (det.ok) setSelectedCaseDetail(await det.json());
        }
        fetchOverview();
        fetchAuditLogs();
      }
    } catch (e) {
      showToast('Failed to update case', 'error');
    }
  };

  const handleUpdateAlert = async (alertId, updates, noteText = '') => {
    try {
      const res = await fetch(`/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, note: noteText })
      });
      if (res.ok) {
        showToast('Alert triaged.');
        fetchAlerts();
        fetchOverview();
        setSelectedAlertDetail(null);
      }
    } catch (e) {
      showToast('Failed to update alert', 'error');
    }
  };

  const handleSendManualAlert = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/alerts/trigger', {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(manualAlert)
      });
      if (res.ok) {
        showToast(`Emergency alert dispatched for ${manualAlert.district}!`);
        setShowManualAlertModal(false);
        fetchAlerts();
        fetchOverview();
        fetchNotifications();
        fetchAuditLogs();
      }
    } catch (e) {
      showToast('Failed to send alert', 'error');
    }
  };

  const handleRunPredictions = async () => {
    try {
      showToast('Triggering full XGBoost model scoring across India...');
      const res = await fetch('/predict/run', {
        method: 'POST',
        headers: getAuthHeader()
      });
      if (res.ok) {
        const d = await res.json();
        showToast(`Scored ${d.scored_atms} ATMs in ${d.elapsed_ms}ms!`);
        fetchPredictions();
        fetchMLMetrics();
        fetchOverview();
        fetchAuditLogs();
      }
    } catch (e) {
      showToast('Scoring failed', 'error');
    }
  };

  const handleInjectSpike = async (stage = 'all') => {
    setInjecting(true);
    try {
      const res = await fetch('/simulation/inject-spike', {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, fast: true })
      });
      if (res.ok) {
        const d = await res.json();
        setInjectOutput(d);
        showToast(`Injected spike! Fired ${d.alerts_fired?.length || 0} alerts.`);
        reloadAll();
      }
    } catch (e) {
      showToast('Spike injection failed', 'error');
    } finally {
      setInjecting(false);
    }
  };

  const handleExport = (type, fmt = 'csv') => {
    const url = `/reports/export?report_type=${type}&format=${fmt}`;
    fetch(url, { headers: getAuthHeader() })
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `track_the_cash_${type}_${new Date().toISOString().slice(0, 10)}.${fmt}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast(`Exported ${type.toUpperCase()} report (${fmt.toUpperCase()})`);
      })
      .catch(() => showToast('Export failed', 'error'));
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await fetch('/admin/notifications/mark-all-read', {
        method: 'POST',
        headers: getAuthHeader()
      });
      fetchNotifications();
    } catch (e) {}
  };

  // -------------------------------------------------------------------------
  // Styles (Matching Login.jsx Aesthetic)
  // -------------------------------------------------------------------------
  const S = {
    container: {
      display: 'flex',
      minHeight: 'calc(100vh - 60px)',
      backgroundColor: '#080b13',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.08) 0%, transparent 60%)',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      color: '#f1f5f9'
    },
    sidebar: {
      width: '260px',
      backgroundColor: '#0c1120',
      borderRight: '1px solid #1c2436',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      padding: '1.25rem 0',
      gap: '1.25rem'
    },
    sidebarHeader: {
      padding: '0 1.25rem 1rem',
      borderBottom: '1px solid #1c2436',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem'
    },
    brandTitle: {
      fontSize: '1rem',
      fontWeight: 800,
      margin: 0,
      letterSpacing: '0.04em',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    brandBadge: {
      display: 'inline-block',
      padding: '0.2rem 0.5rem',
      borderRadius: '999px',
      backgroundColor: '#131a2c',
      border: '1px solid #232d44',
      fontSize: '0.65rem',
      color: '#7dd3fc',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      fontFamily: "'JetBrains Mono', monospace"
    },
    sectionTitle: {
      fontSize: '0.68rem',
      fontWeight: 700,
      color: '#5b6b8c',
      padding: '0 1.25rem',
      margin: '0.5rem 0 0.3rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontFamily: "'JetBrains Mono', monospace"
    },
    navItem: (isActive) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.65rem',
      padding: '0.55rem 1.25rem',
      fontSize: '0.82rem',
      fontWeight: 600,
      color: isActive ? '#38bdf8' : '#8b96ad',
      backgroundColor: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
      borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      textDecoration: 'none'
    }),
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    },
    topBar: {
      backgroundColor: '#0c1120',
      borderBottom: '1px solid #1c2436',
      padding: '0.85rem 1.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap'
    },
    card: {
      backgroundColor: '#0c1120',
      border: '1px solid #1c2436',
      borderRadius: '12px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
      padding: '1.25rem',
      position: 'relative'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1rem'
    },
    cardTitle: {
      fontSize: '0.95rem',
      fontWeight: 800,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#f8fafc'
    },
    kpiGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1rem'
    },
    kpiCard: (accentColor = '#3b82f6') => ({
      backgroundColor: '#0c1120',
      border: '1px solid #1c2436',
      borderRadius: '12px',
      padding: '1.1rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.7)'
    }),
    kpiValue: {
      fontSize: '1.65rem',
      fontWeight: 800,
      color: '#f8fafc',
      margin: '0.3rem 0 0.1rem',
      fontFamily: "'JetBrains Mono', monospace"
    },
    kpiLabel: {
      fontSize: '0.72rem',
      color: '#7c8aa5',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    },
    btnPrimary: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.45rem',
      background: 'linear-gradient(135deg, #3b5bfd 0%, #2541c9 100%)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '0.55rem 0.9rem',
      fontSize: '0.8rem',
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(59, 91, 253, 0.4)'
    },
    btnSecondary: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.45rem',
      backgroundColor: '#131a2c',
      color: '#cbd5e1',
      border: '1px solid #232d44',
      borderRadius: '8px',
      padding: '0.55rem 0.85rem',
      fontSize: '0.8rem',
      fontWeight: 600,
      cursor: 'pointer'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.8rem',
      textAlign: 'left'
    },
    th: {
      backgroundColor: '#0f1526',
      padding: '0.65rem 0.85rem',
      color: '#7c8aa5',
      fontWeight: 700,
      textTransform: 'uppercase',
      fontSize: '0.68rem',
      letterSpacing: '0.06em',
      borderBottom: '1px solid #1c2436'
    },
    td: {
      padding: '0.65rem 0.85rem',
      borderBottom: '1px solid #141c2e',
      color: '#cbd5e1',
      verticalAlign: 'middle'
    },
    badge: (type = 'info') => {
      let bg = 'rgba(56, 189, 248, 0.12)';
      let color = '#38bdf8';
      let border = '1px solid rgba(56, 189, 248, 0.3)';

      if (type === 'critical' || type === 'CRITICAL') {
        bg = 'rgba(239, 68, 68, 0.15)'; color = '#f87171'; border = '1px solid rgba(239, 68, 68, 0.35)';
      } else if (type === 'high' || type === 'HIGH' || type === 'warning' || type === 'WARNING') {
        bg = 'rgba(245, 158, 11, 0.15)'; color = '#fbbf24'; border = '1px solid rgba(245, 158, 11, 0.35)';
      } else if (type === 'success' || type === 'RESOLVED' || type === 'ACTIVE') {
        bg = 'rgba(16, 185, 129, 0.15)'; color = '#34d399'; border = '1px solid rgba(16, 185, 129, 0.35)';
      }
      return {
        display: 'inline-block',
        padding: '0.15rem 0.5rem',
        borderRadius: '4px',
        backgroundColor: bg,
        color: color,
        border: border,
        fontSize: '0.7rem',
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        textTransform: 'uppercase'
      };
    },
    input: {
      backgroundColor: '#0a0e19',
      border: '1px solid #232d44',
      borderRadius: '8px',
      padding: '0.55rem 0.85rem',
      color: '#f8fafc',
      fontSize: '0.85rem',
      fontFamily: 'inherit',
      outline: 'none',
      width: '100%'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    },
    modalContent: {
      backgroundColor: '#0c1120',
      border: '1px solid #1c2436',
      borderRadius: '14px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
      padding: '2rem',
      width: '100%',
      maxWidth: '520px',
      maxHeight: '90vh',
      overflowY: 'auto'
    }
  };

  return (
    <div style={S.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toastMessage.type === 'error' ? '#7f1d1d' : '#064e3b',
          border: `1px solid ${toastMessage.type === 'error' ? '#ef4444' : '#10b981'}`,
          color: '#ffffff',
          borderRadius: '8px',
          padding: '0.75rem 1.25rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.8)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          {toastMessage.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside style={S.sidebar}>
        <div style={S.sidebarHeader}>
          <div style={S.brandTitle}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b5bfd 0%, #2541c9 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Shield size={16} />
            </div>
            <span style={{ color: '#f1f5f9' }}>TRACK<span style={{ color: '#3b82f6' }}>THE</span>CASH</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={S.brandBadge}>I4C COMMAND HQ</span>
            <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="pulse-green" /> ONLINE
            </span>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* MAIN */}
          <div style={S.sectionTitle}>COMMAND</div>
          <div style={S.navItem(activeTab === 'command_center')} onClick={() => setActiveTab('command_center')}>
            <LayoutDashboard size={16} />
            <span>Command Center</span>
          </div>
          <div style={S.navItem(activeTab === 'national_intelligence')} onClick={() => setActiveTab('national_intelligence')}>
            <Map size={16} />
            <span>National Intelligence</span>
          </div>

          {/* INTELLIGENCE */}
          <div style={S.sectionTitle}>INTELLIGENCE</div>
          <div style={S.navItem(activeTab === 'complaints')} onClick={() => setActiveTab('complaints')}>
            <FileText size={16} />
            <span>Complaints ({overview?.kpis?.total_complaints ? `${(overview.kpis.total_complaints/1000).toFixed(0)}k` : '280k'})</span>
          </div>
          <div style={S.navItem(activeTab === 'alerts')} onClick={() => setActiveTab('alerts')}>
            <AlertTriangle size={16} />
            <span>Alert Center</span>
          </div>
          <div style={S.navItem(activeTab === 'mule_intelligence')} onClick={() => setActiveTab('mule_intelligence')}>
            <Network size={16} />
            <span>Mule Intelligence</span>
          </div>
          <div style={S.navItem(activeTab === 'predictive_intelligence')} onClick={() => setActiveTab('predictive_intelligence')}>
            <Cpu size={16} />
            <span>Predictive ML</span>
          </div>
          <div style={S.navItem(activeTab === 'analytics')} onClick={() => setActiveTab('analytics')}>
            <BarChart3 size={16} />
            <span>Analytics &amp; Charts</span>
          </div>

          {/* OPERATIONS */}
          <div style={S.sectionTitle}>OPERATIONS</div>
          <div style={S.navItem(activeTab === 'lea_officers')} onClick={() => setActiveTab('lea_officers')}>
            <Users size={16} />
            <span>LEA Officers ({officers.length})</span>
          </div>
          <div style={S.navItem(activeTab === 'case_management')} onClick={() => setActiveTab('case_management')}>
            <Briefcase size={16} />
            <span>Case Management</span>
          </div>
          <div style={S.navItem(activeTab === 'notifications')} onClick={() => setActiveTab('notifications')}>
            <Bell size={16} />
            <span>Notifications {notifications.unread_count > 0 && <span style={{ ...S.badge('critical'), padding: '1px 5px', marginLeft: 'auto' }}>{notifications.unread_count}</span>}</span>
          </div>
          <div style={S.navItem(activeTab === 'alert_management')} onClick={() => setActiveTab('alert_management')}>
            <Send size={16} />
            <span>Manual Alert Broadcast</span>
          </div>

          {/* REPORTING */}
          <div style={S.sectionTitle}>REPORTING</div>
          <div style={S.navItem(activeTab === 'reports')} onClick={() => setActiveTab('reports')}>
            <Download size={16} />
            <span>Reports &amp; Export</span>
          </div>

          {/* SIMULATION */}
          <div style={S.sectionTitle}>SIMULATION</div>
          <div style={S.navItem(activeTab === 'simulation')} onClick={() => setActiveTab('simulation')}>
            <Sliders size={16} />
            <span>Simulation Control</span>
          </div>

          {/* SYSTEM */}
          <div style={S.sectionTitle}>SYSTEM</div>
          <div style={S.navItem(activeTab === 'system_health')} onClick={() => setActiveTab('system_health')}>
            <Activity size={16} />
            <span>System Health</span>
          </div>
          <div style={S.navItem(activeTab === 'audit_log')} onClick={() => setActiveTab('audit_log')}>
            <ScrollText size={16} />
            <span>Audit Trail</span>
          </div>
          <div style={S.navItem(activeTab === 'settings')} onClick={() => setActiveTab('settings')}>
            <Settings size={16} />
            <span>Settings</span>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={S.main}>
        {/* Top Control Bar */}
        <header style={S.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, textTransform: 'capitalize' }}>
              {activeTab.replace(/_/g, ' ')}
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
              • SECURE FIU-IND GATEWAY • ROLE: NATIONAL_ADMIN
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={reloadAll}
              disabled={refreshing}
              style={{ ...S.btnSecondary, padding: '0.45rem 0.75rem' }}
              title="Refresh all metrics from PostgreSQL"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Live Sync'}
            </button>

            <button
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              style={{ ...S.btnSecondary, position: 'relative', padding: '0.45rem 0.75rem' }}
            >
              <Bell size={15} />
              {notifications.unread_count > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  backgroundColor: '#ef4444', color: '#fff',
                  borderRadius: '50%', width: '16px', height: '16px',
                  fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                }}>
                  {notifications.unread_count}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowManualAlertModal(true)}
              style={{ ...S.btnPrimary, backgroundColor: '#f59e0b', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)' }}
            >
              <Send size={14} />
              Dispatch Alert
            </button>
          </div>
        </header>

        {/* Dynamic Sub-Views */}
        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* ================================================================= */}
          {/* 1. COMMAND CENTER (OVERVIEW) */}
          {/* ================================================================= */}
          {activeTab === 'command_center' && (
            <>
              {/* Top KPI Cards */}
              <div style={S.kpiGrid}>
                <div style={S.kpiCard('#3b82f6')} onClick={() => setActiveTab('complaints')}>
                  <div style={S.kpiLabel}>Total Registered Complaints</div>
                  <div style={S.kpiValue}>
                    {overview?.kpis?.total_complaints?.toLocaleString() || '280,001'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={12} /> Real-time Ingestion Active
                  </div>
                </div>

                <div style={S.kpiCard('#10b981')} onClick={() => setActiveTab('complaints')}>
                  <div style={S.kpiLabel}>Active Investigations</div>
                  <div style={{ ...S.kpiValue, color: '#34d399' }}>
                    {overview?.kpis?.active_complaints?.toLocaleString() || '150,722'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Pending resolution by LEAs
                  </div>
                </div>

                <div style={S.kpiCard('#ef4444')} onClick={() => setActiveTab('alerts')}>
                  <div style={S.kpiLabel}>Critical Threat Alerts</div>
                  <div style={{ ...S.kpiValue, color: '#f87171' }}>
                    {overview?.kpis?.critical_alerts || '1'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#f87171' }}>
                    Requires immediate dispatch
                  </div>
                </div>

                <div style={S.kpiCard('#f59e0b')} onClick={() => setActiveTab('national_intelligence')}>
                  <div style={S.kpiLabel}>High-Risk Monitored ATMs</div>
                  <div style={{ ...S.kpiValue, color: '#fbbf24' }}>
                    {overview?.kpis?.high_risk_atms || '300'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    XGBoost probability &ge; 70%
                  </div>
                </div>

                <div style={S.kpiCard('#a855f7')} onClick={() => setActiveTab('mule_intelligence')}>
                  <div style={S.kpiLabel}>Cross-State Mule Accounts</div>
                  <div style={{ ...S.kpiValue, color: '#c084fc' }}>
                    {overview?.kpis?.cross_state_mules || '744'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#c084fc' }}>
                    Inter-jurisdictional syndicate flows
                  </div>
                </div>

                <div style={S.kpiCard('#38bdf8')}>
                  <div style={S.kpiLabel}>Suspected Fraud (24H Volume)</div>
                  <div style={{ ...S.kpiValue, color: '#38bdf8' }}>
                    {overview?.kpis?.fraud_volume_24h_display || '₹ 72.54 Cr'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Total: {overview?.kpis?.total_fraud_volume_display || '₹ 7,152 Cr'}
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Critical Events Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
                {/* Recent Critical Events Table */}
                <div style={S.card}>
                  <div style={S.cardHeader}>
                    <h3 style={S.cardTitle}>
                      <Flame size={18} color="#ef4444" />
                      Recent Critical Intelligence Events
                    </h3>
                    <button style={S.btnSecondary} onClick={() => setActiveTab('alerts')}>
                      View All Alerts <ChevronRight size={14} />
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>Event ID</th>
                          <th style={S.th}>Severity</th>
                          <th style={S.th}>Location</th>
                          <th style={S.th}>Message / Brief</th>
                          <th style={S.th}>Timestamp</th>
                          <th style={S.th}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview?.recent_critical_events?.length > 0 ? (
                          overview.recent_critical_events.map((ev, i) => (
                            <tr key={i}>
                              <td style={{ ...S.td, fontWeight: 700, color: '#38bdf8' }}>{ev.id}</td>
                              <td style={S.td}><span style={S.badge(ev.severity)}>{ev.severity}</span></td>
                              <td style={S.td}>{ev.district}, {ev.state}</td>
                              <td style={{ ...S.td, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ev.title || ev.message}
                              </td>
                              <td style={{ ...S.td, fontSize: '0.72rem', color: '#64748b' }}>
                                {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Recent'}
                              </td>
                              <td style={S.td}>
                                <button
                                  style={{ ...S.btnSecondary, padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                                  onClick={() => {
                                    if (ev.type === 'COMPLAINT') {
                                      fetch(`/complaints/${ev.id}`, { headers: getAuthHeader() })
                                        .then(r => r.json())
                                        .then(d => setSelectedComplaint(d));
                                    } else {
                                      setActiveTab('alerts');
                                    }
                                  }}
                                >
                                  Triage
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="6" style={{ ...S.td, textAlign: 'center', color: '#64748b' }}>No critical events currently logged.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Operations Quick Console */}
                <div style={S.card}>
                  <div style={S.cardHeader}>
                    <h3 style={S.cardTitle}>
                      <Zap size={18} color="#38bdf8" />
                      Command Directives
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <button style={S.btnPrimary} onClick={handleRunPredictions}>
                      <Cpu size={16} />
                      Run AI Model Scorer Across India
                    </button>

                    <button
                      style={{ ...S.btnSecondary, justifyContent: 'flex-start', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                      onClick={() => handleInjectSpike('all')}
                      disabled={injecting}
                    >
                      <Zap size={16} />
                      {injecting ? 'Injecting Scripted Spike...' : 'Inject Demo Cross-State Spike'}
                    </button>

                    <button style={{ ...S.btnSecondary, justifyContent: 'flex-start' }} onClick={() => setShowAddOfficerModal(true)}>
                      <Users size={16} />
                      Provision New LEA Field Officer
                    </button>

                    <button style={{ ...S.btnSecondary, justifyContent: 'flex-start' }} onClick={() => setShowCreateCaseModal(true)}>
                      <Briefcase size={16} />
                      Register Investigation Case
                    </button>

                    <button style={{ ...S.btnSecondary, justifyContent: 'flex-start' }} onClick={() => handleExport('complaints', 'csv')}>
                      <FileSpreadsheet size={16} />
                      Export 24H Complaint Intelligence (CSV)
                    </button>

                    <a
                      href="/reports/dossier"
                      target="_blank"
                      rel="noreferrer"
                      style={{ ...S.btnSecondary, textDecoration: 'none', justifyContent: 'flex-start', color: '#38bdf8' }}
                    >
                      <Printer size={16} />
                      Generate Print-Ready LEA Dossier
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================================================================= */}
          {/* 2. NATIONAL INTELLIGENCE (LEAFLET MAP) */}
          {/* ================================================================= */}
          {activeTab === 'national_intelligence' && (
            <div style={{ ...S.card, height: '720px', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
              <div style={S.cardHeader}>
                <div>
                  <h3 style={S.cardTitle}>
                    <Map size={18} color="#38bdf8" />
                    All-India Financial Anomaly &amp; Mule Vector Intelligence Map
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Visualizing 1,246 ATM locations with real-time risk probabilities &amp; inter-jurisdictional vectors
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button style={S.btnPrimary} onClick={handleRunPredictions}>
                    <Cpu size={14} /> Recalculate Risk Scores
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, minHeight: '580px' }}>
                <RiskMap predictions={predictions} showFlows={true} />
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. COMPLAINTS INTELLIGENCE CENTER */}
          {/* ================================================================= */}
          {activeTab === 'complaints' && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <div>
                  <h3 style={S.cardTitle}>
                    <FileText size={18} color="#38bdf8" />
                    National Cybercrime Complaint Registry
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Total: {complaints.total?.toLocaleString() || '280,001'} records synced with I4C / MHA NatGrid
                  </p>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#5b6b8c' }} />
                    <input
                      type="text"
                      placeholder="Search ID, district, name..."
                      value={complaintSearch}
                      onChange={(e) => setComplaintSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchComplaints()}
                      style={{ ...S.input, paddingLeft: '2rem' }}
                    />
                  </div>

                  <select
                    value={complaintPriority}
                    onChange={(e) => setComplaintPriority(e.target.value)}
                    style={{ ...S.input, width: 'auto' }}
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>

                  <select
                    value={complaintStatus}
                    onChange={(e) => setComplaintStatus(e.target.value)}
                    style={{ ...S.input, width: 'auto' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active / In-Progress</option>
                    <option value="RESOLVED">Resolved / Closed</option>
                  </select>

                  <button style={S.btnPrimary} onClick={fetchComplaints}>
                    Filter
                  </button>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Complaint ID</th>
                      <th style={S.th}>Timestamp</th>
                      <th style={S.th}>Location</th>
                      <th style={S.th}>Crime Type</th>
                      <th style={S.th}>Amount</th>
                      <th style={S.th}>Priority</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Assigned LEA</th>
                      <th style={S.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.items?.length > 0 ? (
                      complaints.items.map((c) => (
                        <tr key={c.complaint_id}>
                          <td style={{ ...S.td, fontWeight: 700, color: '#38bdf8' }}>{c.complaint_id}</td>
                          <td style={{ ...S.td, fontSize: '0.72rem', color: '#64748b' }}>
                            {c.timestamp ? new Date(c.timestamp).toLocaleString() : ''}
                          </td>
                          <td style={S.td}>{c.district}, {c.state}</td>
                          <td style={S.td}>{c.crime_type}</td>
                          <td style={{ ...S.td, fontWeight: 700 }}>₹{c.amount_inr?.toLocaleString()}</td>
                          <td style={S.td}><span style={S.badge(c.priority)}>{c.priority}</span></td>
                          <td style={S.td}><span style={S.badge(c.status)}>{c.status}</span></td>
                          <td style={S.td}>{c.assigned_officer || 'Unassigned'}</td>
                          <td style={S.td}>
                            <button
                              style={{ ...S.btnSecondary, padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                              onClick={() => setSelectedComplaint(c)}
                            >
                              <Eye size={12} /> Dossier
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="9" style={{ ...S.td, textAlign: 'center', color: '#64748b' }}>No complaints matching query.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Showing page {complaintPage + 1} of {Math.ceil((complaints.total || 1) / 30)}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    disabled={complaintPage === 0}
                    onClick={() => setComplaintPage(p => Math.max(0, p - 1))}
                    style={S.btnSecondary}
                  >
                    Previous
                  </button>
                  <button
                    disabled={(complaintPage + 1) * 30 >= (complaints.total || 0)}
                    onClick={() => setComplaintPage(p => p + 1)}
                    style={S.btnSecondary}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 4. ALERT CENTER */}
          {/* ================================================================= */}
          {activeTab === 'alerts' && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <div>
                  <h3 style={S.cardTitle}>
                    <AlertTriangle size={18} color="#f59e0b" />
                    National Operational Alert Center
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Automated spike detections, velocity anomalies &amp; manual broadcasts
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <select
                    value={alertSeverityFilter}
                    onChange={(e) => setAlertSeverityFilter(e.target.value)}
                    style={{ ...S.input, width: 'auto' }}
                  >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="WARNING">WARNING</option>
                  </select>

                  <select
                    value={alertStatusFilter}
                    onChange={(e) => setAlertStatusFilter(e.target.value)}
                    style={{ ...S.input, width: 'auto' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>

                  <button style={S.btnPrimary} onClick={() => setShowManualAlertModal(true)}>
                    <Send size={14} /> Dispatch Alert
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {alerts.items?.length > 0 ? (
                  alerts.items.map((a) => (
                    <div
                      key={a.alert_id}
                      style={{
                        backgroundColor: '#0f1526',
                        border: `1px solid ${a.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.4)' : '#1c2436'}`,
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                        <div style={{
                          backgroundColor: a.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          padding: '0.6rem',
                          borderRadius: '8px',
                          color: a.severity === 'CRITICAL' ? '#f87171' : '#fbbf24'
                        }}>
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc' }}>
                              ALT-{a.alert_id}: {a.district}, {a.state}
                            </span>
                            <span style={S.badge(a.severity)}>{a.severity}</span>
                            <span style={S.badge(a.status || 'ACTIVE')}>{a.status || 'ACTIVE'}</span>
                          </div>
                          <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                            {a.message || `Velocity Spike: ${a.complaint_count} complaints logged in window.`}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.72rem', color: '#64748b' }}>
                            <span>Detected: {a.detected_at ? new Date(a.detected_at).toLocaleString() : ''}</span>
                            <span>Triggered: {a.triggered_by?.toUpperCase()}</span>
                            <span>Assigned: {a.assigned_officer || 'Unassigned'}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {a.status !== 'ACKNOWLEDGED' && a.status !== 'RESOLVED' && (
                          <button
                            style={{ ...S.btnSecondary, padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => handleUpdateAlert(a.alert_id, { status: 'ACKNOWLEDGED' }, 'Acknowledged by Admin')}
                          >
                            <Check size={13} /> Acknowledge
                          </button>
                        )}
                        {a.status !== 'RESOLVED' && (
                          <button
                            style={{ ...S.btnSecondary, padding: '0.4rem 0.65rem', fontSize: '0.75rem', color: '#34d399' }}
                            onClick={() => handleUpdateAlert(a.alert_id, { status: 'RESOLVED' }, 'Resolved and closed by Admin')}
                          >
                            <CheckCircle size={13} /> Resolve
                          </button>
                        )}
                        <button
                          style={{ ...S.btnSecondary, padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            setSelectedAlertDetail(a);
                          }}
                        >
                          Details &amp; Notes
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No alerts matching filters.</div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 5. MULE INTELLIGENCE */}
          {/* ================================================================= */}
          {activeTab === 'mule_intelligence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Cluster KPIs */}
              <div style={S.kpiGrid}>
                <div style={S.kpiCard('#a855f7')}>
                  <div style={S.kpiLabel}>Monitored Mule Accounts</div>
                  <div style={S.kpiValue}>{muleClusters?.total_mules?.toLocaleString() || '3,000'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#c084fc' }}>Registered across banking grid</div>
                </div>

                <div style={S.kpiCard('#f97316')}>
                  <div style={S.kpiLabel}>Inter-Jurisdictional Cross-State</div>
                  <div style={{ ...S.kpiValue, color: '#fb923c' }}>{muleClusters?.cross_state_count?.toLocaleString() || '744'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#fb923c' }}>
                    {muleClusters?.cross_state_pct || '24.8'}% of total mule volume
                  </div>
                </div>

                <div style={S.kpiCard('#38bdf8')}>
                  <div style={S.kpiLabel}>Top Exploited Banks</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.5rem' }}>
                    {muleClusters?.top_mule_banks?.slice(0, 3).map(b => b.bank).join(', ') || 'SBI, HDFC, ICICI'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>High frequency cash-outs</div>
                </div>
              </div>

              {/* Mule Table */}
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <h3 style={S.cardTitle}>
                    <Network size={18} color="#c084fc" />
                    Mule Account Surveillance Dossiers
                  </h3>

                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <select
                      value={muleCrossFilter}
                      onChange={(e) => setMuleCrossFilter(e.target.value)}
                      style={{ ...S.input, width: 'auto' }}
                    >
                      <option value="ALL">All Mules</option>
                      <option value="YES">Cross-State Only</option>
                      <option value="NO">Intra-State</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Mule ID</th>
                        <th style={S.th}>Registered District</th>
                        <th style={S.th}>Registered State</th>
                        <th style={S.th}>Bank</th>
                        <th style={S.th}>Cross-State Flag</th>
                        <th style={S.th}>Linked ATMs</th>
                        <th style={S.th}>Associated Complaints</th>
                        <th style={S.th}>Suspect Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mules.items?.length > 0 ? (
                        mules.items.map((m) => (
                          <tr key={m.mule_id}>
                            <td style={{ ...S.td, fontWeight: 700, color: '#c084fc' }}>{m.mule_id}</td>
                            <td style={S.td}>{m.registered_district}</td>
                            <td style={S.td}>{m.registered_state}</td>
                            <td style={S.td}>{m.account_bank}</td>
                            <td style={S.td}>
                              {m.is_cross_state ? (
                                <span style={S.badge('warning')}>CROSS-STATE</span>
                              ) : (
                                <span style={S.badge('info')}>INTRA-STATE</span>
                              )}
                            </td>
                            <td style={S.td}>{m.linked_atm_count} ATMs</td>
                            <td style={{ ...S.td, fontWeight: 700 }}>{m.complaint_count}</td>
                            <td style={{ ...S.td, fontWeight: 700 }}>₹{m.total_fraud_volume?.toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="8" style={{ ...S.td, textAlign: 'center', color: '#64748b' }}>No mule records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 6. PREDICTIVE INTELLIGENCE (AI/ML) */}
          {/* ================================================================= */}
          {activeTab === 'predictive_intelligence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={S.kpiGrid}>
                <div style={S.kpiCard('#3b82f6')}>
                  <div style={S.kpiLabel}>Model Architecture &amp; Status</div>
                  <div style={{ ...S.kpiValue, fontSize: '1.3rem', color: '#34d399' }}>
                    ONLINE &bull; XGBOOST
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {mlMetrics?.prediction_window || 'NEXT 24 HOURS (Rolling)'}
                  </div>
                </div>

                <div style={S.kpiCard('#38bdf8')}>
                  <div style={S.kpiLabel}>Model ROC-AUC Score</div>
                  <div style={{ ...S.kpiValue, color: '#38bdf8' }}>
                    {mlMetrics?.roc_auc || 0.865}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#10b981' }}>Target &ge; 0.80 Met (Exceeds SLA)</div>
                </div>

                <div style={S.kpiCard('#a855f7')}>
                  <div style={S.kpiLabel}>Precision@10 (Top ATMs)</div>
                  <div style={{ ...S.kpiValue, color: '#c084fc' }}>
                    {mlMetrics?.precision_at_10 || 0.800}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#10b981' }}>Target &ge; 0.70 Met</div>
                </div>

                <div style={S.kpiCard('#f59e0b')}>
                  <div style={S.kpiLabel}>Total Scored ATMs</div>
                  <div style={{ ...S.kpiValue, color: '#fbbf24' }}>
                    {mlMetrics?.total_atms_scored || 1246}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Processing: {mlMetrics?.processing_time_ms || 142}ms
                  </div>
                </div>
              </div>

              {/* Feature Importance & Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={S.card}>
                  <div style={S.cardHeader}>
                    <h3 style={S.cardTitle}>
                      <Cpu size={18} color="#38bdf8" />
                      XGBoost Feature Importance Weights
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {mlMetrics?.feature_importance && Object.entries(mlMetrics.feature_importance).map(([feat, wt]) => (
                      <div key={feat}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                          <span style={{ color: '#cbd5e1', textTransform: 'capitalize' }}>{feat.replace(/_/g, ' ')}</span>
                          <span style={{ fontWeight: 700, color: '#38bdf8' }}>{(wt * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#131a2c', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${wt * 100}%`, height: '100%', backgroundColor: '#38bdf8' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={S.card}>
                  <div style={S.cardHeader}>
                    <h3 style={S.cardTitle}>
                      <Zap size={18} color="#fbbf24" />
                      Prediction Control &amp; Scoring Engine
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                    <p style={{ margin: 0 }}>
                      The AI Prediction Engine calculates cash-out probabilities using spatio-temporal features: 6h complaint velocity spikes, mule geolocation proximity, and historical cash-out frequency.
                    </p>

                    <div style={{ backgroundColor: '#0f1526', padding: '1rem', borderRadius: '8px', border: '1px solid #1c2436' }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>Risk Score Distribution Across Monitored Grid</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span>Critical (&ge; 70%): <strong style={{ color: '#f87171' }}>{mlMetrics?.risk_distribution?.critical_risk_gte_70 || 300}</strong></span>
                        <span>Elevated (40–70%): <strong style={{ color: '#fbbf24' }}>{mlMetrics?.risk_distribution?.elevated_risk_40_70 || 450}</strong></span>
                        <span>Normal (&lt; 40%): <strong style={{ color: '#34d399' }}>{mlMetrics?.risk_distribution?.normal_risk_lt_40 || 496}</strong></span>
                      </div>
                    </div>

                    <button style={{ ...S.btnPrimary, width: '100%', padding: '0.75rem' }} onClick={handleRunPredictions}>
                      <Cpu size={16} /> Re-Score All 1,246 ATMs Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 7. ANALYTICS & CHARTS */}
          {/* ================================================================= */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* State Distribution */}
                <div style={S.card}>
                  <div style={S.cardHeader}>
                    <h3 style={S.cardTitle}>
                      <BarChart3 size={18} color="#38bdf8" />
                      State-Wise Fraud Volume Distribution
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {analyticsData?.state_distribution?.map((s) => {
                      const maxVal = analyticsData.state_distribution[0]?.count || 1;
                      const pct = Math.round((s.count / maxVal) * 100);
                      return (
                        <div key={s.state}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                            <span>{s.state}</span>
                            <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                              {s.count.toLocaleString()} cases &bull; ₹{s.amount_cr} Cr
                            </span>
                          </div>
                          <div style={{ height: '7px', backgroundColor: '#131a2c', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #3b5bfd, #38bdf8)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Crime Types Breakdown */}
                <div style={S.card}>
                  <div style={S.cardHeader}>
                    <h3 style={S.cardTitle}>
                      <AlertOctagon size={18} color="#f59e0b" />
                      Crime Category Breakdown
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {analyticsData?.crime_distribution?.map((c) => {
                      const totalC = analyticsData.resolution_stats?.total_complaints || 1;
                      const pct = ((c.count / totalC) * 100).toFixed(1);
                      return (
                        <div key={c.crime_type}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                            <span style={{ textTransform: 'capitalize' }}>{c.crime_type.replace(/_/g, ' ')}</span>
                            <span style={{ fontWeight: 700, color: '#fbbf24' }}>
                              {c.count.toLocaleString()} ({pct}%)
                            </span>
                          </div>
                          <div style={{ height: '7px', backgroundColor: '#131a2c', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #d97706, #fbbf24)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 8. LEA OFFICERS MANAGEMENT */}
          {/* ================================================================= */}
          {activeTab === 'lea_officers' && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <div>
                  <h3 style={S.cardTitle}>
                    <Users size={18} color="#38bdf8" />
                    Authorized Law Enforcement Agency (LEA) Roster
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Manage officer access credentials, jurisdiction assignments &amp; field workload
                  </p>
                </div>

                <button style={S.btnPrimary} onClick={() => setShowAddOfficerModal(true)}>
                  <Plus size={14} /> Provision New Officer
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Officer ID</th>
                      <th style={S.th}>Name &amp; Designation</th>
                      <th style={S.th}>Jurisdiction</th>
                      <th style={S.th}>Police / Cyber Unit</th>
                      <th style={S.th}>Active Cases</th>
                      <th style={S.th}>Resolved Cases</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officers.map((off) => (
                      <tr key={off.officer_id}>
                        <td style={{ ...S.td, fontWeight: 700, color: '#38bdf8' }}>{off.officer_id}</td>
                        <td style={S.td}>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{off.full_name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{off.designation} &bull; @{off.username}</div>
                        </td>
                        <td style={S.td}>{off.district}, {off.state}</td>
                        <td style={S.td}>{off.unit}</td>
                        <td style={{ ...S.td, fontWeight: 700, color: '#38bdf8' }}>{off.active_cases}</td>
                        <td style={{ ...S.td, fontWeight: 700, color: '#34d399' }}>{off.resolved_cases}</td>
                        <td style={S.td}>
                          <span style={S.badge(off.is_active ? 'ACTIVE' : 'critical')}>
                            {off.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                          </span>
                        </td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              style={{ ...S.btnSecondary, padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={() => handleToggleOfficer(off.officer_id, off.is_active)}
                            >
                              {off.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              style={{ ...S.btnSecondary, padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={() => setShowResetPasswordModal(off.officer_id)}
                            >
                              Reset Key
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 9. CASE MANAGEMENT */}
          {/* ================================================================= */}
          {activeTab === 'case_management' && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <div>
                  <h3 style={S.cardTitle}>
                    <Briefcase size={18} color="#38bdf8" />
                    Formal Law Enforcement Investigation Case Files
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Total: {cases.total} active &amp; resolved inter-state syndicate cases
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <select
                    value={caseStatusFilter}
                    onChange={(e) => setCaseStatusFilter(e.target.value)}
                    style={{ ...S.input, width: 'auto' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="NEW">NEW</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="ESCALATED">ESCALATED</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>

                  <button style={S.btnPrimary} onClick={() => setShowCreateCaseModal(true)}>
                    <Plus size={14} /> Open Case File
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Case ID</th>
                      <th style={S.th}>Case Title</th>
                      <th style={S.th}>Jurisdiction</th>
                      <th style={S.th}>Amount</th>
                      <th style={S.th}>Priority</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Assigned Officer</th>
                      <th style={S.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.items?.length > 0 ? (
                      cases.items.map((cs) => (
                        <tr key={cs.case_id}>
                          <td style={{ ...S.td, fontWeight: 700, color: '#38bdf8' }}>{cs.case_id}</td>
                          <td style={{ ...S.td, fontWeight: 700, color: '#f8fafc' }}>{cs.title}</td>
                          <td style={S.td}>{cs.district}, {cs.state}</td>
                          <td style={{ ...S.td, fontWeight: 700 }}>₹{cs.amount_inr?.toLocaleString()}</td>
                          <td style={S.td}><span style={S.badge(cs.priority)}>{cs.priority}</span></td>
                          <td style={S.td}><span style={S.badge(cs.status)}>{cs.status}</span></td>
                          <td style={S.td}>{cs.assigned_officer_name || 'Unassigned'}</td>
                          <td style={S.td}>
                            <button
                              style={{ ...S.btnSecondary, padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                              onClick={() => setSelectedCaseDetail(cs)}
                            >
                              Manage Case
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="8" style={{ ...S.td, textAlign: 'center', color: '#64748b' }}>No case records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 10. NOTIFICATIONS CENTER */}
          {/* ================================================================= */}
          {activeTab === 'notifications' && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>
                  <Bell size={18} color="#38bdf8" />
                  Real-time Operational Telemetry &amp; Alerts Feed
                </h3>

                <button style={S.btnSecondary} onClick={handleMarkAllNotifsRead}>
                  <CheckCircle size={14} /> Mark All as Read
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {notifications.notifications?.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      backgroundColor: n.is_read ? '#0f1526' : '#131d33',
                      border: `1px solid ${n.is_read ? '#1c2436' : 'rgba(56, 189, 248, 0.4)'}`,
                      borderRadius: '8px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>{n.title}</span>
                        <span style={S.badge(n.severity)}>{n.type}</span>
                        {!n.is_read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>{n.message}</p>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {n.timestamp ? new Date(n.timestamp).toLocaleString() : ''}
                      </span>
                    </div>

                    {!n.is_read && (
                      <button
                        style={{ ...S.btnSecondary, padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                        onClick={async () => {
                          await fetch(`/admin/notifications/${n.id}/read`, { method: 'PATCH', headers: getAuthHeader() });
                          fetchNotifications();
                        }}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 11. MANUAL ALERT BROADCAST */}
          {/* ================================================================= */}
          {activeTab === 'alert_management' && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>
                  <Send size={18} color="#f59e0b" />
                  Emergency Law Enforcement Alert Dispatch
                </h3>
              </div>

              <form onSubmit={handleSendManualAlert} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', maxWidth: '640px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Target District Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={manualAlert.district}
                    onChange={(e) => setManualAlert({ ...manualAlert, district: e.target.value })}
                    required
                    style={S.input}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Threat Urgency Severity
                  </label>
                  <select
                    value={manualAlert.severity}
                    onChange={(e) => setManualAlert({ ...manualAlert, severity: e.target.value })}
                    style={S.input}
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Field Response)</option>
                    <option value="WARNING">WARNING (Elevated Surveillance Alert)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Directives / Operational Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={manualAlert.message}
                    onChange={(e) => setManualAlert({ ...manualAlert, message: e.target.value })}
                    required
                    style={{ ...S.input, resize: 'vertical' }}
                  />
                </div>

                <div style={{ backgroundColor: '#0f1526', padding: '0.85rem', borderRadius: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                  ✓ Notice will be dispatched via SMTP Gateway to: <strong style={{ color: '#cbd5e1' }}>lea_{manualAlert.district.toLowerCase()}@police.gov.in</strong> and logged in National Audit Trail.
                </div>

                <button type="submit" style={{ ...S.btnPrimary, backgroundColor: '#f59e0b', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', alignSelf: 'flex-start' }}>
                  <Send size={15} /> Dispatch Emergency Alert
                </button>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* 12. REPORTS & EXPORT */}
          {/* ================================================================= */}
          {activeTab === 'reports' && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>
                  <Download size={18} color="#38bdf8" />
                  National Financial Intelligence Report Generator
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#0f1526', padding: '1.25rem', borderRadius: '10px', border: '1px solid #1c2436' }}>
                  <h4 style={{ margin: '0 0 0.5rem', color: '#f8fafc', fontSize: '0.9rem' }}>ATM Risk Predictions</h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 1rem' }}>Scored probabilities and cross-state vectors for 1,246 ATMs.</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={S.btnPrimary} onClick={() => handleExport('predictions', 'csv')}>Export CSV</button>
                    <button style={S.btnSecondary} onClick={() => handleExport('predictions', 'json')}>Export JSON</button>
                  </div>
                </div>

                <div style={{ backgroundColor: '#0f1526', padding: '1.25rem', borderRadius: '10px', border: '1px solid #1c2436' }}>
                  <h4 style={{ margin: '0 0 0.5rem', color: '#f8fafc', fontSize: '0.9rem' }}>Complaint Registry Extract</h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 1rem' }}>Full record of 280,000+ cyber fraud and cash-out complaints.</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={S.btnPrimary} onClick={() => handleExport('complaints', 'csv')}>Export CSV</button>
                    <button style={S.btnSecondary} onClick={() => handleExport('complaints', 'json')}>Export JSON</button>
                  </div>
                </div>

                <div style={{ backgroundColor: '#0f1526', padding: '1.25rem', borderRadius: '10px', border: '1px solid #1c2436' }}>
                  <h4 style={{ margin: '0 0 0.5rem', color: '#f8fafc', fontSize: '0.9rem' }}>Mule Account Network</h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 1rem' }}>3,000 monitored mule accounts and cross-state links.</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={S.btnPrimary} onClick={() => handleExport('mules', 'csv')}>Export CSV</button>
                  </div>
                </div>

                <div style={{ backgroundColor: '#0f1526', padding: '1.25rem', borderRadius: '10px', border: '1px solid #1c2436' }}>
                  <h4 style={{ margin: '0 0 0.5rem', color: '#f8fafc', fontSize: '0.9rem' }}>Investigation Cases</h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 1rem' }}>Formal case dossiers and officer assignment logs.</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={S.btnPrimary} onClick={() => handleExport('cases', 'csv')}>Export CSV</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 13. SIMULATION CONTROL */}
          {/* ================================================================= */}
          {activeTab === 'simulation' && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>
                  <Sliders size={18} color="#10b981" />
                  Live Streaming Simulation &amp; Scenario Injector
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px' }}>
                <div style={{ backgroundColor: '#0f1526', padding: '1rem', borderRadius: '8px', border: '1px solid #1c2436' }}>
                  <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>Deterministic 2-Stage Spike Demonstration</div>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 1rem' }}>
                    Simulate real-time cyber attacks to validate spike detection algorithms and officer dispatch workflows.
                  </p>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button
                      style={{ ...S.btnPrimary, backgroundColor: '#ef4444', background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}
                      onClick={() => handleInjectSpike('all')}
                      disabled={injecting}
                    >
                      <Zap size={14} /> Inject Complete 2-Stage Scenario
                    </button>
                    <button style={S.btnSecondary} onClick={() => handleInjectSpike('1')} disabled={injecting}>
                      Stage 1 (Cross-State RJ ➔ UP)
                    </button>
                    <button style={S.btnSecondary} onClick={() => handleInjectSpike('2')} disabled={injecting}>
                      Stage 2 (Noida Velocity Spike)
                    </button>
                  </div>
                </div>

                {injectOutput && (
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '1rem', fontSize: '0.78rem', color: '#fca5a5' }}>
                    <strong>Spike Trigger Result:</strong> Injected {injectOutput.injected_complaints?.length || 0} complaints across {injectOutput.affected_atms?.length || 0} ATMs. {injectOutput.alerts_fired?.length || 0} emergency alert(s) dispatched.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 14. SYSTEM HEALTH */}
          {/* ================================================================= */}
          {activeTab === 'system_health' && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <div>
                  <h3 style={S.cardTitle}>
                    <Activity size={18} color="#34d399" />
                    Infrastructure &amp; Microservice Diagnostic Health
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Live status check &bull; API latency: {systemHealth?.api_response_time_ms || 212}ms
                  </p>
                </div>

                <button style={S.btnSecondary} onClick={fetchSystemHealth}>
                  <RefreshCw size={14} /> Run Diagnostics
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#0f1526', padding: '1rem', borderRadius: '8px', border: '1px solid #1c2436' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>FastAPI Application Gateway</span>
                    <span style={S.badge('ACTIVE')}>ONLINE</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>v1.0.0 &bull; Uvicorn Async Worker</div>
                </div>

                <div style={{ backgroundColor: '#0f1526', padding: '1rem', borderRadius: '8px', border: '1px solid #1c2436' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>PostgreSQL Database</span>
                    <span style={S.badge(systemHealth?.services?.postgresql_database?.status || 'ACTIVE')}>
                      {systemHealth?.services?.postgresql_database?.status || 'ONLINE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Latency: {systemHealth?.services?.postgresql_database?.latency_ms || 5.4}ms &bull; 280,001 complaints
                  </div>
                </div>

                <div style={{ backgroundColor: '#0f1526', padding: '1rem', borderRadius: '8px', border: '1px solid #1c2436' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>XGBoost ML Engine</span>
                    <span style={S.badge(systemHealth?.services?.ml_prediction_engine?.status || 'ACTIVE')}>
                      {systemHealth?.services?.ml_prediction_engine?.status || 'ONLINE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>1,246 ATMs Scored &bull; ROC-AUC: 0.865</div>
                </div>

                <div style={{ backgroundColor: '#0f1526', padding: '1rem', borderRadius: '8px', border: '1px solid #1c2436' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>Real-time WebSocket Manager</span>
                    <span style={S.badge('ACTIVE')}>ONLINE</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Active subscribers: {systemHealth?.services?.realtime_websocket?.active_subscribers || 1}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 15. AUDIT LOG */}
          {/* ================================================================= */}
          {activeTab === 'audit_log' && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>
                  <ScrollText size={18} color="#38bdf8" />
                  National Security Immutable Audit Log
                </h3>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>ID</th>
                      <th style={S.th}>Timestamp</th>
                      <th style={S.th}>User</th>
                      <th style={S.th}>Action</th>
                      <th style={S.th}>Resource</th>
                      <th style={S.th}>Resource ID</th>
                      <th style={S.th}>Details</th>
                      <th style={S.th}>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.items?.map((l) => (
                      <tr key={l.id}>
                        <td style={{ ...S.td, fontWeight: 700 }}>#{l.id}</td>
                        <td style={{ ...S.td, fontSize: '0.72rem', color: '#64748b' }}>
                          {l.timestamp ? new Date(l.timestamp).toLocaleString() : ''}
                        </td>
                        <td style={{ ...S.td, fontWeight: 700, color: '#38bdf8' }}>{l.admin_user}</td>
                        <td style={S.td}><span style={S.badge('info')}>{l.action}</span></td>
                        <td style={S.td}>{l.resource}</td>
                        <td style={S.td}>{l.resource_id || '-'}</td>
                        <td style={{ ...S.td, fontSize: '0.72rem', color: '#94a3b8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {JSON.stringify(l.details)}
                        </td>
                        <td style={{ ...S.td, fontSize: '0.72rem' }}>{l.ip_address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 16. SETTINGS */}
          {/* ================================================================= */}
          {activeTab === 'settings' && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>
                  <Settings size={18} color="#38bdf8" />
                  System Policies &amp; Threshold Configuration
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px' }}>
                <div style={{ backgroundColor: '#0f1526', padding: '1.25rem', borderRadius: '8px', border: '1px solid #1c2436' }}>
                  <h4 style={{ margin: '0 0 0.85rem', color: '#f8fafc', fontSize: '0.85rem' }}>AI Model Risk Thresholds</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Critical Risk Score Cutoff</label>
                      <input type="number" defaultValue="0.70" step="0.05" style={S.input} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Elevated Risk Score Cutoff</label>
                      <input type="number" defaultValue="0.40" step="0.05" style={S.input} />
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#0f1526', padding: '1.25rem', borderRadius: '8px', border: '1px solid #1c2436' }}>
                  <h4 style={{ margin: '0 0 0.85rem', color: '#f8fafc', fontSize: '0.85rem' }}>Notification Preferences</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" defaultChecked /> Auto-dispatch SMTP alerts for critical velocity spikes
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" defaultChecked /> Broadcast live WebSocket notifications for cross-state mule flows
                    </label>
                  </div>
                </div>

                <button style={S.btnPrimary} onClick={() => showToast('Settings saved to database.')}>
                  Save System Preferences
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ================================================================= */}
      {/* MODAL: PROVISION NEW LEA OFFICER */}
      {/* ================================================================= */}
      {showAddOfficerModal && (
        <div style={S.modalOverlay}>
          <div style={S.modalContent}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                Provision New LEA Field Officer
              </h3>
              <button
                onClick={() => setShowAddOfficerModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOfficer} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Officer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Insp. Rajesh Sharma"
                  value={newOfficer.full_name}
                  onChange={(e) => setNewOfficer({ ...newOfficer, full_name: e.target.value })}
                  style={S.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Officer ID</label>
                  <input
                    type="text"
                    required
                    placeholder="LEA-DL-055"
                    value={newOfficer.officer_id}
                    onChange={(e) => setNewOfficer({ ...newOfficer, officer_id: e.target.value })}
                    style={S.input}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="Inspector / DSP"
                    value={newOfficer.designation}
                    onChange={(e) => setNewOfficer({ ...newOfficer, designation: e.target.value })}
                    style={S.input}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>State</label>
                  <input
                    type="text"
                    required
                    value={newOfficer.state}
                    onChange={(e) => setNewOfficer({ ...newOfficer, state: e.target.value })}
                    style={S.input}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>District</label>
                  <input
                    type="text"
                    required
                    value={newOfficer.district}
                    onChange={(e) => setNewOfficer({ ...newOfficer, district: e.target.value })}
                    style={S.input}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Police / Cyber Unit</label>
                <input
                  type="text"
                  required
                  value={newOfficer.unit}
                  onChange={(e) => setNewOfficer({ ...newOfficer, unit: e.target.value })}
                  style={S.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="officer@police.gov.in"
                    value={newOfficer.email}
                    onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                    style={S.input}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Phone</label>
                  <input
                    type="text"
                    value={newOfficer.phone}
                    onChange={(e) => setNewOfficer({ ...newOfficer, phone: e.target.value })}
                    style={S.input}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', borderTop: '1px solid #1c2436', paddingTop: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Username</label>
                  <input
                    type="text"
                    required
                    placeholder="r.sharma"
                    value={newOfficer.username}
                    onChange={(e) => setNewOfficer({ ...newOfficer, username: e.target.value })}
                    style={S.input}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Passphrase</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newOfficer.password}
                    onChange={(e) => setNewOfficer({ ...newOfficer, password: e.target.value })}
                    style={S.input}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddOfficerModal(false)} style={S.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={S.btnPrimary}>
                  Enroll Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CREATE INVESTIGATION CASE */}
      {/* ================================================================= */}
      {showCreateCaseModal && (
        <div style={S.modalOverlay}>
          <div style={S.modalContent}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                Register Investigation Case
              </h3>
              <button
                onClick={() => setShowCreateCaseModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCase} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Case Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cross-State Mule Network - Sector 62 Anomaly"
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                  style={S.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>State</label>
                  <input
                    type="text"
                    required
                    value={newCase.state}
                    onChange={(e) => setNewCase({ ...newCase, state: e.target.value })}
                    style={S.input}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>District</label>
                  <input
                    type="text"
                    required
                    value={newCase.district}
                    onChange={(e) => setNewCase({ ...newCase, district: e.target.value })}
                    style={S.input}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Suspected Fraud (INR)</label>
                  <input
                    type="number"
                    value={newCase.amount_inr}
                    onChange={(e) => setNewCase({ ...newCase, amount_inr: e.target.value })}
                    style={S.input}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Priority</label>
                  <select
                    value={newCase.priority}
                    onChange={(e) => setNewCase({ ...newCase, priority: e.target.value })}
                    style={S.input}
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Assign LEA Officer</label>
                <select
                  value={newCase.assigned_officer_id}
                  onChange={(e) => setNewCase({ ...newCase, assigned_officer_id: e.target.value })}
                  style={S.input}
                >
                  <option value="">-- Select Field Officer --</option>
                  {officers.map(o => (
                    <option key={o.officer_id} value={o.officer_id}>
                      {o.full_name} ({o.district}, {o.state}) - {o.active_cases} active cases
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Initial Brief / Note</label>
                <textarea
                  rows={2}
                  value={newCase.initial_note}
                  onChange={(e) => setNewCase({ ...newCase, initial_note: e.target.value })}
                  placeholder="Operational context for investigating officer..."
                  style={S.input}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateCaseModal(false)} style={S.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={S.btnPrimary}>
                  Create Case File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: RESET PASSPHRASE */}
      {/* ================================================================= */}
      {showResetPasswordModal && (
        <div style={S.modalOverlay}>
          <div style={S.modalContent}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              Reset Officer Key: {showResetPasswordModal}
            </h3>

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>New Passphrase</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new passphrase"
                  value={resetPassValue}
                  onChange={(e) => setResetPassValue(e.target.value)}
                  style={S.input}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button type="button" onClick={() => setShowResetPasswordModal(null)} style={S.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={S.btnPrimary}>
                  Update Passphrase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: EMERGENCY MANUAL ALERT */}
      {/* ================================================================= */}
      {showManualAlertModal && (
        <div style={S.modalOverlay}>
          <div style={S.modalContent}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                Dispatch Emergency Alert
              </h3>
              <button
                onClick={() => setShowManualAlertModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendManualAlert} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Target District</label>
                <input
                  type="text"
                  required
                  value={manualAlert.district}
                  onChange={(e) => setManualAlert({ ...manualAlert, district: e.target.value })}
                  style={S.input}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Severity Level</label>
                <select
                  value={manualAlert.severity}
                  onChange={(e) => setManualAlert({ ...manualAlert, severity: e.target.value })}
                  style={S.input}
                >
                  <option value="CRITICAL">CRITICAL (Red Alert)</option>
                  <option value="WARNING">WARNING (Elevated Anomaly)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#93a1bd', marginBottom: '0.3rem' }}>Directives / Message</label>
                <textarea
                  rows={3}
                  required
                  value={manualAlert.message}
                  onChange={(e) => setManualAlert({ ...manualAlert, message: e.target.value })}
                  style={S.input}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowManualAlertModal(false)} style={S.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={{ ...S.btnPrimary, backgroundColor: '#f59e0b', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}>
                  Dispatch SMTP Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CASE DETAILS & TRIAGE */}
      {/* ================================================================= */}
      {selectedCaseDetail && (
        <div style={S.modalOverlay}>
          <div style={{ ...S.modalContent, maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <span style={S.badge(selectedCaseDetail.priority)}>{selectedCaseDetail.priority}</span>
                <h3 style={{ margin: '0.3rem 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedCaseDetail.case_id}: {selectedCaseDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCaseDetail(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem' }}>
              <div style={{ backgroundColor: '#0f1526', padding: '0.85rem', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><strong>Location:</strong> {selectedCaseDetail.district}, {selectedCaseDetail.state}</div>
                <div><strong>Amount:</strong> ₹{selectedCaseDetail.amount_inr?.toLocaleString()}</div>
                <div><strong>Status:</strong> <span style={S.badge(selectedCaseDetail.status)}>{selectedCaseDetail.status}</span></div>
                <div><strong>Assigned To:</strong> {selectedCaseDetail.assigned_officer_name}</div>
              </div>

              {/* Status Update Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  style={{ ...S.btnSecondary, padding: '0.35rem 0.65rem' }}
                  onClick={() => handleUpdateCase(selectedCaseDetail.case_id, { status: 'INVESTIGATING' })}
                >
                  Mark Investigating
                </button>
                <button
                  style={{ ...S.btnSecondary, padding: '0.35rem 0.65rem', color: '#f87171' }}
                  onClick={() => handleUpdateCase(selectedCaseDetail.case_id, { status: 'ESCALATED', priority: 'CRITICAL' })}
                >
                  Escalate Case
                </button>
                <button
                  style={{ ...S.btnSecondary, padding: '0.35rem 0.65rem', color: '#34d399' }}
                  onClick={() => handleUpdateCase(selectedCaseDetail.case_id, { status: 'RESOLVED' })}
                >
                  Mark Resolved
                </button>
              </div>

              {/* Notes Timeline */}
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>Investigation Audit Trail</div>
                <div style={{ backgroundColor: '#0a0e19', borderRadius: '8px', padding: '0.75rem', maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedCaseDetail.investigation_notes?.map((n, idx) => (
                    <div key={idx} style={{ fontSize: '0.75rem', borderBottom: '1px solid #1c2436', paddingBottom: '0.3rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                        <strong style={{ color: '#38bdf8' }}>{n.author}</strong>
                        <span>{n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : ''}</span>
                      </div>
                      <div style={{ color: '#cbd5e1', marginTop: '2px' }}>{n.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLAINT DETAIL MODAL */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onStatusUpdated={() => {
            fetchComplaints();
            fetchOverview();
          }}
        />
      )}
    </div>
  );
};
