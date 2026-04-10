import { useState, useEffect } from 'react';

export default function AlertCard({ alert, onResolve, onAcknowledge }) {
  const [progress, setProgress] = useState(0);

  // Maximum time for crisis bar is 120 seconds
  const MAX_CRISIS_TIME_MS = 120000; 

  useEffect(() => {
    if (alert.acknowledgedBy) {
      setProgress(0); // Optional: clear or freeze it. Let's keep it but change color.
      return;
    }

    const calculateProgress = () => {
      if (!alert.createdAt) return 0;
      const elapsed = Date.now() - alert.createdAt;
      const percentage = Math.min(100, (elapsed / MAX_CRISIS_TIME_MS) * 100);
      return percentage;
    };

    setProgress(calculateProgress());

    const interval = setInterval(() => {
      setProgress(calculateProgress());
    }, 1000);

    return () => clearInterval(interval);
  }, [alert.createdAt, alert.acknowledgedBy]);

  const isIoT = alert.type === 'IOT_SENSOR';
  // Compute styling traits
  const isSevere = alert.isSevere || progress > 80 || alert.type === 'FIRE' || alert.type === 'MEDICAL';
  const isAcknowledged = !!alert.acknowledgedBy;

  let cardBg = 'var(--bg-surface)';
  let cardBorder = 'var(--border-default)';
  let badgeBg = 'var(--warning)';

  if (alert.status === 'resolved') {
    cardBg = 'rgba(255, 255, 255, 0.05)';
    cardBorder = 'var(--border-subtle)';
    badgeBg = 'var(--text-muted)';
  } else if (isAcknowledged) {
    cardBg = 'rgba(0, 255, 128, 0.05)'; // slight green tint
    cardBorder = 'var(--safe)';
  } else if (isSevere) {
    cardBg = 'var(--critical-bg)';
    cardBorder = 'var(--critical)';
  }

  if (alert.status !== 'resolved') {
    if (isIoT) badgeBg = '#8b5cf6'; // Purple for IoT
    else if (isSevere) badgeBg = 'var(--critical)';
  }

  const styles = {
    card: {
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      marginBottom: '16px',
      position: 'relative',
      overflow: 'hidden',
      animation: 'fadeUp 0.3s ease',
      transition: 'all 0.3s ease',
    },
    header: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' },
    typeBadge: {
      padding: '4px 8px',
      borderRadius: '4px',
      background: badgeBg,
      color: '#fff',
      fontSize: '0.8rem',
      fontWeight: 'bold',
      letterSpacing: '1px'
    },
    time: { color: 'var(--text-muted)', fontSize: '0.8rem' },
    message: { fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '16px', color: 'var(--text-primary)' },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' },
    location: { fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' },
    btnGroup: { display: 'flex', gap: '8px' },
    resolveBtn: {
      background: 'transparent',
      border: '1px solid var(--text-muted)',
      color: 'var(--text-primary)',
      padding: '6px 12px',
      cursor: 'pointer',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.75rem',
      transition: 'var(--transition)'
    },
    ackBtn: {
      background: 'var(--warning)',
      border: 'none',
      color: 'black',
      padding: '6px 12px',
      cursor: 'pointer',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      transition: 'var(--transition)'
    },
    ackText: {
      color: 'var(--safe)',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.75rem',
      fontWeight: 'bold'
    },
    progressBarContainer: {
      height: '4px',
      background: 'rgba(255,255,255,0.1)',
      width: '100%',
      position: 'absolute',
      bottom: 0,
      left: 0,
    },
    progressBar: {
      height: '100%',
      width: `${progress}%`,
      background: isAcknowledged ? 'var(--safe)' : isSevere ? 'var(--critical)' : 'var(--warning)',
      transition: 'width 1s linear, background 0.3s ease',
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <div style={styles.typeBadge} className="display">{alert.type}</div>
          {alert.isSevere && !isAcknowledged && <span style={{fontSize:'0.7rem', color:'var(--critical)', fontWeight:'bold'}}>CRITICAL</span>}
        </div>
        <div style={styles.time} className="mono">{alert.time}</div>
      </div>
      <p style={styles.message}>"{alert.message || 'No additional details provided by guest.'}"</p>
      <div style={styles.footer}>
        <div style={styles.location}>📍 {alert.location} | ID: {alert.guestId}</div>
        <div style={styles.btnGroup}>
          {!isAcknowledged && alert.status !== 'resolved' && (
            <button 
              style={styles.ackBtn} 
              onClick={() => onAcknowledge && onAcknowledge(alert.id)}
            >
              TAKE RESPONSIBILITY
            </button>
          )}
          {alert.status !== 'resolved' && isAcknowledged && (
            <span style={styles.ackText}>✓ responsibility taken by {alert.acknowledgedBy}</span>
          )}
          {alert.status === 'resolved' && (
            <span style={styles.ackText}>✓ resolved by {alert.resolvedBy || alert.acknowledgedBy || 'Staff'}</span>
          )}
          {alert.status !== 'resolved' && (
            <button 
              style={styles.resolveBtn} 
              onClick={() => onResolve(alert.id)}
              onMouseEnter={(e) => { e.target.style.background = 'var(--text-primary)'; e.target.style.color = 'var(--bg-base)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-primary)'; }}
            >
              RESOLVE
            </button>
          )}
        </div>
      </div>

      {/* Crisis Bar */}
      {alert.status !== 'resolved' && (
      <div style={styles.progressBarContainer}>
        <div style={styles.progressBar}></div>
      </div>
      )}
    </div>
  );
}
