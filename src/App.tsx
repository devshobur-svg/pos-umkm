import { useState, useEffect } from 'react';
import { LayoutDashboard, Box, PlusCircle, ShoppingCart, Menu, WifiOff, Wifi, X, Loader2 } from 'lucide-react';
import { useAppStore } from './store/useStore';
import DashboardScreen from './features/dashboard/screens/DashboardScreen';
import StockScreen from './features/stock/screens/StockScreen'; 
import PosScreen from './features/transaksi/screens/PosScreen';
import SettingScreen from './features/setting/screens/SettingScreen';
import AddProductForm from './features/stock/components/AddProductForm';
import LoginScreen from './features/auth/screens/LoginScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { initAppSync, isOnline, networkToast, closeNetworkToast, user, authLoading } = useAppStore();

  useEffect(() => {
    initAppSync();
  }, [initAppSync]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-2.5">
        <Loader2 size={30} className="text-emerald-700 animate-spin" />
        <p className="text-[11px] font-black text-gray-400 tracking-wider uppercase">Validasi Sesi Ruko Cloud...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full relative">
      
      {/* MIKRO-INTERAKSI: FLOATING NETWORK TOAST NOTIFICATION */}
      {networkToast.show && (
        <div className="fixed top-4 inset-x-0 mx-auto z-[9999] px-4 w-full max-w-sm animate-slideDown">
          <div 
            className={`w-full rounded-2xl p-3.5 shadow-xl border flex items-center justify-between gap-3 backdrop-blur-md transition-all ${
              networkToast.type === 'online' 
                ? 'bg-emerald-900/95 border-emerald-500/30 text-emerald-50' 
                : 'bg-gray-900/95 border-gray-700/40 text-gray-100'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div 
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
                  networkToast.type === 'online' 
                    ? 'bg-emerald-500/20 border-emerald-400/20 text-emerald-400' 
                    : 'bg-rose-500/20 border-rose-400/20 text-rose-400 animate-pulse'
                }`}
              >
                {networkToast.type === 'online' ? <Wifi size={14} /> : <WifiOff size={14} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black tracking-tight leading-snug">
                  {networkToast.message}
                </p>
              </div>
            </div>

            <button 
              type="button"
              onClick={closeNetworkToast}
              className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

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
      
      {/* AREA RENDER UTAMA DASHBOARD OPERASIONAL KASIR */}
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

      {/* NAV BAR ASLI (5 MENU) */}
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