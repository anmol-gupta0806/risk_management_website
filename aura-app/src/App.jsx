import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import WelcomePage from './pages/WelcomePage';
import GuestLogin from './pages/GuestLogin';
import StaffLogin from './pages/StaffLogin';
import HotelRegistration from './pages/HotelRegistration';
import GuestPage from './pages/GuestPage';
import StaffPage from './pages/StaffPage';
import './index.css';

// A tiny wrapper component to protect routes
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  
  if (loading) return null; // Wait for local storage to load
  
  if (!user) {
    // Not logged in at all
    return <Navigate to={`/${role}/login`} replace />;
  }
  
  if (user.role !== role) {
    // Logged in, but wrong role
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Welcome & Login */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/register" element={<HotelRegistration />} />
          <Route path="/guest/login" element={<GuestLogin />} />
          <Route path="/staff/login" element={<StaffLogin />} />

          {/* Protected Routes */}
          <Route 
            path="/guest" 
            element={
              <ProtectedRoute role="guest">
                <GuestPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staff" 
            element={
              <ProtectedRoute role="staff">
                <StaffPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;