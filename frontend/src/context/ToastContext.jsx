import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, active: false, removing: true } : toast
      )
    );
    // Remove from array after transition completes (400ms)
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 400);
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, active: false, removing: false };

    setToasts((prev) => [...prev, newToast]);

    // Slide-in animation trigger
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id ? { ...toast, active: true } : toast
        )
      );
    }, 50);

    // Auto dismiss after 4 seconds (4000ms)
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  }, [dismissToast]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return 'fa-solid fa-circle-check';
      case 'danger':
      case 'error':
        return 'fa-solid fa-circle-xmark';
      case 'warning':
        return 'fa-solid fa-triangle-exclamation';
      case 'info':
      default:
        return 'fa-solid fa-circle-info';
    }
  };

  const getToastClass = (type) => {
    if (type === 'error') return 'toast-danger';
    return `toast-${type}`; // toast-success, toast-warning, toast-info, toast-danger
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-card ${getToastClass(toast.type)} ${toast.active ? 'active' : ''} ${toast.removing ? 'removing' : ''}`}
          >
            <div className="toast-icon">
              <i className={getIcon(toast.type)}></i>
            </div>
            <div className="toast-content">{toast.message}</div>
            <button className="toast-close" onClick={() => dismissToast(toast.id)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            {/* Animate progress bar corresponding to 4s auto-dismiss */}
            <div className="toast-progress" style={{ animationDuration: '4s' }}></div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
