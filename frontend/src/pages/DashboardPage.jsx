import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext, api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useToast();

  const { justRegistered, generatedCode } = location.state || {};
  const [showSaasKeyAlert, setShowSaasKeyAlert] = useState(true);
  const saasCode = user?.saas_code || generatedCode || 'ZIM-XXXX-XXXX';

  const handleCopyCode = () => {
    playSynthSound('click');
    navigator.clipboard.writeText(saasCode);
    showToast('SaaS Code copied to clipboard!', 'success');
  };

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

  // Sound Synth Helper (Disabled to remove all sound effects)
  const playSynthSound = (type) => {};

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
    <div className="dashboard-container" style={{ backgroundColor: '#f8fafc', color: '#475569', minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif", fontSize: '0.85rem' }}>
      <style>{`
        /* Webkit scrollbars for tables */
        .table-responsive::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .table-responsive::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .table-responsive::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .table-responsive::-webkit-scrollbar-thumb:hover {
          background: #0ea5e9;
        }

        /* Sidebar item hovers */
        .hover-light-bg:hover {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }

        /* Webkit scrollbars for sidebar navigation */
        .sidebar-nav-container::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-nav-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-nav-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .sidebar-nav-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Quick Navigation item overrides */
        .quick-action-item {
          background-color: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          color: #475569 !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          border-radius: 8px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0.85rem 0.5rem !important;
          font-weight: 600 !important;
          font-size: 0.72rem !important;
          text-align: center !important;
        }
        .quick-action-item i {
          font-size: 1.2rem !important;
          margin-bottom: 5px !important;
          transition: transform 0.3s ease !important;
        }
        .quick-action-item:hover {
          background-color: #ffffff !important;
          border-color: #0ea5e9 !important;
          color: #0ea5e9 !important;
          box-shadow: 0 8px 16px -6px rgba(14, 165, 233, 0.25) !important;
          transform: translateY(-1.5px) !important;
        }
        .quick-action-item:hover i {
          transform: scale(1.1) !important;
        }

        /* Table hovering and coloring - increased density */
        .table-hover-light tbody tr {
          border-bottom: 1px solid #e2e8f0 !important;
          transition: all 0.2s ease !important;
        }
        .table-hover-light tbody tr:hover {
          background-color: #f8fafc !important;
        }
        .table-hover-light th {
          color: #475569 !important;
          border-bottom: 2px solid #e2e8f0 !important;
          font-weight: 600 !important;
          font-family: 'Outfit', sans-serif !important;
          padding: 0.45rem 0.5rem !important;
          font-size: 0.75rem !important;
        }
        .table-hover-light td {
          color: #0f172a !important;
          border: none !important;
          padding: 0.4rem 0.5rem !important;
          font-size: 0.75rem !important;
        }

        /* Form elements focus glow */
        .form-control-premium-dark {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background-color: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          color: #0f172a !important;
          transition: all 0.3s ease !important;
        }
        .form-control-premium-dark:focus {
          outline: none !important;
          background-color: #ffffff !important;
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15) !important;
        }
        .form-control-premium-dark::placeholder {
          color: #94a3b8;
        }

        /* Styled select */
        select.form-control-premium-dark {
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23475569' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.75rem center;
          background-repeat: no-repeat;
          background-size: 1.1rem;
          padding-right: 1.75rem;
        }
      `}</style>
      
      {/* Sidebar navigation */}
      <aside className="new-sidebar" style={{ width: '280px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', zIndex: 100, borderRight: '1px solid #e2e8f0' }}>
        <div className="logo-area" style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <div className="d-flex align-items-center gap-2">
            <i className="fa-solid fa-cubes text-info" style={{ color: '#0ea5e9', fontSize: '1.3rem' }}></i>
            <div className="logo-text text-dark fw-bold d-flex flex-column" style={{ fontSize: '1rem', lineHeight: '1.1' }}>
              Zero Inventory
              <span className="text-secondary" style={{ fontSize: '0.58rem', letterSpacing: '0.3px', color: '#64748b' }}>MANAGEMENT SYSTEM</span>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="sidebar-nav-container" style={{ flexGrow: 1, overflowY: 'auto', padding: '0.85rem 0.85rem 0 0.85rem' }}>
          <ul className="sidebar-nav-list" style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem', margin: 0 }}>
            <li className="sidebar-nav-item active" style={{ display: 'block' }}>
              <a href="#dashboard" onClick={() => playSynthSound('click')} className="text-info d-flex align-items-center gap-2 rounded text-decoration-none" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0.55rem 0.8rem', fontSize: '0.92rem', color: '#0ea5e9', gap: '0.65rem' }}>
                <i className="fa-solid fa-house text-info" style={{ color: '#0ea5e9', width: '18px', fontSize: '0.95rem' }}></i> Dashboard
              </a>
            </li>
            <li className="sidebar-nav-item">
              <a href="#billing" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg" style={{ color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-file-invoice" style={{ width: '18px', fontSize: '0.95rem' }}></i> Generate Bill
              </a>
            </li>
            <li className="sidebar-nav-item">
              <a href="#products" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg" style={{ color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-box-open" style={{ width: '18px', fontSize: '0.95rem' }}></i> Products
              </a>
            </li>
            <li className="sidebar-nav-item">
              <a href="#sales" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg" style={{ color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-chart-line" style={{ width: '18px', fontSize: '0.95rem' }}></i> Sales
              </a>
            </li>
            <li className="sidebar-nav-item">
              <a href="#purchases" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg" style={{ color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-cart-shopping" style={{ width: '18px', fontSize: '0.95rem' }}></i> Purchases
              </a>
            </li>
            <li className="sidebar-nav-item">
              <a href="#inventory" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg" style={{ color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-warehouse" style={{ width: '18px', fontSize: '0.95rem' }}></i> Inventory
              </a>
            </li>
            <li className="sidebar-nav-item">
              <a href="#categories" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg" style={{ color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-tags" style={{ width: '18px', fontSize: '0.95rem' }}></i> Categories
              </a>
            </li>
            <li className="sidebar-nav-item">
              <a href="#suppliers" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg" style={{ color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-truck-field" style={{ width: '18px', fontSize: '0.95rem' }}></i> Suppliers
              </a>
            </li>
            <li className="sidebar-nav-item">
              <a href="#customers" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg" style={{ color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-users" style={{ width: '18px', fontSize: '0.95rem' }}></i> Customers
              </a>
            </li>
            <li className="sidebar-nav-item">
              <a href="#reports" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg" style={{ color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-chart-pie" style={{ width: '18px', fontSize: '0.95rem' }}></i> Reports
              </a>
            </li>
            <li className="sidebar-nav-item">
              <a href="#billing-subscription" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg" style={{ color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-credit-card" style={{ width: '18px', fontSize: '0.95rem' }}></i> Billing & Subscription
              </a>
            </li>
            <li className="sidebar-nav-item">
              <a href="#settings" onClick={() => playSynthSound('click')} className="text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg" style={{ color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-gear" style={{ width: '18px', fontSize: '0.95rem' }}></i> Settings
              </a>
            </li>
          </ul>
        </div>

        {/* Upgrade Card and Profile Section container */}
        <div className="sidebar-bottom-section" style={{ marginTop: 'auto', backgroundColor: '#ffffff' }}>
          {/* Upgrade to Pro Card */}
          <div className="upgrade-pro-card" style={{ 
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
            padding: '1.25rem 1rem', 
            borderRadius: '10px', 
            margin: '0.85rem 0.85rem 1.25rem 0.85rem', 
            textAlign: 'center', 
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
          }}>
            <h5 className="fw-bold mb-1.5" style={{ fontSize: '0.85rem', color: '#ffffff', margin: '0 0 0.35rem 0' }}>Upgrade to Pro</h5>
            <p className="small mb-3" style={{ fontSize: '0.7rem', opacity: '0.9', lineHeight: '1.3', color: '#ffffff', margin: '0 0 0.95rem 0' }}>Unlock advanced features and grow your business.</p>
            <button 
              className="btn w-100 fw-bold border-0" 
              style={{ backgroundColor: '#ffffff', color: '#1d4ed8', borderRadius: '6px', fontSize: '0.72rem', padding: '0.4rem 0.5rem', margin: 0 }} 
              onClick={() => triggerAlert('Upgrade System', 'Simulated gateway dashboard update is active.')}
            >
              Upgrade Now
            </button>
          </div>

          {/* Merchant Logout Profile Card */}
          <div className="sidebar-bottom-user d-flex align-items-center justify-content-between text-dark" style={{ padding: '0.95rem 1.1rem', backgroundColor: '#f8fafc' }}>
            <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
              <div className="avatar-circle rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '30px', height: '30px', fontSize: '0.85rem', backgroundColor: '#e2e8f0', color: '#1e293b', flexShrink: 0 }}>
                A
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.76rem', lineHeight: '1.2' }}>Merchant Account</div>
                <div className="text-secondary text-truncate" style={{ fontSize: '0.66rem', color: '#64748b' }} title={user?.email || 'merchant@gmail.com'}>
                  {user?.email || 'merchant@gmail.com'}
                </div>
              </div>
            </div>
            <button 
              className="btn btn-link text-danger border-0" 
              title="Logout" 
              onClick={handleLogout} 
              style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0, width: '24px', height: '24px', alignSelf: 'center', flexShrink: 0 }}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content body */}
      <main className="new-main" style={{ flexGrow: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column', minHeight: '100vh', width: 'calc(100% - 280px)' }}>
        
        {/* Header Tools */}
        <header className="new-header" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', height: '50px', padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifycontent: 'space-between', sticky: 'top', zIndex: 90 }}>
          <div className="d-flex align-items-center gap-3" style={{ flexGrow: 1 }}>
            <button className="btn p-0 text-secondary border-0 d-lg-none" id="sidebarToggle"><i className="fa-solid fa-bars fs-5"></i></button>
            <div className="header-search-box d-none d-lg-flex align-items-center px-2.5 py-0.5 rounded-pill" style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', width: '250px' }}>
              <i className="fa-solid fa-magnifying-glass text-secondary me-1.5" style={{ color: '#64748b', fontSize: '0.8rem' }}></i>
              <input type="text" className="bg-transparent border-0 outline-none" style={{ fontSize: '0.78rem', width: '100%', color: '#0f172a' }} placeholder="Search for products, customers..." />
            </div>
          </div>

          <div className="header-right-tools d-flex align-items-center gap-2.5">
            {/* SaaS Access Code Widget */}
            <div className="header-saas-box d-flex align-items-center gap-1.5 px-2 py-0.5 rounded-3 border border-dashed border-info" style={{ backgroundColor: '#f0f9ff', borderColor: '#0ea5e9' }}>
              <span className="header-saas-label text-secondary fw-semibold" style={{ color: '#475569', fontSize: '0.75rem' }}><i className="fa-solid fa-key me-1 text-info" style={{ color: '#0ea5e9', fontSize: '0.7rem' }}></i>SaaS:</span>
              <span className="header-saas-value font-monospace text-info fw-bold" style={{ color: '#0ea5e9', fontSize: '0.75rem' }}>{formattedSaasCode()}</span>
              <button className="btn p-0 border-0" onClick={() => { playSynthSound('click'); setShowSaasCode(!showSaasCode); }} title="Toggle SaaS Code Visibility">
                <i className={`fa-regular ${showSaasCode ? 'fa-eye-slash' : 'fa-eye'} text-secondary`} style={{ color: '#64748b', fontSize: '0.75rem' }}></i>
              </button>
            </div>

            <button className="btn p-1 text-secondary" onClick={() => playSynthSound('click')} style={{ color: '#64748b' }}><i className="fa-solid fa-gear" style={{ fontSize: '1rem' }}></i></button>
            <div className="position-relative">
              <button className="btn p-1 text-secondary" onClick={() => playSynthSound('click')} style={{ color: '#64748b' }}>
                <i className="fa-regular fa-bell" style={{ fontSize: '1rem' }}></i>
                <span className="position-absolute p-0.5 bg-danger border border-light rounded-circle" style={{ borderColor: '#ffffff', top: '2px', right: '2px' }}></span>
              </button>
            </div>
            
            <div className="user-avatar-circle rounded-circle d-flex align-items-center justify-content-center fw-semibold text-info" style={{ width: '26px', height: '26px', fontSize: '0.75rem', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
              {userInitial()}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="content-area" style={{ flexGrow: 1, padding: '1rem 1.25rem' }}>
          
          {/* SaaS License Key Generated Banner */}
          {justRegistered && showSaasKeyAlert && (
            <div className="mb-3 p-3 rounded-3 shadow-sm" style={{ backgroundColor: '#f0f9ff', border: '1.5px solid #0ea5e9', position: 'relative' }}>
              <button 
                type="button"
                className="btn-close position-absolute" 
                style={{ top: '10px', right: '10px', border: 'none', background: 'transparent', fontSize: '1rem', color: '#64748b', cursor: 'pointer' }}
                onClick={() => { playSynthSound('click'); setShowSaasKeyAlert(false); }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <h4 className="text-info fw-bold mb-1" style={{ color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                    <i className="fa-solid fa-key"></i> SaaS License Key Generated
                  </h4>
                  <p className="text-secondary small mb-0" style={{ color: '#475569', fontSize: '0.75rem' }}>
                    Your credentials have been generated successfully. Copy the key below and save it. You will need it along with your Email and Password to log back into your Dashboard.
                  </p>
                </div>
                <div className="col-lg-4 text-lg-end mt-2 mt-lg-0">
                  <div className="d-inline-flex align-items-center gap-1.5 bg-black bg-opacity-40 p-1.5 rounded border border-info border-opacity-30 font-monospace" style={{ fontSize: '0.75rem' }}>
                    <span className="text-info fw-bold px-1.5">{saasCode}</span>
                    <button className="btn btn-sm btn-info text-white" style={{ backgroundColor: '#0ea5e9', borderColor: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', padding: 0 }} onClick={handleCopyCode}>
                      <i className="fa-regular fa-copy" style={{ fontSize: '0.7rem' }}></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Title Banner */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
            <div>
              <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>Dashboard</h1>
              <p className="small mb-0" style={{ color: '#64748b', fontSize: '0.75rem' }}>Welcome back, Merchant! Here's what's happening with your store today.</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div className="px-2.5 py-1 border rounded-3 shadow-sm small fw-medium" style={{ backgroundColor: '#ffffff', borderColor: '#7dd3fc', color: '#475569', fontSize: '0.75rem' }}>
                <i className="fa-regular fa-calendar me-1.5"></i>Jun 20, 2026 - Jun 20, 2026
              </div>
              <button className="btn btn-premium-primary fw-semibold d-flex align-items-center gap-1.5 shadow-sm" style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem' }} onClick={() => triggerAlert('Audit Logs', 'Opening audit logs database records...')}>
                <i className="fa-solid fa-clock-rotate-left"></i> View Audit Reports
              </button>
            </div>
          </div>

          {/* 4 Stat Summary Cards */}
          <div className="row g-3 mb-3">
            <div className="col-sm-6 col-xl-3">
              <div className="metric-card p-3 rounded-3 shadow-sm border d-flex justify-content-between align-items-center" style={{ backgroundColor: '#ffffff', borderColor: '#7dd3fc' }}>
                <div className="metric-info">
                  <h3 className="text-uppercase fw-semibold mb-0.5" style={{ fontSize: '0.7rem', letterSpacing: '0.5px', color: '#64748b' }}>Total Products</h3>
                  <div className="metric-number fw-extrabold" style={{ color: '#0f172a', fontSize: '1.3rem' }}>{stats.totalProducts}</div>
                </div>
                <div className="metric-icon-box rounded-3 d-flex align-items-center justify-content-center bg-info bg-opacity-10 text-info" style={{ width: '36px', height: '36px', fontSize: '1.1rem', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                  <i className="fa-solid fa-box"></i>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="metric-card p-3 rounded-3 shadow-sm border d-flex justify-content-between align-items-center" style={{ backgroundColor: '#ffffff', borderColor: '#7dd3fc' }}>
                <div className="metric-info">
                  <h3 className="text-uppercase fw-semibold mb-0.5" style={{ fontSize: '0.7rem', letterSpacing: '0.5px', color: '#64748b' }}>Total Stock Value</h3>
                  <div className="metric-number fw-extrabold" style={{ color: '#0f172a', fontSize: '1.3rem' }}>${stats.totalStockValue.toFixed(2)}</div>
                </div>
                <div className="metric-icon-box rounded-3 d-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success" style={{ width: '36px', height: '36px', fontSize: '1.1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <i className="fa-solid fa-coins"></i>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="metric-card p-3 rounded-3 shadow-sm border d-flex justify-content-between align-items-center" style={{ backgroundColor: '#ffffff', borderColor: '#7dd3fc' }}>
                <div className="metric-info">
                  <h3 className="text-uppercase fw-semibold mb-0.5" style={{ fontSize: '0.7rem', letterSpacing: '0.5px', color: '#64748b' }}>Total Item Units</h3>
                  <div className="metric-number fw-extrabold" style={{ color: '#0f172a', fontSize: '1.3rem' }}>{stats.totalItemUnits}</div>
                </div>
                <div className="metric-icon-box rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary" style={{ width: '36px', height: '36px', fontSize: '1.1rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
                  <i className="fa-solid fa-boxes-stacked"></i>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="metric-card p-3 rounded-3 shadow-sm border d-flex justify-content-between align-items-center" style={{ backgroundColor: '#ffffff', borderColor: '#7dd3fc' }}>
                <div className="metric-info">
                  <h3 className="text-uppercase fw-semibold mb-0.5" style={{ fontSize: '0.7rem', letterSpacing: '0.5px', color: '#64748b' }}>Low Stock Warns</h3>
                  <div className="metric-number fw-extrabold" style={{ color: '#ef4444', fontSize: '1.3rem' }}>{stats.lowStockWarns}</div>
                </div>
                <div className="metric-icon-box rounded-3 d-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger" style={{ width: '36px', height: '36px', fontSize: '1.1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Row: Category Distribution & Valuation (Left) vs Monthly Revenue (Right) */}
          <div className="row g-3 mb-3">
            <div className="col-lg-8">
              <div className="p-3 rounded-3 shadow-sm border h-100" style={{ backgroundColor: '#ffffff', borderColor: '#7dd3fc' }}>
                <div className="d-flex justify-content-between align-items-center mb-2.5">
                  <div>
                    <h3 className="fw-bold mb-0.5" style={{ fontSize: '0.92rem', color: '#0f172a' }}>Category Distribution & Valuation</h3>
                    <p className="small mb-0" style={{ color: '#64748b', fontSize: '0.72rem' }}>Real-time asset valuation across your active segments</p>
                  </div>
                  <button className="btn btn-link text-info text-decoration-none p-0 fw-semibold" style={{ color: '#0ea5e9', fontSize: '0.75rem' }} onClick={() => triggerAlert('Categories', 'Manage category catalog details...')}>Manage Categories</button>
                </div>

                <div className="table-responsive">
                  <table className="table align-middle table-hover-light">
                    <thead>
                      <tr className="small" style={{ color: '#475569' }}>
                        <th>Category Name</th>
                        <th>Products Count</th>
                        <th>Total Units</th>
                        <th>Asset Valuation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryValuation.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-secondary" style={{ color: '#64748b' }}>
                            <i className="fa-regular fa-folder-open fa-2x mb-2 text-secondary opacity-30"></i>
                            <p className="small mb-0" style={{ fontSize: '0.75rem' }}>No category details registered.</p>
                          </td>
                        </tr>
                      ) : (
                        categoryValuation.map((cat, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold" style={{ color: '#0f172a' }}>{cat.categoryName}</td>
                            <td style={{ color: '#475569' }}>{cat.productsCount}</td>
                            <td style={{ color: '#475569' }}>{cat.totalUnits}</td>
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
              <div className="p-3 rounded-3 shadow-sm border h-100" style={{ backgroundColor: '#ffffff', borderColor: '#7dd3fc' }}>
                <div className="d-flex justify-content-between align-items-center mb-2.5">
                  <div>
                    <h3 className="fw-bold mb-0.5" style={{ fontSize: '0.92rem', color: '#0f172a' }}>Monthly Revenue</h3>
                    <p className="small mb-0" style={{ color: '#64748b', fontSize: '0.72rem' }}>Historical monthly sales run-rate</p>
                  </div>
                  <button className="btn btn-link text-info text-decoration-none p-0 fw-semibold" style={{ color: '#0ea5e9', fontSize: '0.75rem' }} onClick={() => triggerAlert('Invoices', 'Viewing historical invoices records...')}>View Invoices</button>
                </div>

                <div className="table-responsive">
                  <table className="table align-middle table-hover-light">
                    <thead>
                      <tr className="small" style={{ color: '#475569' }}>
                        <th>Month</th>
                        <th>Invoices</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyRevenue.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-4 text-secondary" style={{ color: '#64748b' }}>
                            <i className="fa-regular fa-file-lines fa-2x mb-2 text-secondary opacity-30"></i>
                            <p className="small mb-0" style={{ fontSize: '0.75rem' }}>No invoices recorded yet.</p>
                          </td>
                        </tr>
                      ) : (
                        monthlyRevenue.map((item, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold" style={{ color: '#0f172a' }}>{item.month}</td>
                            <td style={{ color: '#475569' }}>{item.invoices}</td>
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
          <div className="row g-3 mb-3">
            
            {/* Low Stock Alerts */}
            <div className="col-lg-4">
              <div className="p-3 rounded-3 shadow-sm border h-100" style={{ backgroundColor: '#ffffff', borderColor: '#7dd3fc' }}>
                <div className="d-flex justify-content-between align-items-center mb-2.5">
                  <h3 className="fw-bold mb-0" style={{ fontSize: '0.92rem', color: '#0f172a' }}>Low Stock Alerts</h3>
                  <button className="btn btn-link text-info text-decoration-none p-0 fw-semibold" style={{ color: '#0ea5e9', fontSize: '0.75rem' }} onClick={() => triggerAlert('Alerts', 'Viewing all stock level warnings...')}>View All</button>
                </div>
                
                {lowStockAlerts.length === 0 ? (
                  <div className="text-center py-4 text-success" style={{ color: '#10b981' }}>
                    <i className="fa-solid fa-circle-check fa-2x mb-2"></i>
                    <p className="small mb-0 fw-semibold" style={{ fontSize: '0.75rem' }}>No low stock alerts</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {lowStockAlerts.map(alertItem => (
                      <div key={alertItem._id} className="p-2 rounded-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f8fafc', border: '1px solid #bae6fd' }}>
                        <div>
                          <div className="fw-bold" style={{ fontSize: '0.78rem', color: '#0f172a' }}>{alertItem.name}</div>
                          <div className="font-monospace" style={{ fontSize: '0.65rem', color: '#64748b' }}>SKU: {alertItem.sku}</div>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20 px-2 py-0.5" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', fontSize: '0.7rem' }}>
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
              <div className="p-3 rounded-3 shadow-sm border h-100" style={{ backgroundColor: '#ffffff', borderColor: '#7dd3fc' }}>
                <div className="d-flex justify-content-between align-items-center mb-2.5">
                  <h3 className="fw-bold mb-0" style={{ fontSize: '0.92rem', color: '#0f172a' }}>Recent Activity</h3>
                  <div className="d-flex gap-1.5">
                    <button 
                      className={`btn btn-sm ${recentActivityTab === 'sales' ? 'btn-premium-primary text-white fw-bold' : 'border-0'}`}
                      style={recentActivityTab === 'sales' ? { borderRadius: '6px', fontSize: '0.72rem', padding: '0.2rem 0.55rem' } : { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                      onClick={() => { setRecentActivityTab('sales'); }}
                    >
                      Sales
                    </button>
                    <button 
                      className={`btn btn-sm ${recentActivityTab === 'purchases' ? 'btn-premium-primary text-white fw-bold' : 'border-0'}`}
                      style={recentActivityTab === 'purchases' ? { borderRadius: '6px', fontSize: '0.72rem', padding: '0.2rem 0.55rem' } : { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                      onClick={() => { setRecentActivityTab('purchases'); }}
                    >
                      Purchases
                    </button>
                  </div>
                </div>

                {recentActivityTab === 'sales' ? (
                  recentSales.length === 0 ? (
                    <div className="text-center py-4 text-secondary" style={{ color: '#64748b' }}>
                      <i className="fa-solid fa-receipt fa-2x mb-1.5 opacity-30"></i>
                      <p className="small mb-0" style={{ fontSize: '0.75rem' }}>No recent sales activity</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-1.5">
                      {recentSales.map(sale => (
                        <div key={sale._id} className="d-flex justify-content-between align-items-center py-1.5" style={{ borderBottom: '1px solid #bae6fd' }}>
                          <div>
                            <div className="fw-bold" style={{ fontSize: '0.78rem', color: '#0f172a' }}>{sale.invoice_number}</div>
                            <div style={{ fontSize: '0.7rem', color: '#475569' }}>{sale.customer_name}</div>
                          </div>
                          <div className="text-end">
                            <div className="fw-semibold text-success" style={{ color: '#10b981', fontSize: '0.78rem' }}>${sale.grand_total.toFixed(2)}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{new Date(sale.sale_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  recentPurchases.length === 0 ? (
                    <div className="text-center py-4 text-secondary" style={{ color: '#64748b' }}>
                      <i className="fa-solid fa-cart-shopping fa-2x mb-1.5 opacity-30"></i>
                      <p className="small mb-0" style={{ fontSize: '0.75rem' }}>No recent purchases activity</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-1.5">
                      {recentPurchases.map(purchase => (
                        <div key={purchase._id} className="d-flex justify-content-between align-items-center py-1.5" style={{ borderBottom: '1px solid #bae6fd' }}>
                          <div>
                            <div className="fw-bold" style={{ fontSize: '0.78rem', color: '#0f172a' }}>{purchase.purchase_number}</div>
                            <div style={{ fontSize: '0.7rem', color: '#475569' }}>{purchase.supplier_name}</div>
                          </div>
                          <div className="text-end">
                            <div className="fw-semibold text-info" style={{ color: '#0284c7', fontSize: '0.78rem' }}>${purchase.grand_total.toFixed(2)}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{new Date(purchase.purchase_date).toLocaleDateString()}</div>
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
              <div className="p-3 rounded-3 shadow-sm border h-100" style={{ backgroundColor: '#ffffff', borderColor: '#7dd3fc' }}>
                <h3 className="fw-bold mb-2.5" style={{ fontSize: '0.92rem', color: '#0f172a' }}>Quick Navigation</h3>
                <div className="quick-action-grid" style={{ gap: '8px' }}>
                  <button className="quick-action-item border-0" onClick={() => triggerAlert('Navigation', 'Redirecting to add new product catalog page...')}>
                    <i className="fa-solid fa-square-plus" style={{ color: '#a855f7' }}></i>
                    Add Product
                  </button>
                  <button className="quick-action-item border-0" onClick={() => triggerAlert('Navigation', 'Redirecting to POS checkout sale billing page...')}>
                    <i className="fa-solid fa-cart-shopping" style={{ color: '#3b82f6' }}></i>
                    New Sale
                  </button>
                  <button className="quick-action-item border-0" onClick={() => triggerAlert('Navigation', 'Redirecting to record purchase inventory list...')}>
                    <i className="fa-solid fa-file-circle-check" style={{ color: '#10b981' }}></i>
                    New Purchase
                  </button>
                  <button className="quick-action-item border-0" onClick={() => triggerAlert('Navigation', 'Redirecting to add customer profiling record...')}>
                    <i className="fa-solid fa-user-plus" style={{ color: '#64748b' }}></i>
                    Add Customer
                  </button>
                  <button className="quick-action-item border-0" onClick={() => triggerAlert('Navigation', 'Redirecting to register supplier profile form...')}>
                    <i className="fa-solid fa-truck-field" style={{ color: '#f59e0b' }}></i>
                    Add Supplier
                  </button>
                  <button className="quick-action-item border-0" onClick={() => triggerAlert('Navigation', 'Redirecting to view overall ledger reports...')}>
                    <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#ef4444' }}></i>
                    View Reports
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Post Shop Feedback (Bottom Card) */}
          <div className="row">
            <div className="col-12">
              <div className="p-3 rounded-3 shadow-sm border" style={{ backgroundColor: '#ffffff', borderColor: '#7dd3fc' }}>
                <h3 className="fw-bold mb-1" style={{ fontSize: '1.05rem', color: '#0f172a' }}><i className="fa-solid fa-star text-warning me-1.5"></i>Post Shop Feedback</h3>
                <p className="small mb-3" style={{ color: '#64748b', fontSize: '0.75rem' }}>Share your review about Zero Inventory Management. Your review will publish directly to the landing page "Purchased Shops" feedback list.</p>
                
                <form onSubmit={handleFeedbackSubmit}>
                  <div className="row g-2 mb-2">
                    <div className="col-md-6">
                      <div className="form-group mb-0">
                        <label className="form-label mb-1" style={{ fontSize: '0.72rem', color: '#475569' }}>Your Shop Name</label>
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
                        <label className="form-label mb-1" style={{ fontSize: '0.72rem', color: '#475569' }}>Rating (1 to 5 Stars)</label>
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

                  <div className="form-group mb-3">
                    <label className="form-label mb-1" style={{ fontSize: '0.72rem', color: '#475569' }}>Comment / Review</label>
                    <textarea 
                      className="form-control-premium-dark" 
                      style={{ minHeight: '65px' }}
                      placeholder="Share your success story using this software..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <div className="text-end">
                    <button type="submit" className="btn btn-premium-primary px-3 py-1.5" style={{ fontSize: '0.78rem' }}>
                      <i className="fa-solid fa-paper-plane me-1.5"></i>Publish Review
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
