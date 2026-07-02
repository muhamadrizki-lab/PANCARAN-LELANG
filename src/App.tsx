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
  X
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
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  
  // Selected asset for highlighting or detailed specs in AdminAssets
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Initialize data and hook up Firebase subscription
  useEffect(() => {
    // Seed default records if empty, then subscribe to collections in real-time
    seedDatabaseIfEmpty().then(() => {
      const unsubscribeAssets = subscribeToAssets((updatedAssets) => {
        // Keep descending ID order or keep order stable
        setAssets(updatedAssets.sort((a, b) => b.id.localeCompare(a.id)));
      });

      const unsubscribeAdmins = subscribeToAdmins((updatedAdmins) => {
        setAdmins(updatedAdmins);
      });

      return () => {
        unsubscribeAssets();
        unsubscribeAdmins();
      };
    });

    const storedSession = localStorage.getItem('pancaran_session_email');
    if (storedSession) {
      setIsAdminLoggedIn(true);
      setLoggedInAdminEmail(storedSession);
    }
  }, []);

  // 2. Business Actions (Admin Operations via Firestore)
  
  // Input Asset (Input Asset flow in Asset branch)
  const handleAddAsset = async (newAssetData: Omit<Asset, 'id' | 'bids' | 'highestBid'>) => {
    try {
      await addAssetToDb({
        ...newAssetData,
        highestBid: newAssetData.startingPrice,
        bids: []
      });
    } catch (error) {
      console.error("Gagal menambahkan aset ke Firebase:", error);
    }
  };

  // Update Asset (Edit specs/attributes)
  const handleUpdateAsset = async (assetId: string, updatedAsset: Partial<Asset>) => {
    try {
      await updateAssetInDb(assetId, updatedAsset);
    } catch (error) {
      console.error("Gagal memperbarui aset di Firebase:", error);
    }
  };

  // Update Asset Status (Open / Sold toggle)
  const handleUpdateAssetStatus = async (assetId: string, status: AssetStatus) => {
    try {
      await updateAssetInDb(assetId, { status });
    } catch (error) {
      console.error("Gagal memperbarui status aset di Firebase:", error);
    }
  };

  // Delete Asset
  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteAssetFromDb(assetId);
      setSelectedAssetId(null);
    } catch (error) {
      console.error("Gagal menghapus aset dari Firebase:", error);
    }
  };

  // Create Access / User Management (Create access flow)
  const handleAddAdmin = async (newAdmin: AdminUser) => {
    try {
      await addAdminToDb(newAdmin);
    } catch (error) {
      console.error("Gagal mendaftarkan admin baru di Firebase:", error);
    }
  };

  const handleDeleteAdmin = async (email: string) => {
    try {
      await deleteAdminFromDb(email);
    } catch (error) {
      console.error("Gagal menghapus admin dari Firebase:", error);
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

    try {
      await addBidToAsset(assetId, newBid);
    } catch (error) {
      console.error("Gagal menaruh bid baru di Firebase:", error);
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
      
      {/* Sleek, Sticky Header / Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md text-white" id="main-navigation-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo */}
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
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg tracking-tight">
                  Pancaran <span className="text-blue-400">{language === 'id' ? 'Lelang' : 'Auctions'}</span>
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
                    className={`pb-1 transition-all ${
                      role === 'external'
                        ? 'text-white border-b-2 border-blue-500 font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    id="tab-external-catalog"
                  >
                    {t('Katalog Eksternal')}
                  </button>
                  <button
                    onClick={() => {
                      if (isAdminLoggedIn) {
                        setRole('internal');
                      } else {
                        setIsLoginModalOpen(true);
                      }
                    }}
                    className={`pb-1 transition-all flex items-center gap-1.5 ${
                      role === 'internal'
                        ? 'text-white border-b-2 border-blue-500 font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    id="tab-internal-admin"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {t('Area Admin Internal')}
                  </button>
                </div>
              )}

              {/* Desktop Language Selector */}
              <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  onClick={() => setLanguage('id')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                    language === 'id' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ID
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                    language === 'en' 
                      ? 'bg-blue-600 text-white shadow' 
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
                      <p className="text-white text-xs font-semibold">{t('Admin Digital Solution')}</p>
                      <p className="text-slate-400 text-[10px] truncate max-w-[150px] font-mono">{loggedInAdminEmail}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700 font-bold uppercase text-xs">
                      {loggedInAdminEmail.slice(0, 2).toUpperCase()}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      title={t('Keluar')}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" /> {t('Login Admin')}
                  </button>
                )}
              </div>

            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              {/* Always visible mobile language switcher */}
              <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  onClick={() => setLanguage('id')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                    language === 'id' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ID
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                    language === 'en' 
                      ? 'bg-blue-600 text-white shadow' 
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
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400" id="main-application-footer">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Pancaran Lelang Group - PT Pancaran Darma Logistics. {t('Hak Cipta Dilindungi')}.</p>
          <div className="flex justify-center gap-4 mt-2 font-medium">
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">{t('Pool Marunda')}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">{t('Pool Cakung')}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">{t('Pool Teluk Gong')}</span>
            <span className="text-slate-300">|</span>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />

    </div>
  );
}
