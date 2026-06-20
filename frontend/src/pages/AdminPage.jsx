import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  // Read data passed from checkout redirection
  const { justRegistered, successMessage, generatedCode, registeredEmail } = location.state || {};

  const [shops, setShops] = useState([
    { id: 1, name: 'Downtown Center Outlet', slug: 'downtown-outlet', region: 'East Coast US', products: 482, status: 'Active' },
    { id: 2, name: 'Westside Digital Boutique', slug: 'westside-boutique', region: 'Pacific Region US', products: 184, status: 'Active' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopSlug, setNewShopSlug] = useState('');
  const [newShopRegion, setNewShopRegion] = useState('Central US');
  const [showSaasKeyAlert, setShowSaasKeyAlert] = useState(true);

  // Get active user data
  const email = user?.email || registeredEmail || 'admin@yourshops.com';
  const planName = user?.plan_name || 'Growth Shop';
  const saasCode = user?.saas_code || generatedCode || 'ZIM-A1B2-C3D4';

  // Limit determination
  const maxShops = planName === 'Enterprise Shop' ? Infinity : 3;

  // Latency-free Audio Synthesizer using Web Audio API
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
        
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
        
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
      console.error('Synth Audio Error:', e);
    }
  };

  const handleCopyCode = () => {
    playSynthSound('click');
    navigator.clipboard.writeText(saasCode);
    alert('SaaS access key copied to clipboard!');
  };

  const handleAddShopClick = () => {
    playSynthSound('click');
    if (shops.length >= maxShops) {
      playSynthSound('error');
      alert(`Capacity reached! Your '${planName}' plan allows a maximum of ${maxShops} shops. Please upgrade your plan for unlimited capacity.`);
      return;
    }
    setShowModal(true);
  };

  const handleShopSubmit = (e) => {
    e.preventDefault();
    if (!newShopName || !newShopSlug) return;

    if (shops.length >= maxShops) {
      playSynthSound('error');
      alert('Maximum shop connection limit reached.');
      setShowModal(false);
      return;
    }

    const newShop = {
      id: Date.now(),
      name: newShopName,
      slug: newShopSlug.toLowerCase().replace(/\s+/g, '-'),
      region: newShopRegion,
      products: 0,
      status: 'Active'
    };

    setShops([...shops, newShop]);
    setNewShopName('');
    setNewShopSlug('');
    setShowModal(false);
    playSynthSound('success');
  };

  const handleLogout = () => {
    playSynthSound('click');
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container" style={{ backgroundColor: '#090d16', color: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Admin Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <i className="fa-solid fa-boxes-stacked text-info"></i> Zero<span>Console</span>
        </div>
        
        <ul className="sidebar-menu">
          <li className="sidebar-menu-item active">
            <a href="#admin" onClick={() => playSynthSound('click')}>
              <i className="fa-solid fa-laptop-code"></i> Multi-Shop Admin
            </a>
          </li>
          <li className="sidebar-menu-item">
            <a href="#shops" onClick={() => playSynthSound('click')}>
              <i className="fa-solid fa-store"></i> Connected Shops ({shops.length})
            </a>
          </li>
          <li className="sidebar-menu-item">
            <a href="#health" onClick={() => playSynthSound('click')}>
              <i className="fa-solid fa-heart-pulse"></i> Service Health
            </a>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="user-profile-info mb-2">
            <div className="profile-email" title={email}>{email}</div>
            <div className="profile-plan">{planName}</div>
          </div>
          <button className="btn btn-sm btn-outline-danger w-100" onClick={handleLogout}>
            <i className="fa-solid fa-power-off me-2"></i>Logout Admin
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="dashboard-main" style={{ flexGrow: 1, padding: '2rem', marginLeft: '280px', backgroundColor: '#090d16' }}>
        
        {/* Top Navbar */}
        <header className="dashboard-nav mb-4" style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="fs-5 text-white mb-0"><i className="fa-solid fa-shield-halved text-info me-2"></i>Multi-Shop Admin Panel</h2>
            <span className="text-secondary small">SaaS Console Node Active</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-success py-2 px-3"><i className="fa-solid fa-circle-check me-1"></i>Secure Session</span>
          </div>
        </header>

        {/* Credentials Welcome Banner (Important for SaaS Access Code Delivery) */}
        {showSaasKeyAlert && (
          <div className="mb-4 p-4 rounded-4" style={{ backgroundColor: '#111827', border: '2px solid rgba(14, 165, 233, 0.4)', position: 'relative' }}>
            <button 
              className="btn-close btn-close-white position-absolute" 
              style={{ top: '15px', right: '15px' }}
              onClick={() => { playSynthSound('click'); setShowSaasKeyAlert(false); }}
            ></button>
            <div className="row align-items-center">
              <div className="col-lg-8">
                <h4 className="text-info fw-bold mb-2">
                  <i className="fa-solid fa-key me-2"></i>SaaS License Key Generated
                </h4>
                <p className="text-secondary small mb-0">
                  Your credentials have been generated successfully. Copy the key below and save it. You will need it along with your Admin Email and Password to log back into this multi-shop panel.
                </p>
              </div>
              <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
                <div className="d-inline-flex align-items-center gap-2 bg-black bg-opacity-40 p-2 rounded border border-secondary border-opacity-15 font-monospace">
                  <span className="text-info fw-bold px-2">{saasCode}</span>
                  <button className="btn btn-sm btn-info text-dark" onClick={handleCopyCode}>
                    <i className="fa-regular fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview Stats Row */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="p-4 rounded-4" style={{ backgroundColor: '#111827', border: '1px solid #1e293b' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-secondary small">Connected Shops</span>
                <i className="fa-solid fa-store text-info fs-4"></i>
              </div>
              <h3 className="fs-2 text-white fw-bold mb-1">{shops.length}</h3>
              <small className="text-secondary">Capacity: {maxShops === Infinity ? 'Unlimited' : `${shops.length} / ${maxShops} Active`}</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 rounded-4" style={{ backgroundColor: '#111827', border: '1px solid #1e293b' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-secondary small">Active Products Count</span>
                <i className="fa-solid fa-boxes-stacked text-success fs-4"></i>
              </div>
              <h3 className="fs-2 text-white fw-bold mb-1">
                {shops.reduce((acc, curr) => acc + curr.products, 0)}
              </h3>
              <small className="text-success"><i className="fa-solid fa-arrow-trend-up me-1"></i>Real-time synchronization</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 rounded-4" style={{ backgroundColor: '#111827', border: '1px solid #1e293b' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-secondary small">License Status</span>
                <i className="fa-solid fa-circle-nodes text-warning fs-4"></i>
              </div>
              <h3 className="fs-2 text-warning fw-bold mb-1">Active</h3>
              <small className="text-secondary">Next bill: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</small>
            </div>
          </div>
        </div>

        {/* Action Header & Connected Shops Table */}
        <div className="p-4 rounded-4 mb-4" style={{ backgroundColor: '#111827', border: '1px solid #1e293b' }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fs-5 text-white mb-1">Connected Shop Instances</h3>
              <p className="text-secondary small mb-0">Select a retail shop database to login or manage inventories</p>
            </div>
            <button className="btn btn-premium-primary" onClick={handleAddShopClick}>
              <i className="fa-solid fa-plus me-2"></i>Add Connected Shop
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-dark table-hover border-secondary align-middle">
              <thead>
                <tr className="text-secondary">
                  <th>Shop Name</th>
                  <th>Database Slug</th>
                  <th>Region Node</th>
                  <th>Products Stocked</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => (
                  <tr key={shop.id}>
                    <td className="fw-bold text-white">
                      <i className="fa-solid fa-shop text-info me-2"></i>{shop.name}
                    </td>
                    <td className="font-monospace text-secondary small">{shop.slug}</td>
                    <td>{shop.region}</td>
                    <td>{shop.products} Items</td>
                    <td>
                      <span className={`badge ${shop.status === 'Active' ? 'bg-success' : 'bg-warning'} bg-opacity-20 text-${shop.status === 'Active' ? 'success' : 'warning'} border border-${shop.status === 'Active' ? 'success' : 'warning'} border-opacity-30`}>
                        {shop.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-info me-2" onClick={() => { playSynthSound('click'); alert(`Opening secure session redirect for ${shop.name}...`); }}>
                        <i className="fa-solid fa-right-to-bracket me-1"></i>Enter Shop
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Add Connected Shop Modal Overlay */}
      {showModal && (
        <div className="modal-overlay active d-flex" style={{ background: 'rgba(2, 6, 23, 0.85)', zIndex: 1050, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content-wrapper p-4" style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '450px', width: '90%' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="modal-title text-white mb-0"><i className="fa-solid fa-store text-info me-2"></i>Add Connected Shop</h4>
              <button className="btn-close btn-close-white" onClick={() => { playSynthSound('click'); setShowModal(false); }}></button>
            </div>
            <p className="small text-secondary mb-4">Connect a new shop instance database container under this multi-shop console license.</p>

            <form onSubmit={handleShopSubmit}>
              <div className="form-group mb-3">
                <label className="form-label text-white small">Shop Name</label>
                <input 
                  type="text" 
                  className="form-control-premium" 
                  placeholder="e.g. London HighStreet Depot" 
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label text-white small">Database Router Slug</label>
                <input 
                  type="text" 
                  className="form-control-premium" 
                  placeholder="e.g. london-depot" 
                  value={newShopSlug}
                  onChange={(e) => setNewShopSlug(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label text-white small">Region Hosting Node</label>
                <select 
                  className="form-control-premium"
                  value={newShopRegion}
                  onChange={(e) => setNewShopRegion(e.target.value)}
                >
                  <option value="East Coast US">East Coast US</option>
                  <option value="West Coast US">West Coast US</option>
                  <option value="Central US">Central US</option>
                  <option value="Western Europe">Western Europe</option>
                  <option value="Asia Pacific">Asia Pacific</option>
                </select>
              </div>

              <button type="submit" className="btn btn-premium-primary w-100 py-2">
                <i className="fa-solid fa-cloud-arrow-up me-2"></i>Provision & Connect Shop
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPage;
