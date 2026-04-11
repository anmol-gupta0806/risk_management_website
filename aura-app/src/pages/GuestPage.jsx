import { useState, useEffect } from 'react';
import SOSButtons from '../components/SOSButtons';
import SilentWitness from '../components/SilentWitness';
import { API, useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';

function GuestPage() {
  const { user } = useAuth(); // Contains { name, room, guestId } securely
  
  const [phase, setPhase] = useState('idle'); // idle → sending → confirmed → safe → evacuation
  const [aiInstruction, setAiInstruction] = useState('');
  const [responseTime, setResponseTime] = useState(null);
  const [alertId, setAlertId] = useState(null);
  const [alertStatus, setAlertStatus] = useState('active'); // active, acknowledged, resolved
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [headcount, setHeadcount] = useState(1);
  const [checkinStatus, setCheckinStatus] = useState('SAFE'); // 'SAFE' or 'DANGER'
  const { socket } = useSocket(user?.hotelId);

  // If user is somehow missing during render while protected route catches up
  if (!user) return null;

  const GUEST_ID = user.guestId;
  const GUEST_ROOM = `Room ${user.room}`;
  const GUEST_NAME = user.name;

  const handleSOS = async (emergencyType, rawMessage) => {
    setPhase('sending');
    const payload = {
      emergencyType,
      rawMessage,
      location: `${GUEST_ROOM}`,
      guestId: GUEST_ID,
      hotelId: user.hotelId,
    };
    try {
      if (!navigator.onLine) throw new Error('Offline');
      
      const res = await fetch(`${API}/api/alerts/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setAiInstruction(data.guestInstruction || 'Stay calm. Help is on the way.');
      setResponseTime(data.estimatedResponse);
      setAlertId(data.alertId);
      setAlertStatus('active');
      setPhase('confirmed');
    } catch (error) {
      // Store locally if offline or fetch failed
      const storedAlerts = JSON.parse(localStorage.getItem('offline_alerts') || '[]');
      storedAlerts.push(payload);
      localStorage.setItem('offline_alerts', JSON.stringify(storedAlerts));
      
      // Tell the user something comforting
      setAiInstruction('Network offline. Alert saved and will auto-send when connection is restored. Please stay safe.');
      setPhase('confirmed');
    }
  };

  useEffect(() => {
    const syncOfflineAlerts = async () => {
      const storedAlerts = JSON.parse(localStorage.getItem('offline_alerts') || '[]');
      if (storedAlerts.length > 0) {
        const remainingAlerts = [];
        for (const alert of storedAlerts) {
          try {
            await fetch(`${API}/api/alerts/report`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(alert),
            });
          } catch (e) {
            remainingAlerts.push(alert);
          }
        }
        if (remainingAlerts.length === 0) {
          localStorage.removeItem('offline_alerts');
        } else {
          localStorage.setItem('offline_alerts', JSON.stringify(remainingAlerts));
        }
      }
    };

    window.addEventListener('online', syncOfflineAlerts);
    return () => window.removeEventListener('online', syncOfflineAlerts);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleMassPrompt = (data) => {
       setPhase('evacuation');
       setBroadcastMsg(data.message);
    };
    const handleAlertUpdated = (updatedAlert) => {
       if (updatedAlert.id === alertId) {
          if (updatedAlert.status === 'resolved') {
             setAlertStatus('resolved');
          } else if (updatedAlert.acknowledgedBy) {
             setAlertStatus('acknowledged');
          }
       }
    };
    socket.on('mass_safety_prompt', handleMassPrompt);
    socket.on('alert_updated', handleAlertUpdated);
    return () => {
       socket.off('mass_safety_prompt', handleMassPrompt);
       socket.off('alert_updated', handleAlertUpdated);
    };
  }, [socket, alertId]);

  const handleMarkSafe = async () => {
    setPhase('safe');
    await fetch(`${API}/api/safety/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId: GUEST_ID,
        guestName: `Guest ${GUEST_ID}`,
        location: 'Assembly Point A',
        hotelId: user.hotelId,
        headcount: headcount,
        status: checkinStatus
      }),
    }).catch(() => {});
  };

  return (
    <div style={styles.page}>
      {/* Subtle scan line effect — gives it that command-center feel */}
      <div style={styles.scanLine} />

      <div style={styles.container}>

        {/* ── Header ─────────────────────────────────────── */}
        <div style={styles.header}>
          <div style={styles.logoRow}>
            <span style={styles.logoSymbol}>◈</span>
            <span style={styles.logoText} className="display">AURA</span>
          </div>
          <p style={styles.logoSub} className="mono">SAFETY PROTOCOL ACTIVE</p>
          <div style={styles.guestBadge} className="mono">
            <span style={styles.badgeDot} />
            {GUEST_ROOM} · {GUEST_ID}
          </div>
        </div>

        {/* ── Idle Phase — show SOS buttons ──────────────── */}
        {phase === 'idle' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <SOSButtons onSOS={handleSOS} loading={false} />
            <SilentWitness guestId={GUEST_ID} location={`${GUEST_ROOM}`} hotelId={user.hotelId} />
          </div>
        )}

        {/* ── Sending Phase ──────────────────────────────── */}
        {phase === 'sending' && (
          <div style={styles.centerBox}>
            <div style={styles.spinner} />
            <p style={styles.sendingText} className="mono">TRANSMITTING ALERT...</p>
            <p style={styles.sendingSub}>AI triage in progress</p>
          </div>
        )}

        {/* ── Confirmed Phase — alert sent ───────────────── */}
        {phase === 'confirmed' && (
          <div style={{...styles.confirmedBox, animation: 'fadeUp 0.4s ease'}}>
            {/* Alert confirmed header */}
            <div style={styles.alertHeader}>
              <span style={styles.alertIcon}>🚨</span>
              <div>
                <p style={styles.alertTitle} className="display">ALERT RECEIVED</p>
                <p style={styles.alertSub} className="mono">
                  Staff notified • {responseTime ? `~${responseTime} min response` : 'Help en route'}
                </p>
              </div>
            </div>

            {/* AI instruction */}
            <div style={styles.instructionBox}>
              <p style={styles.instructionLabel} className="mono">AI INSTRUCTION FOR YOU</p>
              <p style={styles.instructionText}>{aiInstruction}</p>
            </div>

            {/* Timeline — makes it feel real */}
            <div style={styles.timeline}>
              <TimelineStep done label="Alert transmitted" sub="Received by system" />
              <TimelineStep done label="AI triage complete" sub="Severity assessed" />
              <TimelineStep 
                 done={alertStatus === 'acknowledged' || alertStatus === 'resolved'} 
                 label="Staff dispatched" 
                 sub="En route to your location" 
              />
              <TimelineStep 
                 done={alertStatus === 'resolved'} 
                 label="Crisis resolved" 
                 sub="Pending" 
              />
            </div>

            {/* Mark safe button / Headcount */}
            <div style={styles.checkinForm}>
              <p className="mono" style={{fontSize: '0.75rem', marginBottom: '8px', color:'var(--text-secondary)'}}>CHECK-IN DETAILS</p>
              <div style={{display: 'flex', gap: '8px', marginBottom: '12px'}}>
                <div style={{flex: 1}}>
                  <label className="mono" style={{fontSize:'0.65rem', display:'block', marginBottom:'4px', color:'var(--text-muted)'}}>HEADCOUNT</label>
                  <input type="number" min="1" value={headcount} onChange={e => setHeadcount(e.target.value)} style={styles.inputBox} />
                </div>
                <div style={{flex: 2}}>
                  <label className="mono" style={{fontSize:'0.65rem', display:'block', marginBottom:'4px', color:'var(--text-muted)'}}>STATUS</label>
                  <select value={checkinStatus} onChange={e => setCheckinStatus(e.target.value)} style={styles.inputBox}>
                    <option value="SAFE">I AM SAFE</option>
                    <option value="DANGER">I AM IN DANGER</option>
                  </select>
                </div>
              </div>
              <button 
                style={{...styles.safeBtn, background: checkinStatus === 'SAFE' ? 'var(--safe)' : 'var(--critical)'}} 
                className="display" 
                onClick={handleMarkSafe}
              >
                {checkinStatus === 'SAFE' ? '✓ MARK AS SAFE' : '⚠️ I NEED HELP'}
              </button>
            </div>
            <button
               onClick={() => setPhase('idle')}
               style={{...styles.safeBtn, background: 'var(--bg-elevated)', color: 'var(--text-primary)', marginTop: '12px', padding: '10px'}}
               className="mono"
            >
               ⟵ REPORT ANOTHER ISSUE
            </button>
          </div>
        )}

        {/* ── Evacuation Phase ───────────────────────────── */}
        {phase === 'evacuation' && (
          <div style={{ animation: 'fadeUp 0.4s ease', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', animation: 'blink 1s infinite' }}>🚨</div>
            <h2 className="display" style={{ color: 'var(--critical)' }}>EMERGENCY BROADCAST</h2>
            <div style={{ background: 'var(--critical-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--critical)', marginBottom: '24px', textAlign: 'left' }}>
              <p className="mono" style={{ fontSize: '1rem', color: 'white', lineHeight: 1.5 }}>
                {broadcastMsg}
              </p>
            </div>
            <div style={styles.checkinForm}>
              <div style={{display: 'flex', gap: '8px', marginBottom: '12px', textAlign: 'left'}}>
                <div style={{flex: 1}}>
                  <label className="mono" style={{fontSize:'0.65rem', display:'block', marginBottom:'4px', color:'var(--text-muted)'}}>HEADCOUNT</label>
                  <input type="number" min="1" value={headcount} onChange={e => setHeadcount(e.target.value)} style={styles.inputBox} />
                </div>
                <div style={{flex: 2}}>
                  <label className="mono" style={{fontSize:'0.65rem', display:'block', marginBottom:'4px', color:'var(--text-muted)'}}>STATUS</label>
                  <select value={checkinStatus} onChange={e => setCheckinStatus(e.target.value)} style={styles.inputBox}>
                    <option value="SAFE">I AM SAFE</option>
                    <option value="DANGER">I AM IN DANGER</option>
                  </select>
                </div>
              </div>
              <button 
                style={{...styles.safeBtn, background: checkinStatus === 'SAFE' ? 'var(--safe)' : 'var(--critical)'}} 
                className="display" 
                onClick={handleMarkSafe}
              >
                {checkinStatus === 'SAFE' ? '✓ MARK AS SAFE' : '⚠️ I NEED HELP'}
              </button>
            </div>
          </div>
        )}

        {/* ── Safe Phase ─────────────────────────────────── */}
        {phase === 'safe' && (
          <div style={{...styles.safeBox, animation: 'fadeUp 0.4s ease'}}>
            <span style={{...styles.safeIcon, color: checkinStatus === 'SAFE' ? 'var(--safe)' : 'var(--critical)'}}>
              {checkinStatus === 'SAFE' ? '✓' : '⚠️'}
            </span>
            <p style={{...styles.safeTitle, color: checkinStatus === 'SAFE' ? 'var(--safe)' : 'var(--critical)'}} className="display">
              {checkinStatus === 'SAFE' ? 'YOU ARE MARKED SAFE' : 'DANGER LOGGED'}
            </p>
            <p style={styles.safeSub}>
              {checkinStatus === 'SAFE' ? (
                <>Staff have been notified of your location.<br />Please remain at the assembly point.</>
              ) : (
                <>Emergency response teams have received your high-priority status.<br />Please try to stay as safe as possible.</>
              )}
            </p>
            <button
               onClick={() => setPhase('idle')}
               style={{...styles.safeBtn, background: 'var(--bg-elevated)', color: 'var(--text-primary)', marginTop: '20px', padding: '10px', width: 'auto'}}
               className="mono"
            >
               ⟵ REPORT ANOTHER ISSUE
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// Small sub-component — the timeline steps on the confirmed screen
function TimelineStep({ done, label, sub }) {
  return (
    <div style={tlStyles.row}>
      <div style={{
        ...tlStyles.dot,
        background: done ? 'var(--safe)' : 'var(--bg-elevated)',
        borderColor: done ? 'var(--safe)' : 'var(--border-default)',
      }} />
      <div>
        <p style={{ ...tlStyles.label, color: done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {label}
        </p>
        <p style={tlStyles.sub}>{sub}</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '24px 20px 60px',
    position: 'relative',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255,59,59,0.3), transparent)',
    animation: 'scan 6s linear infinite',
    pointerEvents: 'none',
    zIndex: 0,
  },
  container: {
    width: '100%',
    maxWidth: '420px',
    position: 'relative',
    zIndex: 1,
  },
  header: { textAlign: 'center', marginBottom: '32px' },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '4px',
  },
  logoSymbol: { color: 'var(--critical)', fontSize: '1.4rem' },
  logoText: {
    fontSize: '2.8rem',
    color: 'var(--text-primary)',
    letterSpacing: '8px',
  },
  logoSub: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    letterSpacing: '3px',
    marginBottom: '12px',
  },
  guestBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.72rem',
    color: 'var(--text-secondary)',
    letterSpacing: '0.5px',
  },
  badgeDot: {
    width: '6px', height: '6px',
    borderRadius: '50%',
    background: 'var(--safe)',
    animation: 'blink 2s infinite',
  },
  centerBox: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '16px',
    paddingTop: '60px',
  },
  spinner: {
    width: '40px', height: '40px',
    border: '2px solid var(--border-default)',
    borderTop: '2px solid var(--critical)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  sendingText: {
    color: 'var(--critical)',
    fontSize: '0.8rem',
    letterSpacing: '2px',
  },
  sendingSub: { color: 'var(--text-muted)', fontSize: '0.85rem' },
  confirmedBox: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
  },
  alertHeader: {
    display: 'flex', alignItems: 'center',
    gap: '14px', marginBottom: '20px',
  },
  alertIcon: { fontSize: '2rem' },
  alertTitle: { fontSize: '1.6rem', color: 'var(--critical)', letterSpacing: '2px' },
  alertSub: { fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '1px', marginTop: '2px' },
  instructionBox: {
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-md)',
    padding: '14px',
    marginBottom: '20px',
    borderLeft: '3px solid var(--warning)',
  },
  instructionLabel: {
    fontSize: '0.65rem', color: 'var(--warning)',
    letterSpacing: '2px', marginBottom: '6px',
  },
  instructionText: {
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    lineHeight: 1.6,
  },
  timeline: {
    display: 'flex', flexDirection: 'column',
    gap: '12px', marginBottom: '20px',
  },
  safeBtn: {
    width: '100%', padding: '14px',
    background: 'var(--safe)',
    border: 'none', borderRadius: 'var(--radius-md)',
    color: 'white', fontSize: '1rem',
    letterSpacing: '2px', cursor: 'pointer',
    transition: 'var(--transition)',
  },
  safeBox: {
    textAlign: 'center',
    paddingTop: '60px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '16px',
  },
  safeIcon: {
    fontSize: '3rem',
    color: 'var(--safe)',
  },
  safeTitle: {
    fontSize: '2rem',
    color: 'var(--safe)',
    letterSpacing: '3px',
  },
  safeSub: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    lineHeight: 1.8,
    textAlign: 'center',
  },
  checkinForm: {
    background: 'var(--bg-base)',
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-default)',
    marginTop: '10px'
  },
  inputBox: {
    width: '100%',
    padding: '8px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    color: 'white',
    borderRadius: '4px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    boxSizing: 'border-box'
  }
};

const tlStyles = {
  row: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  dot: {
    width: '10px', height: '10px',
    borderRadius: '50%',
    border: '1px solid',
    marginTop: '4px', flexShrink: 0,
  },
  label: { fontSize: '0.85rem', fontWeight: '500' },
  sub: { fontSize: '0.75rem', color: 'var(--text-muted)' },
};

export default GuestPage;
