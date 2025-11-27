const BaseModal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <header>
          <h3>{title}</h3>
          <button type="button" onClick={onClose}>
            
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default BaseModal;
