import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/useStore';
import { ShoppingBag, Plus, Minus, Trash2, CheckCircle2, Wallet, Printer, Loader2, QrCode } from 'lucide-react';

export default function PosScreen() {
  const { products, cart, paymentMethods, addToCart, updateCartQuantity, removeFromCart, checkout, namaToko } = useAppStore();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('tunai');
  const [nominalBayar, setNominalBayar] = useState('');
  const [successMessage, setSuccessMessage] = useState<{ kembalian: number; invoiceItems: any[]; total: number; bayar: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ENGINE STATE: Mengamankan status simulasi settlement & hitung mundur QRIS Dinamis
  const [qrisCountdown, setQrisCountdown] = useState(60);
  const [qrisStatus, setQrisStatus] = useState<'IDLE' | 'PENDING_SCAN' | 'SETTLED'>('IDLE');

  const totalBelanja = cart.reduce((sum, item) => sum + ((item.hargaJual || 0) * (item.quantity || 0)), 0);
  const activeMethods = paymentMethods.filter(m => m.isActive);

  // ==========================================
  // REALTIME ENGINE: SINKRONISASI MUTASI QRIS OTOMATIS (AUTO-SETTLEMENT)
  // ==========================================
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    let mockMutationCheck: NodeJS.Timeout;

    if (showPaymentModal && selectedMethod === 'qris' && qrisStatus === 'PENDING_SCAN') {
      // 1. Jalankan hitung mundur masa berlaku QRIS (60 Detik)
      timerInterval = setInterval(() => {
        setQrisCountdown((prev) => {
          if (prev <= 1) {
            setQrisStatus('IDLE');
            setErrorMessage("Waktu pembayaran QRIS habis! Silakan lakukan ulang.");
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      // 2. Simulasi Webhook Mutasi Masuk: Dana Terdeteksi Lunas dalam 6 Detik
      mockMutationCheck = setTimeout(() => {
        setQrisStatus('SETTLED');
        clearInterval(timerInterval);

        const itemsSnapshot = cart.map(i => ({ nama: i.nama, qty: i.quantity, harga: i.hargaJual }));
        
        // Eksekusi checkout otomatis tanpa kasir perlu klik tombol konfirmasi lagi
        checkout('qris', totalBelanja).then((result) => {
          if (typeof result !== 'string') {
            setSuccessMessage({
              kembalian: 0,
              invoiceItems: itemsSnapshot,
              total: totalBelanja,
              bayar: totalBelanja
            });
            
            // 100% CLEAN: Di sini properti 'payar' sudah dibuang total!
            handlePrintReceipt({
              items: itemsSnapshot,
              total: totalBelanja,
              bayar: totalBelanja,
              kembalian: 0,
              method: 'qris'
            });
          }
        });
      }, 6000); 
    }

    return () => {
      clearInterval(timerInterval);
      clearTimeout(mockMutationCheck);
    };
  }, [showPaymentModal, selectedMethod, qrisStatus]);

  // Reset status QRIS apabila kasir berpindah saluran pembayaran di dalam modal
  useEffect(() => {
    if (selectedMethod === 'qris') {
      setQrisStatus('PENDING_SCAN');
      setQrisCountdown(60);
      setErrorMessage('');
    } else {
      setQrisStatus('IDLE');
    }
  }, [selectedMethod]);

  // Fungsi Cetak Struk Thermal Native
  const handlePrintReceipt = (invoiceData: { items: any[]; total: number; bayar: number; kembalian: number; method: string }) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const waktuCetak = new Date().toLocaleString('id-ID');

    const receiptContent = `
      <html>
        <head>
          <title>Struk_${Date.now()}</title>
          <style>
            @page { size: 80mm 200mm; margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 72mm; margin: 0; padding: 4mm; font-size: 12px; color: #000; line-height: 1.2;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 4mm; font-size: 14px; }
            .divider { border-top: 1px dashed #000; margin: 2mm 0; }
            .item-table { width: 100%; border-collapse: collapse; }
            .item-table td { padding: 0.5mm 0; vertical-align: top; }
          </style>
        </head>
        <body>
          <div class="text-center header">
            <span class="bold">${namaToko}</span><br/>
            <span style="font-size: 10px;">Struk Pembayaran Digital</span>
          </div>
          
          <div style="font-size: 10px;">
            Waktu : ${waktuCetak}<br/>
            Metode: ${invoiceData.method.toUpperCase()} (AUTO-SETTLED)
          </div>
          
          <div class="divider"></div>
          
          <table class="item-table">
            <tbody>
              ${invoiceData.items.map(item => `
                <tr>
                  <td colspan="2" class="bold">${item.nama}</td>
                </tr>
                <tr>
                  <td>${item.qty} x Rp ${item.harga ? item.harga.toLocaleString('id-ID') : 0}</td>
                  <td class="text-right">Rp ${(item.harga * item.qty).toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <table class="item-table" style="font-size: 11px;">
            <tr>
              <td class="bold">TOTAL TAGIHAN</td>
              <td class="text-right bold">Rp ${invoiceData.total.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td>DIBAYAR</td>
              <td class="text-right">Rp ${invoiceData.bayar.toLocaleString('id-ID')}</td>
            </tr>
            <tr class="bold">
              <td>KEMBALIAN</td>
              <td class="text-right">Rp ${invoiceData.kembalian.toLocaleString('id-ID')}</td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <div class="text-center" style="font-size: 10px; margin-top: 4mm;">
            Terima Kasih Atas Kunjungan Anda <br/>
            Powered by Wallet Aing POS
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.frameElement.remove(); }, 100);
            };
          </script>
        </body>
      </html>
    `;

    doc.open();
    doc.write(receiptContent);
    doc.close();
  };

  const handleProcessCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    
    const cashInput = parseInt(nominalBayar) || 0;
    const itemsSnapshot = cart.map(i => ({ nama: i.nama, qty: i.quantity, harga: i.hargaJual }));

    checkout('tunai', cashInput).then((result) => {
      setIsSubmitting(false);
      
      if (typeof result === 'string') {
        setErrorMessage(result);
      } else {
        setSuccessMessage({
          kembalian: result.kembalian,
          invoiceItems: itemsSnapshot,
          total: totalBelanja,
          bayar: cashInput
        });
        setNominalBayar('');

        handlePrintReceipt({
          items: itemsSnapshot,
          total: totalBelanja,
          bayar: cashInput,
          kembalian: result.kembalian,
          method: 'tunai'
        });
      }
    }).catch((err) => {
      setIsSubmitting(false);
      setErrorMessage("Terjadi kesalahan jaringan Firebase!");
      console.error(err);
    });
  };

  const closeSuccessPopup = () => {
    setSuccessMessage(null);
    setShowPaymentModal(false);
    setSelectedMethod('tunai');
    setQrisStatus('IDLE');
  };

  return (
    <div className="space-y-5 animate-fadeIn max-w-5xl mx-auto w-full flex flex-col lg:flex-row gap-5 items-start">
      
      {/* Kiri: Daftar Etalase Pilihan Menu Produk ruko */}
      <div className="flex-1 space-y-4 w-full">
        <div>
          <h1 className="text-xl font-black text-gray-900">Mesin Kasir</h1>
          <p className="text-xs text-gray-500 mt-0.5">Pilih item makanan atau minuman di bawah ini untuk memulai pesanan baru</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {products.map((product) => {
            const isOutOfStock = (product.stok || 0) <= 0;
            const inCartItem = cart.find(item => item.id === product.id);
            const hargaTampil = product.hargaJual || 0;
            const isBase64Image = product.imageLetter && product.imageLetter.startsWith('data:image');
            
            return (
              <button
                key={product.id}
                disabled={isOutOfStock}
                onClick={() => addToCart(product)}
                className={`flex items-center justify-between p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all text-left ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.99] hover:border-emerald-300 hover:shadow-md'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg overflow-hidden ${product.colorClass || 'bg-gray-100'}`}>
                    {isBase64Image ? (
                      <img src={product.imageLetter} alt="" className="w-full h-full object-cover" />
                    ) : (
                      product.imageLetter || '📦'
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-gray-800">{product.nama}</h3>
                    <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
                      Rp {hargaTampil.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                    Stok: {product.stok || 0}
                  </span>
                  {inCartItem && (
                    <span className="bg-emerald-600 text-white text-[10px] font-black h-5 px-2 rounded-full flex items-center justify-center min-w-[20px]">
                      {inCartItem.quantity}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kanan: Ringkasan Struk Keranjang Belanjaan */}
      <div className="w-full lg:w-[360px] bg-white rounded-2xl border border-gray-200 p-4 shadow-md flex flex-col space-y-3 shrink-0 lg:sticky lg:top-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
            <ShoppingBag size={15} className="text-emerald-700" /> Detail Pesanan Pelanggan
          </span>
          <span className="text-[10px] bg-gray-100 border text-gray-500 font-bold px-2 py-0.5 rounded-md">{cart.length} Baris</span>
        </div>

        <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 pr-1">
          {cart.length > 0 ? (
            cart.map((item) => {
              const subtotalItem = (item.hargaJual || 0) * (item.quantity || 0);
              return (
                <div key={item.id} className="flex items-center justify-between py-2.5 first:pt-0">
                  <div className="max-w-[160px]">
                    <span className="text-xs font-bold text-gray-700 block truncate">{item.nama}</span>
                    <span className="text-[10px] text-gray-400 font-medium">Rp {item.hargaJual.toLocaleString('id-ID')} / {item.satuan || 'Pcs'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-800 mr-1">
                      Rp {subtotalItem.toLocaleString('id-ID')}
                    </span>
                    <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-200">
                      <button onClick={() => updateCartQuantity(item.id, 'decrease')} className="p-1 hover:bg-white hover:shadow-sm rounded text-gray-500 transition-all">
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-black px-2 text-gray-800">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, 'increase')} className="p-1 hover:bg-white hover:shadow-sm rounded text-gray-500 transition-all">
                        <Plus size={11} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-gray-400 font-medium">Keranjang kosong, silahkan klik menu di kiri</div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-3.5 flex items-center justify-between">
          <div>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Total Tagihan</span>
            <p className="text-xl font-black text-emerald-700 tracking-tight">Rp {totalBelanja.toLocaleString('id-ID')}</p>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={() => setShowPaymentModal(true)}
            className="bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-black px-6 py-3 rounded-xl shadow-md hover:bg-emerald-800 active:scale-95 transition-all"
          >
            Proses Bayar
          </button>
        </div>
      </div>

      {/* ==========================================
          MODAL VIEW: FIXED CENTER DENGAN STRUKTUR 3 KOLOM SIMETRIS
          ========================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl border border-gray-100 animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            {!successMessage ? (
              <>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Wallet size={14} className="text-emerald-700" /> Saluran Pembayaran
                  </h3>
                  <button 
                    type="button" 
                    disabled={isSubmitting}
                    onClick={() => setShowPaymentModal(false)} 
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    Batal
                  </button>
                </div>

                {/* GRID 3 KOLOM HORIZONTAL */}
                <div className="grid grid-cols-3 gap-2">
                  {activeMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-2.5 rounded-xl border text-[11px] font-black text-center transition-all ${selectedMethod === method.id ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      {method.id === 'qris' ? '📲 QRIS' : method.id === 'tunai' ? '💵 Cash' : '💳 Bank'}
                    </button>
                  ))}
                </div>

                {/* CONTAINER KONDISIONAL QRIS ENGINE */}
                {selectedMethod === 'qris' ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center flex flex-col items-center justify-center space-y-3 shadow-inner">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">QRIS Dinamis Otomatis</span>
                    
                    <div className="w-40 h-40 bg-white p-3 rounded-xl border border-slate-200 shadow-md flex items-center justify-center relative overflow-hidden">
                      <QrCode size={135} className={`text-slate-900 ${qrisStatus === 'PENDING_SCAN' ? 'animate-pulse' : ''}`} />
                      
                      {qrisStatus === 'SETTLED' && (
                        <div className="absolute inset-0 bg-emerald-600/95 flex flex-col items-center justify-center text-white font-black animate-fadeIn text-xs gap-1">
                          <CheckCircle2 size={28} className="animate-bounce" />
                          <span>MUTASI LUNAS!</span>
                        </div>
                      )}
                    </div>

                    <div className="text-center space-y-0.5">
                      <p className="text-base font-black text-slate-800">Rp {totalBelanja.toLocaleString('id-ID')}</p>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
                        <Loader2 size={11} className="animate-spin text-purple-600" /> 
                        {qrisStatus === 'PENDING_SCAN' ? `Menunggu scan... (${qrisCountdown}s)` : 'Memproses transaksi...'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3.5 rounded-xl text-center border border-gray-200 shadow-inner">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Total Tagihan Cash</span>
                    <p className="text-xl font-black text-gray-800 mt-0.5">Rp {totalBelanja.toLocaleString('id-ID')}</p>
                  </div>
                )}

                {/* FORM CHECKOUT KHUSUS UANG TUNAI CASH */}
                {selectedMethod === 'tunai' && (
                  <form onSubmit={handleProcessCheckout} className="space-y-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1">Masukkan Uang Cash Diterima (Rp)</label>
                      <input
                        type="number"
                        required
                        disabled={isSubmitting}
                        placeholder="Contoh: 50000"
                        value={nominalBayar}
                        onChange={(e) => setNominalBayar(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 font-bold outline-none focus:border-emerald-500 shadow-sm disabled:bg-gray-100"
                      />
                    </div>

                    <div className="flex gap-1.5">
                      <button type="button" disabled={isSubmitting} onClick={() => setNominalBayar(totalBelanja.toString())} className="flex-1 bg-gray-50 border border-gray-200 py-1.5 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-100 shadow-sm">Uang Pas</button>
                      <button type="button" disabled={isSubmitting} onClick={() => setNominalBayar('50000')} className="flex-1 bg-gray-50 border border-gray-200 py-1.5 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-100 shadow-sm">Rp 50k</button>
                      <button type="button" disabled={isSubmitting} onClick={() => setNominalBayar('100000')} className="flex-1 bg-gray-50 border border-gray-200 py-1.5 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-100 shadow-sm">Rp 100k</button>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl shadow-md hover:bg-emerald-800 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <span>Konfirmasi Transaksi Tunai</span>}
                    </button>
                  </form>
                )}

                {selectedMethod === 'transfer' && (
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-[11px] text-amber-800 font-bold text-center">
                    Rekening Ruko: {activeMethods.find(m => m.id === 'transfer')?.details || '-'}
                  </div>
                )}

                {errorMessage && (
                  <p className="text-[11px] font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 text-center">{errorMessage}</p>
                )}
              </>
            ) : (
              <div className="text-center py-3 space-y-3.5">
                <div className="w-11 h-11 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Transaksi Sukses Disimpan!</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Saluran: <span className="font-bold uppercase text-emerald-700">{selectedMethod}</span></p>
                </div>
                
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl shadow-inner">
                  <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider block">Uang Kembalian Pelanggan</span>
                  <p className="text-lg font-black text-emerald-800 mt-0.5">Rp {(successMessage.kembalian || 0).toLocaleString('id-ID')}</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handlePrintReceipt({
                      items: successMessage.invoiceItems,
                      total: successMessage.total,
                      bayar: successMessage.bayar,
                      kembalian: successMessage.kembalian,
                      method: selectedMethod
                    })}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <Printer size={13} /> Re-Cetak Struk
                  </button>
                  
                  <button
                    type="button"
                    onClick={closeSuccessPopup}
                    className="flex-1 bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-all"
                  >
                    Transaksi Baru
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}