export default function HeadcountPanel({ safeGuests }) {
  // Sum up all check-in headcounts
  const totalSafe = safeGuests.filter(g => g.status === 'SAFE').reduce((sum, g) => sum + parseInt(g.headcount || 1, 10), 0);
  const totalDanger = safeGuests.filter(g => g.status === 'DANGER').reduce((sum, g) => sum + parseInt(g.headcount || 1, 10), 0);

  const styles = {
    panel: {
      background: 'var(--bg-surface)',
      border: `1px solid ${totalDanger > 0 ? 'var(--critical)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      marginBottom: '24px'
    },
    title: { color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '2px', marginBottom: '16px' },
    summaryRow: { display: 'flex', gap: '20px', marginBottom: '16px' },
    statBox: { display: 'flex', flexDirection: 'column' },
    countSafe: { fontSize: '2.5rem', color: 'var(--safe)', lineHeight: 1 },
    countDanger: { fontSize: '2.5rem', color: 'var(--critical)', lineHeight: 1 },
    outOf: { fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' },
    list: { maxHeight: '200px', overflowY: 'auto' },
    item: { 
      padding: '10px 8px', 
      borderBottom: '1px solid var(--border-subtle)', 
      fontFamily: 'var(--font-mono)', 
      fontSize: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      color: 'var(--text-secondary)'
    },
    itemHeader: { display: 'flex', justifyContent: 'space-between' }
  };

  return (
    <div style={styles.panel}>
      <h3 style={styles.title} className="display">ASSEMBLY HEADCOUNT</h3>
      <div style={styles.summaryRow}>
        <div style={styles.statBox}>
          <span style={styles.countSafe} className="display">{totalSafe}</span>
          <span style={styles.outOf} className="mono">VERIFIED SAFE</span>
        </div>
        <div style={styles.statBox}>
          <span style={styles.countDanger} className="display">{totalDanger}</span>
          <span style={styles.outOf} className="mono">NEED HELP</span>
        </div>
      </div>
      <div style={styles.list}>
        {safeGuests.map((g, i) => {
          const isDanger = g.status === 'DANGER';
          return (
            <div key={i} style={styles.item} className="mono">
              <div style={styles.itemHeader}>
                <span>{g.guestId} ({g.location})</span>
                <span style={{color: isDanger ? 'var(--critical)' : 'var(--safe)', fontWeight: 'bold'}}>
                  {g.status} 
                </span>
              </div>
              <span style={{color: 'var(--text-muted)', fontSize: '0.7rem'}}>
                Headcount: {g.headcount || 1}
              </span>
            </div>
          );
        })}
        {safeGuests.length === 0 && <div style={{...styles.item, border: 'none'}}>Awaiting guest check-ins...</div>}
      </div>
    </div>
  );
}
