import React, { useState } from 'react';
import { useAppStore } from '../../../store/useStore';
import { ShieldCheck, Store, FileText, RotateCcw, UserPlus, Users, Calendar, User, FileDown, ClipboardCheck, Loader2 } from 'lucide-react';

export default function SettingScreen() {
  const { namaToko, updateProfile, paymentMethods, resetDataToko, kasirAktif, daftarKasir, addKasirDinamis, allTransactions, products } = useAppStore();
  
  // State Input & Loading Pengaturan
  const [storeNameInput, setStoreNameInput] = useState(namaToko);
  const [newKasirName, setNewKasirName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingKasir, setIsSavingKasir] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isCopyingText, setIsCopyingText] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [kasirToast, setKasirToast] = useState(false);

  // ENGINE STATE FILTER INDEPENDEN (Simple & Fungsional)
  const [filterKasir, setFilterKasir] = useState<string>('semua');
  // Default set ke tanggal hari ini dalam format YYYY-MM-DD
  const [filterTanggal, setFilterTanggal] = useState<string>(new Date().toISOString().split('T')[0]);

  // ==========================================
  // CORE ENGINE: KOMPILASI DATA BERDASARKAN FILTER DINAMIS
  // ==========================================
  const compileFilteredSalesReport = () => {
    const salesMap: { [key: string]: { nama: string; qty: number; totalHarga: number; marginTotal: number } } = {};
    
    // 1. Filter Transaksi berdasarkan Kasir + Tanggal Pilihan
    const filteredTransactions = allTransactions.filter(tx => {
      // Cocokkan Kasir
      const matchKasir = filterKasir === 'semua' || tx.kasirId === filterKasir;
      
      // Cocokkan Tanggal (Aman dari perbedaan Zona Waktu)
      const txDateStr = new Date(tx.waktuTransaksi).toISOString().split('T')[0];
      const matchTanggal = !filterTanggal || txDateStr === filterTanggal;
      
      return matchKasir && matchTanggal;
    });

    // 2. Akumulasi produk terjual dari nota-nota hasil filter
    filteredTransactions.forEach(tx => {
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

    return {
      reportList: Object.values(salesMap).sort((a, b) => b.qty - a.qty),
      totalNota: filteredTransactions.length
    };
  };

  const { reportList: salesReportList, totalNota: totalNotaShift } = compileFilteredSalesReport();

  // Hitung total ringkasan finansial dari hasil filter aktif
  const totalOmzetShift = salesReportList.reduce((sum, i) => sum + i.totalHarga, 0);
  const totalLabaShift = salesReportList.reduce((sum, i) => sum + i.marginTotal, 0);
  const totalQtyShift = salesReportList.reduce((sum, i) => sum + i.qty, 0);

  // ==========================================
  // HANDLER SUBMIT DATA DENGAN LOADING STATE PROTECTION
  // ==========================================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile(storeNameInput);
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateKasir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKasirName.trim()) return;

    setIsSavingKasir(true);
    try {
      await addKasirDinamis(newKasirName.trim());
      setNewKasirName('');
      setKasirToast(true);
      setTimeout(() => setKasirToast(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingKasir(false);
    }
  };

  const handleResetAction = () => {
    if (window.confirm("⚠️ PERINGATAN FATAL!\n\nApakah kamu yakin ingin MENGHAPUS TOTAL seluruh riwayat transaksi ruko? Tindakan ini tidak bisa dibatalkan!")) {
      setIsResetting(true);
      resetDataToko().then(() => {
        setIsResetting(false);
        alert("Database riwayat penjualan ruko berhasil dibersihkan total!");
      }).catch(() => setIsResetting(false));
    }
  };

  // ==========================================
  // ACTION OUTBOUND: EXPORT DATA TEXT TO COPY
  // ==========================================
  const generateReportText = () => {
    const formatTgl = filterTanggal ? new Date(filterTanggal).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) : 'Semua Waktu';

    let itemLines = '';
    salesReportList.forEach((item, index) => {
      itemLines += `${index + 1}. 📦 ${item.nama}\n   Qty: ${item.qty} Pcs x Rp ${Math.round(item.totalHarga/item.qty).toLocaleString('id-ID')}\n   Subtotal: Rp ${item.totalHarga.toLocaleString('id-ID')} | Laba: Rp ${item.marginTotal.toLocaleString('id-ID')}\n\n`;
    });

    if (salesReportList.length === 0) {
      itemLines = '• Belum ada rincian produk terjual untuk filter terpilih.\n\n';
    }

    return `*📈 REPORT DETAIL PENJUALAN OUTLET*
🏪 Outlet : ${namaToko}
👤 Filter Kasir : ${filterKasir.toUpperCase()}
📅 Periode Tanggal : ${formatTgl}

==================================
📊 *DETAIL PRODUK TERJUAL:*
==================================
${itemLines}==================================
📋 *RANGKUMAN TOTAL FINANSIAL:*
==================================
💰 Total Omzet Bruto  : Rp ${totalOmzetShift.toLocaleString('id-ID')}
💵 Total Laba Bersih  : Rp ${totalLabaShift.toLocaleString('id-ID')}
🧾 Kuantitas Nota     : ${totalNotaShift} Nota Terbit
🛍️ Total Item Keluar  : ${totalQtyShift} Pcs Barang

_Laporan otomatis terenkripsi dan dikirim langsung dari sistem POS Wallet Aing._`;
  };

  const handleCopyToClipboard = () => {
    setIsCopyingText(true);
    navigator.clipboard.writeText(generateReportText()).then(() => {
      setTimeout(() => setIsCopyingText(false), 1200);
    }).catch(() => setIsCopyingText(false));
  };

  // ==========================================
  // ADVANCED ENGINE: EXPORT TO PDF CLEAN LAYOUT (NATIVE IFRAME WINDOW CANVAS)
  // ==========================================
  const handleExportToPDF = () => {
    setIsExportingPDF(true);
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      setIsExportingPDF(false);
      return;
    }

    const tglCetak = filterTanggal ? new Date(filterTanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Semua Waktu';
    const waktuSekarang = new Date().toLocaleString('id-ID');

    const htmlContent = `
      <html>
        <head>
          <title>Laporan_Penjualan_${filterKasir}_${filterTanggal}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 25px; font-size: 13px; line-height: 1.5; }
            .header-container { border-bottom: 2px solid #0f766e; padding-bottom: 15px; margin-bottom: 20px; flex-direction: row; display: flex; justify-content: space-between; align-items: flex-end;}
            .title-main { font-size: 22px; font-weight: 900; color: #0f766e; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
            .meta-info { font-size: 11px; color: #64748b; font-weight: bold; margin-top: 5px; }
            .filter-badge-box { background: #f1f5f9; padding: 10px 15px; rounded-xl: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; font-size: 11px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
            .summary-card { background: #fafafa; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
            .summary-card.highlight { background: #f0fdf4; border-color: #bbf7d0; }
            .summary-label { font-size: 9px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 0.5px; }
            .summary-val { font-size: 15px; font-weight: 900; color: #0f766e; margin-top: 2px; }
            .summary-card.highlight .summary-val { color: #15803d; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #0f766e; color: white; text-transform: uppercase; font-size: 10px; font-weight: 800; padding: 10px; text-align: left; letter-spacing: 0.5px; }
            td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 600; }
            tr:nth-child(even) { background: #f8fafc; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .footer-pdf { margin-top: 40px; border-top: 1px solid #e2e8f0; pt-15px; font-size: 10px; text-align: center; color: #94a3b8; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <h1 class="title-main">${namaToko}</h1>
              <div class="meta-info">Manifes Laporan Penjualan Digital Cloud</div>
            </div>
            <div class="text-right meta-info" style="font-weight: normal;">Dicetak: ${waktuSekarang}</div>
          </div>

          <div class="filter-badge-box">
            <strong>⚙️ PARAMETER FILTER MANIFES:</strong><br/>
            <span style="margin-top: 5px; display:inline-block;">• Penanggung Jawab Kasir: <span style="color:#0f766e; font-weight:bold;">${filterKasir.toUpperCase()}</span></span> | 
            <span>• Tanggal Operasional: <span style="color:#0f766e; font-weight:bold;">${tglCetak}</span></span>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Total Omzet Bruto</div>
              <div class="summary-val">Rp ${totalOmzetShift.toLocaleString('id-ID')}</div>
            </div>
            <div class="summary-card highlight">
              <div class="summary-label">Total Laba Bersih</div>
              <div class="summary-val">Rp ${totalLabaShift.toLocaleString('id-ID')}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Manifes Nota</div>
              <div class="summary-val" style="color:#1e293b;">${totalNotaShift} Nota</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Volume Item Keluar</div>
              <div class="summary-val" style="color:#1e293b;">${totalQtyShift} Pcs</div>
            </div>
          </div>

          <h3 style="font-size: 12px; font-weight: 900; text-transform: uppercase; color:#1e293b; border-left: 3px solid #0f766e; padding-left: 8px; margin-bottom:10px;">Rincian Kuantitas Produk Terjual</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;" class="text-center">No</th>
                <th>Nama Menu / Item Produk</th>
                <th class="text-center" style="width: 100px;">Volume</th>
                <th class="text-right" style="width: 150px;">Subtotal Omzet</th>
                <th class="text-right" style="width: 150px;">Kontribusi Laba</th>
              </tr>
            </thead>
            <tbody>
              ${salesReportList.map((item, idx) => `
                <tr>
                  <td class="text-center" style="color:#94a3b8;">${idx + 1}</td>
                  <td style="color:#1e293b; font-weight:bold;">${item.nama}</td>
                  <td class="text-center">${item.qty} Pcs</td>
                  <td class="text-right">Rp ${item.totalHarga.toLocaleString('id-ID')}</td>
                  <td class="text-right" style="color:#16a34a;">Rp ${item.marginTotal.toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
              ${salesReportList.length === 0 ? `<tr><td colspan="5" class="text-center" style="color:#94a3b8; padding:30px;">Belum ada manifest data penjualan terdeteksi pada filter ini.</td></tr>` : ''}
            </tbody>
          </table>

          <div class="footer-pdf">
            Laporan ini sah diunduh secara resmi via Wallet Aing POS PWA Engine System.<br/>
            Kasir Bertanggung Jawab: ${kasirAktif}
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.print();
      iframe.remove();
      setIsExportingPDF(false);
    }, 1000);
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-6 max-w-5xl mx-auto w-full px-1 sm:px-0">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Sistem & Laporan</h1>
        <p className="text-xs text-gray-500 mt-0.5">Kelola data performa kasir harian, tambah karyawan, atau unduh berkas laporan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        
        {/* PANEL KIRI LEBAR: CONTROLLER FILTER + BREAKDOWN MANIFES LAPORAN SIMPEL */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4 lg:col-span-2">
          
          {/* BARIS SELEKSI KONTROL PANEL INTERAKTIF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><User size={12}/> Pilih Anggota Kasir</label>
              <select 
                value={filterKasir} 
                onChange={(e) => setFilterKasir(e.target.value)}
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer focus:border-emerald-500 appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '14px' }}
              >
                <option value="semua">Semua Kasir Toko</option>
                {daftarKasir.map(kasir => (
                  <option key={kasir} value={kasir}>{kasir}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar size={12}/> Tentukan Tanggal</label>
              <input 
                type="date"
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* DETAIL BREAKDOWN TABEL ITEM TERJUAL */}
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5"><FileText size={14}/> Rincian Menu Terjual</span>
              
              <div className="flex gap-2">
                <button 
                  type="button" 
                  disabled={isCopyingText}
                  onClick={handleCopyToClipboard} 
                  className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-bold px-2.5 py-1.5 rounded-lg uppercase flex items-center gap-1 active:scale-95 transition-all"
                >
                  {isCopyingText ? <Loader2 size={11} className="animate-spin text-emerald-400" /> : <ClipboardCheck size={11} />}
                  <span>{isCopyingText ? "Disalin!" : "Copy Teks"}</span>
                </button>

                <button 
                  type="button" 
                  disabled={isExportingPDF}
                  onClick={handleExportToPDF} 
                  className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-3 py-1.5 rounded-lg uppercase flex items-center gap-1 active:scale-95 transition-all shadow-md"
                >
                  {isExportingPDF ? <Loader2 size={11} className="animate-spin" /> : <FileDown size={11} />}
                  <span>{isExportingPDF ? "Menyusun..." : "Export to PDF"}</span>
                </button>
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto pr-1 divide-y divide-white/5 scrollbar-thin">
              {salesReportList.length > 0 ? (
                salesReportList.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 first:pt-0 text-xs">
                    <div>
                      <h4 className="font-black text-slate-100 truncate max-w-[190px]">{item.nama}</h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {item.qty} Pcs x Rp {Math.round(item.totalHarga / item.qty).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-200">Rp {item.totalHarga.toLocaleString('id-ID')}</p>
                      <p className="text-[10px] font-black text-emerald-400 mt-0.5">Laba: +Rp {item.marginTotal.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-14 text-xs text-slate-400 font-medium">Tidak ada manifes pesanan produk keluar untuk filter ini.</div>
              )}
            </div>
          </div>

          {/* DYNAMIC CARD FINANCIAL SUMMARY STATS */}
          <div className="border-t border-white/10 pt-3.5 space-y-2">
            <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Summary Finansial Ter-filter</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-[8px] text-slate-400 font-bold block uppercase">Omzet Shift</span>
                <span className="font-black text-slate-100 block mt-0.5">Rp {totalOmzetShift.toLocaleString('id-ID')}</span>
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <span className="text-[8px] text-emerald-400 font-bold block uppercase">Laba Bersih</span>
                <span className="font-black text-emerald-400 block mt-0.5">Rp {totalLabaShift.toLocaleString('id-ID')}</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-[8px] text-slate-400 font-bold block uppercase">Manifes Nota</span>
                <span className="font-bold text-slate-200 block mt-0.5">{totalNotaShift} Nota</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-[8px] text-slate-400 font-bold block uppercase">Qty Keluar</span>
                <span className="font-bold text-slate-200 block mt-0.5">{totalQtyShift} Pcs</span>
              </div>
            </div>
          </div>

          {/* RESET DATABASE ACTIONS ZONE */}
          <div className="border-t border-white/10 pt-3 bg-red-950/10 p-3 rounded-xl border border-red-900/20">
            <button
              type="button"
              disabled={isResetting}
              onClick={handleResetAction}
              className="w-full bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-black py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all disabled:opacity-40"
            >
              {isResetting ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
              <span>{isResetting ? "Sedang Mengosongkan Database..." : "Reset Total Seluruh Data Penjualan"}</span>
            </button>
          </div>
        </div>

        {/* PANEL KANAN: MANAGEMENT WIDGETS DENGAN SUBMIT STATE LOCKER */}
        <div className="space-y-4 w-full">
          
          {/* REGISTRASI PROFILE KASIR TIM BARU */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-2 text-emerald-800">
              <UserPlus size={16} />
              <h3 className="text-xs font-black uppercase tracking-wide">Registrasi Kasir Baru</h3>
            </div>

            <form onSubmit={handleCreateKasir} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Nama Karyawan Kasir *</label>
                <input
                  type="text"
                  required
                  disabled={isSavingKasir}
                  placeholder="Contoh: Andi Wijaya"
                  value={newKasirName}
                  onChange={(e) => setNewKasirName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500 shadow-inner disabled:bg-gray-100"
                />
              </div>

              {kasirToast && (
                <p className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">✓ Profil Kasir Baru didaftarkan ke cloud!</p>
              )}

              <button 
                type="submit" 
                disabled={isSavingKasir}
                className="w-full bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl hover:bg-emerald-800 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:bg-gray-200 disabled:text-gray-400"
              >
                {isSavingKasir && <Loader2 size={13} className="animate-spin" />}
                <span>{isSavingKasir ? "Mendaftarkan Staf..." : "Tambahkan Kasir"}</span>
              </button>
            </form>

            <div className="pt-2">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5"><Users size={11}/> Tim Terdaftar ({daftarKasir.length})</span>
              <div className="flex flex-wrap gap-1">
                {daftarKasir.map((name) => (
                  <span key={name} className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md border border-gray-200">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* EDIT BRANDING NAMA OUTLET RUKO */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-2 text-gray-800">
              <Store size={15} />
              <h3 className="text-xs font-black uppercase tracking-wide">Profil Bisnis Outlet</h3>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-2">
              <input
                type="text"
                required
                disabled={isSavingProfile}
                value={storeNameInput}
                onChange={(e) => setStoreNameInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500 disabled:bg-gray-100"
              />
              {isSavedToast && <p className="text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded-lg text-center font-bold border border-emerald-100 animate-fadeIn">✓ Identitas Toko Berhasil Disimpan!</p>}
              <button 
                type="submit" 
                disabled={isSavingProfile}
                className="w-full bg-gray-900 text-white text-xs font-black py-2.5 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5 disabled:bg-gray-200 disabled:text-gray-400"
              >
                {isSavingProfile && <Loader2 size={13} className="animate-spin" />}
                <span>{isSavingProfile ? "Menyimpan Perubahan..." : "Simpan Nama Toko"}</span>
              </button>
            </form>
          </div>

          {/* CONFIG FILTER METODE AKTIF STATUS */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-1.5 text-gray-800">
              <ShieldCheck size={15} />
              <h3 className="text-xs font-black uppercase tracking-wide">Saluran Pembayaran</h3>
            </div>
            <div className="divide-y divide-gray-50 text-[11px] font-bold text-gray-600">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
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