import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register, setToken, setUser } = useContext(AuthContext);
  const { showToast } = useToast();

  // Retrieve state parameters passed from Landing Page
  const { email, password, plan_name } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [statusHeading, setStatusHeading] = useState('Contacting Payment Gateway...');
  const [statusMsg, setStatusMsg] = useState('Verifying bank details, please do not close this page.');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Redirect back if page is accessed directly without state
  useEffect(() => {
    if (!email || !password || !plan_name) {
      navigate('/');
    }
  }, [email, password, plan_name, navigate]);

  // Compute plan price
  let price = 1999;
  if (plan_name === 'Growth Shop') {
    price = 9999;
  } else if (plan_name === 'Enterprise Shop') {
    price = 19999;
  }

  const handlePayNow = () => {
    setLoading(true);
    setPaymentSuccess(false);
    setStatusHeading('Contacting Payment Gateway...');
    setStatusMsg('Verifying bank details, please do not close this page.');

    // Simulate logs pipeline to gateway
    setTimeout(() => {
      setStatusHeading('Processing Card Payment...');
      setStatusMsg('Authorizing credit transaction at card network...');
    }, 1500);

    setTimeout(() => {
      setStatusHeading('Settling Account Balance...');
      setStatusMsg('Securing merchant portal token encryption...');
    }, 3200);

    // After exactly 5 seconds, transition to "Payment is Complete" success state
    setTimeout(() => {
      setPaymentSuccess(true);
      setStatusHeading('Payment is Complete');
      setStatusMsg('Your payment was processed successfully. Generating credentials...');
    }, 5000);

    // Handle registration and redirects after the 5s gateway finishes
    setTimeout(async () => {
      const result = await register(email, password, plan_name);
      if (result.success) {
        if (plan_name === 'Starter Shop') {
          // Flow 1: Redirect to standard login page
          navigate('/login', {
            state: {
              successMessage: 'Payment successful! Your unique SaaS access code has been generated.',
              generatedCode: result.saas_code,
              registeredEmail: result.email
            }
          });
        } else {
          // Flow 2: Set token and redirect directly to Admin Page
          setToken(result.token);
          navigate('/admin', {
            state: {
              justRegistered: true,
              successMessage: 'Payment successful! Your multi-shop admin account is active.',
              generatedCode: result.saas_code,
              registeredEmail: result.email
            }
          });
        }
      } else {
        setLoading(false);
        setPaymentSuccess(false);
        showToast(result.message || 'Registration failed. Please try again.', 'error');
      }
    }, 6500);
  };

  return (
    <div className="checkout-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.15), transparent), #020617', padding: '2rem' }}>
      
      {/* Screen Payment Animation Overlay */}
      {loading && (
        <div 
          id="paymentAnimationOverlay" 
          className="payment-overlay active" 
          style={{ 
            display: 'flex', 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(2, 6, 23, 0.8)', 
            backdropFilter: 'blur(16px)', 
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 9999 
          }}
        >
          <div className="payment-modal">
            <div className="mb-4" style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!paymentSuccess ? (
                // Rotating Spinner Ring
                <div className="anim-spinner-ring"></div>
              ) : (
                // Success Checkmark
                <div className="success-icon-wrapper">
                  <i className="fa-solid fa-check"></i>
                </div>
              )}
            </div>
            
            <h3 className="text-white mb-2 fs-4">{statusHeading}</h3>
            <p className={`small ${paymentSuccess ? 'text-success fw-bold' : 'text-secondary pulse-text'}`}>{statusMsg}</p>
            
            <div className="mt-4 p-2 bg-black bg-opacity-40 rounded border border-secondary border-opacity-10">
              <span className="text-secondary small d-block mb-1">Transaction Value</span>
              <span className="text-info fw-bold fs-5">₹{price.toLocaleString('en-IN')} INR</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Checkout Card */}
      <div className="checkout-card">
        <div className="text-center mb-4">
          <div className="fs-2 fw-bold text-white mb-2">
            <i className="fa-brands fa-paypal text-info me-2"></i>PayPal Checkout
          </div>
          <p className="text-secondary small">Complete your payment securely to generate your SaaS code</p>
        </div>

        {/* Order Summary Box */}
        <div className="summary-box">
          <h4 className="text-white border-bottom border-secondary pb-2 mb-3" style={{ fontSize: '1.1rem' }}>Order Details</h4>
          
          <div className="summary-row">
            <span>Selected Plan:</span>
            <span className="summary-value fw-bold text-info">{plan_name}</span>
          </div>
          <div className="summary-row">
            <span>Account Email:</span>
            <span className="summary-value">{email}</span>
          </div>
          <div className="summary-row">
            <span>Currency:</span>
            <span className="summary-value">INR (₹)</span>
          </div>
          
          <div className="summary-row border-top border-secondary pt-3 mt-3">
            <span>Total Amount:</span>
            <span className="summary-value summary-total" style={{ color: '#0ea5e9', fontWeight: 'bold', fontSize: '1.25rem' }}>₹{price.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Pay Now Button */}
        <button className="btn btn-premium-primary w-100 py-3 mb-4 fs-5" onClick={handlePayNow}>
          <i className="fa-solid fa-credit-card me-2"></i>Pay Now (₹{price.toLocaleString('en-IN')})
        </button>

        <div className="text-center mt-4 border-top border-secondary pt-3" style={{ borderColor: 'rgba(255, 255, 255, 0.1) !important' }}>
          <button className="btn btn-link text-secondary small p-0 text-decoration-none" onClick={() => navigate('/')}>
            <i className="fa-solid fa-chevron-left me-1"></i> Cancel order & return
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
