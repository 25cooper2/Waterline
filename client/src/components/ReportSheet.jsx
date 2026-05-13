import { useState } from 'react';
import BottomSheet from './BottomSheet';

const REASONS = [
  { value: 'spam_scam', label: 'Spam or scam' },
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'sexual_content', label: 'Sexual or explicit content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'off_topic', label: 'Off-topic / not boating-related' },
  { value: 'other', label: 'Other' },
];

export default function ReportSheet({ open, onClose, onSubmit, targetLabel = 'this content' }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason) return;
    setBusy(true);
    setError('');
    try {
      await onSubmit(reason, details.trim() || null);
      setSubmitted(true);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const handleClose = () => {
    setReason('');
    setDetails('');
    setSubmitted(false);
    setError('');
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={handleClose}>
      <div style={{ padding: '20px 20px 8px' }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Report submitted</div>
            <p style={{ fontSize: 14, color: 'var(--silt)', margin: '0 0 20px', lineHeight: 1.5 }}>
              We'll review {targetLabel} and take action if it violates our community guidelines.
            </p>
            <button className="btn primary block" onClick={handleClose}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Report {targetLabel}</div>
            <p style={{ fontSize: 14, color: 'var(--silt)', margin: '0 0 14px', lineHeight: 1.45 }}>
              What's the problem?
            </p>
            {REASONS.map(r => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                style={{
                  display: 'block', width: '100%',
                  padding: '12px 14px', marginBottom: 6,
                  background: reason === r.value ? 'var(--moss-soft)' : 'var(--linen)',
                  border: reason === r.value ? '1.5px solid var(--moss)' : '1.5px solid transparent',
                  borderRadius: 'var(--r-md)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
                  color: reason === r.value ? 'var(--moss-dark)' : 'var(--ink)',
                  textAlign: 'left',
                }}
              >
                {r.label}
              </button>
            ))}
            {reason && (
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Any additional details? (optional)"
                maxLength={500}
                rows={3}
                style={{
                  width: '100%', marginTop: 8, padding: '10px 12px',
                  border: '1px solid var(--reed)', borderRadius: 'var(--r-md)',
                  fontFamily: 'var(--font-sans)', fontSize: 14, resize: 'none',
                  boxSizing: 'border-box', background: 'var(--paper)',
                  color: 'var(--ink)',
                }}
              />
            )}
            {error && (
              <p style={{ color: 'var(--rust)', fontSize: 13, margin: '8px 0 0' }}>{error}</p>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, paddingBottom: 4 }}>
              <button className="btn ghost" style={{ flex: 1 }} onClick={handleClose}>
                Cancel
              </button>
              <button
                className="btn primary"
                style={{ flex: 1 }}
                disabled={!reason || busy}
                onClick={handleSubmit}
              >
                {busy ? 'Sending…' : 'Submit report'}
              </button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
