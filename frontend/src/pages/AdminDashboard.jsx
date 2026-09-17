import React, { useState } from 'react';
import Navbar from '../components/shared/Navbar.jsx';
import { useAuthStore } from '../store/authStore.js';
import {
  Sliders,
  Database,
  Cpu,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [muleSensitivity, setMuleSensitivity] = useState(85);
  const [velocityThreshold, setVelocityThreshold] = useState(1800000);
  const [mockOfflineActive, setMockOfflineActive] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSavePolicies = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-lea-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-lea-900/60 border border-lea-700/50 p-4 rounded-xl backdrop-blur-md">
          <div>
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <h1 className="text-xl font-bold text-white tracking-wide">
                Central Intelligence Administration & System Controls
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervisory Level: <span className="text-amber-400 font-mono">NATGRID LEVEL 4</span> &bull; Authenticated: <span className="text-white font-medium">{user?.name} ({user?.badgeNumber})</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-950/70 border border-emerald-500/30 text-emerald-400">
              <Cpu className="w-3.5 h-3.5 mr-1" />
              INFERENCE ENGINE OK
            </span>
          </div>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-lea-900/70 border border-lea-700/60 p-4 rounded-xl flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sky-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono">FIU INGESTION PIPELINE</div>
              <div className="text-xl font-bold text-white font-mono">48,290 / sec</div>
              <div className="text-[11px] text-emerald-400">Stream healthy &bull; 0 packet drops</div>
            </div>
          </div>

          <div className="bg-lea-900/70 border border-lea-700/60 p-4 rounded-xl flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono">ANOMALY LATENCY</div>
              <div className="text-xl font-bold text-amber-400 font-mono">42 ms</div>
              <div className="text-[11px] text-slate-400">ML Scoring Pipeline P99</div>
            </div>
          </div>

          <div className="bg-lea-900/70 border border-lea-700/60 p-4 rounded-xl flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono">OFFLINE MOCK MODE</div>
              <div className="text-xl font-bold text-white font-mono">
                {mockOfflineActive ? 'ENABLED' : 'DISABLED'}
              </div>
              <div className="text-[11px] text-sky-400">Hackathon Standalone Resilience</div>
            </div>
          </div>
        </div>

        {/* Algorithm Policy Configuration & Audit Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Policy Parameters Form */}
          <div className="bg-lea-900/70 border border-lea-700/60 p-6 rounded-xl space-y-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-lea-700/60">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                ML Heuristics & Threshold Tuning
              </h2>
            </div>

            <form onSubmit={handleSavePolicies} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-mono text-slate-300">
                    Money Mule Cluster Sensitivity Index
                  </label>
                  <span className="font-mono text-amber-400 font-bold">{muleSensitivity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={muleSensitivity}
                  onChange={(e) => setMuleSensitivity(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-lea-800 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Higher values detect subtle cross-bank coordinated withdrawals across geographic radiuses.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-mono text-slate-300">
                    Velocity Spike Trigger Floor (INR)
                  </label>
                  <span className="font-mono text-sky-400 font-bold">
                    ₹ {velocityThreshold.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="5000000"
                  step="100000"
                  value={velocityThreshold}
                  onChange={(e) => setVelocityThreshold(Number(e.target.value))}
                  className="w-full accent-sky-500 h-2 bg-lea-800 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Single ATM window threshold that immediately raises high-risk alerts.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="text-xs font-mono text-slate-300 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={mockOfflineActive}
                    onChange={(e) => setMockOfflineActive(e.target.checked)}
                    className="rounded bg-lea-800 border-lea-700 text-sky-500 focus:ring-0"
                  />
                  <span>Offline Hackathon Mock Data Simulator</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-amber-600/30 transition flex items-center space-x-1.5"
                >
                  {saved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Update Policies</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Audit Logs */}
          <div className="bg-lea-900/70 border border-lea-700/60 p-6 rounded-xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-lea-700/60 mb-4">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-sky-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Immutable Security Audit Trail
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">FIU COMPLIANT</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 bg-lea-850 rounded border border-lea-700/50">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>2026-09-17 15:44:12</span>
                  <span className="text-sky-400">10.24.110.14</span>
                </div>
                <div className="font-semibold text-white mt-1">
                  officer.sharma &bull; DISPATCH_FIELD_UNIT
                </div>
                <div className="text-[11px] text-slate-400">
                  Flagged ATM-DL-CONN-04 for immediate seizure check
                </div>
              </div>

              <div className="p-2.5 bg-lea-850 rounded border border-lea-700/50">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>2026-09-17 15:30:00</span>
                  <span className="text-amber-400">10.24.100.2</span>
                </div>
                <div className="font-semibold text-white mt-1">
                  admin.director &bull; POLICY_UPDATE
                </div>
                <div className="text-[11px] text-slate-400">
                  Decreased velocity spike threshold from ₹25L to ₹18L
                </div>
              </div>

              <div className="p-2.5 bg-lea-850 rounded border border-lea-700/50">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>2026-09-17 14:15:22</span>
                  <span className="text-emerald-400">127.0.0.1</span>
                </div>
                <div className="font-semibold text-white mt-1">
                  system.cron &bull; GEO_SYNC
                </div>
                <div className="text-[11px] text-slate-400">
                  Synced 384 ATM spatial telemetry nodes
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
