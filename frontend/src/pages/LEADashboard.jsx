import React, { useState } from 'react';
import Navbar from '../components/shared/Navbar.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useMapStore } from '../store/mapStore.js';
import { MOCK_ALERTS, MOCK_SUMMARY_METRICS } from '../mock/mockData.js';
import {
  AlertCircle,
  TrendingUp,
  MapPin,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  Filter,
  ArrowUpRight,
  Layers,
  Crosshair,
} from 'lucide-react';

export const LEADashboard = () => {
  const { user } = useAuthStore();
  const { activeRiskFilter, setRiskFilter } = useMapStore();
  const [selectedAlert, setSelectedAlert] = useState(null);

  const filteredAlerts = MOCK_ALERTS.filter((alert) => {
    if (activeRiskFilter === 'all') return true;
    return alert.riskLevel === activeRiskFilter;
  });

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-glow-red';
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'low':
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="min-h-screen bg-lea-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Top Intelligence Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-lea-900/60 border border-lea-700/50 p-4 rounded-xl backdrop-blur-md">
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <h1 className="text-xl font-bold text-white tracking-wide">
                LEA Real-Time Cash Intelligence Grid
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Surveillance Sector: <span className="text-sky-400 font-mono">ALL-INDIA FINANCIAL HUBS</span> &bull; Operator: <span className="text-white font-medium">{user?.name}</span>
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => alert('PDF Intelligence Dossier export triggered.')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-lea-800 hover:bg-lea-700 border border-lea-700 rounded-lg text-xs font-medium text-slate-300 transition"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export PDF Dossier</span>
            </button>
            <button
              onClick={() => alert('CSV Telemetry dump triggered.')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-lea-800 hover:bg-lea-700 border border-lea-700 rounded-lg text-xs font-medium text-slate-300 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV Dump</span>
            </button>
          </div>
        </div>

        {/* Tactical Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-lea-900/70 border border-lea-700/60 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">CRITICAL SUSPECT ALERTS</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 font-mono">
              {MOCK_SUMMARY_METRICS.highRiskAlerts}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
              <span className="text-rose-400 font-semibold">+4</span>
              <span>last 60 mins</span>
            </div>
          </div>

          <div className="bg-lea-900/70 border border-lea-700/60 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">SUSPECT VOLUME (24H)</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {MOCK_SUMMARY_METRICS.suspectVolume}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Across 18 high-risk clusters</div>
          </div>

          <div className="bg-lea-900/70 border border-lea-700/60 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">MONITORED ATMS</span>
              <MapPin className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {MOCK_SUMMARY_METRICS.atmsUnderSurveillance}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center space-x-1">
              <span>99.8% Online Telemetry</span>
            </div>
          </div>

          <div className="bg-lea-900/70 border border-lea-700/60 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">TOTAL ALERTS TODAY</span>
              <AlertCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-sky-400 font-mono">
              {MOCK_SUMMARY_METRICS.totalAlertsToday}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">ML Anomaly Detection Active</div>
          </div>
        </div>

        {/* Risk Filter Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-lea-900/40 p-3 rounded-xl border border-lea-800">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-300">Filter By Risk Level:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'critical', 'high', 'medium', 'low'].map((level) => (
              <button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
                  activeRiskFilter === level
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                    : 'bg-lea-850 hover:bg-lea-800 text-slate-400 border border-lea-700'
                }`}
              >
                {level === 'all' ? 'All Risk Levels' : level}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Tactical Map & Live Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Spatial Heatmap / Map Shell */}
          <div className="lg:col-span-2 bg-lea-900/70 border border-lea-700/60 rounded-xl overflow-hidden flex flex-col h-[480px]">
            <div className="p-3 bg-lea-850 border-b border-lea-700/60 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crosshair className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  Spatial Heatmap & ATM Surveillance Map (Leaflet)
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Active Layer: Heatmap + Risk Hotspots</span>
              </div>
            </div>

            {/* Tactical Map Container */}
            <div className="flex-1 relative bg-gradient-to-br from-lea-950 via-lea-900 to-lea-950 flex flex-col items-center justify-center p-6 text-center">
              {/* Tactical Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d_1px,transparent_1px),linear-gradient(to_bottom,#1f293d_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
              
              <div className="relative z-10 max-w-md space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center animate-pulse">
                  <MapPin className="w-8 h-8 text-sky-400" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Spatial Engine Ready: Leaflet + Heatmap Extension
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time geographic clusters (Delhi NCR, Mumbai BKC, Bengaluru Tech Corridor) configured. Ready for full interactive Leaflet tile rendering in Milestone 1.
                </p>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-lea-800 border border-lea-700 text-xs font-mono text-sky-300">
                  <span>LAT: 20.5937° N</span>
                  <span>&bull;</span>
                  <span>LNG: 78.9629° E</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Alerts Feed Stub */}
          <div className="bg-lea-900/70 border border-lea-700/60 rounded-xl flex flex-col h-[480px]">
            <div className="p-3 bg-lea-850 border-b border-lea-700/60 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  Active Threat Signals ({filteredAlerts.length})
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">REALTIME</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert.id)}
                  className={`p-3 rounded-lg border transition cursor-pointer ${
                    selectedAlert === alert.id
                      ? 'bg-lea-800 border-sky-500 shadow-md'
                      : 'bg-lea-850/70 hover:bg-lea-800/80 border-lea-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-white">{alert.atmId}</span>
                      <div className="text-[11px] text-slate-400">{alert.location}</div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded uppercase ${getRiskBadgeClass(alert.riskLevel)}`}>
                      {alert.riskLevel}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-lea-700/40">
                    <span className="text-slate-400 font-mono">
                      ₹ {(alert.amount).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/40">
                      {alert.anomalyType}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{alert.bank}</span>
                    <div className="flex items-center space-x-1 text-slate-400 hover:text-sky-300">
                      <span>Investigate</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
};

export default LEADashboard;
