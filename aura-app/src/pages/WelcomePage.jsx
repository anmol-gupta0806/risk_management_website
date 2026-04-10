import { useNavigate } from 'react-router-dom';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      
      {/* Subtle background glow effect */}
      <div style={styles.glow} />

      <div style={styles.container}>
        <div style={styles.logoRow}>
          <span style={styles.logoSymbol}>◈</span>
          <h1 style={styles.logoText} className="display">AURA</h1>
        </div>
        <p style={styles.subtitle} className="mono">LUXURY SAFETY PROTOCOL</p>

        <div style={styles.choices}>
          <button 
            style={styles.guestBtn} 
            onClick={() => navigate('/guest/login')}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
          >
            <span className="display" style={{fontSize:'1.5rem'}}>I AM A GUEST</span>
            <span className="mono" style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>Access room emergency system</span>
          </button>
          
          <button 
            style={styles.staffBtn} 
            onClick={() => navigate('/staff/login')}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 59, 59, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span className="display" style={{fontSize:'1.5rem', color: 'var(--critical)'}}>STAFF COMMAND</span>
            <span className="mono" style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>Authentication required</span>
          </button>

          <div style={styles.divider} />
          
          <button 
            style={styles.registerBtn} 
            onClick={() => navigate('/register')}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span className="display" style={{fontSize:'1.1rem', color: 'var(--text-secondary)'}}>REGISTER PROPERTY</span>
            <span className="mono" style={{fontSize:'0.65rem', color:'var(--text-muted)'}}>System onboarding</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-primary)', position: 'relative', overflow: 'hidden' },
  glow: { position: 'absolute', top: '50%', left: '50%', width: '400px', height: '400px', transform: 'translate(-50%, -50%)', background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)', pointerEvents: 'none' },
  container: { textAlign: 'center', padding: '50px 40px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', zIndex: 1, width: '100%', maxWidth: '380px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' },
  logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  logoSymbol: { color: 'var(--critical)', fontSize: '2.5rem' },
  logoText: { fontSize: '4rem', letterSpacing: '8px', margin: 0, lineHeight: 1 },
  subtitle: { fontSize: '0.75rem', letterSpacing: '4px', color: 'var(--text-secondary)', marginBottom: '40px', marginTop: '4px' },
  choices: { display: 'flex', flexDirection: 'column', gap: '16px' },
  guestBtn: { padding: '20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'var(--transition)' },
  staffBtn: { padding: '20px', background: 'transparent', border: '1px solid var(--critical-glow)', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'var(--transition)' },
  registerBtn: { padding: '16px', background: 'transparent', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'var(--transition)', marginTop: '8px' },
  divider: { height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }
};
