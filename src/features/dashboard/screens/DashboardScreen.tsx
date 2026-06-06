import { useState } from 'react';
import { useAppStore } from '../../../store/useStore';
import { Bell, UserCheck, Calendar, Monitor, TrendingUp, DollarSign, ShoppingBag, Award, X, Clock, User, Sparkles, ArrowRight, BrainCircuit, LogOut } from 'lucide-react';

interface DashboardScreenProps {
  onViewAllProducts: () => void;
}

export default function DashboardScreen({ onViewAllProducts }: DashboardScreenProps) {
  // Panggil logoutUser dan isLoading dari store ruko
  const { namaToko, kasirAktif, daftarKasir, setKasirAktif, getComputedDashboard, allTransactions, getAIPredictiveStock, getAIMarginInsights, isLoading, logoutUser } = useAppStore();
  const [timeFilter, setTimeFilter] = useState('Hari Ini');
  
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const computedData = getComputedDashboard();
  const aiStockList = getAIPredictiveStock();
  const aiMarginList = getAIMarginInsights();

  const totalKritisCount = aiStockList.filter(i => i.statusKritis === 'KRITIS' || i.statusKritis === 'PERINGATAN').length;

  const sortedTransactionsFeed = [...allTransactions].sort((a, b) => 
    new Date(b.waktuTransaksi).getTime() - new Date(a.waktuTransaksi).getTime()
  );

  const maxGrafikValue = computedData.grafikHari && computedData.grafikHari.length > 0
    ? Math.max(...computedData.grafikHari.map(d => d.value || 0))
    : 100000;

  const handleOpenNotification = () => {
    setShowNotificationDrawer(true);
    setHasUnread(false);
  };

  const handleLogoutClick = async () => {
    if (window.confirm("Apakah kamu yakin ingin keluar dari sistem POS UMKM?")) {
      if (navigator.vibrate) navigator.vibrate(80);
      await logoutUser();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto w-full px-1 sm:px-2 animate-pulse">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row justify-between gap-4">
          <div className="h-7 bg-gray-200 rounded-xl w-48"></div>
          <div className="flex gap-2">
            <div className="h-9 bg-gray-200 rounded-xl w-28"></div>
            <div className="h-9 bg-gray-200 rounded-xl w-32"></div>
          </div>
        </div>
        <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-sm space-y-3 min-h-[110px]">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-28"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm h-52 md:col-span-2 flex items-end gap-4 px-6 pt-10">
            {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-200 rounded-t-lg w-full" style={{ height: `${i * 20 + 15}%` }}></div>)}
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm h-52 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-50 rounded-xl w-full"></div>
            <div className="h-8 bg-gray-50 rounded-xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto w-full px-1 sm:px-2 relative">
      
      {/* HEADER DASHBOARD DENGAN LOGOUT DAN NOTIFIKASI SEJAJAR SIMETRIS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 flex-1">
          <h1 className="text-xl font-black text-gray-900 tracking-tight shrink-0">{namaToko}</h1>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-600 shadow-sm">
              <Calendar size={13} className="text-gray-400" />
              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="text-xs font-bold bg-transparent outline-none cursor-pointer pr-1"
              >
                <option>Hari Ini</option>
                <option>7 Hari Terakhir</option>
                <option>Bulan Ini</option>
              </select>
            </div>

            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-xl px-3 py-2 shadow-sm">
              <UserCheck size={13} className="text-emerald-600" />
              <select 
                value={kasirAktif}
                onChange={(e) => setKasirAktif(e.target.value)}
                className="text-xs font-black bg-transparent outline-none cursor-pointer text-emerald-900 pr-1"
              >
                {daftarKasir.map(kasir => (
                  <option key={kasir} value={kasir}>Kasir: {kasir}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
          <div className="inline-flex items-center gap-1.5 bg-gray-100/80 border border-gray-200/40 rounded-xl px-3 py-1.5 text-gray-500 text-[11px] font-bold">
            <Monitor size={12} className="text-gray-400" />
            <span>Status Perangkat: <span className="text-emerald-600 font-extrabold">Full Screen</span></span>
          </div>

          {/* BLOCK CONTAINER BARU: SEJAJAR LOGOUT & NOTIFIKASI */}
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleOpenNotification}
              className="p-2.5 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 text-gray-700 relative active:scale-95 transition-all shadow-sm group"
            >
              <Bell size={17} className="group-hover:rotate-12 transition-transform" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>

            <button 
              type="button"
              onClick={handleLogoutClick}
              className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-700 rounded-xl active:scale-95 transition-all shadow-sm"
              title="Keluar dari Aplikasi"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Jendela Selamat Datang Kasir Aktif */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight">Selamat Bekerja, {kasirAktif}! 🧑‍💻</h2>
          <p className="text-xs text-emerald-100/90 mt-0.5">Sistem memuat data ringkasan penjualan tokomu secara akurat.</p>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[10px] bg-white/20 border border-white/10 px-3 py-1 rounded-lg font-black tracking-wider uppercase">SHIFT ACTIVE</span>
        </div>
      </div>

      {/* Grid Ringkasan Finansial Kasir */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase flex items-center gap-1"><TrendingUp size={11}/> Omzet Shift</span>
            <p className="text-lg font-black text-gray-900 tracking-tight">Rp {computedData.omzet.toLocaleString('id-ID')}</p>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md w-fit">↗ +16% vs kemarin</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase flex items-center gap-1"><ShoppingBag size={11}/> Nota Sukses</span>
            <p className="text-lg font-black text-gray-900 tracking-tight">{computedData.transaksiCount} Nota</p>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md w-fit">↗ +12% vs kemarin</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="space-y-1">
            <span className="text-[10px] text-emerald-600 font-bold tracking-wider uppercase flex items-center gap-1"><DollarSign size={11}/> Laba Bersih</span>
            <p className="text-lg font-black text-emerald-600 tracking-tight">Rp {computedData.labaBersih.toLocaleString('id-ID')}</p>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md w-fit">↗ +15% vs kemarin</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase flex items-center gap-1"><Award size={11}/> Barang Keluar</span>
            <p className="text-lg font-black text-gray-900 tracking-tight">{computedData.produkTerjualCount} Pcs</p>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md w-fit">↗ +10% vs kemarin</span>
        </div>
      </div>

      {/* Bagian Diagram Batang & Produk Terlaris */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-4 md:col-span-2">
          <span className="text-xs font-black text-gray-800 block">Analisis Grafik Omzet Jam: <span className="text-emerald-700">{kasirAktif}</span></span>
          <div className="h-40 w-full flex items-end justify-between pt-6 px-2 relative">
            <div className="absolute inset-x-0 bottom-6 border-b border-gray-100 border-dashed"></div>
            <div className="absolute inset-x-0 bottom-16 border-b border-gray-100 border-dashed"></div>
            {computedData.grafikHari.map((data, index) => {
              const barHeight = maxGrafikValue > 0 ? (data.value / maxGrafikValue) * 110 : 0;
              return (
                <div key={index} className="flex flex-col items-center flex-1 group z-10 mx-2">
                  <div style={{ height: `${Math.max(barHeight, 5)}px` }} className="w-4 bg-gradient-to-t from-emerald-600 to-emerald-500 rounded-t-full relative transition-all duration-500 group-hover:from-emerald-500">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-[9px] font-black px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-30">
                      Rp {data.value.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-extrabold mt-2.5">{data.label}.00</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-3.5">
          <div className="flex justify-between items-center border-b border-gray-50 pb-2">
            <span className="text-xs font-black text-gray-800">Juara Produk Terlaris</span>
            <button type="button" onClick={onViewAllProducts} className="text-[10px] font-black text-emerald-600 uppercase">Lihat Semua</button>
          </div>
          <div className="divide-y divide-gray-100 max-h-[140px] overflow-y-auto pr-1">
            {computedData.produkTerlaris.length > 0 ? (
              computedData.produkTerlaris.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <span className="text-xs font-bold text-gray-700">{index + 1}. {item.nama}</span>
                  <span className="text-[11px] font-black text-gray-900 bg-gray-50 border px-2 py-0.5 rounded-lg">{item.terjual} Pcs</span>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-gray-400 py-10">Belum ada nota masuk.</div>
            )}
          </div>
        </div>
      </div>

      {/* SUB-GRID AI INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 border-t border-gray-200/60 pt-5">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm space-y-3 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-gray-50 pb-2">
            <div className="flex items-center gap-1.5">
              <BrainCircuit size={16} className="text-purple-600 animate-pulse" />
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">AI Predictive Restock Alert</h3>
            </div>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${totalKritisCount > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-700'}`}>
              {totalKritisCount > 0 ? `⚠️ ${totalKritisCount} Menu Menipis` : '✓ Amunisi Toko Aman'}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[250px] overflow-y-auto pr-1">
            <table className="w-full text-left text-[11px] font-semibold text-gray-700">
              <thead>
                <tr className="text-[9px] text-gray-400 font-bold uppercase bg-gray-50 p-1.5">
                  <th className="py-2 px-1">Nama Barang</th>
                  <th className="py-2 text-center">Stok</th>
                  <th className="py-2 text-center">Sisa Hari</th>
                  <th className="py-2 text-right px-1">Rekomendasi Kulakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {aiStockList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="py-2 px-1 font-bold text-gray-800">{item.nama}</td>
                    <td className="py-2 text-center text-gray-500">{item.sisaStok} {item.satuan}</td>
                    <td className="py-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded font-black text-[9px] ${
                        item.statusKritis === 'KRITIS' ? 'bg-red-50 text-red-600' :
                        item.statusKritis === 'PERINGATAN' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.estimasiHariHabis === 0 ? 'Habis' : item.estimasiHariHabis === 999 ? '∞' : `${item.estimasiHariHabis} Hari`}
                      </span>
                    </td>
                    <td className="py-2 text-right px-1 font-black">
                      {item.rekomendasiOrder > 0 ? (
                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-[9px] inline-flex items-center gap-0.5">
                          Order +{item.rekomendasiOrder} <ArrowRight size={8} />
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal">Aman</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm space-y-3">
          <div className="border-b border-gray-50 pb-2 flex items-center gap-1.5">
            <Sparkles size={15} className="text-indigo-600" />
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">Matrix Smart Margin</h3>
          </div>

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {aiMarginList.map((item, idx) => {
              const isStar = item.kuadranStatus.startsWith('STAR');
              const isCow = item.kuadranStatus.startsWith('CASH COW');
              const isBooster = item.kuadranStatus.startsWith('VOLUME BOOSTER');

              return (
                <div key={idx} className="p-2 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 truncate max-w-[140px]">{item.nama}</span>
                    <span className={`text-[7px] font-black px-1 rounded ${
                      isStar ? 'bg-amber-100 text-amber-800' :
                      isCow ? 'bg-emerald-100 text-emerald-700' :
                      isBooster ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {item.kuadranStatus.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-500 italic bg-white p-1.5 rounded border border-gray-50">
                    {item.rekomendasiStrategi}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LIVE NOTIFICATION DRAWER */}
      {showNotificationDrawer && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          <div className="flex-1" onClick={() => setShowNotificationDrawer(false)}></div>
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-gray-200 flex flex-col animate-slideLeft">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">
                  <Bell size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-950">Live Riwayat Transaksi</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">Aliran nota terjual realtime cloud ruko</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowNotificationDrawer(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {sortedTransactionsFeed.length > 0 ? (
                sortedTransactionsFeed.map((tx, idx) => {
                  const jamMenit = new Date(tx.waktuTransaksi).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                  return (
                    <div key={tx.id || idx} className="animate-fadeIn">
                      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm hover:border-emerald-200 transition-all flex justify-between items-start gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                            <span className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5 text-gray-600">
                              <Clock size={11} className="text-gray-400" /> {jamMenit}
                            </span>
                            <span className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5 text-gray-600">
                              <User size={11} className="text-gray-400" /> {tx.kasirId}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {tx.items && tx.items.map((item, itemIdx) => (
                              <span 
                                key={itemIdx} 
                                className="inline-flex items-center text-[11px] font-bold bg-gray-50 text-gray-700 border border-gray-200 px-2 py-1 rounded-xl shadow-sm/5"
                              >
                                📦 {item.nama}
                                <span className="ml-1.5 font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-100 text-[10px]">
                                  x{item.qty}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between self-stretch text-right min-w-[100px]">
                          <span className={`inline-flex items-center text-[9px] font-black px-2 py-0.5 rounded-md tracking-wider border uppercase ${
                            tx.paymentMethod === 'tunai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            tx.paymentMethod === 'qris' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                            'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {tx.paymentMethod === 'tunai' ? '💵 ' : tx.paymentMethod === 'qris' ? '📲 ' : '💳 '}
                            {tx.paymentMethod.toUpperCase()}
                          </span>

                          <div className="mt-auto">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Total Tagihan</span>
                            <span className="text-xs font-black text-gray-900 tracking-tight">
                              Rp {tx.totalHarga.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-24 text-xs text-gray-400 font-semibold">
                  Belum ada aliran riwayat nota terjual di cloud database.
                </div>
              )}
            </div>

            <div className="p-3.5 bg-gray-50 border-t border-gray-100 text-center text-[10px] font-black text-gray-400 tracking-wider uppercase mt-auto">
              Total Manifes Terkunci: {sortedTransactionsFeed.length} Nota Masuk
            </div>
          </div>
        </div>
      )}

    </div>
  );
}