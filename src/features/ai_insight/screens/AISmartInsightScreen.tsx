import { useAppStore } from '../../../store/useStore';
import { BrainCircuit, AlertTriangle, CheckCircle, HelpCircle, Sparkles, TrendingUp, ShieldAlert, ArrowRight } from 'lucide-react';

export default function AISmartInsightScreen() {
  const { getAIPredictiveStock, getAIMarginInsights } = useAppStore();

  const aiStockList = getAIPredictiveStock();
  const aiMarginList = getAIMarginInsights();

  // Hitung berapa menu item ruko yang kritis terancam habis dalam waktu dekat
  const totalKritisCount = aiStockList.filter(i => i.statusKritis === 'KRITIS' || i.statusKritis === 'PERINGATAN').length;

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto w-full px-2">
      
      {/* Banner Utama */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 text-white p-5 rounded-2xl shadow-md flex items-center justify-between border border-indigo-700/30">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-purple-500/20 border border-purple-400/30 px-2.5 py-0.5 rounded-md text-purple-300 text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={11} /> AI Predictive Engine Active
          </div>
          <h2 className="text-xl font-black tracking-tight">Kecerdasan Bisnis Ruko 📊</h2>
          <p className="text-xs text-indigo-200/90">Analisis otomatis kecepatan perputaran stok barang dan pengoptimalan margin laba bersih.</p>
        </div>
        <BrainCircuit size={45} className="text-purple-400 opacity-80 hidden sm:block animate-pulse" />
      </div>

      {/* GRID ENGINE UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* PANEL 1 & 2: REKOMENDASI KULAKAN BARANG (ESTIMASI SISA HARI AKTIF) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                <ShieldAlert size={15} className="text-purple-700" /> Analisis Kecepatan & Prediksi Stok
              </h3>
              <p className="text-[10px] text-gray-400 font-medium">Prediksi sisa hari sebelum barang ruko habis total</p>
            </div>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${totalKritisCount > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-700'}`}>
              {totalKritisCount > 0 ? `⚠️ ${totalKritisCount} Item Perlu Kulakan` : '✓ Semua Stok Aman'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50/70">
                  <th className="py-2.5 px-2">Nama Produk</th>
                  <th className="py-2.5 px-2 text-center">Stok</th>
                  <th className="py-2.5 px-2 text-center">Laju / Hari</th>
                  <th className="py-2.5 px-2 text-center">Sisa Hari</th>
                  <th className="py-2.5 px-2 text-right">Saran Belanja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                {aiStockList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="py-3 px-2 font-bold text-gray-800">{item.nama}</td>
                    <td className="py-3 px-2 text-center text-gray-500">{item.sisaStok} {item.satuan}</td>
                    <td className="py-3 px-2 text-center text-purple-700 font-black">{item.avgTerjualPerHari}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        item.statusKritis === 'KRITIS' ? 'bg-red-50 text-red-600 border border-red-100' :
                        item.statusKritis === 'PERINGATAN' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {item.estimasiHariHabis === 0 ? 'Habis total' : item.estimasiHariHabis === 999 ? '∞ Aman' : `${item.estimasiHariHabis} Hari Lagi`}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-black">
                      {item.rekomendasiOrder > 0 ? (
                        <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 inline-flex items-center gap-1 text-[10px] animate-bounce">
                          Beli +{item.rekomendasiOrder} Pcs <ArrowRight size={10} />
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-normal text-[11px]">Belum perlu</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL 3: MATRIX STRATEGIS KUADRAN LABA RUKO */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-2.5">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
              <TrendingUp size={15} className="text-indigo-700" /> Smart Margin Insight
            </h3>
            <p className="text-[10px] text-gray-400 font-medium">Matriks pengoptimalan laba bersih produk</p>
          </div>

          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
            {aiMarginList.length > 0 ? (
              aiMarginList.map((item, idx) => {
                const isStar = item.kuadranStatus.startsWith('STAR');
                const isCow = item.kuadranStatus.startsWith('CASH COW');
                const isBooster = item.kuadranStatus.startsWith('VOLUME BOOSTER');

                return (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 space-y-2 hover:border-indigo-200 transition-all group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-gray-800 group-hover:text-indigo-900 transition-colors">{item.nama}</h4>
                        <span className="text-[8px] text-gray-400 font-bold block uppercase mt-0.5">Kontribusi Laba: {item.kontribusiPersen}%</span>
                      </div>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                        isStar ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        isCow ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isBooster ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.kuadranStatus.split(' ')[0]}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-500 leading-relaxed italic bg-white p-2 rounded-lg border border-gray-100 font-medium">
                      💡 {item.rekomendasiStrategi}
                    </p>

                    <div className="flex justify-between text-[10px] font-bold text-gray-400 pt-0.5">
                      <span>Keluar: <span className="text-gray-700 font-extrabold">{item.totalQtyTerjual} Pcs</span></span>
                      <span>Margin: <span className="text-emerald-700 font-extrabold">Rp {item.totalProfitBersih.toLocaleString('id-ID')}</span></span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-xs text-gray-400 py-16">Belum ada kompilasi data keuntungan finansial ruko.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}