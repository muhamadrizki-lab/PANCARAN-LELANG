import React, { useState, useEffect } from 'react';
import { Asset, AssetStatus, Bid } from '../types';
import { useLanguage } from './LanguageContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Check, 
  X, 
  ExternalLink,
  Calendar,
  DollarSign,
  Tag,
  AlertTriangle,
  FileText,
  MapPin,
  Clock,
  Sparkles,
  Upload,
  Trophy,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface AdminAssetsProps {
  assets: Asset[];
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string | null) => void;
  onAddAsset: (newAsset: Omit<Asset, 'id' | 'bids' | 'highestBid'>) => void;
  onUpdateAsset: (assetId: string, updatedAsset: Partial<Asset>) => void;
  onUpdateAssetStatus: (assetId: string, status: AssetStatus) => void;
  onDeleteAsset: (assetId: string) => void;
}

const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string); // Fallback to original base64 if context is not available
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get compressed base64 string
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error('Gagal memuat gambar untuk kompresi.'));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Gagal membaca file gambar.'));
    };
    reader.readAsDataURL(file);
  });
};

const VEHICLE_TEMPLATES = [
  { name: 'Hino Wingbox Heavy-Duty', brand: 'Hino', category: 'Wingbox', url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80' },
  { name: 'Isuzu Giga Box Besi', brand: 'Isuzu', category: 'Box Truck', url: 'https://images.unsplash.com/photo-1516576885502-d5334430e52b?auto=format&fit=crop&w=800&q=80' },
  { name: 'Fuso Colt Dump Truck', brand: 'Fuso', category: 'Dump Truck', url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80' },
  { name: 'Scania Premium Head Container', brand: 'Scania', category: 'Trailer Head', url: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a44?auto=format&fit=crop&w=800&q=80' },
  { name: 'Toyota Hilux Single Cabin', brand: 'Toyota', category: 'Pickup', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80' },
  { name: 'Caterpillar Forklift Diesel', brand: 'Caterpillar', category: 'Forklift', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80' },
];


export default function AdminAssets({
  assets,
  selectedAssetId,
  onSelectAsset,
  onAddAsset,
  onUpdateAsset,
  onUpdateAssetStatus,
  onDeleteAsset
}: AdminAssetsProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'Open' | 'Sold'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editAssetId, setEditAssetId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [detailImageIdx, setDetailImageIdx] = useState(0);

  // States for fullscreen image lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setIsZoomed(false);
  }, [lightboxIndex]);

  useEffect(() => {
    setDetailImageIdx(0);
  }, [selectedAssetId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight' && lightboxIndex !== null && lightboxImages.length > 1) {
        setLightboxIndex(prev => (prev === null ? null : (prev === lightboxImages.length - 1 ? 0 : prev + 1)));
      } else if (e.key === 'ArrowLeft' && lightboxIndex !== null && lightboxImages.length > 1) {
        setLightboxIndex(prev => (prev === null ? null : (prev === 0 ? lightboxImages.length - 1 : prev - 1)));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, lightboxImages]);

  useEffect(() => {
    if (!isFormOpen) {
      setIsFormFocused(false);
    }
  }, [isFormOpen]);

  const [formData, setFormData] = useState({
    name: '',
    brand: 'Hino',
    category: 'Wingbox',
    modelYear: 2022,
    plateNumber: '',
    condition: 'Baik' as Asset['condition'],
    location: '',
    description: '',
    startingPrice: '',
    imageUrl: '',
    imageUrls: [] as string[]
  });

  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isFormOpen && descriptionRef.current) {
      descriptionRef.current.style.height = 'auto';
      descriptionRef.current.style.height = `${Math.max(descriptionRef.current.scrollHeight, 100)}px`;
    }
  }, [formData.description, isFormOpen]);

  const openNewAssetForm = () => {
    setEditAssetId(null);
    setFormData({
      name: '',
      brand: 'Hino',
      category: 'Wingbox',
      modelYear: 2022,
      plateNumber: '',
      condition: 'Baik',
      location: '',
      description: '',
      startingPrice: '',
      imageUrl: '',
      imageUrls: []
    });
    setIsFormOpen(true);
  };

  const handleEditClick = (asset: Asset) => {
    setEditAssetId(asset.id);
    const resolvedUrls = asset.imageUrls && asset.imageUrls.length > 0 
      ? asset.imageUrls 
      : (asset.imageUrl ? [asset.imageUrl] : []);
    setFormData({
      name: asset.name,
      brand: asset.brand,
      category: asset.category,
      modelYear: asset.modelYear,
      plateNumber: asset.plateNumber === 'N/A' ? '' : asset.plateNumber,
      condition: asset.condition,
      location: asset.location,
      description: asset.description,
      startingPrice: String(asset.startingPrice),
      imageUrl: asset.imageUrl || (resolvedUrls[0] || ''),
      imageUrls: resolvedUrls
    });
    setIsFormOpen(true);
  };

  const handleFilesChange = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    
    const newImageUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        alert('Hanya file gambar yang diperbolehkan.');
        continue;
      }
      
      try {
        const compressedBase64 = await compressImage(file, 800, 600, 0.75);
        newImageUrls.push(compressedBase64);
      } catch (err) {
        console.error('Gagal mengompresi gambar:', err);
        // Fallback
        const readerStr = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || '');
          reader.readAsDataURL(file);
        });
        if (readerStr) {
          newImageUrls.push(readerStr);
        }
      }
    }

    if (newImageUrls.length > 0) {
      setFormData(prev => {
        const currentUrls = prev.imageUrls || [];
        const merged = [...currentUrls, ...newImageUrls];
        return {
          ...prev,
          imageUrls: merged,
          imageUrl: merged[0] || prev.imageUrl
        };
      });
    }
  };

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  // Filter logic
  const filteredAssets = assets.filter(asset => {
    const matchesTab = activeTab === 'all' || asset.status === activeTab;
    const matchesBrand = brandFilter === 'all' || asset.brand === brandFilter;
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesBrand && matchesSearch;
  });

  // Unique brands for filter
  const uniqueBrands = Array.from(new Set(assets.map(a => a.brand)));

  const handleTemplateClick = (template: typeof VEHICLE_TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      name: `${template.name} - New`,
      brand: template.brand,
      category: template.category,
      imageUrl: template.url,
      imageUrls: [template.url]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startingPrice || !formData.location) {
      alert('Mohon lengkapi data nama, harga awal, dan lokasi.');
      return;
    }

    const resolvedUrls = formData.imageUrls && formData.imageUrls.length > 0
      ? formData.imageUrls
      : (formData.imageUrl ? [formData.imageUrl] : []);

    const assetData = {
      name: formData.name,
      brand: formData.brand,
      category: formData.category,
      modelYear: Number(formData.modelYear),
      plateNumber: formData.plateNumber || 'N/A',
      condition: formData.condition,
      location: formData.location,
      description: formData.description || 'Tidak ada deskripsi tambahan.',
      startingPrice: Number(formData.startingPrice),
      imageUrl: formData.imageUrl || (resolvedUrls[0] || ''),
      imageUrls: resolvedUrls
    };

    if (editAssetId) {
      onUpdateAsset(editAssetId, assetData);
      setEditAssetId(null);
    } else {
      onAddAsset({
        ...assetData,
        status: 'Open'
      });
    }

    // Reset Form
    setFormData({
      name: '',
      brand: 'Hino',
      category: 'Wingbox',
      modelYear: 2022,
      plateNumber: '',
      condition: 'Baik',
      location: '',
      description: '',
      startingPrice: '',
      imageUrl: '',
      imageUrls: []
    });
    setIsFormOpen(false);
  };

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumberWithDots = (numStr: string) => {
    const clean = numStr.replace(/\D/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('id-ID').format(Number(clean));
  };

  return (
    <div className="space-y-8 animate-fade-in" id="admin-assets-view">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t('Kelola Aset Lelang')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('Daftarkan armada logistik baru, pantau status lelang, dan verifikasi riwayat penawaran.')}</p>
        </div>
        <button
          onClick={openNewAssetForm}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm shadow-blue-600/10 hover:shadow-blue-600/20 active:scale-95 transition-all self-stretch sm:self-auto"
          id="btn-add-new-asset"
        >
          <Plus className="w-5 h-5" />
          <span>{t('Tambah Aset Baru')}</span>
        </button>
      </div>

      {/* Main Assets Grid & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Table & Filters (2-cols on desktop if details open, otherwise full width?) 
            Actually, let's keep it beautifully split or dynamic! If an asset is selected, let's show list on 2 columns and details on 1 column. If nothing selected, show list on 3 columns.
        */}
        <div className={`space-y-6 transition-all duration-300 ${selectedAssetId ? 'lg:col-span-2' : 'lg:col-span-3'}`} id="assets-list-container">
          
          {/* Filters & Search Row */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            
            {/* Search and Brand Filter */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('Cari berdasarkan nama aset, plat, kategori...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="flex gap-3">
                <div className="relative flex-shrink-0 min-w-[130px]">
                  <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-slate-700"
                  >
                    <option value="all">{t('Semua Brand')}</option>
                    {uniqueBrands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <Filter className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex border-b border-slate-100 pt-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'all'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('Semua Aset')} ({assets.length})
              </button>
              <button
                onClick={() => setActiveTab('Open')}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'Open'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('Aktif / Open')} ({assets.filter(a => a.status === 'Open').length})
              </button>
              <button
                onClick={() => setActiveTab('Sold')}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'Sold'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('Terjual / Sold')} ({assets.filter(a => a.status === 'Sold').length})
              </button>
            </div>

          </div>

          {/* Cards List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredAssets.map((asset) => {
              const isSelected = asset.id === selectedAssetId;
              const highestOffer = asset.bids.length > 0 ? Math.max(...asset.bids.map(b => b.price)) : asset.startingPrice;
              
              return (
                <div
                  key={asset.id}
                  onClick={() => onSelectAsset(isSelected ? null : asset.id)}
                  className={`cursor-pointer group relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                    isSelected 
                      ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-lg' 
                      : 'border-slate-200 hover:border-blue-200 hover:shadow-md'
                  }`}
                >
                  {/* Visual Status Tag on Image */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img 
                      src={asset.imageUrl} 
                      alt={asset.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="text-[10px] font-mono font-bold bg-white/90 backdrop-blur text-slate-800 px-2.5 py-1 rounded-lg shadow-sm border border-slate-200">
                        {asset.id}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${
                        asset.status === 'Open' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {asset.status === 'Open' ? t('Menerima Bid') : t('Terjual')}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] text-white font-semibold flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {asset.brand} • {asset.category}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-2">
                        {asset.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <span>{t('Tahun')} {asset.modelYear}</span>
                        <span>•</span>
                        <span>{t('Plat')}: {asset.plateNumber}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{t('Harga Awal')}</p>
                        <p className="text-sm font-semibold text-slate-500">{formatIDR(asset.startingPrice)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-blue-500 font-bold uppercase">{t('Penawaran Tertinggi')}</p>
                        <p className="text-base font-bold text-blue-700">{formatIDR(highestOffer)}</p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-medium bg-slate-50 -mx-5 -mb-5 px-5 py-3 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        {asset.bids.length} {t('Penawaran')}
                      </span>
                      <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-0.5">
                        {t('Lihat Detail')} <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAssets.length === 0 && (
              <div className="col-span-full py-16 bg-white border border-dashed border-slate-200 rounded-3xl text-center space-y-3">
                <p className="text-slate-400 font-medium">{t('Tidak ada aset lelang yang cocok dengan kriteria pencarian.')}</p>
                <button 
                  onClick={() => { setSearchQuery(''); setBrandFilter('all'); setActiveTab('all'); }} 
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  {t('Reset Semua Filter')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detail Drawer / Panel (Shown if an asset is selected) */}
        {selectedAsset && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-6 lg:col-span-1 sticky top-6 animate-slide-in" id="asset-detail-drawer">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {selectedAsset.id}
                </span>
                <h2 className="text-lg font-bold text-slate-800 mt-1">{t('Detail Spesifikasi')}</h2>
              </div>
              <button
                onClick={() => onSelectAsset(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                title={t('Tutup Detail')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Asset quick status switcher */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-200">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">{t('Status Lelang Saat Ini:')}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  selectedAsset.status === 'Open' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {selectedAsset.status === 'Open' ? t('Menerima Bid') : t('Terjual')}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateAssetStatus(selectedAsset.id, 'Open')}
                  disabled={selectedAsset.status === 'Open'}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    selectedAsset.status === 'Open' 
                      ? 'bg-blue-600 text-white cursor-not-allowed' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> {t('Buka Bid')}
                </button>
                <button
                  onClick={() => onUpdateAssetStatus(selectedAsset.id, 'Sold')}
                  disabled={selectedAsset.status === 'Sold'}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    selectedAsset.status === 'Sold' 
                      ? 'bg-emerald-600 text-white cursor-not-allowed' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" /> {t('Set Terjual')}
                </button>
              </div>
            </div>

            {/* Winner Section for Sold Units */}
            {selectedAsset.status === 'Sold' && (() => {
              const winnerBid = selectedAsset.bids.length > 0
                ? [...selectedAsset.bids].sort((a, b) => b.price - a.price)[0]
                : null;
              return (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4.5 space-y-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                    <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t('Pemenang Lelang')}</span>
                  </div>
                  {winnerBid ? (
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center border-b border-emerald-100/70 pb-2">
                        <span className="text-emerald-600 font-medium">{t('Pemenang')}:</span>
                        <span className="font-bold text-emerald-900 text-sm">{winnerBid.name}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-emerald-100/70 pb-2">
                        <span className="text-emerald-600 font-medium">{t('Penawaran Pemenang')}:</span>
                        <span className="font-bold text-emerald-900 font-mono text-sm">{formatIDR(winnerBid.price)}</span>
                      </div>
                      <div className="space-y-1 pt-1 text-slate-700 bg-white/50 p-2.5 rounded-xl border border-emerald-100/30">
                        <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-1.5">{t('Kontak Pemenang')}</p>
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 font-medium">
                            <span className="text-slate-400">📱</span> {winnerBid.contact}
                          </p>
                          <p className="flex items-center gap-1.5 font-medium">
                            <span className="text-slate-400">✉️</span> {winnerBid.email}
                          </p>
                        </div>
                        {winnerBid.scheduleSurveyDate && (
                          <div className="text-[10px] text-emerald-800 bg-emerald-100/70 px-2.5 py-1.5 rounded-lg mt-2 font-semibold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{t('Jadwal Survei')}: {winnerBid.scheduleSurveyDate} @ {winnerBid.scheduleSurveyTime || 'N/A'} WIB</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-white/40 p-3 rounded-xl border border-dashed border-slate-200 text-center">
                      {t('Belum ada penawar')}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Spec Details */}
            <div className="space-y-4 text-sm">
              {/* Image Carousel / Gallery */}
              <div className="space-y-2">
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 relative group/detail">
                  <img 
                    src={selectedAsset.imageUrls && selectedAsset.imageUrls.length > 0 ? selectedAsset.imageUrls[detailImageIdx] : selectedAsset.imageUrl} 
                    alt={`${selectedAsset.name} - ${detailImageIdx + 1}`} 
                    className="w-full h-full object-cover cursor-zoom-in transition-all duration-300 hover:scale-102" 
                    referrerPolicy="no-referrer"
                    onClick={() => {
                      const imgs = selectedAsset.imageUrls && selectedAsset.imageUrls.length > 0 
                        ? selectedAsset.imageUrls 
                        : [selectedAsset.imageUrl];
                      setLightboxImages(imgs);
                      setLightboxIndex(detailImageIdx);
                    }}
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  
                  {/* Prev/Next Overlay buttons */}
                  {selectedAsset.imageUrls && selectedAsset.imageUrls.length > 1 && (
                    <>
                      <button
                        onClick={() => setDetailImageIdx(prev => (prev === 0 ? selectedAsset.imageUrls!.length - 1 : prev - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-all opacity-0 group-hover/detail:opacity-100 flex items-center justify-center w-6 h-6 text-xs font-bold"
                        title={t('Sebelumnya')}
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => setDetailImageIdx(prev => (prev === selectedAsset.imageUrls!.length - 1 ? 0 : prev + 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-all opacity-0 group-hover/detail:opacity-100 flex items-center justify-center w-6 h-6 text-xs font-bold"
                        title={t('Berikutnya')}
                      >
                        ▶
                      </button>
                      
                      {/* Image position label */}
                      <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                        {detailImageIdx + 1} / {selectedAsset.imageUrls.length}
                      </span>
                    </>
                  )}
                </div>

                {/* Thumbnails list */}
                {selectedAsset.imageUrls && selectedAsset.imageUrls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {selectedAsset.imageUrls.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setDetailImageIdx(idx)}
                        className={`w-14 h-10 rounded-lg overflow-hidden border shrink-0 transition-all ${idx === detailImageIdx ? 'border-blue-600 ring-2 ring-blue-500/15' : 'border-slate-200 opacity-60 hover:opacity-100'}`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-base">{selectedAsset.name}</h3>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{selectedAsset.brand} • {selectedAsset.category}</p>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2 border-t border-slate-50">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">{t('PLAT NOMOR')}</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedAsset.plateNumber}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">{t('TAHUN PRODUKSI')}</span>
                  <span className="font-semibold text-slate-800">{selectedAsset.modelYear}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">{t('KONDISI FISIK')}</span>
                  <span className="font-semibold text-slate-800">{t(selectedAsset.condition)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">{t('LOKASI SEEDING')}</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-0.5 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={selectedAsset.location}>{selectedAsset.location}</span>
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-50">
                <span className="text-[11px] text-slate-400 font-bold block">{t('DESKRIPSI INTERNAL')}</span>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-h-24 overflow-y-auto">
                  {selectedAsset.description}
                </p>
              </div>
            </div>

            {/* Bids List ("list bid price" from flowchart) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                  <FileText className="w-4 h-4 text-blue-600" /> {t('Histori Penawaran')} ({selectedAsset.bids.length})
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">{t('Bids Tertinggi Pertama')}</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {selectedAsset.bids
                  .sort((a, b) => b.price - a.price)
                  .map((bid, i) => (
                    <div key={bid.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">{bid.name}</span>
                        <span className="font-mono font-bold text-blue-600">{formatIDR(bid.price)}</span>
                      </div>
                      <div className="text-slate-500 flex flex-col gap-0.5">
                        <span>{t('Hubungi')}: {bid.contact}</span>
                        <span>Email: {bid.email}</span>
                      </div>
                      
                      {/* Survey date if requested */}
                      {bid.scheduleSurveyDate && (
                        <div className="mt-1.5 pt-1.5 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px] font-semibold text-blue-600 bg-blue-50/50 px-2 py-1 rounded">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {t('Jadwal Survei')}:
                          </span>
                          <span>{bid.scheduleSurveyDate} @ {bid.scheduleSurveyTime || 'N/A'} WIB</span>
                        </div>
                      )}
                    </div>
                  ))}

                {selectedAsset.bids.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    {t('Belum ada penawaran harga masuk untuk aset ini.')}
                  </div>
                )}
              </div>
            </div>

            {/* Actions: Edit & Delete */}
            {selectedAsset.status !== 'Sold' && (
              deleteConfirmId === selectedAsset.id ? (
                <div className="pt-4 border-t border-rose-100 bg-rose-50/70 p-4 rounded-xl space-y-3 animate-fade-in">
                  <div className="flex gap-2 text-rose-800 text-xs font-semibold items-start">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-900">{t('Konfirmasi Hapus Unit')}</p>
                      <p className="text-rose-700 font-normal mt-1 leading-relaxed">
                        {t('Apakah Anda yakin ingin menghapus {name} secara permanen? Data historis penawaran juga akan ikut terhapus.').replace('{name}', selectedAsset.name)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 bg-white hover:bg-slate-100 text-slate-700 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 transition-colors"
                    >
                      {t('Batal')}
                    </button>
                    <button
                      onClick={() => {
                        onDeleteAsset(selectedAsset.id);
                        setDeleteConfirmId(null);
                      }}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-lg text-[11px] font-bold shadow-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t('Ya, Hapus')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => handleEditClick(selectedAsset)}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-blue-200 transition-colors"
                  >
                    <FileText className="w-4 h-4" /> {t('Edit Unit Aset')}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(selectedAsset.id)}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> {t('Hapus Unit Aset')}
                  </button>
                </div>
              )
            )}

          </div>
        )}

      </div>

      {/* Input Asset Modal/Dialog Form */}
      {isFormOpen && (
        <div className={`fixed inset-0 transition-all duration-300 z-50 flex items-center justify-center p-4 ${
          isFormFocused ? 'bg-slate-950/92 backdrop-blur-md' : 'bg-slate-900/60 backdrop-blur-sm'
        }`}>
          <div className={`bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col transition-all duration-300 ${
            isFormFocused ? 'ring-4 ring-blue-500/10' : ''
          }`}>
            
            {/* Modal Header */}
            <div className={`p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 transition-all duration-300 ${
              isFormFocused ? 'opacity-30 blur-[0.5px] pointer-events-none' : ''
            }`}>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editAssetId ? `${t('Ubah Detail Unit')}: ${editAssetId}` : t('Daftarkan Aset Lelang Baru')}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {editAssetId ? t('Perbarui spesifikasi teknis dan kelengkapan dokumen kendaraan lelang.') : t('Lengkapi spesifikasi teknis dan detail dokumen kendaraan di bawah.')}
                </p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form 
              onSubmit={handleSubmit}
              onFocusCapture={() => setIsFormFocused(true)}
              onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsFormFocused(false);
                }
              }}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">{t('Nama Kendaraan / Aset')} *</label>
                  <input
                    type="text"
                    required
                    placeholder={t('Contoh: Fuso Ranger FL Wingbox 2022')}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Brand */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">{t('Merek (Brand) *')}</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Hino">Hino</option>
                    <option value="Isuzu">Isuzu</option>
                    <option value="Fuso">Fuso</option>
                    <option value="Scania">Scania</option>
                    <option value="Toyota">Toyota</option>
                    <option value="Caterpillar">Caterpillar</option>
                    <option value="Komatsu">Komatsu</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">{t('Kategori Unit *')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Wingbox">Wingbox Truck</option>
                    <option value="Box Truck">Box Truck</option>
                    <option value="Dump Truck">Dump Truck</option>
                    <option value="Trailer Head">Trailer Head</option>
                    <option value="Pickup">Pickup Operational</option>
                    <option value="Forklift">Forklift / Warehouse</option>
                    <option value="Container">Container Body</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Model Year */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">{t('Tahun Produksi *')}</label>
                  <input
                    type="number"
                    min="1990"
                    max="2027"
                    required
                    value={formData.modelYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, modelYear: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Plate Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">{t('No. Registrasi / Plat Nomor')}</label>
                  <input
                    type="text"
                    placeholder={t('Contoh: B 9912 PXT (kosongkan jika alat berat)')}
                    value={formData.plateNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, plateNumber: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-mono"
                  />
                </div>

                {/* Condition */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">{t('Kondisi Fisik Unit *')}</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value as Asset['condition'] }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Sangat Baik">{t('Sangat Baik')} ({t('Siap Jalan & Bebas Masalah')})</option>
                    <option value="Baik">{t('Baik')} ({t('Mesin Bagus, Lecet Halus')})</option>
                    <option value="Cukup">{t('Cukup')} ({t('Butuh Perawatan Ringan')})</option>
                    <option value="Butuh Perbaikan">{t('Butuh Perbaikan')} ({t('Overhaul/Sasis/Body')})</option>
                  </select>
                </div>

                {/* Starting Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">{t('Harga Awal Lelang (IDR) *')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder={t('Contoh: 150.000.000')}
                    value={formatNumberWithDots(formData.startingPrice)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({ ...prev, startingPrice: raw }));
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">{t('Lokasi Pool / Depo Unit *')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('Contoh: Pool Marunda Blok C, Jakut')}
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Image Upload Component */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{t('Foto / Gambar Unit * (Bisa Unggah Banyak)')}</label>
                
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) handleFilesChange(files);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50/50 animate-pulse' 
                      : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/50'
                  }`}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) handleFilesChange(files);
                    }}
                  />
                  
                  <div className="py-2 space-y-2">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{t('Pilih atau Seret Foto-Foto Armada')}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{t('Mendukung format PNG, JPG, JPEG (Bisa pilih banyak sekaligus, Max 5MB per file)')}</p>
                    </div>
                  </div>
                </div>

                {/* List of uploaded images with custom preview and delete/cover buttons */}
                {formData.imageUrls && formData.imageUrls.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('Koleksi Foto Terunggah ({count})').replace('{count}', String(formData.imageUrls.length))}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formData.imageUrls.map((url, idx) => {
                        const isCover = url === formData.imageUrl;
                        return (
                          <div key={idx} className={`relative group/img rounded-xl overflow-hidden border bg-slate-50 flex flex-col justify-between ${isCover ? 'border-blue-500 ring-2 ring-blue-500/15' : 'border-slate-200'}`}>
                            <div className="aspect-video w-full relative overflow-hidden">
                              <img 
                                src={url} 
                                alt={`Preview ${idx + 1}`} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80";
                                }}
                              />
                              {isCover && (
                                <span className="absolute top-1 left-1 bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                                  {t('Cover Utama')}
                                </span>
                              )}
                              
                              {/* Overlay actions on hover */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData(prev => ({
                                      ...prev,
                                      imageUrl: url
                                    }));
                                  }}
                                  className="bg-white hover:bg-blue-600 hover:text-white text-slate-800 text-[9px] font-bold px-2 py-1 rounded shadow-md transition-all active:scale-95"
                                  title={t('Jadikan Cover Utama')}
                                >
                                  Cover
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData(prev => {
                                      const filtered = (prev.imageUrls || []).filter((_, i) => i !== idx);
                                      return {
                                        ...prev,
                                        imageUrls: filtered,
                                        imageUrl: prev.imageUrl === url ? (filtered[0] || '') : prev.imageUrl
                                      };
                                    });
                                  }}
                                  className="bg-rose-500 hover:bg-rose-600 text-white p-1 rounded shadow-md transition-all active:scale-95 flex items-center justify-center"
                                  title={t('Hapus gambar')}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="p-1 bg-white border-t border-slate-100 text-[10px] text-slate-500 text-center font-mono truncate">
                              {t('Foto')} {idx + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Fallback URL Option */}
                <div className="pt-1">
                  <details className="group">
                    <summary className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer select-none flex items-center gap-1">
                      <span className="transition-transform group-open:rotate-90">▶</span>
                      {t('Tambah Foto via Tautan Gambar (URL)')}
                    </summary>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="url"
                        id="url-photo-input"
                        placeholder={t('Masukkan link gambar (https://...)')}
                        className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              setFormData(prev => {
                                const list = [...(prev.imageUrls || []), val];
                                return {
                                  ...prev,
                                  imageUrls: list,
                                  imageUrl: prev.imageUrl || val
                                };
                              });
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('url-photo-input') as HTMLInputElement;
                          const val = input?.value.trim();
                          if (val) {
                            setFormData(prev => {
                              const list = [...(prev.imageUrls || []), val];
                              return {
                                ...prev,
                                imageUrls: list,
                                imageUrl: prev.imageUrl || val
                              };
                            });
                            if (input) input.value = '';
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-xl font-bold"
                      >
                        {t('Tambah')}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {t('Ketik atau tempel tautan gambar, lalu tekan tombol "Tambah" atau Enter untuk memasukkan ke galeri unit lelang ini.')}
                    </p>
                  </details>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">{t('Deskripsi & Spesifikasi Tambahan')}</label>
                <textarea
                  ref={descriptionRef}
                  rows={4}
                  placeholder={t('Jelaskan kondisi mesin, transmisi, kelengkapan surat KIR/STNK, riwayat perawatan, dsb.')}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[100px] resize-none overflow-hidden"
                />
              </div>

              {/* Modal Footer actions */}
              <div className="border-t border-slate-100 pt-5 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {t('Batal')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/10 hover:shadow-blue-600/20 transition-all flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> {editAssetId ? t('Simpan Perubahan') : t('Simpan Unit Baru')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Immersive Fullscreen Lightbox Zoom Overlay */}
      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <div 
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 md:p-8 select-none animate-fade-in"
          id="image-lightbox-overlay"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Controls Bar */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-[110]">
            {/* Zoom Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(prev => !prev);
              }}
              className="bg-slate-900/80 hover:bg-slate-800 text-white p-2.5 rounded-full border border-slate-800 hover:border-slate-700 hover:scale-105 transition-all shadow-xl flex items-center justify-center cursor-pointer"
              title={isZoomed ? t('Zoom Out') : t('Zoom In')}
            >
              {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>

            {/* Close button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="bg-slate-900/80 hover:bg-slate-800 text-white p-2.5 rounded-full border border-slate-800 hover:border-slate-700 hover:scale-105 transition-all shadow-xl flex items-center justify-center cursor-pointer"
              title={t('Tutup')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Prev button */}
          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(prev => (prev === null ? 0 : (prev === 0 ? lightboxImages.length - 1 : prev - 1)));
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-800 text-white p-3 rounded-full border border-slate-800 hover:border-slate-700 hover:scale-105 transition-all shadow-xl z-[110] flex items-center justify-center w-12 h-12 cursor-pointer"
              title={t('Sebelumnya')}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next button */}
          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(prev => (prev === null ? 0 : (prev === lightboxImages.length - 1 ? 0 : prev + 1)));
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-800 text-white p-3 rounded-full border border-slate-800 hover:border-slate-700 hover:scale-105 transition-all shadow-xl z-[110] flex items-center justify-center w-12 h-12 cursor-pointer"
              title={t('Berikutnya')}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image Container with Smooth Animation & Zoom Scroll Support */}
          <div 
            className={`relative w-full max-w-6xl max-h-[85vh] flex items-center justify-center animate-zoom-in transition-all duration-300 ${
              isZoomed ? "overflow-auto cursor-zoom-out p-4 justify-start items-start bg-slate-950/40 rounded-2xl border border-slate-900" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (isZoomed) {
                setIsZoomed(false);
              }
            }}
          >
            <img
              src={lightboxImages[lightboxIndex]}
              alt={`Zoomed Asset - ${lightboxIndex + 1}`}
              className={`select-none transition-all duration-300 ${
                isZoomed 
                  ? "w-[200%] md:w-[150%] max-w-none max-h-none object-contain cursor-zoom-out rounded-lg shadow-2xl" 
                  : "w-full max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-800 cursor-zoom-in hover:scale-[1.01]"
              }`}
              referrerPolicy="no-referrer"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(prev => !prev);
              }}
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80";
              }}
            />
          </div>

          {/* Position indicator & Close hint */}
          <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
            {lightboxImages.length > 1 && (
              <span className="text-xs text-slate-300 font-mono font-bold bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
                {lightboxIndex + 1} / {lightboxImages.length}
              </span>
            )}
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">
              {isZoomed 
                ? t('Klik gambar untuk memperkecil • Geser untuk menjelajah detail') 
                : t('Klik gambar untuk memperbesar • Klik di luar untuk kembali')}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
