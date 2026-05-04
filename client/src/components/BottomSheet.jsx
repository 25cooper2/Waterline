export default function BottomSheet({ open, onClose, children, maxHeight = '90vh' }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 2000,
        background: 'rgba(31,42,38,0.5)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fade-in 180ms ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="sheet"
        style={{
          width: '100%',
          maxHeight,
          overflow: 'auto',
          paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
          animation: 'slide-up 220ms cubic-bezier(.2,.8,.2,1)',
        }}
      >
        <div className="sheet-handle" />
        {children}
      </div>
    </div>
  );
}
