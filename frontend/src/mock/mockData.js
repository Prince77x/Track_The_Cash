export const MOCK_USERS = {
  lea: {
    id: 'usr-lea-01',
    username: 'officer.sharma',
    name: 'Inspector R. Sharma',
    badgeNumber: 'ED-DEL-8492',
    role: 'lea',
    agency: 'Enforcement Directorate / FIU-IND',
  },
  admin: {
    id: 'usr-adm-01',
    username: 'admin.director',
    name: 'Director S. Verma',
    badgeNumber: 'NATGRID-SYS-001',
    role: 'admin',
    agency: 'Central Intelligence Coordination Cell',
  }
};

export const MOCK_ALERTS = [
  {
    id: 'ALT-2026-901',
    timestamp: '2026-09-17 15:42:10',
    atmId: 'ATM-DL-CONN-04',
    bank: 'State Bank of India',
    location: 'Connaught Place, New Delhi',
    coordinates: [28.6315, 77.2167],
    amount: 1850000,
    anomalyType: 'MULE_NETWORK',
    riskScore: 94,
    riskLevel: 'critical',
    status: 'PENDING',
  },
  {
    id: 'ALT-2026-902',
    timestamp: '2026-09-17 15:10:04',
    atmId: 'ATM-MH-BKC-19',
    bank: 'HDFC Bank',
    location: 'BKC, Mumbai',
    coordinates: [19.0662, 72.8687],
    amount: 2400000,
    anomalyType: 'VELOCITY_SPIKE',
    riskScore: 82,
    riskLevel: 'high',
    status: 'INVESTIGATING',
  },
  {
    id: 'ALT-2026-903',
    timestamp: '2026-09-17 14:25:31',
    atmId: 'ATM-KA-MG-08',
    bank: 'ICICI Bank',
    location: 'MG Road, Bengaluru',
    coordinates: [12.9756, 77.6066],
    amount: 950000,
    anomalyType: 'OFF_HOURS_DRAIN',
    riskScore: 61,
    riskLevel: 'medium',
    status: 'INVESTIGATING',
  },
  {
    id: 'ALT-2026-904',
    timestamp: '2026-09-17 13:58:19',
    atmId: 'ATM-WB-PARK-02',
    bank: 'Axis Bank',
    location: 'Park Street, Kolkata',
    coordinates: [22.5510, 88.3526],
    amount: 420000,
    anomalyType: 'RAPID_DISPENSE',
    riskScore: 35,
    riskLevel: 'low',
    status: 'RESOLVED',
  }
];

export const MOCK_HEATMAP_POINTS = [
  { id: 'HP-1', name: 'Delhi NCR Hub', lat: 28.6139, lng: 77.2090, intensity: 0.95, riskLevel: 'high', cashFlowVolume: 85000000 },
  { id: 'HP-2', name: 'Mumbai Financial Corridor', lat: 19.0760, lng: 72.8777, intensity: 0.88, riskLevel: 'high', cashFlowVolume: 92000000 },
  { id: 'HP-3', name: 'Bengaluru Tech Cluster', lat: 12.9716, lng: 77.5946, intensity: 0.65, riskLevel: 'medium', cashFlowVolume: 43000000 },
  { id: 'HP-4', name: 'Hyderabad Cyberabad', lat: 17.3850, lng: 78.4867, intensity: 0.58, riskLevel: 'medium', cashFlowVolume: 38000000 },
  { id: 'HP-5', name: 'Kolkata Central', lat: 22.5726, lng: 88.3639, intensity: 0.42, riskLevel: 'low', cashFlowVolume: 21000000 },
  { id: 'HP-6', name: 'Ahmedabad Industrial Belt', lat: 23.0225, lng: 72.5714, intensity: 0.52, riskLevel: 'medium', cashFlowVolume: 29000000 },
  { id: 'HP-7', name: 'Chennai Port Area', lat: 13.0827, lng: 80.2707, intensity: 0.38, riskLevel: 'low', cashFlowVolume: 18000000 }
];

export const MOCK_SUMMARY_METRICS = {
  totalAlertsToday: 142,
  highRiskAlerts: 18,
  suspectVolume: '₹ 14.82 Cr',
  atmsUnderSurveillance: 384,
  systemLatencyMs: 42,
  auditLogEvents: 1208
};
