import { useState, useEffect } from 'react';
import { LayoutDashboard, Box, PlusCircle, ShoppingCart, Menu, Loader2 } from 'lucide-react';
import { useAppStore } from './store/useStore';
import DashboardScreen from './features/dashboard/screens/DashboardScreen';
import StockScreen from './features/stock/screens/StockScreen';
import PosScreen from './features/transaksi/screens/PosScreen';
import SettingScreen from './features/setting/screens/SettingScreen';
import AddProductForm from './features/stock/components/AddProductForm';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { initAppSync, isLoading } = useAppStore();

  useEffect(() => {
    initAppSync();
  }, []);

  return (
    <div className="min-h-screen bg-gray-800 flex justify-center items-center p-4">
      {/* Container utama simulasi layar HP/PWA */}
      <div className="relative w-full max-w-md h-[844px] bg-gray-50 flex flex-col shadow-2xl rounded-3xl overflow-hidden border border-gray-700">
        
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 bg-white">
            <Loader2 size={32} className="text-emerald-700 animate-spin" />
            <p className="text-xs font-bold text-gray-500 tracking-wide">Menghubungkan ke Cloud Firestore...</p>
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-5 pb-24">
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

        {/* Navigasi Bawah Sticky Bottom Bar */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-20 flex items-center justify-around px-2 pb-2 z-50">
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
            className={`flex flex-col items-center justify-center w-12 h-12 text-emerald-800 -mt-8 bg-emerald-100 rounded-full border-4 border-gray-50 shadow-md active:scale-95 transition-all ${activeTab === 'tambah' ? 'bg-emerald-700 text-white' : ''}`}
          >
            <PlusCircle size={24} />
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('transaksi')}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${activeTab === 'transaksi' ? 'text-emerald-700' : 'text-gray-400'}`}
          >
            <ShoppingCart size={20} />
            <span className="text-[10px] font-semibold mt-1">Transaksi</span>
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
    </div>
  );
}