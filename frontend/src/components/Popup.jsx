export default function Popup({ title, message, onYes, onClose, okOnly }) {
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-box" onClick={(e) => e.stopPropagation()}>
        <div className="popup-title">{title}</div>
        <div className="popup-msg">{message}</div>
        <div className="popup-btns">
          {okOnly ? (
            <button className="popup-btn ok" onClick={onClose}>OK</button>
          ) : (
            <>
              <button className="popup-btn no" onClick={onClose}>No</button>
              <button className="popup-btn yes" onClick={() => { onYes && onYes(); onClose(); }}>Yes</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
