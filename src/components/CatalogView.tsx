import React, { useState } from 'react';
import { Asset, Bid } from '../types';
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
  X
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
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          referrerPolicy="no-referrer"
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
              title="Gambar Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 group-hover/img-container:opacity-100 z-10 text-xs font-bold"
              title="Gambar Berikutnya"
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
            Terbuka
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
            <span>Kondisi: <strong>{asset.condition}</strong></span>
            <span>•</span>
            <span>Th: <strong>{asset.modelYear}</strong></span>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
            {asset.description}
          </p>
        </div>

        {/* Price Status */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Harga Pembuka</span>
            <p className="text-xs font-semibold text-slate-500">{formatIDR(asset.startingPrice)}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-blue-600 font-bold uppercase flex items-center justify-end gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Penawaran Tertinggi
            </span>
            <p className="text-base font-bold text-slate-900">{formatIDR(highestOffer)}</p>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="flex items-center justify-between text-xs font-semibold pt-1">
          <span className="text-slate-500 font-medium">
            {asset.bids.length} Penawaran Masuk
          </span>
          <button
            onClick={() => onSelectAsset(asset.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 group-hover:shadow-md shadow-blue-500/10"
          >
            Tawar Aset <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CatalogView({ assets, onPlaceBid }: CatalogViewProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Bid form state
  const [bidForm, setBidForm] = useState({
    name: '',
    email: '',
    contact: '',
    price: '',
    requestSurvey: false,
    surveyDate: '',
    surveyTime: '10:00'
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

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
        price: String(highest + 5000000),
        requestSurvey: false,
        surveyDate: '',
        surveyTime: '10:00'
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
      setFormError('Mohon lengkapi semua data penawaran Anda.');
      return;
    }

    if (bidPriceNum <= currentHighestBid) {
      setFormError(`Harga penawaran Anda harus lebih tinggi dari penawaran tertinggi saat ini (${formatIDR(currentHighestBid)}).`);
      return;
    }

    // Survey Validation if checked
    if (bidForm.requestSurvey && !bidForm.surveyDate) {
      setFormError('Mohon tentukan tanggal rencana survei fisik.');
      return;
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
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white p-8 md:p-12 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/50 via-slate-950 to-slate-950 opacity-90 z-0"></div>
        
        {/* Banner Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 z-0"
          style={{ 
            backgroundImage: "url('https://lh3.googleusercontent.com/d/10BOjcTy1DCyAZCZgj4gGWtiun32XCeFu')" 
          }}
        ></div>

        <div className="space-y-4 md:max-w-2xl z-10 relative">
          <span className="text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-300 font-bold px-3 py-1.5 rounded-full border border-blue-500/30">
            Portal Penawaran Umum (External)
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            Pancaran Lelang <br/>
            <span className="bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
              Likuidasi Armada Logistik & Heavy Equipment
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Dapatkan truk tangki, wingbox, trailer, cargo van, dan alat berat kualitas terbaik langsung dari ekosistem operasional Pancaran Logistics. Transparan, terpercaya, dan aman dengan jadwal survei fisik mandiri.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> KIR & STNK Lengkap
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <CalendarCheck className="w-4 h-4 text-blue-400" /> Bebas Atur Waktu Inspeksi
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 max-w-xs text-center z-10 relative">
          <Truck className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-slate-100">Bagaimana Cara Kerja?</h3>
          <p className="text-slate-400 text-xs mt-1.5 leading-normal">
            Pilih armada aktif di bawah, ajukan penawaran harga Anda, dan pilih waktu survei fisik untuk memeriksa kondisi mesin langsung di Pool kami sebelum lelang ditutup.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Public Catalog Grid (2-cols) or Full width if detail closed */}
        <div className={`space-y-6 ${selectedAssetId ? 'lg:col-span-2' : 'lg:col-span-3'}`} id="public-catalog-catalog-col">
          
          {/* Public Filters Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Katalog Armada Tersedia ({filteredAssets.length})</h2>
              <p className="text-xs text-slate-500 mt-0.5">Semua armada di bawah siap dilepas dengan penawaran harga terbaik.</p>
            </div>

            {/* Quick Filter Controls */}
            <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-52 md:flex-initial">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari armada..."
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
                <option value="all">Semua Brand</option>
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
                <option value="all">Semua Kategori</option>
                {uniqueCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Catalog Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="text-slate-400 font-semibold text-sm">Tidak ada armada lelang yang terdaftar atau sesuai filter.</p>
                <button 
                  onClick={() => { setSelectedBrand('all'); setSelectedCategory('all'); setSearchQuery(''); }}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  Lihat Semua Koleksi
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Bid Input and Survey Scheduler ("input bid price" and "input time survey") */}
        {selectedAsset && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6 lg:col-span-1 sticky top-6 animate-slide-in" id="bidding-survey-panel">
            
            {/* Panel Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100 uppercase">
                  AJUKAN TAWAran
                </span>
                <h2 className="text-base font-bold text-slate-800 mt-2 line-clamp-1">{selectedAsset.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedAssetId(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                title="Tutup Panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price Alert Rules */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Harga Awal:</span>
                <span className="font-semibold text-slate-700">{formatIDR(selectedAsset.startingPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-blue-900 bg-blue-100/40 p-2 rounded-xl border border-blue-100 font-bold">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Bid Tertinggi:
                </span>
                <span>{formatIDR(currentHighestBid)}</span>
              </div>
            </div>

            {/* Detail & Spesifikasi Aset */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
              <h3 className="font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <Info className="w-4 h-4 text-blue-600" /> Spesifikasi & Deskripsi Aset
              </h3>
              <p className="text-slate-600 leading-relaxed italic bg-white p-2.5 rounded-xl border border-slate-100">
                "{selectedAsset.description}"
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-600 pt-1">
                <div><span className="text-slate-400">Brand:</span> <strong className="text-slate-700">{selectedAsset.brand}</strong></div>
                <div><span className="text-slate-400">Kategori:</span> <strong className="text-slate-700">{selectedAsset.category}</strong></div>
                <div><span className="text-slate-400">Tahun:</span> <strong className="text-slate-700">{selectedAsset.modelYear}</strong></div>
                <div><span className="text-slate-400">No. Polisi:</span> <strong className="text-slate-700 font-mono">{selectedAsset.plateNumber}</strong></div>
                <div><span className="text-slate-400">Kondisi:</span> <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">{selectedAsset.condition}</span></div>
                <div><span className="text-slate-400">Lokasi:</span> <strong className="text-slate-700">{selectedAsset.location.split(',')[0]}</strong></div>
              </div>
            </div>

            {/* Bidding & Survey Form */}
            {!formSuccess ? (
              <form onSubmit={handleBidSubmit} className="space-y-4">
                
                {formError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Nama Lengkap Anda *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: PT Samudera Transport"
                      value={bidForm.name}
                      onChange={(e) => setBidForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Alamat Email Kontak *</label>
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
                  <label className="text-xs font-bold text-slate-600 uppercase">No. Handphone / WhatsApp *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 0812XXXXXXXX"
                      value={bidForm.contact}
                      onChange={(e) => setBidForm(prev => ({ ...prev, contact: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Bid Price ("input bid price" from flowchart) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Harga Bid Anda (IDR) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-xs text-slate-400">Rp</span>
                    <input
                      type="number"
                      required
                      placeholder={String(currentHighestBid + 5000000)}
                      value={bidForm.price}
                      onChange={(e) => setBidForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Minimal harga bid: <strong className="text-slate-600">{formatIDR(currentHighestBid + 1000000)}</strong></p>
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
                      <p className="font-bold text-slate-800">Booking Jadwal Survei Fisik</p>
                      <p className="text-slate-400 text-[10px]">Ingin cek kondisi mesin langsung di Pool?</p>
                    </div>
                  </label>
                </div>

                {/* Survey Scheduler Details (Visible ONLY if requestSurvey is checked) */}
                {bidForm.requestSurvey && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5 animate-slide-in">
                    <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                      <CalendarCheck className="w-4 h-4 text-blue-600" /> Tentukan Waktu Kunjungan Pool
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Pilih Tanggal</label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={bidForm.surveyDate}
                          onChange={(e) => setBidForm(prev => ({ ...prev, surveyDate: e.target.value }))}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                          required={bidForm.requestSurvey}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Pilih Sesi Jam</label>
                        <select
                          value={bidForm.surveyTime}
                          onChange={(e) => setBidForm(prev => ({ ...prev, surveyTime: e.target.value }))}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-medium"
                        >
                          <option value="09:00">Pagi Sesi 1 (09:00 WIB)</option>
                          <option value="11:00">Pagi Sesi 2 (11:00 WIB)</option>
                          <option value="13:30">Siang Sesi 1 (13:30 WIB)</option>
                          <option value="15:30">Sore Sesi 2 (15:30 WIB)</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal">
                      Lokasi inspeksi: <strong className="text-slate-600">{selectedAsset.location}</strong>. Tim teknis Pancaran Group akan mendampingi Anda di lokasi.
                    </p>
                  </div>
                )}

                {/* Submit Bid Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-xs font-bold shadow-md shadow-blue-500/15 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Kirim Penawaran & Booking</span>
                </button>

              </form>
            ) : (
              // Success feedback panel
              <div className="py-8 text-center space-y-4 animate-fade-in" id="bid-success-panel">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-base">Penawaran Berhasil Dikirim!</h3>
                  <p className="text-xs text-slate-500">Harga penawaran Anda telah dicatat ke dalam sistem Pancaran.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-left space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Armada:</span>
                    <span className="text-slate-800 font-bold">{selectedAsset.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Harga Bid Anda:</span>
                    <span className="text-blue-700 font-bold">{formatIDR(Number(bidForm.price))}</span>
                  </div>
                  {bidForm.requestSurvey && (
                    <div className="flex justify-between border-t border-dashed border-slate-200 pt-1.5 mt-1.5 text-blue-700">
                      <span className="flex items-center gap-1 font-bold">
                        <Calendar className="w-3.5 h-3.5" /> Jadwal Survei Fisik:
                      </span>
                      <span className="font-bold">{bidForm.surveyDate} @ {bidForm.surveyTime} WIB</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Halaman ini akan kembali ke katalog dalam beberapa detik...</p>
              </div>
            )}

            {/* General T&C notice */}
            <div className="pt-4 border-t border-slate-100 flex items-start gap-2 text-[10px] text-slate-400 leading-normal">
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Dengan mengirimkan penawaran, Anda menyatakan tunduk pada Syarat & Ketentuan Umum Lelang Pancaran Logistics. Penawaran bersifat mengikat.
              </span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
