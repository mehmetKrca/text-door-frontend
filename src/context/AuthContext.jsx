import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

// Cikis yaparken SADECE bu anahtarlar silinir (localStorage.clear() kullanilmaz,
// tema tercihi gibi diger degerler korunur).
const CIKISTA_SILINECEK_ANAHTARLAR = [
  'access_token',
  'refresh_token',
  'bayiMusteriArsivi',
  'ustaFiyatTablosu',
  'ustaFirmaLogosu',
  'ustaKurumsalIban',
  'ustaProfilSerisi',
  'eWindoore_aktif_sekme',
];

export function AuthProvider({ children }) {
  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const kullaniciGetir = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token || token === 'undefined' || token === 'null') {
      setKullanici(null);
      setYukleniyor(false);
      return;
    }

    try {
      const response = await API.get('users/me/');
      setKullanici(response.data);
    } catch (error) {
      setKullanici(null);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    kullaniciGetir();
  }, [kullaniciGetir]);

  const giris = useCallback(async (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    setYukleniyor(true);
    await kullaniciGetir();
  }, [kullaniciGetir]);

  const cikis = useCallback(() => {
    CIKISTA_SILINECEK_ANAHTARLAR.forEach((anahtar) => localStorage.removeItem(anahtar));
    setKullanici(null);
  }, []);

  const value = {
    kullanici,
    yukleniyor,
    girisYapildiMi: !!kullanici,
    giris,
    cikis,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth, bir AuthProvider icinde kullanilmalidir');
  }
  return context;
}
