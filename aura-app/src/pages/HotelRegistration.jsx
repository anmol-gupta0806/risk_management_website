import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../hooks/useSocket';

export default function HotelRegistration() {
  const [hotelId, setHotelId] = useState('');
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [mapBase64, setMapBase64] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Map file must be smaller than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setMapBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!hotelId || !name || !passcode || !mapBase64) {
      setError('Please complete all fields and upload a map.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API}/api/hotels/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId, name, passcode, mapBase64 })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/staff/login'), 2000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Cannot connect to server. Is the backend running?');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.successContainer}>
          <div style={styles.successIcon}>✓</div>
          <h2 className="display" style={styles.title}>PROPERTY REGISTERED</h2>
          <p className="mono" style={{...styles.subtitle, color: 'var(--safe)'}}>
            System initialized. Redirecting to Staff Command...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} className="mono" onClick={() => navigate('/')}>← BACK</button>
      
      <div style={styles.container}>
        <h2 className="display" style={styles.title}>NEW PROPERTY</h2>
        <p className="mono" style={styles.subtitle}>INITIALIZE AURA DEPLOYMENT</p>
        
        <form onSubmit={handleRegister} style={styles.form}>
          {error && <div style={styles.error} className="mono">{error}</div>}
          
          <div style={styles.inputGroup}>
            <label style={styles.label} className="mono">PROPERTY NAME</label>
            <input 
              style={styles.input} 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. The Ritz-Carlton"
              autoFocus
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} className="mono">UNIQUE HOTEL ID</label>
            <input 
              style={{...styles.input, textTransform: 'lowercase'}} 
              type="text" 
              value={hotelId} 
              onChange={e => setHotelId(e.target.value.replace(/\s+/g, '-').toLowerCase())} 
              placeholder="e.g. ritz-123"
            />
            <small style={styles.hintMenu}>Guests will use this ID to connect.</small>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label} className="mono">STAFF CLEARANCE CODE</label>
            <input 
              style={styles.input} 
              type="password" 
              value={passcode} 
              onChange={e => setPasscode(e.target.value)} 
              placeholder="Master Passcode"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} className="mono">HOTEL EVACUATION MAP</label>
            <input 
              style={styles.fileInput} 
              type="file" 
              accept="image/*,application/pdf"
              onChange={handleFileChange} 
            />
            {mapBase64 && <small style={{color: 'var(--safe)'}}>✓ Map loaded successfully</small>}
          </div>
          
          <button type="submit" style={styles.btn} className="display" disabled={loading}>
            {loading ? 'INITIALIZING...' : 'DEPLOY AURA SYSTEM'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: '20px', left: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' },
  container: { background: 'var(--bg-surface)', padding: '40px', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', border: '1px solid var(--border-default)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  successContainer: { textAlign: 'center', padding: '40px' },
  successIcon: { fontSize: '4rem', color: 'var(--safe)', marginBottom: '20px', animation: 'pulse-ring 2s infinite' },
  title: { fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '4px', textAlign: 'center', letterSpacing: '2px' },
  subtitle: { fontSize: '0.7rem', letterSpacing: '3px', color: 'var(--text-secondary)', marginBottom: '30px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  error: { color: 'var(--critical)', fontSize: '0.8rem', background: 'var(--critical-bg)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--critical)' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '1px' },
  hintMenu: { fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '-4px' },
  input: { background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px', color: 'white', fontFamily: 'var(--font-body)', outline: 'none', transition: 'border 0.2s' },
  fileInput: { background: 'var(--bg-elevated)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' },
  btn: { background: 'transparent', border: '1px solid var(--safe)', color: 'var(--safe)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '1rem', letterSpacing: '2px', cursor: 'pointer', marginTop: '10px', transition: 'all 0.3s', textTransform: 'uppercase' }
};
