import { create } from 'zustand';
import { db, auth } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc, 
  onSnapshot,
  query,     
  where      
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

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
  ownerId?: string; 
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
  kasirId: string;
  ownerId?: string; 
}

export interface DashboardSummary {
  omzet: number;
  transaksiCount: number;
  labaBersih: number;
  produkTerjualCount: number;
  grafikHari: DataPoint[];
  produkTerlaris: { nama: string; terjual: number }[];
}

export interface AIPredictionItem {
  id: string;
  nama: string;
  sisaStok: number;
  satuan: string;
  avgTerjualPerHari: number;
  estimasiHariHabis: number;
  rekomendasiOrder: number;
  statusKritis: 'AMAN' | 'PERINGATAN' | 'KRITIS';
}

export interface AIMarginInsight {
  nama: string;
  totalQtyTerjual: number;
  totalProfitBersih: number;
  kontribusiPersen: number;
  kuadranStatus: 'STAR (Laris & Untung Gede)' | 'CASH COW (Untung Gede tapi Slow)' | 'VOLUME BOOSTER (Laris tapi Tipis)' | 'SLOW MOVER (Kurang Peminat)';
  rekomendasiStrategi: string;
}

export interface NetworkToastState {
  show: boolean;
  type: 'online' | 'offline' | 'idle';
  message: string;
}

