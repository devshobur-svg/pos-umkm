import React, { useState } from 'react';
import { useAppStore } from '../../../store/useStore';
import { Share2, Clipboard, ShieldCheck, Store, FileText, CheckCircle } from 'lucide-react';

export default function SettingScreen() {
  const { dashboardData, namaToko, pemilik, updateProfile, paymentMethods, hariIniTransactions, products } = useAppStore();
  
  const [storeNameInput, setStoreNameInput] = useState(namaToko);
  const [ownerInput, setOwnerInput] = useState(pemilik);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // ==========================================
  // 1. FUNGSI PENANGANAN SIMPAN PROFIL (YANG SEMPAT HILANG)
  // ==========================================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(storeNameInput, ownerInput);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // ==========================================
  // 2. FORMULASI DETEKSI DETAIL ITEM TERJUAL & REKAP MARGIN
  // ==========================================
  const compileProductSalesReport = () => {
    const salesMap: { [key: string]: { nama: string; qty: number; totalHarga: number; marginTotal: number } } = {};

    hariIniTransactions.forEach(tx => {
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

  const salesReportList = compileProductSalesReport();

  // ==========================================
  // 3. GENERASI FORMAT TEKS UNTUK DICOPY / DI-SHARE
  // ==========================================
  const generateReportText = () => {
    const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let itemLines = '';
    salesReportList.forEach((item, index) => {
      itemLines += `${index + 1}. 📦 ${item.nama}\n   Jumlah: ${item.qty} Pcs\n   Total Penjualan: Rp ${item.totalHarga.toLocaleString('id-ID')}\n   Margin Laba: Rp ${item.marginTotal.toLocaleString('id-ID')}\n\n`;
    });

    if (salesReportList.length === 0) {
      itemLines = '• Belum ada item produk terjual hari ini.\n\n';
    }

    return `*📈 LAPORAN DETAIL PENJUALAN & MARGIN*
🏪 Toko: ${namaToko.toUpperCase()}
📅 Hari: ${tanggalHariIni}
👤 Kasir/Pemilik: ${pemilik}

==================================
📊 *RINCIAN PENJUALAN PER PRODUK:*
==================================
${itemLines}==================================
📋 *SUMMARY TOTAL LAPORAN LENGKAP:*
==================================
💰 Total Omzet (Pendapatan bruto) : Rp ${(dashboardData.omzet || 0).toLocaleString('id-ID')}
💵 Total Laba Bersih (Margin nett): Rp ${(dashboardData.labaBersih || 0).toLocaleString('id-ID')}
🧾 Jumlah Nota / Transaksi Sukses : ${dashboardData.transaksiCount || 0} Nota
🛍️ Total Kuantitas Barang Keluar : ${dashboardData.produkTerjualCount || 0} Pcs

_Laporan dibuat secara otomatis dan akurat oleh Sistem POS PWA ${namaToko}._`;
  };

  const handleShareReport = async () => {
    const reportText = generateReportText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Laporan Finansial ${namaToko}`,
          text: reportText,
        });
      } catch (error) {
        console.log('Batal share:', error);
      }
    } else {
      handleCopyToClipboard();
    }
  };

  const handleCopyToClipboard = () => {
    const reportText = generateReportText();
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Laporan Finansial</h1>
        <p className="text-xs text-gray-500 mt-0.5">Kelola laporan margin keuntungan produk dan profil tokomu</p>
      </div>

      {/* BOX PANEL LAPORAN PREMIUM POWERFUL */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
              <FileText size={15} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Analisis Penjualan & Margin</span>
          </div>
          <button 
            type="button" 
            onClick={handleShareReport}
            className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black px-2.5 py-1 rounded-lg uppercase flex items-center gap-1 transition-colors"
          >
            <Share2 size={11} /> Share Report
          </button>
        </div>

        {/* TABEL PREVIEW RINCIAN PRODUK YANG TERJUAL & KEUNTUNGAN */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-white/5">
          {salesReportList.length > 0 ? (
            salesReportList.map((item, i) => (
              <div key={i} className="flex justify-between items-center pt-2 first:pt-0">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 truncate max-w-[150px]">{item.nama}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.qty} Pcs terjual</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-200">Rp {item.totalHarga.toLocaleString('id-ID')}</p>
                  <p className="text-[10px] font-bold text-emerald-400 mt-0.5">Laba: +Rp {item.marginTotal.toLocaleString('id-ID')}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 font-medium">Belum ada detail produk terjual harian.</div>
          )}
        </div>

        {/* BAGIAN SUMMARY LENGKAP UTUH */}
        <div className="border-t border-white/10 pt-3 space-y-2">
          <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Summary Ringkasan Lengkap</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-400 font-semibold block uppercase">Total Omzet</span>
              <span className="font-extrabold text-slate-100">Rp {(dashboardData.omzet || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
              <span className="text-[9px] text-emerald-400 font-semibold block uppercase">Total Laba Bersih</span>
              <span className="font-black text-emerald-400">Rp {(dashboardData.labaBersih || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-400 font-semibold block uppercase">Volume Transaksi</span>
              <span className="font-bold text-slate-200">{dashboardData.transaksiCount || 0} Nota</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-400 font-semibold block uppercase">Barang Keluar</span>
              <span className="font-bold text-slate-200">{dashboardData.produkTerjualCount || 0} Pcs</span>
            </div>
          </div>
        </div>

        {/* Button Salin Teks Format Kasir */}
        <button
          type="button"
          onClick={handleCopyToClipboard}
          className="w-full bg-slate-800 hover:bg-slate-700 active:scale-[0.99] transition-all text-slate-200 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 border border-slate-700"
        >
          {copied ? (
            <div className="flex items-center gap-1">
              <CheckCircle size={14} className="text-emerald-400" /> 
              <span>Teks Laporan Lengkap Berhasil Tersalin!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Clipboard size={14} /> 
              <span>Copy Ringkasan Text Laporan</span>
            </div>
          )}
        </button>
      </div>

      {/* Profil Bisnis */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
          <Store size={15} className="text-emerald-700" />
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Profil Bisnis Outlet</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1">Nama Toko / Branding</label>
            <input
              type="text"
              required
              value={storeNameInput}
              onChange={(e) => setStoreNameInput(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1">Nama Pemilik / Kasir</label>
            <input
              type="text"
              required
              value={ownerInput}
              onChange={(e) => setOwnerInput(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500 transition-all"
            />
          </div>

          {isSaved && (
            <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
              ✓ Perubahan profil berhasil disimpan ke awan!
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Simpan Pembaruan Profil
          </button>
        </form>
      </div>

      {/* Metode Pembayaran Indikator */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
          <ShieldCheck size={15} className="text-emerald-700" />
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Opsi Saluran Pembayaran</h3>
        </div>

        <div className="divide-y divide-gray-50">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
              <div>
                <p className="text-xs font-bold text-gray-800">{method.nama}</p>
                <p className="text-[10px] text-gray-400">{method.details}</p>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${method.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                {method.isActive ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}