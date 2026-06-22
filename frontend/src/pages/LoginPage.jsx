import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, token, user, loading } = useContext(AuthContext);
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saasCode, setSaasCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Read registration success states if redirected from Checkout
  const { successMessage, generatedCode, registeredEmail } = location.state || {};

  // Redirect to dashboard/admin if user is already logged in
  useEffect(() => {
    if (token && !loading && user) {
      const userPlan = user.plan_name || 'Starter Shop';
      if (userPlan === 'Starter Shop') {
        navigate('/dashboard');
      } else {
        navigate('/admin');
      }
    }
  }, [token, loading, user, navigate]);

  // Pre-fill email from registration state if available
  useEffect(() => {
    if (registeredEmail) {
      setEmail(registeredEmail);
    }
    if (generatedCode) {
      setSaasCode(generatedCode);
    }
  }, [registeredEmail, generatedCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password || !saasCode) {
      setErrorMsg('All fields (Email, Password, and SaaS Code) are required.');
      return;
    }

    const result = await login(email, password, saasCode);
    if (result.success) {
      const loggedInUser = result.user || user;
      const userPlanType = loggedInUser?.plan_type || (loggedInUser?.plan_name === 'Starter Shop' ? 'starter' : 'growth');
      
      if (userPlanType === 'starter') {
        navigate('/dashboard');
      } else {
        navigate('/admin');
      }
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    showToast('SaaS Code copied to clipboard!', 'success');
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.15), transparent), #020617' }}>
      <div className="auth-card">
        <div className="auth-card-header text-center mb-4">
          <div className="auth-card-logo mb-2">
            <button className="btn btn-link text-white text-decoration-none fs-3 fw-bold p-0" onClick={() => navigate('/')}>
              <i className="fa-solid fa-boxes-stacked text-info me-2"></i>Zero<span>Inventory</span>
            </button>
          </div>
          <p className="text-secondary small">Smart SaaS Inventory Management System</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="auth-alert auth-alert-danger d-flex align-items-center gap-2 mb-3">
            <i className="fa-solid fa-circle-exclamation"></i>
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Success Alert with generated SaaS Access Code */}
        {successMessage && generatedCode && (
          <div className="auth-alert auth-alert-success flex-column align-items-start gap-2 mb-4">
            <div className="d-flex align-items-center gap-2">
              <i className="fa-solid fa-circle-check"></i>
              <div>{successMessage}</div>
            </div>
            <div className="w-100 bg-black bg-opacity-50 p-3 rounded text-center border border-info border-opacity-20 mt-2">
              <span className="text-secondary small d-block mb-1" style={{ fontSize: '0.75rem' }}>Your Unique SaaS Access Code</span>
              <span className="code-badge d-inline-block py-1 px-3 fs-5 mb-2 text-info fw-bold font-monospace" id="copyCode">{generatedCode}</span>
              <div className="text-center">
                <button type="button" className="btn btn-sm btn-outline-info" onClick={handleCopyCode}>
                  <i className="fa-regular fa-copy me-1"></i> Copy Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label className="form-label text-white">Email Address</label>
            <div className="input-icon-group">
              <i className="fa-solid fa-envelope"></i>
              <input
                type="email"
                className="form-control-premium"
                placeholder="name@yourshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group mb-3">
            <label className="form-label text-white">Access Password</label>
            <div className="input-icon-group">
              <i className="fa-solid fa-lock"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control-premium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <i
                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle-eye`}
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer' }}
              ></i>
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label text-white">SaaS Access Code</label>
            <div className="input-icon-group">
              <i className="fa-solid fa-key"></i>
              <input
                type="text"
                className="form-control-premium font-monospace text-info fw-bold"
                placeholder="ZIM-XXXX-XXXX"
                value={saasCode}
                onChange={(e) => setSaasCode(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-premium-primary w-100 py-3">
            <i className="fa-solid fa-right-to-bracket me-2"></i>Access Dashboard
          </button>
        </form>

        <div className="text-center mt-4 border-top border-secondary pt-3" style={{ borderColor: 'rgba(255, 255, 255, 0.1) !important' }}>
          <button className="btn btn-link text-secondary small p-0 text-decoration-none" onClick={() => navigate('/')}>
            <i className="fa-solid fa-chevron-left me-1"></i> Return to landing page
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
