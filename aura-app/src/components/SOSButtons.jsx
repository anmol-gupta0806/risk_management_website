import { useState, useRef, useEffect } from 'react';

const EMERGENCY_TYPES = [
  {
    type: 'FIRE',
    emoji: '🔥',
    label: 'FIRE',
    sub: 'Smoke, flames, burning smell',
    color: 'var(--critical)',
    bg: 'var(--critical-bg)',
    glow: 'var(--critical-glow)',
  },
  {
    type: 'MEDICAL',
    emoji: '⚡',
    label: 'MEDICAL',
    sub: 'Injury, illness, unconscious',
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
    glow: 'rgba(245,158,11,0.15)',
  },
  {
    type: 'SECURITY',
    emoji: '🛡',
    label: 'SECURITY',
    sub: 'Intruder, threat, suspicious',
    color: 'var(--info)',
    bg: '#08101a',
    glow: 'rgba(59,130,246,0.15)',
  },
  {
    type: 'OTHER',
    emoji: '⚠',
    label: 'OTHER HELP',
    sub: 'Any other urgent situation',
    color: 'var(--text-secondary)',
    bg: 'var(--bg-elevated)',
    glow: 'rgba(100,100,100,0.1)',
  },
];

function SOSButtons({ onSOS, loading }) {
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const originalMessageRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript;
        }
        setMessage(originalMessageRef.current + finalTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          alert('Mic access denied. Please click the mic icon in your browser address bar and allow access.');
        } else if (event.error !== 'no-speech') {
          alert('Mic error: ' + event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    try {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      } else {
        // Save the current message before overwriting to append speech later
        originalMessageRef.current = message ? message + ' ' : '';
        recognitionRef.current?.start();
        setIsListening(true);
      }
    } catch (e) {
      console.error(e);
      alert('Microphone error: ' + e.message + '. Please ensure permissions are granted.');
      setIsListening(false);
    }
  };

  const handleSelect = (item) => {
    setSelected(item);
    setMessage('');
  };

  const handleSend = () => {
    if (!selected) return;
    onSOS(selected.type, message || `${selected.type} emergency`);
  };

  return (
    <div>
      {/* Instruction line */}
      <p style={styles.instruction} className="mono">
        SELECT EMERGENCY TYPE
      </p>

      {/* 2x2 button grid */}
      <div style={styles.grid}>
        {EMERGENCY_TYPES.map((item, i) => (
          <button
            key={item.type}
            onClick={() => handleSelect(item)}
            style={{
              ...styles.btn,
              borderColor: selected?.type === item.type ? item.color : 'var(--border-default)',
              background: selected?.type === item.type ? item.bg : 'var(--bg-surface)',
              boxShadow: selected?.type === item.type ? `0 0 20px ${item.glow}` : 'none',
              animation: selected?.type === item.type ? 'pulse-ring 2s infinite' : 'none',
              animationDelay: `${i * 0.1}s`,
            }}
          >
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{item.emoji}</span>
            <span style={{ ...styles.btnLabel, color: selected?.type === item.type ? item.color : 'var(--text-primary)' }}>
              {item.label}
            </span>
            <span style={styles.btnSub}>{item.sub}</span>
          </button>
        ))}
      </div>

      {/* Detail box — slides in after selection */}
      {selected && (
        <div style={{...styles.detailBox, borderColor: selected.color, animation: 'fadeUp 0.3s ease'}}>
          <p style={{...styles.detailLabel, color: selected.color}} className="mono">
            {selected.label} SELECTED — ADD DETAILS (OPTIONAL)
          </p>
          <div style={{ position: 'relative' }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Describe the situation. Any language is fine.`}
              rows={3}
              style={styles.textarea}
              autoFocus
            />
            {recognitionRef.current && (
              <button
                onClick={toggleListening}
                style={{
                  ...styles.micBtn,
                  background: isListening ? 'var(--critical)' : 'var(--bg-surface)',
                  color: isListening ? 'white' : 'var(--text-primary)',
                  animation: isListening ? 'pulse-ring 1.5s infinite' : 'none',
                }}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? '🎙️' : '🎤'}
              </button>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={loading}
            style={{
              ...styles.sendBtn,
              background: loading ? 'var(--bg-elevated)' : selected.color,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            className="display"
          >
            {loading ? 'SENDING ALERT...' : `SEND ${selected.label} ALERT`}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  instruction: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    letterSpacing: '2px',
    marginBottom: '12px',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  btn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '6px',
    padding: '16px',
    border: '1px solid',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'var(--transition)',
    textAlign: 'left',
    background: 'var(--bg-surface)',
  },
  btnLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.85rem',
    fontWeight: '500',
    letterSpacing: '1px',
  },
  btnSub: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    lineHeight: 1.3,
  },
  detailBox: {
    marginTop: '16px',
    padding: '16px',
    border: '1px solid',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface)',
  },
  detailLabel: {
    fontSize: '0.7rem',
    letterSpacing: '1px',
    marginBottom: '10px',
  },
  textarea: {
    width: '100%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.95rem',
    padding: '10px 12px',
    paddingRight: '45px',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.6,
  },
  micBtn: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    width: '32px',
    height: '32px',
    border: '1px solid var(--border-default)',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'var(--transition)',
  },
  sendBtn: {
    marginTop: '10px',
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: 'white',
    fontSize: '1rem',
    letterSpacing: '2px',
    transition: 'var(--transition)',
  },
};

export default SOSButtons;