interface AppState {
  user: any | null;       
  authLoading: boolean;   
  namaToko: string;
  kasirAktif: string;
  daftarKasir: string[];
  products: Product[];
  cart: CartItem[];
  paymentMethods: PaymentMethod[];
  allTransactions: TransactionDoc[];
  isLoading: boolean;
  isOnline: boolean;
  networkToast: NetworkToastState;
  closeNetworkToast: () => void;
  initAppSync: () => Promise<void>;
  logoutUser: () => Promise<void>; 
  setKasirAktif: (namaKasir: string) => void;
  addKasirDinamis: (namaKasir: string) => Promise<void>;
  getComputedDashboard: () => DashboardSummary;
  getAIPredictiveStock: () => AIPredictionItem[];
  getAIMarginInsights: () => AIMarginInsight[];
  updateProfile: (namaToko: string) => Promise<void>;
  togglePaymentMethod: (id: string) => Promise<void>;
  updatePaymentDetails: (id: string, details: string) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updatedData: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (id: string, newStock: number) => Promise<void>;
  resetDataToko: () => Promise<void>;
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, action: 'increase' | 'decrease') => void;
  clearCart: () => void;
  checkout: (paymentMethod: string, uangDiterima: number) => Promise<{ kembalian: number } | string>;
  syncOfflineTransactions: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  authLoading: true,
  namaToko: "POS UMKM",
  kasirAktif: "Shobur",
  daftarKasir: ["Shobur"],
  isLoading: true,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  allTransactions: [],
  products: [],
  cart: [],
  paymentMethods: [
    { id: 'tunai', nama: 'Uang Tunai / Cash', isActive: true, details: 'Pembayaran cash langsung' },
    { id: 'qris', nama: 'QRIS Dinamis', isActive: true, details: 'Gopay, OVO, Dana, LinkAja' },
    { id: 'transfer', nama: 'Transfer Bank', isActive: false, details: 'BCA - 1234567890' }
  ],
  networkToast: { show: false, type: 'idle', message: '' },

  closeNetworkToast: () => set({ networkToast: { show: false, type: 'idle', message: '' } }),

  initAppSync: async () => {
    if (typeof window !== 'undefined' && (window as any)._networkListenersAttached !== true) {
      (window as any)._networkListenersAttached = true;
      
      window.addEventListener('online', () => {
        if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
        set({ isOnline: true, networkToast: { show: true, type: 'online', message: '✨ Kembali Online! Sinkronisasi cloud ruko berhasil diselaraskan.' } });
        get().syncOfflineTransactions();
        setTimeout(() => get().closeNetworkToast(), 3500);
      });

      window.addEventListener('offline', () => {
        if (navigator.vibrate) navigator.vibrate(120);
        set({ isOnline: false, networkToast: { show: true, type: 'offline', message: '⚠️ Sinyal Putus. Sistem otomatis mengaktifkan mode kebal offline!' } });
      });
    }

    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        set({ user: null, authLoading: false, products: [], allTransactions: [], isLoading: false });
        return;
      }

      const userId = currentUser.uid;
      set({ user: currentUser, authLoading: false, isLoading: true });

      const profileRef = doc(db, 'settings', `profile_${userId}`);
      const cashiersRef = doc(db, 'settings', `cashiers_${userId}`);
      const paymentSettingsRef = doc(db, 'settings', `payment_methods_${userId}`);

      try {
        const profileSnap = await getDoc(profileRef);
        if (!profileSnap.exists()) {
          // FIXED WORDING: Default baru saat ruko mendaftar workspace cloud pertama kali
          await setDoc(profileRef, { namaToko: "Outlet POS UMKM" });
        }
        const cashiersSnap = await getDoc(cashiersRef);
        if (!cashiersSnap.exists()) {
          await setDoc(cashiersRef, { list: ["Owner"] });
        }
      } catch (e) {
        console.warn("Bootstrap workspace data ready");
      }

      onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) set({ namaToko: docSnap.data().namaToko });
      });

      onSnapshot(cashiersRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().list) {
          const listKasir = docSnap.data().list;
          set({ daftarKasir: listKasir, kasirAktif: listKasir[0] || 'Owner' });
        }
      });

      onSnapshot(paymentSettingsRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().methods) set({ paymentMethods: docSnap.data().methods });
      });

      const transactionsQuery = query(collection(db, 'transactions'), where('ownerId', '==', userId));
      onSnapshot(transactionsQuery, (querySnapshot) => {
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
            kasirId: data.kasirId || 'Owner',
            ownerId: data.ownerId
          });
        });
        const localQueue = JSON.parse(localStorage.getItem(`offline_tx_queue_${userId}`) || '[]');
        set({ allTransactions: [...localQueue, ...listTx], isLoading: false });
      }, () => {
        const localQueue = JSON.parse(localStorage.getItem(`offline_tx_queue_${userId}`) || '[]');
        set({ allTransactions: localQueue, isLoading: false });
      });

      const productsQuery = query(collection(db, 'products'), where('ownerId', '==', userId));
      onSnapshot(productsQuery, (querySnapshot) => {
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
            colorClass: data.colorClass || 'bg-gray-100 text-gray-800',
            ownerId: data.ownerId
          });
        });
        set({ products: prodList });
      });

      get().syncOfflineTransactions();
    });
  },

  logoutUser: async () => {
    set({ isLoading: true });
    await signOut(auth);
  },

  setKasirAktif: (namaKasir) => set({ kasirAktif: namaKasir }),

  addKasirDinamis: async (namaKasir) => {
    const bersihNama = namaKasir.trim();
    if (!bersihNama) return;
    const { daftarKasir, user } = get();
    if (!user) return;
    if (daftarKasir.includes(bersihNama)) return;
    const barulist = [...daftarKasir, bersihNama];
    set({ daftarKasir: barulist });
    await setDoc(doc(db, 'settings', `cashiers_${user.uid}`), { list: barulist }, { merge: true });
  },

  getAIPredictiveStock: () => {
    const { allTransactions, products } = get();
    let jumlahHariOperasional = 1;
    if (allTransactions.length > 1) {
      const times = allTransactions.map(t => new Date(t.waktuTransaksi).getTime());
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const diffDays = Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24));
      jumlahHariOperasional = diffDays > 0 ? diffDays : 1;
    }

    const itemQtyMap: { [key: string]: number } = {};
    allTransactions.forEach(tx => {
      if (tx.items) {
        tx.items.forEach(it => {
          itemQtyMap[it.nama] = (itemQtyMap[it.nama] || 0) + it.qty;
        });
      }
    });

    return products.map(product => {
      const totalTerjual = itemQtyMap[product.nama] || 0;
      const avgTerjualPerHari = Number((totalTerjual / jumlahHariOperasional).toFixed(2));
      
      let estimasiHariHabis = 999;
      if (avgTerjualPerHari > 0) {
        estimasiHariHabis = Number((product.stok / avgTerjualPerHari).toFixed(1));
      } else if (product.stok === 0) {
        estimasiHariHabis = 0;
      }

      let rekomendasiOrder = 0;
      if (estimasiHariHabis <= 3) {
        rekomendasiOrder = Math.max(Math.ceil(avgTerjualPerHari * 14) - product.stok, 10);
      }

      let statusKritis: 'AMAN' | 'PERINGATAN' | 'KRITIS' = 'AMAN';
      if (estimasiHariHabis <= 1.5) statusKritis = 'KRITIS';
      else if (estimasiHariHabis <= 4) statusKritis = 'PERINGATAN';

      return {
        id: product.id,
        nama: product.nama,
        sisaStok: product.stok,
        satuan: product.satuan || 'Pcs',
        avgTerjualPerHari,
        estimasiHariHabis,
        rekomendasiOrder,
        statusKritis
      };
    }).sort((a,b) => a.estimasiHariHabis - b.estimasiHariHabis);
  },

  getAIMarginInsights: () => {
    const { allTransactions, products } = get();
    const productSalesMap: { [key: string]: { qty: number; profit: number } } = {};
    let totalProfitRuko = 0;

    allTransactions.forEach(tx => {
      if (tx.items) {
        tx.items.forEach(item => {
          const original = products.find(p => p.nama === item.nama || p.id === item.id);
          const modalSatuan = original ? original.hargaModal : Math.round(item.harga * 0.5);
          const untungSatuan = item.harga - modalSatuan;
          const untungTotalNotaItem = untungSatuan * item.qty;

          totalProfitRuko += untungTotalNotaItem;

          if (productSalesMap[item.nama]) {
            productSalesMap[item.nama].qty += item.qty;
            productSalesMap[item.nama].profit += untungTotalNotaItem;
          } else {
            productSalesMap[item.nama] = { qty: item.qty, profit: untungTotalNotaItem };
          }
        });
      }
    });

    const arraySales = Object.values(productSalesMap);
    const avgQty = arraySales.length > 0 ? arraySales.reduce((s, i) => s + i.qty, 0) / arraySales.length : 5;
    const avgProfit = arraySales.length > 0 ? arraySales.reduce((s, i) => s + i.profit, 0) / arraySales.length : 50000;

    return Object.keys(productSalesMap).map(nama => {
      const sales = productSalesMap[nama];
      const kontribusiPersen = totalProfitRuko > 0 ? Number(((sales.profit / totalProfitRuko) * 100).toFixed(1)) : 0;
      
      let kuadranStatus: AIMarginInsight['kuadranStatus'] = 'SLOW MOVER (Kurang Peminat)';
      let rekomendasiStrategi = "Promosikan bundle item atau pertimbangkan eliminasi menu.";

      if (sales.qty >= avgQty && sales.profit >= avgProfit) {
        kuadranStatus = 'STAR (Laris & Untung Gede)';
        rekomendasiStrategi = "Pertahankan kualitas ketersediaan stok! Jadikan ikon utama iklan tokomu.";
      } else if (sales.qty < avgQty && sales.profit >= avgProfit) {
        kuadranStatus = 'CASH COW (Untung Gede tapi Slow)';
        rekomendasiStrategi = "Gencarkan diskon komplementer atau turunkan sedikit harga biar volume melesat naik.";
      } else if (sales.qty >= avgQty && sales.profit < avgProfit) {
        kuadranStatus = 'VOLUME BOOSTER (Laris tapi Tipis)';
        rekomendasiStrategi = "Naikkan harga jual pelan-pelan atau nego ulang ke supplier untuk memotong harga modal.";
      }

      return {
        nama,
        totalQtyTerjual: sales.qty,
        totalProfitBersih: sales.profit,
        kontribusiPersen,
        kuadranStatus,
        rekomendasiStrategi
      };
    }).sort((a,b) => b.totalProfitBersih - a.totalProfitBersih);
  },

  getComputedDashboard: () => {
    const { allTransactions, kasirAktif } = get();
    const txKasir = allTransactions.filter(tx => tx.kasirId === kasirAktif);

    let omzet = 0;
    let labaBersih = 0;
    let produkTerjualCount = 0;
    const jamMap: { [key: string]: number } = { '08': 0, '12': 0, '16': 0, '20': 0 };
    const larisMap: { [key: string]: number } = {};

    txKasir.forEach(tx => {
      omzet += tx.totalHarga;
      labaBersih += tx.labaBersih;
      try {
        const jam = new Date(tx.waktuTransaksi).getHours();
        let label = '20';
        if (jam < 10) label = '08';
        else if (jam < 14) label = '12';
        else if (jam < 18) label = '16';
        jamMap[label] += tx.totalHarga;
      } catch (e) {}

      if (tx.items) {
        tx.items.forEach(item => {
          produkTerjualCount += item.qty;
          larisMap[item.nama] = (larisMap[item.nama] || 0) + item.qty;
        });
      }
    });

    return {
      omzet,
      transaksiCount: txKasir.length,
      labaBersih,
      produkTerjualCount,
      grafikHari: Object.keys(jamMap).map(k => ({ label: k, value: jamMap[k] })),
      produkTerlaris: Object.keys(larisMap).map(k => ({ nama: k, terjual: larisMap[k] })).sort((a,b) => b.terjual - a.terjual).slice(0, 5)
    };
  },

  updateProfile: async (namaToko) => {
    const { user } = get();
    if (!user) return;
    await setDoc(doc(db, 'settings', `profile_${user.uid}`), { namaToko }, { merge: true });
  },

  resetDataToko: async () => {
    const { allTransactions, user } = get();
    if (!user) return;
    localStorage.removeItem(`offline_tx_queue_${user.uid}`);
    await Promise.all(allTransactions.map(t => t.id ? deleteDoc(doc(doc(db, 'transactions', t.id).path)) : Promise.resolve()));
    set({ cart: [] });
  },
  
  togglePaymentMethod: async (id) => {
    const { user, paymentMethods } = get();
    if (!user) return;
    const updated = paymentMethods.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m);
    set({ paymentMethods: updated });
    await setDoc(doc(db, 'settings', `payment_methods_${user.uid}`), { methods: updated }, { merge: true });
  },

  updatePaymentDetails: async (id, details) => {
    const { user, paymentMethods } = get();
    if (!user) return;
    const updated = paymentMethods.map(m => m.id === id ? { ...m, details } : m);
    set({ paymentMethods: updated });
    await setDoc(doc(db, 'settings', `payment_methods_${user.uid}`), { methods: updated }, { merge: true });
  },

  addProduct: async (product) => {
    const { user } = get();
    if (!user) return;
    try {
      const productsCollectionRef = collection(db, 'products');
      const newProductDocRef = doc(productsCollectionRef);
      const { id, ...pureProductData } = product;
      
      const safeProductWithGeneratedId = { 
        ...pureProductData, 
        id: newProductDocRef.id,
        hargaJual: Number(product.hargaJual || 0),
        hargaModal: Number(product.hargaModal || 0),
        stok: Number(product.stok || 0),
        sku: product.sku ? product.sku.trim() : `SKU-${Date.now()}`,
        ownerId: user.uid 
      };
      await setDoc(newProductDocRef, safeProductWithGeneratedId);
    } catch (error) {
      console.error("Gagal menambahkan produk:", error);
      throw error;
    }
  },

  updateProduct: async (id, data) => { await updateDoc(doc(db, 'products', id), data); },
  deleteProduct: async (id) => { await deleteDoc(doc(db, 'products', id)); },
  updateStock: async (id: string, newStock: number) => { await updateDoc(doc(db, 'products', id), { stok: Number(newStock) }); },
  
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
    const { cart, kasirAktif, isOnline, products, user } = get();
    if (!user) return "User belum login!";
    
    let totalHarga = cart.reduce((sum, item) => sum + (item.hargaJual * item.quantity), 0);
    let totalModal = cart.reduce((sum, item) => sum + (item.hargaModal * item.quantity), 0);

    const actualUangDiterima = paymentMethod === 'tunai' ? uangDiterima : totalHarga;
    if (actualUangDiterima < totalHarga) return "Uang yang diterima kurang!";
    const kembalian = actualUangDiterima - totalHarga;

    const newTxDoc: TransactionDoc = {
      waktuTransaksi: new Date().toISOString(),
      items: cart.map(i => ({ id: i.id, nama: i.nama, qty: i.quantity, harga: i.hargaJual })),
      totalHarga: Number(totalHarga),
      totalModal: Number(totalModal),
      labaBersih: Number(totalHarga - totalModal),
      paymentMethod,
      uangDiterima: Number(actualUangDiterima),
      kembalian: Number(kembalian),
      kasirId: kasirAktif,
      ownerId: user.uid 
    };

    if (!isOnline) {
      const q = JSON.parse(localStorage.getItem(`offline_tx_queue_${user.uid}`) || '[]');
      localStorage.setItem(`offline_tx_queue_${user.uid}`, JSON.stringify([newTxDoc, ...q]));
      set({ products: products.map(p => { const c = cart.find(i => i.id === p.id); return c ? { ...p, stok: Math.max(0, p.stok - c.quantity) } : p; }), cart: [] });
      return { kembalian };
    }

    try {
      await addDoc(collection(db, 'transactions'), newTxDoc);
      for (const item of cart) { await updateDoc(doc(db, 'products', item.id), { stok: Number(Math.max(0, item.stok - item.quantity)) }); }
      set({ cart: [] });
      return { kembalian };
    } catch {
      const q = JSON.parse(localStorage.getItem(`offline_tx_queue_${user.uid}`) || '[]');
      localStorage.setItem(`offline_tx_queue_${user.uid}`, JSON.stringify([newTxDoc, ...q]));
      set({ cart: [] });
      return { kembalian };
    }
  },

  syncOfflineTransactions: async () => {
    const { isOnline, user } = get();
    if (!isOnline || !user) return;
    const q: TransactionDoc[] = JSON.parse(localStorage.getItem(`offline_tx_queue_${user.uid}`) || '[]');
    if (q.length === 0) return;
    const ref = collection(db, 'transactions');
    for (let i = q.length - 1; i >= 0; i--) {
      try {
        await addDoc(ref, q[i]);
        for (const it of q[i].items) {
          const pRef = doc(db, 'products', it.id);
          const sn = await getDoc(pRef);
          if (sn.exists()) await updateDoc(pRef, { stok: Math.max(0, Number(sn.data().stok || 0) - it.qty) });
        }
      } catch {
        localStorage.setItem(`offline_tx_queue_${user.uid}`, JSON.stringify(q.slice(0, i + 1)));
        return;
      }
    }
    localStorage.removeItem(`offline_tx_queue_${user.uid}`);
  }
}));