export default function Dialog({ open, title, message, onClose, actions }) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <h3>{title || "Notice"}</h3>
          <button className="dialog-close" type="button" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        <div className="dialog-body">
          <p>{message}</p>
        </div>
        <div className="dialog-actions">
          {actions || (
            <button className="btn" type="button" onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

