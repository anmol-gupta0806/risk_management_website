import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { API } from './hooks/useSocket'; // if we want to use the global API variable

function StaffDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Contains staff details including hotelId


  // Fetch the live alerts from the backend
  const fetchAlerts = async () => {
    if (!user || !user.hotelId) return;
    try {
      const response = await fetch(`${API}/api/alerts?hotelId=${user.hotelId}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (Array.isArray(data)) {
        setAlerts(data);
      } else {
        setAlerts([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  };

  // Helper to resolve/delete an alert
  const resolveAlert = async (id) => {
    try {
      await fetch(`${API}/api/resolve-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      // Remove it from the screen instantly
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  // Poll the server every 2 seconds to see if new alerts came in
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2000);
    return () => clearInterval(interval); // cleanup
  }, []);

  // Visual helper
  const getBadgeInfo = (type) => {
    switch (type) {
      case 'FIRE': return { class: 'badge-fire', emoji: '🔥' };
      case 'MEDICAL': return { class: 'badge-medical', emoji: '🚑' };
      case 'SECURITY': return { class: 'badge-security', emoji: '👮' };
      default: return { class: 'badge-general', emoji: '⚠️' };
    }
  };

  return (
    <div className="dashboard-container">
      <h2 className="dash-title">Staff Command Center</h2>
      <p className="dash-subtitle">Live Crisis Monitoring — {user?.hotelName || 'Unknown Hotel'}</p>

      <div className="alert-list">
        {!user && <p>Authentication required...</p>}
        {loading && user && <p>Connecting to secure server...</p>}
        {!loading && alerts.length === 0 && (
          <p style={{textAlign: 'center', margin: '20px', color: '#666', fontWeight: 'bold'}}>
            All clear. No active emergencies! ✅
          </p>
        )}

        {alerts.map(alert => {
          const badge = getBadgeInfo(alert.type);
          const isCritical = alert.type === 'FIRE' || alert.type === 'MEDICAL';

          return (
            <div key={alert.id} className={`alert-card ${isCritical ? 'critical' : 'low'}`}>
              <div className="alert-header">
                <span className={`badge ${badge.class}`}>
                  {badge.emoji} {alert.type}
                </span>
                <span className="time">{alert.time}</span>
              </div>
              <p className="alert-text">User triggered a {alert.type} emergency from the guest app.</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <small className="location">Location: Tracking...</small>
                
                <button 
                  onClick={() => resolveAlert(alert.id)}
                  style={{
                    background: '#1a1a1a', color: 'white', padding: '6px 14px', 
                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StaffDashboard;