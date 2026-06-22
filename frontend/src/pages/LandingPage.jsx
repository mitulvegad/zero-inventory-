import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import ParticleField from '../components/ParticleField';

/* ── tiny helpers ── */
const useCountUp = (target, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
};

const useInView = (threshold = 0.1) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
};

/* ── animated stat number ── */
const StatNumber = ({ value, suffix = '', label }) => {
  const [ref, inView] = useInView(0.2);
  const count = useCountUp(value, 2000, inView);
  return (
    <div ref={ref} className="lp-stat-item">
      <div className="lp-stat-number">{count.toLocaleString()}{suffix}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
};

/* ── FAQItem ── */
const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`lp-faq-item ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="lp-faq-q">
        <span>{q}</span>
        <span className="lp-faq-icon">{open ? '−' : '+'}</span>
      </div>
      {open && <div className="lp-faq-a">{a}</div>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════ */
const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePlan, setActivePlan] = useState('Growth');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: '', email: '', phone: '', company: '' });
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [plans, setPlans] = useState([]);
  const [testimonials] = useState([
    { name: 'Rajesh Patel', role: 'Retail Store Owner', company: 'Patel General Store', rating: 5, text: 'Zero Inventory transformed how I manage my shop. I can now track all 500+ products in real-time and never run out of stock unexpectedly.' },
    { name: 'Priya Sharma', role: 'Warehouse Manager', company: 'Sharma Distributors', rating: 5, text: 'The reporting and analytics are outstanding. I generate monthly reports in seconds instead of spending hours on spreadsheets.' },
    { name: 'Amit Gupta', role: 'Business Owner', company: 'Gupta Electronics', rating: 5, text: 'Managing 3 stores was a nightmare before Zero Inventory. Now everything is connected and I can see all my business data from one dashboard.' },
    { name: 'Sunita Verma', role: 'Pharmacy Owner', company: 'Verma Medical Store', rating: 4, text: 'The billing system is incredibly fast. What used to take 5 minutes now takes 30 seconds. My customers love the quick service.' },
    { name: 'Vikram Singh', role: 'Fashion Retailer', company: 'Singh Garments', rating: 5, text: 'The low stock alerts saved me so many times. I never have to worry about running out of my best-selling items now.' },
    { name: 'Meera Joshi', role: 'Grocery Shop Owner', company: 'Joshi Fresh Mart', rating: 5, text: 'Excellent customer support and the platform is very easy to use. Even my staff with no tech background learned it in a day.' },
  ]);

  const [activeTab, setActiveTab] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Fetch pricing plans from backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/subscriptions/plans');
        if (res.data && res.data.length) setPlans(res.data);
      } catch {
        // fallback static plans
        setPlans([
          { _id: '1', name: 'Starter', price: 1999, interval: 'year', features: ['1 Shop', 'Up to 100 Products', 'Basic Reports', 'Email Support', 'Stock Tracking'] },
          { _id: '2', name: 'Growth', price: 9999, interval: 'year', features: ['3 Shops', 'Up to 1000 Products', 'Advanced Reports', 'Priority Support', 'Low Stock Alerts', 'Customer Management'] },
          { _id: '3', name: 'Enterprise', price: 19999, interval: 'year', features: ['Unlimited Shops', 'Unlimited Products', 'Full Analytics', 'Dedicated Support', 'Custom API', 'Multi-User Roles', 'Priority SLA'] },
        ]);
      }
    };
    fetchPlans();
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    setDemoSubmitted(true);
    setTimeout(() => { setShowDemoModal(false); setDemoSubmitted(false); }, 2500);
  };

  const features = [
    { icon: '📦', title: 'Inventory Management', desc: 'Real-time stock tracking across all your locations with automatic updates.' },
    { icon: '💰', title: 'Sales Management', desc: 'Process sales, generate receipts, and track revenue trends effortlessly.' },
    { icon: '🛒', title: 'Purchase Management', desc: 'Manage purchase orders, suppliers, and incoming stock seamlessly.' },
    { icon: '👥', title: 'Customer Management', desc: 'Build customer profiles, track purchase history, and manage relationships.' },
    { icon: '🚚', title: 'Supplier Management', desc: 'Maintain supplier databases, track orders, and manage payment terms.' },
    { icon: '📊', title: 'Reports & Analytics', desc: 'Powerful business insights with sales, profit, and inventory reports.' },
    { icon: '🧾', title: 'Billing & Invoicing', desc: 'Generate professional invoices in seconds with GST-ready templates.' },
    { icon: '🏪', title: 'Multi-Store Support', desc: 'Manage multiple shop locations from a single unified dashboard.' },
    { icon: '🔐', title: 'User Roles & Access', desc: 'Granular role-based access control for your entire team.' },
    { icon: '🔔', title: 'Low Stock Alerts', desc: 'Automated alerts when products fall below your set thresholds.' },
    { icon: '💳', title: 'Subscription Management', desc: 'Flexible subscription plans that scale with your growing business.' },
    { icon: '☁️', title: 'Cloud Access', desc: 'Access your inventory data securely from anywhere, any device.' },
  ];

  const industries = [
    { icon: '🏪', name: 'Retail Stores', desc: 'Manage clothing, accessories, and general merchandise efficiently.' },
    { icon: '🥦', name: 'Grocery Stores', desc: 'Track perishables, manage expiry dates, and bulk orders.' },
    { icon: '💊', name: 'Medical Shops', desc: 'Medicine inventory, prescription tracking, and regulatory compliance.' },
    { icon: '⚡', name: 'Electronics Stores', desc: 'Serial number tracking, warranty management, and repairs.' },
    { icon: '👗', name: 'Fashion Stores', desc: 'Size variants, color options, and seasonal collection management.' },
    { icon: '🏭', name: 'Warehouses', desc: 'Large-scale inventory, location mapping, and logistics.' },
    { icon: '🚛', name: 'Distributors', desc: 'Multi-party orders, bulk pricing, and distribution analytics.' },
    { icon: '🏢', name: 'Multi-Branch Business', desc: 'Centralized control across all your branch locations.' },
  ];

  const benefits = [
    {
      title: 'Reduce Manual Work by 80%',
      desc: 'Automate repetitive inventory tasks. No more manual stock counting, data entry errors, or time-consuming spreadsheet updates. Zero Inventory handles all the heavy lifting so you can focus on growing your business.',
      points: ['Automated stock updates on every sale', 'Bulk import/export products', 'Auto-generate purchase orders', 'Smart reorder reminders'],
      side: 'right',
      emoji: '⚡',
    },
    {
      title: 'Eliminate Spreadsheet Errors Forever',
      desc: 'Spreadsheets break at scale. Zero Inventory gives you a single source of truth for all your business data — accurate, real-time, and accessible from anywhere without formula errors or version conflicts.',
      points: ['Real-time data synchronization', 'Audit trail for every change', 'Multi-user collaboration', 'Zero data loss guarantee'],
      side: 'left',
      emoji: '✅',
    },
    {
      title: 'Generate Bills 10x Faster',
      desc: 'Our blazing-fast billing system lets you create professional GST-ready invoices in under 30 seconds. Built for busy retail environments where every second of customer wait time matters.',
      points: ['GST-compliant invoices', 'Thermal printer support', 'Customer auto-fill', 'WhatsApp share ready'],
      side: 'right',
      emoji: '🧾',
    },
    {
      title: 'Make Smarter Business Decisions',
      desc: 'Turn raw data into actionable insights. Our analytics dashboard shows you exactly which products sell best, which customers spend the most, and where your profit margins are highest.',
      points: ['Sales trend analysis', 'Top products & categories', 'Profit & loss reports', 'Customer analytics'],
      side: 'left',
      emoji: '📊',
    },
  ];

  const steps = [
    { num: '01', title: 'Create Account', desc: 'Sign up in 60 seconds. Choose your plan and get instant access to your dashboard.', icon: '👤' },
    { num: '02', title: 'Add Products', desc: 'Import your product catalog or add items manually with photos, prices, and variants.', icon: '📦' },
    { num: '03', title: 'Track Inventory', desc: 'Every sale and purchase automatically updates your stock levels in real time.', icon: '🔍' },
    { num: '04', title: 'Generate Bills', desc: 'Create professional GST invoices instantly and share them via email or WhatsApp.', icon: '🧾' },
    { num: '05', title: 'View Reports', desc: 'Access powerful analytics and reports to understand your business performance.', icon: '📊' },
    { num: '06', title: 'Grow Business', desc: 'Use data-driven insights to make smarter decisions and scale your operations.', icon: '🚀' },
  ];

  const tabs = ['Dashboard', 'Products', 'Sales', 'Customers', 'Reports'];

  const faqs = [
    { q: 'What is Zero Inventory?', a: 'Zero Inventory is a cloud-based inventory management SaaS platform built for modern businesses. It helps you manage products, stock, sales, purchases, customers, suppliers, and generate detailed reports from a single dashboard.' },
    { q: 'Is there a free trial available?', a: 'Yes! You can start with our Starter plan to explore the platform. All plans come with full feature access during the trial period so you can experience the power of Zero Inventory risk-free.' },
    { q: 'Can I manage multiple stores from one account?', a: 'Absolutely. Our Growth and Enterprise plans support multiple shop locations from a single unified dashboard, making it perfect for businesses with multiple branches or warehouses.' },
    { q: 'Is the billing system GST-compliant?', a: 'Yes, Zero Inventory\'s billing module is fully GST-compliant. You can generate GST invoices, track CGST/SGST/IGST, and maintain all tax records as required by Indian tax regulations.' },
    { q: 'How secure is my business data?', a: 'Your data is protected with enterprise-grade security including SSL encryption, regular backups, and role-based access controls. We follow industry best practices to keep your business data safe.' },
    { q: 'Can I import my existing product data?', a: 'Yes, you can easily import products via CSV/Excel spreadsheet. Our import wizard guides you through the mapping process to ensure smooth data migration from your existing system.' },
    { q: 'Does it work on mobile devices?', a: 'Zero Inventory is fully responsive and works on all devices including smartphones and tablets. You can access your inventory from anywhere at any time.' },
    { q: 'What kind of reports can I generate?', a: 'You can generate sales reports, purchase reports, profit & loss statements, inventory valuation reports, customer reports, supplier reports, and custom date-range reports with export to Excel/PDF.' },
    { q: 'How many users can access the system?', a: 'The number of users depends on your plan. Our Enterprise plan supports unlimited users with role-based access control, so you can set different permission levels for owners, managers, and staff.' },
    { q: 'Can I set low stock alerts?', a: 'Yes! You can set custom minimum stock thresholds for each product. Zero Inventory automatically sends you alerts when inventory falls below the threshold, so you never run out unexpectedly.' },
    { q: 'What payment methods are accepted?', a: 'We accept all major payment methods including UPI, credit/debit cards, net banking, and digital wallets. All transactions are secured with bank-grade SSL encryption.' },
    { q: 'Can I cancel my subscription anytime?', a: 'Yes, you can cancel your subscription at any time. Your access continues until the end of your billing period. We also offer a refund policy for annual plans within the first 30 days.' },
    { q: 'Do you offer customer support?', a: 'Yes, we provide email support for all plans and priority support for Growth and Enterprise plans. Our support team is available to help you get the most out of Zero Inventory.' },
    { q: 'Is there a limit on the number of products I can add?', a: 'Product limits depend on your plan. Starter allows up to 100 products, Growth supports up to 1,000 products, and Enterprise offers unlimited product capacity.' },
    { q: 'Can I track product variants like size and color?', a: 'Yes! Zero Inventory supports product variants including size, color, material, and other custom attributes. Each variant maintains its own stock level and pricing.' },
  ];

  return (
    <div className="lp-root">
      {/* ─── NAVBAR ─── */}
      <header className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <a href="#hero" onClick={e => { e.preventDefault(); scrollTo('hero'); }} className="lp-logo">
            <span className="lp-logo-icon">📦</span>
            <span>Zero<strong>Inventory</strong></span>
          </a>

          {/* desktop nav */}
          <nav className="lp-nav-links">
            <a onClick={() => scrollTo('features')}>Features</a>
            <a onClick={() => scrollTo('how-it-works')}>How It Works</a>
            <a onClick={() => scrollTo('industries')}>Industries</a>
            <a onClick={() => scrollTo('pricing')}>Pricing</a>
            <a onClick={() => scrollTo('faq')}>FAQ</a>
          </nav>

          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Login</button>
            <button className="lp-btn-primary" onClick={() => navigate('/checkout')}>Start Free Trial</button>
          </div>

          {/* hamburger */}
          <button className="lp-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>

        {/* mobile menu */}
        {mobileMenuOpen && (
          <div className="lp-mobile-menu">
            <a onClick={() => scrollTo('features')}>Features</a>
            <a onClick={() => scrollTo('how-it-works')}>How It Works</a>
            <a onClick={() => scrollTo('industries')}>Industries</a>
            <a onClick={() => scrollTo('pricing')}>Pricing</a>
            <a onClick={() => scrollTo('faq')}>FAQ</a>
            <hr />
            <a onClick={() => navigate('/login')}>Login</a>
            <button className="lp-btn-primary w-full" onClick={() => navigate('/checkout')}>Start Free Trial</button>
          </div>
        )}
      </header>

      {/* ─── SECTION 1: HERO ─── */}
      <section id="hero" className="lp-hero">
        {/* Google Antigravity-style particle field */}
        <ParticleField />
        <div className="lp-hero-bg-glow"></div>
        <div className="lp-container lp-hero-inner lp-hero-content-layer">
          {/* left */}
          <div className="lp-hero-content">
            <div className="lp-hero-badge">🚀 Trusted by 500+ Businesses Across India</div>
            <h1 className="lp-hero-title">
              Inventory Management<br />
              <span className="lp-gradient-text">Made Simple</span> For<br />
              Modern Businesses
            </h1>
            <p className="lp-hero-desc">
              Manage products, stock, invoices, sales, customers, suppliers, purchases, and reports from one powerful platform. No more spreadsheet chaos.
            </p>
            <div className="lp-hero-actions">
              <button className="lp-btn-primary lp-btn-lg" onClick={() => navigate('/checkout')}>
                🚀 Start Free Trial
              </button>
              <button className="lp-btn-outline lp-btn-lg" onClick={() => setShowVideoModal(true)}>
                ▶ Watch Demo
              </button>
              <button className="lp-btn-ghost lp-btn-lg" onClick={() => setShowDemoModal(true)}>
                📅 Book Demo
              </button>
            </div>
            <div className="lp-hero-trust">
              <div className="lp-trust-item">✅ No Credit Card Required</div>
              <div className="lp-trust-item">✅ Setup in 5 Minutes</div>
              <div className="lp-trust-item">✅ Cancel Anytime</div>
            </div>
          </div>

          {/* right — dashboard mockup */}
          <div className="lp-hero-mockup">
            <div className="lp-dashboard-card">
              <div className="lp-dash-header">
                <div className="lp-dash-dots">
                  <span style={{ background: '#ef4444' }}></span>
                  <span style={{ background: '#f59e0b' }}></span>
                  <span style={{ background: '#22c55e' }}></span>
                </div>
                <span className="lp-dash-title">Zero Inventory — Dashboard</span>
              </div>
              <div className="lp-dash-body">
                {/* metric cards */}
                <div className="lp-dash-metrics">
                  <div className="lp-dash-metric blue">
                    <div className="lp-dash-metric-icon">📦</div>
                    <div>
                      <div className="lp-dash-metric-val">1,284</div>
                      <div className="lp-dash-metric-label">Products</div>
                    </div>
                  </div>
                  <div className="lp-dash-metric green">
                    <div className="lp-dash-metric-icon">💰</div>
                    <div>
                      <div className="lp-dash-metric-val">₹2.4L</div>
                      <div className="lp-dash-metric-label">Revenue</div>
                    </div>
                  </div>
                  <div className="lp-dash-metric orange">
                    <div className="lp-dash-metric-icon">⚠️</div>
                    <div>
                      <div className="lp-dash-metric-val">7</div>
                      <div className="lp-dash-metric-label">Low Stock</div>
                    </div>
                  </div>
                  <div className="lp-dash-metric purple">
                    <div className="lp-dash-metric-icon">👥</div>
                    <div>
                      <div className="lp-dash-metric-val">342</div>
                      <div className="lp-dash-metric-label">Customers</div>
                    </div>
                  </div>
                </div>

                {/* mini chart */}
                <div className="lp-dash-chart">
                  <div className="lp-dash-chart-title">Sales This Week</div>
                  <div className="lp-dash-bars">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="lp-bar-wrap">
                        <div className="lp-bar" style={{ height: `${h}%` }}></div>
                        <div className="lp-bar-label">{['M','T','W','T','F','S','S'][i]}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* recent table */}
                <div className="lp-dash-table">
                  <div className="lp-dash-table-title">Recent Sales</div>
                  {[
                    { name: 'Samsung TV 55"', qty: 2, amount: '₹85,000', status: 'Completed' },
                    { name: 'Levi\'s Jeans Pack', qty: 5, amount: '₹12,499', status: 'Pending' },
                    { name: 'Rice Premium 25kg', qty: 10, amount: '₹8,750', status: 'Completed' },
                  ].map((row, i) => (
                    <div key={i} className="lp-dash-row">
                      <span className="lp-dash-row-name">{row.name}</span>
                      <span className="lp-dash-row-amt">{row.amount}</span>
                      <span className={`lp-dash-badge ${row.status === 'Completed' ? 'green' : 'orange'}`}>{row.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* floating chips */}
            <div className="lp-float-chip lp-float-1">
              <span>📈</span> Revenue +34% this month
            </div>
            <div className="lp-float-chip lp-float-2">
              <span>🔔</span> Low stock alert: 7 items
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: STATS ─── */}
      <section id="stats" className="lp-stats">
        <div className="lp-container">
          <div className="lp-stats-grid">
            <StatNumber value={50000} suffix="+" label="Products Managed" />
            <StatNumber value={500} suffix="+" label="Active Businesses" />
            <StatNumber value={25000} suffix="+" label="Invoices Generated" />
            <StatNumber value={100000} suffix="+" label="Monthly Transactions" />
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: WHAT IS ZERO INVENTORY ─── */}
      <section id="about" className="lp-about">
        <div className="lp-container">
          <div className="lp-about-inner">
            <div className="lp-about-content">
              <div className="lp-section-tag">What Is Zero Inventory?</div>
              <h2 className="lp-section-title">Your Complete Business Management Platform</h2>
              <p className="lp-about-desc">
                Zero Inventory is a powerful, cloud-based SaaS platform designed for Indian businesses of all sizes. From a single retail store to a multi-branch distribution network — we give you complete control over your inventory, sales, and operations.
              </p>
              <p className="lp-about-desc">
                Inventory mismanagement costs businesses lakhs of rupees every year through stockouts, overstocking, billing errors, and lack of visibility. Zero Inventory eliminates these problems with real-time tracking, automated alerts, and intelligent reporting.
              </p>
              <div className="lp-about-points">
                {['Real-time inventory tracking across all stores', 'Automated billing and GST-compliant invoices', 'Customer and supplier relationship management', 'Powerful analytics for smarter decisions'].map((p, i) => (
                  <div key={i} className="lp-about-point">
                    <span className="lp-check">✓</span> {p}
                  </div>
                ))}
              </div>
              <button className="lp-btn-primary" onClick={() => navigate('/checkout')}>Start Free Today →</button>
            </div>
            <div className="lp-about-visual">
              <div className="lp-about-card-stack">
                <div className="lp-info-card lp-info-1">
                  <div className="lp-info-icon">📦</div>
                  <div className="lp-info-text">
                    <strong>Stock Updated</strong>
                    <span>Samsung TV — 15 units left</span>
                  </div>
                </div>
                <div className="lp-info-card lp-info-2">
                  <div className="lp-info-icon">💳</div>
                  <div className="lp-info-text">
                    <strong>Invoice Generated</strong>
                    <span>INV-2024-1247 · ₹45,500</span>
                  </div>
                </div>
                <div className="lp-info-card lp-info-3">
                  <div className="lp-info-icon">📊</div>
                  <div className="lp-info-text">
                    <strong>Monthly Revenue</strong>
                    <span>₹2,45,780 · +34% vs last month</span>
                  </div>
                </div>
                <div className="lp-info-card lp-info-4">
                  <div className="lp-info-icon">🔔</div>
                  <div className="lp-info-text">
                    <strong>Low Stock Alert</strong>
                    <span>Rice 5kg — Only 3 bags left</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: BUSINESS BENEFITS (Alternating) ─── */}
      <section id="benefits" className="lp-benefits">
        <div className="lp-container">
          <div className="lp-section-center">
            <div className="lp-section-tag">Business Benefits</div>
            <h2 className="lp-section-title">Why 500+ Businesses Choose Zero Inventory</h2>
            <p className="lp-section-subtitle">See exactly how Zero Inventory transforms your day-to-day operations and helps you build a more profitable business.</p>
          </div>

          <div className="lp-benefits-list">
            {benefits.map((b, i) => (
              <div key={i} className={`lp-benefit-row ${b.side === 'left' ? 'reverse' : ''}`}>
                <div className="lp-benefit-content">
                  <div className="lp-benefit-emoji">{b.emoji}</div>
                  <h3 className="lp-benefit-title">{b.title}</h3>
                  <p className="lp-benefit-desc">{b.desc}</p>
                  <ul className="lp-benefit-points">
                    {b.points.map((p, j) => <li key={j}><span className="lp-check">✓</span> {p}</li>)}
                  </ul>
                  <button className="lp-btn-primary-sm" onClick={() => navigate('/checkout')}>Get Started →</button>
                </div>
                <div className="lp-benefit-visual">
                  <div className="lp-benefit-mockup">
                    <div className="lp-benefit-mockup-header">
                      <div className="lp-dash-dots">
                        <span style={{ background: '#ef4444' }}></span>
                        <span style={{ background: '#f59e0b' }}></span>
                        <span style={{ background: '#22c55e' }}></span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>zeroinventory.app</span>
                    </div>
                    <div className="lp-benefit-mockup-body">
                      <div className="lp-bmb-title">{b.title}</div>
                      {b.points.map((p, j) => (
                        <div key={j} className="lp-bmb-row">
                          <span className="lp-bmb-dot"></span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: PRODUCT SHOWCASE (Tabs) ─── */}
      <section id="showcase" className="lp-showcase">
        <div className="lp-container">
          <div className="lp-section-center">
            <div className="lp-section-tag">Product Showcase</div>
            <h2 className="lp-section-title">Every Feature Your Business Needs</h2>
          </div>
          <div className="lp-showcase-tabs">
            {tabs.map((t, i) => (
              <button key={i} className={`lp-tab-btn ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>{t}</button>
            ))}
          </div>
          <div className="lp-showcase-panel">
            <div className="lp-showcase-card">
              <div className="lp-showcase-card-header">
                <div className="lp-dash-dots">
                  <span style={{ background: '#ef4444' }}></span>
                  <span style={{ background: '#f59e0b' }}></span>
                  <span style={{ background: '#22c55e' }}></span>
                </div>
                <span className="lp-showcase-card-title">Zero Inventory — {tabs[activeTab]}</span>
              </div>
              <div className="lp-showcase-content">
                {activeTab === 0 && (
                  <div className="lp-sc-dashboard">
                    <div className="lp-sc-metrics">
                      {[
                        { label: 'Total Products', val: '1,284', icon: '📦', color: '#3b82f6' },
                        { label: 'Today\'s Sales', val: '₹45,200', icon: '💰', color: '#22c55e' },
                        { label: 'Pending Orders', val: '12', icon: '🕒', color: '#f59e0b' },
                        { label: 'Low Stock Items', val: '7', icon: '⚠️', color: '#ef4444' },
                      ].map((m, i) => (
                        <div key={i} className="lp-sc-metric" style={{ borderTop: `3px solid ${m.color}` }}>
                          <div style={{ fontSize: '1.5rem' }}>{m.icon}</div>
                          <div className="lp-sc-metric-val">{m.val}</div>
                          <div className="lp-sc-metric-lbl">{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="lp-sc-chart-area">
                      <div className="lp-sc-chart-title">Weekly Revenue Trend</div>
                      <div className="lp-sc-bars">
                        {[60, 75, 55, 90, 70, 85, 95].map((h, i) => (
                          <div key={i} className="lp-bar-wrap">
                            <div className="lp-bar lp-bar-glow" style={{ height: `${h}%` }}></div>
                            <div className="lp-bar-label">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 1 && (
                  <div className="lp-sc-table-wrap">
                    <div className="lp-sc-table-head">
                      <span>Product Name</span><span>SKU</span><span>Stock</span><span>Price</span><span>Status</span>
                    </div>
                    {[
                      { name: 'Samsung Galaxy S24', sku: 'SAM-S24-128', stock: 45, price: '₹74,999', status: 'In Stock' },
                      { name: 'Nike Air Max 2024', sku: 'NIK-AM-42', stock: 8, price: '₹12,499', status: 'Low Stock' },
                      { name: 'Basmati Rice 25kg', sku: 'RICE-BAS-25', stock: 120, price: '₹1,850', status: 'In Stock' },
                      { name: 'Levi\'s 501 Jeans', sku: 'LEV-501-32', stock: 3, price: '₹4,499', status: 'Low Stock' },
                      { name: 'Bosch Mixer 750W', sku: 'BOS-MIX-750', stock: 0, price: '₹8,999', status: 'Out of Stock' },
                    ].map((row, i) => (
                      <div key={i} className="lp-sc-row">
                        <span>{row.name}</span>
                        <span style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.8rem' }}>{row.sku}</span>
                        <span>{row.stock}</span>
                        <span style={{ fontWeight: 600, color: '#0ea5e9' }}>{row.price}</span>
                        <span className={`lp-dash-badge ${row.status === 'In Stock' ? 'green' : row.status === 'Low Stock' ? 'orange' : 'red'}`}>{row.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 2 && (
                  <div className="lp-sc-sales">
                    <div className="lp-sc-sales-summary">
                      <div className="lp-sc-summary-card">
                        <div className="lp-sc-summary-label">Today's Revenue</div>
                        <div className="lp-sc-summary-val" style={{ color: '#22c55e' }}>₹45,200</div>
                      </div>
                      <div className="lp-sc-summary-card">
                        <div className="lp-sc-summary-label">Transactions</div>
                        <div className="lp-sc-summary-val" style={{ color: '#3b82f6' }}>34</div>
                      </div>
                      <div className="lp-sc-summary-card">
                        <div className="lp-sc-summary-label">Avg. Order Value</div>
                        <div className="lp-sc-summary-val" style={{ color: '#f59e0b' }}>₹1,329</div>
                      </div>
                    </div>
                    <div className="lp-sc-recent-sales">
                      <div className="lp-sc-rs-title">Recent Transactions</div>
                      {[
                        { inv: 'INV-1247', customer: 'Rajesh Kumar', amount: '₹8,450', time: '2m ago' },
                        { inv: 'INV-1246', customer: 'Priya Singh', amount: '₹2,200', time: '15m ago' },
                        { inv: 'INV-1245', customer: 'Walk-in Customer', amount: '₹560', time: '32m ago' },
                        { inv: 'INV-1244', customer: 'Amit Patel', amount: '₹15,800', time: '1h ago' },
                      ].map((tx, i) => (
                        <div key={i} className="lp-sc-tx">
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{tx.customer}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{tx.inv}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: '#22c55e' }}>{tx.amount}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{tx.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 3 && (
                  <div className="lp-sc-customers">
                    <div className="lp-sc-table-head">
                      <span>Customer</span><span>Phone</span><span>Total Spent</span><span>Orders</span>
                    </div>
                    {[
                      { name: 'Rajesh Kumar', phone: '+91 98765 43210', spent: '₹1,24,500', orders: 32 },
                      { name: 'Priya Sharma', phone: '+91 87654 32109', spent: '₹89,200', orders: 24 },
                      { name: 'Amit Patel', phone: '+91 76543 21098', spent: '₹67,800', orders: 18 },
                      { name: 'Sunita Verma', phone: '+91 65432 10987', spent: '₹45,000', orders: 12 },
                      { name: 'Vikram Singh', phone: '+91 54321 09876', spent: '₹38,500', orders: 9 },
                    ].map((c, i) => (
                      <div key={i} className="lp-sc-row">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="lp-customer-avatar">{c.name[0]}</div>
                          {c.name}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{c.phone}</span>
                        <span style={{ fontWeight: 700, color: '#22c55e' }}>{c.spent}</span>
                        <span style={{ fontWeight: 600 }}>{c.orders}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 4 && (
                  <div className="lp-sc-reports">
                    <div className="lp-sc-report-cards">
                      {[
                        { label: 'Net Revenue', val: '₹2,45,780', change: '+34%', positive: true },
                        { label: 'Gross Profit', val: '₹98,312', change: '+28%', positive: true },
                        { label: 'Stock Value', val: '₹4,80,000', change: '-5%', positive: false },
                        { label: 'Orders', val: '847', change: '+19%', positive: true },
                      ].map((r, i) => (
                        <div key={i} className="lp-sc-report-card">
                          <div className="lp-sc-report-label">{r.label}</div>
                          <div className="lp-sc-report-val">{r.val}</div>
                          <div className={`lp-sc-report-change ${r.positive ? 'positive' : 'negative'}`}>{r.change} vs last month</div>
                        </div>
                      ))}
                    </div>
                    <div className="lp-sc-report-chart">
                      <div className="lp-sc-chart-title">Top Selling Categories</div>
                      {[
                        { cat: 'Electronics', pct: 82 },
                        { cat: 'Fashion', pct: 65 },
                        { cat: 'Grocery', pct: 48 },
                        { cat: 'Home & Kitchen', pct: 34 },
                      ].map((c, i) => (
                        <div key={i} className="lp-sc-progress-row">
                          <span>{c.cat}</span>
                          <div className="lp-sc-progress-bar">
                            <div className="lp-sc-progress-fill" style={{ width: `${c.pct}%` }}></div>
                          </div>
                          <span style={{ color: '#0ea5e9', fontWeight: 600, fontSize: '0.85rem' }}>{c.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: VIDEO DEMO ─── */}
      <section id="demo" className="lp-video-section">
        <div className="lp-container lp-video-inner">
          <div className="lp-video-content">
            <div className="lp-section-tag white">Product Demo</div>
            <h2 className="lp-section-title white">See Zero Inventory in Action</h2>
            <p className="lp-section-subtitle white">Watch how businesses use Zero Inventory to manage their entire operations from a single dashboard — in under 5 minutes.</p>
            <div className="lp-video-actions">
              <button className="lp-btn-white lp-btn-lg" onClick={() => setShowVideoModal(true)}>
                ▶ Watch Full Demo
              </button>
              <button className="lp-btn-outline-white lp-btn-lg" onClick={() => setShowDemoModal(true)}>
                📅 Book Live Demo
              </button>
            </div>
          </div>
          <div className="lp-video-thumb" onClick={() => setShowVideoModal(true)}>
            <div className="lp-play-btn">▶</div>
            <div className="lp-video-overlay-text">Watch 5-min Demo</div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: FEATURES GRID ─── */}
      <section id="features" className="lp-features">
        <div className="lp-container">
          <div className="lp-section-center">
            <div className="lp-section-tag">All Features</div>
            <h2 className="lp-section-title">Everything Your Business Needs</h2>
            <p className="lp-section-subtitle">Zero Inventory comes packed with all the tools modern businesses need to operate efficiently and scale confidently.</p>
          </div>
          <div className="lp-features-grid">
            {features.map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h4 className="lp-feature-title">{f.title}</h4>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 8: COMPARISON ─── */}
      <section id="comparison" className="lp-comparison">
        <div className="lp-container">
          <div className="lp-section-center">
            <div className="lp-section-tag">Why Switch?</div>
            <h2 className="lp-section-title">Before & After Zero Inventory</h2>
          </div>
          <div className="lp-comparison-grid">
            <div className="lp-comparison-card bad">
              <div className="lp-comp-header">
                <span>😤</span>
                <h3>Without Zero Inventory</h3>
              </div>
              <ul>
                {[
                  'Manual stock counting every day',
                  'Error-prone Excel spreadsheets',
                  'No visibility into inventory levels',
                  'Slow and manual billing process',
                  'Stockouts and lost sales',
                  'No customer purchase history',
                  'No reports or business insights',
                  'Data scattered across multiple files',
                  'Difficulty tracking supplier payments',
                  'Hours wasted on reconciliation',
                ].map((item, i) => (
                  <li key={i}><span className="lp-x">❌</span> {item}</li>
                ))}
              </ul>
            </div>
            <div className="lp-comparison-card good">
              <div className="lp-comp-header">
                <span>😊</span>
                <h3>With Zero Inventory</h3>
              </div>
              <ul>
                {[
                  'Real-time inventory tracking',
                  'Automated data sync across devices',
                  'Complete stock visibility 24/7',
                  'Bills generated in 30 seconds',
                  'Low stock alerts before stockout',
                  'Complete customer purchase history',
                  'Powerful analytics dashboard',
                  'Single platform for all operations',
                  'Automated supplier order tracking',
                  'Reports generated in one click',
                ].map((item, i) => (
                  <li key={i}><span className="lp-tick">✅</span> {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 9: INDUSTRIES ─── */}
      <section id="industries" className="lp-industries">
        <div className="lp-container">
          <div className="lp-section-center">
            <div className="lp-section-tag">Industries We Serve</div>
            <h2 className="lp-section-title">Built for Every Type of Business</h2>
            <p className="lp-section-subtitle">Whether you run a single shop or a multi-location enterprise, Zero Inventory adapts to your business needs.</p>
          </div>
          <div className="lp-industries-grid">
            {industries.map((ind, i) => (
              <div key={i} className="lp-industry-card">
                <div className="lp-industry-icon">{ind.icon}</div>
                <h4 className="lp-industry-name">{ind.name}</h4>
                <p className="lp-industry-desc">{ind.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 10: HOW IT WORKS ─── */}
      <section id="how-it-works" className="lp-how">
        <div className="lp-container">
          <div className="lp-section-center">
            <div className="lp-section-tag">How It Works</div>
            <h2 className="lp-section-title">Get Started in 6 Simple Steps</h2>
            <p className="lp-section-subtitle">From sign-up to running your complete inventory system in less than 30 minutes.</p>
          </div>
          <div className="lp-steps">
            {steps.map((s, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-connector">{i < steps.length - 1 && <div className="lp-connector-line"></div>}</div>
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-icon">{s.icon}</div>
                <h4 className="lp-step-title">{s.title}</h4>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="lp-how-cta">
            <button className="lp-btn-primary lp-btn-lg" onClick={() => navigate('/checkout')}>
              🚀 Get Started Now — It's Free
            </button>
          </div>
        </div>
      </section>

      {/* ─── SECTION 11: TESTIMONIALS ─── */}
      <section id="testimonials" className="lp-testimonials">
        <div className="lp-container">
          <div className="lp-section-center">
            <div className="lp-section-tag">Customer Stories</div>
            <h2 className="lp-section-title">Loved by Business Owners Across India</h2>
          </div>
          <div className="lp-testimonials-slider">
            <div className="lp-testimonials-track">
              {testimonials.map((t, i) => (
                <div key={i} className={`lp-testimonial-card ${i === currentTestimonial ? 'active' : i === (currentTestimonial + 1) % testimonials.length ? 'next' : ''}`}>
                  <div className="lp-t-stars">{'⭐'.repeat(t.rating)}</div>
                  <p className="lp-t-text">"{t.text}"</p>
                  <div className="lp-t-author">
                    <div className="lp-t-avatar">{t.name[0]}</div>
                    <div>
                      <div className="lp-t-name">{t.name}</div>
                      <div className="lp-t-role">{t.role} · {t.company}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="lp-t-dots">
              {testimonials.map((_, i) => (
                <button key={i} className={`lp-t-dot ${i === currentTestimonial ? 'active' : ''}`} onClick={() => setCurrentTestimonial(i)}></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 12: PRICING ─── */}
      <section id="pricing" className="lp-pricing">
        <div className="lp-container">
          <div className="lp-section-center">
            <div className="lp-section-tag">Transparent Pricing</div>
            <h2 className="lp-section-title">Simple Plans That Scale With You</h2>
            <p className="lp-section-subtitle">No hidden fees. No setup charges. Just powerful inventory management at a price your business can afford.</p>
          </div>
          <div className="lp-pricing-grid">
            {plans.map((plan, i) => {
              const isPopular = plan.name === 'Growth' || plan.name === 'Growth Shop' || i === 1;
              return (
                <div key={plan._id || i} className={`lp-price-card ${isPopular ? 'popular' : ''}`} onClick={() => setActivePlan(plan.name)}>
                  {isPopular && <div className="lp-popular-badge">⭐ Most Popular</div>}
                  <div className="lp-price-icon">{i === 0 ? '🏪' : i === 1 ? '🏬' : '🏢'}</div>
                  <h3 className="lp-price-name">{plan.name}</h3>
                  <div className="lp-price-amount">
                    <span className="lp-price-currency">₹</span>
                    <span className="lp-price-num">{(plan.price || 0).toLocaleString()}</span>
                    <span className="lp-price-period">/{plan.interval || 'year'}</span>
                  </div>
                  <ul className="lp-price-features">
                    {(plan.features || []).map((f, j) => (
                      <li key={j}><span className="lp-check">✓</span> {f}</li>
                    ))}
                  </ul>
                  <button
                    className={`lp-price-btn ${isPopular ? 'lp-btn-primary' : 'lp-btn-outline'}`}
                    onClick={() => navigate('/checkout', { state: { plan_name: plan.name } })}
                  >
                    {i === plans.length - 1 ? 'Contact Sales' : 'Get Started'}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="lp-pricing-note">
            All plans include a 30-day money-back guarantee. No questions asked.
          </div>
        </div>
      </section>

      {/* ─── SECTION 13: FAQ ─── */}
      <section id="faq" className="lp-faq">
        <div className="lp-container">
          <div className="lp-section-center">
            <div className="lp-section-tag">Frequently Asked Questions</div>
            <h2 className="lp-section-title">Got Questions? We Have Answers.</h2>
          </div>
          <div className="lp-faq-list">
            {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ─── SECTION 14: FINAL CTA ─── */}
      <section id="cta" className="lp-final-cta">
        <div className="lp-final-cta-bg"></div>
        <div className="lp-container lp-final-cta-inner">
          <h2 className="lp-final-cta-title">Take Full Control Of Your Inventory Today</h2>
          <p className="lp-final-cta-sub">Join 500+ businesses already using Zero Inventory to manage their operations smarter. Start your free trial now — no credit card required.</p>
          <div className="lp-final-cta-actions">
            <button className="lp-btn-white lp-btn-lg" onClick={() => navigate('/checkout')}>🚀 Start Free Trial</button>
            <button className="lp-btn-outline-white lp-btn-lg" onClick={() => setShowDemoModal(true)}>📅 Book Demo</button>
            <button className="lp-btn-outline-white lp-btn-lg" onClick={() => navigate('/login')}>🔐 Login</button>
          </div>
          <div className="lp-cta-trust">
            <span>✅ No Credit Card Required</span>
            <span>✅ Setup in 5 Minutes</span>
            <span>✅ 30-Day Money Back</span>
            <span>✅ Cancel Anytime</span>
          </div>
        </div>
      </section>

      {/* ─── SECTION 15: FOOTER ─── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <div className="lp-logo">
                <span className="lp-logo-icon">📦</span>
                <span>Zero<strong>Inventory</strong></span>
              </div>
              <p className="lp-footer-tagline">Simplifying inventory management for modern Indian businesses. One platform for all your business operations.</p>
              <div className="lp-footer-social">
                <a href="#" aria-label="Twitter">𝕏</a>
                <a href="#" aria-label="LinkedIn">in</a>
                <a href="#" aria-label="Facebook">f</a>
                <a href="#" aria-label="Instagram">📸</a>
              </div>
            </div>
            <div className="lp-footer-col">
              <h5>Product</h5>
              <a onClick={() => scrollTo('features')}>Features</a>
              <a onClick={() => scrollTo('pricing')}>Pricing</a>
              <a onClick={() => scrollTo('showcase')}>Product Tour</a>
              <a onClick={() => scrollTo('demo')}>Watch Demo</a>
              <a onClick={() => navigate('/login')}>Login</a>
            </div>
            <div className="lp-footer-col">
              <h5>Industries</h5>
              <a href="#">Retail Stores</a>
              <a href="#">Grocery Shops</a>
              <a href="#">Medical Stores</a>
              <a href="#">Electronics</a>
              <a href="#">Fashion & Apparel</a>
              <a href="#">Warehouses</a>
            </div>
            <div className="lp-footer-col">
              <h5>Company</h5>
              <a href="#">About Us</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
              <a onClick={() => setShowDemoModal(true)}>Contact Sales</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms & Conditions</a>
            </div>
            <div className="lp-footer-col">
              <h5>Support</h5>
              <a href="#">Documentation</a>
              <a href="#">Help Center</a>
              <a href="#">API Reference</a>
              <a href="#">System Status</a>
              <a href="#">Changelog</a>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} Zero Inventory Management. All rights reserved.</span>
            <span>Made with ❤️ for Indian Businesses</span>
          </div>
        </div>
      </footer>

      {/* ─── VIDEO MODAL ─── */}
      {showVideoModal && (
        <div className="lp-modal-overlay" onClick={() => setShowVideoModal(false)}>
          <div className="lp-modal-box lp-video-modal" onClick={e => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={() => setShowVideoModal(false)}>✕</button>
            <h3 className="lp-modal-title">Zero Inventory — Product Demo</h3>
            <div className="lp-video-placeholder">
              <div className="lp-vp-inner">
                <div style={{ fontSize: '4rem' }}>📦</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '16px' }}>Product Demo Video</div>
                <p style={{ color: '#94a3b8', marginTop: '8px' }}>Full product walkthrough video coming soon.<br />Book a live demo to see Zero Inventory in action.</p>
                <button className="lp-btn-primary" style={{ marginTop: '20px' }} onClick={() => { setShowVideoModal(false); setShowDemoModal(true); }}>
                  📅 Book Live Demo Instead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DEMO MODAL ─── */}
      {showDemoModal && (
        <div className="lp-modal-overlay" onClick={() => setShowDemoModal(false)}>
          <div className="lp-modal-box" onClick={e => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={() => setShowDemoModal(false)}>✕</button>
            {demoSubmitted ? (
              <div className="lp-demo-success">
                <div style={{ fontSize: '3rem' }}>🎉</div>
                <h3>Demo Booked Successfully!</h3>
                <p>Our team will reach out to you within 24 hours to schedule your personalized demo.</p>
              </div>
            ) : (
              <>
                <h3 className="lp-modal-title">Book a Free Live Demo</h3>
                <p className="lp-modal-sub">See Zero Inventory in action with a personalized walkthrough from our experts.</p>
                <form className="lp-demo-form" onSubmit={handleDemoSubmit}>
                  <div className="lp-form-row">
                    <div className="lp-form-group">
                      <label>Full Name *</label>
                      <input type="text" placeholder="Rajesh Kumar" required value={demoForm.name} onChange={e => setDemoForm({ ...demoForm, name: e.target.value })} />
                    </div>
                    <div className="lp-form-group">
                      <label>Business Email *</label>
                      <input type="email" placeholder="you@company.com" required value={demoForm.email} onChange={e => setDemoForm({ ...demoForm, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="lp-form-row">
                    <div className="lp-form-group">
                      <label>Phone Number *</label>
                      <input type="tel" placeholder="+91 98765 43210" required value={demoForm.phone} onChange={e => setDemoForm({ ...demoForm, phone: e.target.value })} />
                    </div>
                    <div className="lp-form-group">
                      <label>Company Name</label>
                      <input type="text" placeholder="Your Business Name" value={demoForm.company} onChange={e => setDemoForm({ ...demoForm, company: e.target.value })} />
                    </div>
                  </div>
                  <button type="submit" className="lp-btn-primary lp-btn-full">
                    📅 Schedule My Demo
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
