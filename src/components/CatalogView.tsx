import React, { useState, useEffect, useRef } from 'react';
import { Asset, Bid } from '../types';
import { useLanguage } from './LanguageContext';
import { 
  Search, 
  Filter, 
  Tag, 
  MapPin, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Truck,
  ArrowUpRight,
  ShieldAlert,
  Info,
  CalendarCheck,
  User,
  Mail,
  Phone,
  DollarSign,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface CatalogViewProps {
  assets: Asset[];
  onPlaceBid: (assetId: string, bidData: Omit<Bid, 'id' | 'timestamp'>) => void;
}

interface CatalogCardProps {
  key?: string | number;
  asset: Asset;
  onSelectAsset: (assetId: string) => void;
  formatIDR: (value: number) => string;
}

function CatalogCard({ asset, onSelectAsset, formatIDR }: CatalogCardProps) {
  const { t } = useLanguage();
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const images = asset.imageUrls && asset.imageUrls.length > 0
    ? asset.imageUrls
    : (asset.imageUrl ? [asset.imageUrl] : []);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIdx(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIdx(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const hasBids = asset.bids.length > 0;
  const highestOffer = hasBids ? Math.max(...asset.bids.map(b => b.price)) : asset.startingPrice;

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-blue-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
      <div className="relative h-48 bg-slate-50 overflow-hidden group/img-container">
        <img 
          src={images[activeImgIdx]} 
          alt={`${asset.name} - ${activeImgIdx + 1}`} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" 
          referrerPolicy="no-referrer"
          onClick={() => onSelectAsset(asset.id)}
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80";
          }}
        />

        {/* Navigation arrows overlay */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 group-hover/img-container:opacity-100 z-10 text-xs font-bold"
              title={t('Gambar Sebelumnya')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 group-hover/img-container:opacity-100 z-10 text-xs font-bold"
              title={t('Gambar Berikutnya')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dotted indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-full">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImgIdx(idx);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeImgIdx ? 'bg-white scale-125' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Floating Info */}
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[9px] font-mono font-bold bg-white/95 backdrop-blur-sm text-slate-800 px-2 py-1 rounded-md shadow-sm border border-slate-200">
            {asset.id}
          </span>
        </div>

        <div className="absolute top-3 right-3 z-10">
          <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
            {t('Terbuka')}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg z-10">
          {asset.brand} • {asset.category}
        </div>
      </div>

      {/* Info Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-blue-700 transition-colors">
            {asset.name}
          </h3>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {asset.location.split(',')[1] || asset.location}
            </span>
            <span>•</span>
            <span>{t('Kondisi')}: <strong>{t(asset.condition)}</strong></span>
            <span>•</span>
            <span>{t('Th')}: <strong>{asset.modelYear}</strong></span>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
            {asset.description}
          </p>
        </div>

        {/* Price Status */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">{t('Harga Pembuka')}</span>
            <p className="text-xs font-semibold text-slate-500">{formatIDR(asset.startingPrice)}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-blue-600 font-bold uppercase flex items-center justify-end gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {t('Penawaran Tertinggi')}
            </span>
            <p className="text-base font-bold text-slate-900">{formatIDR(highestOffer)}</p>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="flex items-center justify-between text-xs font-semibold pt-1">
          <span className="text-slate-500 font-medium">
            {asset.bids.length} {t('Penawaran Masuk')}
          </span>
          <button
            onClick={() => onSelectAsset(asset.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 group-hover:shadow-md shadow-blue-500/10"
          >
            {t('Tawar Aset')} <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CatalogView({ assets, onPlaceBid }: CatalogViewProps) {
  const { t } = useLanguage();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedAssetId) {
      setTimeout(() => {
        const element = document.getElementById('bidding-survey-panel');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Focus the input field
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 150);
    }
  }, [selectedAssetId]);

  // Bid form state
  const [bidForm, setBidForm] = useState({
    name: '',
    email: '',
    contact: '',
    price: '',
    requestSurvey: false,
    surveyDate: '',
    surveyTime: '09:00'
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);

  // States for modal image carousel and fullscreen lightbox
  const [modalImageIdx, setModalImageIdx] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setIsZoomed(false);
  }, [lightboxIndex]);

  useEffect(() => {
    setModalImageIdx(0);
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

  // We only show "Open" assets in the public catalog
  const openAssets = assets.filter(a => a.status === 'Open');

  // Filter logic
  const filteredAssets = openAssets.filter(asset => {
    const matchesBrand = selectedBrand === 'all' || asset.brand === selectedBrand;
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesBrand && matchesCategory && matchesSearch;
  });

  const uniqueBrands = Array.from(new Set(openAssets.map(a => a.brand)));
  const uniqueCategories = Array.from(new Set(openAssets.map(a => a.category)));

  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const currentHighestBid = selectedAsset 
    ? (selectedAsset.bids.length > 0 ? Math.max(...selectedAsset.bids.map(b => b.price)) : selectedAsset.startingPrice)
    : 0;

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

  const isTimeBooked = (time: string, date: string) => {
    if (!date) return false;
    return assets.some(asset => 
      asset.bids.some(b => 
        b.scheduleSurveyDate === date && 
        b.scheduleSurveyTime === time
      )
    );
  };

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    setFormError('');
    setFormSuccess(false);
    
    // Default bid price suggested is highest bid + 5,000,000 IDR
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      const highest = asset.bids.length > 0 ? Math.max(...asset.bids.map(b => b.price)) : asset.startingPrice;
      setBidForm({
        name: '',
        email: '',
        contact: '',
        price: '0',
        requestSurvey: false,
        surveyDate: '',
        surveyTime: '09:00'
      });
    }
  };

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    if (!selectedAssetId || !selectedAsset) return;

    const bidPriceNum = Number(bidForm.price);

    // 1. Validation
    if (!bidForm.name || !bidForm.email || !bidForm.contact || !bidForm.price) {
      setFormError(t('Mohon lengkapi semua data penawaran Anda.'));
      return;
    }

    if (bidPriceNum <= currentHighestBid) {
      setFormError(`${t('Harga penawaran Anda harus lebih tinggi dari penawaran tertinggi saat ini')} (${formatIDR(currentHighestBid)}).`);
      return;
    }

    // Survey Validation if checked
    if (bidForm.requestSurvey) {
      if (!bidForm.surveyDate) {
        setFormError(t('Mohon tentukan tanggal rencana survei fisik.'));
        return;
      }
      if (isTimeBooked(bidForm.surveyTime, bidForm.surveyDate)) {
        setFormError(t('Jadwal survei pada tanggal dan jam tersebut sudah di-booking oleh calon pembeli lain. Mohon pilih waktu atau hari lain.'));
        return;
      }
    }

    // 2. Submit
    onPlaceBid(selectedAssetId, {
      name: bidForm.name,
      email: bidForm.email,
      contact: bidForm.contact,
      price: bidPriceNum,
      scheduleSurveyDate: bidForm.requestSurvey ? bidForm.surveyDate : undefined,
      scheduleSurveyTime: bidForm.requestSurvey ? bidForm.surveyTime : undefined,
    });

    setFormSuccess(true);
    setFormError('');

    // Reset bid form fields but keep values for success display
    setTimeout(() => {
      setSelectedAssetId(null);
      setFormSuccess(false);
    }, 4500);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="public-catalog-container">
      

      {/* Premium Hero Banner for Public Bidders */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white p-8 md:p-12 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8 md:h-[305px] min-h-[305px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/50 via-slate-950 to-slate-950 opacity-90 z-0"></div>
        
        {/* Banner Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-55 md:opacity-40 z-0"
          style={{ 
            backgroundImage: "url('https://lh3.googleusercontent.com/d/1ZKGlebZp5PDwYSnvPXBLyjqRT3bo929R')" 
          }}
        ></div>

        <div className="space-y-4 md:max-w-2xl z-10 relative">
          <span className="text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-300 font-bold px-3 py-1.5 rounded-full border border-blue-500/30">
            {t('Portal Penawaran Umum (External)')}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            {t('Pancaran Lelang')} <br/>
            <span className="bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
              {t('Likuidasi Armada Logistik & Heavy Equipment')}
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            {t('Dapatkan truk tangki, wingbox, trailer, cargo van, dan alat berat kualitas terbaik langsung dari ekosistem operasional Pancaran Logistics. Transparan, terpercaya, dan aman dengan jadwal survei fisik mandiri.')}
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> {t('KIR & STNK Lengkap')}
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <CalendarCheck className="w-4 h-4 text-blue-400" /> {t('Bebas Atur Waktu Inspeksi')}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 max-w-xs text-center z-10 relative">
          <Truck className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-slate-100">{t('Bagaimana Cara Kerja?')}</h3>
          <p className="text-slate-400 text-xs mt-1.5 leading-normal">
            {t('Pilih armada aktif di bawah, ajukan penawaran harga Anda, dan pilih waktu survei fisik untuk memeriksa kondisi mesin langsung di Pool kami sebelum lelang ditutup.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Public Catalog Grid */}
        <div className="space-y-6 lg:col-span-3" id="public-catalog-catalog-col">
          
          {/* Public Filters Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{t('Katalog Armada Tersedia')} ({filteredAssets.length})</h2>
              <p className="text-xs text-slate-500 mt-0.5">{t('Semua armada di bawah siap dilepas dengan penawaran harga terbaik.')}</p>
            </div>

            {/* Quick Filter Controls */}
            <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-52 md:flex-initial">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('Cari armada...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                />
              </div>

              {/* Brand Select */}
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">{t('Semua Brand')}</option>
                {uniqueBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              {/* Category Select */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">{t('Semua Kategori')}</option>
                {uniqueCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Catalog Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <CatalogCard
                key={asset.id}
                asset={asset}
                onSelectAsset={handleSelectAsset}
                formatIDR={formatIDR}
              />
            ))}

            {filteredAssets.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl space-y-3">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-slate-400 font-semibold text-sm">{t('Tidak ada armada lelang yang terdaftar atau sesuai filter.')}</p>
                <button 
                  onClick={() => { setSelectedBrand('all'); setSelectedCategory('all'); setSearchQuery(''); }}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  {t('Lihat Semua Koleksi')}
                </button>
              </div>
            )}
          </div>
        </div>

      {/* Right Side Overlay: Bid Input and Survey Scheduler ("input bid price" and "input time survey") */}
      {selectedAsset && (
        <div 
          className={`fixed inset-0 transition-all duration-300 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto ${
            isFormFocused ? 'bg-slate-950/92 backdrop-blur-md' : 'bg-slate-950/70 backdrop-blur-xs'
          }`}
          id="bidding-modal-overlay"
          onClick={() => setSelectedAssetId(null)}
        >
          <div 
            className={`bg-white rounded-3xl border border-slate-200 shadow-2xl space-y-6 w-full max-w-xl overflow-y-auto relative animate-zoom-in my-auto max-h-[95vh] focus:outline-none transition-all duration-300 ${
              isFormFocused ? 'ring-4 ring-blue-500/10' : ''
            }`} 
            id="bidding-survey-panel"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Panel Header */}
            <div className={`flex justify-between items-start border-b border-slate-100 p-6 pb-4 sticky top-0 bg-white z-20 transition-all duration-300 ${
              isFormFocused ? 'opacity-30 blur-[0.5px] scale-[0.98] pointer-events-none' : ''
            }`}>
              <div>
                <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100 uppercase">
                  {t('AJUKAN TAWAran')}
                </span>
                <h2 className="text-base font-bold text-slate-800 mt-2 line-clamp-1">{selectedAsset.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedAssetId(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                title={t('Tutup Panel')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
 
            <div className="px-6 pb-6 space-y-6">
              
              {/* Image Carousel / Gallery */}
              {selectedAsset && (() => {
                const detailImages = selectedAsset.imageUrls && selectedAsset.imageUrls.length > 0 
                  ? selectedAsset.imageUrls 
                  : (selectedAsset.imageUrl ? [selectedAsset.imageUrl] : []);
                return detailImages.length > 0 ? (
                  <div className={`space-y-2 transition-all duration-300 ${
                    isFormFocused ? 'opacity-30 blur-[0.5px] scale-[0.98] pointer-events-none' : ''
                  }`}>
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-50 relative group/modal-img border border-slate-200 shadow-xs">
                      <img 
                        src={detailImages[modalImageIdx] || "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80"} 
                        alt={`${selectedAsset.name} - ${modalImageIdx + 1}`} 
                        className="w-full h-full object-cover cursor-zoom-in hover:scale-102 transition-transform duration-300" 
                        referrerPolicy="no-referrer"
                        onClick={() => {
                          setLightboxImages(detailImages);
                          setLightboxIndex(modalImageIdx);
                        }}
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      
                      {/* Prev/Next Overlay buttons */}
                      {detailImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalImageIdx(prev => (prev === 0 ? detailImages.length - 1 : prev - 1));
                            }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-all opacity-0 group-hover/modal-img:opacity-100 flex items-center justify-center w-7 h-7 text-xs font-bold animate-fade-in"
                            title={t('Sebelumnya')}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalImageIdx(prev => (prev === detailImages.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-all opacity-0 group-hover/modal-img:opacity-100 flex items-center justify-center w-7 h-7 text-xs font-bold animate-fade-in"
                            title={t('Berikutnya')}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          
                          {/* Image position label */}
                          <span className="absolute bottom-2.5 right-2.5 bg-black/65 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded-md font-mono font-semibold">
                            {modalImageIdx + 1} / {detailImages.length}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}
              
              {/* Price Alert Rules */}
              <div className={`bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-2 text-xs transition-all duration-300 ${
                isFormFocused ? 'opacity-30 blur-[0.5px] scale-[0.98] pointer-events-none' : ''
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('Harga Awal:')}</span>
                  <span className="font-semibold text-slate-700">{formatIDR(selectedAsset.startingPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-blue-900 bg-blue-100/40 p-2 rounded-xl border border-blue-100 font-bold">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> {t('Bid Tertinggi:')}
                  </span>
                  <span>{formatIDR(currentHighestBid)}</span>
                </div>
              </div>
 
              {/* Detail & Spesifikasi Aset */}
              <div className={`p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3 transition-all duration-300 ${
                isFormFocused ? 'opacity-30 blur-[0.5px] scale-[0.98] pointer-events-none' : ''
              }`}>
                <h3 className="font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <Info className="w-4 h-4 text-blue-600" /> {t('Spesifikasi & Deskripsi Aset')}
                </h3>
                <p className="text-slate-600 leading-relaxed italic bg-white p-2.5 rounded-xl border border-slate-100">
                  "{selectedAsset.description}"
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-600 pt-1">
                  <div><span className="text-slate-400">{t('Brand:')}</span> <strong className="text-slate-700">{selectedAsset.brand}</strong></div>
                  <div><span className="text-slate-400">{t('Kategori:')}</span> <strong className="text-slate-700">{selectedAsset.category}</strong></div>
                  <div><span className="text-slate-400">{t('Tahun:')}</span> <strong className="text-slate-700">{selectedAsset.modelYear}</strong></div>
                  <div><span className="text-slate-400">{t('No. Polisi:')}</span> <strong className="text-slate-700 font-mono">{selectedAsset.plateNumber}</strong></div>
                  <div><span className="text-slate-400">{t('Kondisi:')}</span> <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">{t(selectedAsset.condition)}</span></div>
                  <div><span className="text-slate-400">{t('Lokasi:')}</span> <strong className="text-slate-700">{selectedAsset.location.split(',')[0]}</strong></div>
                </div>
              </div>
 
              {/* Bidding & Survey Form */}
              {!formSuccess ? (
                <form 
                  onSubmit={handleBidSubmit}
                  onFocusCapture={() => setIsFormFocused(true)}
                  onBlurCapture={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setIsFormFocused(false);
                    }
                  }}
                  className={`space-y-4 p-4 rounded-2xl transition-all duration-300 ${
                    isFormFocused 
                      ? 'bg-blue-50/20 ring-2 ring-blue-500/20 shadow-md border border-blue-500/10' 
                      : 'border border-transparent'
                  }`}
                >
                  
                  {formError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold flex items-start gap-2 animate-shake">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">{t('Nama Lengkap Anda *')}</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        ref={nameInputRef}
                        required
                        placeholder={t('Contoh: PT Samudera Transport')}
                        value={bidForm.name}
                        onChange={(e) => setBidForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">{t('Alamat Email Kontak *')}</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="name@company.co.id"
                        value={bidForm.email}
                        onChange={(e) => setBidForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Contact (Phone) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">{t('No. Handphone / WhatsApp *')}</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        required
                        placeholder={t('Contoh: 0812XXXXXXXX')}
                        value={bidForm.contact}
                        onChange={(e) => setBidForm(prev => ({ ...prev, contact: e.target.value }))}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Bid Price ("input bid price" from flowchart) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">{t('Harga Bid Anda (IDR) *')}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-xs text-slate-400">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        placeholder={formatNumberWithDots(String(currentHighestBid + 5000000))}
                        value={formatNumberWithDots(bidForm.price)}
                        onChange={(e) => {
                          let raw = e.target.value.replace(/\D/g, '');
                          if (raw.length > 1 && raw.startsWith('0')) {
                            raw = raw.replace(/^0+/, '');
                          }
                          setBidForm(prev => ({ ...prev, price: raw }));
                        }}
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">{t('Minimal harga bid:')} <strong className="text-slate-600">{formatIDR(currentHighestBid + 1000000)}</strong></p>
                  </div>

                  {/* Request Survey Toggle ("input time survey" from flowchart) */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={bidForm.requestSurvey}
                        onChange={(e) => setBidForm(prev => ({ ...prev, requestSurvey: e.target.checked }))}
                        className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-slate-800">{t('Booking Jadwal Survei Fisik')}</p>
                        <p className="text-slate-400 text-[10px]">{t('Ingin cek kondisi mesin langsung di Pool?')}</p>
                      </div>
                    </label>
                  </div>

                  {/* Survey Scheduler Details (Visible ONLY if requestSurvey is checked) */}
                  {bidForm.requestSurvey && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5 animate-slide-in">
                      <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                        <CalendarCheck className="w-4 h-4 text-blue-600" /> {t('Tentukan Waktu Kunjungan Pool')}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{t('Pilih Tanggal')}</label>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={bidForm.surveyDate}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              setBidForm(prev => {
                                let nextTime = prev.surveyTime;
                                if (isTimeBooked(nextTime, newDate)) {
                                  const slots = ["09:00", "11:00", "13:30", "15:30"];
                                  const available = slots.find(slot => !isTimeBooked(slot, newDate));
                                  if (available) {
                                    nextTime = available;
                                  }
                                }
                                return { ...prev, surveyDate: newDate, surveyTime: nextTime };
                              });
                            }}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                            required={bidForm.requestSurvey}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{t('Pilih Sesi Jam')}</label>
                          <select
                            value={bidForm.surveyTime}
                            onChange={(e) => setBidForm(prev => ({ ...prev, surveyTime: e.target.value }))}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-medium text-slate-800"
                          >
                            <option value="09:00" disabled={isTimeBooked("09:00", bidForm.surveyDate)}>
                              {t('Pagi Sesi 1 (09:00 WIB)')} {isTimeBooked("09:00", bidForm.surveyDate) ? ` (${t('Sudah Dibooking')})` : ''}
                            </option>
                            <option value="11:00" disabled={isTimeBooked("11:00", bidForm.surveyDate)}>
                              {t('Pagi Sesi 2 (11:00 WIB)')} {isTimeBooked("11:00", bidForm.surveyDate) ? ` (${t('Sudah Dibooking')})` : ''}
                            </option>
                            <option value="13:30" disabled={isTimeBooked("13:30", bidForm.surveyDate)}>
                              {t('Siang Sesi 1 (13:30 WIB)')} {isTimeBooked("13:30", bidForm.surveyDate) ? ` (${t('Sudah Dibooking')})` : ''}
                            </option>
                            <option value="15:30" disabled={isTimeBooked("15:30", bidForm.surveyDate)}>
                              {t('Sore Sesi 2 (15:30 WIB)')} {isTimeBooked("15:30", bidForm.surveyDate) ? ` (${t('Sudah Dibooking')})` : ''}
                            </option>
                          </select>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-normal">
                        {t('Lokasi inspeksi:')} <strong className="text-slate-600">{selectedAsset.location}</strong>. {t('Tim teknis Pancaran Group akan mendampingi Anda di lokasi.')}
                      </p>
                    </div>
                  )}

                  {/* Submit Bid Button */}
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-xs font-bold shadow-md shadow-blue-500/15 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>{t('Kirim Penawaran & Booking')}</span>
                  </button>

                </form>
              ) : (
                // Success feedback panel
                <div className="py-8 text-center space-y-4 animate-fade-in" id="bid-success-panel">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-base">{t('Penawaran Berhasil Dikirim!')}</h3>
                    <p className="text-xs text-slate-500">{t('Harga penawaran Anda telah dicatat ke dalam sistem Pancaran.')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-left space-y-1.5 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('Armada:')}</span>
                      <span className="text-slate-800 font-bold">{selectedAsset.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('Harga Bid Anda:')}</span>
                      <span className="text-blue-700 font-bold">{formatIDR(Number(bidForm.price))}</span>
                    </div>
                    {bidForm.requestSurvey && (
                      <div className="flex justify-between border-t border-dashed border-slate-200 pt-1.5 mt-1.5 text-blue-700">
                        <span className="flex items-center gap-1 font-bold">
                          <Calendar className="w-3.5 h-3.5" /> {t('Jadwal Survei Fisik:')}
                        </span>
                        <span className="font-bold">{bidForm.surveyDate} @ {bidForm.surveyTime} WIB</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">{t('Halaman ini akan kembali ke katalog dalam beberapa detik...')}</p>
                </div>
              )}

              {/* General T&C notice */}
              <div className="pt-4 border-t border-slate-100 flex items-start gap-2 text-[10px] text-slate-400 leading-normal">
                <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {t('Dengan mengirimkan penawaran, Anda menyatakan tunduk pada Syarat & Ketentuan Umum Lelang Pancaran Logistics. Penawaran bersifat mengikat.')}
                </span>
              </div>

            </div>
          </div>
        </div>
      )}

      </div>

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
