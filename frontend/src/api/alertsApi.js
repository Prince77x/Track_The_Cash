import axiosClient from './axiosClient.js';
import { CONFIG } from '../config.js';
import { MOCK_ALERTS } from '../mock/mockData.js';

export const alertsApi = {
  getAlerts: async (filters) => {
    if (CONFIG.USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      let results = [...MOCK_ALERTS];
      if (filters?.riskLevel && filters.riskLevel !== 'all') {
        results = results.filter((a) => a.riskLevel === filters.riskLevel);
      }
      if (filters?.status) {
        results = results.filter((a) => a.status === filters.status);
      }
      return results;
    }

    const response = await axiosClient.get('/alerts', { params: filters });
    return response.data;
  },

  getAlertById: async (id) => {
    if (CONFIG.USE_MOCK_DATA) {
      return MOCK_ALERTS.find((a) => a.id === id);
    }
    const response = await axiosClient.get(`/alerts/${id}`);
    return response.data;
  },

  updateAlertStatus: async (id, status) => {
    if (CONFIG.USE_MOCK_DATA) {
      const alert = MOCK_ALERTS.find((a) => a.id === id);
      if (alert) {
        alert.status = status;
        return { ...alert };
      }
      throw new Error(`Alert ${id} not found`);
    }

    const response = await axiosClient.patch(`/alerts/${id}/status`, { status });
    return response.data;
  },
};

export default alertsApi;
