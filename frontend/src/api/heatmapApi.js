import axiosClient from './axiosClient.js';
import { CONFIG } from '../config.js';
import { MOCK_HEATMAP_POINTS } from '../mock/mockData.js';

export const heatmapApi = {
  getHeatmapPoints: async (filters) => {
    if (CONFIG.USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (filters?.riskLevel && filters.riskLevel !== 'all') {
        return MOCK_HEATMAP_POINTS.filter((p) => p.riskLevel === filters.riskLevel);
      }
      return MOCK_HEATMAP_POINTS;
    }

    const response = await axiosClient.get('/heatmap', { params: filters });
    return response.data;
  },

  getGeoJsonCorridors: async () => {
    if (CONFIG.USE_MOCK_DATA) {
      return {
        type: 'FeatureCollection',
        features: MOCK_HEATMAP_POINTS.map((pt) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [pt.lng, pt.lat],
          },
          properties: {
            id: pt.id,
            name: pt.name,
            riskLevel: pt.riskLevel,
            intensity: pt.intensity,
            cashFlowVolume: pt.cashFlowVolume,
          },
        })),
      };
    }

    const response = await axiosClient.get('/heatmap/geojson');
    return response.data;
  },
};

export default heatmapApi;
