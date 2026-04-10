import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../hooks/useSocket';

export default function StaffLogin() {
  const [hotelId, setHotelId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [staffName, setStaffName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginStaff } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!passcode || !hotelId || !staffName) {
      setError('Hotel ID, Passcode, and Name required.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId, passcode, staffName })
      });
      const data = await res.json();
      
      if (data.success) {
        loginStaff({ token: data.token, hotelId: data.hotelId, hotelName: data.hotelName, name: data.name });
        navigate('/staff');
      } else {
        setError('ACCESS DENIED. INVALID CLEARANCE.');
        setPasscode(''); // clear it
      }
    } catch (err) {
      setError('Cannot reach command server.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} className="mono" onClick={() => navigate('/')}>← BACK</button>
      <div style={styles.container}>
        <div style={styles.shield}>🛡</div>
        <h2 className="display" style={styles.title}>RESTRICTED ACCESS</h2>
        <p className="mono" style={styles.subtitle}>STAFF CLEARANCE REQUIRED</p>
        
        <form onSubmit={handleLogin} style={styles.form}>
          {error && <div style={{...styles.error, animation: 'blink 1s 3'}} className="mono">{error}</div>}
          
          <input 
            style={{...styles.input, fontSize: '1rem', letterSpacing: '2px'}} 
            type="text" 
            value={staffName} 
            onChange={e => setStaffName(e.target.value)} 
            placeholder="STAFF NAME"
            className="mono"
            autoFocus
          />
          <input 
            style={{...styles.input, fontSize: '1rem', letterSpacing: '2px'}} 
            type="text" 
            value={hotelId} 
            onChange={e => setHotelId(e.target.value.toLowerCase())} 
            placeholder="HOTEL ID"
            className="mono"
          />
          <input 
            style={styles.input} 
            type="password" 
            value={passcode} 
            onChange={e => setPasscode(e.target.value)} 
            placeholder="••••••••"
            className="mono"
          />
          
          <button type="submit" style={styles.btn} className="mono" disabled={loading}>
            {loading ? 'AUTHENTICATING...' : 'AUTHORIZE'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: '20px', left: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' },
  container: { background: 'var(--bg-base)', padding: '40px', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '360px', border: '1px solid var(--border-strong)', textAlign: 'center' },
  shield: { fontSize: '3rem', marginBottom: '10px', filter: 'grayscale(1) brightness(2)' },
  title: { fontSize: '2.5rem', color: 'var(--critical)', marginBottom: '4px' },
  subtitle: { fontSize: '0.7rem', letterSpacing: '2px', color: 'var(--text-secondary)', marginBottom: '40px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  error: { color: 'var(--critical)', fontSize: '0.8rem', background: 'var(--critical-bg)' },
  input: { background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: '16px', color: 'white', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', outline: 'none' },
  btn: { background: 'var(--critical)', border: 'none', color: 'white', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '1rem', letterSpacing: '4px', cursor: 'pointer', fontWeight: 'bold' }
};
