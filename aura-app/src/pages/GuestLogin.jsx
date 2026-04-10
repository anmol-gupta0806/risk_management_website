import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../hooks/useSocket';

export default function GuestLogin() {
  const [searchParams] = useSearchParams();
  const [hotelId, setHotelId] = useState(searchParams.get('hotel') || '');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginGuest } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name || !room || !hotelId) {
      setError('Please provide Hotel ID, name and room number.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId, name, room })
      });
      const data = await res.json();
      
      if (data.success) {
        loginGuest({ guestId: data.guestId, name: data.name, room: data.room, token: data.token, hotelId: data.hotelId, hotelName: data.hotelName });
        navigate('/guest');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Cannot connect to server');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} className="mono" onClick={() => navigate('/')}>← BACK</button>
      <div style={styles.container}>
        <h2 className="display" style={styles.title}>GUEST CHECK-IN</h2>
        <p className="mono" style={styles.subtitle}>SECURE EMERGENCY PORTAL</p>
        
        <form onSubmit={handleLogin} style={styles.form}>
          {error && <div style={styles.error} className="mono">{error}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label} className="mono">HOTEL ID</label>
            <input 
              style={styles.input} 
              type="text" 
              value={hotelId} 
              onChange={e => setHotelId(e.target.value.toLowerCase())} 
              placeholder="e.g. aura-hq"
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label} className="mono">NAME</label>
            <input 
              style={styles.input} 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label} className="mono">ROOM NUMBER</label>
            <input 
              style={styles.input} 
              type="text" 
              value={room} 
              onChange={e => setRoom(e.target.value)} 
              placeholder="e.g. 402"
            />
          </div>
          
          <button type="submit" style={styles.btn} className="display" disabled={loading}>
            {loading ? 'VERIFYING...' : 'ACCESS PORTAL'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: '20px', left: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' },
  container: { background: 'var(--bg-surface)', padding: '40px', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '360px', border: '1px solid var(--border-default)' },
  title: { fontSize: '2.5rem', color: 'var(--text-primary)', marginBottom: '4px', textAlign: 'center' },
  subtitle: { fontSize: '0.7rem', letterSpacing: '2px', color: 'var(--text-secondary)', marginBottom: '30px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  error: { color: 'var(--critical)', fontSize: '0.8rem', background: 'var(--critical-bg)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--critical)' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '1px' },
  input: { background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px', color: 'white', fontFamily: 'var(--font-body)', outline: 'none' },
  btn: { background: 'var(--bg-hover)', border: '1px solid var(--border-default)', color: 'white', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '1.2rem', letterSpacing: '2px', cursor: 'pointer', marginTop: '10px', transition: 'background 0.2s' }
};
