import React, { useState, useEffect } from 'react';
import { Asset, AssetStatus, Bid, AdminUser } from './types';
import { INITIAL_ASSETS, INITIAL_ADMINS } from './data/mockData';
import AdminDashboard from './components/AdminDashboard';
import AdminAssets from './components/AdminAssets';
import AdminUsers from './components/AdminUsers';
import CatalogView from './components/CatalogView';
import LoginModal from './components/LoginModal';
import { useLanguage } from './components/LanguageContext';
import { 
  seedDatabaseIfEmpty, 
  subscribeToAssets, 
  subscribeToAdmins, 
  addAssetToDb, 
  updateAssetInDb, 
  deleteAssetFromDb, 
  addBidToAsset, 
  addAdminToDb, 
  deleteAdminFromDb 
} from './firebase';
import { 
  Shield, 
  Users, 
  Truck, 
  TrendingUp, 
  LogOut, 
  LogIn, 
  LayoutDashboard, 
  PlusCircle, 
  UserCheck, 
  ChevronRight,
  MapPin,
  Menu,
  X,
  Globe,
  Mail
} from 'lucide-react';

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  // 1. Core States
  const [role, setRole] = useState<'external' | 'internal'>('external');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loggedInAdminEmail, setLoggedInAdminEmail] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Navigation inside Admin area
  const [adminTab, setAdminTab] = useState<'dashboard' | 'assets' | 'users'>('dashboard');
  
  // Mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Database States (pre-seeded from mockData and stored in localStorage)
  const [assets, setAssets] = useState<Asset[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>(INITIAL_ADMINS);
  
  // Selected asset for highlighting or detailed specs in AdminAssets
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Initialize data and hook up Firebase subscription
  useEffect(() => {
    let unsubscribeAssets: (() => void) | null = null;
    let unsubscribeAdmins: (() => void) | null = null;

    // Seed default records if empty, then subscribe to collections in real-time
    seedDatabaseIfEmpty().then(() => {
      unsubscribeAssets = subscribeToAssets((updatedAssets) => {
        if (updatedAssets) {
          // Keep descending ID order or keep order stable
          setAssets([...updatedAssets].sort((a, b) => b.id.localeCompare(a.id)));
        }
      });

      unsubscribeAdmins = subscribeToAdmins((updatedAdmins) => {
        if (updatedAdmins && updatedAdmins.length > 0) {
          setAdmins(updatedAdmins);
        }
      });
    }).catch((err) => {
      console.warn("Firestore connection is offline or unavailable. Operating with local database.", err);
    });

    const storedSession = localStorage.getItem('pancaran_session_email');
    if (storedSession) {
      setIsAdminLoggedIn(true);
      setLoggedInAdminEmail(storedSession);
    }

    return () => {
      if (unsubscribeAssets) unsubscribeAssets();
      if (unsubscribeAdmins) unsubscribeAdmins();
    };
  }, []);

  // 2. Business Actions (Admin Operations via Firestore)
  
  // Input Asset (Input Asset flow in Asset branch)
  const handleAddAsset = async (newAssetData: Omit<Asset, 'id' | 'bids' | 'highestBid'>) => {
    const finalId = `PL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newAsset: Asset = {
      ...newAssetData,
      id: finalId,
      highestBid: newAssetData.startingPrice,
      bids: []
    };

    // Optimistic / Local update in case Firestore is offline
    setAssets(prev => [newAsset, ...prev]);

    try {
      await addAssetToDb({
        ...newAssetData,
        id: finalId,
        highestBid: newAssetData.startingPrice,
        bids: []
      });
    } catch (error) {
      console.warn("Firebase offline or error, saved locally:", error);
    }
  };

  // Update Asset (Edit specs/attributes)
  const handleUpdateAsset = async (assetId: string, updatedAsset: Partial<Asset>) => {
    // Optimistic update
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...updatedAsset } : a));

    try {
      await updateAssetInDb(assetId, updatedAsset);
    } catch (error) {
      console.warn("Firebase offline or error, saved locally:", error);
    }
  };

  // Update Asset Status (Open / Sold toggle)
  const handleUpdateAssetStatus = async (assetId: string, status: AssetStatus) => {
    // Optimistic update
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status } : a));

    try {
      await updateAssetInDb(assetId, { status });
    } catch (error) {
      console.warn("Firebase offline or error, saved locally:", error);
    }
  };

  // Delete Asset
  const handleDeleteAsset = async (assetId: string) => {
    // Optimistic update
    setAssets(prev => prev.filter(a => a.id !== assetId));
    setSelectedAssetId(null);

    try {
      await deleteAssetFromDb(assetId);
    } catch (error) {
      console.warn("Firebase offline or error, saved locally:", error);
    }
  };

  // Create Access / User Management (Create access flow)
  const handleAddAdmin = async (newAdmin: AdminUser) => {
    setAdmins(prev => [...prev.filter(a => a.email !== newAdmin.email), newAdmin]);

    try {
      await addAdminToDb(newAdmin);
    } catch (error) {
      console.warn("Firebase offline or error, saved locally:", error);
    }
  };

  const handleDeleteAdmin = async (email: string) => {
    setAdmins(prev => prev.filter(a => a.email !== email));

    try {
      await deleteAdminFromDb(email);
    } catch (error) {
      console.warn("Firebase offline or error, saved locally:", error);
    }
  };

  // 3. Business Actions (External Operations)

  // Input Bid Price & Input Time Survey
  const handlePlaceBid = async (assetId: string, bidData: Omit<Bid, 'id' | 'timestamp'>) => {
    const nextBidId = `B-${Math.floor(100 + Math.random() * 900)}`;
    const newBid: Bid = {
      ...bidData,
      id: nextBidId,
      timestamp: new Date().toISOString()
    };

    // Optimistic update
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        const updatedBids = [...(a.bids || []), newBid];
        const highestBid = Math.max(...updatedBids.map(b => b.price), a.startingPrice);
        return {
          ...a,
          bids: updatedBids,
          highestBid: highestBid
        };
      }
      return a;
    }));

    try {
      await addBidToAsset(assetId, newBid);
    } catch (error) {
      console.warn("Firebase offline or error, saved locally:", error);
    }
  };

  // 4. Session & Authentication handlers
  const handleLoginSuccess = (email: string) => {
    setIsAdminLoggedIn(true);
    setLoggedInAdminEmail(email);
    localStorage.setItem('pancaran_session_email', email);
    setRole('internal'); // Switch to internal dashboard on login
    setAdminTab('dashboard');
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setLoggedInAdminEmail('');
    localStorage.removeItem('pancaran_session_email');
    setRole('external'); // Redirect back to external catalog on logout
  };

  const handleSelectAssetAndSwitchTab = (assetId: string) => {
    setSelectedAssetId(assetId);
    setAdminTab('assets');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans" id="app-root-wrapper">
      
      {/* Sleek, Sticky Header / Navigation with a premium dark blue and light blue color harmony */}
      <header 
        className="sticky top-0 z-40 shadow-lg text-white border-b border-blue-500/20 overflow-hidden bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950"
        id="main-navigation-header"
      >
        {/* Soft, multi-layered light blue and cyan ambient glows */}
        <div className="absolute -top-10 left-1/4 w-96 h-20 bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute -bottom-10 right-1/4 w-80 h-16 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}></div>
        
        {/* Glowing light blue bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-400/80 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center shadow-md shadow-blue-500/10 overflow-hidden">
                <img 
                  src="https://lh3.googleusercontent.com/d/1LmpjB5qAX8ev5_JRzYQDwjM58RxHl18X" 
                  alt="Pancaran Logo" 
                  className="w-full h-full object-contain p-0.5"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://drive.google.com/uc?export=download&id=1LmpjB5qAX8ev5_JRzYQDwjM58RxHl18X";
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg tracking-tight">
                  Pancaran <span className="text-blue-400 font-extrabold drop-shadow-[0_0_8px_rgba(96,165,250,0.35)]">Lelang</span>
                </span>
              </div>
            </div>

            {/* Desktop Navigation Toggles */}
            <div className="hidden md:flex items-center gap-8">
              
              {/* Role Switchers */}
              {isAdminLoggedIn && (
                <div className="flex items-center gap-6 text-sm font-medium">
                  <button
                    onClick={() => setRole('external')}
                    className={`pb-1 transition-all flex items-center justify-center relative ${
                      role === 'external'
                        ? 'text-blue-300 font-bold drop-shadow-[0_0_6px_rgba(147,197,253,0.3)]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    id="tab-external-catalog"
                    title={t('Katalog Eksternal')}
                  >
                    <Globe className="w-5 h-5 mr-1" />
                    {role === 'external' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (isAdminLoggedIn) {
                        setRole('internal');
                      } else {
                        setIsLoginModalOpen(true);
                      }
                    }}
                    className={`pb-1 transition-all flex items-center justify-center relative ${
                      role === 'internal'
                        ? 'text-blue-300 font-bold drop-shadow-[0_0_6px_rgba(147,197,253,0.3)]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    id="tab-internal-admin"
                    title={t('Area Admin Internal')}
                  >
                    <Shield className="w-5 h-5 mr-1" />
                    {role === 'internal' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
                    )}
                  </button>
                </div>
              )}

              {/* Desktop Language Selector */}
              <div className="flex bg-blue-950/40 p-0.5 rounded-lg border border-blue-800/40 shadow-inner">
                <button
                  onClick={() => setLanguage('id')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                    language === 'id' 
                      ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow shadow-blue-500/20' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ID
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                    language === 'en' 
                      ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow shadow-blue-500/20' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>

              {/* Logged In Info */}
              <div className="flex items-center gap-4">
                {isAdminLoggedIn ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-white text-xs font-semibold">Admin Digital Solution</p>
                      <p className="text-slate-400 text-[10px] truncate max-w-[150px] font-mono">{loggedInAdminEmail}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-1.5 hover:bg-slate-800/80 text-slate-400 hover:text-rose-400 rounded-lg transition-colors border border-transparent hover:border-slate-700/50"
                      title={t('Keluar')}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md shadow-blue-500/15 transition-all flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" /> {t('Login Admin')}
                  </button>
                )}
              </div>

            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              {/* Always visible mobile language switcher */}
              <div className="flex bg-blue-950/40 p-0.5 rounded-lg border border-blue-800/40 shadow-inner">
                <button
                  onClick={() => setLanguage('id')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                    language === 'id' 
                      ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow shadow-blue-500/20' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ID
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                    language === 'en' 
                      ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow shadow-blue-500/20' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>

              {isAdminLoggedIn && (
                <span className="text-[10px] font-mono font-bold bg-blue-500 text-white px-2 py-1 rounded">
                  {t('Admin Active')}
                </span>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-4 shadow-lg animate-slide-in">
            {/* Language Selection in Mobile */}
            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500">Language / Bahasa</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setLanguage('id')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    language === 'id' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Indonesian
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    language === 'en' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {isAdminLoggedIn && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">{t('Pilih Tampilan')}</p>
                <button
                  onClick={() => { setRole('external'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold ${
                    role === 'external' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t('Katalog Eksternal (Public)')}
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (isAdminLoggedIn) {
                      setRole('internal');
                    } else {
                      setIsLoginModalOpen(true);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                    role === 'internal' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="w-4 h-4" /> {t('Area Admin Internal')}
                </button>
              </div>
            )}

            {role === 'internal' && isAdminLoggedIn && (
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">{t('Menu Admin')}</p>
                <button
                  onClick={() => { setAdminTab('dashboard'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold ${
                    adminTab === 'dashboard' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  {t('Dashboard Ringkasan')}
                </button>
                <button
                  onClick={() => { setAdminTab('assets'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold ${
                    adminTab === 'assets' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  {t('Kelola Aset (Tambah & Bids)')}
                </button>
                <button
                  onClick={() => { setAdminTab('users'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold ${
                    adminTab === 'users' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  {t('Manajemen Akses')}
                </button>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
              {isAdminLoggedIn ? (
                <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                  <div className="text-xs">
                    <p className="text-[9px] text-slate-400 font-bold">{t('AKUN MASUK:')}</p>
                    <p className="font-mono font-bold text-slate-700 truncate">{loggedInAdminEmail}</p>
                  </div>
                  <button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="w-full py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> {t('Logout Admin')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" /> {t('Login Admin')}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main App Container */}
      {role === 'internal' && isAdminLoggedIn ? (
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          
          {/* Left Sidebar */}
          <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 p-5 flex-col justify-between shrink-0" id="admin-left-sidebar">
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">
                  {t('Menu Admin')}
                </h3>
                
                <nav className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setAdminTab('dashboard')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-left transition-all ${
                      adminTab === 'dashboard'
                        ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>{t('Dashboard Ringkasan')}</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('assets')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-left transition-all ${
                      adminTab === 'assets'
                        ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Truck className="w-4 h-4 shrink-0" />
                    <span>{t('Kelola Aset (Tambah & Bids)')}</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('users')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-left transition-all ${
                      adminTab === 'users'
                        ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>{t('Manajemen Akses')}</span>
                  </button>
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">
                  {t('Lelang Aktif')}
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">{t('Sedang Berjalan')}</span>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {assets.filter(a => a.status === 'Open').length}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">{t('Unit Terjual')}</span>
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {assets.filter(a => a.status === 'Sold').length}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500 mb-1.5 font-bold uppercase tracking-wide">{t('Status Koneksi')}</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-[11px] font-semibold text-slate-700">Server: Singapore-01</span>
              </div>
            </div>
          </aside>

          {/* Main Panel Content */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
            <div className="space-y-6">
              {adminTab === 'dashboard' && (
                <AdminDashboard 
                  assets={assets} 
                  onSelectAsset={handleSelectAssetAndSwitchTab} 
                />
              )}
              {adminTab === 'assets' && (
                <AdminAssets 
                  assets={assets}
                  selectedAssetId={selectedAssetId}
                  onSelectAsset={setSelectedAssetId}
                  onAddAsset={handleAddAsset}
                  onUpdateAsset={handleUpdateAsset}
                  onUpdateAssetStatus={handleUpdateAssetStatus}
                  onDeleteAsset={handleDeleteAsset}
                />
              )}
              {adminTab === 'users' && (
                <AdminUsers 
                  admins={admins}
                  onAddAdmin={handleAddAdmin}
                  onDeleteAdmin={handleDeleteAdmin}
                  currentAdminEmail={loggedInAdminEmail}
                />
              )}
            </div>
          </main>

        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {role === 'external' ? (
            <CatalogView 
              assets={assets} 
              onPlaceBid={handlePlaceBid} 
            />
          ) : (
            <div className="py-24 text-center max-w-md mx-auto space-y-4">
              <Shield className="w-16 h-16 text-blue-500 mx-auto" />
              <h2 className="text-xl font-bold text-slate-800">{t('Otorisasi Diperlukan')}</h2>
              <p className="text-sm text-slate-500 leading-normal">
                {t('Halaman internal manajemen Pancaran Lelang dilindungi enkripsi. Silakan masuk menggunakan akun kredensial Anda.')}
              </p>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all"
              >
                {t('Masuk Sekarang')}
              </button>
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="relative overflow-hidden text-xs" id="main-application-footer">
        {/* Top Dark Section */}
        <div 
          className="text-slate-300 pt-12 pb-2 relative bg-cover bg-center bg-slate-950"
          style={{ 
            backgroundImage: "linear-gradient(to bottom, rgba(15, 23, 42, 0.96), rgba(3, 7, 18, 0.98)), url('https://lh3.googleusercontent.com/d/1mhiKxfRXG4nzn8A5TRCDVd4WUZCiZ388')" 
          }}
        >
          {/* Soft ambient glowing accents */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none"></div>
          
          {/* Glow Top Border Line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
              
              {/* Column 1: Brand & Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center shadow overflow-hidden">
                    <img 
                      src="https://lh3.googleusercontent.com/d/1LmpjB5qAX8ev5_JRzYQDwjM58RxHl18X" 
                      alt="Pancaran Logo" 
                      className="w-full h-full object-contain p-0.5"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = "https://drive.google.com/uc?export=download&id=1LmpjB5qAX8ev5_JRzYQDwjM58RxHl18X";
                      }}
                    />
                  </div>
                  <span className="text-white font-bold text-lg tracking-tight">
                    Pancaran <span className="text-blue-400 font-extrabold drop-shadow-[0_0_10px_rgba(96,165,250,0.25)]">Lelang</span>
                  </span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                  {t('Portal resmi likuidasi armada aktif dan alat berat dari ekosistem operasional Pancaran Group. Transparan, tepercaya, dan terintegrasi.')}
                </p>
              </div>

              {/* Column 2: COMPANY INFO */}
              <div className="space-y-4">
                <h3 className="text-white font-bold tracking-wider text-sm uppercase flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-blue-500 rounded-sm shadow-sm shadow-blue-500/50"></span>
                  {t('COMPANY INFO')}
                </h3>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 drop-shadow-[0_0_4px_rgba(96,165,250,0.3)]" />
                  <div className="space-y-1">
                    <p className="text-white font-semibold text-xs">{t('Our Office')}</p>
                    <p className="text-slate-400 text-xs font-medium">{t('Head Office 1 :')}</p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Jl. Tanah Merdeka No 20A Kalibaru Cilincing Jakarta Utara
                    </p>
                  </div>
                </div>
              </div>

              {/* Column 3: Contact Info & Pools */}
              <div className="space-y-4">
                <h3 className="text-white font-bold tracking-wider text-sm uppercase flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-blue-500 rounded-sm shadow-sm shadow-blue-500/50"></span>
                  {t('HUBUNGI KAMI')}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 drop-shadow-[0_0_4px_rgba(96,165,250,0.3)]" />
                    <div className="space-y-0.5">
                      <p className="text-white font-mono font-semibold text-xs">sales@pancaran-group.co.id</p>
                      <p className="text-slate-400 text-[11px] font-medium">(Inland & Logistic Services)</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{t('Lokasi Pool Inspeksi:')}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-950/60 px-3 py-1 rounded-lg text-[10px] font-bold text-blue-300 border border-blue-800/50 shadow-sm shadow-blue-500/10">{t('Cilincing')}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Wavy transition section (Combines Slate and Multiple Light Blue waves) */}
        <div className="w-full relative select-none pointer-events-none -mt-1 bg-slate-950">
          <svg 
            viewBox="0 0 1440 200" 
            className="w-full h-auto block"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            {/* Wave 1: Background dark transition to blend seamlessly */}
            <path 
              d="M0 0 L1440 0 L1440 80 Q1080 30 720 100 T0 50 Z" 
              fill="#030712" /* slate-950 */
            />
            {/* Wave 2: Cyan / Blue-300 semi-transparent */}
            <path 
              d="M0 40 Q360 120 720 50 T1440 100 L1440 200 L0 200 Z" 
              fill="#7dd3fc" /* sky-300 */
              opacity="0.3" 
            />
            {/* Wave 3: Light blue / Sky-200 */}
            <path 
              d="M0 65 Q360 145 720 75 T1440 130 L1440 200 L0 200 Z" 
              fill="#bae6fd" /* sky-200 */
              opacity="0.6" 
            />
            {/* Wave 4: Beautiful Soft Light Blue base */}
            <path 
              d="M0 95 Q360 170 720 105 T1440 160 L1440 200 L0 200 Z" 
              fill="#e0f2fe" /* sky-100 */
              opacity="0.9" 
            />
            {/* Wave 5: Clean white / light-sky-50 floor */}
            <path 
              d="M0 120 Q360 190 720 130 T1440 180 L1440 200 L0 200 Z" 
              fill="#f0f9ff" /* sky-5 */
            />
          </svg>

          {/* Floating animated ambient sparkles on the wave */}
          <div className="absolute right-[8%] bottom-[45%] w-2.5 h-2.5 bg-sky-200 rounded-full opacity-60 blur-[0.5px] animate-pulse"></div>
          <div className="absolute right-[15%] bottom-[60%] w-2 h-2 bg-blue-300 rounded-full opacity-45 blur-[0.5px] animate-pulse"></div>
          <div className="absolute right-[22%] bottom-[35%] w-1.5 h-1.5 bg-white rounded-full opacity-70"></div>
          <div className="absolute left-[12%] bottom-[40%] w-2 h-2 bg-sky-300 rounded-full opacity-40 blur-[1px]"></div>
        </div>

        {/* Bottom Copyright Section - Rendered on Light Sky Blue floor */}
        <div className="bg-[#f0f9ff] text-slate-600 py-6 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-medium">
              <p className="text-slate-500">
                © 2026 Pancaran Lelang Group - PT Pancaran Darma Logistics. {t('Hak Cipta Dilindungi')}.
              </p>
              <div className="flex gap-4">
                <span className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer font-bold">{t('Syarat & Ketentuan')}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer font-bold">{t('Kebijakan Privasi')}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess} 
        admins={admins}
      />

    </div>
  );
}
