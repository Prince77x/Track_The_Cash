# TrackTheCash — Frontend Architecture (Milestone 0)

Advanced Financial Intelligence, ATM Anomaly Tracking, and Money Mule Interception Terminal for Law Enforcement Agencies (LEA) and Financial Intelligence Units (FIU-IND).

## Tech Stack
- **Framework**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS v3 with custom LEA / Government dark design tokens and risk severity palettes (Low / Medium / High / Critical)
- **Routing**: React Router DOM v7
- **State Management**: Zustand stores (`authStore`, `mapStore`)
- **API & Query Layer**: Axios client (JWT interceptor + automatic 401 redirect) + TanStack React Query
- **Geospatial & Visualization**: Leaflet, React-Leaflet, Leaflet.heat, Recharts, Lucide-react
- **Data & Export**: PapaParse, jsPDF

---

## Directory Structure
```
src/
├── api/                    # Axios instance + endpoint services
│   ├── axiosClient.ts      # Auth interceptors (Bearer JWT + 401 handling)
│   ├── authApi.ts          # Login, authentication & user verification
│   ├── heatmapApi.ts       # Spatial heatmap & GeoJSON queries
│   ├── alertsApi.ts        # Threat & velocity alert queries
│   └── adminApi.ts         # System metrics & immutable audit logs
├── store/                  # Zustand persistent state stores
│   ├── authStore.ts        # User credentials, JWT, roles ('lea' | 'admin')
│   └── mapStore.ts         # Coordinates, zoom, risk level filters
├── routes/
│   ├── ProtectedRoute.tsx  # Guard enforcing authentication and role permissions
│   └── AppRouter.tsx       # Core route definitions (/login, /lea, /admin)
├── pages/
│   ├── LoginPage.tsx       # Tactical terminal login with 1-click Judge Demo
│   ├── LEADashboard.tsx    # LEA officer surveillance console
│   └── AdminDashboard.tsx  # Central Intelligence administration center
├── components/
│   ├── map/                # Leaflet & heatmap components
│   ├── charts/             # Recharts velocity & money-flow visualizers
│   ├── alerts/             # Real-time alert cards & severity pills
│   └── shared/             # Tactical Navbar & shared components
├── mock/                   # Mock GeoJSON, alerts & users for offline demo
├── hooks/                  # Custom React & React Query hooks
├── utils/                  # Currency (INR) & date formatters
└── config.ts               # API base URL, refresh intervals, mock toggle
```

---

## Running Locally

```bash
cd frontend
npm install
npm run dev
```

Dev server runs on `http://localhost:5173`.
