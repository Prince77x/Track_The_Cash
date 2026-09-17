export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK !== 'false', // Default to true for robust offline demo / dev
  REFRESH_INTERVALS: {
    ALERTS: 10000,      // 10s live alert polling
    HEATMAP: 30000,     // 30s heatmap data refresh
    METRICS: 15000,     // 15s summary metrics refresh
  },
  DEFAULT_MAP: {
    CENTER: [20.5937, 78.9629], // Center of India [lat, lng]
    ZOOM: 5,
    MIN_ZOOM: 3,
    MAX_ZOOM: 18,
  },
  RISK_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },
};

export default CONFIG;
