import React, { useState, useRef } from 'react';
import { useAppStore } from '../../../store/useStore';
import type { Product } from '../../../store/useStore';
import { convertFileToBase64 } from '../../../utils/imageConverter';
import { Search, Edit3, Trash2, X, CheckCircle, Image, Loader2 } from 'lucide-react';

export default function StockScreen() {
  const { products, updateProduct, deleteProduct } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'semua' | 'menipis' | 'habis'>('semua');

  // State Editor Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editHargaJual, setEditHargaJual] = useState('');
  const [editHargaModal, setEditHargaModal] = useState('');
  const [editStok, setEditStok] = useState('');
  const [editSatuan, setEditSatuan] = useState('Cup');
  const [editImage, setEditImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter(product => {
    const namaProduk = product.nama || '';
    const skuProduk = product.sku || '';
    const matchesSearch = namaProduk.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          skuProduk.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    const qtyStok = product.stok || 0;
    if (activeFilter === 'menipis') return qtyStok > 0 && qtyStok <= 10;
    if (activeFilter === 'habis') return qtyStok === 0;
    return true;
  });

  // Fungsi memicu pembukaan Modal Editor
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditNama(product.nama);
    setEditHargaJual(product.hargaJual.toString());
    setEditHargaModal(product.hargaModal.toString());
    setEditStok(product.stok.toString());
    setEditSatuan(product.satuan || 'Pcs');
    setEditImage(product.imageLetter || '');
  };

  // Handler pergantian foto editor via gallery
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const base64Str = await convertFileToBase64(files[0]);
        setEditImage(base64Str);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Eksekusi Update ke Firestore
  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSubmitting(true);
    updateProduct(editingProduct.id, {
      nama: editNama.trim(),
      hargaJual: parseInt(editHargaJual) || 0,
      hargaModal: parseInt(editHargaModal) || 0,
      stok: parseInt(editStok) || 0,
      satuan: editSatuan,
      imageLetter: editImage
    }).then(() => {
      setIsSubmitting(false);
      setEditingProduct(null);
      triggerToast('Produk Berhasil Diperbarui!');
    });
  };

  // Eksekusi Hapus dari Firestore
  const handleDeleteClick = (id: string) => {
    if (window.confirm("Apakah kamu yakin ingin menghapus produk ini dari etalase ruko?")) {
      deleteProduct(id).then(() => {
        triggerToast('Produk Telah Dihapus!');
      });
    }
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(''), 1500);
  };

  return (
    <div className="space-y-4 animate-fadeIn relative">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Stock</h1>
        <p className="text-xs text-gray-500 mt-0.5">Pantau stok & pergerakan barang ruko</p>
      </div>

      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Cari produk berdasarkan nama atau SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-emerald-500 transition-colors shadow-sm"
        />
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-500">
        <button type="button" onClick={() => setActiveFilter('semua')} className={`flex-1 py-2 text-center rounded-lg transition-all ${activeFilter === 'semua' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-gray-700'}`}>Semua</button>
        <button type="button" onClick={() => setActiveFilter('menipis')} className={`flex-1 py-2 text-center rounded-lg transition-all ${activeFilter === 'menipis' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-gray-700'}`}>Stok Menipis</button>
        <button type="button" onClick={() => setActiveFilter('habis')} className={`flex-1 py-2 text-center rounded-lg transition-all ${activeFilter === 'habis' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-gray-700'}`}>Habis</button>
      </div>

      {/* LIST PRODUK DENGAN TOMBOL AKSI MANAJEMEN */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const qtyStok = product.stok || 0;
            const isHabis = qtyStok === 0;
            const isMenipis = qtyStok > 0 && qtyStok <= 10;
            const isBase64Image = product.imageLetter && product.imageLetter.startsWith('data:image');

            return (
              <div key={product.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg overflow-hidden ${product.colorClass || 'bg-gray-100'}`}>
                    {isBase64Image ? <img src={product.imageLetter} alt="" className="w-full h-full object-cover" /> : product.imageLetter || '📦'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">{product.nama}</h3>
                    <p className="text-[10px] text-gray-400 font-medium">SKU: {product.sku || '-'}</p>
                    <p className="text-[11px] font-bold text-emerald-700 mt-0.5">Rp {product.hargaJual.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Status Stok */}
                  <div className="text-right flex flex-col items-end min-w-[65px]">
                    <span className="text-[9px] text-gray-400 font-bold uppercase">{product.satuan || 'Pcs'}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${isHabis ? 'bg-red-50 text-red-600 border border-red-100' : isMenipis ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                      {isHabis ? 'Habis' : isMenipis ? `Sisa ${qtyStok}` : `Stok ${qtyStok}`}
                    </span>
                  </div>

                  {/* TOMBOL AKSI: EDIT & DELETE */}
                  <div className="flex items-center gap-1.5 border-l border-gray-100 pl-3">
                    <button 
                      onClick={() => handleOpenEdit(product)}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Edit Produk"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(product.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Hapus Produk"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-gray-400 font-medium">Tidak ada produk ditemukan.</div>
        )}
      </div>

      {/* ==========================================
          MODAL INLINE POP-UP EDITOR PRODUK
          ========================================== */}
      {editingProduct && (
        <div className="absolute inset-x-0 -top-4 bottom-0 bg-gray-900/60 rounded-3xl flex items-end justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full rounded-2xl p-5 space-y-4 shadow-2xl border border-gray-100 max-h-[620px] overflow-y-auto mb-2">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Edit Data Produk</h3>
                <p className="text-[10px] text-gray-400 font-medium">SKU Terkunci: {editingProduct.sku}</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3.5 text-left">
              {/* Edit Gambar */}
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Foto Produk</label>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 hover:bg-emerald-50/20 cursor-pointer overflow-hidden relative"
                >
                  {editImage && editImage.startsWith('data:image') ? (
                    <img src={editImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-400 text-[10px] font-bold flex flex-col items-center gap-1">
                      <Image size={16} /> Ganti Gambar Gallery
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Nama */}
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Nama Produk *</label>
                <input type="text" required value={editNama} onChange={(e) => setEditNama(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500" />
              </div>

              {/* Edit Jual & Modal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Harga Jual (Rp) *</label>
                  <input type="number" required value={editHargaJual} onChange={(e) => setEditHargaJual(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 outline-none focus:bg-white focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Harga Modal (Rp)</label>
                  <input type="number" value={editHargaModal} onChange={(e) => setEditHargaModal(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-emerald-500" />
                </div>
              </div>

              {/* Edit Stok & Satuan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Jumlah Stok *</label>
                  <input type="number" required value={editStok} onChange={(e) => setEditStok(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Satuan Jual</label>
                  <select value={editSatuan} onChange={(e) => setEditSatuan(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-emerald-500">
                    <option value="Cup">Cup</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Pack">Pack</option>
                    <option value="Botol">Botol</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1 pt-3"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Simpan Pembaruan Data"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {showToast && (
        <div className="absolute top-4 inset-x-0 mx-auto max-w-xs bg-gray-900 text-white text-[11px] font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xl z-50 animate-bounce">
          <CheckCircle size={14} className="text-emerald-400" />
          <span>{showToast}</span>
        </div>
      )}
    </div>
  );
}