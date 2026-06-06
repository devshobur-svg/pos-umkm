import React, { useState } from 'react';
import { auth } from '../../../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Store, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setAuthError('');

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        if (navigator.vibrate) navigator.vibrate(50);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setAuthError('Email atau password salah, bro!');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('Email ini sudah terdaftar sebagai ruko lain.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Password terlalu lemah (minimal 6 karakter).');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('Format penulisan email salah.');
      } else {
        setAuthError('Gagal menghubungkan autentikasi cloud ruko.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xl space-y-5 text-center">
        
        {/* REBRANDING BRANDING UTAMA POS UMKM */}
        <div className="space-y-2">
          <div className="w-12 h-12 bg-emerald-700 text-white rounded-2xl flex items-center justify-center border border-emerald-600 shadow-md mx-auto">
            <Store size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">POS UMKM</h1>
            <p className="text-xs text-gray-400 font-bold mt-0.5">
              {isRegister ? 'Daftarkan akun workspace outlet tokomu' : 'Masuk untuk kelola kasir & inventory cloud'}
            </p>
          </div>
        </div>

        {/* INPUT FORM AUTENTIKASI */}
        <form onSubmit={handleAuthAction} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Alamat Email Toko</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Mail size={14} /></span>
              <input
                type="email"
                required
                disabled={isSubmitting}
                placeholder="contoh: kopi.mantap@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500 shadow-inner disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Kata Sandi / Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Lock size={14} /></span>
              <input
                type="password"
                required
                disabled={isSubmitting}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-emerald-500 shadow-inner disabled:bg-gray-100"
              />
            </div>
          </div>

          {authError && (
            <p className="text-[11px] font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 text-center animate-fadeIn">{authError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-700 text-white text-xs font-black py-3 rounded-xl shadow-md hover:bg-emerald-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memproses Akun Cloud...</span>
              </>
            ) : (
              <>
                <span>{isRegister ? 'Buat Akun Ruko Baru' : 'Masuk ke Dashboard'}</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>

        <div className="border-t border-gray-100 pt-3 text-xs">
          <p className="text-gray-400 font-bold">
            {isRegister ? 'Sudah memiliki akun toko?' : 'Belum mendaftarkan outlet ruko kamu?'}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => { setAuthError(''); setIsRegister(!isRegister); }}
              className="text-emerald-700 font-black ml-1 uppercase hover:underline focus:outline-none disabled:opacity-40"
            >
              {isRegister ? 'Login di sini' : 'Daftar Sekarang'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}