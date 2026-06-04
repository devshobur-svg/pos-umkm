import React, { useState, useRef } from 'react';
import { useAppStore } from '../../../store/useStore';
import { convertFileToBase64 } from '../../../utils/imageConverter';
import { Image, Sparkles, PlusCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface AddProductFormProps {
  onSuccess: () => void;
}

export default function AddProductForm({ onSuccess }: AddProductFormProps) {
  const { addProduct } = useAppStore();
  
  // State Input Form sesuai visual Screenshot 2026-06-04 at 21.38.50.png
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState('Minuman');
  const [hargaJual, setHargaJual] = useState('15000');
  const [hargaModal, setHargaModal] = useState('8000');
  const [stok, setStok] = useState('45');
  const [satuan, setSatuan] = useState('Cup');
  const [sku, setSku] = useState('');
  const [image, setImage] = useState('');

  // UX State: Loading Tracker & Toast Notification Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto Generator SKU/Barcode Ruko ringkas
  const handleGenerateSKU = () => {
    if (navigator.vibrate) navigator.vibrate(30);
    const prefix = kategori.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    setSku(`${prefix}${timestamp}`);
  };

  // Handler konversi foto barang via gallery ruko
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const base64Str = await convertFileToBase64(files[0]);
        setImage(base64Str);
      } catch (err) {
        console.error("Gagal memproses gambar:", err);
      }
    }
  };

  // Eksekusi Submit Data dengan Proteksi Submit Ganda
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Skema randomisasi warna background inisial ikon jika gambar kosong
    const colorOptions = [
      'bg-emerald-100 text-emerald-800',
      'bg-blue-100 text-blue-800',
      'bg-amber-100 text-amber-800',
      'bg-purple-100 text-purple-800',
      'bg-rose-100 text-rose-800'
    ];
    const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];

    const safeNewProduct = {
      id: '', // Di-generate otomatis oleh Firebase SDK di store
      sku: sku.trim() || `SKU-${Date.now()}`,
      nama: nama.trim(),
      kategori,
      hargaJual: parseInt(hargaJual) || 0,
      hargaModal: parseInt(hargaModal) || 0,
      stok: parseInt(stok) || 0,
      satuan,
      imageLetter: image || nama.trim().charAt(0).toUpperCase(),
      colorClass: randomColor
    };

    try {
      await addProduct(safeNewProduct);
      
      // Sukses: Nyalakan getaran, toast notifikasi, dan reset isian form
      if (navigator.vibrate) navigator.vibrate([50, 40, 50]);
      setShowToast(true);
      
      // Bersihkan isian input
      setNama('');
      setSku('');
      setImage('');
      
      // Berikan jeda 1.8 detik agar kasir ruko bisa membaca notifikasi sukses sebelum pindah halaman
      setTimeout(() => {
        setShowToast(false);
        onSuccess(); // Otomatis balik ke tab layar daftar stok etalase
      }, 1800);

    } catch (error) {
      console.error(error);
      alert("Gagal menambahkan produk ke cloud database. Periksa koneksi ruko!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto w-full px-1 sm:px-2 relative pb-10">
      
      {/* Toast Notifikasi Berhasil Mengambang Premium */}
      {showToast && (
        <div className="fixed top-6 inset-x-0 mx-auto z-[9999] px-4 w-full max-w-xs animate-bounce">
          <div className="w-full bg-gray-900 border border-gray-800 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-black tracking-tight">Produk Baru Masuk Etalase!</span>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-black text-gray-900">Tambah Produk</h1>
        <p className="text-xs text-gray-500 mt-0.5">Masukkan data inventaris barang baru outlet ruko</p>
      </div>

      {/* BOX CARD CONTAINER UTAMA */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          {/* 1. DROPZONE FOTO GAMBAR PRODUK */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Foto Gambar Produk *</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
              disabled={isSubmitting}
            />
            <div 
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className={`w-full h-36 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50/50 hover:bg-emerald-50/20 transition-colors relative overflow-hidden group ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              {image ? (
                <img src={image} alt="Preview Kulakan" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-1 p-4">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 mx-auto group-hover:text-emerald-600 transition-colors border border-gray-200/60 shadow-inner">
                    <Image size={16} />
                  </div>
                  <p className="text-xs font-black text-gray-700">Pilih Foto Gambar dari Gallery</p>
                  <p className="text-[10px] font-bold text-gray-400">Format PNG, JPG atau JPEG</p>
                </div>
              )}
            </div>
          </div>

          {/* 2. INPUT NAMA PRODUK */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Nama Produk *</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="Contoh: Es Kopi Susu"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500 shadow-inner disabled:bg-gray-100"
            />
          </div>

          {/* 3. SELEKSI KATEGORI MENU */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Kategori</label>
            <select
              value={kategori}
              disabled={isSubmitting}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500 shadow-inner appearance-none disabled:bg-gray-100"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '14px' }}
            >
              <option value="Minuman">Minuman</option>
              <option value="Makanan">Makanan</option>
              <option value="Cemilan">Cemilan</option>
              <option value="Biji Kopi">Biji Kopi / Powder</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* 4. HARGA JUAL & HARGA MODAL */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Harga Jual (Rp) *</label>
              <input
                type="number"
                required
                disabled={isSubmitting}
                value={hargaJual}
                onChange={(e) => setHargaJual(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-emerald-700 outline-none focus:bg-white focus:border-emerald-500 shadow-inner disabled:bg-gray-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Harga Modal (Rp)</label>
              <input
                type="number"
                disabled={isSubmitting}
                value={hargaModal}
                onChange={(e) => setHargaModal(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-emerald-500 shadow-inner disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* 5. JUMLAH STOK & SATUAN */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Jumlah Stok *</label>
              <input
                type="number"
                required
                disabled={isSubmitting}
                value={stok}
                onChange={(e) => setStok(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500 shadow-inner disabled:bg-gray-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Satuan Jual</label>
              <select
                value={satuan}
                disabled={isSubmitting}
                onChange={(e) => setSatuan(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-emerald-500 shadow-inner appearance-none disabled:bg-gray-100"
                style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '14px' }}
              >
                <option value="Cup">Cup</option>
                <option value="Pcs">Pcs</option>
                <option value="Pack">Pack</option>
                <option value="Botol">Botol</option>
                <option value="Porsi">Porsi</option>
              </select>
            </div>
          </div>

          {/* 6. INPUT KODE SKU BARCODE DENGAN GENERATE BUTTON */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Kode SKU / Barcode</label>
            <div className="flex gap-2">
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Contoh: KOPI001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500 shadow-inner disabled:bg-gray-100"
              />
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGenerateSKU}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                <Sparkles size={13} className="text-emerald-600" />
                <span>Generate</span>
              </button>
            </div>
          </div>

          {/* 7. ACTION BUTTON SUBMIT DENGAN ANIMASI LOADER MUTASI */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-700 text-white text-xs font-black py-3.5 rounded-xl shadow-md hover:bg-emerald-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 tracking-wide disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Mendaftarkan ke Etalase...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={15} />
                  <span>Simpan & Masukkan ke Etalase</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}