import { create } from 'zustand';
import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc, 
  onSnapshot
} from 'firebase/firestore';

export interface Product {
  id: string;
  sku: string;
  nama: string;
  kategori: string;
  hargaJual: number;
  hargaModal: number;
  stok: number;
  satuan: string;
  imageLetter: string;
  colorClass: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface PaymentMethod {
  id: string;
  nama: string;
  isActive: boolean;
  details: string;
}

export interface DataPoint {
  label: string;
  value: number;
}

export interface TransactionItem {
  id: string;
  nama: string;
  qty: number;
  harga: number;
}

export interface TransactionDoc {
  id?: string;
  waktuTransaksi: string;
  items: TransactionItem[];
  totalHarga: number;
  totalModal: number;
  labaBersih: number;
  paymentMethod: string;
  uangDiterima: number;
  kembalian: number;
}

export interface DashboardData {
  omzet: number;
  transaksiCount: number;
  labaBersih: number;
  produkTerjualCount: number;
  grafikHari: DataPoint[];
  grafikMinggu: DataPoint[];
  grafikBulan: DataPoint[];
  produkTerlaris: { nama: string; terjual: number }[];
}

interface AppState {
  namaToko: string;
  pemilik: string;
  dashboardData: DashboardData;
  products: Product[];
  cart: CartItem[];
  paymentMethods: PaymentMethod[];
  hariIniTransactions: TransactionDoc[];
  isLoading: boolean;
  initAppSync: () => Promise<void>;
  updateProfile: (namaToko: string, pemilik: string) => Promise<void>;
  togglePaymentMethod: (id: string) => Promise<void>;
  updatePaymentDetails: (id: string, details: string) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updatedData: Partial<Product>) => Promise<void>; // Tambahan fungsi update data produk
  deleteProduct: (id: string) => Promise<void>; // Tambahan fungsi delete produk
  updateStock: (id: string, newStock: number) => Promise<void>;
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, action: 'increase' | 'decrease') => void;
  clearCart: () => void;
  checkout: (paymentMethod: string, uangDiterima: number) => Promise<{ kembalian: number } | string>;
}

