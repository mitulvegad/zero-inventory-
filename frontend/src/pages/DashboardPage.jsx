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

  // Active Tab State with URL Hash Syncing
  const [activeTab, setActiveTab] = useState('dashboard');
  
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveTab(hash);
      } else {
        setActiveTab('dashboard');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Billing States
  const [invoiceId, setInvoiceId] = useState('');
  useEffect(() => {
    const today = new Date();
    const dateStr = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
    const randStr = Math.floor(1000 + Math.random() * 9000);
    setInvoiceId(`INV-${dateStr}-${randStr}`);
  }, [activeTab]);

  const billingDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  const [inventoryProducts, setInventoryProducts] = useState([
    { id: '1', sku: 'PROD-TSHIRT-01', name: 'Cotton Premium T-Shirt', category: 'Clothing', brand: 'Apex', purchasePrice: 10.00, price: 19.99, quantity: 45, reorderLevel: 10, unit: 'Piece', taxRate: 5, imageUrl: '', description: 'Premium quality cotton t-shirt.' },
    { id: '2', sku: 'PROD-MOUSE-02', name: 'Wireless Ergonomic Mouse', category: 'Electronics', brand: 'Logitech', purchasePrice: 15.00, price: 29.99, quantity: 28, reorderLevel: 10, unit: 'Piece', taxRate: 12, imageUrl: '', description: 'Ergonomic wireless office mouse.' },
    { id: '3', sku: 'PROD-HEAD-03', name: 'Noise Cancelling Headphones', category: 'Electronics', brand: 'Sony', purchasePrice: 50.00, price: 99.99, quantity: 12, reorderLevel: 10, unit: 'Piece', taxRate: 18, imageUrl: '', description: 'Wireless active noise cancellation headphones.' },
    { id: '4', sku: 'PROD-KEYB-04', name: 'Mechanical RGB Keyboard', category: 'Electronics', brand: 'Keychron', purchasePrice: 30.00, price: 59.99, quantity: 18, reorderLevel: 10, unit: 'Piece', taxRate: 18, imageUrl: '', description: 'Mechanical RGB gaming keyboard.' },
    { id: '5', sku: 'PROD-BACK-05', name: 'Waterproof Laptop Backpack', category: 'Clothing', brand: 'Targus', purchasePrice: 20.00, price: 39.99, quantity: 30, reorderLevel: 10, unit: 'Piece', taxRate: 12, imageUrl: '', description: 'Waterproof multi-compartment backpack.' }
  ]);

  // Inventory Filtering & Add Product Page States
  const [headerSearch, setHeaderSearch] = useState('');
  const [productsSubView, setProductsSubView] = useState('list'); // 'list' or 'add'
  const [editingProductId, setEditingProductId] = useState(null);
  
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('All');
  const [inventoryStockFilter, setInventoryStockFilter] = useState('All');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', category: 'All', stock: 'All' });

  // Add Product Form States
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdPurchasePrice, setNewProdPurchasePrice] = useState('');
  const [newProdSellingPrice, setNewProdSellingPrice] = useState('');
  const [newProdStockQuantity, setNewProdStockQuantity] = useState('');
  const [newProdReorderLevel, setNewProdReorderLevel] = useState('10');
  const [newProdUnit, setNewProdUnit] = useState('Piece');
  const [newProdTax, setNewProdTax] = useState('0');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdImage, setNewProdImage] = useState(null);
  const [newProdDragOver, setNewProdDragOver] = useState(false);

  const handleApplyFilters = () => {
    playSynthSound('click');
    setAppliedFilters({
      search: inventorySearch,
      category: inventoryCategoryFilter,
      stock: inventoryStockFilter
    });
  };

  const handleRefreshFilters = () => {
    playSynthSound('click');
    setInventorySearch('');
    setInventoryCategoryFilter('All');
    setInventoryStockFilter('All');
    setAppliedFilters({ search: '', category: 'All', stock: 'All' });
    setHeaderSearch('');
  };

  // Drag and Drop File Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setNewProdDragOver(true);
  };

  const handleDragLeave = () => {
    setNewProdDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setNewProdDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileLoad(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileLoad(file);
    }
  };

  const handleFileLoad = (file) => {
    if (file.size > 2 * 1024 * 1024) {
      triggerAlert('File Too Large', 'Maximum image size allowed is 2MB.', 'error');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      triggerAlert('Invalid File Type', 'Please upload a JPG, PNG, or WEBP image file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewProdImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    playSynthSound('click');
    setNewProdImage(null);
  };

  const handleResetForm = () => {
    setNewProdName('');
    setNewProdSku('');
    setNewProdCategory('');
    setNewProdBrand('');
    setNewProdPurchasePrice('');
    setNewProdSellingPrice('');
    setNewProdStockQuantity('');
    setNewProdReorderLevel('10');
    setNewProdUnit('Piece');
    setNewProdTax('0');
    setNewProdDescription('');
    setNewProdImage(null);
  };

  const handleCancel = () => {
    playSynthSound('click');
    setProductsSubView('list');
    setEditingProductId(null);
    handleResetForm();
  };

  const handleEditProduct = (product) => {
    playSynthSound('click');
    setEditingProductId(product.id);
    setNewProdName(product.name);
    setNewProdSku(product.sku);
    setNewProdCategory(product.category || '');
    setNewProdBrand(product.brand || '');
    setNewProdPurchasePrice(product.purchasePrice?.toString() || '');
    setNewProdSellingPrice(product.price?.toString() || '');
    setNewProdStockQuantity(product.quantity?.toString() || '');
    setNewProdReorderLevel(product.reorderLevel?.toString() || '10');
    setNewProdUnit(product.unit || 'Piece');
    setNewProdTax(product.taxRate?.toString() || '0');
    setNewProdDescription(product.description || '');
    setNewProdImage(product.imageUrl || null);
    setProductsSubView('add');
  };

  const handleDeleteProduct = (productId) => {
    playSynthSound('click');
    setInventoryProducts(inventoryProducts.filter(p => p.id !== productId));
    triggerAlert('Product Deleted', 'Product has been deleted successfully from your inventory!', 'success');
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();

    if (!newProdName || !newProdSku || !newProdCategory || !newProdPurchasePrice || !newProdSellingPrice || !newProdStockQuantity) {
      triggerAlert('Required Info', 'Please fill in all required fields marked with a red asterisk.', 'error');
      return;
    }

    const purchase = parseFloat(newProdPurchasePrice) || 0;
    const selling = parseFloat(newProdSellingPrice) || 0;
    const qty = parseInt(newProdStockQuantity) || 0;
    const reorder = parseInt(newProdReorderLevel) || 10;
    const tax = parseFloat(newProdTax) || 0;

    if (editingProductId) {
      setInventoryProducts(inventoryProducts.map(p => 
        p.id === editingProductId ? {
          ...p,
          name: newProdName,
          sku: newProdSku,
          category: newProdCategory,
          brand: newProdBrand,
          purchasePrice: purchase,
          price: selling,
          quantity: qty,
          reorderLevel: reorder,
          unit: newProdUnit,
          taxRate: tax,
          description: newProdDescription,
          imageUrl: newProdImage || ''
        } : p
      ));
      triggerAlert('Product Updated', 'Product has been updated successfully in your inventory!', 'success');
    } else {
      const newProd = {
        id: (inventoryProducts.length + 1).toString(),
        name: newProdName,
        sku: newProdSku,
        category: newProdCategory,
        brand: newProdBrand,
        purchasePrice: purchase,
        price: selling,
        quantity: qty,
        reorderLevel: reorder,
        unit: newProdUnit,
        taxRate: tax,
        description: newProdDescription,
        imageUrl: newProdImage || ''
      };
      setInventoryProducts([newProd, ...inventoryProducts]);
      triggerAlert('Product Added', 'New product has been added successfully to your inventory!', 'success');
    }

    setProductsSubView('list');
    setEditingProductId(null);
    handleResetForm();
  };

  const filteredProducts = inventoryProducts.filter(p => {
    const searchMatch = !appliedFilters.search || 
      p.name.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
      p.sku.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(appliedFilters.search.toLowerCase()));

    const categoryMatch = appliedFilters.category === 'All' || p.category === appliedFilters.category;

    let stockMatch = true;
    if (appliedFilters.stock === 'In Stock') {
      stockMatch = p.quantity >= 10;
    } else if (appliedFilters.stock === 'Low Stock') {
      stockMatch = p.quantity > 0 && p.quantity < 10;
    } else if (appliedFilters.stock === 'Out of Stock') {
      stockMatch = p.quantity <= 0;
    }

    return searchMatch && categoryMatch && stockMatch;
  });

  const billingSubtotal = selectedProducts.reduce((sum, p) => sum + (p.price * p.qtyToSell), 0);
  const billingTaxAmount = selectedProducts.reduce((sum, p) => sum + (p.price * p.qtyToSell * (p.taxRate / 100)), 0);
  const billingGrandTotal = billingSubtotal + billingTaxAmount;

  const addProductToInvoice = (product) => {
    const existing = selectedProducts.find(p => p.id === product.id);
    if (existing) {
      if (existing.qtyToSell >= product.quantity) {
        triggerAlert('Limit Reached', `Only ${product.quantity} units are available in stock.`, 'error');
        return;
      }
      setSelectedProducts(selectedProducts.map(p => 
        p.id === product.id ? { ...p, qtyToSell: p.qtyToSell + 1 } : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, qtyToSell: 1 }]);
    }
  };

  const handleQtyChange = (productId, newQty) => {
    const parsedQty = parseInt(newQty) || 0;
    const prod = inventoryProducts.find(p => p.id === productId);
    if (prod && parsedQty > prod.quantity) {
      triggerAlert('Limit Reached', `Only ${prod.quantity} units are available in stock.`, 'error');
      return;
    }
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? { ...p, qtyToSell: Math.max(1, parsedQty) } : p
    ));
  };

  const handleTaxChange = (productId, newTax) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? { ...p, taxRate: parseFloat(newTax) || 0 } : p
    ));
  };

  const removeProductFromInvoice = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleGenerateInvoice = (e) => {
    e.preventDefault();
    if (!customerName) {
      triggerAlert('Required Info', 'Please enter a customer name.', 'error');
      return;
    }
    if (selectedProducts.length === 0) {
      triggerAlert('Required Info', 'Please add at least one product to the invoice.', 'error');
      return;
    }
    triggerAlert('Invoice Generated', `Invoice ${invoiceId} for ${customerName} has been generated successfully! Grand Total: $${billingGrandTotal.toFixed(2)}`, 'success');
    setCustomerName('');
    setSelectedProducts([]);
    setItemSearch('');
    setCatalogSearch('');
  };

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
            <li className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} style={{ display: 'block' }}>
              <a href="#dashboard" onClick={() => { playSynthSound('click'); setActiveTab('dashboard'); }} className={activeTab === 'dashboard' ? "text-info d-flex align-items-center gap-2 rounded text-decoration-none" : "text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg"} style={activeTab === 'dashboard' ? { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0.55rem 0.8rem', fontSize: '0.92rem', color: '#0ea5e9', gap: '0.65rem' } : { color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-house text-info" style={{ color: activeTab === 'dashboard' ? '#0ea5e9' : '#475569', width: '18px', fontSize: '0.95rem' }}></i> Dashboard
              </a>
            </li>
            <li className={`sidebar-nav-item ${activeTab === 'billing' ? 'active' : ''}`}>
              <a href="#billing" onClick={() => { playSynthSound('click'); setActiveTab('billing'); }} className={activeTab === 'billing' ? "text-info d-flex align-items-center gap-2 rounded text-decoration-none" : "text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg"} style={activeTab === 'billing' ? { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0.55rem 0.8rem', fontSize: '0.92rem', color: '#0ea5e9', gap: '0.65rem' } : { color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-file-invoice" style={{ color: activeTab === 'billing' ? '#0ea5e9' : '#475569', width: '18px', fontSize: '0.95rem' }}></i> Generate Bill
              </a>
            </li>
            <li className={`sidebar-nav-item ${activeTab === 'products' ? 'active' : ''}`}>
              <a href="#products" onClick={() => { playSynthSound('click'); setActiveTab('products'); }} className={activeTab === 'products' ? "text-info d-flex align-items-center gap-2 rounded text-decoration-none" : "text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg"} style={activeTab === 'products' ? { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0.55rem 0.8rem', fontSize: '0.92rem', color: '#0ea5e9', gap: '0.65rem' } : { color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-box-open" style={{ color: activeTab === 'products' ? '#0ea5e9' : '#475569', width: '18px', fontSize: '0.95rem' }}></i> Products
              </a>
            </li>
            <li className={`sidebar-nav-item ${activeTab === 'sales' ? 'active' : ''}`}>
              <a href="#sales" onClick={() => { playSynthSound('click'); setActiveTab('sales'); }} className={activeTab === 'sales' ? "text-info d-flex align-items-center gap-2 rounded text-decoration-none" : "text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg"} style={activeTab === 'sales' ? { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0.55rem 0.8rem', fontSize: '0.92rem', color: '#0ea5e9', gap: '0.65rem' } : { color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-chart-line" style={{ color: activeTab === 'sales' ? '#0ea5e9' : '#475569', width: '18px', fontSize: '0.95rem' }}></i> Sales
              </a>
            </li>
            <li className={`sidebar-nav-item ${activeTab === 'purchases' ? 'active' : ''}`}>
              <a href="#purchases" onClick={() => { playSynthSound('click'); setActiveTab('purchases'); }} className={activeTab === 'purchases' ? "text-info d-flex align-items-center gap-2 rounded text-decoration-none" : "text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg"} style={activeTab === 'purchases' ? { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0.55rem 0.8rem', fontSize: '0.92rem', color: '#0ea5e9', gap: '0.65rem' } : { color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-cart-shopping" style={{ color: activeTab === 'purchases' ? '#0ea5e9' : '#475569', width: '18px', fontSize: '0.95rem' }}></i> Purchases
              </a>
            </li>
            <li className={`sidebar-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}>
              <a href="#inventory" onClick={() => { playSynthSound('click'); setActiveTab('inventory'); }} className={activeTab === 'inventory' ? "text-info d-flex align-items-center gap-2 rounded text-decoration-none" : "text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg"} style={activeTab === 'inventory' ? { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0.55rem 0.8rem', fontSize: '0.92rem', color: '#0ea5e9', gap: '0.65rem' } : { color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-warehouse" style={{ color: activeTab === 'inventory' ? '#0ea5e9' : '#475569', width: '18px', fontSize: '0.95rem' }}></i> Inventory
              </a>
            </li>
            <li className={`sidebar-nav-item ${activeTab === 'categories' ? 'active' : ''}`}>
              <a href="#categories" onClick={() => { playSynthSound('click'); setActiveTab('categories'); }} className={activeTab === 'categories' ? "text-info d-flex align-items-center gap-2 rounded text-decoration-none" : "text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg"} style={activeTab === 'categories' ? { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0.55rem 0.8rem', fontSize: '0.92rem', color: '#0ea5e9', gap: '0.65rem' } : { color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-tags" style={{ color: activeTab === 'categories' ? '#0ea5e9' : '#475569', width: '18px', fontSize: '0.95rem' }}></i> Categories
              </a>
            </li>
            <li className={`sidebar-nav-item ${activeTab === 'suppliers' ? 'active' : ''}`}>
              <a href="#suppliers" onClick={() => { playSynthSound('click'); setActiveTab('suppliers'); }} className={activeTab === 'suppliers' ? "text-info d-flex align-items-center gap-2 rounded text-decoration-none" : "text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg"} style={activeTab === 'suppliers' ? { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0.55rem 0.8rem', fontSize: '0.92rem', color: '#0ea5e9', gap: '0.65rem' } : { color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-truck-field" style={{ color: activeTab === 'suppliers' ? '#0ea5e9' : '#475569', width: '18px', fontSize: '0.95rem' }}></i> Suppliers
              </a>
            </li>
            <li className={`sidebar-nav-item ${activeTab === 'customers' ? 'active' : ''}`}>
              <a href="#customers" onClick={() => { playSynthSound('click'); setActiveTab('customers'); }} className={activeTab === 'customers' ? "text-info d-flex align-items-center gap-2 rounded text-decoration-none" : "text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg"} style={activeTab === 'customers' ? { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0.55rem 0.8rem', fontSize: '0.92rem', color: '#0ea5e9', gap: '0.65rem' } : { color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-users" style={{ color: activeTab === 'customers' ? '#0ea5e9' : '#475569', width: '18px', fontSize: '0.95rem' }}></i> Customers
              </a>
            </li>
            <li className={`sidebar-nav-item ${activeTab === 'reports' ? 'active' : ''}`}>
              <a href="#reports" onClick={() => { playSynthSound('click'); setActiveTab('reports'); }} className={activeTab === 'reports' ? "text-info d-flex align-items-center gap-2 rounded text-decoration-none" : "text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg"} style={activeTab === 'reports' ? { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0.55rem 0.8rem', fontSize: '0.92rem', color: '#0ea5e9', gap: '0.65rem' } : { color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-chart-pie" style={{ color: activeTab === 'reports' ? '#0ea5e9' : '#475569', width: '18px', fontSize: '0.95rem' }}></i> Reports
              </a>
            </li>
            <li className={`sidebar-nav-item ${activeTab === 'billing-subscription' ? 'active' : ''}`}>
              <a href="#billing-subscription" onClick={() => { playSynthSound('click'); setActiveTab('billing-subscription'); }} className={activeTab === 'billing-subscription' ? "text-info d-flex align-items-center gap-2 rounded text-decoration-none" : "text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg"} style={activeTab === 'billing-subscription' ? { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0.55rem 0.8rem', fontSize: '0.92rem', color: '#0ea5e9', gap: '0.65rem' } : { color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-credit-card" style={{ color: activeTab === 'billing-subscription' ? '#0ea5e9' : '#475569', width: '18px', fontSize: '0.95rem' }}></i> Billing & Subscription
              </a>
            </li>
            <li className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
              <a href="#settings" onClick={() => { playSynthSound('click'); setActiveTab('settings'); }} className={activeTab === 'settings' ? "text-info d-flex align-items-center gap-2 rounded text-decoration-none" : "text-secondary d-flex align-items-center gap-2 rounded text-decoration-none hover-light-bg"} style={activeTab === 'settings' ? { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderLeft: '3px solid #0ea5e9', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0.55rem 0.8rem', fontSize: '0.92rem', color: '#0ea5e9', gap: '0.65rem' } : { color: '#475569', padding: '0.55rem 0.8rem', fontSize: '0.92rem', gap: '0.65rem' }}>
                <i className="fa-solid fa-gear" style={{ color: activeTab === 'settings' ? '#0ea5e9' : '#475569', width: '18px', fontSize: '0.95rem' }}></i> Settings
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
              <input 
                type="text" 
                className="bg-transparent border-0 outline-none" 
                style={{ fontSize: '0.78rem', width: '100%', color: '#0f172a' }} 
                placeholder="Search SKU, name, brand, category..." 
                value={headerSearch}
                onChange={(e) => {
                  setHeaderSearch(e.target.value);
                  if (activeTab === 'products') {
                    setInventorySearch(e.target.value);
                    setAppliedFilters(prev => ({ ...prev, search: e.target.value }));
                  }
                }}
              />
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
          
          {/* Render Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
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
                      <button className="quick-action-item border-0" onClick={() => { playSynthSound('click'); setActiveTab('billing'); window.location.hash = '#billing'; }}>
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
            </>
          )}

          {/* Render Generate Bill Tab */}
          {activeTab === 'billing' && (
            <div className="generate-bill-view animate-fade-in" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              
              {/* Main Title Banner */}
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                <div>
                  <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>Generate Bill</h1>
                  <p className="small mb-0" style={{ color: '#64748b', fontSize: '0.75rem' }}>Create invoices and record customer retail sales transactions.</p>
                </div>
              </div>

              {/* 3-Column Grid Design */}
              <div className="row g-3">
                {/* Column 1: Invoice Details */}
                <div className="col-lg-3 col-md-12">
                  <div className="p-3 h-100 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="fw-bold mb-2.5 d-flex align-items-center" style={{ fontFamily: 'Outfit', fontSize: '0.92rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.15rem' }}>
                      <i className="fa-solid fa-receipt text-primary me-2" style={{ color: '#0ea5e9' }}></i> Invoice Details
                    </h3>

                    <form onSubmit={handleGenerateInvoice} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <div className="form-group mb-3">
                        <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Invoice ID</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.82rem', padding: '0.5rem 0.75rem', borderRadius: '6px', width: '100%', cursor: 'not-allowed', fontWeight: 'bold' }} 
                          value={invoiceId} 
                          readOnly 
                          disabled 
                        />
                      </div>

                      <div className="form-group mb-3">
                        <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Billing Date</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.82rem', padding: '0.5rem 0.75rem', borderRadius: '6px', width: '100%', cursor: 'not-allowed' }} 
                          value={billingDate} 
                          readOnly 
                          disabled 
                        />
                      </div>

                      <div className="form-group mb-3">
                        <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Customer Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control-premium-dark" 
                          placeholder="Enter customer name" 
                          value={customerName} 
                          onChange={(e) => setCustomerName(e.target.value)} 
                          required 
                        />
                      </div>

                      <div className="form-group mb-3">
                        <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Payment Method</label>
                        <select 
                          className="form-control-premium-dark" 
                          value={paymentMethod} 
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="UPI">UPI</option>
                          <option value="Net Banking">Net Banking</option>
                        </select>
                      </div>

                      {/* Summary Section at the Bottom */}
                      <div style={{ marginTop: 'auto', borderTop: '1px dashed #cbd5e1', paddingTop: '1rem' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ fontSize: '0.78rem' }}>
                          <span className="text-secondary">Subtotal:</span>
                          <span className="fw-bold text-dark">${billingSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.78rem' }}>
                          <span className="text-secondary">Tax Amount:</span>
                          <span className="fw-bold text-dark">${billingTaxAmount.toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center pt-2 mb-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                          <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>Grand Total:</span>
                          <span className="fw-extrabold text-success" style={{ fontSize: '1.2rem', color: '#16a34a' }}>${billingGrandTotal.toFixed(2)}</span>
                        </div>

                        <button 
                          type="submit" 
                          className="btn btn-premium-primary w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-1.5" 
                          style={{ borderRadius: '6px', fontSize: '0.82rem' }}
                        >
                          <i className="fa-solid fa-file-circle-check"></i> Generate Invoice
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Column 2: Invoice Items */}
                <div className="col-lg-6 col-md-12">
                  <div className="p-3 h-100 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="fw-bold mb-2.5 d-flex align-items-center" style={{ fontFamily: 'Outfit', fontSize: '0.92rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.15rem' }}>
                      <i className="fa-solid fa-cart-shopping text-success me-2" style={{ color: '#10b981' }}></i> Invoice Items
                    </h3>

                    {/* Search and Add Products input */}
                    <div className="form-group mb-3 position-relative">
                      <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Search and Add Products</label>
                      <div className="position-relative">
                        <i className="fa-solid fa-magnifying-glass text-secondary position-absolute" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#64748b' }}></i>
                        <input 
                          type="text" 
                          className="form-control-premium-dark" 
                          style={{ paddingLeft: '2.1rem' }} 
                          placeholder="Type items name or SKU code here..." 
                          value={itemSearch} 
                          onChange={(e) => setItemSearch(e.target.value)} 
                        />
                      </div>

                      {/* Autocomplete Dropdown Search Results */}
                      {itemSearch && (
                        <div className="position-absolute w-100 bg-white border rounded-3 shadow-lg mt-1" style={{ zIndex: 10, maxHeight: '200px', overflowY: 'auto', borderColor: '#cbd5e1' }}>
                          {inventoryProducts.filter(p => 
                            p.name.toLowerCase().includes(itemSearch.toLowerCase()) || 
                            p.sku.toLowerCase().includes(itemSearch.toLowerCase())
                          ).length === 0 ? (
                            <div className="p-2 text-center text-muted small">No items match your search.</div>
                          ) : (
                            inventoryProducts.filter(p => 
                              p.name.toLowerCase().includes(itemSearch.toLowerCase()) || 
                              p.sku.toLowerCase().includes(itemSearch.toLowerCase())
                            ).map(prod => (
                              <div 
                                key={prod.id} 
                                className="p-2 border-bottom hover-light-bg d-flex justify-content-between align-items-center cursor-pointer" 
                                style={{ cursor: 'pointer', fontSize: '0.78rem' }}
                                onClick={() => {
                                  addProductToInvoice(prod);
                                  setItemSearch('');
                                }}
                              >
                                <div>
                                  <div className="fw-bold text-dark">{prod.name}</div>
                                  <div className="text-secondary font-monospace" style={{ fontSize: '0.65rem' }}>SKU: {prod.sku}</div>
                                </div>
                                <div className="text-end">
                                  <div className="fw-semibold text-primary">${prod.price}</div>
                                  <div className="small text-muted" style={{ fontSize: '0.65rem' }}>Stock: {prod.quantity}</div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Invoice Items Data Table */}
                    <div className="table-responsive" style={{ flexGrow: 1 }}>
                      {selectedProducts.length === 0 ? (
                        /* Empty state placeholder */
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-center">
                          <i className="fa-solid fa-bag-shopping text-muted mb-2.5" style={{ fontSize: '2.8rem', color: '#cbd5e1', opacity: '0.6' }}></i>
                          <p className="mb-0 text-secondary" style={{ fontSize: '0.78rem', maxWidth: '320px', lineHeight: '1.4' }}>
                            No products added to invoice. Search and select products above or click from the catalog.
                          </p>
                        </div>
                      ) : (
                        <table className="table align-middle table-hover-light">
                          <thead>
                            <tr className="small text-secondary" style={{ fontSize: '0.72rem', borderBottom: '2px solid #e2e8f0' }}>
                              <th style={{ minWidth: '130px' }}>Product Name & SKU</th>
                              <th>Stock</th>
                              <th>Unit Price</th>
                              <th style={{ width: '80px' }}>Qty to Sell</th>
                              <th style={{ width: '90px' }}>Tax Rate</th>
                              <th>Total (Ex. Tax)</th>
                              <th className="text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProducts.map(item => (
                              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td>
                                  <div className="fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>{item.name}</div>
                                  <div className="text-muted font-monospace" style={{ fontSize: '0.65rem' }}>{item.sku}</div>
                                </td>
                                <td style={{ fontSize: '0.75rem', color: '#475569' }}>
                                  <span className={`badge ${item.quantity <= 10 ? 'bg-danger' : 'bg-success'} bg-opacity-10 text-${item.quantity <= 10 ? 'danger' : 'success'} border border-${item.quantity <= 10 ? 'danger' : 'success'} border-opacity-20`} style={{ fontSize: '0.68rem' }}>
                                    {item.quantity} pcs
                                  </span>
                                </td>
                                <td className="fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>${item.price.toFixed(2)}</td>
                                <td>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max={item.quantity} 
                                    className="form-control form-control-sm text-center py-0.5 px-1" 
                                    style={{ fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                    value={item.qtyToSell} 
                                    onChange={(e) => handleQtyChange(item.id, e.target.value)} 
                                  />
                                </td>
                                <td>
                                  <select 
                                    className="form-select form-select-sm py-0.5 px-1" 
                                    style={{ fontSize: '0.72rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                    value={item.taxRate} 
                                    onChange={(e) => handleTaxChange(item.id, e.target.value)}
                                  >
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="12">12%</option>
                                    <option value="18">18%</option>
                                  </select>
                                </td>
                                <td className="fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>
                                  ${(item.price * item.qtyToSell).toFixed(2)}
                                </td>
                                <td className="text-center">
                                  <button 
                                    type="button" 
                                    className="btn btn-link text-danger p-0 border-0" 
                                    onClick={() => removeProductFromInvoice(item.id)}
                                    title="Delete product"
                                  >
                                    <i className="fa-solid fa-trash-can" style={{ fontSize: '0.85rem' }}></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 3: Product Catalog */}
                <div className="col-lg-3 col-md-12">
                  <div className="p-3 h-100 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="fw-bold mb-2.5 d-flex align-items-center" style={{ fontFamily: 'Outfit', fontSize: '0.92rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.15rem' }}>
                      <i className="fa-solid fa-boxes-stacked text-primary me-2" style={{ color: '#0ea5e9' }}></i> Product Catalog
                    </h3>

                    {/* Catalog Search input */}
                    <div className="form-group mb-3 position-relative">
                      <div className="position-relative">
                        <i className="fa-solid fa-magnifying-glass text-secondary position-absolute" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#64748b' }}></i>
                        <input 
                          type="text" 
                          className="form-control-premium-dark" 
                          style={{ paddingLeft: '2.1rem' }} 
                          placeholder="Search catalog by name or SKU..." 
                          value={catalogSearch} 
                          onChange={(e) => setCatalogSearch(e.target.value)} 
                        />
                      </div>
                    </div>

                    {/* Catalog list */}
                    <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '380px' }}>
                      {inventoryProducts.filter(p => 
                        p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                        p.sku.toLowerCase().includes(catalogSearch.toLowerCase())
                      ).length === 0 ? (
                        /* Empty state placeholder */
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-center">
                          <i className="fa-solid fa-box-open text-muted mb-2.5" style={{ fontSize: '2.5rem', color: '#cbd5e1', opacity: '0.6' }}></i>
                          <p className="mb-0 text-secondary" style={{ fontSize: '0.76rem', maxWidth: '180px', lineHeight: '1.4' }}>
                            No products found in your inventory.
                          </p>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          {inventoryProducts.filter(p => 
                            p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                            p.sku.toLowerCase().includes(catalogSearch.toLowerCase())
                          ).map(product => (
                            <div 
                              key={product.id} 
                              className="p-2 border rounded-3 d-flex justify-content-between align-items-center hover-light-bg cursor-pointer transition-all" 
                              style={{ 
                                cursor: 'pointer', 
                                border: '1px solid #bae6fd', 
                                backgroundColor: '#f8fafc',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => addProductToInvoice(product)}
                            >
                              <div style={{ minWidth: 0, paddingRight: '4px' }}>
                                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.76rem' }}>{product.name}</div>
                                <div className="text-secondary font-monospace" style={{ fontSize: '0.62rem' }}>SKU: {product.sku}</div>
                                <div className="d-flex align-items-center gap-1.5 mt-0.5">
                                  <span className="fw-semibold text-primary" style={{ fontSize: '0.74rem', color: '#0ea5e9' }}>${product.price}</span>
                                  <span className="text-muted" style={{ fontSize: '0.62rem' }}>• Stock: {product.quantity}</span>
                                </div>
                              </div>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-outline-info d-flex align-items-center justify-content-center p-1" 
                                style={{ borderRadius: '6px', width: '28px', height: '28px', flexShrink: 0, fontSize: '0.72rem', borderColor: '#0ea5e9', color: '#0ea5e9' }}
                                title="Add product to bill"
                              >
                                <i className="fa-solid fa-plus"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Render Products Tab */}
          {activeTab === 'products' && (
            <div className="products-view animate-fade-in" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              {productsSubView === 'list' ? (
                /* PAGE 1: Products Inventory List View */
                <>
                  {/* Title Banner */}
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                    <div>
                      <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>Products Inventory</h1>
                      <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', color: '#007BFF' }}>
                        <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>Dashboard</span>
                        <span className="text-secondary">/</span>
                        <span className="fw-semibold">Products</span>
                      </div>
                    </div>
                    <button 
                      className="btn text-white fw-semibold d-flex align-items-center gap-1.5 shadow-sm border-0" 
                      style={{ backgroundColor: '#007BFF', padding: '0.45rem 1.15rem', borderRadius: '6px', fontSize: '0.75rem' }} 
                      onClick={() => {
                        playSynthSound('click');
                        setEditingProductId(null);
                        handleResetForm();
                        setProductsSubView('add');
                      }}
                    >
                      <i className="fa-solid fa-plus"></i> Add New Product
                    </button>
                  </div>

                  {/* Filter Panel */}
                  <div className="p-3 rounded-3 shadow-sm border bg-white mb-3" style={{ borderColor: '#cbd5e1' }}>
                    <div className="row g-3 align-items-end">
                      <div className="col-md-4 col-sm-12">
                        <label className="form-label mb-1.5 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Search Product</label>
                        <div className="position-relative">
                          <i className="fa-solid fa-magnifying-glass text-secondary position-absolute" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#64748b' }}></i>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            style={{ paddingLeft: '2.1rem' }} 
                            placeholder="Search SKU, name, brand..." 
                            value={inventorySearch}
                            onChange={(e) => setInventorySearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3 col-sm-6">
                        <label className="form-label mb-1.5 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Category Filter</label>
                        <select 
                          className="form-control-premium-dark" 
                          value={inventoryCategoryFilter}
                          onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                        >
                          <option value="All">All Categories</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Clothing">Clothing</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>
                      <div className="col-md-3 col-sm-6">
                        <label className="form-label mb-1.5 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Stock Status</label>
                        <select 
                          className="form-control-premium-dark" 
                          value={inventoryStockFilter}
                          onChange={(e) => setInventoryStockFilter(e.target.value)}
                        >
                          <option value="All">All stock levels</option>
                          <option value="In Stock">In Stock</option>
                          <option value="Low Stock">Low Stock</option>
                          <option value="Out of Stock">Out of Stock</option>
                        </select>
                      </div>
                      <div className="col-md-2 col-sm-12 d-flex gap-2">
                        <button 
                          className="btn text-white fw-semibold w-100 border-0" 
                          style={{ backgroundColor: '#007BFF', fontSize: '0.75rem', borderRadius: '6px', height: '35px' }}
                          onClick={handleApplyFilters}
                        >
                          Filter
                        </button>
                        <button 
                          className="btn btn-outline-secondary d-flex align-items-center justify-content-center" 
                          style={{ width: '35px', height: '35px', borderRadius: '6px', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                          onClick={handleRefreshFilters}
                          title="Refresh Filters"
                        >
                          <i className="fa-solid fa-rotate"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Data Table */}
                  <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                    <div className="table-responsive">
                      {filteredProducts.length === 0 ? (
                        <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                          <i className="fa-regular fa-folder-open text-muted mb-2.5" style={{ fontSize: '3rem', color: '#cbd5e1', opacity: '0.6' }}></i>
                          <p className="mb-0 text-secondary" style={{ fontSize: '0.78rem', maxWidth: '320px', lineHeight: '1.4' }}>
                            No products found matching filters.
                          </p>
                        </div>
                      ) : (
                        <table className="table align-middle table-hover-light">
                          <thead>
                            <tr className="small text-secondary" style={{ fontSize: '0.72rem', borderBottom: '2px solid #e2e8f0' }}>
                              <th>Product Info</th>
                              <th>SKU Code</th>
                              <th>Category</th>
                              <th>Brand</th>
                              <th>Purchase Price</th>
                              <th>Selling Price</th>
                              <th>Quantity</th>
                              <th>Status</th>
                              <th className="text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProducts.map(product => (
                              <tr key={product.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    {product.imageUrl ? (
                                      <img src={product.imageUrl} alt={product.name} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                                    ) : (
                                      <div className="d-flex align-items-center justify-content-center rounded text-secondary" style={{ width: '32px', height: '32px', fontSize: '0.85rem', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                                        <i className="fa-solid fa-box"></i>
                                      </div>
                                    )}
                                    <span className="fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>{product.name}</span>
                                  </div>
                                </td>
                                <td className="font-monospace text-secondary" style={{ fontSize: '0.75rem' }}>{product.sku}</td>
                                <td style={{ fontSize: '0.75rem', color: '#475569' }}>{product.category || 'N/A'}</td>
                                <td style={{ fontSize: '0.75rem', color: '#475569' }}>{product.brand || 'N/A'}</td>
                                <td className="fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>${(product.purchasePrice || 0).toFixed(2)}</td>
                                <td className="fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>${(product.price || 0).toFixed(2)}</td>
                                <td style={{ fontSize: '0.75rem', color: '#475569' }}>{product.quantity} pcs</td>
                                <td>
                                  <span className={`badge ${product.quantity <= 0 ? 'bg-danger text-danger' : product.quantity < (product.reorderLevel || 10) ? 'bg-warning text-warning' : 'bg-success text-success'} bg-opacity-10 border border-opacity-20`} style={{ fontSize: '0.68rem', borderColor: 'currentColor' }}>
                                    {product.quantity <= 0 ? 'Out of Stock' : product.quantity < (product.reorderLevel || 10) ? 'Low Stock' : 'In Stock'}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <div className="d-flex align-items-center justify-content-center gap-2">
                                    <button 
                                      type="button" 
                                      className="btn btn-link text-primary p-0 border-0" 
                                      onClick={() => handleEditProduct(product)}
                                      title="Edit Product"
                                    >
                                      <i className="fa-regular fa-pen-to-square" style={{ fontSize: '0.85rem' }}></i>
                                    </button>
                                    <button 
                                      type="button" 
                                      className="btn btn-link text-danger p-0 border-0" 
                                      onClick={() => handleDeleteProduct(product.id)}
                                      title="Delete Product"
                                    >
                                      <i className="fa-solid fa-trash-can" style={{ fontSize: '0.85rem' }}></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* PAGE 2: Add / Edit Product View */
                <>
                  {/* Title Banner */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>{editingProductId ? 'Edit Product' : 'Add New Product'}</h1>
                      <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', color: '#007BFF' }}>
                        <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>Dashboard</span>
                        <span className="text-secondary">/</span>
                        <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => setProductsSubView('list')}>Products</span>
                        <span className="text-secondary">/</span>
                        <span className="fw-semibold">{editingProductId ? 'Edit Product' : 'Add New Product'}</span>
                      </div>
                    </div>
                    <button 
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold" 
                      style={{ fontSize: '0.75rem', borderRadius: '6px', backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#475569' }} 
                      onClick={handleCancel}
                    >
                      <i className="fa-solid fa-arrow-left"></i> Back to Products
                    </button>
                  </div>

                  {/* Main Grid */}
                  <div className="row g-3">
                    {/* Left Form Column */}
                    <div className="col-lg-8 col-md-12">
                      <div className="p-3 rounded-3 shadow-sm border bg-white h-100" style={{ borderColor: '#cbd5e1' }}>
                        <h3 className="fw-bold mb-2 d-flex align-items-center" style={{ fontFamily: 'Outfit', fontSize: '0.92rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.15rem' }}>
                          <i className="fa-solid fa-box text-primary me-2" style={{ color: '#007BFF' }}></i> Product Information
                        </h3>

                        <form onSubmit={handleSaveProduct}>
                          <div className="row g-3 mb-3">
                            <div className="col-md-6">
                              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Product Name <span className="text-danger">*</span></label>
                              <input 
                                type="text" 
                                className="form-control-premium-dark" 
                                placeholder="Enter product name" 
                                value={newProdName}
                                onChange={(e) => setNewProdName(e.target.value)}
                                required 
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>SKU / Product Code <span className="text-danger">*</span></label>
                              <input 
                                type="text" 
                                className="form-control-premium-dark" 
                                placeholder="Enter SKU or product code" 
                                value={newProdSku}
                                onChange={(e) => setNewProdSku(e.target.value)}
                                required 
                              />
                            </div>
                          </div>

                          <div className="row g-3 mb-3">
                            <div className="col-md-6">
                              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Category <span className="text-danger">*</span></label>
                              <select 
                                className="form-control-premium-dark" 
                                value={newProdCategory}
                                onChange={(e) => setNewProdCategory(e.target.value)}
                                required
                              >
                                <option value="">Select category</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Clothing">Clothing</option>
                                <option value="Accessories">Accessories</option>
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Brand</label>
                              <input 
                                type="text" 
                                className="form-control-premium-dark" 
                                placeholder="Enter brand name" 
                                value={newProdBrand}
                                onChange={(e) => setNewProdBrand(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="row g-3 mb-3">
                            <div className="col-md-6">
                              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Purchase Price ($) <span className="text-danger">*</span></label>
                              <input 
                                type="number" 
                                step="0.01"
                                className="form-control-premium-dark" 
                                placeholder="Enter purchase price" 
                                value={newProdPurchasePrice}
                                onChange={(e) => setNewProdPurchasePrice(e.target.value)}
                                required 
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Selling Price ($) <span className="text-danger">*</span></label>
                              <input 
                                type="number" 
                                step="0.01"
                                className="form-control-premium-dark" 
                                placeholder="Enter selling price" 
                                value={newProdSellingPrice}
                                onChange={(e) => setNewProdSellingPrice(e.target.value)}
                                required 
                              />
                            </div>
                          </div>

                          <div className="row g-3 mb-3">
                            <div className="col-md-6">
                              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Stock Quantity <span className="text-danger">*</span></label>
                              <input 
                                type="number" 
                                className="form-control-premium-dark" 
                                placeholder="Enter stock quantity" 
                                value={newProdStockQuantity}
                                onChange={(e) => setNewProdStockQuantity(e.target.value)}
                                required 
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Reorder Level</label>
                              <input 
                                type="number" 
                                className="form-control-premium-dark" 
                                placeholder="10" 
                                value={newProdReorderLevel}
                                onChange={(e) => setNewProdReorderLevel(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="row g-3 mb-3">
                            <div className="col-md-6">
                              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Unit</label>
                              <select 
                                className="form-control-premium-dark" 
                                value={newProdUnit}
                                onChange={(e) => setNewProdUnit(e.target.value)}
                              >
                                <option value="Piece">Piece</option>
                                <option value="Box">Box</option>
                                <option value="Pack">Pack</option>
                                <option value="kg">kg</option>
                                <option value="Litre">Litre</option>
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Tax (%)</label>
                              <input 
                                type="number" 
                                className="form-control-premium-dark" 
                                placeholder="0" 
                                value={newProdTax}
                                onChange={(e) => setNewProdTax(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Description</label>
                            <textarea 
                              className="form-control-premium-dark" 
                              style={{ minHeight: '100px' }}
                              placeholder="Enter product description (optional)" 
                              value={newProdDescription}
                              onChange={(e) => setNewProdDescription(e.target.value)}
                            />
                          </div>

                          <div className="pt-3 d-flex justify-content-end gap-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                            <button 
                              type="button" 
                              className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold" 
                              style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#475569' }} 
                              onClick={handleResetForm}
                            >
                              Reset
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold" 
                              style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#475569' }} 
                              onClick={handleCancel}
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit" 
                              className="btn text-white fw-bold px-4 py-1.5 border-0" 
                              style={{ backgroundColor: '#007BFF', borderRadius: '6px', fontSize: '0.75rem' }}
                            >
                              <i className="fa-solid fa-save me-1.5"></i> Save Product
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* Right Column: Upload & Summary */}
                    <div className="col-lg-4 col-md-12 d-flex flex-column gap-3">
                      {/* Image Upload Zone */}
                      <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                        <h3 className="fw-bold mb-2 d-flex align-items-center" style={{ fontFamily: 'Outfit', fontSize: '0.92rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.15rem' }}>
                          <i className="fa-regular fa-image text-primary me-2" style={{ color: '#007BFF' }}></i> Product Image
                        </h3>

                        <div 
                          className="d-flex flex-column align-items-center justify-content-center border border-dashed rounded-3 p-4 text-center position-relative"
                          style={{
                            minHeight: '180px',
                            borderColor: newProdDragOver ? '#007BFF' : '#cbd5e1',
                            backgroundColor: newProdDragOver ? 'rgba(0, 123, 255, 0.05)' : '#f8fafc',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById('prod-file-input').click()}
                        >
                          <input 
                            type="file" 
                            id="prod-file-input" 
                            className="d-none" 
                            accept="image/jpeg,image/png,image/webp" 
                            onChange={handleFileChange}
                          />

                          {newProdImage ? (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center position-relative">
                              <img src={newProdImage} alt="Product preview" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px', objectFit: 'contain' }} />
                            </div>
                          ) : (
                            <>
                              <i className="fa-solid fa-cloud-arrow-up text-primary mb-2" style={{ fontSize: '2rem', color: '#007BFF' }}></i>
                              <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.8rem' }}>Drag & drop an image here</div>
                              <div className="text-secondary small" style={{ fontSize: '0.7rem' }}>or click to browse</div>
                              <div className="text-muted mt-2" style={{ fontSize: '0.62rem' }}>JPG, PNG or WEBP (Max. 2MB)</div>
                            </>
                          )}
                        </div>

                        {newProdImage && (
                          <div className="mt-3 text-center">
                            <button 
                              type="button" 
                              className="btn btn-outline-danger w-100 fw-semibold d-flex align-items-center justify-content-center gap-1.5" 
                              style={{ fontSize: '0.72rem', borderRadius: '6px', padding: '0.45rem' }} 
                              onClick={handleRemoveImage}
                            >
                              <i className="fa-solid fa-trash-can"></i> Remove Image
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Summary Card */}
                      <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                        <h3 className="fw-bold mb-2 d-flex align-items-center" style={{ fontFamily: 'Outfit', fontSize: '0.92rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.15rem' }}>
                          <i className="fa-solid fa-list-check text-primary me-2" style={{ color: '#007BFF' }}></i> Summary
                        </h3>

                        <div className="d-flex flex-column gap-2.5">
                          <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.78rem' }}>
                            <span className="text-secondary">Selling Price</span>
                            <span className="fw-bold text-dark">${(parseFloat(newProdSellingPrice) || 0).toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.78rem' }}>
                            <span className="text-secondary">Purchase Price</span>
                            <span className="fw-bold text-dark">${(parseFloat(newProdPurchasePrice) || 0).toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center pt-2 border-top" style={{ fontSize: '0.78rem' }}>
                            <span className="text-secondary fw-semibold">Profit (Per Unit)</span>
                            <span className={`fw-bold ${((parseFloat(newProdSellingPrice) || 0) - (parseFloat(newProdPurchasePrice) || 0)) >= 0 ? 'text-success' : 'text-danger'}`}>
                              ${((parseFloat(newProdSellingPrice) || 0) - (parseFloat(newProdPurchasePrice) || 0)).toFixed(2)}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center pt-2 border-top" style={{ fontSize: '0.78rem' }}>
                            <span className="text-secondary">Stock Quantity</span>
                            <span className="fw-bold text-dark">{newProdStockQuantity || 0}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center pt-2" style={{ fontSize: '0.78rem' }}>
                            <span className="text-secondary">Status</span>
                            <span>
                              {parseInt(newProdStockQuantity) <= 0 || !newProdStockQuantity ? (
                                <span className="badge text-white rounded px-2 py-0.5" style={{ fontSize: '0.68rem', backgroundColor: '#ef4444' }}>Out of Stock</span>
                              ) : parseInt(newProdStockQuantity) < (parseInt(newProdReorderLevel) || 10) ? (
                                <span className="badge text-dark rounded px-2 py-0.5" style={{ fontSize: '0.68rem', backgroundColor: '#f59e0b' }}>Low Stock</span>
                              ) : (
                                <span className="badge text-white rounded px-2 py-0.5" style={{ fontSize: '0.68rem', backgroundColor: '#10b981' }}>In Stock</span>
                              )}
                            </span>
                          </div>

                          <div className="mt-3 p-2.5 rounded-3 d-flex gap-2" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem' }}>
                            <i className="fa-solid fa-circle-info mt-0.5" style={{ fontSize: '0.85rem' }}></i>
                            <div style={{ lineHeight: '1.4' }}>
                              Product will be available for sale once added to inventory.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Render Fallback for other tabs */}
          {activeTab !== 'dashboard' && activeTab !== 'billing' && activeTab !== 'products' && (
            <div className="p-5 text-center rounded-4 border bg-white" style={{ borderColor: '#cbd5e1', margin: '3rem auto', maxWidth: '500px', boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.05)' }}>
              <i className="fa-solid fa-screwdriver-wrench text-secondary mb-3" style={{ fontSize: '3rem', color: '#94a3b8' }}></i>
              <h4 className="fw-bold text-dark text-capitalize" style={{ fontFamily: 'Outfit', fontSize: '1.1rem' }}>{activeTab.replace('-', ' ')} Page</h4>
              <p className="text-secondary small mb-4" style={{ fontSize: '0.78rem' }}>This module is currently under database migration or client synchronization node.</p>
              <a href="#dashboard" onClick={() => { playSynthSound('click'); setActiveTab('dashboard'); }} className="btn btn-premium-primary btn-sm px-3.5 py-1.5 fw-semibold" style={{ fontSize: '0.75rem', borderRadius: '6px' }}>Go back to Dashboard</a>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default DashboardPage;
