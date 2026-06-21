import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext, api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Cropper from 'react-easy-crop';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, setUser } = useContext(AuthContext);
  const { showToast } = useToast();

  const { justRegistered, generatedCode } = location.state || {};
  const [showSaasKeyAlert, setShowSaasKeyAlert] = useState(true);
  const saasCode = user?.saas_code || generatedCode || 'ZIM-XXXX-XXXX';

  // Subscription & Billing States
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [selectedPlanToChange, setSelectedPlanToChange] = useState(null);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [planChanging, setPlanChanging] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('All');

  // Expiry Countdown States
  const [countdownText, setCountdownText] = useState('');
  const [countdownColor, setCountdownColor] = useState('text-success');

  // Account Settings Profile States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [isSettingsUploading, setIsSettingsUploading] = useState(false);
  const [settingsUploadProgress, setSettingsUploadProgress] = useState(0);

  // Profile Image Cropping States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Access Code Visibility State
  const [showSettingsSaasCode, setShowSettingsSaasCode] = useState(false);

  // Security Audit & Activity Timeline States
  const [securityAuditLogs, setSecurityAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Change Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  // Helper functions
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return '';
    if (avatarPath.startsWith('http')) return avatarPath;
    const baseUrl = api.defaults.baseURL || 'http://localhost:5000/api';
    const serverUrl = baseUrl.replace('/api', '');
    return `${serverUrl}${avatarPath}`;
  };

  const refreshUserProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data) {
        setUser(res.data);
        setProfileName(res.data.name || '');
        setProfileEmail(res.data.email || '');
        setProfileAvatar(res.data.avatar || '');
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
  };

  const fetchSubscriptionDetails = async () => {
    try {
      setLoadingSub(true);
      const res = await api.get('/subscriptions/current');
      setCurrentSub(res.data);
      
      // Calculate Expiry Countdown Display
      if (res.data && res.data.expiryDate) {
        const expiry = new Date(res.data.expiryDate);
        const now = new Date();
        const diff = expiry - now;
        if (diff <= 0) {
          setCountdownText('Expired');
          setCountdownColor('text-danger bg-danger bg-opacity-10 border border-danger border-opacity-20 px-3 py-1 rounded-3');
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          let text = `Renewal Due In: ${days} Days`;
          if (days > 30) {
            text = `Subscription Expires In: ${days} Days`;
            setCountdownColor('text-success bg-success bg-opacity-10 border border-success border-opacity-20 px-3 py-1 rounded-3');
          } else if (days <= 30 && days > 7) {
            setCountdownColor('text-warning bg-warning bg-opacity-10 border border-warning border-opacity-20 px-3 py-1 rounded-3');
          } else {
            setCountdownColor('text-danger bg-danger bg-opacity-10 border border-danger border-opacity-20 px-3 py-1 rounded-3');
          }
          setCountdownText(text);
        }
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoadingSub(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get('/subscriptions/plans');
      setPlans(res.data);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      setLoadingBilling(true);
      const res = await api.get('/billing/history', {
        params: {
          search: invoiceSearch,
          status: invoiceStatusFilter
        }
      });
      setBillingHistory(res.data);
    } catch (err) {
      console.error('Error fetching billing history:', err);
    } finally {
      setLoadingBilling(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingAuditLogs(true);
      const res = await api.get('/security/audit-logs');
      setSecurityAuditLogs(res.data);
    } catch (err) {
      console.error('Error fetching security audit logs:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const fetchActivityTimeline = async () => {
    try {
      setLoadingTimeline(true);
      const res = await api.get('/activity/timeline');
      setActivityTimeline(res.data);
    } catch (err) {
      console.error('Error fetching activity timeline:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Sync profile details with context user on mount
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfileAvatar(user.avatar || '');
    }
  }, [user]);

  // Tab Load Synchronization
  useEffect(() => {
    if (activeTab === 'billing-subscription') {
      fetchSubscriptionDetails();
      fetchPlans();
      fetchBillingHistory();
    } else if (activeTab === 'settings') {
      fetchAuditLogs();
      fetchActivityTimeline();
    }
  }, [activeTab]);

  // Handle invoice live query filters
  useEffect(() => {
    if (activeTab === 'billing-subscription') {
      fetchBillingHistory();
    }
  }, [invoiceSearch, invoiceStatusFilter]);

  const handlePlanSelection = (plan) => {
    playSynthSound('click');
    if (plan.planName === currentSub?.planName) {
      return;
    }
    setSelectedPlanToChange(plan);
    setShowPlanChangeModal(true);
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlanToChange) return;
    try {
      setPlanChanging(true);
      const currentPrice = plans.find(p => p.planName === currentSub?.planName)?.yearlyPrice || 0;
      const targetPrice = selectedPlanToChange.yearlyPrice;
      const isUpgrade = targetPrice > currentPrice;
      
      const endpoint = isUpgrade ? '/subscriptions/upgrade' : '/subscriptions/downgrade';
      
      const res = await api.post(endpoint, { planName: selectedPlanToChange.planName });
      if (res.data.success) {
        triggerAlert('Subscription Updated', res.data.message, 'success');
        await fetchSubscriptionDetails();
        await fetchBillingHistory();
        await refreshUserProfile();
        setShowPlanChangeModal(false);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update subscription';
      triggerAlert('Subscription Error', errMsg, 'error');
    } finally {
      setPlanChanging(false);
    }
  };

  const getCroppedImg = (imageSrc, pixelCrop) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          blob.name = 'avatar.jpeg';
          resolve(blob);
        }, 'image/jpeg');
      };
      image.onerror = (err) => reject(err);
    });
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        triggerAlert('File Too Large', 'Maximum image size is 5MB', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImageSrc(reader.result);
        setCropModalOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropAndUpload = async () => {
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');
      
      setIsSettingsUploading(true);
      setSettingsUploadProgress(0);
      
      const res = await api.post('/user/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setSettingsUploadProgress(percentCompleted);
        }
      });
      
      if (res.data.success) {
        triggerAlert('Profile Photo', 'Successfully uploaded profile photo!', 'success');
        setProfileAvatar(res.data.avatar);
        await refreshUserProfile();
        await fetchActivityTimeline();
        setCropModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      triggerAlert('Upload Failed', err.response?.data?.message || 'Error processing crop/upload', 'error');
    } finally {
      setIsSettingsUploading(false);
      setSettingsUploadProgress(0);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
    try {
      const res = await api.delete('/user/remove-avatar');
      if (res.data.success) {
        triggerAlert('Profile Photo', 'Successfully cleared profile photo!', 'success');
        setProfileAvatar('');
        await refreshUserProfile();
        await fetchActivityTimeline();
      }
    } catch (err) {
      triggerAlert('Error', 'Failed to remove profile photo', 'error');
    }
  };

  const handleToggleSettingsSaasCode = async () => {
    playSynthSound('click');
    const newState = !showSettingsSaasCode;
    setShowSettingsSaasCode(newState);
    if (newState) {
      try {
        await api.post('/user/log-access-code');
        await fetchActivityTimeline();
      } catch (err) {
        console.error('Failed to log access code view activity:', err);
      }
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    playSynthSound('click');
    
    if (!currentPassword) {
      triggerAlert('Validation Error', 'Current password is required.', 'error');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      triggerAlert('Validation Error', 'New password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerAlert('Validation Error', 'Confirm password does not match the new password.', 'error');
      return;
    }

    try {
      setPasswordUpdating(true);
      const res = await api.post('/user/change-password', {
        currentPassword,
        newPassword
      });
      
      if (res.data.success) {
        triggerAlert('Security Updated', res.data.message, 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await fetchAuditLogs();
        await fetchActivityTimeline();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update password. Verify current password.';
      triggerAlert('Security Error', errMsg, 'error');
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleResetPasswordForm = () => {
    playSynthSound('click');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

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
  
  // Mobile sidebar toggle state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('All');
  const [inventoryStockFilter, setInventoryStockFilter] = useState('All');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', category: 'All', stock: 'All' });

  // Sales Registry States
  const [salesList, setSalesList] = useState([
    { id: '1', invoice_number: 'INV-20260621-1001', customer_name: 'mitul kumar', sale_date: '2026-06-21', grand_total: 120.50, payment_method: 'Cash', status: 'Paid', receipt_image: '' },
    { id: '2', invoice_number: 'INV-20260620-1002', customer_name: 'amit kumar', sale_date: '2026-06-20', grand_total: 45.00, payment_method: 'Card', status: 'Paid', receipt_image: '' }
  ]);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesPaymentFilter, setSalesPaymentFilter] = useState('All');
  const [appliedSalesFilters, setAppliedSalesFilters] = useState({ search: '', paymentMethod: 'All' });
  const [showRecordSaleModal, setShowRecordSaleModal] = useState(false);

  // Record Sale Form States
  const [saleInvoiceNumber, setSaleInvoiceNumber] = useState('');
  const [saleCustomerName, setSaleCustomerName] = useState('');
  const [saleDateInput, setSaleDateInput] = useState('');
  const [saleGrandTotalInput, setSaleGrandTotalInput] = useState('');
  const [salePaymentMethod, setSalePaymentMethod] = useState('Cash');
  const [saleReceiptImage, setSaleReceiptImage] = useState(null);
  const [saleDragOver, setSaleDragOver] = useState(false);

  // Selected Invoice for detailed preview modal
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState(null);

  // Purchases Registry States
  const [purchasesList, setPurchasesList] = useState([
    { id: '1', purchase_number: 'PRCH-20260621-1001', supplier_name: 'Alpha Supplier', purchase_date: '2026-06-21', grand_total: 550.00, payment_status: 'Paid' },
    { id: '2', purchase_number: 'PRCH-20260620-1002', supplier_name: 'Beta Vendor', purchase_date: '2026-06-20', grand_total: 1200.00, payment_status: 'Pending' }
  ]);
  const [purchasesSearch, setPurchasesSearch] = useState('');
  const [purchasesPaymentStatusFilter, setPurchasesPaymentStatusFilter] = useState('All');
  const [appliedPurchasesFilters, setAppliedPurchasesFilters] = useState({ search: '', paymentStatus: 'All' });
  const [showRecordPurchaseModal, setShowRecordPurchaseModal] = useState(false);

  // Record Purchase Form States
  const [purchasePoNumber, setPurchasePoNumber] = useState('');
  const [purchaseSupplierName, setPurchaseSupplierName] = useState('');
  const [purchaseDateInput, setPurchaseDateInput] = useState('');
  const [purchaseGrandTotalInput, setPurchaseGrandTotalInput] = useState('');
  const [purchasePaymentStatus, setPurchasePaymentStatus] = useState('Paid');

  // Categories Inventory States
  const [categoriesList, setCategoriesList] = useState([
    { id: '1', name: 'Electronics', slug: 'electronics', parent_category: null, description: 'Electronic devices, gadgets, and accessories.', status: 'Active', icon: 'fa-laptop', color: '#3b82f6', image: '' },
    { id: '2', name: 'Clothing', slug: 'clothing', parent_category: null, description: 'Apparel, garments, and wear.', status: 'Active', icon: 'fa-shirt', color: '#ec4899', image: '' },
    { id: '3', name: 'Accessories', slug: 'accessories', parent_category: null, description: 'Personal decorations and accessories.', status: 'Active', icon: 'fa-gem', color: '#10b981', image: '' }
  ]);
  const [categoriesSubView, setCategoriesSubView] = useState('list'); // 'list' or 'add'
  const [categoriesSearchQuery, setCategoriesSearchQuery] = useState('');
  const [categoriesStatusFilter, setCategoriesStatusFilter] = useState('All');
  const [appliedCategoriesFilters, setAppliedCategoriesFilters] = useState({ search: '', status: 'All' });

  // Add Category Form States
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catParent, setCatParent] = useState('');
  const [catStatus, setCatStatus] = useState('Active');
  const [catIcon, setCatIcon] = useState('fa-tag');
  const [catColor, setCatColor] = useState('#0EA5E9');
  const [catImage, setCatImage] = useState('');
  const [catImagePreview, setCatImagePreview] = useState(null);
  const [catDescription, setCatDescription] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // Suppliers States
  const [suppliersList, setSuppliersList] = useState([]);
  const [suppliersSubView, setSuppliersSubView] = useState('list'); // 'list' or 'add'
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [appliedSupplierFilters, setAppliedSupplierFilters] = useState({ search: '' });

  // Add Supplier Form States
  const [supName, setSupName] = useState('');
  const [supCode, setSupCode] = useState('');
  const [supContactPerson, setSupContactPerson] = useState('');
  const [supDesignation, setSupDesignation] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAltPhone, setSupAltPhone] = useState('');
  const [supWebsite, setSupWebsite] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supCountry, setSupCountry] = useState('');
  const [supState, setSupState] = useState('');
  const [supCity, setSupCity] = useState('');
  const [supPinCode, setSupPinCode] = useState('');
  const [supPaymentTerms, setSupPaymentTerms] = useState('net_30');
  const [supCreditLimit, setSupCreditLimit] = useState('0.00');
  const [supTaxId, setSupTaxId] = useState('');
  const [supNotes, setSupNotes] = useState('');
  const [supStatus, setSupStatus] = useState('Active');
  const [supSaving, setSupSaving] = useState(false);

  // Customers States
  const [customersList, setCustomersList] = useState([]);
  const [customersSubView, setCustomersSubView] = useState('list'); // 'list' or 'add'
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [appliedCustomerFilters, setAppliedCustomerFilters] = useState({ search: '' });

  // Add Customer Form States
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custState, setCustState] = useState('');
  const [custCountry, setCustCountry] = useState('');
  const [custZipCode, setCustZipCode] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [custStatus, setCustStatus] = useState('Active');
  const [custSaving, setCustSaving] = useState(false);

  // Reports States
  const [reportsActiveTab, setReportsActiveTab] = useState('sales'); // 'sales', 'valuation', 'purchase'
  const [salesAuditList, setSalesAuditList] = useState([]);
  const [inventoryValuationData, setInventoryValuationData] = useState({ summary: { totalInventoryValue: 0, expectedSalesReturn: 0, potentialProfit: 0 }, items: [] });
  const [purchaseLogList, setPurchaseLogList] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Selected Purchase for detailed preview modal
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState(null);

  // Purchases functions
  const handleOpenRecordPurchaseModal = () => {
    playSynthSound('click');
    const today = new Date();
    const dateStr = today.getFullYear() + 
      String(today.getMonth() + 1).padStart(2, '0') + 
      String(today.getDate()).padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setPurchasePoNumber(`PRCH-${dateStr}-${randomNum}`);
    
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setPurchaseDateInput(`${year}-${month}-${day}`);
    
    setPurchaseSupplierName('');
    setPurchaseGrandTotalInput('0.00');
    setPurchasePaymentStatus('Paid');
    setShowRecordPurchaseModal(true);
  };

  const handleSavePurchaseFromModal = (e) => {
    e.preventDefault();

    if (!purchaseSupplierName || !purchaseDateInput || !purchaseGrandTotalInput) {
      triggerAlert('Required Info', 'Please fill in all required fields marked with a red asterisk.', 'error');
      return;
    }

    const total = parseFloat(purchaseGrandTotalInput) || 0;
    if (total <= 0) {
      triggerAlert('Invalid Amount', 'Grand Total must be greater than 0.', 'error');
      return;
    }

    const newPurchase = {
      id: (purchasesList.length + 1).toString(),
      purchase_number: purchasePoNumber,
      supplier_name: purchaseSupplierName,
      purchase_date: purchaseDateInput,
      grand_total: total,
      payment_status: purchasePaymentStatus
    };

    setPurchasesList([newPurchase, ...purchasesList]);

    // Prepend to recentPurchases so it syncs with dashboard activity
    const newRecentPurchase = {
      _id: newPurchase.id,
      purchase_number: newPurchase.purchase_number,
      supplier_name: newPurchase.supplier_name,
      grand_total: newPurchase.grand_total,
      purchase_date: newPurchase.purchase_date
    };
    setRecentPurchases(prevPurchases => [newRecentPurchase, ...prevPurchases]);

    setShowRecordPurchaseModal(false);
    triggerAlert('Purchase Saved', `Purchase record ${purchasePoNumber} has been saved successfully!`, 'success');
  };

  const handleDeletePurchase = (purchaseId) => {
    playSynthSound('click');
    const purchaseToDelete = purchasesList.find(p => p.id === purchaseId);
    if (!purchaseToDelete) return;

    setPurchasesList(prevList => prevList.filter(p => p.id !== purchaseId));
    setRecentPurchases(prevPurchases => prevPurchases.filter(p => p._id !== purchaseId && p.id !== purchaseId));
    
    triggerAlert('Purchase Deleted', `Purchase Order ${purchaseToDelete.purchase_number} has been deleted successfully!`, 'success');
  };

  const handleApplyPurchasesFilters = () => {
    playSynthSound('click');
    setAppliedPurchasesFilters({
      search: purchasesSearch,
      paymentStatus: purchasesPaymentStatusFilter
    });
  };

  const handleRefreshPurchasesFilters = () => {
    playSynthSound('click');
    setPurchasesSearch('');
    setPurchasesPaymentStatusFilter('All');
    setAppliedPurchasesFilters({ search: '', paymentStatus: 'All' });
    setHeaderSearch('');
  };

  // Categories Page Filtering
  const handleApplyCategoriesFilters = () => {
    playSynthSound('click');
    setAppliedCategoriesFilters({
      search: categoriesSearchQuery,
      status: categoriesStatusFilter
    });
  };

  const handleRefreshCategoriesFilters = () => {
    playSynthSound('click');
    setCategoriesSearchQuery('');
    setCategoriesStatusFilter('All');
    setAppliedCategoriesFilters({ search: '', status: 'All' });
    setHeaderSearch('');
  };

  // Image Upload Handlers for Categories
  const handleCategoryImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        triggerAlert('Image Too Large', 'Maximum image upload size is 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCatImagePreview(reader.result);
        setCatImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryDragOver = (e) => {
    e.preventDefault();
  };

  const handleCategoryDragLeave = (e) => {
    e.preventDefault();
  };

  const handleCategoryDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        triggerAlert('Image Too Large', 'Maximum image upload size is 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCatImagePreview(reader.result);
        setCatImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryRemoveImage = () => {
    setCatImagePreview(null);
    setCatImage('');
  };

  // Auto-generate slug from name helper
  const generateSlugFromName = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleCategoryNameChange = (val) => {
    setCatName(val);
    setCatSlug(generateSlugFromName(val));
  };

  const handleResetCategoryForm = () => {
    setCatName('');
    setCatSlug('');
    setCatParent('');
    setCatStatus('Active');
    setCatIcon('fa-tag');
    setCatColor('#0EA5E9');
    setCatImage('');
    setCatImagePreview(null);
    setCatDescription('');
    setEditingCategoryId(null);
  };

  const handleSaveCategory = async (e) => {
    if (e) e.preventDefault();
    if (!catName) {
      triggerAlert('Required Field', 'Category Name is required.', 'error');
      return;
    }

    setCatSaving(true);
    const categoryData = {
      name: catName,
      slug: catSlug || generateSlugFromName(catName),
      parent_category: catParent || null,
      icon: catIcon,
      color: catColor,
      image: catImage,
      description: catDescription,
      status: catStatus
    };

    try {
      if (editingCategoryId) {
        // Edit Mode
        let updatedCategory;
        if (editingCategoryId.length === 24) {
          const res = await api.put(`/categories/${editingCategoryId}`, categoryData);
          updatedCategory = {
            id: res.data._id || res.data.id,
            name: res.data.name,
            slug: res.data.slug,
            parent_category: res.data.parent_category,
            description: res.data.description || '',
            status: res.data.status || 'Active',
            icon: res.data.icon || 'fa-tag',
            color: res.data.color || '#0EA5E9',
            image: res.data.image || ''
          };
        } else {
          // Local mock update
          updatedCategory = {
            id: editingCategoryId,
            ...categoryData
          };
        }
        setCategoriesList(prev => prev.map(c => c.id === editingCategoryId ? updatedCategory : c));
        triggerAlert('Success', `Category "${updatedCategory.name}" has been updated successfully!`, 'success');
      } else {
        // Create Mode
        const res = await api.post('/categories', categoryData);
        const newCategory = {
          id: res.data._id || res.data.id,
          name: res.data.name,
          slug: res.data.slug,
          parent_category: res.data.parent_category,
          description: res.data.description || '',
          status: res.data.status || 'Active',
          icon: res.data.icon || 'fa-tag',
          color: res.data.color || '#0EA5E9',
          image: res.data.image || ''
        };
        setCategoriesList([newCategory, ...categoriesList]);
        triggerAlert('Success', `Category "${newCategory.name}" has been created successfully!`, 'success');
      }
      handleResetCategoryForm();
      setCategoriesSubView('list');
    } catch (err) {
      console.error('Error saving category:', err);
      const errMsg = err.response?.data?.message || 'Server error saving category.';
      triggerAlert('Save Failed', errMsg, 'error');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    playSynthSound('click');
    const categoryToDelete = categoriesList.find(c => c.id === categoryId);
    if (!categoryToDelete) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete the category "${categoryToDelete.name}"?`);
    if (!confirmDelete) return;

    try {
      // If it's a valid MongoDB ObjectId (24 hex characters)
      if (categoryId && typeof categoryId === 'string' && categoryId.length === 24) {
        await api.delete(`/categories/${categoryId}`);
      }
      setCategoriesList(prev => prev.filter(c => c.id !== categoryId));
      triggerAlert('Deleted', `Category "${categoryToDelete.name}" has been deleted successfully!`, 'success');
    } catch (err) {
      console.error('Error deleting category:', err);
      const errMsg = err.response?.data?.message || 'Server error deleting category.';
      triggerAlert('Delete Failed', errMsg, 'error');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliersList(res.data.map(sup => ({
        id: sup._id || sup.id,
        name: sup.name,
        code: sup.code,
        contact_person: sup.contact_person || '',
        designation: sup.designation || '',
        email: sup.email || '',
        phone: sup.phone || '',
        alt_phone: sup.alt_phone || '',
        website: sup.website || '',
        address: sup.address || '',
        country: sup.country || '',
        state: sup.state || '',
        city: sup.city || '',
        pin_code: sup.pin_code || '',
        payment_terms: sup.payment_terms || 'net_30',
        credit_limit: sup.credit_limit || 0,
        tax_id: sup.tax_id || '',
        notes: sup.notes || '',
        status: sup.status || 'Active'
      })));
    } catch (err) {
      console.warn('Could not load suppliers from backend:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomersList(res.data.map(cust => ({
        id: cust._id || cust.id,
        name: cust.name,
        email: cust.email || '',
        phone: cust.phone || '',
        address: cust.address || '',
        city: cust.city || '',
        state: cust.state || '',
        country: cust.country || '',
        zip_code: cust.zip_code || '',
        notes: cust.notes || '',
        status: cust.status || 'Active',
        created_at: cust.created_at
      })));
    } catch (err) {
      console.warn('Could not load customers from backend:', err);
    }
  };

  const fetchReportsData = async () => {
    setReportsLoading(true);
    try {
      const salesRes = await api.get('/reports/sales-audit');
      setSalesAuditList(salesRes.data);

      const valuationRes = await api.get('/reports/inventory-valuation');
      setInventoryValuationData(valuationRes.data);

      const purchaseRes = await api.get('/reports/purchase-log');
      setPurchaseLogList(purchaseRes.data);
    } catch (err) {
      console.error('Failed to load reports data:', err);
      triggerAlert('Load Failed', 'Failed to compile reports statistics from the backend.', 'error');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleResetSupplierForm = () => {
    setSupName('');
    setSupCode('');
    setSupContactPerson('');
    setSupDesignation('');
    setSupEmail('');
    setSupPhone('');
    setSupAltPhone('');
    setSupWebsite('');
    setSupAddress('');
    setSupCountry('');
    setSupState('');
    setSupCity('');
    setSupPinCode('');
    setSupPaymentTerms('net_30');
    setSupCreditLimit('0.00');
    setSupTaxId('');
    setSupNotes('');
    setSupStatus('Active');
    setEditingSupplierId(null);
  };

  const handleSaveSupplier = async (e) => {
    if (e) e.preventDefault();
    if (!supName || !supCode) {
      triggerAlert('Required Info', 'Supplier Name and Supplier Code are required.', 'error');
      return;
    }

    setSupSaving(true);
    const supplierData = {
      name: supName,
      code: supCode,
      contact_person: supContactPerson,
      designation: supDesignation,
      email: supEmail,
      phone: supPhone,
      alt_phone: supAltPhone,
      website: supWebsite,
      address: supAddress,
      country: supCountry,
      state: supState,
      city: supCity,
      pin_code: supPinCode,
      payment_terms: supPaymentTerms,
      credit_limit: parseFloat(supCreditLimit) || 0,
      tax_id: supTaxId,
      notes: supNotes,
      status: supStatus
    };

    try {
      if (editingSupplierId) {
        // Edit Mode
        const res = await api.put(`/suppliers/${editingSupplierId}`, supplierData);
        triggerAlert('Success', `Supplier "${res.data.name}" has been updated successfully!`, 'success');
      } else {
        // Create Mode
        const res = await api.post('/suppliers', supplierData);
        triggerAlert('Success', `Supplier "${res.data.name}" has been registered successfully!`, 'success');
      }
      handleResetSupplierForm();
      fetchSuppliers();
      setSuppliersSubView('list');
    } catch (err) {
      console.error('Error saving supplier:', err);
      const errMsg = err.response?.data?.message || 'Server error saving supplier.';
      triggerAlert('Save Failed', errMsg, 'error');
    } finally {
      setSupSaving(false);
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    playSynthSound('click');
    const supplierToDelete = suppliersList.find(s => s.id === supplierId);
    if (!supplierToDelete) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete supplier "${supplierToDelete.name}"?`);
    if (!confirmDelete) return;

    try {
      await api.delete(`/suppliers/${supplierId}`);
      triggerAlert('Deleted', `Supplier "${supplierToDelete.name}" has been deleted successfully!`, 'success');
      fetchSuppliers();
    } catch (err) {
      console.error('Error deleting supplier:', err);
      const errMsg = err.response?.data?.message || 'Server error deleting supplier.';
      triggerAlert('Delete Failed', errMsg, 'error');
    }
  };

  const handleResetCustomerForm = () => {
    setCustName('');
    setCustEmail('');
    setCustPhone('');
    setCustAddress('');
    setCustCity('');
    setCustState('');
    setCustCountry('');
    setCustZipCode('');
    setCustNotes('');
    setCustStatus('Active');
    setEditingCustomerId(null);
  };

  const handleSaveCustomer = async (e) => {
    if (e) e.preventDefault();
    if (!custName) {
      triggerAlert('Required Info', 'Customer Name is required.', 'error');
      return;
    }

    setCustSaving(true);
    const customerData = {
      name: custName,
      email: custEmail,
      phone: custPhone,
      address: custAddress,
      city: custCity,
      state: custState,
      country: custCountry,
      zip_code: custZipCode,
      notes: custNotes,
      status: custStatus
    };

    try {
      if (editingCustomerId) {
        // Edit Mode
        const res = await api.put(`/customers/${editingCustomerId}`, customerData);
        triggerAlert('Success', `Customer "${res.data.name}" has been updated successfully!`, 'success');
      } else {
        // Create Mode
        const res = await api.post('/customers', customerData);
        triggerAlert('Success', `Customer "${res.data.name}" has been registered successfully!`, 'success');
      }
      handleResetCustomerForm();
      fetchCustomers();
      setCustomersSubView('list');
    } catch (err) {
      console.error('Error saving customer:', err);
      const errMsg = err.response?.data?.message || 'Server error saving customer.';
      triggerAlert('Save Failed', errMsg, 'error');
    } finally {
      setCustSaving(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    playSynthSound('click');
    const customerToDelete = customersList.find(c => c.id === customerId);
    if (!customerToDelete) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete customer "${customerToDelete.name}"?`);
    if (!confirmDelete) return;

    try {
      await api.delete(`/customers/${customerId}`);
      triggerAlert('Deleted', `Customer "${customerToDelete.name}" has been deleted successfully!`, 'success');
      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      const errMsg = err.response?.data?.message || 'Server error deleting customer.';
      triggerAlert('Delete Failed', errMsg, 'error');
    }
  };

  const handleExportPurchasesPDF = () => {
    playSynthSound('click');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerAlert('Popup Blocked', 'Please allow popups to export the purchases report.', 'error');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Purchases Report - Zero Inventory</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
            h1 { font-family: 'Outfit', sans-serif; color: #0f172a; margin-bottom: 5px; }
            p { color: #64748b; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
            th { background-color: #f8fafc; font-weight: bold; color: #475569; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .badge-paid { background-color: #dcfce7; color: #15803d; }
            .badge-pending { background-color: #fef3c7; color: #d97706; }
            .badge-failed { background-color: #fee2e2; color: #b91c1c; }
            .grand-total { font-weight: bold; }
            .summary { margin-top: 30px; border-top: 2px solid #e2e8f0; padding-top: 15px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>Zero Inventory - Purchases Registry Report</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Purchase Number</th>
                <th>Supplier / Vendor</th>
                <th>Purchase Date</th>
                <th>Payment Status</th>
                <th>Grand Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPurchases.map(p => `
                <tr>
                  <td><strong>${p.purchase_number}</strong></td>
                  <td>${p.supplier_name}</td>
                  <td>${new Date(p.purchase_date).toLocaleDateString()}</td>
                  <td><span class="badge ${p.payment_status === 'Paid' ? 'badge-paid' : p.payment_status === 'Pending' ? 'badge-pending' : 'badge-failed'}">${p.payment_status}</span></td>
                  <td class="grand-total">$${parseFloat(p.grand_total).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="summary">
            <h3>Total Purchases Amount: $${filteredPurchases.reduce((sum, p) => sum + parseFloat(p.grand_total), 0).toFixed(2)}</h3>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportReportsPDF = () => {
    playSynthSound('click');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerAlert('Popup Blocked', 'Please allow popups to export the report.', 'error');
      return;
    }

    let reportTitle = '';
    let tableHeadersHtml = '';
    let tableRowsHtml = '';
    let summaryHtml = '';

    if (reportsActiveTab === 'sales') {
      reportTitle = 'Daily Sales Income Aggregation Report';
      tableHeadersHtml = `
        <th>Sale Date</th>
        <th>Invoices Issued</th>
        <th>Total Daily Revenue</th>
      `;
      tableRowsHtml = salesAuditList.map(s => `
        <tr>
          <td>${new Date(s.saleDate).toLocaleDateString()}</td>
          <td>${s.invoicesIssued}</td>
          <td>$${parseFloat(s.totalDailyRevenue).toFixed(2)}</td>
        </tr>
      `).join('');
      const totalRevenue = salesAuditList.reduce((sum, s) => sum + parseFloat(s.totalDailyRevenue), 0);
      summaryHtml = `<h3>Total Revenue: $${totalRevenue.toFixed(2)}</h3>`;
    } else if (reportsActiveTab === 'valuation') {
      reportTitle = 'Catalog Valuation Audit Report';
      tableHeadersHtml = `
        <th>Product</th>
        <th>Category</th>
        <th>On Hand Qty</th>
        <th>Purchase Cost</th>
        <th>Total Cost Value</th>
        <th>Selling Price</th>
        <th>Expected Value</th>
        <th>Margin</th>
      `;
      tableRowsHtml = (inventoryValuationData.items || []).map(item => `
        <tr>
          <td><strong>${item.name}</strong><br/><span style="font-size:10px;color:#64748b">${item.sku}</span></td>
          <td>${item.category}</td>
          <td>${item.quantity}</td>
          <td>$${parseFloat(item.purchaseCost).toFixed(2)}</td>
          <td>$${parseFloat(item.totalCostValue).toFixed(2)}</td>
          <td>$${parseFloat(item.sellingPrice).toFixed(2)}</td>
          <td>$${parseFloat(item.expectedValue).toFixed(2)}</td>
          <td>${item.marginContribution}%</td>
        </tr>
      `).join('');
      summaryHtml = `
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <div><strong>Total Cost Value:</strong> $${(inventoryValuationData.summary?.totalInventoryValue || 0).toFixed(2)}</div>
          <div><strong>Expected Sales Return:</strong> $${(inventoryValuationData.summary?.expectedSalesReturn || 0).toFixed(2)}</div>
          <div><strong>Potential Profit:</strong> $${(inventoryValuationData.summary?.potentialProfit || 0).toFixed(2)}</div>
        </div>
      `;
    } else {
      reportTitle = 'Supplier Purchase Order Outflow Aggregation Report';
      tableHeadersHtml = `
        <th>Purchase Date</th>
        <th>Orders Completed</th>
        <th>Total Cost Outflow</th>
      `;
      tableRowsHtml = purchaseLogList.map(p => `
        <tr>
          <td>${new Date(p.purchaseDate).toLocaleDateString()}</td>
          <td>${p.ordersCompleted}</td>
          <td>$${parseFloat(p.totalCostOutflow).toFixed(2)}</td>
        </tr>
      `).join('');
      const totalOutflow = purchaseLogList.reduce((sum, p) => sum + parseFloat(p.totalCostOutflow), 0);
      summaryHtml = `<h3>Total Cost Outflow: $${totalOutflow.toFixed(2)}</h3>`;
    }

    const htmlContent = `
      <html>
        <head>
          <title>${reportTitle} - Zero Inventory</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
            h1 { font-family: 'Outfit', sans-serif; color: #0f172a; margin-bottom: 5px; }
            p { color: #64748b; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
            th { background-color: #f8fafc; font-weight: bold; color: #475569; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .summary { margin-top: 30px; border-top: 2px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <h1>Zero Inventory - ${reportTitle}</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                ${tableHeadersHtml}
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml || '<tr><td colspan="10" style="text-align:center">No records found.</td></tr>'}
            </tbody>
          </table>
          <div class="summary">
            ${summaryHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredPurchases = purchasesList.filter(p => {
    const searchMatch = !appliedPurchasesFilters.search ||
      p.purchase_number.toLowerCase().includes(appliedPurchasesFilters.search.toLowerCase()) ||
      p.supplier_name.toLowerCase().includes(appliedPurchasesFilters.search.toLowerCase());

    const paymentMatch = appliedPurchasesFilters.paymentStatus === 'All' ||
      p.payment_status.toLowerCase() === appliedPurchasesFilters.paymentStatus.toLowerCase();

    return searchMatch && paymentMatch;
  });

  // Drag and Drop File Handlers for Recording Sale
  const handleSaleDragOver = (e) => {
    e.preventDefault();
    setSaleDragOver(true);
  };

  const handleSaleDragLeave = () => {
    setSaleDragOver(false);
  };

  const handleSaleDrop = (e) => {
    e.preventDefault();
    setSaleDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleSaleFileLoad(file);
    }
  };

  const handleSaleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleSaleFileLoad(file);
    }
  };

  const handleSaleFileLoad = (file) => {
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
      setSaleReceiptImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaleRemoveImage = () => {
    playSynthSound('click');
    setSaleReceiptImage(null);
  };

  const handleOpenRecordSaleModal = () => {
    playSynthSound('click');
    const today = new Date();
    const dateStr = today.getFullYear() + 
      String(today.getMonth() + 1).padStart(2, '0') + 
      String(today.getDate()).padStart(2, '0');
    // Generate a random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setSaleInvoiceNumber(`INV-${dateStr}-${randomNum}`);
    
    // Set default date to today in YYYY-MM-DD format for date input
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setSaleDateInput(`${year}-${month}-${day}`);
    
    // Reset other form fields
    setSaleCustomerName('');
    setSaleGrandTotalInput('0.00');
    setSalePaymentMethod('Cash');
    setSaleReceiptImage(null);
    setShowRecordSaleModal(true);
  };

  const handleSaveInvoiceFromModal = (e) => {
    e.preventDefault();

    if (!saleCustomerName || !saleDateInput || !saleGrandTotalInput) {
      triggerAlert('Required Info', 'Please fill in all required fields marked with a red asterisk.', 'error');
      return;
    }

    const total = parseFloat(saleGrandTotalInput) || 0;
    if (total <= 0) {
      triggerAlert('Invalid Amount', 'Grand Total must be greater than 0.', 'error');
      return;
    }

    const newSale = {
      id: (salesList.length + 1).toString(),
      invoice_number: saleInvoiceNumber,
      customer_name: saleCustomerName,
      sale_date: saleDateInput,
      grand_total: total,
      payment_method: salePaymentMethod,
      status: 'Paid',
      receipt_image: saleReceiptImage || ''
    };

    setSalesList([newSale, ...salesList]);

    // Prepend to recentSales so it syncs with the dashboard activity
    const newRecentSale = {
      _id: newSale.id,
      invoice_number: newSale.invoice_number,
      customer_name: newSale.customer_name,
      grand_total: newSale.grand_total,
      sale_date: newSale.sale_date
    };
    setRecentSales(prevSales => [newRecentSale, ...prevSales]);

    setShowRecordSaleModal(false);
    triggerAlert('Invoice Saved', `Invoice ${saleInvoiceNumber} has been recorded successfully!`, 'success');
  };

  const handleDeleteInvoice = (saleId) => {
    playSynthSound('click');
    const invoiceToDelete = salesList.find(s => s.id === saleId);
    if (!invoiceToDelete) return;
    
    // Remove from salesList
    setSalesList(prevList => prevList.filter(s => s.id !== saleId));
    // Remove from recentSales
    setRecentSales(prevSales => prevSales.filter(s => s._id !== saleId && s.id !== saleId));
    
    triggerAlert('Invoice Deleted', `Invoice ${invoiceToDelete.invoice_number} has been deleted successfully!`, 'success');
  };

  const handleDirectSaleProduct = (product) => {
    playSynthSound('click');
    
    // Check stock
    if (product.quantity <= 0) {
      triggerAlert('Out of Stock', 'This product is out of stock and cannot be sold.', 'error');
      return;
    }

    // Add to Generate Bill selections
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

    // Switch tab to billing
    setActiveTab('billing');
    window.location.hash = '#billing';
    
    triggerAlert('Product Added', `Added ${product.name} to the invoice builder.`, 'success');
  };

  const handleApplySalesFilters = () => {
    playSynthSound('click');
    setAppliedSalesFilters({
      search: salesSearch,
      paymentMethod: salesPaymentFilter
    });
  };

  const handleRefreshSalesFilters = () => {
    playSynthSound('click');
    setSalesSearch('');
    setSalesPaymentFilter('All');
    setAppliedSalesFilters({ search: '', paymentMethod: 'All' });
    setHeaderSearch('');
  };

  const handleExportPDF = () => {
    playSynthSound('click');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerAlert('Popup Blocked', 'Please allow popups to export the sales report.', 'error');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Sales Report - Zero Inventory</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
            h1 { font-family: 'Outfit', sans-serif; color: #0f172a; margin-bottom: 5px; }
            p { color: #64748b; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
            th { background-color: #f8fafc; font-weight: bold; color: #475569; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { background-color: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .grand-total { font-weight: bold; }
            .summary { margin-top: 30px; border-top: 2px solid #e2e8f0; padding-top: 15px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>Zero Inventory - Sales Registry Report</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Customer Name</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Grand Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales.map(sale => `
                <tr>
                  <td><strong>${sale.invoice_number}</strong></td>
                  <td>${sale.customer_name}</td>
                  <td>${new Date(sale.sale_date).toLocaleDateString()}</td>
                  <td>${sale.payment_method}</td>
                  <td><span class="badge">${sale.status}</span></td>
                  <td class="grand-total">$${parseFloat(sale.grand_total).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="summary">
            <h3>Total Sales Amount: $${filteredSales.reduce((sum, s) => sum + parseFloat(s.grand_total), 0).toFixed(2)}</h3>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredSales = salesList.filter(s => {
    const searchMatch = !appliedSalesFilters.search ||
      s.invoice_number.toLowerCase().includes(appliedSalesFilters.search.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(appliedSalesFilters.search.toLowerCase());

    const paymentMatch = appliedSalesFilters.paymentMethod === 'All' ||
      s.payment_method.toLowerCase() === appliedSalesFilters.paymentMethod.toLowerCase();

    return searchMatch && paymentMatch;
  });


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

    // Deduct sold quantities from inventory products
    setInventoryProducts(prevProducts => 
      prevProducts.map(p => {
        const soldItem = selectedProducts.find(item => item.id === p.id);
        if (soldItem) {
          return {
            ...p,
            quantity: Math.max(0, p.quantity - soldItem.qtyToSell)
          };
        }
        return p;
      })
    );

    // Save sale to Sales Registry list
    const newSale = {
      id: (salesList.length + 1).toString(),
      invoice_number: invoiceId,
      customer_name: customerName,
      sale_date: new Date().toISOString().split('T')[0],
      grand_total: billingGrandTotal,
      payment_method: paymentMethod,
      status: 'Paid',
      receipt_image: ''
    };
    setSalesList(prevList => [newSale, ...prevList]);

    // Save to Recent Activity dashboard stats
    const newRecentSale = {
      _id: newSale.id,
      invoice_number: newSale.invoice_number,
      customer_name: newSale.customer_name,
      grand_total: newSale.grand_total,
      sale_date: newSale.sale_date
    };
    setRecentSales(prevSales => [newRecentSale, ...prevSales]);

    triggerAlert('Invoice Generated', `Invoice ${invoiceId} for ${customerName} has been generated successfully! Grand Total: $${billingGrandTotal.toFixed(2)}`, 'success');
    
    // Clear invoice inputs
    setCustomerName('');
    setSelectedProducts([]);
    setItemSearch('');
    setCatalogSearch('');

    // Generate a fresh invoice number for the next sale
    const today = new Date();
    const dateStr = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
    const randStr = Math.floor(1000 + Math.random() * 9000);
    setInvoiceId(`INV-${dateStr}-${randStr}`);
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
        
        // Synchronize backend sales if available
        if (res.data.recentActivity?.sales && res.data.recentActivity.sales.length > 0) {
          const apiSales = res.data.recentActivity.sales.map((s, idx) => ({
            id: s._id || s.id || `api-${idx}`,
            invoice_number: s.invoice_number,
            customer_name: s.customer_name,
            sale_date: s.sale_date,
            grand_total: s.grand_total,
            payment_method: s.payment_method || 'Cash',
            status: 'Paid',
            receipt_image: ''
          }));
          setSalesList(apiSales);
        }

        // Synchronize backend purchases if available
        if (res.data.recentActivity?.purchases && res.data.recentActivity.purchases.length > 0) {
          const apiPurchases = res.data.recentActivity.purchases.map((p, idx) => ({
            id: p._id || p.id || `api-purch-${idx}`,
            purchase_number: p.purchase_number,
            supplier_name: p.supplier_name,
            purchase_date: p.purchase_date,
            grand_total: p.grand_total,
            payment_status: 'Paid'
          }));
          setPurchasesList(apiPurchases);
        }
        
        // Synchronize backend categories if available
        try {
          const catRes = await api.get('/categories');
          if (catRes.data && catRes.data.length > 0) {
            setCategoriesList(catRes.data.map(cat => ({
              id: cat._id || cat.id,
              name: cat.name,
              slug: cat.slug,
              parent_category: cat.parent_category,
              description: cat.description || '',
              status: cat.status || 'Active',
              icon: cat.icon || 'fa-tag',
              color: cat.color || '#0EA5E9',
              image: cat.image || ''
            })));
          }
        } catch (catErr) {
          console.warn('Could not load categories from backend, using fallback mock data:', catErr);
        }
        
        await fetchSuppliers();
        await fetchCustomers();
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReportsData();
    }
  }, [activeTab]);

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
        .btn-blue-primary {
          background-color: #0EA5E9 !important;
          border-color: #0EA5E9 !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          transition: all 0.2s ease !important;
        }
        .btn-blue-primary:hover {
          background-color: #0056b3 !important;
          border-color: #0056b3 !important;
        }
        @keyframes scaleUp {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      
      {/* Mobile Sidebar Backdrop Overlay */}
      <div className={`sidebar-backdrop-overlay ${mobileSidebarOpen ? 'show' : ''}`} onClick={() => setMobileSidebarOpen(false)}></div>

      {/* Sidebar navigation */}
      <aside className={`new-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
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
        <div className="sidebar-nav-container" style={{ flexGrow: 1, overflowY: 'auto', padding: '0.85rem 0.85rem 0 0.85rem' }} onClick={() => setMobileSidebarOpen(false)}>
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
              onClick={() => { playSynthSound('click'); setActiveTab('billing-subscription'); window.location.hash = '#billing-subscription'; }}
            >
              Upgrade Now
            </button>
          </div>

          {/* Merchant Logout Profile Card */}
          <div className="sidebar-bottom-user d-flex align-items-center justify-content-between text-dark" style={{ padding: '0.95rem 1.1rem', backgroundColor: '#f8fafc' }}>
            <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, cursor: 'pointer' }} onClick={() => { playSynthSound('click'); setActiveTab('settings'); window.location.hash = '#settings'; }} title="Go to Account Settings">
              {user?.avatar ? (
                <img src={getAvatarUrl(user.avatar)} alt="Avatar" className="rounded-circle" style={{ width: '30px', height: '30px', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div className="avatar-circle rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '30px', height: '30px', fontSize: '0.85rem', backgroundColor: '#e2e8f0', color: '#1e293b', flexShrink: 0 }}>
                  {userInitial()}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.76rem', lineHeight: '1.2' }}>{user?.name || 'Merchant Account'}</div>
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
      <main className="new-main">
        
        {/* Header Tools */}
        <header className="new-header" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', height: '50px', padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 90 }}>
          <div className="d-flex align-items-center gap-3" style={{ flexGrow: 1 }}>
            <button 
              className="btn p-0 text-secondary border-0 d-lg-none" 
              onClick={() => { playSynthSound('click'); setMobileSidebarOpen(!mobileSidebarOpen); }}
            >
              <i className="fa-solid fa-bars fs-5"></i>
            </button>
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
                  if (activeTab === 'sales') {
                    setSalesSearch(e.target.value);
                    setAppliedSalesFilters(prev => ({ ...prev, search: e.target.value }));
                  } else if (activeTab === 'purchases') {
                    setPurchasesSearch(e.target.value);
                    setAppliedPurchasesFilters(prev => ({ ...prev, search: e.target.value }));
                  } else if (activeTab === 'categories') {
                    setCategoriesSearchQuery(e.target.value);
                    setAppliedCategoriesFilters(prev => ({ ...prev, search: e.target.value }));
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

            <button className="btn p-1 text-secondary" onClick={() => { playSynthSound('click'); setActiveTab('settings'); window.location.hash = '#settings'; }} style={{ color: '#64748b' }} title="Account Settings"><i className="fa-solid fa-gear" style={{ fontSize: '1rem' }}></i></button>
            <div className="position-relative">
              <button className="btn p-1 text-secondary" onClick={() => playSynthSound('click')} style={{ color: '#64748b' }}>
                <i className="fa-regular fa-bell" style={{ fontSize: '1rem' }}></i>
                <span className="position-absolute p-0.5 bg-danger border border-light rounded-circle" style={{ borderColor: '#ffffff', top: '2px', right: '2px' }}></span>
              </button>
            </div>
            
            <div className="user-avatar-circle rounded-circle d-flex align-items-center justify-content-center fw-semibold text-info" style={{ width: '26px', height: '26px', fontSize: '0.75rem', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', overflow: 'hidden' }}>
              {user?.avatar ? (
                <img src={getAvatarUrl(user.avatar)} alt="Avatar" className="w-100 h-100" style={{ objectFit: 'cover' }} />
              ) : (
                userInitial()
              )}
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



          {/* Render Sales Tab */}
          {activeTab === 'sales' && (
            <div className="sales-registry-view animate-fade-in" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              
              {/* Title Banner */}
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                <div>
                  <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>Sales Registry</h1>
                  <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', color: '#0EA5E9' }}>
                    <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => { playSynthSound('click'); setActiveTab('dashboard'); window.location.hash = '#dashboard'; }}>Dashboard</span>
                    <span className="text-secondary">/</span>
                    <span className="fw-semibold">Sales</span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold" 
                    style={{ fontSize: '0.75rem', borderRadius: '6px', backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#475569' }} 
                    onClick={handleExportPDF}
                  >
                    <i className="fa-solid fa-file-export"></i> Export / Print PDF
                  </button>
                  <button 
                    className="btn btn-blue-primary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold" 
                    style={{ fontSize: '0.75rem', borderRadius: '6px' }} 
                    onClick={handleOpenRecordSaleModal}
                  >
                    <i className="fa-solid fa-file-invoice"></i> Record New Invoice
                  </button>
                </div>
              </div>

              {/* Filters Section */}
              <div className="p-3 rounded-3 shadow-sm border bg-white mb-3" style={{ borderColor: '#cbd5e1' }}>
                <div className="row g-3 align-items-end">
                  <div className="col-md-5">
                    <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Search Invoices</label>
                    <div className="position-relative">
                      <i className="fa-solid fa-magnifying-glass text-secondary position-absolute" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#64748b' }}></i>
                      <input 
                        type="text" 
                        className="form-control-premium-dark" 
                        style={{ paddingLeft: '2.1rem' }} 
                        placeholder="Search Invoice No. or Customer Name..." 
                        value={salesSearch}
                        onChange={(e) => setSalesSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Payment Method</label>
                    <select 
                      className="form-control-premium-dark"
                      value={salesPaymentFilter}
                      onChange={(e) => setSalesPaymentFilter(e.target.value)}
                    >
                      <option value="All">All payment methods</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>
                  <div className="col-md-3 d-flex gap-2">
                    <button 
                      className="btn btn-blue-primary w-100 py-2 fw-semibold"
                      style={{ fontSize: '0.8rem', borderRadius: '6px' }}
                      onClick={handleApplySalesFilters}
                    >
                      Search
                    </button>
                    <button 
                      className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                      style={{ width: '38px', height: '38px', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff' }}
                      onClick={handleRefreshSalesFilters}
                      title="Refresh Filters"
                    >
                      <i className="fa-solid fa-arrows-rotate" style={{ color: '#475569' }}></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                <div className="table-responsive">
                  <table className="table align-middle table-hover-light mb-0">
                    <thead>
                      <tr className="small text-secondary" style={{ fontSize: '0.72rem', borderBottom: '2px solid #e2e8f0' }}>
                        <th>Invoice Number</th>
                        <th>Customer Name</th>
                        <th>Date</th>
                        <th>Grand Total</th>
                        <th>Payment Method</th>
                        <th>Status</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-5 text-secondary" style={{ color: '#64748b' }}>
                            <div className="d-flex flex-column align-items-center justify-content-center">
                              <i className="fa-solid fa-folder-open text-muted mb-2.5" style={{ fontSize: '3rem', color: '#cbd5e1', opacity: '0.6' }}></i>
                              <p className="mb-0 fw-semibold" style={{ fontSize: '0.8rem' }}>
                                No sales invoices recorded yet. Click "Record New Invoice" to add one.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredSales.map(sale => (
                          <tr key={sale.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td className="fw-bold" style={{ color: '#0f172a' }}>{sale.invoice_number}</td>
                            <td>{sale.customer_name}</td>
                            <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                            <td className="fw-semibold text-dark">${parseFloat(sale.grand_total).toFixed(2)}</td>
                            <td>{sale.payment_method}</td>
                            <td>
                              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 px-2.5 py-1" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)', fontSize: '0.7rem', borderRadius: '4px' }}>
                                {sale.status}
                              </span>
                            </td>
                            <td className="text-center">
                              <div className="d-flex align-items-center justify-content-center gap-3">
                                <button 
                                  type="button" 
                                  className="btn btn-link text-primary p-0 border-0" 
                                  onClick={() => { playSynthSound('click'); setSelectedInvoiceDetails(sale); }}
                                  style={{ fontSize: '0.78rem', color: '#0EA5E9', textDecoration: 'none', fontWeight: '600' }}
                                >
                                  Details
                                </button>
                                <button 
                                  type="button" 
                                  className="btn btn-link text-danger p-0 border-0" 
                                  onClick={() => handleDeleteInvoice(sale.id)}
                                  title="Delete Invoice"
                                  style={{ display: 'flex', alignItems: 'center' }}
                                >
                                  <i className="fa-solid fa-trash-can" style={{ fontSize: '0.85rem' }}></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Render Purchases Tab */}
          {activeTab === 'purchases' && (
            <div className="purchases-registry-view animate-fade-in" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              
              {/* Title Banner */}
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                <div>
                  <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>Purchases Registry</h1>
                  <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', color: '#0EA5E9' }}>
                    <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => { playSynthSound('click'); setActiveTab('dashboard'); window.location.hash = '#dashboard'; }}>Dashboard</span>
                    <span className="text-secondary">/</span>
                    <span className="fw-semibold">Purchases</span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold" 
                    style={{ fontSize: '0.75rem', borderRadius: '6px', backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#475569' }} 
                    onClick={handleExportPurchasesPDF}
                  >
                    <i className="fa-solid fa-file-export"></i> Export / Print PDF
                  </button>
                  <button 
                    className="btn btn-blue-primary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold" 
                    style={{ fontSize: '0.75rem', borderRadius: '6px' }} 
                    onClick={handleOpenRecordPurchaseModal}
                  >
                    <i className="fa-solid fa-cart-shopping"></i> Record New Purchase
                  </button>
                </div>
              </div>

              {/* Filters Section */}
              <div className="p-3 rounded-3 shadow-sm border bg-white mb-3" style={{ borderColor: '#cbd5e1' }}>
                <div className="row g-3 align-items-end">
                  <div className="col-md-5">
                    <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Search Purchases</label>
                    <div className="position-relative">
                      <i className="fa-solid fa-magnifying-glass text-secondary position-absolute" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#64748b' }}></i>
                      <input 
                        type="text" 
                        className="form-control-premium-dark" 
                        style={{ paddingLeft: '2.1rem' }} 
                        placeholder="Search Order No. or Supplier Name..." 
                        value={purchasesSearch}
                        onChange={(e) => setPurchasesSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Payment Status</label>
                    <select 
                      className="form-control-premium-dark"
                      value={purchasesPaymentStatusFilter}
                      onChange={(e) => setPurchasesPaymentStatusFilter(e.target.value)}
                    >
                      <option value="All">All payment status</option>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                  <div className="col-md-3 d-flex gap-2">
                    <button 
                      className="btn btn-blue-primary w-100 py-2 fw-semibold"
                      style={{ fontSize: '0.8rem', borderRadius: '6px' }}
                      onClick={handleApplyPurchasesFilters}
                    >
                      Search
                    </button>
                    <button 
                      className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                      style={{ width: '38px', height: '38px', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff' }}
                      onClick={handleRefreshPurchasesFilters}
                      title="Refresh Filters"
                    >
                      <i className="fa-solid fa-arrows-rotate" style={{ color: '#475569' }}></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                <div className="table-responsive">
                  <table className="table align-middle table-hover-light mb-0">
                    <thead>
                      <tr className="small text-secondary" style={{ fontSize: '0.72rem', borderBottom: '2px solid #e2e8f0' }}>
                        <th>Purchase Number</th>
                        <th>Supplier / Vendor</th>
                        <th>Purchase Date</th>
                        <th>Grand Total</th>
                        <th>Payment Status</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchases.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-5 text-secondary" style={{ color: '#64748b' }}>
                            <div className="d-flex flex-column align-items-center justify-content-center">
                              <i className="fa-solid fa-folder-open text-muted mb-2.5" style={{ fontSize: '3rem', color: '#cbd5e1', opacity: '0.6' }}></i>
                              <p className="mb-0 fw-semibold" style={{ fontSize: '0.8rem' }}>
                                No purchase entries logged yet. Click "Record New Purchase" to add one.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredPurchases.map(purchase => (
                          <tr key={purchase.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td className="fw-bold" style={{ color: '#0f172a' }}>{purchase.purchase_number}</td>
                            <td>{purchase.supplier_name}</td>
                            <td>{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                            <td className="fw-semibold text-dark">${parseFloat(purchase.grand_total).toFixed(2)}</td>
                            <td>
                              <span className={`badge px-2.5 py-1 ${
                                purchase.payment_status === 'Paid' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-20' :
                                purchase.payment_status === 'Pending' ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20' :
                                'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20'
                              }`} style={{ fontSize: '0.7rem', borderRadius: '4px' }}>
                                {purchase.payment_status}
                              </span>
                            </td>
                            <td className="text-center">
                              <div className="d-flex align-items-center justify-content-center gap-3">
                                <button 
                                  type="button" 
                                  className="btn btn-link text-primary p-0 border-0" 
                                  onClick={() => { playSynthSound('click'); setSelectedPurchaseDetails(purchase); }}
                                  style={{ fontSize: '0.78rem', color: '#0EA5E9', textDecoration: 'none', fontWeight: '600' }}
                                >
                                  Details
                                </button>
                                <button 
                                  type="button" 
                                  className="btn btn-link text-danger p-0 border-0" 
                                  onClick={() => handleDeletePurchase(purchase.id)}
                                  title="Delete Purchase"
                                  style={{ display: 'flex', alignItems: 'center' }}
                                >
                                  <i className="fa-solid fa-trash-can" style={{ fontSize: '0.85rem' }}></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Render Categories Tab */}
          {activeTab === 'categories' && (
            <div className="categories-registry-view animate-fade-in" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              {categoriesSubView === 'list' ? (
                /* Categories List Sub-View */
                <>
                  {/* Title Banner */}
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                    <div>
                      <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>Categories Inventory</h1>
                      <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', color: '#0EA5E9' }}>
                        <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => { playSynthSound('click'); setActiveTab('dashboard'); window.location.hash = '#dashboard'; }}>Dashboard</span>
                        <span className="text-secondary">/</span>
                        <span className="fw-semibold">Categories</span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button 
                        className="btn btn-blue-primary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold" 
                        style={{ fontSize: '0.75rem', borderRadius: '6px' }} 
                        onClick={() => { playSynthSound('click'); setCategoriesSubView('add'); }}
                      >
                        <i className="fa-solid fa-plus"></i> Add New Category
                      </button>
                    </div>
                  </div>

                  {/* Filters Section */}
                  <div className="p-3 rounded-3 shadow-sm border bg-white mb-3" style={{ borderColor: '#cbd5e1' }}>
                    <div className="row g-3 align-items-end">
                      <div className="col-md-5">
                        <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Search Categories</label>
                        <div className="position-relative">
                          <i className="fa-solid fa-magnifying-glass text-secondary position-absolute" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#64748b' }}></i>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            style={{ paddingLeft: '2.1rem' }} 
                            placeholder="Search name, slug, parent, description..." 
                            value={categoriesSearchQuery}
                            onChange={(e) => setCategoriesSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Status Filter</label>
                        <select 
                          className="form-control-premium-dark"
                          value={categoriesStatusFilter}
                          onChange={(e) => setCategoriesStatusFilter(e.target.value)}
                        >
                          <option value="All">All statuses</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="col-md-3 d-flex gap-2">
                        <button 
                          className="btn btn-blue-primary w-100 py-2 fw-semibold"
                          style={{ fontSize: '0.8rem', borderRadius: '6px' }}
                          onClick={handleApplyCategoriesFilters}
                        >
                          Filter
                        </button>
                        <button 
                          className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                          style={{ width: '38px', height: '38px', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff' }}
                          onClick={handleRefreshCategoriesFilters}
                          title="Refresh Filters"
                        >
                          <i className="fa-solid fa-arrows-rotate" style={{ color: '#475569' }}></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Data Table */}
                  <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                    <div className="table-responsive">
                      <table className="table align-middle table-hover-light mb-0">
                        <thead>
                          <tr className="small text-secondary" style={{ fontSize: '0.72rem', borderBottom: '2px solid #e2e8f0' }}>
                            <th>Category Name</th>
                            <th>URL Slug</th>
                            <th>Parent Category</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th className="text-center">Delete</th>
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoriesList.filter(cat => {
                            const searchMatch = !appliedCategoriesFilters.search ||
                              cat.name.toLowerCase().includes(appliedCategoriesFilters.search.toLowerCase()) ||
                              cat.slug.toLowerCase().includes(appliedCategoriesFilters.search.toLowerCase()) ||
                              (cat.description && cat.description.toLowerCase().includes(appliedCategoriesFilters.search.toLowerCase())) ||
                              (cat.parent_category && cat.parent_category.toLowerCase().includes(appliedCategoriesFilters.search.toLowerCase()));
                            const statusMatch = appliedCategoriesFilters.status === 'All' ||
                              cat.status === appliedCategoriesFilters.status;
                            return searchMatch && statusMatch;
                          }).length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-5 text-secondary" style={{ color: '#64748b' }}>
                                <div className="d-flex flex-column align-items-center justify-content-center">
                                  <i className="fa-solid fa-folder-open text-muted mb-2.5" style={{ fontSize: '3rem', color: '#cbd5e1', opacity: '0.6' }}></i>
                                  <p className="mb-0 fw-semibold" style={{ fontSize: '0.8rem' }}>
                                    No categories found matching filters.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            categoriesList.filter(cat => {
                              const searchMatch = !appliedCategoriesFilters.search ||
                                cat.name.toLowerCase().includes(appliedCategoriesFilters.search.toLowerCase()) ||
                                cat.slug.toLowerCase().includes(appliedCategoriesFilters.search.toLowerCase()) ||
                                (cat.description && cat.description.toLowerCase().includes(appliedCategoriesFilters.search.toLowerCase())) ||
                                (cat.parent_category && cat.parent_category.toLowerCase().includes(appliedCategoriesFilters.search.toLowerCase()));
                              const statusMatch = appliedCategoriesFilters.status === 'All' ||
                                cat.status === appliedCategoriesFilters.status;
                              return searchMatch && statusMatch;
                            }).map(cat => (
                              <tr key={cat.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td className="fw-bold" style={{ color: '#0f172a' }}>
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '28px', height: '28px', backgroundColor: `${cat.color}15`, color: cat.color }}>
                                      <i className={`fa-solid ${cat.icon}`}></i>
                                    </div>
                                    <span>{cat.name}</span>
                                  </div>
                                </td>
                                <td className="font-monospace" style={{ fontSize: '0.75rem' }}>{cat.slug}</td>
                                <td>{cat.parent_category || <span className="text-muted small">None (Top Level)</span>}</td>
                                <td className="text-truncate" style={{ maxWidth: '200px' }}>{cat.description || <span className="text-muted small italic">No description</span>}</td>
                                <td>
                                  <span className={`badge px-2.5 py-1 ${
                                    cat.status === 'Active' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-20' :
                                    'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20'
                                  }`} style={{ fontSize: '0.7rem', borderRadius: '4px' }}>
                                    {cat.status}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <button 
                                    type="button" 
                                    className="btn btn-link text-danger p-0 border-0" 
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    title="Delete Category"
                                    style={{ display: 'inline-flex', alignItems: 'center' }}
                                  >
                                    <i className="fa-solid fa-trash-can" style={{ fontSize: '0.85rem' }}></i>
                                  </button>
                                </td>
                                <td className="text-center">
                                  <div className="d-flex align-items-center justify-content-center gap-2">
                                    <button 
                                      type="button" 
                                      className="btn btn-link text-primary p-0 border-0" 
                                      onClick={() => {
                                        playSynthSound('click');
                                        setEditingCategoryId(cat.id);
                                        setCatName(cat.name);
                                        setCatSlug(cat.slug);
                                        setCatParent(cat.parent_category || '');
                                        setCatStatus(cat.status);
                                        setCatIcon(cat.icon || 'fa-tag');
                                        setCatColor(cat.color || '#0EA5E9');
                                        setCatDescription(cat.description || '');
                                        setCatImage(cat.image || '');
                                        setCatImagePreview(cat.image || null);
                                        setCategoriesSubView('add');
                                      }}
                                      style={{ fontSize: '0.78rem', color: '#0EA5E9', textDecoration: 'none', fontWeight: '600' }}
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                /* PAGE 2: Add / Edit Category View */
                <>
                  {/* Title Banner */}
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                    <div>
                      <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>{editingCategoryId ? 'Edit Category' : 'Add Category'}</h1>
                      <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', color: '#0EA5E9' }}>
                        <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => { playSynthSound('click'); setActiveTab('dashboard'); }}>Dashboard</span>
                        <span className="text-secondary">/</span>
                        <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => { playSynthSound('click'); setCategoriesSubView('list'); }}>Categories</span>
                        <span className="text-secondary">/</span>
                        <span className="fw-semibold">{editingCategoryId ? 'Edit Category' : 'Add Category'}</span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button 
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold" 
                        style={{ fontSize: '0.75rem', borderRadius: '6px', backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#475569' }} 
                        onClick={() => { playSynthSound('click'); setCategoriesSubView('list'); }}
                      >
                        <i className="fa-solid fa-arrow-left"></i> Back to Categories
                      </button>
                      <button 
                        className="btn btn-blue-primary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold" 
                        style={{ fontSize: '0.75rem', borderRadius: '6px' }} 
                        onClick={handleSaveCategory}
                        disabled={catSaving}
                      >
                        <i className="fa-solid fa-save"></i> {catSaving ? 'Saving...' : (editingCategoryId ? 'Update Category' : 'Save Category')}
                      </button>
                    </div>
                  </div>

                  {/* Main Grid */}
                  <div className="row g-3">
                    {/* Left Form Column */}
                    <div className="col-lg-8 col-md-12">
                      <div className="p-3 rounded-3 shadow-sm border bg-white h-100" style={{ borderColor: '#cbd5e1' }}>
                        <h3 className="fw-bold mb-2 d-flex align-items-center" style={{ fontFamily: 'Outfit', fontSize: '0.92rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.15rem' }}>
                          <i className="fa-solid fa-tags text-primary me-2" style={{ color: '#0EA5E9' }}></i> Category Information
                        </h3>

                        <form onSubmit={handleSaveCategory}>
                          <div className="row g-3 mb-3">
                            <div className="col-md-6">
                              <label className="form-label mb-1.5 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Category Name <span className="text-danger">*</span></label>
                              <input 
                                type="text" 
                                className="form-control-premium-dark" 
                                placeholder="Enter category name" 
                                value={catName}
                                onChange={(e) => handleCategoryNameChange(e.target.value)}
                                required 
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label mb-1.5 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>URL Slug <span className="text-danger">*</span></label>
                              <input 
                                type="text" 
                                className="form-control-premium-dark" 
                                placeholder="enter-url-slug" 
                                value={catSlug}
                                onChange={(e) => setCatSlug(e.target.value)}
                                required 
                              />
                              <span className="small text-muted mt-1 d-block" style={{ fontSize: '0.62rem' }}>
                                Automatic friendly URL slug created from category name.
                              </span>
                            </div>
                          </div>

                          <div className="row g-3 mb-3">
                            <div className="col-md-6">
                              <label className="form-label mb-1.5 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Parent Category</label>
                              <select 
                                className="form-control-premium-dark" 
                                value={catParent}
                                onChange={(e) => setCatParent(e.target.value)}
                              >
                                <option value="">None (Top Level)</option>
                                {categoriesList.map(c => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                              <span className="small text-muted mt-1 d-block" style={{ fontSize: '0.62rem' }}>
                                Nest this category under another category (optional).
                              </span>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label mb-1.5 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Status <span className="text-danger">*</span></label>
                              <select 
                                className="form-control-premium-dark" 
                                value={catStatus}
                                onChange={(e) => setCatStatus(e.target.value)}
                                required
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </div>
                          </div>

                          <div className="row g-3 mb-3">
                            <div className="col-md-6">
                              <label className="form-label mb-1.5 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Category Icon</label>
                              <select 
                                className="form-control-premium-dark" 
                                value={catIcon}
                                onChange={(e) => setCatIcon(e.target.value)}
                              >
                                <option value="fa-tag">Tag</option>
                                <option value="fa-laptop">Laptop/Electronics</option>
                                <option value="fa-shirt">Shirt/Clothing</option>
                                <option value="fa-gem">Gem/Accessories</option>
                                <option value="fa-utensils">Utensils/Food</option>
                                <option value="fa-couch">Couch/Furniture</option>
                                <option value="fa-heart">Heart/Health</option>
                                <option value="fa-book">Book/Education</option>
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label mb-1.5 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Category Color</label>
                              <div className="d-flex align-items-center gap-2">
                                <input 
                                  type="color" 
                                  className="form-control p-0" 
                                  style={{ width: '40px', height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                                  value={catColor}
                                  onChange={(e) => setCatColor(e.target.value)}
                                />
                                <span className="font-monospace text-secondary small" style={{ fontSize: '0.75rem' }}>{catColor}</span>
                              </div>
                            </div>
                          </div>

                          <div className="form-group mb-3">
                            <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Category Image Upload</label>
                            <div 
                              className="d-flex flex-column align-items-center justify-content-center border border-dashed rounded-3 p-3 text-center position-relative"
                              style={{
                                minHeight: '120px',
                                borderColor: '#cbd5e1',
                                backgroundColor: '#f8fafc',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                              }}
                              onDragOver={handleCategoryDragOver}
                              onDragLeave={handleCategoryDragLeave}
                              onDrop={handleCategoryDrop}
                              onClick={() => document.getElementById('category-file-input').click()}
                            >
                              <input 
                                type="file" 
                                id="category-file-input" 
                                className="d-none" 
                                accept="image/jpeg,image/png,image/webp" 
                                onChange={handleCategoryImageChange}
                              />

                              {catImagePreview ? (
                                <div className="w-100 h-100 d-flex align-items-center justify-content-center position-relative">
                                  <img src={catImagePreview} alt="Category preview" style={{ maxWidth: '100%', maxHeight: '100px', borderRadius: '4px', objectFit: 'contain' }} />
                                </div>
                              ) : (
                                <>
                                  <i className="fa-solid fa-cloud-arrow-up text-primary mb-1.5" style={{ fontSize: '1.6rem', color: '#0EA5E9' }}></i>
                                  <div className="fw-bold text-dark mb-0.5" style={{ fontSize: '0.78rem' }}>Drag & drop image here</div>
                                  <div className="text-secondary small" style={{ fontSize: '0.65rem' }}>or click to browse</div>
                                </>
                              )}
                            </div>

                            {catImagePreview && (
                              <div className="mt-2 text-center">
                                <button 
                                  type="button" 
                                  className="btn btn-outline-danger btn-sm py-1 fw-semibold d-flex align-items-center justify-content-center gap-1.5 w-100" 
                                  style={{ fontSize: '0.7rem', borderRadius: '6px' }} 
                                  onClick={handleCategoryRemoveImage}
                                >
                                  <i className="fa-solid fa-trash-can"></i> Remove Image
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="mb-4">
                            <label className="form-label mb-1.5 fw-semibold" style={{ fontSize: '0.72rem', color: '#475569' }}>Description</label>
                            <textarea 
                              className="form-control-premium-dark" 
                              style={{ minHeight: '100px' }}
                              placeholder="Describe this category..." 
                              value={catDescription}
                              onChange={(e) => setCatDescription(e.target.value)}
                            />
                          </div>

                          <div className="pt-3 d-flex justify-content-end gap-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                            <button 
                              type="button" 
                              className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold" 
                              style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#475569' }} 
                              onClick={handleResetCategoryForm}
                            >
                              Reset
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold" 
                              style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#475569' }} 
                              onClick={() => { playSynthSound('click'); setCategoriesSubView('list'); }}
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit" 
                              className="btn text-white fw-bold px-4 py-1.5 border-0" 
                              style={{ backgroundColor: '#0EA5E9', borderRadius: '6px', fontSize: '0.75rem' }}
                              disabled={catSaving}
                            >
                              {catSaving ? 'Saving...' : (editingCategoryId ? 'Update Category' : 'Save Category')}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* Right Column: Preview & Tips */}
                    <div className="col-lg-4 col-md-12 d-flex flex-column gap-3">
                      {/* Live Category Preview Card */}
                      <div className="p-3 rounded-3 border bg-white shadow-sm" style={{ borderColor: '#cbd5e1' }}>
                        <h4 className="fw-bold mb-2.5 d-flex align-items-center text-dark" style={{ fontFamily: 'Outfit', fontSize: '0.85rem' }}>
                          <i className="fa-regular fa-eye text-primary me-2" style={{ color: '#0EA5E9' }}></i> Category Preview
                        </h4>

                        <div className="d-flex flex-column align-items-center justify-content-center p-3 text-center rounded-3 bg-light border border-dashed mb-3" style={{ minHeight: '180px', borderColor: '#e2e8f0' }}>
                          <div className="d-flex align-items-center justify-content-center rounded-circle shadow-sm mb-2.5 animate-pulse" style={{ width: '60px', height: '60px', backgroundColor: `${catColor}15`, color: catColor, fontSize: '1.8rem' }}>
                            <i className={`fa-solid ${catIcon}`}></i>
                          </div>

                          <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '1.05rem', fontFamily: 'Outfit' }}>{catName || 'Category Name'}</h3>
                          <span className={`badge px-2.5 py-0.5 mb-3 ${
                            catStatus === 'Active' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-20' :
                            'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20'
                          }`} style={{ fontSize: '0.65rem' }}>
                            {catStatus}
                          </span>

                          <div className="w-100 text-start border-top pt-2.5" style={{ fontSize: '0.72rem' }}>
                            <div className="d-flex justify-content-between mb-1.5">
                              <span className="text-secondary"><i className="fa-solid fa-sitemap me-1.5"></i>Parent:</span>
                              <span className="fw-bold text-dark">{catParent || 'None'}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-1.5">
                              <span className="text-secondary"><i className="fa-solid fa-link me-1.5"></i>Slug URL:</span>
                              <span className="fw-semibold text-primary font-monospace" style={{ color: '#0EA5E9' }}>category/{catSlug || 'slug'}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary"><i className="fa-regular fa-file-lines me-1.5"></i>Description:</span>
                              <span className="text-truncate text-dark fw-medium" style={{ maxWidth: '150px' }}>{catDescription || 'No description provided.'}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-secondary small italic text-center mb-0" style={{ fontSize: '0.65rem' }}>This preview updates dynamically as you fill out the fields.</p>
                      </div>

                      {/* Tips Card */}
                      <div className="p-3 rounded-3 border bg-white shadow-sm" style={{ borderColor: '#cbd5e1' }}>
                        <h4 className="fw-bold mb-2.5 d-flex align-items-center text-dark" style={{ fontFamily: 'Outfit', fontSize: '0.85rem' }}>
                          <i className="fa-regular fa-lightbulb text-warning me-2"></i> Tips
                        </h4>
                        <ul className="list-unstyled d-flex flex-column gap-2 mb-0" style={{ fontSize: '0.72rem' }}>
                          <li className="d-flex align-items-start gap-2">
                            <i className="fa-solid fa-circle-check text-success mt-0.5"></i>
                            <span className="text-secondary">URLs slugs should contain only lowercase letters, numbers, and hyphens.</span>
                          </li>
                          <li className="d-flex align-items-start gap-2">
                            <i className="fa-solid fa-circle-check text-success mt-0.5"></i>
                            <span className="text-secondary">Select a Parent Category to build hierarchies (e.g. "Electronics" &gt; "Smartphones").</span>
                          </li>
                          <li className="d-flex align-items-start gap-2">
                            <i className="fa-solid fa-circle-check text-success mt-0.5"></i>
                            <span className="text-secondary">Add details to your description to help identify inventory groups.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Render Suppliers Tab */}
          {activeTab === 'suppliers' && (
            <div className="suppliers-view animate-fade-in" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              {suppliersSubView === 'list' ? (
                <>
                  {/* Title Banner */}
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                    <div>
                      <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>Suppliers Directory</h1>
                      <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', color: '#0EA5E9' }}>
                        <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>Dashboard</span>
                        <span className="text-secondary">/</span>
                        <span className="fw-semibold">Suppliers</span>
                      </div>
                    </div>
                    <button 
                      className="btn text-white fw-semibold d-flex align-items-center gap-1.5 shadow-sm border-0" 
                      style={{ backgroundColor: '#0EA5E9', padding: '0.45rem 1.15rem', borderRadius: '6px', fontSize: '0.75rem' }} 
                      onClick={() => {
                        playSynthSound('click');
                        setEditingSupplierId(null);
                        handleResetSupplierForm();
                        setSuppliersSubView('add');
                      }}
                    >
                      <i className="fa-solid fa-plus"></i> Add New Supplier
                    </button>
                  </div>

                  {/* Search Section */}
                  <div className="p-3 rounded-3 shadow-sm border bg-white mb-3" style={{ borderColor: '#cbd5e1' }}>
                    <div className="row g-3 align-items-end">
                      <div className="col-md-9">
                        <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Search Suppliers</label>
                        <div className="position-relative">
                          <i className="fa-solid fa-magnifying-glass text-secondary position-absolute" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#64748b' }}></i>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            style={{ paddingLeft: '2.1rem' }} 
                            placeholder="Search by name, code, contact person..." 
                            value={supplierSearchQuery}
                            onChange={(e) => setSupplierSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3 d-flex gap-2">
                        <button 
                          className="btn text-white fw-semibold w-100 border-0" 
                          style={{ backgroundColor: '#0EA5E9', fontSize: '0.75rem', borderRadius: '6px', height: '35px' }}
                          onClick={() => setAppliedSupplierFilters({ search: supplierSearchQuery })}
                        >
                          Search
                        </button>
                        <button 
                          className="btn btn-outline-secondary d-flex align-items-center justify-content-center" 
                          style={{ width: '35px', height: '35px', borderRadius: '6px', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                          onClick={() => {
                            setSupplierSearchQuery('');
                            setAppliedSupplierFilters({ search: '' });
                            fetchSuppliers();
                          }}
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
                      <table className="table align-middle table-hover-light mb-0">
                        <thead>
                          <tr className="small text-secondary" style={{ fontSize: '0.72rem', borderBottom: '2px solid #e2e8f0' }}>
                            <th>Supplier Name</th>
                            <th>Supplier Code</th>
                            <th>Contact Person</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>City & Country</th>
                            <th>Status</th>
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {suppliersList.filter(s => {
                            const query = appliedSupplierFilters.search.toLowerCase();
                            return !query || 
                              s.name.toLowerCase().includes(query) ||
                              s.code.toLowerCase().includes(query) ||
                              s.contact_person.toLowerCase().includes(query);
                          }).length === 0 ? (
                            <tr>
                              <td colSpan="8" className="text-center py-5 text-secondary" style={{ color: '#64748b' }}>
                                <div className="d-flex flex-column align-items-center justify-content-center">
                                  <i className="fa-solid fa-folder text-muted mb-2.5" style={{ fontSize: '3rem', color: '#cbd5e1', opacity: '0.6' }}></i>
                                  <p className="mb-0 fw-semibold" style={{ fontSize: '0.8rem' }}>
                                    No suppliers connected yet. Click "Add New Supplier" to create one.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            suppliersList.filter(s => {
                              const query = appliedSupplierFilters.search.toLowerCase();
                              return !query || 
                                s.name.toLowerCase().includes(query) ||
                                s.code.toLowerCase().includes(query) ||
                                s.contact_person.toLowerCase().includes(query);
                            }).map(sup => (
                              <tr key={sup.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td className="fw-bold" style={{ color: '#0f172a' }}>{sup.name}</td>
                                <td className="font-monospace" style={{ fontSize: '0.75rem' }}>{sup.code}</td>
                                <td>{sup.contact_person || <span className="text-muted small italic">None</span>}</td>
                                <td>{sup.email || <span className="text-muted small italic">None</span>}</td>
                                <td>{sup.phone || <span className="text-muted small italic">None</span>}</td>
                                <td>{sup.city && sup.country ? `${sup.city}, ${sup.country}` : sup.city || sup.country || <span className="text-muted small italic">None</span>}</td>
                                <td>
                                  <span className={`badge px-2.5 py-1 ${
                                    sup.status === 'Active' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-20' :
                                    'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20'
                                  }`} style={{ fontSize: '0.7rem', borderRadius: '4px' }}>
                                    {sup.status}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <div className="d-flex align-items-center justify-content-center gap-2">
                                    <button 
                                      type="button" 
                                      className="btn btn-link text-primary p-0 border-0 fw-semibold" 
                                      style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                                      onClick={() => {
                                        playSynthSound('click');
                                        setEditingSupplierId(sup.id);
                                        setSupName(sup.name);
                                        setSupCode(sup.code);
                                        setSupContactPerson(sup.contact_person);
                                        setSupDesignation(sup.designation);
                                        setSupEmail(sup.email);
                                        setSupPhone(sup.phone);
                                        setSupAltPhone(sup.alt_phone);
                                        setSupWebsite(sup.website);
                                        setSupAddress(sup.address);
                                        setSupCountry(sup.country);
                                        setSupState(sup.state);
                                        setSupCity(sup.city);
                                        setSupPinCode(sup.pin_code);
                                        setSupPaymentTerms(sup.payment_terms);
                                        setSupCreditLimit(sup.credit_limit.toString());
                                        setSupTaxId(sup.tax_id);
                                        setSupNotes(sup.notes);
                                        setSupStatus(sup.status);
                                        setSuppliersSubView('add');
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <span className="text-muted">|</span>
                                    <button 
                                      type="button" 
                                      className="btn btn-link text-danger p-0 border-0 fw-semibold" 
                                      style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                                      onClick={() => handleDeleteSupplier(sup.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                /* PAGE 2: Add / Edit Supplier */
                <>
                  {/* Title Banner */}
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                    <div>
                      <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>
                        {editingSupplierId ? 'Edit Supplier' : 'Add New Supplier'}
                      </h1>
                      <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', color: '#0EA5E9' }}>
                        <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>Dashboard</span>
                        <span className="text-secondary">/</span>
                        <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => setSuppliersSubView('list')}>Suppliers</span>
                        <span className="text-secondary">/</span>
                        <span className="fw-semibold">{editingSupplierId ? 'Edit Supplier' : 'Add Supplier'}</span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button 
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold" 
                        style={{ fontSize: '0.75rem', borderRadius: '6px', backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#475569' }} 
                        onClick={() => setSuppliersSubView('list')}
                      >
                        <i className="fa-solid fa-arrow-left"></i> Back to Suppliers
                      </button>
                      <button 
                        className="btn btn-blue-primary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold" 
                        style={{ fontSize: '0.75rem', borderRadius: '6px' }} 
                        onClick={handleSaveSupplier}
                        disabled={supSaving}
                      >
                        <i className="fa-solid fa-save"></i> {supSaving ? 'Saving...' : (editingSupplierId ? 'Update Supplier' : 'Save Supplier')}
                      </button>
                    </div>
                  </div>

                  {/* Main Grid */}
                  <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                    <form onSubmit={handleSaveSupplier}>
                      <h3 className="fw-bold mb-3 pb-2 text-dark border-bottom" style={{ fontFamily: 'Outfit', fontSize: '0.92rem' }}>
                        Supplier Profile Information
                      </h3>
                      
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Supplier Name <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="Enter company / supplier name" 
                            value={supName}
                            onChange={(e) => setSupName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Supplier Code <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="e.g. SUP-TECH-01" 
                            value={supCode}
                            onChange={(e) => setSupCode(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Contact Person</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="Enter contact person's name" 
                            value={supContactPerson}
                            onChange={(e) => setSupContactPerson(e.target.value)}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Designation</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="e.g. Sales Manager" 
                            value={supDesignation}
                            onChange={(e) => setSupDesignation(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-md-4">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Email</label>
                          <input 
                            type="email" 
                            className="form-control-premium-dark" 
                            placeholder="name@company.com" 
                            value={supEmail}
                            onChange={(e) => setSupEmail(e.target.value)}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Phone</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="Enter telephone number" 
                            value={supPhone}
                            onChange={(e) => setSupPhone(e.target.value)}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Alternate Phone</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="Secondary contact phone" 
                            value={supAltPhone}
                            onChange={(e) => setSupAltPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Website</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="https://example.com" 
                            value={supWebsite}
                            onChange={(e) => setSupWebsite(e.target.value)}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Tax / GST Number</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="Enter tax registration code" 
                            value={supTaxId}
                            onChange={(e) => setSupTaxId(e.target.value)}
                          />
                        </div>
                      </div>

                      <h3 className="fw-bold mb-3 pb-2 mt-4 text-dark border-bottom" style={{ fontFamily: 'Outfit', fontSize: '0.92rem' }}>
                        Address & Terms Information
                      </h3>

                      <div className="mb-3">
                        <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Address</label>
                        <input 
                          type="text" 
                          className="form-control-premium-dark" 
                          placeholder="Street, suite, building details..." 
                          value={supAddress}
                          onChange={(e) => setSupAddress(e.target.value)}
                        />
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-md-3">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>City</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="City" 
                            value={supCity}
                            onChange={(e) => setSupCity(e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>State / Region</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="State / Region" 
                            value={supState}
                            onChange={(e) => setSupState(e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Country</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="Country" 
                            value={supCountry}
                            onChange={(e) => setSupCountry(e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Postal Code</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="PIN / Zip" 
                            value={supPinCode}
                            onChange={(e) => setSupPinCode(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-md-4">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Payment Terms</label>
                          <select 
                            className="form-control-premium-dark" 
                            value={supPaymentTerms}
                            onChange={(e) => setSupPaymentTerms(e.target.value)}
                          >
                            <option value="net_15">Net 15</option>
                            <option value="net_30">Net 30</option>
                            <option value="net_60">Net 60</option>
                            <option value="cod">Cash on Delivery</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Credit Limit ($)</label>
                          <input 
                            type="number" 
                            className="form-control-premium-dark" 
                            placeholder="0.00" 
                            value={supCreditLimit}
                            onChange={(e) => setSupCreditLimit(e.target.value)}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Status <span className="text-danger">*</span></label>
                          <select 
                            className="form-control-premium-dark" 
                            value={supStatus}
                            onChange={(e) => setSupStatus(e.target.value)}
                            required
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Notes</label>
                        <textarea 
                          className="form-control-premium-dark" 
                          style={{ minHeight: '100px' }}
                          placeholder="Describe business terms, special agreements, etc..." 
                          value={supNotes}
                          onChange={(e) => setSupNotes(e.target.value)}
                        />
                      </div>

                      <div className="pt-3 d-flex justify-content-end gap-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold" 
                          style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#475569' }} 
                          onClick={handleResetSupplierForm}
                        >
                          Reset
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold" 
                          style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#475569' }} 
                          onClick={() => setSuppliersSubView('list')}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn text-white fw-bold px-4 py-1.5 border-0" 
                          style={{ backgroundColor: '#0EA5E9', borderRadius: '6px', fontSize: '0.75rem' }}
                          disabled={supSaving}
                        >
                          {supSaving ? 'Saving...' : (editingSupplierId ? 'Update Supplier' : 'Save Supplier')}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Render Customers Tab */}
          {activeTab === 'customers' && (
            <div className="customers-view animate-fade-in" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              {customersSubView === 'list' ? (
                <>
                  {/* Title Banner */}
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                    <div>
                      <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>Customers List</h1>
                      <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', color: '#0EA5E9' }}>
                        <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>Dashboard</span>
                        <span className="text-secondary">/</span>
                        <span className="fw-semibold">Customers</span>
                      </div>
                    </div>
                    <button 
                      className="btn text-white fw-semibold d-flex align-items-center gap-1.5 shadow-sm border-0" 
                      style={{ backgroundColor: '#0EA5E9', padding: '0.45rem 1.15rem', borderRadius: '6px', fontSize: '0.75rem' }} 
                      onClick={() => {
                        playSynthSound('click');
                        setEditingCustomerId(null);
                        handleResetCustomerForm();
                        setCustomersSubView('add');
                      }}
                    >
                      <i className="fa-solid fa-plus"></i> Add New Customer
                    </button>
                  </div>

                  {/* Search Section */}
                  <div className="p-3 rounded-3 shadow-sm border bg-white mb-3" style={{ borderColor: '#cbd5e1' }}>
                    <div className="row g-3 align-items-end">
                      <div className="col-md-9">
                        <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Search Customer Directory</label>
                        <div className="position-relative">
                          <i className="fa-solid fa-magnifying-glass text-secondary position-absolute" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#64748b' }}></i>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            style={{ paddingLeft: '2.1rem' }} 
                            placeholder="Search by name, email, phone..." 
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3 d-flex gap-2">
                        <button 
                          className="btn text-white fw-semibold w-100 border-0" 
                          style={{ backgroundColor: '#0EA5E9', fontSize: '0.75rem', borderRadius: '6px', height: '35px' }}
                          onClick={() => setAppliedCustomerFilters({ search: customerSearchQuery })}
                        >
                          Search
                        </button>
                        <button 
                          className="btn btn-outline-secondary d-flex align-items-center justify-content-center" 
                          style={{ width: '35px', height: '35px', borderRadius: '6px', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                          onClick={() => {
                            setCustomerSearchQuery('');
                            setAppliedCustomerFilters({ search: '' });
                            fetchCustomers();
                          }}
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
                      <table className="table align-middle table-hover-light mb-0">
                        <thead>
                          <tr className="small text-secondary" style={{ fontSize: '0.72rem', borderBottom: '2px solid #e2e8f0' }}>
                            <th>Customer Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Added On</th>
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customersList.filter(c => {
                            const query = appliedCustomerFilters.search.toLowerCase();
                            return !query || 
                              c.name.toLowerCase().includes(query) ||
                              c.email.toLowerCase().includes(query) ||
                              c.phone.toLowerCase().includes(query);
                          }).length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-5 text-secondary" style={{ color: '#64748b' }}>
                                <div className="d-flex flex-column align-items-center justify-content-center">
                                  <i className="fa-solid fa-folder text-muted mb-2.5" style={{ fontSize: '3rem', color: '#cbd5e1', opacity: '0.6' }}></i>
                                  <p className="mb-0 fw-semibold" style={{ fontSize: '0.8rem' }}>
                                    No customer profiles registered yet. Click "Add New Customer" to register one.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            customersList.filter(c => {
                              const query = appliedCustomerFilters.search.toLowerCase();
                              return !query || 
                                c.name.toLowerCase().includes(query) ||
                                c.email.toLowerCase().includes(query) ||
                                c.phone.toLowerCase().includes(query);
                            }).map(cust => (
                              <tr key={cust.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td className="fw-bold" style={{ color: '#0f172a' }}>{cust.name}</td>
                                <td>{cust.email || <span className="text-muted small italic">None</span>}</td>
                                <td>{cust.phone || <span className="text-muted small italic">None</span>}</td>
                                <td>{cust.address || <span className="text-muted small italic">None</span>}</td>
                                <td>{cust.created_at ? new Date(cust.created_at).toLocaleDateString() : 'N/A'}</td>
                                <td className="text-center">
                                  <div className="d-flex align-items-center justify-content-center gap-2">
                                    <button 
                                      type="button" 
                                      className="btn btn-link text-primary p-0 border-0 fw-semibold" 
                                      style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                                      onClick={() => {
                                        playSynthSound('click');
                                        setEditingCustomerId(cust.id);
                                        setCustName(cust.name);
                                        setCustEmail(cust.email);
                                        setCustPhone(cust.phone);
                                        setCustAddress(cust.address);
                                        setCustCity(cust.city || '');
                                        setCustState(cust.state || '');
                                        setCustCountry(cust.country || '');
                                        setCustZipCode(cust.zip_code || '');
                                        setCustNotes(cust.notes || '');
                                        setCustStatus(cust.status || 'Active');
                                        setCustomersSubView('add');
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <span className="text-muted">|</span>
                                    <button 
                                      type="button" 
                                      className="btn btn-link text-danger p-0 border-0 fw-semibold" 
                                      style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                                      onClick={() => handleDeleteCustomer(cust.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                /* PAGE 2: Add / Edit Customer */
                <>
                  {/* Title Banner */}
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                    <div>
                      <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>
                        {editingCustomerId ? 'Edit Customer' : 'Add New Customer'}
                      </h1>
                      <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', color: '#0EA5E9' }}>
                        <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>Dashboard</span>
                        <span className="text-secondary">/</span>
                        <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => setCustomersSubView('list')}>Customers</span>
                        <span className="text-secondary">/</span>
                        <span className="fw-semibold">{editingCustomerId ? 'Edit Customer' : 'Add Customer'}</span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button 
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold" 
                        style={{ fontSize: '0.75rem', borderRadius: '6px', backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#475569' }} 
                        onClick={() => setCustomersSubView('list')}
                      >
                        <i className="fa-solid fa-arrow-left"></i> Back to Customers
                      </button>
                      <button 
                        className="btn btn-blue-primary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold" 
                        style={{ fontSize: '0.75rem', borderRadius: '6px' }} 
                        onClick={handleSaveCustomer}
                        disabled={custSaving}
                      >
                        <i className="fa-solid fa-save"></i> {custSaving ? 'Saving...' : (editingCustomerId ? 'Update Customer' : 'Save Customer')}
                      </button>
                    </div>
                  </div>

                  {/* Main Grid */}
                  <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                    <form onSubmit={handleSaveCustomer}>
                      <h3 className="fw-bold mb-3 pb-2 text-dark border-bottom" style={{ fontFamily: 'Outfit', fontSize: '0.92rem' }}>
                        Customer Profile Details
                      </h3>

                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Customer Name <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="Enter customer name" 
                            value={custName}
                            onChange={(e) => setCustName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Email Address</label>
                          <input 
                            type="email" 
                            className="form-control-premium-dark" 
                            placeholder="name@email.com" 
                            value={custEmail}
                            onChange={(e) => setCustEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Phone Number</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="Enter contact number" 
                            value={custPhone}
                            onChange={(e) => setCustPhone(e.target.value)}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Status</label>
                          <select 
                            className="form-control-premium-dark" 
                            value={custStatus}
                            onChange={(e) => setCustStatus(e.target.value)}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <h3 className="fw-bold mb-3 pb-2 mt-4 text-dark border-bottom" style={{ fontFamily: 'Outfit', fontSize: '0.92rem' }}>
                        Address Information
                      </h3>

                      <div className="mb-3">
                        <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Street Address</label>
                        <input 
                          type="text" 
                          className="form-control-premium-dark" 
                          placeholder="Apartment, suite, street name..." 
                          value={custAddress}
                          onChange={(e) => setCustAddress(e.target.value)}
                        />
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-md-3">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>City</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="City" 
                            value={custCity}
                            onChange={(e) => setCustCity(e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>State / Region</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="State" 
                            value={custState}
                            onChange={(e) => setCustState(e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Country</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="Country" 
                            value={custCountry}
                            onChange={(e) => setCustCountry(e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Postal Code</label>
                          <input 
                            type="text" 
                            className="form-control-premium-dark" 
                            placeholder="Zip / Postal Code" 
                            value={custZipCode}
                            onChange={(e) => setCustZipCode(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Customer Notes</label>
                        <textarea 
                          className="form-control-premium-dark" 
                          style={{ minHeight: '100px' }}
                          placeholder="Add any internal customer descriptions or records..." 
                          value={custNotes}
                          onChange={(e) => setCustNotes(e.target.value)}
                        />
                      </div>

                      <div className="pt-3 d-flex justify-content-end gap-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold" 
                          style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#475569' }} 
                          onClick={handleResetCustomerForm}
                        >
                          Reset
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold" 
                          style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#475569' }} 
                          onClick={() => setCustomersSubView('list')}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn text-white fw-bold px-4 py-1.5 border-0" 
                          style={{ backgroundColor: '#0EA5E9', borderRadius: '6px', fontSize: '0.75rem' }}
                          disabled={custSaving}
                        >
                          {custSaving ? 'Saving...' : (editingCustomerId ? 'Update Customer' : 'Save Customer')}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Render Reports Tab */}
          {activeTab === 'reports' && (
            <div className="reports-view animate-fade-in" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              {/* Title Banner */}
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                <div>
                  <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>Audit & Reports</h1>
                  <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', color: '#0EA5E9' }}>
                    <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>Dashboard</span>
                    <span className="text-secondary">/</span>
                    <span className="fw-semibold">Reports</span>
                  </div>
                </div>
                <button 
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold" 
                  style={{ fontSize: '0.75rem', borderRadius: '6px', backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#475569' }} 
                  onClick={handleExportReportsPDF}
                >
                  <i className="fa-solid fa-print"></i> Export to PDF / Print
                </button>
              </div>

              {/* Tab Navigation Menu */}
              <div className="d-flex rounded-3 bg-light p-1 mb-3 gap-1 shadow-sm border" style={{ borderColor: '#cbd5e1' }}>
                <button 
                  className="btn btn-sm flex-fill fw-semibold py-2 d-flex align-items-center justify-content-center gap-2"
                  style={reportsActiveTab === 'sales' ? {
                    backgroundColor: '#0EA5E9',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    border: '0'
                  } : {
                    backgroundColor: 'transparent',
                    color: '#475569',
                    fontSize: '0.78rem',
                    border: '0'
                  }}
                  onClick={() => { playSynthSound('click'); setReportsActiveTab('sales'); }}
                >
                  <i className="fa-solid fa-chart-line"></i> Sales Audit
                </button>
                <button 
                  className="btn btn-sm flex-fill fw-semibold py-2 d-flex align-items-center justify-content-center gap-2"
                  style={reportsActiveTab === 'valuation' ? {
                    backgroundColor: '#0EA5E9',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    border: '0'
                  } : {
                    backgroundColor: 'transparent',
                    color: '#475569',
                    fontSize: '0.78rem',
                    border: '0'
                  }}
                  onClick={() => { playSynthSound('click'); setReportsActiveTab('valuation'); }}
                >
                  <i className="fa-solid fa-warehouse"></i> Inventory Valuation
                </button>
                <button 
                  className="btn btn-sm flex-fill fw-semibold py-2 d-flex align-items-center justify-content-center gap-2"
                  style={reportsActiveTab === 'purchase' ? {
                    backgroundColor: '#0EA5E9',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    border: '0'
                  } : {
                    backgroundColor: 'transparent',
                    color: '#475569',
                    fontSize: '0.78rem',
                    border: '0'
                  }}
                  onClick={() => { playSynthSound('click'); setReportsActiveTab('purchase'); }}
                >
                  <i className="fa-solid fa-truck-field"></i> Purchase Log
                </button>
              </div>

              {/* Tab Contents */}
              {reportsLoading ? (
                <div className="p-5 text-center bg-white rounded-3 shadow-sm border" style={{ borderColor: '#cbd5e1' }}>
                  <div className="spinner-border text-info mb-2" role="status" style={{ width: '1.8rem', height: '1.8rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div className="text-secondary small">Compiling reports analytics...</div>
                </div>
              ) : (
                <>
                  {reportsActiveTab === 'sales' && (
                    <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                      <h3 className="fw-bold mb-0.5 text-dark" style={{ fontFamily: 'Outfit', fontSize: '0.95rem' }}>Daily Sales Income Aggregation</h3>
                      <p className="text-secondary mb-3" style={{ fontSize: '0.7rem' }}>A summary audit of your billing invoices grouped by transaction date.</p>

                      <div className="table-responsive">
                        <table className="table align-middle table-hover-light mb-0">
                          <thead>
                            <tr className="small text-secondary" style={{ fontSize: '0.72rem', borderBottom: '2px solid #e2e8f0' }}>
                              <th>Sale Date</th>
                              <th>Invoices Issued</th>
                              <th>Total Daily Revenue</th>
                              <th className="text-center">Audit Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salesAuditList.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="text-center py-5 text-secondary" style={{ color: '#64748b' }}>
                                  <div className="d-flex flex-column align-items-center justify-content-center">
                                    <i className="fa-solid fa-magnifying-glass-chart text-muted mb-2.5" style={{ fontSize: '3rem', color: '#cbd5e1', opacity: '0.6' }}></i>
                                    <p className="mb-0 fw-semibold" style={{ fontSize: '0.8rem' }}>
                                      No sales ledger records found in your database.
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              salesAuditList.map((s, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td className="fw-semibold">{new Date(s.saleDate).toLocaleDateString()}</td>
                                  <td>{s.invoicesIssued} invoices</td>
                                  <td className="fw-bold text-success">${parseFloat(s.totalDailyRevenue).toFixed(2)}</td>
                                  <td className="text-center">
                                    <button 
                                      className="btn btn-outline-info btn-xs py-0.5 px-2 fw-semibold" 
                                      style={{ fontSize: '0.68rem', borderRadius: '4px' }}
                                      onClick={() => {
                                        playSynthSound('click');
                                        setActiveTab('sales');
                                      }}
                                    >
                                      View Sales Registry
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {reportsActiveTab === 'valuation' && (
                    <div className="d-flex flex-column gap-3">
                      {/* Summary Cards */}
                      <div className="row g-3">
                        <div className="col-md-4">
                          <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                            <div className="text-secondary small mb-1.5" style={{ fontSize: '0.72rem', fontWeight: '500' }}>Total Inventory Value (Cost)</div>
                            <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.6rem', fontFamily: 'Outfit' }}>
                              ${(inventoryValuationData.summary?.totalInventoryValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-muted small" style={{ fontSize: '0.65rem' }}>Computed from wholesale purchase prices.</div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                            <div className="text-secondary small mb-1.5" style={{ fontSize: '0.72rem', fontWeight: '500' }}>Expected Sales Return</div>
                            <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.6rem', fontFamily: 'Outfit' }}>
                              ${(inventoryValuationData.summary?.expectedSalesReturn || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-muted small" style={{ fontSize: '0.65rem' }}>Computed from catalog retail pricing.</div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                            <div className="text-secondary small mb-1.5" style={{ fontSize: '0.72rem', fontWeight: '500', color: '#0ea5e9' }}>Potential Profit Earnings</div>
                            <div className="fw-bold mb-1" style={{ fontSize: '1.6rem', fontFamily: 'Outfit', color: '#0ea5e9' }}>
                              ${(inventoryValuationData.summary?.potentialProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-muted small" style={{ fontSize: '0.65rem' }}>Expected margin if all inventory is cleared.</div>
                          </div>
                        </div>
                      </div>

                      {/* Main Valuation Audit Card */}
                      <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                        <h3 className="fw-bold mb-0.5 text-dark" style={{ fontFamily: 'Outfit', fontSize: '0.95rem' }}>Catalog Valuation Audit</h3>
                        <p className="text-secondary mb-3" style={{ fontSize: '0.7rem' }}>Detailed breakdown of total items currently locked in stock and their relative worth.</p>

                        <div className="table-responsive">
                          <table className="table align-middle table-hover-light mb-0">
                            <thead>
                              <tr className="small text-secondary" style={{ fontSize: '0.72rem', borderBottom: '2px solid #e2e8f0' }}>
                                <th>Product</th>
                                <th>Category</th>
                                <th>On Hand Qty</th>
                                <th>Purchase Cost</th>
                                <th>Total Cost Value</th>
                                <th>Selling Price</th>
                                <th>Expected Value</th>
                                <th>Margin Contribution</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(inventoryValuationData.items || []).length === 0 ? (
                                <tr>
                                  <td colSpan="8" className="text-center py-5 text-secondary" style={{ color: '#64748b' }}>
                                    <div className="d-flex flex-column align-items-center justify-content-center">
                                      <i className="fa-solid fa-box-open text-muted mb-2.5" style={{ fontSize: '3rem', color: '#cbd5e1', opacity: '0.6' }}></i>
                                      <p className="mb-0 fw-semibold" style={{ fontSize: '0.8rem' }}>
                                        No inventory products found to audit.
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                (inventoryValuationData.items || []).map((item, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td>
                                      <div className="fw-bold text-dark">{item.name}</div>
                                      <span className="small text-muted font-monospace" style={{ fontSize: '0.68rem' }}>{item.sku}</span>
                                    </td>
                                    <td>{item.category}</td>
                                    <td className="fw-semibold">{item.quantity}</td>
                                    <td>${parseFloat(item.purchaseCost).toFixed(2)}</td>
                                    <td className="fw-semibold">${parseFloat(item.totalCostValue).toFixed(2)}</td>
                                    <td>${parseFloat(item.sellingPrice).toFixed(2)}</td>
                                    <td className="fw-semibold text-primary">${parseFloat(item.expectedValue).toFixed(2)}</td>
                                    <td>
                                      <span className={`badge px-2 py-0.5 ${item.marginContribution > 0 ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`} style={{ fontSize: '0.68rem' }}>
                                        {item.marginContribution}%
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportsActiveTab === 'purchase' && (
                    <div className="p-3 rounded-3 shadow-sm border bg-white" style={{ borderColor: '#cbd5e1' }}>
                      <h3 className="fw-bold mb-0.5 text-dark" style={{ fontFamily: 'Outfit', fontSize: '0.95rem' }}>Supplier Purchase Order Aggregation</h3>
                      <p className="text-secondary mb-3" style={{ fontSize: '0.7rem' }}>A daily summary log of purchase orders grouped by vendor transaction date.</p>

                      <div className="table-responsive">
                        <table className="table align-middle table-hover-light mb-0">
                          <thead>
                            <tr className="small text-secondary" style={{ fontSize: '0.72rem', borderBottom: '2px solid #e2e8f0' }}>
                              <th>Purchase Date</th>
                              <th>Orders Completed</th>
                              <th>Total Cost Outflow</th>
                              <th className="text-center">Audit Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {purchaseLogList.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="text-center py-5 text-secondary" style={{ color: '#64748b' }}>
                                  <div className="d-flex flex-column align-items-center justify-content-center">
                                    <i className="fa-solid fa-magnifying-glass-chart text-muted mb-2.5" style={{ fontSize: '3rem', color: '#cbd5e1', opacity: '0.6' }}></i>
                                    <p className="mb-0 fw-semibold" style={{ fontSize: '0.8rem' }}>
                                      No purchase log entries found in your database.
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              purchaseLogList.map((p, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td className="fw-semibold">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                                  <td>{p.ordersCompleted} orders</td>
                                  <td className="fw-bold text-danger">${parseFloat(p.totalCostOutflow).toFixed(2)}</td>
                                  <td className="text-center">
                                    <button 
                                      className="btn btn-outline-info btn-xs py-0.5 px-2 fw-semibold" 
                                      style={{ fontSize: '0.68rem', borderRadius: '4px' }}
                                      onClick={() => {
                                        playSynthSound('click');
                                        setActiveTab('purchases');
                                      }}
                                    >
                                      View Purchases Registry
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PAGE: Billing & Subscription */}
          {activeTab === 'billing-subscription' && (
            <div className="billing-subscription-view animate-fade-in" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              
              {/* Header Breadcrumbs */}
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>Billing & Subscription</h1>
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0" style={{ fontSize: '0.72rem' }}>
                      <li className="breadcrumb-item"><a href="#dashboard" className="text-decoration-none" style={{ color: '#0ea5e9' }} onClick={() => setActiveTab('dashboard')}>Dashboard</a></li>
                      <li className="breadcrumb-item active" aria-current="page" style={{ color: '#64748b' }}>Subscription Plans</li>
                    </ol>
                  </nav>
                </div>
              </div>

              {/* Account Billing Details Card */}
              <div className="card border bg-white rounded-3 p-3.5 mb-4 shadow-sm" style={{ borderColor: '#cbd5e1' }}>
                <h5 className="fw-bold mb-3.5 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit', fontSize: '0.92rem', color: '#0f172a' }}>
                  <i className="fa-solid fa-file-invoice-dollar text-info" style={{ color: '#0ea5e9', fontSize: '1.05rem' }}></i>
                  Account Billing Details
                </h5>
                <div className="row g-3">
                  <div className="col-md-3 col-sm-6">
                    <div className="text-secondary small mb-1" style={{ fontSize: '0.72rem' }}>Currently Active Plan</div>
                    <div className="fw-bold text-dark d-flex align-items-center gap-1.5" style={{ fontSize: '0.85rem' }}>
                      <i className="fa-solid fa-shield-halved text-success" style={{ color: '#22c55e', fontSize: '0.85rem' }}></i>
                      {currentSub?.planName || user?.plan_name || 'Starter Shop'}
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="text-secondary small mb-1" style={{ fontSize: '0.72rem' }}>Billing Interval</div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                      {currentSub?.billingCycle || 'Yearly Renewal'}
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="text-secondary small mb-1" style={{ fontSize: '0.72rem' }}>Merchant Email</div>
                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }} title={currentSub?.merchantEmail || user?.email}>
                      {currentSub?.merchantEmail || user?.email || 'N/A'}
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="text-secondary small mb-1" style={{ fontSize: '0.72rem' }}>SaaS Access Code</div>
                    <div className="fw-bold text-info d-flex align-items-center gap-1.5" style={{ fontSize: '0.85rem', color: '#0ea5e9' }}>
                      <span className="font-monospace">{saasCode}</span>
                      <button className="btn p-0 border-0" style={{ color: '#0ea5e9' }} onClick={handleCopyCode} title="Copy Code">
                        <i className="fa-regular fa-copy" style={{ fontSize: '0.85rem' }}></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expiry Countdown Banner */}
                {countdownText && (
                  <div className={`mt-3.5 p-2 rounded-3 border d-flex align-items-center justify-content-between ${countdownColor}`} style={{ fontSize: '0.78rem' }}>
                    <div className="d-flex align-items-center gap-2 fw-semibold">
                      <i className="fa-solid fa-hourglass-half"></i>
                      <span>{countdownText}</span>
                    </div>
                    {currentSub?.expiryDate && (
                      <span className="small text-secondary font-monospace" style={{ fontSize: '0.7rem' }}>
                        Expires: {new Date(currentSub.expiryDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Compare Subscription Section */}
              <div className="text-center my-4.5">
                <h3 className="fw-bold text-dark mb-1.5" style={{ fontFamily: 'Outfit', fontSize: '1.15rem' }}>Compare Subscriptions & Features</h3>
                <p className="text-secondary mx-auto" style={{ fontSize: '0.78rem', maxWidth: '600px' }}>Scale your inventory resources dynamically. Upgrade instantly to accommodate more store connections and items.</p>
              </div>

              {/* Pricing Cards Grid */}
              <div className="row g-4 mb-5">
                {plans.map((plan) => {
                  const isActive = (currentSub?.planName || user?.plan_name) === plan.planName;
                  const isEnterprise = plan.planName === 'Enterprise Shop';
                  const isGrowth = plan.planName === 'Growth Shop';
                  const isStarter = plan.planName === 'Starter Shop';
                  
                  // Curated colors
                  let iconBg = 'rgba(14, 165, 233, 0.1)';
                  let iconColor = '#0ea5e9';
                  let cardBorder = isActive ? '2px solid #22c55e' : '1px solid #e2e8f0';
                  
                  if (isGrowth) {
                    iconBg = 'rgba(139, 92, 246, 0.1)';
                    iconColor = '#8b5cf6';
                  } else if (isEnterprise) {
                    iconBg = 'rgba(236, 72, 153, 0.1)';
                    iconColor = '#ec4899';
                  }

                  return (
                    <div className="col-lg-4 col-md-6" key={plan._id}>
                      <div className="card h-100 bg-white rounded-3 shadow-sm p-4 d-flex flex-column position-relative" style={{ border: cardBorder }}>
                        
                        {/* Active Badge */}
                        {isActive && (
                          <span className="badge bg-success text-white position-absolute px-2.5 py-1 fw-bold" style={{ top: '15px', right: '15px', fontSize: '0.65rem', borderRadius: '4px', backgroundColor: '#22c55e' }}>
                            ACTIVE
                          </span>
                        )}

                        {/* Plan Header */}
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px', backgroundColor: iconBg }}>
                            <i className={`fa-solid fa-store`} style={{ color: iconColor, fontSize: '1.2rem' }}></i>
                          </div>
                          <div>
                            <h4 className="fw-bold text-dark mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '0.98rem' }}>{plan.planName}</h4>
                            <p className="text-secondary small mb-0" style={{ fontSize: '0.68rem', lineHeight: '1.2' }}>
                              {isStarter && "Essential inventory tracking for single shops or boutique storefronts."}
                              {isGrowth && "Advanced stock manager with notifications, supporting small retail chains."}
                              {isEnterprise && "Full warehouse automation and custom integrations for high-volume stores."}
                            </p>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="my-3">
                          <span className="fw-extrabold text-dark" style={{ fontSize: '1.75rem', fontFamily: 'Outfit' }}>₹{plan.yearlyPrice.toLocaleString('en-IN')}</span>
                          <span className="text-secondary small">/year</span>
                        </div>

                        {/* Features List */}
                        <div className="flex-grow-1 my-3">
                          <ul className="list-unstyled d-flex flex-column gap-2 mb-0" style={{ fontSize: '0.78rem' }}>
                            {plan.features.map((feat, idx) => (
                              <li className="d-flex align-items-center gap-2 text-dark" key={idx}>
                                <i className="fa-solid fa-circle-check text-success" style={{ color: '#22c55e', fontSize: '0.8rem' }}></i>
                                <span>{feat}</span>
                              </li>
                            ))}

                            {/* Disabled features for Starter */}
                            {isStarter && (
                              <>
                                <li className="d-flex align-items-center gap-2 text-muted text-decoration-line-through" style={{ opacity: 0.5 }}>
                                  <i className="fa-solid fa-circle-xmark text-danger" style={{ color: '#ef4444', fontSize: '0.8rem' }}></i>
                                  <span>Low Stock Alerts</span>
                                </li>
                                <li className="d-flex align-items-center gap-2 text-muted text-decoration-line-through" style={{ opacity: 0.5 }}>
                                  <i className="fa-solid fa-circle-xmark text-danger" style={{ color: '#ef4444', fontSize: '0.8rem' }}></i>
                                  <span>Customer Comments Board</span>
                                </li>
                              </>
                            )}
                          </ul>
                        </div>

                        {/* Action Button */}
                        <div className="mt-4">
                          {isActive ? (
                            <button className="btn btn-outline-success w-100 py-1.5 fw-semibold d-flex align-items-center justify-content-center gap-1.5" style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#22c55e', color: '#22c55e', backgroundColor: 'transparent' }} disabled>
                              <i className="fa-solid fa-check"></i> Current Active Plan
                            </button>
                          ) : (
                            <button 
                              className={isGrowth ? "btn btn-blue-primary w-100 py-1.5 fw-semibold border-0" : "btn btn-outline-secondary w-100 py-1.5 fw-semibold"} 
                              style={isGrowth ? { fontSize: '0.75rem', borderRadius: '6px', backgroundColor: '#0EA5E9' } : { fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', color: '#475569', backgroundColor: '#ffffff' }}
                              onClick={() => handlePlanSelection(plan)}
                            >
                              {(plans.find(p => p.planName === currentSub?.planName)?.yearlyPrice || 0) < plan.yearlyPrice ? `Upgrade to ${plan.planName.split(' ')[0]}` : `Downgrade to ${plan.planName.split(' ')[0]}`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Billing History Section */}
              <div className="card border bg-white rounded-3 p-3.5 mb-4 shadow-sm" style={{ borderColor: '#cbd5e1' }}>
                <h5 className="fw-bold mb-3.5 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit', fontSize: '0.92rem', color: '#0f172a' }}>
                  <i className="fa-solid fa-history text-info" style={{ color: '#0ea5e9', fontSize: '1.05rem' }}></i>
                  Billing & Invoice History
                </h5>

                {/* Filters */}
                <div className="row g-3 mb-3.5">
                  <div className="col-md-8">
                    <div className="header-search-box d-flex align-items-center px-2.5 py-1.5 rounded-3 border" style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}>
                      <i className="fa-solid fa-magnifying-glass text-secondary me-2" style={{ color: '#64748b', fontSize: '0.8rem' }}></i>
                      <input 
                        type="text" 
                        className="bg-transparent border-0 outline-none w-100" 
                        style={{ fontSize: '0.78rem', color: '#0f172a' }} 
                        placeholder="Search invoice number, plan name, payment..." 
                        value={invoiceSearch}
                        onChange={(e) => setInvoiceSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <select 
                      className="form-control-premium-dark w-100" 
                      style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem', height: '100%', borderColor: '#cbd5e1' }}
                      value={invoiceStatusFilter}
                      onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                    >
                      <option value="All">All Invoices</option>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                {/* Invoices Table */}
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <th className="px-3 py-2.5 border-bottom text-secondary fw-bold text-uppercase" style={{ fontSize: '0.66rem', borderColor: '#cbd5e1' }}>Invoice ID</th>
                        <th className="px-3 py-2.5 border-bottom text-secondary fw-bold text-uppercase" style={{ fontSize: '0.66rem', borderColor: '#cbd5e1' }}>Plan Name</th>
                        <th className="px-3 py-2.5 border-bottom text-secondary fw-bold text-uppercase" style={{ fontSize: '0.66rem', borderColor: '#cbd5e1' }}>Amount</th>
                        <th className="px-3 py-2.5 border-bottom text-secondary fw-bold text-uppercase" style={{ fontSize: '0.66rem', borderColor: '#cbd5e1' }}>Payment Method</th>
                        <th className="px-3 py-2.5 border-bottom text-secondary fw-bold text-uppercase" style={{ fontSize: '0.66rem', borderColor: '#cbd5e1' }}>Status</th>
                        <th className="px-3 py-2.5 border-bottom text-secondary fw-bold text-uppercase" style={{ fontSize: '0.66rem', borderColor: '#cbd5e1' }}>Billing Date</th>
                        <th className="px-3 py-2.5 border-bottom text-secondary fw-bold text-uppercase" style={{ fontSize: '0.66rem', borderColor: '#cbd5e1' }}>Renewal Date</th>
                        <th className="px-3 py-2.5 border-bottom text-secondary fw-bold text-uppercase text-end" style={{ fontSize: '0.66rem', borderColor: '#cbd5e1' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingBilling ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4 text-secondary small">
                            <i className="fa-solid fa-circle-notch fa-spin me-2 text-info"></i> Loading billing history...
                          </td>
                        </tr>
                      ) : billingHistory.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4 text-secondary small">
                            <i className="fa-solid fa-folder-open mb-2 d-block text-secondary" style={{ fontSize: '1.5rem' }}></i> No invoices found matching filters
                          </td>
                        </tr>
                      ) : (
                        billingHistory.map((inv) => {
                          let badgeClass = 'bg-success bg-opacity-10 text-success border border-success border-opacity-20';
                          if (inv.status === 'Pending') badgeClass = 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20';
                          else if (inv.status === 'Failed') badgeClass = 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20';
                          else if (inv.status === 'Refunded') badgeClass = 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-20';

                          return (
                            <tr key={inv._id}>
                              <td className="px-3 py-2.5 border-bottom font-monospace fw-semibold text-dark" style={{ fontSize: '0.74rem', borderColor: '#e2e8f0' }}>#{inv.invoiceNumber}</td>
                              <td className="px-3 py-2.5 border-bottom text-dark fw-bold" style={{ fontSize: '0.76rem', borderColor: '#e2e8f0' }}>{inv.planName}</td>
                              <td className="px-3 py-2.5 border-bottom text-dark fw-extrabold" style={{ fontSize: '0.76rem', borderColor: '#e2e8f0' }}>₹{inv.amount.toLocaleString('en-IN')}</td>
                              <td className="px-3 py-2.5 border-bottom text-secondary" style={{ fontSize: '0.74rem', borderColor: '#e2e8f0' }}>{inv.paymentMethod}</td>
                              <td className="px-3 py-2.5 border-bottom" style={{ borderColor: '#e2e8f0' }}>
                                <span className={`badge px-2 py-0.5 rounded-pill ${badgeClass}`} style={{ fontSize: '0.62rem' }}>{inv.status}</span>
                              </td>
                              <td className="px-3 py-2.5 border-bottom text-secondary" style={{ fontSize: '0.74rem', borderColor: '#e2e8f0' }}>{new Date(inv.billingDate).toLocaleDateString()}</td>
                              <td className="px-3 py-2.5 border-bottom text-secondary" style={{ fontSize: '0.74rem', borderColor: '#e2e8f0' }}>{new Date(inv.expiryDate).toLocaleDateString()}</td>
                              <td className="px-3 py-2.5 border-bottom text-end" style={{ borderColor: '#e2e8f0' }}>
                                <button 
                                  className="btn btn-sm btn-outline-info p-1 px-2.5" 
                                  style={{ fontSize: '0.68rem', borderRadius: '4px', borderColor: '#0ea5e9', color: '#0ea5e9' }}
                                  onClick={() => {
                                    playSynthSound('click');
                                    window.open(getAvatarUrl(`/api/billing/invoice/${inv._id}?token=${localStorage.getItem('token')}`), '_blank');
                                  }}
                                >
                                  <i className="fa-solid fa-print me-1"></i> View / Print
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Plan Change Confirmation Modal */}
          {showPlanChangeModal && selectedPlanToChange && (
            <div 
              className="modal-backdrop-custom" 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
            >
              <div 
                className="modal-card-custom bg-white rounded-3 shadow-lg" 
                style={{
                  width: '100%',
                  maxWidth: '450px',
                  border: '1px solid #cbd5e1',
                  overflow: 'hidden',
                  animation: 'scaleUp 0.2s ease-out'
                }}
              >
                {/* Modal Header */}
                <div className="p-3.5 border-bottom d-flex align-items-center justify-content-between bg-white">
                  <h3 className="fw-bold mb-0 d-flex align-items-center" style={{ fontFamily: 'Outfit', fontSize: '1.05rem', color: '#0f172a' }}>
                    <i className="fa-solid fa-circle-question text-info me-2.5" style={{ color: '#0EA5E9', fontSize: '1.15rem' }}></i>
                    Confirm Subscription Change
                  </h3>
                  <button 
                    type="button" 
                    className="btn-close" 
                    style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', color: '#64748b', cursor: 'pointer' }}
                    onClick={() => { playSynthSound('click'); setShowPlanChangeModal(false); }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4">
                  <p className="text-secondary small mb-3.5" style={{ fontSize: '0.78rem' }}>
                    Are you sure you want to change your inventory license package?
                  </p>
                  
                  <div className="d-flex flex-column gap-2.5 p-3 rounded-3 bg-light border mb-4" style={{ fontSize: '0.78rem' }}>
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">Current Plan:</span>
                      <span className="fw-bold text-dark">{currentSub?.planName || user?.plan_name || 'Starter Shop'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">Selected Plan:</span>
                      <span className="fw-bold text-info" style={{ color: '#0ea5e9' }}>{selectedPlanToChange.planName}</span>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-2 mt-1">
                      <span className="text-secondary fw-semibold">Price Difference:</span>
                      <span className="fw-extrabold text-success" style={{ fontSize: '0.9rem' }}>
                        ₹{(selectedPlanToChange.yearlyPrice - (plans.find(p => p.planName === currentSub?.planName)?.yearlyPrice || 0)).toLocaleString('en-IN')}/year
                      </span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2.5">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary px-4 py-1.5 fw-semibold" 
                      style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#475569' }} 
                      onClick={() => { playSynthSound('click'); setShowPlanChangeModal(false); }}
                      disabled={planChanging}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-info text-white fw-bold px-4 py-1.5 border-0" 
                      style={{ backgroundColor: '#0EA5E9', borderRadius: '6px', fontSize: '0.75rem' }}
                      onClick={handleConfirmPlanChange}
                      disabled={planChanging}
                    >
                      {planChanging ? (
                        <><i className="fa-solid fa-spinner fa-spin me-1.5"></i> Updating...</>
                      ) : (
                        'Confirm Change'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: Account Settings */}
          {activeTab === 'settings' && (
            <div className="settings-view animate-fade-in" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              
              {/* Header Breadcrumbs */}
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h1 className="fw-bold mb-0.5" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#0f172a' }}>Account Settings</h1>
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0" style={{ fontSize: '0.72rem' }}>
                      <li className="breadcrumb-item"><a href="#dashboard" className="text-decoration-none" style={{ color: '#0ea5e9' }} onClick={() => setActiveTab('dashboard')}>Dashboard</a></li>
                      <li className="breadcrumb-item active" aria-current="page" style={{ color: '#64748b' }}>Settings</li>
                    </ol>
                  </nav>
                </div>
              </div>

              {/* Two Column Cards */}
              <div className="row g-4 mb-4">
                
                {/* Left Card: Merchant Profile */}
                <div className="col-lg-5">
                  <div className="card border bg-white rounded-3 p-4 shadow-sm h-100" style={{ borderColor: '#cbd5e1' }}>
                    <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit', fontSize: '0.92rem', color: '#0f172a' }}>
                      <i className="fa-solid fa-address-card text-info" style={{ color: '#0ea5e9', fontSize: '1.05rem' }}></i>
                      Merchant Profile
                    </h5>

                    {/* Avatar Upload Display */}
                    <div className="d-flex flex-column align-items-center text-center mb-4">
                      <div className="position-relative mb-3">
                        <div className="user-avatar-upload rounded-circle d-flex align-items-center justify-content-center fw-semibold text-info bg-light border" style={{ width: '100px', height: '100px', fontSize: '2.5rem', overflow: 'hidden' }}>
                          {profileAvatar ? (
                            <img src={getAvatarUrl(profileAvatar)} alt="Avatar" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                          ) : (
                            userInitial()
                          )}
                        </div>
                        {isSettingsUploading && (
                          <div className="position-absolute w-100 h-100 rounded-circle top-0 left-0 bg-dark bg-opacity-50 d-flex flex-column align-items-center justify-content-center text-white" style={{ zIndex: 5 }}>
                            <span className="small fw-bold">{settingsUploadProgress}%</span>
                            <div className="progress w-75 mt-1" style={{ height: '4px' }}>
                              <div className="progress-bar bg-info" style={{ width: `${settingsUploadProgress}%` }}></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="d-flex gap-2 mb-3.5">
                        <label className="btn btn-sm btn-outline-info px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', borderColor: '#0ea5e9', color: '#0ea5e9', cursor: 'pointer', backgroundColor: '#ffffff' }}>
                          <i className="fa-solid fa-camera"></i> Change Photo
                          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={onFileChange} style={{ display: 'none' }} />
                        </label>
                        {profileAvatar && (
                          <button className="btn btn-sm btn-outline-danger px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', borderColor: '#ef4444', color: '#ef4444', backgroundColor: '#ffffff' }} onClick={handleRemoveAvatar}>
                            <i className="fa-solid fa-trash-can"></i> Remove
                          </button>
                        )}
                      </div>

                      <h4 className="fw-bold text-dark mb-1" style={{ fontFamily: 'Outfit', fontSize: '1.05rem' }}>{profileName || 'Merchant Account'}</h4>
                      <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-20 px-2.5 py-1 mb-4" style={{ color: '#0ea5e9', fontSize: '0.68rem', borderRadius: '4px' }}>
                        {user?.plan_name || 'Starter Shop'} Plan
                      </span>
                    </div>

                    {/* Metadata items */}
                    <div className="d-flex flex-column gap-3 mb-4" style={{ fontSize: '0.78rem' }}>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-secondary d-flex align-items-center gap-1.5">
                          <i className="fa-regular fa-envelope"></i> Email Address
                        </span>
                        <span className="fw-bold text-dark">{profileEmail || 'N/A'}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-secondary d-flex align-items-center gap-1.5">
                          <i className="fa-regular fa-calendar-check"></i> Registered On
                        </span>
                        <span className="fw-bold text-dark">{user?.registeredAt ? new Date(user.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-secondary d-flex align-items-center gap-1.5">
                          <i className="fa-regular fa-id-card"></i> Active Status
                        </span>
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 px-2.5 py-1" style={{ fontSize: '0.68rem', borderRadius: '4px' }}>
                          Active License
                        </span>
                      </div>
                    </div>

                    {/* SaaS Access Code details */}
                    <div className="p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <i className="fa-solid fa-key text-info" style={{ color: '#0ea5e9' }}></i>
                          <div>
                            <div className="text-secondary" style={{ fontSize: '0.66rem', fontWeight: '500' }}>SaaS Access Code</div>
                            <div className="font-monospace fw-bold text-dark mt-0.5" style={{ fontSize: '0.8rem' }}>
                              {showSettingsSaasCode ? saasCode : 'ZIM-••••-••••'}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-light border p-1" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleToggleSettingsSaasCode} title="Toggle Visibility">
                            <i className={`fa-regular ${showSettingsSaasCode ? 'fa-eye-slash' : 'fa-eye'} text-secondary`}></i>
                          </button>
                          <button className="btn btn-sm btn-light border p-1" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleCopyCode} title="Copy Access Code">
                            <i className="fa-regular fa-copy text-secondary"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Card: Change Security Password */}
                <div className="col-lg-7">
                  <div className="card border bg-white rounded-3 p-4 shadow-sm h-100" style={{ borderColor: '#cbd5e1' }}>
                    <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit', fontSize: '0.92rem', color: '#0f172a' }}>
                      <i className="fa-solid fa-shield-halved text-info" style={{ color: '#0ea5e9', fontSize: '1.05rem' }}></i>
                      Change Security Password
                    </h5>

                    <form onSubmit={handleChangePasswordSubmit}>
                      <div className="form-group mb-3">
                        <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Current Password <span className="text-danger">*</span></label>
                        <div className="position-relative">
                          <input 
                            type={showCurrentPassword ? "text" : "password"} 
                            className="form-control-premium-dark pe-5" 
                            placeholder="Enter current password" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                          />
                          <button type="button" className="btn position-absolute end-0 top-50 translate-middle-y border-0 pe-3 text-secondary" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                            <i className={`fa-regular ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                      </div>

                      <div className="form-group mb-3">
                        <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>New Password <span className="text-danger">*</span></label>
                        <div className="position-relative">
                          <input 
                            type={showNewPassword ? "text" : "password"} 
                            className="form-control-premium-dark pe-5" 
                            placeholder="Enter new password (min. 8 characters)" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                          />
                          <button type="button" className="btn position-absolute end-0 top-50 translate-middle-y border-0 pe-3 text-secondary" onClick={() => setShowNewPassword(!showNewPassword)}>
                            <i className={`fa-regular ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                        <div className="text-muted mt-1" style={{ fontSize: '0.66rem' }}>
                          Password must contain: min 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.
                        </div>
                      </div>

                      <div className="form-group mb-4">
                        <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Confirm New Password <span className="text-danger">*</span></label>
                        <div className="position-relative">
                          <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            className="form-control-premium-dark pe-5" 
                            placeholder="Confirm new password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                          <button type="button" className="btn position-absolute end-0 top-50 translate-middle-y border-0 pe-3 text-secondary" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <i className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end gap-2 border-top pt-3.5">
                        <button type="button" className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold" style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#475569' }} onClick={handleResetPasswordForm}>
                          Reset Form
                        </button>
                        <button type="submit" className="btn btn-info text-white fw-bold px-4 py-1.5 border-0 d-flex align-items-center gap-1.5" style={{ backgroundColor: '#0EA5E9', borderRadius: '6px', fontSize: '0.75rem' }} disabled={passwordUpdating}>
                          {passwordUpdating ? (
                            <><i className="fa-solid fa-spinner fa-spin"></i> Updating...</>
                          ) : (
                            <><i className="fa-solid fa-lock"></i> Update Security</>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

              </div>

              {/* Security Audit & Activity Timelines */}
              <div className="row g-4">
                
                {/* Security Audit Logs */}
                <div className="col-md-6">
                  <div className="card border bg-white rounded-3 p-3.5 shadow-sm" style={{ borderColor: '#cbd5e1' }}>
                    <h5 className="fw-bold mb-3.5 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit', fontSize: '0.92rem', color: '#0f172a' }}>
                      <i className="fa-solid fa-user-shield text-info" style={{ color: '#0ea5e9', fontSize: '1.05rem' }}></i>
                      Security Password Audit Logs
                    </h5>

                    <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.72rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc' }}>
                            <th className="px-2.5 py-2 border-bottom text-secondary text-uppercase fw-bold" style={{ fontSize: '0.62rem', borderColor: '#e2e8f0' }}>Browser</th>
                            <th className="px-2.5 py-2 border-bottom text-secondary text-uppercase fw-bold" style={{ fontSize: '0.62rem', borderColor: '#e2e8f0' }}>Device</th>
                            <th className="px-2.5 py-2 border-bottom text-secondary text-uppercase fw-bold" style={{ fontSize: '0.62rem', borderColor: '#e2e8f0' }}>IP Address</th>
                            <th className="px-2.5 py-2 border-bottom text-secondary text-uppercase fw-bold" style={{ fontSize: '0.62rem', borderColor: '#e2e8f0' }}>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingAuditLogs ? (
                            <tr>
                              <td colSpan="4" className="text-center py-3 text-secondary small">
                                <i className="fa-solid fa-circle-notch fa-spin me-2 text-info"></i> Loading audit records...
                              </td>
                            </tr>
                          ) : securityAuditLogs.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="text-center py-3 text-secondary small">
                                No security logs recorded
                              </td>
                            </tr>
                          ) : (
                            securityAuditLogs.map((log) => (
                              <tr key={log._id}>
                                <td className="px-2.5 py-2 border-bottom text-dark fw-semibold" style={{ borderColor: '#f1f5f9' }}>{log.browser}</td>
                                <td className="px-2.5 py-2 border-bottom text-dark" style={{ borderColor: '#f1f5f9' }}>
                                  <span className="badge bg-light text-dark border px-2 py-0.5" style={{ fontSize: '0.62rem', borderRadius: '4px' }}>
                                    {log.device}
                                  </span>
                                </td>
                                <td className="px-2.5 py-2 border-bottom font-monospace text-secondary" style={{ borderColor: '#f1f5f9' }}>{log.ipAddress}</td>
                                <td className="px-2.5 py-2 border-bottom text-secondary" style={{ borderColor: '#f1f5f9' }}>{new Date(log.timestamp).toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="col-md-6">
                  <div className="card border bg-white rounded-3 p-3.5 shadow-sm" style={{ borderColor: '#cbd5e1' }}>
                    <h5 className="fw-bold mb-3.5 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit', fontSize: '0.92rem', color: '#0f172a' }}>
                      <i className="fa-solid fa-timeline text-info" style={{ color: '#0ea5e9', fontSize: '1.05rem' }}></i>
                      Account Activity Timeline
                    </h5>

                    <div className="d-flex flex-column gap-3" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                      {loadingTimeline ? (
                        <div className="text-center py-4 text-secondary small">
                          <i className="fa-solid fa-circle-notch fa-spin me-2 text-info"></i> Loading timeline...
                        </div>
                      ) : activityTimeline.length === 0 ? (
                        <div className="text-center py-4 text-secondary small">
                          No recent activities logged
                        </div>
                      ) : (
                        activityTimeline.map((act) => {
                          let iconClass = 'fa-circle-dot text-secondary';
                          let iconBg = 'rgba(100, 116, 139, 0.1)';
                          
                          if (act.type === 'avatar_updated') {
                            iconClass = 'fa-camera text-info';
                            iconBg = 'rgba(14, 165, 233, 0.1)';
                          } else if (act.type === 'password_change') {
                            iconClass = 'fa-key text-warning';
                            iconBg = 'rgba(234, 179, 8, 0.1)';
                          } else if (act.type === 'plan_upgrade' || act.type === 'plan_downgrade') {
                            iconClass = 'fa-star text-success';
                            iconBg = 'rgba(34, 197, 94, 0.1)';
                          } else if (act.type === 'saas_code_viewed') {
                            iconClass = 'fa-eye text-primary';
                            iconBg = 'rgba(59, 130, 246, 0.1)';
                          }

                          return (
                            <div className="d-flex gap-3 align-items-start" key={act._id}>
                              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px', backgroundColor: iconBg }}>
                                <i className={`fa-solid ${iconClass}`} style={{ fontSize: '0.78rem' }}></i>
                              </div>
                              <div style={{ fontSize: '0.74rem', minWidth: 0 }}>
                                <div className="fw-bold text-dark">{act.title}</div>
                                <div className="text-secondary text-truncate mt-0.5" style={{ fontSize: '0.7rem' }}>{act.description}</div>
                                <div className="text-muted font-monospace mt-1" style={{ fontSize: '0.62rem' }}>{new Date(act.timestamp).toLocaleString()}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Image Crop Modal */}
          {cropModalOpen && cropImageSrc && (
            <div 
              className="modal-backdrop-custom" 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1100
              }}
            >
              <div 
                className="modal-card-custom bg-white rounded-3 shadow-lg" 
                style={{
                  width: '95%',
                  maxWidth: '480px',
                  border: '1px solid #cbd5e1',
                  overflow: 'hidden',
                  animation: 'scaleUp 0.2s ease-out'
                }}
              >
                {/* Modal Header */}
                <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white">
                  <h3 className="fw-bold mb-0 d-flex align-items-center" style={{ fontFamily: 'Outfit', fontSize: '1.05rem', color: '#0f172a' }}>
                    <i className="fa-solid fa-crop text-info me-2.5" style={{ color: '#0EA5E9', fontSize: '1.15rem' }}></i>
                    Crop Profile Photo
                  </h3>
                  <button 
                    type="button" 
                    className="btn-close" 
                    style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', color: '#64748b', cursor: 'pointer' }}
                    onClick={() => { playSynthSound('click'); setCropModalOpen(false); }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-3">
                  <div className="position-relative w-100" style={{ height: '280px', backgroundColor: '#333' }}>
                    <Cropper
                      image={cropImageSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                    />
                  </div>

                  {/* Zoom Slider */}
                  <div className="mt-3.5 mb-4 d-flex align-items-center gap-3">
                    <span className="small text-secondary fw-semibold" style={{ fontSize: '0.72rem' }}>Zoom:</span>
                    <input 
                      type="range" 
                      value={zoom} 
                      min={1} 
                      max={3} 
                      step={0.1} 
                      aria-label="Zoom" 
                      className="form-range" 
                      onChange={(e) => setZoom(parseFloat(e.target.value))} 
                    />
                  </div>

                  <div className="d-flex justify-content-end gap-2.5">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary px-4 py-1.5 fw-semibold" 
                      style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#475569' }} 
                      onClick={() => { playSynthSound('click'); setCropModalOpen(false); }}
                      disabled={isSettingsUploading}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-info text-white fw-bold px-4 py-1.5 border-0" 
                      style={{ backgroundColor: '#0EA5E9', borderRadius: '6px', fontSize: '0.75rem' }}
                      onClick={handleCropAndUpload}
                      disabled={isSettingsUploading}
                    >
                      {isSettingsUploading ? (
                        <><i className="fa-solid fa-spinner fa-spin me-1.5"></i> Uploading {settingsUploadProgress}%</>
                      ) : (
                        'Crop & Save'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Render Fallback for other tabs */}
          {activeTab !== 'dashboard' && activeTab !== 'billing' && activeTab !== 'sales' && activeTab !== 'purchases' && activeTab !== 'categories' && activeTab !== 'suppliers' && activeTab !== 'customers' && activeTab !== 'reports' && activeTab !== 'billing-subscription' && activeTab !== 'settings' && (
            <div className="p-5 text-center rounded-4 border bg-white" style={{ borderColor: '#cbd5e1', margin: '3rem auto', maxWidth: '500px', boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.05)' }}>
              <i className="fa-solid fa-screwdriver-wrench text-secondary mb-3" style={{ fontSize: '3rem', color: '#94a3b8' }}></i>
              <h4 className="fw-bold text-dark text-capitalize" style={{ fontFamily: 'Outfit', fontSize: '1.1rem' }}>{activeTab.replace('-', ' ')} Page</h4>
              <p className="text-secondary small mb-4" style={{ fontSize: '0.78rem' }}>This module is currently under database migration or client synchronization node.</p>
              <a href="#dashboard" onClick={() => { playSynthSound('click'); setActiveTab('dashboard'); }} className="btn btn-premium-primary btn-sm px-3.5 py-1.5 fw-semibold" style={{ fontSize: '0.75rem', borderRadius: '6px' }}>Go back to Dashboard</a>
            </div>
          )}

          {/* Record New Sale Modal */}
          {showRecordSaleModal && (
            <div 
              className="modal-backdrop-custom" 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
            >
              <div 
                className="modal-card-custom bg-white rounded-3 shadow-lg" 
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  border: '1px solid #cbd5e1',
                  overflow: 'hidden',
                  animation: 'scaleUp 0.2s ease-out'
                }}
              >
                {/* Modal Header */}
                <div className="p-3 border-bottom d-flex align-items-center justify-content-between" style={{ backgroundColor: '#ffffff' }}>
                  <h3 className="fw-bold mb-0 d-flex align-items-center" style={{ fontFamily: 'Outfit', fontSize: '1.05rem', color: '#0f172a' }}>
                    <i className="fa-solid fa-file-invoice-dollar text-primary me-2.5" style={{ color: '#0EA5E9', fontSize: '1.2rem' }}></i>
                    Record New Sale
                  </h3>
                  <button 
                    type="button" 
                    className="btn-close" 
                    style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', color: '#64748b', cursor: 'pointer' }}
                    onClick={() => { playSynthSound('click'); setShowRecordSaleModal(false); }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSaveInvoiceFromModal}>
                  <div className="p-3" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    
                    <div className="form-group mb-3">
                      <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Invoice Number <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control" 
                        style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.82rem', padding: '0.5rem 0.75rem', borderRadius: '6px', width: '100%', cursor: 'not-allowed', fontWeight: 'bold' }} 
                        value={saleInvoiceNumber} 
                        readOnly 
                        disabled 
                      />
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Customer Name <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control-premium-dark" 
                        placeholder="Enter customer name" 
                        value={saleCustomerName} 
                        onChange={(e) => setSaleCustomerName(e.target.value)} 
                        required 
                      />
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Sale Date <span className="text-danger">*</span></label>
                        <input 
                          type="date" 
                          className="form-control-premium-dark" 
                          value={saleDateInput} 
                          onChange={(e) => setSaleDateInput(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Grand Total ($) <span className="text-danger">*</span></label>
                        <input 
                          type="number" 
                          step="0.01"
                          className="form-control-premium-dark" 
                          placeholder="0.00" 
                          value={saleGrandTotalInput} 
                          onChange={(e) => setSaleGrandTotalInput(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Payment Method <span className="text-danger">*</span></label>
                      <select 
                        className="form-control-premium-dark" 
                        value={salePaymentMethod} 
                        onChange={(e) => setSalePaymentMethod(e.target.value)}
                        required
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="Net Banking">Net Banking</option>
                      </select>
                    </div>

                    {/* Drag and drop image upload */}
                    <div className="form-group mb-2">
                      <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Upload Receipt / Image</label>
                      <div 
                        className="d-flex flex-column align-items-center justify-content-center border border-dashed rounded-3 p-3 text-center position-relative"
                        style={{
                          minHeight: '140px',
                          borderColor: saleDragOver ? '#0EA5E9' : '#cbd5e1',
                          backgroundColor: saleDragOver ? 'rgba(0, 123, 255, 0.05)' : '#f8fafc',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onDragOver={handleSaleDragOver}
                        onDragLeave={handleSaleDragLeave}
                        onDrop={handleSaleDrop}
                        onClick={() => document.getElementById('sale-file-input').click()}
                      >
                        <input 
                          type="file" 
                          id="sale-file-input" 
                          className="d-none" 
                          accept="image/jpeg,image/png,image/webp" 
                          onChange={handleSaleFileChange}
                        />

                        {saleReceiptImage ? (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center position-relative">
                            <img src={saleReceiptImage} alt="Receipt preview" style={{ maxWidth: '100%', maxHeight: '110px', borderRadius: '4px', objectFit: 'contain' }} />
                          </div>
                        ) : (
                          <>
                            <i className="fa-solid fa-cloud-arrow-up text-primary mb-1.5" style={{ fontSize: '1.8rem', color: '#0EA5E9' }}></i>
                            <div className="fw-bold text-dark mb-0.5" style={{ fontSize: '0.78rem' }}>Drag & drop receipt here</div>
                            <div className="text-secondary small" style={{ fontSize: '0.68rem' }}>or click to browse</div>
                            <div className="text-muted mt-1" style={{ fontSize: '0.6rem' }}>JPG, PNG or WEBP (Max. 2MB)</div>
                          </>
                        )}
                      </div>

                      {saleReceiptImage && (
                        <div className="mt-2 text-center">
                          <button 
                            type="button" 
                            className="btn btn-outline-danger btn-sm py-1 fw-semibold d-flex align-items-center justify-content-center gap-1.5 w-100" 
                            style={{ fontSize: '0.7rem', borderRadius: '6px' }} 
                            onClick={handleSaleRemoveImage}
                          >
                            <i className="fa-solid fa-trash-can"></i> Remove Image
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Modal Footer */}
                  <div className="p-3 border-top d-flex justify-content-end gap-2" style={{ backgroundColor: '#f8fafc' }}>
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold" 
                      style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#475569' }} 
                      onClick={() => { playSynthSound('click'); setShowRecordSaleModal(false); }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn text-white fw-bold px-4 py-1.5 border-0" 
                      style={{ backgroundColor: '#0EA5E9', borderRadius: '6px', fontSize: '0.75rem' }}
                    >
                      <i className="fa-solid fa-save me-1.5"></i> Save Invoice
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Selected Invoice Details Modal */}
          {selectedInvoiceDetails && (
            <div 
              className="modal-backdrop-custom" 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
            >
              <div 
                className="modal-card-custom bg-white rounded-3 shadow-lg" 
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  border: '1px solid #cbd5e1',
                  overflow: 'hidden',
                  animation: 'scaleUp 0.2s ease-out'
                }}
              >
                {/* Modal Header */}
                <div className="p-3 border-bottom d-flex align-items-center justify-content-between" style={{ backgroundColor: '#ffffff' }}>
                  <h3 className="fw-bold mb-0 d-flex align-items-center" style={{ fontFamily: 'Outfit', fontSize: '1.05rem', color: '#0f172a' }}>
                    <i className="fa-solid fa-circle-info text-primary me-2.5" style={{ color: '#0EA5E9', fontSize: '1.1rem' }}></i>
                    Invoice Details: {selectedInvoiceDetails.invoice_number}
                  </h3>
                  <button 
                    type="button" 
                    className="btn-close" 
                    style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', color: '#64748b', cursor: 'pointer' }}
                    onClick={() => { playSynthSound('click'); setSelectedInvoiceDetails(null); }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-3">
                  <div className="d-flex flex-column gap-2.5 mb-3">
                    <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.78rem' }}>
                      <span className="text-secondary">Customer Name:</span>
                      <span className="fw-bold text-dark">{selectedInvoiceDetails.customer_name}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.78rem' }}>
                      <span className="text-secondary">Invoice Date:</span>
                      <span className="fw-bold text-dark">{new Date(selectedInvoiceDetails.sale_date).toLocaleDateString()}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.78rem' }}>
                      <span className="text-secondary">Payment Method:</span>
                      <span className="fw-bold text-dark">{selectedInvoiceDetails.payment_method}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.78rem' }}>
                      <span className="text-secondary">Status:</span>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 px-2 py-0.5" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)', fontSize: '0.7rem', borderRadius: '4px' }}>
                        {selectedInvoiceDetails.status}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.78rem' }}>
                      <span className="text-secondary fw-semibold">Grand Total:</span>
                      <span className="fw-extrabold text-success" style={{ fontSize: '1.05rem' }}>${parseFloat(selectedInvoiceDetails.grand_total).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Uploaded Receipt Image Preview */}
                  <div className="form-group mb-2">
                    <label className="form-label mb-1.5 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Uploaded Receipt / Image</label>
                    <div 
                      className="d-flex align-items-center justify-content-center border rounded-3 p-2 bg-light text-center"
                      style={{
                        minHeight: '180px',
                        borderColor: '#cbd5e1',
                        backgroundColor: '#f8fafc',
                      }}
                    >
                      {selectedInvoiceDetails.receipt_image ? (
                        <img src={selectedInvoiceDetails.receipt_image} alt="Receipt copy" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', objectFit: 'contain' }} />
                      ) : (
                        <div className="d-flex flex-column align-items-center text-muted">
                          <i className="fa-regular fa-image mb-2 opacity-40" style={{ fontSize: '2.5rem' }}></i>
                          <span className="small text-secondary" style={{ fontSize: '0.72rem' }}>No receipt image attached to this invoice.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-3 border-top d-flex justify-content-end" style={{ backgroundColor: '#f8fafc' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm px-4 py-1.5 fw-semibold border-0" 
                    style={{ fontSize: '0.75rem', borderRadius: '6px', backgroundColor: '#64748b' }} 
                    onClick={() => { playSynthSound('click'); setSelectedInvoiceDetails(null); }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Record New Purchase Modal */}
          {showRecordPurchaseModal && (
            <div 
              className="modal-backdrop-custom" 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
            >
              <div 
                className="modal-card-custom bg-white rounded-3 shadow-lg" 
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  border: '1px solid #cbd5e1',
                  overflow: 'hidden',
                  animation: 'scaleUp 0.2s ease-out'
                }}
              >
                {/* Modal Header */}
                <div className="p-3 border-bottom d-flex align-items-center justify-content-between" style={{ backgroundColor: '#ffffff' }}>
                  <h3 className="fw-bold mb-0 d-flex align-items-center" style={{ fontFamily: 'Outfit', fontSize: '1.05rem', color: '#0f172a' }}>
                    <i className="fa-solid fa-truck text-primary me-2.5" style={{ color: '#0EA5E9', fontSize: '1.2rem' }}></i>
                    Record New Purchase
                  </h3>
                  <button 
                    type="button" 
                    className="btn-close" 
                    style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', color: '#64748b', cursor: 'pointer' }}
                    onClick={() => { playSynthSound('click'); setShowRecordPurchaseModal(false); }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSavePurchaseFromModal}>
                  <div className="p-3" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    
                    <div className="form-group mb-3">
                      <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Purchase PO Number <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control" 
                        style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.82rem', padding: '0.5rem 0.75rem', borderRadius: '6px', width: '100%', cursor: 'not-allowed', fontWeight: 'bold' }} 
                        value={purchasePoNumber} 
                        readOnly 
                        disabled 
                      />
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Supplier / Vendor Name <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control-premium-dark" 
                        placeholder="Enter supplier or vendor name" 
                        value={purchaseSupplierName} 
                        onChange={(e) => setPurchaseSupplierName(e.target.value)} 
                        required 
                      />
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Purchase Date <span className="text-danger">*</span></label>
                        <input 
                          type="date" 
                          className="form-control-premium-dark" 
                          value={purchaseDateInput} 
                          onChange={(e) => setPurchaseDateInput(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Grand Total ($) <span className="text-danger">*</span></label>
                        <input 
                          type="number" 
                          step="0.01"
                          className="form-control-premium-dark" 
                          placeholder="0.00" 
                          value={purchaseGrandTotalInput} 
                          onChange={(e) => setPurchaseGrandTotalInput(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label mb-1 fw-semibold text-secondary" style={{ fontSize: '0.72rem' }}>Payment Status <span className="text-danger">*</span></label>
                      <select 
                        className="form-control-premium-dark" 
                        value={purchasePaymentStatus} 
                        onChange={(e) => setPurchasePaymentStatus(e.target.value)}
                        required
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>

                  </div>

                  {/* Modal Footer */}
                  <div className="p-3 border-top d-flex justify-content-end gap-2" style={{ backgroundColor: '#f8fafc' }}>
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary px-3.5 py-1.5 fw-semibold" 
                      style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#475569' }} 
                      onClick={() => { playSynthSound('click'); setShowRecordPurchaseModal(false); }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn text-white fw-bold px-4 py-1.5 border-0" 
                      style={{ backgroundColor: '#0EA5E9', borderRadius: '6px', fontSize: '0.75rem' }}
                    >
                      <i className="fa-solid fa-save me-1.5"></i> Save Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Selected Purchase Details Modal */}
          {selectedPurchaseDetails && (
            <div 
              className="modal-backdrop-custom" 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
            >
              <div 
                className="modal-card-custom bg-white rounded-3 shadow-lg" 
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  border: '1px solid #cbd5e1',
                  overflow: 'hidden',
                  animation: 'scaleUp 0.2s ease-out'
                }}
              >
                {/* Modal Header */}
                <div className="p-3 border-bottom d-flex align-items-center justify-content-between" style={{ backgroundColor: '#ffffff' }}>
                  <h3 className="fw-bold mb-0 d-flex align-items-center" style={{ fontFamily: 'Outfit', fontSize: '1.05rem', color: '#0f172a' }}>
                    <i className="fa-solid fa-circle-info text-primary me-2.5" style={{ color: '#0EA5E9', fontSize: '1.1rem' }}></i>
                    Purchase Details: {selectedPurchaseDetails.purchase_number}
                  </h3>
                  <button 
                    type="button" 
                    className="btn-close" 
                    style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', color: '#64748b', cursor: 'pointer' }}
                    onClick={() => { playSynthSound('click'); setSelectedPurchaseDetails(null); }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-3">
                  <div className="d-flex flex-column gap-2.5 mb-1">
                    <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.78rem' }}>
                      <span className="text-secondary">Supplier / Vendor:</span>
                      <span className="fw-bold text-dark">{selectedPurchaseDetails.supplier_name}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.78rem' }}>
                      <span className="text-secondary">Purchase Date:</span>
                      <span className="fw-bold text-dark">{new Date(selectedPurchaseDetails.purchase_date).toLocaleDateString()}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.78rem' }}>
                      <span className="text-secondary">Payment Status:</span>
                      <span className={`badge px-2.5 py-1 ${
                        selectedPurchaseDetails.payment_status === 'Paid' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-20' :
                        selectedPurchaseDetails.payment_status === 'Pending' ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20' :
                        'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20'
                      }`} style={{ fontSize: '0.7rem', borderRadius: '4px' }}>
                        {selectedPurchaseDetails.payment_status}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.78rem' }}>
                      <span className="text-secondary fw-semibold">Grand Total:</span>
                      <span className="fw-extrabold text-success" style={{ fontSize: '1.05rem' }}>${parseFloat(selectedPurchaseDetails.grand_total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-3 border-top d-flex justify-content-end" style={{ backgroundColor: '#f8fafc' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm px-4 py-1.5 fw-semibold border-0" 
                    style={{ fontSize: '0.75rem', borderRadius: '6px', backgroundColor: '#64748b' }} 
                    onClick={() => { playSynthSound('click'); setSelectedPurchaseDetails(null); }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default DashboardPage;
