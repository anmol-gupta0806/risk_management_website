export default function PredictionPanel({ alerts }) {
  // Simple heuristic for dynamic display
  const hasCritical = alerts.some(a => a.type === 'FIRE' || a.type === 'MEDICAL');

  const styles = {
    panel: {
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderLeft: `3px solid ${hasCritical ? 'var(--critical)' : 'var(--info)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '16px',
    },
    title: { color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '2px', marginBottom: '12px' },
    content: { fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.5 }
  };

  return (
    <div style={styles.panel}>
      <h3 style={styles.title} className="display">AI PREDICTIVE INSIGHTS</h3>
      <div style={styles.content}>
        {hasCritical ? (
          <>
            <span style={{color: 'var(--critical)'}}>[CRITICAL]</span> Evacuation routes compromised near primary sectors. 
            Redirecting emergency responders. Facility lockdown protocols initialized on affected floors.
          </>
        ) : (
          <>
            <span style={{color: 'var(--info)'}}>[SCANNING]</span> Facility nominal. No predictive threats detected in active zones. Staff patrols on standard predictive rotation.
          </>
        )}
      </div>
    </div>
  );
}
