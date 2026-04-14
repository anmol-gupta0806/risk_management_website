import { useState, useEffect } from 'react';
import LiveBadge from '../components/LiveBadge';
import AlertCard from '../components/AlertCard';
import HeadcountPanel from '../components/HeadcountPanel';
import PredictionPanel from '../components/PredictionPanel';
import { useSocket, API } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';

export default function StaffPage() {
  const { user } = useAuth();
  const { socket, connected } = useSocket(user?.hotelId);
  const [alerts, setAlerts] = useState([]);
  const [safeGuests, setSafeGuests] = useState([]);

  // Evacuation Draft State
  const [showEvacModal, setShowEvacModal] = useState(false);
  const [incidentDetails, setIncidentDetails] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [drafting, setDrafting] = useState(false);

  // Dead Man Switch State
  const [activeDispatchId, setActiveDispatchId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(90);

  // Fetch initial data
  useEffect(() => {
    if (!user?.hotelId) return;
    
    fetch(`${API}/api/alerts?hotelId=${user.hotelId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAlerts(data);
        } else {
          setAlerts([]);
        }
      })
      .catch(err => console.error("Could not fetch initial alerts", err));
  }, [user]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewAlert = (newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
    };

    const handleAlertUpdated = (updatedAlert) => {
<<<<<<< HEAD
      setAlerts(prev => {
         const newAlerts = prev.map(a => a.id === updatedAlert.id ? updatedAlert : a);
         
         // If a staff is marked unresponsive, maybe we want to play an alarm locally? (skipped for now)
         
         // Update local active dispatch check
         const myName = user?.name || 'Staff';
         const myDispatch = newAlerts.find(a => a.status !== 'resolved' && a.dispatchedTo === myName && !a.unresponsive);
         if (myDispatch && !activeDispatchId) {
             setActiveDispatchId(myDispatch.id);
             setTimeLeft(90);
         } else if (!myDispatch && activeDispatchId) {
             setActiveDispatchId(null);
         }

         return newAlerts;
      });
=======
      setAlerts(prev => prev.map(a => a.id === updatedAlert.id ? updatedAlert : a));
      if (updatedAlert.status === 'resolved') {
        setSafeGuests([]);
      }
>>>>>>> 536a07ad08b4cbe6283cc9d8c5f0e29f97b6439f
    };

    const handleCriticalityEscalated = (data) => {
      setAlerts(prev => prev.map(a => a.type === data.type ? { ...a, isSevere: true } : a));
    };

    const handleGuestSafe = (data) => {
      setSafeGuests(prev => [...prev, data]);
    };

    socket.on('new_alert', handleNewAlert);
    socket.on('alert_updated', handleAlertUpdated);
    socket.on('criticality_escalated', handleCriticalityEscalated);
    socket.on('guest_safe', handleGuestSafe);

    return () => {
      socket.off('new_alert', handleNewAlert);
      socket.off('alert_updated', handleAlertUpdated);
      socket.off('criticality_escalated', handleCriticalityEscalated);
      socket.off('guest_safe', handleGuestSafe);
    };
  }, [socket, activeDispatchId, user?.name]);

  useEffect(() => {
    if (!activeDispatchId) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeDispatchId]);

  const handleResolve = async (id) => {
    try {
      await fetch(`${API}/api/resolve-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, staffName: user?.name || 'Staff' })
      });
      // Updating will happen via socket 'alert_updated'
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await fetch(`${API}/api/alerts/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, staffName: user?.name || 'Staff' })
      });
      // Updating will happen via socket 'alert_updated'
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispatch = async (id) => {
    try {
      await fetch(`${API}/api/alerts/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, staffName: user?.name || 'Staff' })
      });
      setActiveDispatchId(id);
      setTimeLeft(90);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePingAlive = async () => {
    if (!activeDispatchId) return;
    try {
      await fetch(`${API}/api/alerts/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeDispatchId, staffName: user?.name || 'Staff' })
      });
      setTimeLeft(90);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerIoT = async () => {
    try {
      await fetch(`${API}/api/iot/sensor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hotelId: user.hotelId, 
          sensorType: 'HEAT', 
          reading: 85, 
          threshold: 60,
          location: 'Kitchen Area'
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAI = async () => {
    if (!incidentDetails) return;
    setDrafting(true);
    try {
      const res = await fetch(`${API}/api/intelligence/evacuation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: user.hotelId, incidentDetails })
      });
      const data = await res.json();
      if (data.success) {
        setAiDraft(data.instruction);
      } else {
        setAiDraft(`[AI ERROR] ${data.message}. Please input manual instructions.`);
      }
    } catch (err) {
      setAiDraft("[AI ERROR] Failed to connect to intelligence server. Please command manually.");
    }
    setDrafting(false);
  };

  const handleBroadcast = async () => {
    if (!aiDraft) return;
    try {
      await fetch(`${API}/api/alerts/mass-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: user.hotelId, message: aiDraft })
      });
      setShowEvacModal(false);
      setIncidentDetails('');
      setAiDraft('');
      // Optional: show a quick success toast
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.page}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 className="display" style={styles.title}>COMMAND CENTER</h1>
          <p className="mono" style={styles.subtitle}>AURA PROTOCOL SECURE OVERVIEW — {user?.hotelName?.toUpperCase()}</p>
        </div>
        <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
          <button 
            style={styles.iotBtn} 
            className="mono" 
            onClick={handleTriggerIoT}
          >
            🧪 TRIGGER IOT HEAT
          </button>
          <button 
            style={styles.evacBtn} 
            className="mono" 
            onClick={() => setShowEvacModal(true)}
          >
            ⚠️ DRAFT EVACUATION
          </button>
          <LiveBadge connected={connected} />
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div style={styles.grid}>
        
        {/* LEFT COLUMN: Insights & Intel */}
        <div style={styles.colLeft}>
          <HeadcountPanel safeGuests={safeGuests} />
          <PredictionPanel alerts={alerts} />
        </div>

        {/* RIGHT COLUMN: The Live Feed */}
        <div style={styles.colRight}>
          <div style={styles.feedHeader}>
            <span className="mono">LIVE INCIDENT FEED</span>
            <span className="mono" style={{color: 'var(--text-muted)'}}>{alerts.filter(a => a.status !== 'resolved').length} ACTIVE</span>
          </div>
          
          <div style={styles.feed}>
            {alerts.filter(a => a.status !== 'resolved').length === 0 ? (
              <div style={styles.emptyState} className="mono">NO ACTIVE INCIDENTS. SYSTEM NOMINAL.</div>
            ) : (
              alerts.filter(a => a.status !== 'resolved').map(a => (
                <AlertCard key={a.id} alert={a} onResolve={handleResolve} onAcknowledge={handleAcknowledge} onDispatch={handleDispatch} />
              ))
            )}
          </div>

          <div style={{...styles.feedHeader, marginTop: '40px'}}>
            <span className="mono">PAST EMERGENCIES (LAST 2 HOURS)</span>
            <span className="mono" style={{color: 'var(--text-muted)'}}>{alerts.filter(a => a.status === 'resolved').length} RESOLVED</span>
          </div>
          
          <div style={{...styles.feed, opacity: 0.7}}>
            {alerts.filter(a => a.status === 'resolved').length === 0 ? (
              <div style={styles.emptyState} className="mono">NO RECENT RESOLVED INCIDENTS.</div>
            ) : (
              alerts.filter(a => a.status === 'resolved').map(a => (
                <AlertCard key={a.id} alert={a} onResolve={handleResolve} onAcknowledge={handleAcknowledge} onDispatch={handleDispatch} />
              ))
            )}
          </div>
        </div>

      </div>

      {/* EVACUATION MODAL OVERLAY */}
      {showEvacModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 className="display" style={{color: 'var(--critical)', margin: 0}}>EVACUATION BROADCAST</h2>
              <button 
                onClick={() => setShowEvacModal(false)}
                style={{background:'transparent', border:'none', color:'white', cursor:'pointer', fontSize:'1.2rem'}}
              >✕</button>
            </div>
            
            <p className="mono" style={{fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '20px'}}>
              Describe the incident to generate AI-assisted safe routing, or write instructions manually.
            </p>

            <div style={{marginBottom: '16px'}}>
              <label className="mono" style={styles.label}>INCIDENT LOCATION/DETAILS</label>
              <input 
                type="text" 
                value={incidentDetails}
                onChange={(e) => setIncidentDetails(e.target.value)}
                placeholder="e.g. Fire detected in West Wing Kitchen"
                style={styles.input}
              />
            </div>

            <button 
              onClick={handleGenerateAI} 
              style={styles.aiBtn} 
              disabled={drafting || !incidentDetails}
              className="mono"
            >
              {drafting ? "ANALYZING MAP..." : "⚡ GENERATE A.I. ROUTE"}
            </button>

            <div style={{marginBottom: '20px', marginTop: '16px'}}>
              <label className="mono" style={styles.label}>BROADCAST MESSAGE (EDITABLE)</label>
              <textarea 
                value={aiDraft}
                onChange={(e) => setAiDraft(e.target.value)}
                placeholder="Type or generate instructions here. These will be blasted to ALL guests."
                style={styles.textarea}
                rows={4}
              />
            </div>

            <button 
              onClick={handleBroadcast} 
              style={styles.broadcastBtn}
              className="display"
              disabled={!aiDraft}
            >
              BROADCAST TO ALL GUESTS
            </button>
          </div>
        </div>
      )}

      {/* DEAD MAN'S SWITCH FLOATING UI */}
      {activeDispatchId && (
        <div style={styles.deadManPanel}>
          <div style={styles.deadManHeader} className="mono">DEAD MAN'S SWITCH</div>
          <div style={styles.deadManSub} className="mono">YOU ARE DISPATCHED TO A THREAT ZONE</div>
          <div style={{...styles.deadManTimer, color: timeLeft <= 15 ? 'var(--critical)' : 'white'}} className="display">
            {timeLeft}s
          </div>
          <button style={styles.deadManBtn} onClick={handlePingAlive} className="display">
            I AM OKAY
          </button>
          <div style={{fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center'}} className="mono">FAILING TO RESPOND ESCALATES STATUS TO UNRESPONSIVE</div>
        </div>
      )}

    </div>
  );
}

