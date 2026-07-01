import React, { useState, useEffect } from 'react';
import { Asset, Bid } from '../types';
import { 
  Truck, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp, 
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface AdminDashboardProps {
  assets: Asset[];
  onSelectAsset: (assetId: string) => void;
}

export default function AdminDashboard({ assets, onSelectAsset }: AdminDashboardProps) {
  const { t, language } = useLanguage();
  const [surveyFilter, setSurveyFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Metric calculations
  const totalAssets = assets.length;
  const totalSold = assets.filter(a => a.status === 'Sold').length;
  const totalOpen = assets.filter(a => a.status === 'Open').length;

  // Highest price calculation (from starting prices or bids)
  const maxPrice = assets.reduce((max, asset) => {
    const highestVal = Math.max(asset.startingPrice, asset.highestBid, ...asset.bids.map(b => b.price));
    return highestVal > max ? highestVal : max;
  }, 0);

  // Total unique bidders based on emails/names across all bids
  const uniqueBidders = new Set<string>();
  assets.forEach(asset => {
    asset.bids.forEach(bid => {
      uniqueBidders.add(bid.email.toLowerCase());
    });
  });
  const totalBidders = uniqueBidders.size;

  // 2. Total assets per brand calculations
  const brandCounts: { [key: string]: number } = {};
  assets.forEach(asset => {
    brandCounts[asset.brand] = (brandCounts[asset.brand] || 0) + 1;
  });

  const brandData = Object.entries(brandCounts).map(([brand, count]) => ({
    brand,
    count,
    percentage: Math.round((count / totalAssets) * 100)
  })).sort((a, b) => b.count - a.count);

  // 3. Extract all scheduled surveys
  interface SurveyItem {
    assetId: string;
    assetName: string;
    bidderName: string;
    bidderContact: string;
    bidderEmail: string;
    date: string;
    time: string;
    bidPrice: number;
  }

  const allSurveys: SurveyItem[] = [];
  assets.forEach(asset => {
    asset.bids.forEach(bid => {
      if (bid.scheduleSurveyDate) {
        allSurveys.push({
          assetId: asset.id,
          assetName: asset.name,
          bidderName: bid.name,
          bidderContact: bid.contact,
          bidderEmail: bid.email,
          date: bid.scheduleSurveyDate,
          time: bid.scheduleSurveyTime || 'N/A',
          bidPrice: bid.price
        });
      }
    });
  });

  // Sort surveys by date/time ascending
  const sortedSurveys = allSurveys.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time === 'N/A' ? '00:00' : a.time}`);
    const dateB = new Date(`${b.date}T${b.time === 'N/A' ? '00:00' : b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Filter surveys
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredSurveys = sortedSurveys.filter(survey => {
    // Apply search query
    const matchesSearch = 
      survey.bidderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      survey.assetName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch && searchQuery) return false;

    if (surveyFilter === 'upcoming') {
      return survey.date >= todayStr;
    } else if (surveyFilter === 'past') {
      return survey.date < todayStr;
    }
    return true;
  });

  // Format currency
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="admin-dashboard-container">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('Dashboard Pancaran Lelang')}</h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base">
            {t('Halo Admin, kelola aset lelang komersial, pantau penawaran harga, dan atur survei fisik dalam satu portal terpadu.')}
          </p>
        </div>
        <div className="bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700 text-xs md:text-sm font-mono self-stretch md:self-auto text-center md:text-left flex flex-col justify-center">
          <p className="text-slate-400">{t('Waktu Sistem (WIB)')}</p>
          <p className="font-semibold text-white mt-1">
            {currentTime.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-blue-400 font-bold mt-1 text-base md:text-lg tracking-wider">
            {currentTime.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-metric-grid">
        {/* Total Asset */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('Total Asset')}</span>
            <p className="text-2xl font-bold text-slate-800">{totalAssets}</p>
            <span className="text-xs text-blue-600 font-medium">{t('Unit di Database')}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Total Sold */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('Aset Terjual')}</span>
            <p className="text-2xl font-bold text-emerald-600">{totalSold}</p>
            <span className="text-xs text-emerald-600 font-medium">
              {totalAssets > 0 ? Math.round((totalSold / totalAssets) * 100) : 0}% {t('Sukses Lelang')}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Open */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('Aset Aktif')}</span>
            <p className="text-2xl font-bold text-blue-600">{totalOpen}</p>
            <span className="text-xs text-blue-600 font-medium">{t('Menerima Penawaran')}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Bidder */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('Total Bidder')}</span>
            <p className="text-2xl font-bold text-slate-800">{totalBidders}</p>
            <span className="text-xs text-purple-600 font-medium">{t('Partisipan Unik')}</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Layout - Charts & Survey */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Brand Distribution Chart (Left/2-cols on desktop) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 lg:col-span-1" id="brand-distribution-section">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{t('Total Aset per Brand')}</h2>
            <p className="text-xs text-slate-500 mt-1">{t('Porsi distribusi armada lelang Pancaran Logistics berdasarkan merek manufaktur.')}</p>
          </div>

          <div className="space-y-4">
            {brandData.map((item) => (
              <div key={item.brand} className="space-y-2">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-700">{item.brand}</span>
                  <span className="text-slate-500">{item.count} {t('Unit')} <span className="text-slate-400">({item.percentage}%)</span></span>
                </div>
                {/* Horizontal Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      item.brand === 'Hino' ? 'bg-blue-600' :
                      item.brand === 'Isuzu' ? 'bg-cyan-500' :
                      item.brand === 'Fuso' ? 'bg-amber-500' :
                      item.brand === 'Scania' ? 'bg-rose-500' :
                      'bg-slate-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}

            {brandData.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                {t('Belum ada data armada/brand tersedia.')}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
            <span>{t('Per 2026. Semua aset fisik di pool internal.')}</span>
          </div>
        </div>

        {/* Schedule Survey (Right/2-cols on desktop) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 lg:col-span-2" id="schedule-survey-section">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> {t('Jadwal Survei Fisik')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">{t('Daftar booking kunjungan calon pembeli untuk inspeksi fisik kendaraan.')}</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg self-stretch sm:self-auto">
              <button
                onClick={() => setSurveyFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  surveyFilter === 'all' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('Semua')}
              </button>
              <button
                onClick={() => setSurveyFilter('upcoming')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  surveyFilter === 'upcoming' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('Mendatang')}
              </button>
              <button
                onClick={() => setSurveyFilter('past')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  surveyFilter === 'past' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('Riwayat')}
              </button>
            </div>
          </div>

          {/* Search bar inside surveys */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={t('Cari nama bidder, brand, atau armada...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Survey List */}
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {filteredSurveys.map((survey, index) => {
              const isUpcoming = survey.date >= todayStr;
              return (
                <div 
                  key={`${survey.assetId}-${survey.bidderEmail}-${index}`}
                  className="p-4 rounded-xl border border-slate-100 hover:border-blue-100 bg-slate-50/50 hover:bg-white transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                        {survey.assetId}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isUpcoming ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isUpcoming ? t('Mendatang') : t('Selesai')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm">{survey.assetName}</h3>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                      <span>{t('Bidder')}: <strong className="text-slate-700">{survey.bidderName}</strong> ({survey.bidderContact})</span>
                      <span>Email: <strong className="text-slate-700">{survey.bidderEmail}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-2 md:pt-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{survey.date} @ {survey.time} WIB</span>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-3 w-full">
                      <span className="text-xs text-slate-500 font-medium">Bidding: {formatIDR(survey.bidPrice)}</span>
                      <button 
                        onClick={() => onSelectAsset(survey.assetId)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-all"
                      >
                        {t('Lihat Aset')} <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredSurveys.length === 0 && (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
                {t('Tidak ada jadwal survei fisik ditemukan.')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