export const useAppStore = create<AppState>((set, get) => ({
  namaToko: "Kopi & Roti Mantap",
  pemilik: "Shobur",
  isLoading: true,
  hariIniTransactions: [],
  dashboardData: {
    omzet: 0,
    transaksiCount: 0,
    labaBersih: 0,
    produkTerjualCount: 0,
    grafikHari: [],
    grafikMinggu: [],
    grafikBulan: [],
    produkTerlaris: []
  },
  products: [],
  cart: [],
  paymentMethods: [
    { id: 'tunai', nama: 'Uang Tunai / Cash', isActive: true, details: 'Pembayaran cash langsung' },
    { id: 'qris', nama: 'QRIS Dinamis', isActive: true, details: 'Gopay, OVO, Dana, LinkAja' },
    { id: 'transfer', nama: 'Transfer Bank', isActive: false, details: 'BCA - 1234567890 an Shobur' }
  ],

  initAppSync: async () => {
    set({ isLoading: true });
    const profileRef = doc(db, 'settings', 'profile');
    const dashboardRef = doc(db, 'dashboard', 'summary');
    const paymentSettingsRef = doc(db, 'settings', 'payment_methods');
    const transactionsCollectionRef = collection(db, 'transactions');

    try {
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) {
        await setDoc(profileRef, { namaToko: "Kopi & Roti Mantap", pemilik: "Shobur" });
      }
      const dashboardSnap = await getDoc(dashboardRef);
      if (!dashboardSnap.exists()) {
        await setDoc(dashboardRef, {
          omzet: Number(262000),
          transaksiCount: Number(7),
          labaBersih: Number(90000),
          produkTerjualCount: Number(18),
          grafikHari: [
            { label: '08', value: 10000 },
            { label: '12', value: 25000 },
            { label: '16', value: 75000 },
            { label: '20', value: 152000 }
          ],
          grafikMinggu: [{ label: 'Sen', value: 350000 }, { label: 'Sel', value: 420000 }],
          grafikBulan: [{ label: 'Jun', value: 262000 }],
          produkTerlaris: [{ nama: 'cingcau', terjual: 3 }]
        });
      }
    } catch (e) {
      console.warn("Bootstrap sync passed: ", e);
    }

    onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({ namaToko: data.namaToko, pemilik: data.pemilik });
      }
    });

    onSnapshot(paymentSettingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.methods) set({ paymentMethods: data.methods });
      }
    });

    onSnapshot(transactionsCollectionRef, (querySnapshot) => {
      const listTx: TransactionDoc[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        listTx.push({
          id: doc.id,
          waktuTransaksi: data.waktuTransaksi || '',
          items: data.items || [],
          totalHarga: Number(data.totalHarga || 0),
          totalModal: Number(data.totalModal || 0),
          labaBersih: Number(data.labaBersih || 0),
          paymentMethod: data.paymentMethod || 'tunai',
          uangDiterima: Number(data.uangDiterima || 0),
          kembalian: Number(data.kembalian || 0),
        });
      });
      set({ hariIniTransactions: listTx });
    });

    const productsRef = collection(db, 'products');
    onSnapshot(productsRef, (querySnapshot) => {
      const prodList: Product[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        prodList.push({ 
          id: doc.id, 
          sku: data.sku || '',
          nama: data.nama || 'Produk Tanpa Nama',
          kategori: data.kategori || 'Minuman',
          hargaJual: Number(data.hargaJual || 0), 
          hargaModal: Number(data.hargaModal || 0),
          stok: Number(data.stok || 0),
          satuan: data.satuan || 'Pcs',
          imageLetter: data.imageLetter || '📦',
          colorClass: data.colorClass || 'bg-gray-100 text-gray-800'
        });
      });
      set({ products: prodList });
    });

    onSnapshot(dashboardRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DashboardData;
        set({ 
          dashboardData: {
            omzet: data.omzet || 0,
            transaksiCount: data.transaksiCount || 0,
            labaBersih: data.labaBersih || 0,
            produkTerjualCount: data.produkTerjualCount || 0,
            grafikHari: data.grafikHari || [],
            grafikMinggu: data.grafikMinggu || [],
            grafikBulan: data.grafikBulan || [],
            produkTerlaris: data.produkTerlaris || []
          },
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    }, () => set({ isLoading: false }));
  },

  updateProfile: async (namaToko, pemilik) => {
    const profileRef = doc(db, 'settings', 'profile');
    await setDoc(profileRef, { namaToko, pemilik }, { merge: true });
  },
  
  togglePaymentMethod: async (id) => {
    const updatedMethods = get().paymentMethods.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m);
    set({ paymentMethods: updatedMethods });
    const paymentRef = doc(db, 'settings', 'payment_methods');
    await setDoc(paymentRef, { methods: updatedMethods }, { merge: true });
  },

  updatePaymentDetails: async (id, details) => {
    const updatedMethods = get().paymentMethods.map(m => m.id === id ? { ...m, details } : m);
    set({ paymentMethods: updatedMethods });
    const paymentRef = doc(db, 'settings', 'payment_methods');
    await setDoc(paymentRef, { methods: updatedMethods }, { merge: true });
  },

  addProduct: async (product) => {
    const productRef = doc(collection(db, 'products'));
    const productWithGeneratedId = { 
      ...product, 
      id: productRef.id,
      hargaJual: Number(product.hargaJual),
      hargaModal: Number(product.hargaModal),
      stok: Number(product.stok)
    };
    await setDoc(productRef, productWithGeneratedId);
  },

  // PENANGANAN UPDATE PRODUK KE FIRESTORE
  updateProduct: async (id, updatedData) => {
    const productRef = doc(db, 'products', id);
    const safeData = { ...updatedData };
    if (safeData.hargaJual !== undefined) safeData.hargaJual = Number(safeData.hargaJual);
    if (safeData.hargaModal !== undefined) safeData.hargaModal = Number(safeData.hargaModal);
    if (safeData.stok !== undefined) safeData.stok = Number(safeData.stok);
    
    await updateDoc(productRef, safeData);
  },

  // PENANGANAN HAPUS PRODUK DARI FIRESTORE
  deleteProduct: async (id) => {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
  },
  
  updateStock: async (id, newStock) => {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, { stok: Number(newStock) });
  },
  
  addToCart: (product) => set((state) => {
    if (product.stok <= 0) return {};
    const existingIndex = state.cart.findIndex(item => item.id === product.id);
    if (existingIndex > -1) {
      const newCart = [...state.cart];
      if (newCart[existingIndex].quantity < product.stok) {
        newCart[existingIndex].quantity += 1;
      }
      return { cart: newCart };
    }
    return { cart: [...state.cart, { ...product, quantity: 1 }] };
  }),

  removeFromCart: (id) => set((state) => ({ cart: state.cart.filter(item => item.id !== id) })),

  updateCartQuantity: (id, action) => set((state) => {
    const newCart = state.cart.map((item) => {
      if (item.id === id) {
        const targetProduct = state.products.find(p => p.id === id);
        const maxStock = targetProduct ? targetProduct.stok : item.stok;
        const newQty = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
        if (action === 'increase' && newQty > maxStock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0);
    return { cart: newCart };
  }),

  clearCart: () => set({ cart: [] }),

  checkout: async (paymentMethod, uangDiterima) => {
    const { cart, dashboardData } = get();
    let totalHarga = cart.reduce((sum, item) => sum + (item.hargaJual * item.quantity), 0);
    let totalModal = cart.reduce((sum, item) => sum + (item.hargaModal * item.quantity), 0);
    let totalItemTerjual = cart.reduce((sum, item) => sum + item.quantity, 0);

    const actualUangDiterima = paymentMethod === 'tunai' ? uangDiterima : totalHarga;

    if (actualUangDiterima < totalHarga) {
      return "Uang yang diterima kurang dari total belanjaan!";
    }

    const kembalian = actualUangDiterima - totalHarga;

    const transactionRef = collection(db, 'transactions');
    await addDoc(transactionRef, {
      waktuTransaksi: new Date().toISOString(),
      items: cart.map(i => ({ id: i.id, nama: i.nama, qty: i.quantity, harga: i.hargaJual })),
      totalHarga: Number(totalHarga),
      totalModal: Number(totalModal),
      labaBersih: Number(totalHarga - totalModal),
      paymentMethod,
      uangDiterima: Number(actualUangDiterima),
      kembalian: Number(kembalian)
    });

    for (const item of cart) {
      const productRef = doc(db, 'products', item.id);
      await updateDoc(productRef, {
        stok: Number(Math.max(0, item.stok - item.quantity))
      });
    }

    const currentHour = new Date().getHours();
    let timeLabel = '20';
    if (currentHour < 10) timeLabel = '08';
    else if (currentHour < 14) timeLabel = '12';
    else if (currentHour < 18) timeLabel = '16';

    const updatedGrafikHari = (dashboardData.grafikHari || []).map(p => 
      p.label === timeLabel ? { ...p, value: p.value + totalHarga } : p
    );

    const updatedProdukTerlaris = [...(dashboardData.produkTerlaris || [])];
    cart.forEach(cartItem => {
      const found = updatedProdukTerlaris.find(p => p.nama === cartItem.nama);
      if (found) {
        found.terjual += cartItem.quantity;
      } else {
        updatedProdukTerlaris.push({ nama: cartItem.nama, terjual: cartItem.quantity });
      }
    });

    const dashboardRef = doc(db, 'dashboard', 'summary');
    await setDoc(dashboardRef, {
      omzet: Number(dashboardData.omzet + totalHarga),
      labaBersih: Number(dashboardData.labaBersih + (totalHarga - totalModal)),
      transaksiCount: Number(dashboardData.transaksiCount + 1),
      produkTerjualCount: Number(dashboardData.produkTerjualCount + totalItemTerjual),
      grafikHari: updatedGrafikHari,
      grafikMinggu: dashboardData.grafikMinggu || [],
      grafikBulan: dashboardData.grafikBulan || [],
      produkTerlaris: updatedProdukTerlaris.sort((a,b) => b.terjual - a.terjual).slice(0, 5)
    }, { merge: true });

    set({ cart: [] });
    return { kembalian };
  }
}));