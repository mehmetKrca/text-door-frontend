import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

// Cikis yaparken / yeni giris-kayit oncesi SADECE bu anahtarlar silinir
// (localStorage.clear() kullanilmaz, tema tercihi gibi diger degerler korunur).
const CIKISTA_SILINECEK_ANAHTARLAR = [
  'access_token',
  'refresh_token',
  'access', // eski/legacy anahtar - services/api.js fallback olarak okuyor
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

  // Ust uste hizlica cagrilan kullaniciGetir() istekleri farkli sirada
  // donebilir (race condition). Sadece EN SON baslatilan cagrinin sonucu
  // state'e yazilsin diye bir sira numarasi tutuyoruz.
  const sonCagriNo = useRef(0);

  const kullaniciGetir = useCallback(async () => {
    const buCagriNo = ++sonCagriNo.current;
    const token = localStorage.getItem('access_token');
    if (!token || token === 'undefined' || token === 'null') {
      if (buCagriNo === sonCagriNo.current) {
        setKullanici(null);
        setYukleniyor(false);
      }
      return;
    }

    try {
      const response = await API.get('users/me/');
      if (buCagriNo === sonCagriNo.current) {
        setKullanici(response.data);
      }
    } catch (error) {
      if (buCagriNo === sonCagriNo.current) {
        setKullanici(null);
      }
    } finally {
      if (buCagriNo === sonCagriNo.current) {
        setYukleniyor(false);
      }
    }
  }, []);

  useEffect(() => {
    kullaniciGetir();
  }, [kullaniciGetir]);

  const giris = useCallback(async (accessToken, refreshToken) => {
    // ONCE: eski oturuma ait tum tokenlari ve usta-ozel verilerini temizle
    CIKISTA_SILINECEK_ANAHTARLAR.forEach((anahtar) => localStorage.removeItem(anahtar));
    // SONRA: yeni tokenlari yaz
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    // Eski kullanici bir an bile ekranda gorunmesin diye users/me/ cagrisindan
    // once state'i temizliyoruz.
    setKullanici(null);
    setYukleniyor(true);
    // EN SON: yeni token ile users/me/ cagir
    await kullaniciGetir();
  }, [kullaniciGetir]);

  const cikis = useCallback(() => {
    CIKISTA_SILINECEK_ANAHTARLAR.forEach((anahtar) => localStorage.removeItem(anahtar));
    setKullanici(null);
    setYukleniyor(false);
  }, []);

  const rol = kullanici?.rol || null;

  const value = {
    kullanici,
    yukleniyor,
    girisYapildiMi: !!kullanici,
    rol,
    patronMu: rol === 'patron',
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
