import { useState, useRef } from 'react';
import { API } from '../hooks/useSocket';

function SilentWitness({ guestId, location, hotelId }) {
  const [tapCount, setTapCount]     = useState(0);
  const [activated, setActivated]   = useState(false);
  const [dummyMsg, setDummyMsg]     = useState('');
  const timerRef = useRef(null);

  const handleNormalTap = async (serviceName) => {
    setDummyMsg(`✓ ${serviceName} request received. Staff will assist you shortly.`);
    setTimeout(() => setDummyMsg(''), 3000);

    try {
      await fetch(`${API}/api/alerts/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergencyType: 'SERVICE',
          rawMessage: `Guest requested ${serviceName}`,
          location,
          guestId,
          hotelId
        }),
      });
    } catch (e) {
      console.error('Failed to send service alert', e);
    }
  };

  const handleTap = async () => {
    const next = tapCount + 1;
    setTapCount(next);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setTapCount(0), 8000);

    if (next >= 3) {
      clearTimeout(timerRef.current);
      setTapCount(0);
      setActivated(true);

      await fetch(`${API}/api/alerts/silent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId,
          location,
          hotelId,
          pattern: 'Guest pressed "Request Extra Towels" 3 times within 8 seconds',
        }),
      });
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Looks like a normal hotel service section */}
      <div style={styles.divider}>
        <span style={styles.dividerLine} />
        <span style={styles.dividerText} className="mono">GUEST SERVICES</span>
        <span style={styles.dividerLine} />
      </div>

      <div style={styles.serviceGrid}>
        <button onClick={() => { handleNormalTap('Extra Towels'); handleTap(); }} style={styles.serviceBtn}>
          <span style={styles.serviceIcon}>🛎</span>
          <span style={styles.serviceName}>Extra Towels</span>
        </button>
        <button onClick={() => handleNormalTap('Room Service')} style={styles.serviceBtn}>
          <span style={styles.serviceIcon}>🍽</span>
          <span style={styles.serviceName}>Room Service</span>
        </button>
        <button onClick={() => handleNormalTap('Housekeeping')} style={styles.serviceBtn}>
          <span style={styles.serviceIcon}>🧹</span>
          <span style={styles.serviceName}>Housekeeping</span>
        </button>
        <button onClick={() => handleNormalTap('Concierge')} style={styles.serviceBtn}>
          <span style={styles.serviceIcon}>🔑</span>
          <span style={styles.serviceName}>Concierge</span>
        </button>
      </div>

      {activated && (
        <p style={styles.confirmation} className="mono">
          ✓ SILENT ALERT ACTIVATED. Monitor your surroundings.
        </p>
      )}
      {!activated && dummyMsg && (
        <p style={styles.confirmation} className="mono">
          {dummyMsg}
        </p>
      )}

      {/* Demo hint only — remove before real deployment */}
      <p style={styles.hint}>
        <em>Demo: tap "Extra Towels" 3× quickly for silent welfare check</em>
      </p>
    </div>
  );
}

const styles = {
  wrapper: { marginTop: '32px' },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'var(--border-subtle)',
  },
  dividerText: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    letterSpacing: '2px',
    whiteSpace: 'nowrap',
  },
  serviceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  serviceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'var(--transition)',
    fontFamily: "'DM Sans', sans-serif",
  },
  serviceIcon: { fontSize: '1rem' },
  serviceName: { fontSize: '0.8rem' },
  confirmation: {
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    marginTop: '10px',
    textAlign: 'center',
    letterSpacing: '0.5px',
  },
  hint: {
    color: 'var(--text-muted)',
    fontSize: '0.7rem',
    textAlign: 'center',
    marginTop: '8px',
    opacity: 0.5,
  },
};

export default SilentWitness;
