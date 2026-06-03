import React, { useState } from 'react';
import { useAppStore } from '../../../store/useStore';
import { Share2, Clipboard, ShieldCheck, Store, FileText, CheckCircle, RotateCcw, AlertTriangle, UserPlus, Users } from 'lucide-react';

export default function SettingScreen() {
  const { namaToko, updateProfile, paymentMethods, resetDataToko, kasirAktif, daftarKasir, addKasirDinamis, allTransactions, products } = useAppStore();
  
  const [storeNameInput, setStoreNameInput] = useState(namaToko);
  const [newKasirName, setNewKasirName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [kasirToast, setKasirToast] = useState(false);

  // ==========================================
  // RINCIAN COMPLETED DETEKSI PRODUK TERJUAL PER KASIR AKTIF
  // ==========================================
  const compileKasirProductSalesReport = () => {
    const salesMap: { [key: string]: { nama: string; qty: number; totalHarga: number; marginTotal: number } } = {};
    
    // Saring transaksi khusus milik kasir yang aktif saat ini
    const txKasirAktif = allTransactions.filter(tx => tx.kasirId === kasirAktif);

    txKasirAktif.forEach(tx => {
      if (tx.items) {
        tx.items.forEach(item => {
          const originalProduct = products.find(p => p.id === item.id || p.nama === item.nama);
          const modalSatuan = originalProduct ? originalProduct.hargaModal : Math.round(item.harga * 0.4);
          
          const keuntunganBersihSatuan = item.harga - modalSatuan;
          const totalKeuntunganItem = keuntunganBersihSatuan * item.qty;

          if (salesMap[item.nama]) {
            salesMap[item.nama].qty += item.qty;
            salesMap[item.nama].totalHarga += (item.harga * item.qty);
            salesMap[item.nama].marginTotal += totalKeuntunganItem;
          } else {
            salesMap[item.nama] = {
              nama: item.nama,
              qty: item.qty,
              totalHarga: item.harga * item.qty,
              marginTotal: totalKeuntunganItem
            };
          }
        });
      }
    });

    return Object.values(salesMap).sort((a, b) => b.qty - a.qty);
  };

  const salesReportList = compileKasirProductSalesReport();

  // Hitung total ringkasan internal dari daftar item ter-filter milik kasir aktif
  const totalOmzetShift = salesReportList.reduce((sum, i) => sum + i.totalHarga, 0);
  const totalLabaShift = salesReportList.reduce((sum, i) => sum + i.marginTotal, 0);
  const totalQtyShift = salesReportList.reduce((sum, i) => sum + i.qty, 0);
  const totalNotaShift = allTransactions.filter(tx => tx.kasirId === kasirAktif).length;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(storeNameInput);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // HANDLER AKSI MENAMBAHKAN PROFILE KASIR BARU SECARA DINAMIS
  const handleCreateKasir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKasirName.trim()) return;

    await addKasirDinamis(newKasirName.trim());
    setNewKasirName('');
    setKasirToast(true);
    setTimeout(() => setKasirToast(false), 2500);
  };

  const handleResetAction = () => {
    if (window.confirm("⚠️ PERINGATAN FATAL!\n\nApakah kamu yakin ingin MENGHAPUS TOTAL seluruh riwayat transaksi penjualan ruko harian? Tindakan ini tidak dapat dibatalkan!")) {
      setIsResetting(true);
      resetDataToko().then(() => {
        setIsResetting(false);
        alert("Database riwayat penjualan ruko berhasil dibersihkan total!");
      });
    }
  };

  const generateReportText = () => {
    const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    let itemLines = '';
    salesReportList.forEach((item, index) => {
      itemLines += `${index + 1}. 📦 ${item.nama}\n   Qty: ${item.qty} Pcs x Harga: Rp ${Math.round(item.totalHarga/item.qty).toLocaleString('id-ID')}\n   Subtotal: Rp ${item.totalHarga.toLocaleString('id-ID')} | Margin Laba: Rp ${item.marginTotal.toLocaleString('id-ID')}\n\n`;
    });

    if (salesReportList.length === 0) {
      itemLines = '• Belum ada rincian produk terjual untuk shift kasir ini.\n\n';
    }

    return `*📈 REPORT DETAIL PENJUALAN SHIFT: ${kasirAktif.toUpperCase()}*
🏪 Ruko: ${namaToko}
📅 Tanggal: ${tanggalHariIni}

==================================
📊 *DETAIL PRODUK TERJUAL (${kasirAktif}):*
==================================
${itemLines}==================================
📋 *SUMMARY TOTAL NOTA SHIFT KASIR:*
==================================
💰 Total Omzet Bruto  : Rp ${totalOmzetShift.toLocaleString('id-ID')}
💵 Total Laba Bersih  : Rp ${totalLabaShift.toLocaleString('id-ID')}
🧾 Kuantitas Nota     : ${totalNotaShift} Nota Sukses
🛍️ Total Item Keluar  : ${totalQtyShift} Pcs Barang

_Laporan otomatis terenkripsi dan dikirim langsung via sistem POS PWA._`;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generateReportText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Sistem & Laporan</h1>
        <p className="text-xs text-gray-500 mt-0.5">Kelola data performa kasir harian, tambah karyawan, atau reset data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        
        {/* PANEL LAPORAN FINANSIAL POWERFUL DENGAN DETAIL PRODUK */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 md:col-span-2">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Manifes Shift: {kasirAktif}</span>
            </div>
            <button type="button" onClick={handleCopyToClipboard} className="text-[10px] bg-emerald-600 text-slate-950 font-black px-2.5 py-1 rounded-md uppercase hover:bg-emerald-500 transition-colors">
              {copied ? "Copied Report!" : "Copy Report Teks"}
            </button>
          </div>

          {/* TABEL BREAKDOWN DETAIL HARGA, QTY & MARGIN PER PRODUK KASIR */}
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1 divide-y divide-white/5">
            {salesReportList.length > 0 ? (
              salesReportList.map((item, i) => (
                <div key={i} className="flex justify-between items-center pt-2 first:pt-0 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-100 truncate max-w-[180px]">{item.nama}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {item.qty} Pcs x Rp {Math.round(item.totalHarga / item.qty).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-200">Rp {item.totalHarga.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] font-bold text-emerald-400 mt-0.5">Margin: +Rp {item.marginTotal.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">Kasir {kasirAktif} belum mencatatkan rincian produk terjual hari ini.</div>
            )}
          </div>

          {/* SUMMARY TOTAL SHIFT KASIR LENGKAP */}
          <div className="border-t border-white/10 pt-3 space-y-2">
            <h4 className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Summary Laporan Lengkap</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-[8px] text-slate-400 font-bold block uppercase">Omzet Shift</span>
                <span className="font-black text-slate-100">Rp {totalOmzetShift.toLocaleString('id-ID')}</span>
              </div>
              <div className="bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
                <span className="text-[8px] text-emerald-400 font-bold block uppercase">Laba Bersih</span>
                <span className="font-black text-emerald-400">Rp {totalLabaShift.toLocaleString('id-ID')}</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-[8px] text-slate-400 font-bold block uppercase">Total Nota</span>
                <span className="font-bold text-slate-200">{totalNotaShift} Nota</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-[8px] text-slate-400 font-bold block uppercase">Qty Keluar</span>
                <span className="font-bold text-slate-200">{totalQtyShift} Pcs</span>
              </div>
            </div>
          </div>

          {/* ZONA RESET DATA PENJUALAN TOTAL */}
          <div className="border-t border-white/10 pt-3 bg-red-950/10 p-3 rounded-xl border border-red-900/20">
            <button
              type="button"
              disabled={isResetting}
              onClick={handleResetAction}
              className="w-full bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-black py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"
            >
              <RotateCcw size={13} className={isResetting ? "animate-spin" : ""} />
              {isResetting ? "Sedang Mengosongkan Database..." : "Reset Total Seluruh Data Penjualan"}
            </button>
          </div>
        </div>

        {/* RE-DESIGN BARU: WIDGET ADD KASIR DINAMIS UTK TIM OUTLET */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-2 text-emerald-800">
              <UserPlus size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wide">Registrasi Kasir Baru</h3>
            </div>

            <form onSubmit={handleCreateKasir} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Nama Karyawan Kasir *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Andi Wijaya"
                  value={newKasirName}
                  onChange={(e) => setNewKasirName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500 shadow-inner"
                />
              </div>

              {kasirToast && (
                <p className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">✓ Profil Kasir Baru berhasil didaftarkan ke cloud!</p>
              )}

              <button type="submit" className="w-full bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl hover:bg-emerald-800 transition-colors shadow-sm">
                Tambahkan Kasir
              </button>
            </form>

            {/* List Preview Nama Karyawan yang Terdaftar */}
            <div className="pt-2">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5"><Users size={11}/> Tim Kasir Terdaftar ({daftarKasir.length})</span>
              <div className="flex flex-wrap gap-1">
                {daftarKasir.map((name) => (
                  <span key={name} className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md border border-gray-200">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Panel Nama Toko */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-2 text-gray-800">
              <Store size={15} />
              <h3 className="text-xs font-bold uppercase tracking-wide">Profil Bisnis Outlet</h3>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-2">
              <input
                type="text"
                required
                value={storeNameInput}
                onChange={(e) => setStoreNameInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500"
              />
              {isSaved && <p className="text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded-lg text-center">✓ Berhasil disimpan!</p>}
              <button type="submit" className="w-full bg-gray-900 text-white text-xs font-bold py-1.5 rounded-xl hover:bg-gray-800 transition-colors">Simpan Nama Toko</button>
            </form>
          </div>

          {/* Saluran Pembayaran */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-1.5 text-gray-800">
              <ShieldCheck size={15} />
              <h3 className="text-xs font-bold uppercase tracking-wide">Saluran Pembayaran</h3>
            </div>
            <div className="divide-y divide-gray-50 text-[11px] font-semibold text-gray-600">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                  <span>{method.nama}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${method.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>{method.isActive ? 'AKTIF' : 'OFF'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}