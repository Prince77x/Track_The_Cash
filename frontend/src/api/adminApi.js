import axiosClient from './axiosClient.js';
import { CONFIG } from '../config.js';
import { MOCK_SUMMARY_METRICS } from '../mock/mockData.js';

const MOCK_AUDIT_LOGS = [
  {
    id: 'LOG-881',
    timestamp: '2026-09-17 15:44:12',
    actor: 'officer.sharma (ED-DEL-8492)',
    action: 'DISPATCH_FIELD_UNIT',
    details: 'Flagged ATM-DL-CONN-04 for immediate seizure check',
    ip: '10.24.110.14',
  },
  {
    id: 'LOG-880',
    timestamp: '2026-09-17 15:30:00',
    actor: 'admin.director (NATGRID-SYS-001)',
    action: 'POLICY_UPDATE',
    details: 'Decreased velocity spike threshold from ₹25L to ₹18L',
    ip: '10.24.100.2',
  },
  {
    id: 'LOG-879',
    timestamp: '2026-09-17 14:15:22',
    actor: 'system.cron',
    action: 'GEO_SYNC',
    details: 'Synced 384 ATM spatial telemetry nodes',
    ip: '127.0.0.1',
  },
];

export const adminApi = {
  getSystemMetrics: async () => {
    if (CONFIG.USE_MOCK_DATA) {
      return MOCK_SUMMARY_METRICS;
    }
    const response = await axiosClient.get('/admin/metrics');
    return response.data;
  },

  getAuditLogs: async () => {
    if (CONFIG.USE_MOCK_DATA) {
      return MOCK_AUDIT_LOGS;
    }
    const response = await axiosClient.get('/admin/audit-logs');
    return response.data;
  },
};

export default adminApi;
