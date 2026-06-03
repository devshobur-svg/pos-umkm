import React, { useState, useRef } from 'react';
import { useAppStore } from '../../../store/useStore';
import type { Product } from '../../../store/useStore';
import { convertFileToBase64 } from '../../../utils/imageConverter';
import { PlusCircle, CheckCircle, Sparkles, Image, UploadCloud } from 'lucide-react';

interface AddProductFormProps {
  onSuccess: () => void;
}

export default function AddProductForm({ onSuccess }: AddProductFormProps) {
  const { addProduct } = useAppStore();

  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState('Minuman');
  const [hargaJual, setHargaJual] = useState('');
  const [hargaModal, setHargaModal] = useState('');
  const [stok, setStok] = useState('');
  const [satuan, setSatuan] = useState('Cup');
  const [sku, setSku] = useState('');
  
  // State baru untuk menampung data Base64 gambar dari gallery
  const [productImage, setProductImage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pemicu otomatis klik input file tersembunyi
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Handler membaca berkas gambar yang dipilih dari gallery
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const base64String = await convertFileToBase64(files[0]);
        setProductImage(base64String); // Mengunci preview & data string Base64
      } catch (error) {
        console.error("Gagal membaca file gambar gallery: ", error);
      }
    }
  };

  const handleGenerateSKU = () => {
    const prefix = kategori === 'Minuman' ? 'MWN' : kategori === 'Makanan' ? 'MKN' : 'BHN';
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${randomDigits}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let colorClass = 'bg-gray-100 text-gray-800';
    if (kategori === 'Minuman') colorClass = 'bg-amber-100 text-amber-800';
    else if (kategori === 'Makanan') colorClass = 'bg-orange-100 text-orange-800';
    else if (kategori === 'Bahan') colorClass = 'bg-purple-100 text-purple-800';

    const newProduct: Product = {
      id: '',
      sku: sku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      nama: nama.trim(),
      kategori,
      hargaJual: parseInt(hargaJual) || 0,
      hargaModal: parseInt(hargaModal) || 0,
      stok: parseInt(stok) || 0,
      satuan,
      imageLetter: productImage || '📦', // Jika gambar kosong, fallback ke emoji box default
      colorClass
    };

    addProduct(newProduct).then(() => {
      setNama('');
      setHargaJual('');
      setHargaModal('');
      setStok('');
      setSku('');
      setProductImage('');

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onSuccess();
      }, 1500);
    });
  };

  return (
    <div className="space-y-4 animate-fadeIn relative h-full">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tambah Produk</h1>
        <p className="text-xs text-gray-500 mt-0.5">Masukkan data inventaris barang baru outlet ruko</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3.5 max-h-[660px] overflow-y-auto pr-1">
        
        {/* FIELD UNTUK PILIHN GAMBAR DARI GALLERY */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Foto Gambar Produk *</label>
          
          {/* Input File HTML Asli Tersembunyi */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* Kotak Area Upload Interaktif */}
          <div 
            onClick={handleTriggerUpload}
            className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-gray-50 hover:bg-emerald-50/30 hover:border-emerald-300 transition-all cursor-pointer overflow-hidden p-2 group relative"
          >
            {productImage ? (
              // Tampilan Miniatur Preview Foto jika gambar sudah terpilih
              <div className="w-full h-full relative rounded-xl overflow-hidden">
                <img 
                  src={productImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                  <UploadCloud size={14} /> Ganti Foto Gallery
                </div>
              </div>
            ) : (
              // Tampilan Kosong awal penunjuk aksi
              <>
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-400 group-hover:text-emerald-600 transition-colors border border-gray-100">
                  <Image size={18} />
                </div>
                <span className="text-[11px] font-bold text-gray-700 mt-2">Pilih Foto Gambar dari Gallery</span>
                <span className="text-[9px] text-gray-400 font-medium mt-0.5">Format PNG, JPG atau JPEG</span>
              </>
            )}
          </div>
        </div>

        {/* Nama Produk */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nama Produk *</label>
          <input
            type="text"
            required
            placeholder="Contoh: Es Kopi Susu"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 font-semibold outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
          />
        </div>

        {/* Kategori Dropdown */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Kategori</label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 font-semibold outline-none focus:bg-white focus:border-emerald-500 transition-all"
          >
            <option value="Minuman">Minuman</option>
            <option value="Makanan">Makanan</option>
            <option value="Bahan">Bahan / Mentah</option>
          </select>
        </div>

        {/* Grid Harga */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Harga Jual (Rp) *</label>
            <input
              type="number"
              required
              placeholder="15000"
              value={hargaJual}
              onChange={(e) => setHargaJual(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Harga Modal (Rp)</label>
            <input
              type="number"
              placeholder="8000"
              value={hargaModal}
              onChange={(e) => setHargaModal(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Grid Stok */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Jumlah Stok *</label>
            <input
              type="number"
              required
              placeholder="45"
              value={stok}
              onChange={(e) => setStok(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Satuan Jual</label>
            <select
              value={satuan}
              onChange={(e) => setSatuan(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 font-semibold outline-none focus:bg-white focus:border-emerald-500 transition-all"
            >
              <option value="Cup">Cup</option>
              <option value="Pcs">Pcs</option>
              <option value="Botol">Botol</option>
              <option value="Pack">Pack</option>
              <option value="Kotak">Kotak</option>
            </select>
          </div>
        </div>

        {/* SKU Field */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Kode SKU / Barcode</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: KOPI001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 font-semibold outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
            />
            <button
              type="button"
              onClick={handleGenerateSKU}
              className="bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold px-3 rounded-xl flex items-center gap-1 hover:bg-gray-200 active:scale-95 transition-all"
            >
              <Sparkles size={13} className="text-emerald-700" /> Generate
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl shadow-md hover:bg-emerald-800 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <PlusCircle size={16} /> Simpan & Masukkan ke Etalase
        </button>
      </form>

      {showToast && (
        <div className="absolute top-4 inset-x-0 mx-auto max-w-xs bg-gray-900 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xl z-50 animate-bounce">
          <CheckCircle size={16} className="text-emerald-400" />
          <span>Produk Baru Berhasil Ditambahkan!</span>
        </div>
      )}
    </div>
  );
}