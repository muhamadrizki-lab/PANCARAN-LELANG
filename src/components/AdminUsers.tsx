import React, { useState } from 'react';
import { AdminUser } from '../types';
import { 
  UserPlus, 
  Shield, 
  Mail, 
  Calendar, 
  Trash2, 
  Check, 
  AlertCircle,
  Users
} from 'lucide-react';

interface AdminUsersProps {
  admins: AdminUser[];
  onAddAdmin: (newAdmin: AdminUser) => void;
  onDeleteAdmin: (email: string) => void;
  currentAdminEmail: string;
}

export default function AdminUsers({ 
  admins, 
  onAddAdmin, 
  onDeleteAdmin,
  currentAdminEmail 
}: AdminUsersProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Admin Operasional'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name || !formData.email) {
      setErrorMsg('Mohon lengkapi nama dan email admin.');
      return;
    }

    // Check if email already exists
    const emailExists = admins.some(a => a.email.toLowerCase() === formData.email.toLowerCase());
    if (emailExists) {
      setErrorMsg('Email admin tersebut sudah terdaftar.');
      return;
    }

    // Validate email format
    if (!formData.email.endsWith('@pancaran-logistic.id') && !formData.email.endsWith('@pancaran-group.id') && !formData.email.includes('@')) {
      setErrorMsg('Format email tidak valid. Direkomendasikan menggunakan email institusi Pancaran.');
      return;
    }

    onAddAdmin({
      email: formData.email.toLowerCase(),
      name: formData.name,
      role: formData.role,
      createdAt: new Date().toISOString().split('T')[0]
    });

    setSuccessMsg(`Akses admin berhasil dibuat untuk ${formData.name}!`);
    setFormData({
      name: '',
      email: '',
      role: 'Admin Operasional'
    });

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="admin-users-view">
      
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Akses Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Buat akses administrator baru, tinjau tingkatan hak akses, dan kelola otoritas keamanan internal Pancaran Lelang.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Create Access Form ("create access" from flowchart) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 lg:col-span-1" id="create-access-form-container">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" /> Buat Akses Baru
            </h2>
            <p className="text-xs text-slate-500">Daftarkan akun email karyawan baru untuk memberikan akses masuk ke dashboard internal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-semibold flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Admin Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Nama Lengkap Admin</label>
              <input
                type="text"
                placeholder="Contoh: Achmad Subagja"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            {/* Admin Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Alamat Email Pancaran</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="name@pancaran-logistic.id"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400">Harus berupa email institusi Pancaran.</p>
            </div>

            {/* Admin Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Tingkatan Peran (Role)</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700"
              >
                <option value="Admin Operasional">Admin Operasional (Input & Kelola Aset)</option>
                <option value="Admin Keuangan">Admin Keuangan (Otorisasi Unit Terjual)</option>
                <option value="Super Admin">Super Admin (Akses Penuh)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold shadow-md shadow-blue-600/10 hover:shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Buat Hak Akses</span>
            </button>
          </form>
        </div>

        {/* Right Side: Admins List table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 lg:col-span-2" id="admins-list-container">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Daftar Administrator Terdaftar
            </h2>
            <p className="text-xs text-slate-500">Daftar staf internal Pancaran Logistics yang memegang otoritas sistem Lelang.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-400 font-bold uppercase">
                  <th className="py-3.5 px-4 font-bold">Nama / Karyawan</th>
                  <th className="py-3.5 px-4 font-bold">Email Akun</th>
                  <th className="py-3.5 px-4 font-bold">Peran</th>
                  <th className="py-3.5 px-4 font-bold">Terdaftar Pada</th>
                  <th className="py-3.5 px-4 text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {admins.map((admin) => {
                  const isCurrent = admin.email === currentAdminEmail;
                  const isMainSuperAdmin = admin.email === 'email@pancaran-logistic.id';

                  return (
                    <tr key={admin.email} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-medium text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {admin.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold">{admin.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-max mt-0.5">
                                Sedang Aktif
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-600 text-xs">{admin.email}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                          <Shield className="w-3.5 h-3.5" />
                          {admin.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-xs">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {admin.createdAt}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {deleteConfirmEmail === admin.email ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                onDeleteAdmin(admin.email);
                                setDeleteConfirmEmail(null);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-sm transition-all"
                            >
                              Ya
                            </button>
                            <button
                              onClick={() => setDeleteConfirmEmail(null)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold border border-slate-200 transition-all"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={isCurrent || isMainSuperAdmin}
                            onClick={() => setDeleteConfirmEmail(admin.email)}
                            className={`p-2 rounded-xl border transition-all ${
                              isCurrent || isMainSuperAdmin
                                ? 'text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50'
                                : 'text-rose-500 border-slate-100 hover:border-rose-200 hover:bg-rose-50 active:scale-95'
                            }`}
                            title={isCurrent ? "Anda sedang masuk dengan akun ini" : isMainSuperAdmin ? "Akun Super Admin Utama tidak bisa dihapus" : "Hapus Akses"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
