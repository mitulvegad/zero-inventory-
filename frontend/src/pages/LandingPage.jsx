import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('Starter Shop');
  const [activePlanCard, setActivePlanCard] = useState('Growth Shop');
  const [showModal, setShowModal] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Fetch comments/testimonials from the backend API
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await api.get('/comments');
        setComments(res.data);
      } catch (err) {
        console.error('Failed to load testimonials:', err);
      }
    };
    fetchComments();
  }, []);

  const openPurchaseModal = (plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handlePurchaseSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    // Redirect to Checkout page with states passed along
    setShowModal(false);
    navigate('/checkout', {
      state: { email, password, plan_name: selectedPlan }
    });
  };

  return (
    <div>
      {/* Header / Navbar */}
      <header className="landing-header">
        <nav className="navbar navbar-expand-lg">
          <div className="container">
            <a className="navbar-brand" href="#hero">
              <i className="fa-solid fa-boxes-stacked"></i> Zero<span>Inventory</span>
            </a>
            <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span class="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
            </button>
            <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
              <ul className="navbar-nav align-items-center gap-3">
                <li className="nav-item">
                  <a className="nav-link active" href="#hero">Home</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#plans">Plans</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#shops">Purchased Shops</a>
                </li>
                <li className="nav-item">
                  <button className="btn btn-premium-primary" onClick={() => navigate('/login')}>
                    <i className="fa-solid fa-right-to-bracket me-2"></i>Dashboard Login
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <span className="hero-subtitle">Premium SaaS Platform</span>
              <h1 className="hero-title">Eliminate Chaos. Achieve <span>Zero Errors</span>.</h1>
              <p className="hero-desc">Zero Inventory Management is a state-of-the-art SaaS platform built for modern retail shops, warehouses, and digital storefronts. Real-time tracking, secure SaaS codes, and flawless integration.</p>
              <div className="d-flex gap-3">
                <a href="#plans" className="btn btn-premium-primary btn-lg">Explore Plans</a>
                <a href="#shops" className="btn btn-premium-secondary btn-lg">Customer Feedback</a>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div className="position-relative d-inline-block">
                <div className="position-absolute top-50 start-50 translate-middle" style={{ width: '350px', height: '350px', background: 'rgba(14, 165, 233, 0.2)', filter: 'blur(80px)', borderRadius: '50%', zIndex: 0 }}></div>
                <div className="card bg-dark text-white border-secondary p-4 rounded-4 position-relative" style={{ zIndex: 1, maxWidth: '450px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                  <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
                    <span className="fw-bold"><i class="fa-solid fa-circle-nodes text-info me-2"></i>Live Inventory Tracker</span>
                    <span className="badge bg-success">Active</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-secondary">SaaS Code</small>
                    <span className="font-monospace text-info">ZIM-4892-X901</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <small className="text-secondary">Connected Shops</small>
                    <span>3 / 3 Active</span>
                  </div>
                  <div className="text-start mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small>Product Capacity</small>
                      <small className="text-info">82%</small>
                    </div>
                    <div className="progress" style={{ height: '6px', backgroundColor: '#1e293b' }}>
                      <div className="progress-bar bg-info" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Plan Section */}
      <section className="plan-section" id="plans">
        <div className="container">
          <div className="section-header text-center mb-5">
            <span className="section-tag">Pricing Options</span>
            <h2 className="section-title">Select Your Shop Plan</h2>
            <p className="text-secondary">Choose the optimal tier for your business. Every purchase generates a unique, encrypted SaaS credential for secure management access.</p>
          </div>
          <div className="row g-4 justify-content-center">
            {/* Plan 1 */}
            <div className="col-md-4">
              <div 
                className={`pricing-card ${activePlanCard === 'Starter Shop' ? 'selected' : ''}`}
                onClick={() => setActivePlanCard('Starter Shop')}
                style={{ cursor: 'pointer' }}
              >
                <div className="plan-icon"><i className="fa-solid fa-shop"></i></div>
                <h3 className="plan-name">Starter Shop</h3>
                <div className="plan-price">₹1,999<span>/year</span></div>
                <ul className="plan-features">
                  <li><i className="fa-solid fa-circle-check text-info"></i> 1 Connected Shop</li>
                  <li><i className="fa-solid fa-circle-check text-info"></i> Up to 100 Products</li>
                  <li><i className="fa-solid fa-circle-check text-info"></i> Basic Stock Levels</li>
                  <li className="disabled"><i className="fa-solid fa-circle-xmark text-danger"></i> Low Stock Alerts</li>
                  <li className="disabled"><i className="fa-solid fa-circle-xmark text-danger"></i> Custom Comments Board</li>
                </ul>
                <button 
                  className={`btn w-100 ${activePlanCard === 'Starter Shop' ? 'btn-premium-primary' : 'btn-premium-dark'}`}
                  onClick={() => openPurchaseModal('Starter Shop')}
                >
                  Purchase Starter
                </button>
              </div>
            </div>
            {/* Plan 2 */}
            <div className="col-md-4">
              <div 
                className={`pricing-card popular-tag ${activePlanCard === 'Growth Shop' ? 'selected' : ''}`}
                onClick={() => setActivePlanCard('Growth Shop')}
                style={{ cursor: 'pointer' }}
              >
                <div className="plan-icon"><i className="fa-solid fa-store text-info"></i></div>
                <h3 className="plan-name">Growth Shop</h3>
                <div className="plan-price">₹9,999<span>/year</span></div>
                <ul className="plan-features">
                  <li><i className="fa-solid fa-circle-check text-info"></i> 3 Connected Shops</li>
                  <li><i className="fa-solid fa-circle-check text-info"></i> Up to 1,000 Products</li>
                  <li><i className="fa-solid fa-circle-check text-info"></i> Live Stock Badges</li>
                  <li><i className="fa-solid fa-circle-check text-info"></i> Low Stock Email Alerts</li>
                  <li><i className="fa-solid fa-circle-check text-info"></i> Post Customer Testimonials</li>
                </ul>
                <button 
                  className={`btn w-100 ${activePlanCard === 'Growth Shop' ? 'btn-premium-primary' : 'btn-premium-dark'}`}
                  onClick={() => openPurchaseModal('Growth Shop')}
                >
                  Purchase Growth
                </button>
              </div>
            </div>
            {/* Plan 3 */}
            <div className="col-md-4">
              <div 
                className={`pricing-card ${activePlanCard === 'Enterprise Shop' ? 'selected' : ''}`}
                onClick={() => setActivePlanCard('Enterprise Shop')}
                style={{ cursor: 'pointer' }}
              >
                <div className="plan-icon"><i className="fa-solid fa-warehouse"></i></div>
                <h3 className="plan-name">Enterprise Shop</h3>
                <div className="plan-price">₹19,999<span>/year</span></div>
                <ul className="plan-features">
                  <li><i className="fa-solid fa-circle-check text-info"></i> Unlimited Shops</li>
                  <li><i className="fa-solid fa-circle-check text-info"></i> Unlimited Products</li>
                  <li><i className="fa-solid fa-circle-check text-info"></i> Full Real-time Analytics</li>
                  <li><i className="fa-solid fa-circle-check text-info"></i> Custom API Integrations</li>
                  <li><i className="fa-solid fa-circle-check text-info"></i> Dedicated Database Server</li>
                </ul>
                <button 
                  className={`btn w-100 ${activePlanCard === 'Enterprise Shop' ? 'btn-premium-primary' : 'btn-premium-dark'}`}
                  onClick={() => openPurchaseModal('Enterprise Shop')}
                >
                  Purchase Enterprise
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Comments Section */}
      <section className="shops-section" id="shops">
        <div className="container">
          <div className="section-header text-center mb-5">
            <span className="section-tag text-info">Customer Reviews</span>
            <h2 className="section-title">Purchased Shops Feedback</h2>
            <p className="text-secondary">Read about the success of retail shops and store owners who manage their inventory using Zero Inventory Management.</p>
          </div>
          <div className="row g-4">
            {comments.length === 0 ? (
              <div className="col-12 text-center text-secondary py-5">
                <i className="fa-regular fa-comment-dots fa-3x mb-3 text-info"></i>
                <p>No customer reviews are currently available. Be the first to purchase a plan and share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div className="col-md-6 col-lg-4" key={comment._id}>
                  <div className="comment-card">
                    <div className="comment-header">
                      <span className="comment-shop">{comment.shop_name}</span>
                      <span className="comment-plan">{comment.plan_name}</span>
                    </div>
                    <div className="comment-stars mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={`fa-${star <= comment.rating ? 'solid' : 'regular'} fa-star`}
                          style={{ color: star <= comment.rating ? '#f59e0b' : '#475569' }}
                        ></i>
                      ))}
                    </div>
                    <p className="comment-text">"{comment.comment_text}"</p>
                    <div className="comment-author">
                      <div className="author-avatar">
                        {comment.shop_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="author-info">
                        <div className="author-name">Shop Manager</div>
                        <div className="author-date">
                          Joined {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer py-5">
        <div className="container text-center">
          <div className="footer-logo mb-3">
            <i className="fa-solid fa-boxes-stacked text-info"></i> Zero<span>Inventory</span>
          </div>
          <p className="mb-4 text-secondary">Simplifying stock levels, suppliers, and retail connections for global businesses.</p>
          <div className="footer-rights text-secondary small">
            &copy; {new Date().getFullYear()} Zero Inventory Management. All rights reserved. Built with Skyblue, White, and Black theme.
          </div>
        </div>
      </footer>

      {/* Purchase Modal Overlay */}
      {showModal && (
        <div className="modal-overlay active d-flex" style={{ background: 'rgba(2, 6, 23, 0.8)', zIndex: 1050 }}>
          <div className="modal-content-wrapper">
            <button className="close-modal-btn" onClick={() => setShowModal(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <h3 className="modal-title">Purchase Plan</h3>
            <p className="modal-subtitle">You have selected <strong className="text-info">{selectedPlan}</strong></p>
            
            <form onSubmit={handlePurchaseSubmit}>
              <div className="form-group mb-3">
                <label className="form-label text-white">
                  {selectedPlan === 'Starter Shop' ? 'Email Address' : 'Admin Email Address'}
                </label>
                <div className="input-icon-group">
                  <i className="fa-solid fa-envelope"></i>
                  <input
                    type="email"
                    className="form-control-premium"
                    placeholder={selectedPlan === 'Starter Shop' ? 'name@yourshop.com' : 'admin@yourshops.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group mb-4">
                <label className="form-label text-white">
                  {selectedPlan === 'Starter Shop' ? 'Create Password' : 'Create Admin Password'}
                </label>
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
                <small className="text-secondary mt-1 d-block" style={{ fontSize: '0.75rem' }}>Minimum 6 characters required.</small>
                {selectedPlan !== 'Starter Shop' && (
                  <small className="text-info mt-1 d-block fw-bold" style={{ fontSize: '0.78rem' }}>
                    This admin email and password is to handle your multiple shops.
                  </small>
                )}
              </div>
              
              <div className="form-check mb-4">
                <input className="form-check-input" type="checkbox" id="termsCheck" required />
                <label className="form-check-label text-secondary small" htmlFor="termsCheck">
                  I agree to generate a unique SaaS Access Code and bind this license.
                </label>
              </div>
              
              <button type="submit" className="btn btn-premium-primary w-100 py-3">
                <i className="fa-solid fa-credit-card me-2"></i>Complete Purchase & Generate Code
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
