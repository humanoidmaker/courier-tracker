import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewParcel from './pages/NewParcel';
import Parcels from './pages/Parcels';
import ParcelDetail from './pages/ParcelDetail';
import Drivers from './pages/Drivers';
import TrackParcel from './pages/TrackParcel';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/track" element={<TrackParcel />} />
        <Route path="/track/:trackingNumber" element={<TrackParcel />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/new-parcel" element={<NewParcel />} />
                  <Route path="/parcels" element={<Parcels />} />
                  <Route path="/parcels/:id" element={<ParcelDetail />} />
                  <Route path="/drivers" element={<Drivers />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}
