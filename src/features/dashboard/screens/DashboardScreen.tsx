import { useState } from 'react';
import { useAppStore } from '../../../store/useStore';
import { Bell, ArrowUpRight } from 'lucide-react';

interface DashboardScreenProps {
  onViewAllProducts: () => void;
}

export default function DashboardScreen({ onViewAllProducts }: DashboardScreenProps) {
  const { dashboardData, namaToko, pemilik } = useAppStore();
  
  // State interaktif untuk mengontrol tab filter grafik penjualan
  const [periodFilter, setPeriodFilter] = useState<'hari' | 'minggu' | 'bulan'>('hari');

  // Menentukan data sumber grafik berdasarkan tab aktif
  const activeGrafikData = periodFilter === 'hari' 
    ? dashboardData.grafikHari 
    : periodFilter === 'minggu' 
      ? dashboardData.grafikMinggu 
      : dashboardData.grafikBulan;

  // Menghitung angka tertinggi (max value) sebagai skala bar grafik
  const maxGrafikValue = activeGrafikData && activeGrafikData.length > 0
    ? Math.max(...activeGrafikData.map(d => d.value || 0))
    : 100000;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header Dashboard */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{namaToko || "Kopi & Roti Mantap"}</h1>
          <div className="inline-block bg-white border border-gray-200 rounded-lg px-2 py-1 mt-1">
            <select className="text-xs font-semibold text-gray-600 bg-transparent outline-none cursor-pointer">
              <option>Hari Ini</option>
              <option>7 Hari Terakhir</option>
              <option>Bulan Ini</option>
            </select>
          </div>
        </div>
        <button className="p-2 bg-white rounded-full border border-gray-200 text-gray-600 shadow-sm relative active:scale-95 transition-transform">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>

      {/* Header Selamat Datang */}
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
        <h2 className="text-sm font-bold text-emerald-800">Selamat Datang, {pemilik || "Shobur"}! 👋</h2>
        <p className="text-[11px] text-emerald-600 mt-0.5">Berikut adalah ringkasan penjualan tokomu hari ini.</p>
      </div>

      {/* Grid Ringkasan Performa Bisnis */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">Total Penjualan</span>
            <p className="text-base font-bold text-gray-900 mt-1">Rp {(dashboardData.omzet || 0).toLocaleString('id-ID')}</p>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-2 flex items-center gap-0.5">
            <ArrowUpRight size={12} /> 16% dari kemarin
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">Transaksi</span>
            <p className="text-base font-bold text-gray-900 mt-1">{dashboardData.transaksiCount || 0}</p>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-2 flex items-center gap-0.5">
            <ArrowUpRight size={12} /> 12% dari kemarin
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">Laba Bersih</span>
            <p className="text-base font-bold text-emerald-600 mt-1">Rp {(dashboardData.labaBersih || 0).toLocaleString('id-ID')}</p>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-2 flex items-center gap-0.5">
            <ArrowUpRight size={12} /> 15% dari kemarin
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">Produk Terjual</span>
            <p className="text-base font-bold text-gray-900 mt-1">{dashboardData.produkTerjualCount || 0}</p>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-2 flex items-center gap-0.5">
            <ArrowUpRight size={12} /> 10% dari kemarin
          </span>
        </div>
      </div>

      {/* Grafik Penjualan */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-800">Grafik Penjualan</span>
          
          {/* Segmented Controller Tab */}
          <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold text-gray-500">
            <button 
              type="button"
              onClick={() => setPeriodFilter('hari')}
              className={`px-2 py-0.5 rounded-md transition-all ${periodFilter === 'hari' ? 'bg-white text-emerald-700 shadow-sm' : 'hover:text-gray-700'}`}
            >
              Hari
            </button>
            <button 
              type="button"
              onClick={() => setPeriodFilter('minggu')}
              className={`px-2 py-0.5 rounded-md transition-all ${periodFilter === 'minggu' ? 'bg-white text-emerald-700 shadow-sm' : 'hover:text-gray-700'}`}
            >
              Minggu
            </button>
            <button 
              type="button"
              onClick={() => setPeriodFilter('bulan')}
              className={`px-2 py-0.5 rounded-md transition-all ${periodFilter === 'bulan' ? 'bg-white text-emerald-700 shadow-sm' : 'hover:text-gray-700'}`}
            >
              Bulan
            </button>
          </div>
        </div>

        {/* Batang Grafik Dinamis */}
        <div className="h-28 w-full flex items-end justify-between pt-4 px-1 relative">
          <div className="absolute inset-x-0 bottom-6 border-b border-gray-100 border-dashed"></div>
          <div className="absolute inset-x-0 bottom-14 border-b border-gray-100 border-dashed"></div>
          
          {activeGrafikData && activeGrafikData.length > 0 ? (
            activeGrafikData.map((data, index) => {
              const barHeight = maxGrafikValue > 0 ? ((data.value || 0) / maxGrafikValue) * 80 : 0;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1 group z-10 mx-0.5">
                  <div 
                    style={{ height: `${Math.max(barHeight, 4)}px` }} 
                    className="w-2 bg-emerald-600 rounded-t-full relative transition-all duration-300"
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] font-bold px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                      Rp {(data.value || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold mt-2 tracking-tighter">{data.label}</span>
                </div>
              );
            })
          ) : (
            <div className="w-full text-center text-[10px] text-gray-400 pb-8">Memuat data grafik...</div>
          )}
        </div>
      </div>

      {/* Produk Terlaris */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-800">Produk Terlaris</span>
          <button 
            type="button"
            onClick={onViewAllProducts}
            className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
          >
            Lihat semua
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {dashboardData.produkTerlaris && dashboardData.produkTerlaris.length > 0 ? (
            dashboardData.produkTerlaris.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center font-bold text-xs text-amber-800">
                    {(item.nama || 'P').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{item.nama}</span>
                </div>
                <span className="text-xs font-bold text-gray-700">{item.terjual || 0} terjual</span>
              </div>
            ))
          ) : (
            <div className="text-center text-xs text-gray-400 py-2">Belum ada data penjualan.</div>
          )}
        </div>
      </div>
    </div>
  );
}