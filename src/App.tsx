import { useState, useEffect } from 'react';
import { LayoutDashboard, Box, PlusCircle, ShoppingCart, Menu, Loader2, WifiOff, Wifi } from 'lucide-react';
import { useAppStore } from './store/useStore';
import DashboardScreen from './features/dashboard/screens/DashboardScreen';
import StockScreen from './features/stock/screens/StockScreen';
import PosScreen from './features/transaksi/screens/PosScreen';
import SettingScreen from './features/setting/screens/SettingScreen';
import AddProductForm from './features/stock/components/AddProductForm';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { initAppSync, isLoading, isOnline } = useAppStore();

  useEffect(() => {
    initAppSync();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full relative">
      
      {/* BAR INDIKATOR JARINGAN INTERNET OFFLINE / ONLINE RUKO */}
      {!isOnline ? (
        <div className="w-full bg-rose-600 text-white text-[11px] font-black py-1.5 px-4 flex items-center justify-center gap-2 shadow-inner animate-pulse z-50">
          <WifiOff size={13} />
          <span>Koneksi Internet Ruko Terputus! Mode Offline Mandiri Aktif.</span>
        </div>
      ) : (
        <div className="w-full bg-emerald-600 text-white text-[10px] font-bold py-1 px-4 flex items-center justify-center gap-1.5 transition-all duration-500 max-h-0 overflow-hidden opacity-0 lg:max-h-6 lg:opacity-100">
          <Wifi size={11} />
          <span>Koneksi Cloud Firestore Stabil (Online)</span>
        </div>
      )}
      
      {isLoading ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center space-y-3 bg-white z-50">
          <Loader2 size={36} className="text-emerald-700 animate-spin" />
          <p className="text-xs font-bold text-gray-500 tracking-wide">Menghubungkan ke Cloud Firestore...</p>
        </div>
      ) : (
        <main className="flex-1 w-full px-4 sm:px-6 md:px-8 py-5 pb-28 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardScreen onViewAllProducts={() => setActiveTab('produk')} />
          )}
          {activeTab === 'produk' && <StockScreen />}
          {activeTab === 'transaksi' && <PosScreen />}
          {activeTab === 'lainnya' && <SettingScreen />}
          {activeTab === 'tambah' && (
            <AddProductForm onSuccess={() => setActiveTab('produk')} />
          )}
        </main>
      )}

      {/* NAV BAR ASLI (5 MENU) SESUAI SCREENSHOT 21.05.54 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-20 flex items-center justify-around px-4 pb-2 z-40 shadow-xl max-w-lg mx-auto sm:rounded-t-3xl sm:border-x">
        <button 
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-emerald-700' : 'text-gray-400'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-semibold mt-1">Dashboard</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveTab('produk')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${activeTab === 'produk' ? 'text-emerald-700' : 'text-gray-400'}`}
        >
          <Box size={20} />
          <span className="text-[10px] font-semibold mt-1">Produk</span>
        </button>

        {/* Floating Button Tambah */}
        <button 
          type="button"
          onClick={() => setActiveTab('tambah')}
          className="flex flex-col items-center justify-center w-12 h-12 text-emerald-800 -mt-8 bg-emerald-100 rounded-full border-4 border-white shadow-md active:scale-95 transition-all"
        >
          <PlusCircle size={24} />
        </button>

        <button 
          type="button"
          onClick={() => setActiveTab('transaksi')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${activeTab === 'transaksi' ? 'text-emerald-700' : 'text-gray-400'}`}
        >
          <ShoppingCart size={20} />
          <span className="text-[10px] font-semibold mt-1">Kasir</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveTab('lainnya')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${activeTab === 'lainnya' ? 'text-emerald-700' : 'text-gray-400'}`}
        >
          <Menu size={20} />
          <span className="text-[10px] font-semibold mt-1">Lainnya</span>
        </button>
      </nav>

    </div>
  );
}