const styles = {
  page: { padding: '40px', maxWidth: '1200px', margin: '0 auto', background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', borderBottom: '1px solid var(--border-default)', paddingBottom: '20px' },
  title: { fontSize: '3rem', color: 'var(--text-primary)', letterSpacing: '4px', lineHeight: 1, margin: 0 },
  subtitle: { color: 'var(--critical)', fontSize: '0.8rem', letterSpacing: '2px', marginTop: '8px' },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '40px', alignItems: 'flex-start' },
  colLeft: { display: 'flex', flexDirection: 'column' },
  colRight: { display: 'flex', flexDirection: 'column' },
  feedHeader: { display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' },
  feed: { display: 'flex', flexDirection: 'column' },
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' },
  evacBtn: { background: 'rgba(255, 59, 59, 0.1)', color: 'var(--critical)', border: '1px solid var(--critical)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '1px' },
  iotBtn: { background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: '1px solid #8b5cf6', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '1px' },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { background: 'var(--bg-surface)', border: '1px solid var(--critical-glow)', borderRadius: '12px', padding: '30px', width: '90%', maxWidth: '500px', boxShadow: '0 0 40px rgba(255, 59, 59, 0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  label: { display: 'block', fontSize: '0.7rem', color: 'white', letterSpacing: '1px', marginBottom: '8px' },
  input: { width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'white', padding: '12px', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', background: 'var(--bg-base)', border: '1px dashed var(--critical)', color: 'white', padding: '12px', borderRadius: '6px', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-body)', boxSizing: 'border-box', lineHeight: 1.4 },
  aiBtn: { width: '100%', background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)', color: 'black', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '1px' },
  broadcastBtn: { width: '100%', background: 'var(--critical)', color: 'white', border: 'none', padding: '16px', borderRadius: '6px', cursor: 'pointer', fontSize: '1.2rem', letterSpacing: '2px', fontWeight: 'bold' },
  deadManPanel: { position: 'fixed', bottom: '40px', right: '40px', background: 'var(--bg-surface)', border: '2px solid var(--critical)', borderRadius: '16px', padding: '24px', width: '320px', boxShadow: '0 0 50px rgba(255,59,59,0.3)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  deadManHeader: { color: 'var(--critical)', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px' },
  deadManSub: { color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '4px', textAlign: 'center' },
  deadManTimer: { fontSize: '4rem', margin: '20px 0', lineHeight: 1 },
  deadManBtn: { width: '100%', padding: '20px', fontSize: '1.5rem', background: 'var(--safe)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', letterSpacing: '3px', transition: 'transform 0.1s' }
};
