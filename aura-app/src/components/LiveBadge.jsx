function LiveBadge({ connected }) {
  return (
    <div style={styles.wrapper}>
      <span
        style={{
          ...styles.dot,
          backgroundColor: connected ? 'var(--safe)' : 'var(--text-muted)',
          animation: connected ? 'blink 2s infinite' : 'none'
        }}
      />
      <span style={styles.label} className="mono">
        {connected ? 'LIVE' : 'OFFLINE'}
      </span>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  label: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    letterSpacing: '1px',
  }
};

export default LiveBadge;
