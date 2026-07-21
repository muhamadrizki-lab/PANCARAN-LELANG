import React, { useState } from 'react';
import { Asset, Bid } from '../types';
import { useLanguage } from './LanguageContext';
import { 
  Bell, 
  Mail, 
  MailOpen, 
  Trophy, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Tag, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Printer, 
  Inbox, 
  ArrowLeft,
  Calendar,
  Lock,
  ExternalLink
} from 'lucide-react';

interface ExternalViewsProps {
  assets: Asset[];
  userEmail: string;
  userName: string;
  userPhone: string;
}

export function ExternalNotificationsView({ assets, userEmail }: ExternalViewsProps) {
  const { language, t } = useLanguage();

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const locale = language === 'en' ? 'en-US' : 'id-ID';
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  // Generate dynamic, real-time notifications for the logged-in user
  const generateNotifications = () => {
    const notificationsList: Array<{
      id: string;
      type: 'bid_success' | 'outbid' | 'won' | 'lost' | 'general';
      title: string;
      message: string;
      timestamp: string;
      assetId: string;
      assetName: string;
    }> = [];

    assets.forEach(asset => {
      const userBids = (asset.bids || []).filter(b => b.email.toLowerCase() === userEmail.toLowerCase());
      if (userBids.length === 0) return;

      // Sort user bids by price descending
      userBids.sort((a, b) => b.price - a.price);
      const userHighestBid = userBids[0];

      // Sort all bids on asset
      const allBidsSorted = [...asset.bids].sort((a, b) => b.price - a.price);
      const highestBid = allBidsSorted[0];

      // 1. Notification for bid placement success
      userBids.forEach(bid => {
        notificationsList.push({
          id: `notif-bid-${bid.id}`,
          type: 'bid_success',
          title: t('Penawaran Berhasil Diajukan'),
          message: t('Penawaran Anda sebesar {price} berhasil diajukan untuk {unit}.', {
            price: formatIDR(bid.price),
            unit: `${asset.brand} ${asset.name}`
          }),
          timestamp: bid.timestamp,
          assetId: asset.id,
          assetName: `${asset.brand} ${asset.name}`
        });
      });

      // 2. Outbid Notification
      if (asset.status === 'Open' && highestBid.email.toLowerCase() !== userEmail.toLowerCase() && userHighestBid.price < highestBid.price) {
        notificationsList.push({
          id: `notif-outbid-${asset.id}`,
          type: 'outbid',
          title: t('⚠️ Penawaran Terlampaui!'),
          message: t('Penawar lain telah mengajukan harga lebih tinggi yaitu {price} pada {unit}. Silakan tawar kembali untuk memenangkan lelang.', {
            price: formatIDR(highestBid.price),
            unit: `${asset.brand} ${asset.name}`
          }),
          timestamp: highestBid.timestamp,
          assetId: asset.id,
          assetName: `${asset.brand} ${asset.name}`
        });
      }

      // 3. Won / Lost Notification if asset is Sold
      if (asset.status === 'Sold') {
        const isWinner = highestBid.email.toLowerCase() === userEmail.toLowerCase();
        if (isWinner) {
          notificationsList.push({
            id: `notif-closed-won-${asset.id}`,
            type: 'won',
            title: t('🏆 Selamat, Anda Pemenang!'),
            message: t('Lelang ditutup. Anda memenangkan penawaran untuk {unit} dengan harga {price}. Surat resmi pemenang dikirim ke Inbox Anda.', {
              unit: `${asset.brand} ${asset.name}`,
              price: formatIDR(highestBid.price)
            }),
            timestamp: highestBid.timestamp, // closed close time approx
            assetId: asset.id,
            assetName: `${asset.brand} ${asset.name}`
          });
        } else {
          notificationsList.push({
            id: `notif-closed-lost-${asset.id}`,
            type: 'lost',
            title: t('Lelang Ditutup (Terjual)'),
            message: t('Unit {unit} telah terjual kepada penawar tertinggi lain. Terima kasih atas partisipasi Anda.', {
              unit: `${asset.brand} ${asset.name}`
            }),
            timestamp: highestBid.timestamp,
            assetId: asset.id,
            assetName: `${asset.brand} ${asset.name}`
          });
        }
      }
    });

    // Sort by timestamp descending
    return notificationsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const notifications = generateNotifications();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" id="external-notifications-container">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 border-l-[6px] border-l-blue-600 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <span>{t('Notifikasi Saya')} ({notifications.length})</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {t('Pantau riwayat penawaran, status outbid, dan pengumuman lelang Anda secara real-time.')}
        </p>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs flex items-start gap-4 transition-all hover:border-blue-200 hover:shadow-md ${
                notif.type === 'won' ? 'border-l-4 border-l-emerald-500 bg-emerald-50/10' :
                notif.type === 'outbid' ? 'border-l-4 border-l-amber-500 bg-amber-50/10' :
                'border-l-4 border-l-blue-500'
              }`}
            >
              <div className="mt-1 p-2 rounded-xl bg-slate-50 border border-slate-100">
                {notif.type === 'won' && <Trophy className="w-5 h-5 text-emerald-600" />}
                {notif.type === 'outbid' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {notif.type === 'bid_success' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                {notif.type === 'lost' && <Lock className="w-5 h-5 text-slate-400" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono font-medium flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatDate(notif.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {notif.message}
                </p>
                <div className="pt-1.5 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                  <span>{language === 'en' ? 'UNIT ID' : 'ID UNIT'}: <span className="font-mono text-slate-700 font-extrabold">{notif.assetId}</span></span>
                  <span>•</span>
                  <span>{notif.assetName}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white py-16 text-center border border-dashed border-slate-200 rounded-3xl space-y-3">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-400 font-semibold text-sm">{t('Belum ada notifikasi aktivitas lelang Anda.')}</p>
            <p className="text-xs text-slate-400">{t('Silakan lakukan penawaran pada katalog unit untuk memulai.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ExternalInboxView({ assets, userEmail, userName, userPhone }: ExternalViewsProps) {
  const { language, t } = useLanguage();
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Find all sold assets where the logged-in user is the winner (highest bidder)
  const getWinnerMails = () => {
    const mailsList: Array<{
      id: string;
      asset: Asset;
      highestBidPrice: number;
      subject: string;
      date: string;
    }> = [];

    assets.forEach(asset => {
      if (asset.status !== 'Sold') return;
      if (!asset.bids || asset.bids.length === 0) return;

      // Find highest bid on this sold asset
      const sortedBids = [...asset.bids].sort((a, b) => b.price - a.price);
      const winnerBid = sortedBids[0];

      if (winnerBid.email.toLowerCase() === userEmail.toLowerCase()) {
        mailsList.push({
          id: `mail-winner-${asset.id}`,
          asset: asset,
          highestBidPrice: winnerBid.price,
          subject: `[PANCARAN LELANG] Pengumuman Resmi Pemenang Lelang - Unit ${asset.id}`,
          date: winnerBid.timestamp
        });
      }
    });

    return mailsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const mails = getWinnerMails();
  const activeMail = mails.find(m => m.id === selectedMailId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in" id="external-inbox-container">
      
      {/* Inbox Welcome Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 border-l-[6px] border-l-blue-600 shadow-xs mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          <span>{language === 'en' ? 'Inbox' : 'Kotak Masuk / Inbox'} ({mails.length})</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {t('Surat resmi penunjukan pemenang lelang dikirim secara eksklusif ke email pemenang di sini.')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Mailbox List */}
        <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-4 ${selectedMailId ? 'hidden lg:block' : 'col-span-full'}`}>
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              {language === 'en' ? 'Inbox' : 'Kotak Masuk'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {mails.length > 0 ? (
              mails.map((mail) => (
                <button
                  key={mail.id}
                  onClick={() => setSelectedMailId(mail.id)}
                  className={`w-full text-left p-4 transition-all flex flex-col gap-1.5 ${
                    selectedMailId === mail.id 
                      ? 'bg-blue-50/70 border-l-4 border-l-blue-600' 
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      🏆 {language === 'en' ? 'WINNER' : 'PEMENANG'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(mail.date).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className={`text-xs truncate ${selectedMailId === mail.id ? 'font-black text-blue-800' : 'font-bold text-slate-800'}`}>
                      {mail.subject}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {language === 'en'
                        ? `Dear Mr/Mrs ${userName}, Congratulations! You have been selected as the official auction winner of Pancaran Logistics for unit ${mail.asset.brand} ${mail.asset.name}...`
                        : `Yth. Bapak/Ibu ${userName}, Selamat! Anda telah terpilih sebagai pemenang lelang resmi Pancaran Logistics untuk unit ${mail.asset.brand} ${mail.asset.name}...`}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-16 text-center text-slate-400 font-semibold text-xs space-y-2 flex flex-col items-center justify-center">
                <Mail className="w-8 h-8 text-slate-300" />
                <span>{language === 'en' ? 'No incoming emails.' : 'Tidak ada email masuk.'}</span>
                <span className="text-[10px] text-slate-400 font-normal px-6">
                  {t('Hanya pemenang lelang tertinggi yang akan menerima surat pengumuman pemenang di kotak masuk.')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Mail Reader */}
        <div className={`lg:col-span-8 ${!selectedMailId ? 'hidden lg:flex' : 'col-span-full'}`}>
          {activeMail ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex flex-col w-full animate-fade-in" id="printable-winner-letter">
              {/* Mail Reader Header */}
              <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedMailId(null)}
                    className="lg:hidden p-2 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-sm">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 truncate max-w-md">{activeMail.subject}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">{language === 'en' ? 'From' : 'Dari'}: <strong>Platinum</strong> &lt;noreply@pancaran-logistic.id&gt;</p>
                  </div>
                </div>

                <button 
                  onClick={handlePrint}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
                >
                  <Printer className="w-4 h-4" /> {language === 'en' ? 'Print / PDF' : 'Cetak / PDF'}
                </button>
              </div>

              {/* Official Email Letter Body */}
              <div className="p-6 md:p-10 space-y-8 max-h-[70vh] overflow-y-auto font-sans leading-relaxed text-slate-700 text-xs">
                
                {/* Pancaran Header Grid */}
                <div className="flex justify-between items-start border-b-2 border-blue-900/10 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow border border-slate-100 overflow-hidden">
                      <img 
                        src="https://lh3.googleusercontent.com/d/1LmpjB5qAX8ev5_JRzYQDwjM58RxHl18X" 
                        alt="Pancaran Logo" 
                        className="w-full h-full object-contain p-0.5"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <span className="text-blue-950 font-black text-base tracking-tight block">
                        PANCARAN LOGISTICS
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                        Member of Pancaran Group
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-mono font-bold uppercase">
                    <p>{language === 'en' ? 'AUCTION DECISION LETTER' : 'SURAT KEPUTUSAN LELANG'}</p>
                    <p className="text-slate-700 mt-1">NO: PL/WIN/{activeMail.asset.id}/{new Date(activeMail.date).getFullYear()}</p>
                  </div>
                </div>

                {/* Letter Content */}
                <div className="space-y-4">
                  <p className="font-semibold">{language === 'en' ? 'Jakarta,' : 'Jakarta,'} {new Date(activeMail.date).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  
                  <div className="space-y-0.5">
                    <p>{language === 'en' ? 'To Dear,' : 'Kepada Yth,'}</p>
                    <p className="font-black text-slate-900 text-sm">{userName}</p>
                    <p className="font-mono text-slate-500">{userEmail}</p>
                    {userPhone && <p className="text-slate-600 font-semibold">{userPhone}</p>}
                  </div>

                  <p className="text-justify leading-relaxed">
                    {language === 'en' ? (
                      <>
                        Dear Sir/Madam, <br/>
                        Based on the decision of the Platinum Liquidation Committee, we hereby officially state that you have been selected as the <strong>GRAND WINNER OF THE AUCTION</strong> for the unit below:
                      </>
                    ) : (
                      <>
                        Dengan hormat, <br/>
                        Berdasarkan hasil keputusan Panitia Likuidasi Platinum, dengan ini kami menyatakan secara resmi bahwa Anda telah terpilih sebagai <strong>PEMENANG UTAMA LELANG</strong> atas unit di bawah ini:
                      </>
                    )}
                  </p>

                  {/* Unit Specs Card */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-inner">
                    <h4 className="font-bold text-blue-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> {language === 'en' ? 'Selected Unit Specifications' : 'Spesifikasi Unit Terpilih'}
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3.5 gap-x-6 text-[11px] font-semibold">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">{language === 'en' ? 'Unit ID / Serial No' : 'ID Unit / No Seri'}</span>
                        <span className="text-slate-800 font-mono font-bold text-xs">{activeMail.asset.id}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">{language === 'en' ? 'Unit Name' : 'Nama Unit'}</span>
                        <span className="text-slate-800 font-bold text-xs">{activeMail.asset.brand} {activeMail.asset.name}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">{language === 'en' ? 'License Plate' : 'Nomor Polisi'}</span>
                        <span className="text-slate-800 font-mono font-bold text-xs uppercase">{activeMail.asset.plateNumber}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">{language === 'en' ? 'Year of Manufacture' : 'Tahun Pembuatan'}</span>
                        <span className="text-slate-800 font-bold text-xs">{activeMail.asset.modelYear}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">{language === 'en' ? 'Physical Condition' : 'Kondisi Fisik'}</span>
                        <span className="text-slate-800 font-bold text-xs">{activeMail.asset.condition}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">{language === 'en' ? 'Inspection Location' : 'Lokasi Inspeksi'}</span>
                        <span className="text-slate-800 font-bold text-xs">{activeMail.asset.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Winner Pricing Offer Card */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-4">
                    <h4 className="font-bold text-blue-950 text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b border-blue-100 pb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" /> {language === 'en' ? 'Approved Bid Value' : 'Nilai Penawaran Disetujui'}
                    </h4>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">{language === 'en' ? 'Highest Bid Price (Approved)' : 'Harga Penawaran Tertinggi (Disetujui)'}</span>
                        <span className="text-blue-900 font-black text-xl tracking-tight">{formatIDR(activeMail.highestBidPrice)}</span>
                      </div>
                      <div className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-lg shadow-sm uppercase border border-emerald-200">
                        {language === 'en' ? 'Valid Winner' : 'Pemenang Sah'}
                      </div>
                    </div>
                  </div>

                  {/* Next Step Procedure instructions */}
                  <div className="space-y-3.5 pt-2">
                    <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" /> {language === 'en' ? 'Payment & Handover Procedure:' : 'Prosedur Pelunasan & Serah Terima:'}
                    </h4>
                    
                    {language === 'en' ? (
                      <ul className="space-y-2 list-decimal list-inside text-slate-600 font-medium">
                        <li>
                          <strong>Administrative Payment:</strong> Please transfer the full unit payment to the official Pancaran Logistics bank account at the latest <strong>3x24 working hours</strong> after this decision letter is issued.
                        </li>
                        <li>
                          <strong>Document Verification:</strong> Our legal team will contact you via your registered telephone number <span className="text-slate-900 font-bold font-mono">{userPhone || 'registered'}</span> to coordinate the scheduling of signing the Deed of Sale and Purchase (AJB) and official receipt.
                        </li>
                        <li>
                          <strong>Physical Handover:</strong> Unit collection can be done at Cilincing Pool after payment has been verified by bringing your original ID card (KTP) and this proof of winning.
                        </li>
                      </ul>
                    ) : (
                      <ul className="space-y-2 list-decimal list-inside text-slate-600 font-medium">
                        <li>
                          <strong>Pembayaran Administrasi:</strong> Mohon lakukan transfer pelunasan unit ke rekening resmi Pancaran Logistics selambat-lambatnya <strong>3x24 jam kerja</strong> setelah surat keputusan ini terbit.
                        </li>
                        <li>
                          <strong>Verifikasi Dokumen:</strong> Tim legal kami akan menghubungi Anda melalui nomor telepon <span className="text-slate-900 font-bold font-mono">{userPhone || 'terdaftar'}</span> untuk mengoordinasikan jadwal penandatanganan Akta Jual Beli (AJB) dan kwitansi resmi.
                        </li>
                        <li>
                          <strong>Serah Terima Fisik:</strong> Pengambilan unit dapat dilakukan di Pool Cilincing setelah pelunasan diverifikasi dengan membawa KTP asli dan bukti tanda pemenang ini.
                        </li>
                      </ul>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-slate-400 text-[9px] font-bold">{language === 'en' ? 'SALES ADM CONTACT:' : 'KONTAK SALES ADM:'}</p>
                      <p className="font-mono text-slate-700 font-bold">sales@pancaran-group.co.id</p>
                      <p className="text-slate-500">Pancaran Logistics</p>
                    </div>

                    <div className="text-center w-48 space-y-12">
                      <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">{language === 'en' ? 'Sincerely Yours,' : 'Hormat Kami,'}</p>
                      <div className="space-y-1">
                        <p className="font-black text-slate-800 border-b border-slate-300 pb-1 mx-2">{language === 'en' ? 'Pancaran Auction Committee' : 'Panitia Pancaran Lelang'}</p>
                        <p className="text-slate-400 text-[9px] font-bold">PANCARAN LOGISTICS</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center text-slate-400 font-medium text-xs flex flex-col items-center justify-center gap-3 w-full h-[550px]">
              <MailOpen className="w-12 h-12 text-slate-300" />
              <span>
                {language === 'en' 
                  ? 'Please select a letter from the left menu to read the announcement details.' 
                  : 'Silakan pilih surat di menu kiri untuk membaca detail pengumuman.'}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
