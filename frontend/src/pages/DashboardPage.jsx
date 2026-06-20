import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useToast();

  // Dashboard Stats States
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStockValue: 0,
    totalItemUnits: 0,
    lowStockWarns: 0
  });
  const [categoryValuation, setCategoryValuation] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [recentActivityTab, setRecentActivityTab] = useState('sales'); // 'sales' or 'purchases'
  const [loading, setLoading] = useState(true);

  // SaaS Code visibility
  const [showSaasCode, setShowSaasCode] = useState(false);

  // Feedback form states
  const [shopName, setShopName] = useState('');
  const [rating, setRating] = useState('5');
  const [commentText, setCommentText] = useState('');

  // Sound Synth Helper
  const playSynthSound = (type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'success') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.5);
        osc2.stop(ctx.currentTime + 0.5);
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.setValueAtTime(80, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerAlert = (title, message, type = 'info') => {
    if (type === 'error') playSynthSound('error');
    else if (type === 'success') playSynthSound('success');
    else playSynthSound('click');
    showToast(`${title}: ${message}`, type);
  };

  // Fetch stats from backend API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data.stats);
        setCategoryValuation(res.data.categoryValuation || []);
        setMonthlyRevenue(res.data.monthlyRevenue || []);
        setLowStockAlerts(res.data.lowStockAlerts || []);
        setRecentSales(res.data.recentActivity?.sales || []);
        setRecentPurchases(res.data.recentActivity?.purchases || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!shopName || !commentText) return;

    try {
      await api.post('/comments', {
        shop_name: shopName,
        plan_name: user?.plan_name || 'Starter Shop',
        comment_text: commentText,
        rating: parseInt(rating)
      });
      setShopName('');
      setCommentText('');
      setRating('5');
      triggerAlert('Feedback Saved', 'Your review has been published successfully and is visible on the landing page!', 'success');
    } catch (err) {
      console.error(err);
      triggerAlert('Error', 'Failed to publish review. Please try again.', 'error');
    }
  };

  const handleLogout = () => {
    playSynthSound('click');
    logout();
    navigate('/login');
  };

  const formattedSaasCode = () => {
    const code = user?.saas_code || 'ZIM-XXXX-XXXX';
    if (showSaasCode) return code;
    return 'ZIM-••••-••••';
  };

  const userInitial = () => {
    const email = user?.email || 'A';
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="dashboard-container" style={{ background: 'radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.12), transparent), #030712', color: '#94a3b8', minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        /* Webkit scrollbars for tables */
        .table-responsive::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .table-responsive::-webkit-scrollbar-track {
          background: rgba(2, 6, 23, 0.3);
        }
        .table-responsive::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 3px;
        }
        .table-responsive::-webkit-scrollbar-thumb:hover {
          background: #0ea5e9;
        }

        /* Sidebar item hovers */
        .hover-light-bg:hover {
          background-color: rgba(14, 165, 233, 0.1) !important;
          color: #ffffff !important;
        }

        /* Quick Navigation item overrides */
        .quick-action-item {
          background-color: #0d1222 !important;
          border: 1px solid #1e293b !important;
          color: #94a3b8 !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          border-radius: 12px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 1.25rem 0.75rem !important;
          font-weight: 600 !important;
          font-size: 0.8rem !important;
          text-align: center !important;
        }
        .quick-action-item i {
          font-size: 1.5rem !important;
          margin-bottom: 8px !important;
          transition: transform 0.3s ease !important;
        }
        .quick-action-item:hover {
          background-color: rgba(14, 165, 233, 0.08) !important;
          border-color: #0ea5e9 !important;
          color: #ffffff !important;
          box-shadow: 0 0 15px rgba(14, 165, 233, 0.15) !important;
          transform: translateY(-2px) !important;
        }
        .quick-action-item:hover i {
          transform: scale(1.15) !important;
        }

        /* Table hovering and coloring */
        .table-hover-dark tbody tr {
          border-bottom: 1px solid #1e293b !important;
          transition: all 0.2s ease !important;
        }
        .table-hover-dark tbody tr:hover {
          background-color: rgba(255, 255, 255, 0.02) !important;
        }
        .table-hover-dark th {
          color: #94a3b8 !important;
          border-bottom: 2px solid #1e293b !important;
          font-weight: 600 !important;
          font-family: 'Outfit', sans-serif !important;
        }
        .table-hover-dark td {
          color: #ffffff !important;
          border: none !important;
        }

        /* Form elements focus glow */
        .form-control-premium-dark {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: #0d1222 !important;
          border: 1px solid #1e293b !important;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          color: #ffffff !important;
          transition: all 0.3s ease !important;
        }
        .form-control-premium-dark:focus {
          outline: none !important;
          background-color: #090d16 !important;
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.25) !important;
        }
        .form-control-premium-dark::placeholder {
          color: #64748b;
        }

        /* Styled select */
        select.form-control-premium-dark {
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.75rem center;
          background-repeat: no-repeat;
          background-size: 1.25rem;
          padding-right: 2rem;
        }
      `}</style>
      
      {/* Sidebar navigation */}
      <aside className="new-sidebar" style={{ width: '280px', backgroundColor: '#020617', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', zIndex: 100, borderRight: '1px solid #1e293b' }}>
        <div className="logo-area" style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b' }}>
          <div className="d-flex align-items-center gap-2">
            <i className="fa-solid fa-cubes text-info fs-3" style={{ color: '#0ea5e9' }}></i>
            <div className="logo-text text-white fw-bold d-flex flex-column" style={{ fontSize: '1.2rem', lineHeight: '1.2' }}>
              Zero Inventory
              <span className="text-secondary" style={{ fontSize: '0.65rem', letterSpacing: '0.5px', color: '#94a3b8' }}>MANAGEMENT SYSTEM</span>
            </div>
          </div>
        </div>

        <ul className="sidebar-nav-list" style={{ listStyle: 'none', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1, margin: 0 }}>
          <li className="sidebar-nav-item active" style={{ display: 'block' }}>
            <a href="#dashboard" onClick={() => playSynthSound('click')} className="text-white d-flex align-items-center gap-3 p-2 rounded text-decoration-none" style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
              <i className="fa-solid fa-house text-info" style={{ color: '#0ea5e9' }}></i> Dashboard
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a href="#billing" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-3 p-2 rounded text-decoration-none hover-light-bg" style={{ color: '#94a3b8' }}>
              <i className="fa-solid fa-file-invoice"></i> Generate Bill
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a href="#products" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-3 p-2 rounded text-decoration-none hover-light-bg" style={{ color: '#94a3b8' }}>
              <i className="fa-solid fa-box-open"></i> Products
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a href="#sales" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-3 p-2 rounded text-decoration-none hover-light-bg" style={{ color: '#94a3b8' }}>
              <i className="fa-solid fa-chart-line"></i> Sales
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a href="#purchases" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-3 p-2 rounded text-decoration-none hover-light-bg" style={{ color: '#94a3b8' }}>
              <i className="fa-solid fa-cart-shopping"></i> Purchases
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a href="#inventory" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-3 p-2 rounded text-decoration-none hover-light-bg" style={{ color: '#94a3b8' }}>
              <i className="fa-solid fa-warehouse"></i> Inventory
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a href="#categories" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-3 p-2 rounded text-decoration-none hover-light-bg" style={{ color: '#94a3b8' }}>
              <i className="fa-solid fa-tags"></i> Categories
            </a>
          </li>
        </ul>

        {/* Upgrade Card */}
        <div className="upgrade-pro-card m-3 p-3 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#ffffff', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
          <h5 className="fw-bold fs-6 mb-1">Upgrade to Pro</h5>
          <p className="small mb-3" style={{ fontSize: '0.75rem', opacity: '0.9' }}>Unlock advanced features and grow your business.</p>
          <button className="btn btn-light btn-sm w-100 fw-bold" style={{ color: '#0284c7', borderRadius: '8px' }} onClick={() => triggerAlert('Upgrade System', 'Simulated gateway dashboard update is active.')}>
            Upgrade Now
          </button>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-bottom-user p-3 border-top border-secondary border-opacity-15 d-flex align-items-center justify-content-between text-white" style={{ borderColor: '#1e293b' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="avatar-circle rounded-circle bg-info text-dark d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px', fontSize: '0.95rem', backgroundColor: '#0ea5e9', color: '#020617' }}>
              {userInitial()}
            </div>
            <div style={{ maxWidth: '140px', overflow: 'hidden' }}>
              <div className="fw-bold small" style={{ fontSize: '0.78rem' }}>Merchant Account</div>
              <div className="text-secondary small text-truncate" style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{user?.email || 'merchant@gmail.com'}</div>
            </div>
          </div>
          <button className="btn btn-link text-danger p-0" title="Logout" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket fs-5"></i>
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <main className="new-main" style={{ flexGrow: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column', minHeight: '100vh', width: 'calc(100% - 280px)' }}>
        
        {/* Header Tools */}
        <header className="new-header" style={{ backgroundColor: '#020617', borderBottom: '1px solid #1e293b', height: '70px', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', sticky: 'top', zIndex: 90 }}>
          <div className="d-flex align-items-center gap-3">
            <button className="btn p-0 text-secondary border-0 d-lg-none" id="sidebarToggle"><i className="fa-solid fa-bars fs-5"></i></button>
            <div className="header-search-box d-none d-lg-flex align-items-center px-3 py-1 rounded-pill" style={{ backgroundColor: '#090d16', border: '1px solid #1e293b', width: '320px' }}>
              <i className="fa-solid fa-magnifying-glass text-secondary me-2" style={{ color: '#64748b' }}></i>
              <input type="text" className="bg-transparent border-0 outline-none" style={{ fontSize: '0.85rem', width: '100%', color: '#ffffff' }} placeholder="Search for products, customers, invoices..." />
            </div>
          </div>

          <div className="header-right-tools d-flex align-items-center gap-3">
            {/* SaaS Access Code Widget */}
            <div className="header-saas-box d-flex align-items-center gap-2 px-3 py-1.5 rounded-3 border border-dashed border-info" style={{ backgroundColor: 'rgba(14, 165, 233, 0.05)', borderColor: '#0ea5e9' }}>
              <span className="header-saas-label text-secondary small fw-semibold" style={{ color: '#94a3b8' }}><i className="fa-solid fa-key me-1 text-info" style={{ color: '#0ea5e9' }}></i>SaaS Code:</span>
              <span className="header-saas-value font-monospace text-info fw-bold small" style={{ color: '#0ea5e9' }}>{formattedSaasCode()}</span>
              <button className="btn p-0 border-0" onClick={() => { playSynthSound('click'); setShowSaasCode(!showSaasCode); }} title="Toggle SaaS Code Visibility">
                <i className={`fa-regular ${showSaasCode ? 'fa-eye-slash' : 'fa-eye'} text-secondary`} style={{ color: '#94a3b8' }}></i>
              </button>
            </div>

            <button className="btn p-1 text-secondary" onClick={() => playSynthSound('click')} style={{ color: '#94a3b8' }}><i className="fa-solid fa-gear fs-5"></i></button>
            <div className="position-relative">
              <button className="btn p-1 text-secondary" onClick={() => playSynthSound('click')} style={{ color: '#94a3b8' }}>
                <i className="fa-regular fa-bell fs-5"></i>
                <span className="position-absolute top-1 start-7 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ borderColor: '#020617' }}></span>
              </button>
            </div>
            
            <div className="user-avatar-circle rounded-circle d-flex align-items-center justify-content-center fw-semibold text-info" style={{ width: '32px', height: '32px', fontSize: '0.85rem', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
              {userInitial()}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="content-area p-4" style={{ flexGrow: 1 }}>
          
          {/* Main Title Banner */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h1 className="fs-3 text-white fw-bold mb-1" style={{ fontFamily: 'Outfit' }}>Dashboard</h1>
              <p className="text-secondary small mb-0" style={{ color: '#94a3b8' }}>Welcome back, Merchant! Here's what's happening with your store today.</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div className="px-3 py-2 border rounded-3 shadow-sm text-secondary small fw-medium" style={{ backgroundColor: '#0b0f19', borderColor: '#1e293b', color: '#94a3b8' }}>
                <i className="fa-regular fa-calendar me-2"></i>Jun 20, 2026 - Jun 20, 2026
              </div>
              <button className="btn btn-premium-primary fw-semibold d-flex align-items-center gap-2 shadow-sm" style={{ padding: '0.5rem 1.2rem', borderRadius: '8px' }} onClick={() => triggerAlert('Audit Logs', 'Opening audit logs database records...')}>
                <i className="fa-solid fa-clock-rotate-left"></i> View Audit Reports
              </button>
            </div>
          </div>

          {/* 4 Stat Summary Cards */}
          <div className="row g-4 mb-4">
            <div className="col-sm-6 col-xl-3">
              <div className="metric-card p-4 rounded-4 shadow-sm border d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0b0f19', borderColor: '#1e293b' }}>
                <div className="metric-info">
                  <h3 className="text-secondary text-uppercase fw-semibold mb-1" style={{ fontSize: '0.78rem', letterSpacing: '0.5px', color: '#94a3b8' }}>Total Products</h3>
                  <div className="metric-number text-white fw-extrabold fs-3" style={{ color: '#ffffff' }}>{stats.totalProducts}</div>
                </div>
                <div className="metric-icon-box rounded-3 d-flex align-items-center justify-content-center bg-info bg-opacity-10 text-info" style={{ width: '48px', height: '48px', fontSize: '1.4rem', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                  <i className="fa-solid fa-box"></i>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="metric-card p-4 rounded-4 shadow-sm border d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0b0f19', borderColor: '#1e293b' }}>
                <div className="metric-info">
                  <h3 className="text-secondary text-uppercase fw-semibold mb-1" style={{ fontSize: '0.78rem', letterSpacing: '0.5px', color: '#94a3b8' }}>Total Stock Value</h3>
                  <div className="metric-number text-white fw-extrabold fs-3" style={{ color: '#ffffff' }}>${stats.totalStockValue.toFixed(2)}</div>
                </div>
                <div className="metric-icon-box rounded-3 d-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success" style={{ width: '48px', height: '48px', fontSize: '1.4rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <i className="fa-solid fa-coins"></i>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="metric-card p-4 rounded-4 shadow-sm border d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0b0f19', borderColor: '#1e293b' }}>
                <div className="metric-info">
                  <h3 className="text-secondary text-uppercase fw-semibold mb-1" style={{ fontSize: '0.78rem', letterSpacing: '0.5px', color: '#94a3b8' }}>Total Item Units</h3>
                  <div className="metric-number text-white fw-extrabold fs-3" style={{ color: '#ffffff' }}>{stats.totalItemUnits}</div>
                </div>
                <div className="metric-icon-box rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary" style={{ width: '48px', height: '48px', fontSize: '1.4rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
                  <i className="fa-solid fa-boxes-stacked"></i>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="metric-card p-4 rounded-4 shadow-sm border d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0b0f19', borderColor: '#1e293b' }}>
                <div className="metric-info">
                  <h3 className="text-secondary text-uppercase fw-semibold mb-1" style={{ fontSize: '0.78rem', letterSpacing: '0.5px', color: '#94a3b8' }}>Low Stock Warns</h3>
                  <div className="metric-number text-danger fw-extrabold fs-3" style={{ color: '#ef4444' }}>{stats.lowStockWarns}</div>
                </div>
                <div className="metric-icon-box rounded-3 d-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger" style={{ width: '48px', height: '48px', fontSize: '1.4rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Row: Category Distribution & Valuation (Left) vs Monthly Revenue (Right) */}
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="p-4 rounded-4 shadow-sm border h-100" style={{ backgroundColor: '#0b0f19', borderColor: '#1e293b' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h3 className="fs-6 text-white fw-bold mb-1">Category Distribution & Valuation</h3>
                    <p className="text-secondary small mb-0" style={{ color: '#94a3b8' }}>Real-time asset valuation across your active segments</p>
                  </div>
                  <button className="btn btn-link text-info text-decoration-none small p-0 fw-semibold" style={{ color: '#0ea5e9' }} onClick={() => triggerAlert('Categories', 'Manage category catalog details...')}>Manage Categories</button>
                </div>

                <div className="table-responsive">
                  <table className="table align-middle table-hover-dark">
                    <thead>
                      <tr className="text-secondary small">
                        <th>Category Name</th>
                        <th>Products Count</th>
                        <th>Total Units</th>
                        <th>Asset Valuation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryValuation.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-5 text-secondary" style={{ color: '#64748b' }}>
                            <i className="fa-regular fa-folder-open fa-3x mb-3 text-secondary opacity-30"></i>
                            <p className="small mb-0">No category details registered.</p>
                          </td>
                        </tr>
                      ) : (
                        categoryValuation.map((cat, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold text-white">{cat.categoryName}</td>
                            <td style={{ color: '#94a3b8' }}>{cat.productsCount}</td>
                            <td style={{ color: '#94a3b8' }}>{cat.totalUnits}</td>
                            <td className="fw-semibold text-info" style={{ color: '#0ea5e9' }}>${cat.assetValuation.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="p-4 rounded-4 shadow-sm border h-100" style={{ backgroundColor: '#0b0f19', borderColor: '#1e293b' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h3 className="fs-6 text-white fw-bold mb-1">Monthly Revenue</h3>
                    <p className="text-secondary small mb-0" style={{ color: '#94a3b8' }}>Historical monthly sales run-rate</p>
                  </div>
                  <button className="btn btn-link text-info text-decoration-none small p-0 fw-semibold" style={{ color: '#0ea5e9' }} onClick={() => triggerAlert('Invoices', 'Viewing historical invoices records...')}>View Invoices</button>
                </div>

                <div className="table-responsive">
                  <table className="table align-middle table-hover-dark">
                    <thead>
                      <tr className="text-secondary small">
                        <th>Month</th>
                        <th>Invoices</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyRevenue.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-5 text-secondary" style={{ color: '#64748b' }}>
                            <i className="fa-regular fa-file-lines fa-3x mb-3 text-secondary opacity-30"></i>
                            <p className="small mb-0">No invoices recorded yet.</p>
                          </td>
                        </tr>
                      ) : (
                        monthlyRevenue.map((item, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold text-white">{item.month}</td>
                            <td style={{ color: '#94a3b8' }}>{item.invoices}</td>
                            <td className="fw-semibold text-success" style={{ color: '#10b981' }}>${item.revenue.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Row: Low Stock Alerts (Left), Recent Activity (Middle), Quick Navigation (Right) */}
          <div className="row g-4 mb-4">
            
            {/* Low Stock Alerts */}
            <div className="col-lg-4">
              <div className="p-4 rounded-4 shadow-sm border h-100" style={{ backgroundColor: '#0b0f19', borderColor: '#1e293b' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="fs-6 text-white fw-bold mb-0">Low Stock Alerts</h3>
                  <button className="btn btn-link text-info text-decoration-none small p-0 fw-semibold" style={{ color: '#0ea5e9' }} onClick={() => triggerAlert('Alerts', 'Viewing all stock level warnings...')}>View All</button>
                </div>
                
                {lowStockAlerts.length === 0 ? (
                  <div className="text-center py-5 text-success" style={{ color: '#10b981' }}>
                    <i className="fa-solid fa-circle-check fa-3x mb-3"></i>
                    <p className="small mb-0 fw-semibold">No low stock alerts</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {lowStockAlerts.map(alertItem => (
                      <div key={alertItem._id} className="p-3 rounded-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0d1222', border: '1px solid #1e293b' }}>
                        <div>
                          <div className="fw-bold text-white small">{alertItem.name}</div>
                          <div className="text-secondary font-monospace" style={{ fontSize: '0.7rem', color: '#64748b' }}>SKU: {alertItem.sku}</div>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20 px-2 py-1 small" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                            {alertItem.quantity} / {alertItem.reorder_level} {alertItem.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="col-lg-4">
              <div className="p-4 rounded-4 shadow-sm border h-100" style={{ backgroundColor: '#0b0f19', borderColor: '#1e293b' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="fs-6 text-white fw-bold mb-0">Recent Activity</h3>
                  <div className="d-flex gap-2">
                    <button 
                      className={`btn btn-sm ${recentActivityTab === 'sales' ? 'btn-premium-primary py-1 px-3 text-white fw-bold' : 'text-secondary bg-dark border-0'}`}
                      style={recentActivityTab === 'sales' ? { borderRadius: '6px' } : { backgroundColor: '#1e293b', color: '#94a3b8', borderRadius: '6px' }}
                      onClick={() => { playSynthSound('click'); setRecentActivityTab('sales'); }}
                    >
                      Sales
                    </button>
                    <button 
                      className={`btn btn-sm ${recentActivityTab === 'purchases' ? 'btn-premium-primary py-1 px-3 text-white fw-bold' : 'text-secondary bg-dark border-0'}`}
                      style={recentActivityTab === 'purchases' ? { borderRadius: '6px' } : { backgroundColor: '#1e293b', color: '#94a3b8', borderRadius: '6px' }}
                      onClick={() => { playSynthSound('click'); setRecentActivityTab('purchases'); }}
                    >
                      Purchases
                    </button>
                  </div>
                </div>

                {recentActivityTab === 'sales' ? (
                  recentSales.length === 0 ? (
                    <div className="text-center py-5 text-secondary" style={{ color: '#64748b' }}>
                      <i className="fa-solid fa-receipt fa-2x mb-2 opacity-30"></i>
                      <p className="small mb-0">No recent sales activity</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {recentSales.map(sale => (
                        <div key={sale._id} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid #1e293b' }}>
                          <div>
                            <div className="fw-bold text-white small">{sale.invoice_number}</div>
                            <div className="text-secondary small" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sale.customer_name}</div>
                          </div>
                          <div className="text-end">
                            <div className="fw-semibold text-success small" style={{ color: '#10b981' }}>${sale.grand_total.toFixed(2)}</div>
                            <div className="text-secondary" style={{ fontSize: '0.68rem', color: '#64748b' }}>{new Date(sale.sale_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  recentPurchases.length === 0 ? (
                    <div className="text-center py-5 text-secondary" style={{ color: '#64748b' }}>
                      <i className="fa-solid fa-cart-shopping fa-2x mb-2 opacity-30"></i>
                      <p className="small mb-0">No recent purchases activity</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {recentPurchases.map(purchase => (
                        <div key={purchase._id} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid #1e293b' }}>
                          <div>
                            <div className="fw-bold text-white small">{purchase.purchase_number}</div>
                            <div className="text-secondary small" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{purchase.supplier_name}</div>
                          </div>
                          <div className="text-end">
                            <div className="fw-semibold text-primary small" style={{ color: '#38bdf8' }}>${purchase.grand_total.toFixed(2)}</div>
                            <div className="text-secondary" style={{ fontSize: '0.68rem', color: '#64748b' }}>{new Date(purchase.purchase_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="col-lg-4">
              <div className="p-4 rounded-4 shadow-sm border h-100" style={{ backgroundColor: '#0b0f19', borderColor: '#1e293b' }}>
                <h3 className="fs-6 text-white fw-bold mb-3">Quick Navigation</h3>
                <div className="quick-action-grid">
                  <button className="quick-action-item border-0" onClick={() => triggerAlert('Navigation', 'Redirecting to add new product catalog page...')}>
                    <i className="fa-solid fa-square-plus text-primary" style={{ color: '#38bdf8' }}></i>
                    Add Product
                  </button>
                  <button className="quick-action-item border-0" onClick={() => triggerAlert('Navigation', 'Redirecting to POS checkout sale billing page...')}>
                    <i className="fa-solid fa-cart-shopping text-info" style={{ color: '#0ea5e9' }}></i>
                    New Sale
                  </button>
                  <button className="quick-action-item border-0" onClick={() => triggerAlert('Navigation', 'Redirecting to record purchase inventory list...')}>
                    <i className="fa-solid fa-file-circle-check text-success" style={{ color: '#10b981' }}></i>
                    New Purchase
                  </button>
                  <button className="quick-action-item border-0" onClick={() => triggerAlert('Navigation', 'Redirecting to add customer profiling record...')}>
                    <i className="fa-solid fa-user-plus text-secondary" style={{ color: '#94a3b8' }}></i>
                    Add Customer
                  </button>
                  <button className="quick-action-item border-0" onClick={() => triggerAlert('Navigation', 'Redirecting to register supplier profile form...')}>
                    <i className="fa-solid fa-truck-field text-warning" style={{ color: '#f59e0b' }}></i>
                    Add Supplier
                  </button>
                  <button className="quick-action-item border-0" onClick={() => triggerAlert('Navigation', 'Redirecting to view overall ledger reports...')}>
                    <i className="fa-solid fa-file-invoice-dollar text-danger" style={{ color: '#ef4444' }}></i>
                    View Reports
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Post Shop Feedback (Bottom Card) */}
          <div className="row">
            <div className="col-12">
              <div className="p-4 rounded-4 shadow-sm text-white" style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b' }}>
                <h3 className="fs-5 fw-bold mb-1"><i className="fa-solid fa-star text-warning me-2"></i>Post Shop Feedback</h3>
                <p className="text-secondary small mb-4" style={{ color: '#94a3b8' }}>Share your review about Zero Inventory Management. Your review will publish directly to the landing page "Purchased Shops" feedback list.</p>
                
                <form onSubmit={handleFeedbackSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <div className="form-group mb-0">
                        <label className="form-label text-secondary small mb-1" style={{ color: '#94a3b8' }}>Your Shop Name</label>
                        <input 
                          type="text" 
                          className="form-control-premium-dark" 
                          placeholder="e.g. Apex Apparel Ltd" 
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-0">
                        <label className="form-label text-secondary small mb-1" style={{ color: '#94a3b8' }}>Rating (1 to 5 Stars)</label>
                        <select 
                          className="form-control-premium-dark" 
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                        >
                          <option value="5">5 Stars (Excellent)</option>
                          <option value="4">4 Stars (Good)</option>
                          <option value="3">3 Stars (Average)</option>
                          <option value="2">2 Stars (Poor)</option>
                          <option value="1">1 Star (Very Bad)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-group mb-4">
                    <label className="form-label text-secondary small mb-1" style={{ color: '#94a3b8' }}>Comment / Review</label>
                    <textarea 
                      className="form-control-premium-dark" 
                      style={{ minHeight: '80px' }}
                      placeholder="Share your success story using this software..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <div className="text-end">
                    <button type="submit" className="btn btn-premium-primary px-4 py-2">
                      <i className="fa-solid fa-paper-plane me-2"></i>Publish Review
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default DashboardPage;
