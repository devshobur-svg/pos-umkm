import React, { useState } from 'react';
import { useAppStore } from '../../../store/useStore';
import { ShoppingBag, Plus, Minus, Trash2, CheckCircle2, Wallet, Printer, Loader2 } from 'lucide-react';

export default function PosScreen() {
  const { products, cart, paymentMethods, addToCart, updateCartQuantity, removeFromCart, checkout, namaToko } = useAppStore();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('tunai');
  const [nominalBayar, setNominalBayar] = useState('');
  const [successMessage, setSuccessMessage] = useState<{ kembalian: number; invoiceItems: any[]; total: number; bayar: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // State baru untuk indikator loading proses transaksi kasir
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalBelanja = cart.reduce((sum, item) => sum + ((item.hargaJual || 0) * (item.quantity || 0)), 0);
  const activeMethods = paymentMethods.filter(m => m.isActive);

  // Fungsi Cetak Struk PDF / Thermal Native
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
              width: 72mm; 
              margin: 0; 
              padding: 4mm; 
              font-size: 12px; 
              color: #000;
              line-height: 1.2;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 4mm; font-size: 14px; }
            .divider { border-top: 1px dashed #000; margin: 2mm 0; }
            .item-table { width: 100%; border-collapse: collapse; }
            .item-table td { padding: 0.5mm 0; vertical-align: top; }
            .footer { margin-top: 5mm; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="text-center header">
            <span class="bold">${namaToko}</span><br/>
            <span style="font-size: 10px;">Struk Pembayaran Digital</span>
          </div>
          
          <div style="font-size: 10px;">
            Waktu : ${waktuCetak}<br/>
            Metode: ${invoiceData.method.toUpperCase()}
          </div>
          
          <div class="divider"></div>
          
          <table class="item-table">
            <tbody>
              ${invoiceData.items.map(item => `
                <tr>
                  <td colspan="2" class="bold">${item.nama}</td>
                </tr>
                <tr>
                  <td>${item.qty} x Rp ${item.harga.toLocaleString('id-ID')}</td>
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
          
          <div class="text-center footer">
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
    
    // Aktifkan indikator animasi loading saat klik konfirmasi dimulai
    setIsSubmitting(true);
    
    const cashInput = selectedMethod === 'tunai' ? (parseInt(nominalBayar) || 0) : totalBelanja;
    const itemsSnapshot = cart.map(i => ({ nama: i.nama, qty: i.quantity, harga: i.hargaJual }));

    // Beri sedikit penundaan visual buatan (fake delay 600ms) agar transisi loading terasa smooth bagi user
    setTimeout(() => {
      checkout(selectedMethod, cashInput).then((result) => {
        setIsSubmitting(false); // Matikan loading setelah response database selesai
        
        if (typeof result === 'string') {
          setErrorMessage(result);
        } else {
          const currentInvoice = {
            kembalian: result.kembalian,
            invoiceItems: itemsSnapshot,
            total: totalBelanja,
            bayar: cashInput
          };

          setSuccessMessage(currentInvoice);
          setNominalBayar('');

          handlePrintReceipt({
            items: itemsSnapshot,
            total: totalBelanja,
            bayar: cashInput,
            kembalian: result.kembalian,
            method: selectedMethod
          });
        }
      }).catch((err) => {
        setIsSubmitting(false);
        setErrorMessage("Terjadi kesalahan jaringan Firebase!");
        console.error(err);
      });
    }, 600);
  };

  const closeSuccessPopup = () => {
    setSuccessMessage(null);
    setShowPaymentModal(false);
    setSelectedMethod('tunai');
  };

  return (
    <div className="h-full flex flex-col space-y-4 justify-between animate-fadeIn relative">
      
      {/* 1. Etalase Produk */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[440px]">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mesin Kasir</h1>
          <p className="text-xs text-gray-500 mt-0.5">Pilih item makanan/minuman untuk pesanan baru</p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
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
                className={`flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all text-left ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.99] hover:border-emerald-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base overflow-hidden ${product.colorClass || 'bg-gray-100'}`}>
                    {isBase64Image ? (
                      <img src={product.imageLetter} alt={product.nama} className="w-full h-full object-cover" />
                    ) : (
                      product.imageLetter || '📦'
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">{product.nama || 'Produk'}</h3>
                    <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
                      Rp {hargaTampil.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-semibold bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                    Stok: {product.stok || 0}
                  </span>
                  {inCartItem && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold h-5 px-1.5 rounded-full flex items-center justify-center min-w-[20px]">
                      {inCartItem.quantity}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Panel Ringkasan Keranjang */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg flex flex-col space-y-3 z-20">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <ShoppingBag size={15} className="text-emerald-700" /> Keranjang Belanjaan
          </span>
          <span className="text-[10px] font-bold text-gray-400">{cart.length} Jenis Item</span>
        </div>

        <div className="max-h-32 overflow-y-auto divide-y divide-gray-50 pr-1">
          {cart.length > 0 ? (
            cart.map((item) => {
              const subtotalItem = (item.hargaJual || 0) * (item.quantity || 0);
              return (
                <div key={item.id} className="flex items-center justify-between py-2 first:pt-0">
                  <span className="text-xs font-semibold text-gray-700 truncate max-w-[160px]">{item.nama}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-800">
                      Rp {subtotalItem.toLocaleString('id-ID')}
                    </span>
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                      <button onClick={() => updateCartQuantity(item.id, 'decrease')} className="p-1 hover:bg-white rounded text-gray-500 transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold px-2 text-gray-800">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, 'increase')} className="p-1 hover:bg-white rounded text-gray-500 transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-xs text-gray-400 font-medium">Keranjang masih kosong</div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Total Tagihan</span>
            <p className="text-lg font-black text-emerald-700">Rp {totalBelanja.toLocaleString('id-ID')}</p>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={() => setShowPaymentModal(true)}
            className="bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md hover:bg-emerald-800 active:scale-95 transition-all"
          >
            Proses Bayar
          </button>
        </div>
      </div>

      {/* 3. Modal Popup Slip Pembayaran */}
      {showPaymentModal && (
        <div className="absolute inset-0 bg-gray-900/60 rounded-3xl flex items-end justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full rounded-2xl p-5 space-y-4 shadow-2xl border border-gray-100 mb-2 max-h-[580px] overflow-y-auto">
            
            {!successMessage ? (
              <>
                <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1"><Wallet size={15} className="text-emerald-700" /> Metode Pembayaran</h3>
                  <button 
                    type="button" 
                    disabled={isSubmitting}
                    onClick={() => setShowPaymentModal(false)} 
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    Batal
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {activeMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left flex justify-between items-center transition-all ${isSubmitting ? 'opacity-60' : ''} ${selectedMethod === method.id ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-white text-gray-700'}`}
                    >
                      <span>{method.nama}</span>
                      {selectedMethod === method.id && <div className="w-2 h-2 bg-emerald-600 rounded-full" />}
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-200">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Total Pembayaran</span>
                  <p className="text-xl font-black text-gray-800 mt-0.5">Rp {totalBelanja.toLocaleString('id-ID')}</p>
                </div>

                <form onSubmit={handleProcessCheckout} className="space-y-3">
                  {selectedMethod === 'tunai' ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 block mb-1">Masukkan Uang Cash Diterima (Rp)</label>
                        <input
                          type="number"
                          required
                          disabled={isSubmitting}
                          placeholder="Contoh: 50000"
                          value={nominalBayar}
                          onChange={(e) => setNominalBayar(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 font-bold outline-none focus:border-emerald-500 shadow-sm disabled:bg-gray-100"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button type="button" disabled={isSubmitting} onClick={() => setNominalBayar(totalBelanja.toString())} className="flex-1 bg-gray-100 border border-gray-200 py-1.5 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-40">Uang Pas</button>
                        <button type="button" disabled={isSubmitting} onClick={() => setNominalBayar('50000')} className="flex-1 bg-gray-100 border border-gray-200 py-1.5 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-40">Rp 50k</button>
                        <button type="button" disabled={isSubmitting} onClick={() => setNominalBayar('100000')} className="flex-1 bg-gray-100 border border-gray-200 py-1.5 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-40">Rp 100k</button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-[11px] text-amber-800 font-medium">
                      Detail Akun: <span className="font-bold">{activeMethods.find(m => m.id === selectedMethod)?.details || '-'}</span>
                      <p className="text-[10px] text-gray-400 mt-1">Sistem akan mencatat saldo masuk otomatis senilai uang pas.</p>
                    </div>
                  )}

                  {errorMessage && (
                    <p className="text-[11px] font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{errorMessage}</p>
                  )}

                  {/* BUTTON RE-DESIGN: ANTI DOUBLE CLICK & LOADING ANIMATION */}
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl shadow-md hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 pt-3.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>Memproses Transaksi...</span>
                      </>
                    ) : (
                      <span>Konfirmasi Transaksi Selesai</span>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Transaksi Berhasil Disimpan!</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Metode: <span className="font-bold uppercase text-emerald-700">{selectedMethod}</span></p>
                </div>
                
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">Uang Kembalian Pelanggan</span>
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
                    className="flex-1 bg-white border border-gray-300 text-gray-700 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <Printer size={14} /> Cetak Ulang Struk
                  </button>
                  
                  <button
                    type="button"
                    onClick={closeSuccessPopup}
                    className="flex-1 bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    Buka Transaksi Baru
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