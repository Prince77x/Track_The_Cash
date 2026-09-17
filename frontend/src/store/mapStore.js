import { create } from 'zustand';
import { CONFIG } from '../config.js';

export const useMapStore = create((set) => ({
  center: CONFIG.DEFAULT_MAP.CENTER,
  zoom: CONFIG.DEFAULT_MAP.ZOOM,
  activeRiskFilter: 'all',
  selectedAlertId: null,
  activeLayer: 'both',
  timeRangeHours: 24,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setRiskFilter: (activeRiskFilter) => set({ activeRiskFilter }),
  setSelectedAlertId: (selectedAlertId) => set({ selectedAlertId }),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
  setTimeRangeHours: (timeRangeHours) => set({ timeRangeHours }),
  resetView: () =>
    set({
      center: CONFIG.DEFAULT_MAP.CENTER,
      zoom: CONFIG.DEFAULT_MAP.ZOOM,
      selectedAlertId: null,
      activeRiskFilter: 'all',
    }),
}));

export default useMapStore;
