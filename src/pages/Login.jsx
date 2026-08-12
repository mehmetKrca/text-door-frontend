import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from '@react-oauth/google';
import API from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import DogramaDemo from '../components/DogramaDemo.jsx';


/* ============================================================
   PAKETLER
   ============================================================ */
const PAKETLER = [
  {
    id: 'bireysel',
    ad: 'Bireysel',
    alt: 'Tek kişi çalışan usta ve montaj ekipleri için',
    fiyat: {
      aylik: { tutar: '250', birim: '/ ay' },
      yillik: { tutar: '2.400', birim: '/ yıl', eski: '3.000', not: 'Ayda 200 ₺ — iki ay bedava' },
      tek: { tutar: '4.900', birim: 'tek ödeme', not: 'Ömür boyu erişim, abonelik yok' },
    },
    ozellikler: [
      'Sınırsız çizim ve teklif',
      'İmalat ve kesim listesi',
      'Kurumsal PDF teklif',
      'Müşteri arşivi ve sipariş takibi',
      '1 kullanıcı',
    ],
  },
  {
    id: 'kurumsal',
    ad: 'Kurumsal',
    alt: 'Atölye, bayi ve fabrikalar için — ekip çalışması',
    fiyat: {
      aylik: { tutar: '500', birim: '/ ay' },
      yillik: { tutar: '4.800', birim: '/ yıl', eski: '6.000', not: 'Ayda 400 ₺ — iki ay bedava' },
      tek: { tutar: '9.900', birim: 'tek ödeme', not: 'Ömür boyu erişim, abonelik yok' },
    },
    ozellikler: [
      'Bireysel paketteki her şey',
      'Sınırsız kullanıcı',
      'Patron / usta yetki ayrımı',
      'Ustalara fiyat gizleme',
      'Firma logolu teklifler',
    ],
  },
];

/* ============================================================
   ANA SAYFA
   ============================================================ */

export default function Login() {
  const navigate = useNavigate();
  const { giris } = useAuth();

  const [isLoginModu, setIsLoginModu] = useState(true);

  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [beniHatirla, setBeniHatirla] = useState(false);

  const [firmaAdi, setFirmaAdi] = useState('');
  const [adSoyad, setAdSoyad] = useState('');
  const [telefon, setTelefon] = useState('');
  const [paketTipi, setPaketTipi] = useState('bireysel');

  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [periyot, setPeriyot] = useState('aylik');

  // "Beni hatırla" ile kayıtlı e-postayı doldur
  useEffect(() => {
    const kayitli = localStorage.getItem('ewindoore_son_eposta');
    if (kayitli) {
      setKullaniciAdi(kayitli);
      setBeniHatirla(true);
    }
  }, []);

  const epostaHatirla = () => {
    if (beniHatirla) localStorage.setItem('ewindoore_son_eposta', kullaniciAdi);
    else localStorage.removeItem('ewindoore_son_eposta');
  };

  const moduDegistir = (loginMu, paket) => {
    setIsLoginModu(loginMu);
    setHata('');
    if (paket) setPaketTipi(paket);
    document.getElementById('giris-formu')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const kaydir = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ---------- GOOGLE ---------- */
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setHata('');
      setYukleniyor(true);
      try {
        const response = await API.post('users/google/', {
          access_token: tokenResponse.access_token,
        });
        await giris(response.data.access, response.data.refresh);
        navigate('/cizim');
      } catch (error) {
        console.error("Google giriş hatası:", error);
        setHata("Google ile giriş tamamlanamadı. Lütfen tekrar deneyin.");
      } finally {
        setYukleniyor(false);
      }
    },
    onError: () => setHata("Google ile giriş iptal edildi.")
  });

  /* ---------- GİRİŞ ---------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!kullaniciAdi || !sifre) {
      setHata("Lütfen e-posta ve şifrenizi girin.");
      return;
    }
    setHata('');
    setYukleniyor(true);
    try {
      const response = await API.post('users/login/', {
        username: kullaniciAdi,
        password: sifre
      });
      epostaHatirla();
      await giris(response.data.access, response.data.refresh);
      navigate('/cizim');
    } catch (error) {
      console.error("Giriş hatası:", error);
      setHata("E-posta veya şifre hatalı. Hesabınızı Google ile açtıysanız Google butonunu kullanın.");
    } finally {
      setYukleniyor(false);
    }
  };

  /* ---------- KAYIT ---------- */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!firmaAdi || !adSoyad || !kullaniciAdi || !sifre) {
      setHata("Lütfen zorunlu alanları doldurun.");
      return;
    }
    setHata('');
    setYukleniyor(true);
    try {
      const response = await API.post('users/register/', {
        username: kullaniciAdi,
        email: kullaniciAdi,
        password: sifre,
        firma_adi: firmaAdi,
        ad_soyad: adSoyad,
        telefon: telefon
      });
      if (response.data.access) {
        await giris(response.data.access, response.data.refresh);
      }
      navigate('/cizim');
    } catch (error) {
      console.error("Kayıt hatası:", error);
      const veri = error.response?.data;
      let mesaj = "Kayıt tamamlanamadı. Bilgilerinizi kontrol edin.";
      if (veri) {
        if (veri.username) mesaj = "Bu e-posta adresi zaten kayıtlı.";
        else if (veri.password) mesaj = Array.isArray(veri.password) ? veri.password[0] : String(veri.password);
        else if (veri.email) mesaj = Array.isArray(veri.email) ? veri.email[0] : String(veri.email);
        else if (veri.error) mesaj = String(veri.error);
      }
      setHata(mesaj);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="ew">
      <style>{`
        .ew {
          --ink: #0f1a2e;
          --ink-2: #334154;
          --muted: #5a6880;
          --faint: #8492a8;
          --line: #e2e9f2;
          --line-2: #cfdae8;
          --bg: #ffffff;
          --bg-alt: #f6f9fd;
          --bg-soft: #eef4fb;
          --blue: #1f5fd0;
          --blue-h: #1a51b3;
          --blue-soft: #e8f0fd;
          --ok: #15803d;
          --err: #c62828;

          background: var(--bg);
          color: var(--ink);
          font-family: 'Inter', system-ui, sans-serif;
          min-height: 100vh;
        }
        .ew *, .ew *::before, .ew *::after { box-sizing: border-box; }
        .ew-wrap { max-width: 1140px; margin: 0 auto; padding: 0 22px; }

        .ew-mono {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-variant-numeric: tabular-nums;
        }

        /* ---------- ÜST BAR ---------- */
        .ew-nav {
          position: sticky; top: 0; z-index: 40;
          background: rgba(255,255,255,0.93);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--line);
        }
        .ew-nav-in {
          max-width: 1140px; margin: 0 auto; padding: 13px 22px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .ew-nav-links { display: flex; align-items: center; gap: 26px; }
        .ew-nav-link {
          font-size: 14.5px; color: var(--ink-2); font-weight: 500;
          background: none; border: none; cursor: pointer; font-family: inherit;
          padding: 0;
        }
        .ew-nav-link:hover { color: var(--blue); }
        .ew-nav-cta {
          padding: 9px 17px; border-radius: 8px;
          background: var(--blue); color: #fff;
          font-size: 14px; font-weight: 600; border: none; cursor: pointer;
          font-family: inherit;
        }
        .ew-nav-cta:hover { background: var(--blue-h); }

        /* ---------- LOGO ---------- */
        .ew-logo { display: flex; align-items: center; gap: 11px; }
        .ew-logo-ad { font-size: 19px; font-weight: 700; letter-spacing: -0.02em; }
        .ew-logo-alt {
          font-size: 9.5px; letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--faint); margin-top: 2px;
        }

        /* ---------- HERO ---------- */
        .ew-hero {
          background:
            radial-gradient(900px 420px at 88% -12%, #ddebfb 0%, transparent 62%),
            var(--bg);
          padding: 56px 0 64px;
          border-bottom: 1px solid var(--line);
        }
        .ew-hero-grid {
          display: grid; grid-template-columns: 1fr 424px;
          gap: 52px; align-items: start;
        }
        .ew-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 13px; border-radius: 100px;
          background: var(--blue-soft); color: var(--blue);
          font-size: 12.5px; font-weight: 600;
          margin-bottom: 20px;
        }
        .ew-h1 {
          font-size: clamp(31px, 4vw, 47px);
          font-weight: 800; line-height: 1.1; letter-spacing: -0.03em;
          margin: 0 0 18px; max-width: 17ch;
        }
        .ew-h1 span { color: var(--blue); }
        .ew-lead {
          font-size: 17px; line-height: 1.62; color: var(--muted);
          max-width: 46ch; margin: 0 0 26px;
        }
        .ew-tick-list { display: flex; flex-direction: column; gap: 11px; margin-bottom: 30px; }
        .ew-tick { display: flex; align-items: center; gap: 10px; font-size: 15px; color: var(--ink-2); }
        .ew-tick svg { flex-shrink: 0; }

        .ew-hero-mini {
          display: flex; gap: 28px; padding-top: 24px;
          border-top: 1px solid var(--line);
        }
        .ew-mini-n { font-size: 21px; font-weight: 700; letter-spacing: -0.02em; }
        .ew-mini-t { font-size: 12.5px; color: var(--faint); margin-top: 2px; }

        /* ---------- FORM KARTI ---------- */
        .ew-card {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 16px;
          box-shadow: 0 1px 2px rgba(16,32,64,.04), 0 12px 34px rgba(16,32,64,.07);
          padding: 26px;
        }
        .ew-tabs {
          display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
          background: var(--bg-alt); border: 1px solid var(--line);
          border-radius: 10px; padding: 4px; margin-bottom: 22px;
        }
        .ew-tab {
          padding: 10px; border-radius: 7px; border: none; cursor: pointer;
          font-size: 14px; font-weight: 600; color: var(--muted);
          background: transparent; font-family: inherit;
          transition: background .15s, color .15s;
        }
        .ew-tab:hover { color: var(--ink); }
        .ew-tab.is-on { background: #fff; color: var(--blue); box-shadow: 0 1px 3px rgba(16,32,64,.1); }

        .ew-card-h { font-size: 21px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 5px; }
        .ew-card-s { font-size: 13.5px; color: var(--muted); margin: 0 0 20px; line-height: 1.5; }

        .ew-f { margin-bottom: 14px; }
        .ew-lbl {
          display: block; font-size: 12.5px; font-weight: 600;
          color: var(--ink-2); margin-bottom: 6px;
        }
        .ew-inbox { position: relative; }
        .ew-in {
          width: 100%; padding: 12px 14px;
          background: #fff; border: 1px solid var(--line-2);
          border-radius: 9px; font-size: 15px; color: var(--ink);
          font-family: inherit; outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .ew-in::placeholder { color: #a3b0c2; }
        .ew-in:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(31,95,208,.13); }
        .ew-in.has-eye { padding-right: 44px; }
        .ew-eye {
          position: absolute; right: 5px; top: 50%; transform: translateY(-50%);
          width: 34px; height: 34px; display: grid; place-items: center;
          background: none; border: none; cursor: pointer;
          color: var(--faint); border-radius: 7px;
        }
        .ew-eye:hover { color: var(--blue); }
        .ew-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }

        .ew-alt-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; margin: 4px 0 18px;
        }
        .ew-check { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--ink-2); cursor: pointer; }
        .ew-check input { width: 16px; height: 16px; accent-color: var(--blue); cursor: pointer; }
        .ew-link-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          font-size: 13.5px; font-weight: 600; color: var(--blue); font-family: inherit;
        }
        .ew-link-btn:hover { text-decoration: underline; }

        .ew-err {
          display: flex; gap: 9px; align-items: flex-start;
          background: #fdf0f0; border: 1px solid #f3cccc;
          border-radius: 9px; padding: 11px 13px; margin-bottom: 16px;
          font-size: 13.5px; line-height: 1.45; color: var(--err);
        }

        .ew-btn {
          width: 100%; padding: 13px 18px; border-radius: 9px;
          font-size: 15px; font-weight: 650; font-family: inherit;
          cursor: pointer; border: 1px solid transparent;
          transition: background .15s, border-color .15s, transform .06s;
        }
        .ew-btn:active:not(:disabled) { transform: translateY(1px); }
        .ew-btn:disabled { opacity: .55; cursor: not-allowed; }
        .ew-btn-p { background: var(--blue); color: #fff; }
        .ew-btn-p:hover:not(:disabled) { background: var(--blue-h); }
        .ew-btn-o {
          background: #fff; border-color: var(--line-2); color: var(--ink);
          display: flex; align-items: center; justify-content: center; gap: 9px;
        }
        .ew-btn-o:hover:not(:disabled) { border-color: var(--blue); background: var(--bg-alt); }

        .ew-sep {
          display: flex; align-items: center; gap: 12px; margin: 18px 0;
          font-size: 11.5px; color: var(--faint); text-transform: uppercase;
          letter-spacing: .1em;
        }
        .ew-sep::before, .ew-sep::after { content: ''; flex: 1; height: 1px; background: var(--line); }

        .ew-try {
          margin-top: 18px; padding-top: 17px; border-top: 1px solid var(--line);
          text-align: center;
        }
        .ew-try-b {
          background: none; border: none; cursor: pointer; font-family: inherit;
          font-size: 14.5px; font-weight: 600; color: var(--blue); padding: 0;
        }
        .ew-try-b:hover { text-decoration: underline; }
        .ew-try-n { font-size: 12.5px; color: var(--faint); margin-top: 5px; }

        .ew-legal { margin-top: 16px; font-size: 11.8px; line-height: 1.55; color: var(--faint); text-align: center; }
        .ew-legal a { color: var(--muted); }

        /* ---------- BÖLÜM ORTAK ---------- */
        .ew-sec { padding: 66px 0; }
        .ew-sec.alt { background: var(--bg-alt); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
        .ew-eyebrow {
          text-align: center; font-size: 11.5px; font-weight: 700;
          letter-spacing: .14em; text-transform: uppercase; color: var(--blue);
          margin-bottom: 11px;
        }
        .ew-h2 {
          text-align: center; font-size: clamp(25px, 3vw, 34px);
          font-weight: 800; letter-spacing: -.025em; margin: 0 0 11px;
        }
        .ew-sec-lead {
          text-align: center; font-size: 16px; color: var(--muted);
          max-width: 54ch; margin: 0 auto 40px; line-height: 1.6;
        }

        /* ---------- DEMO ---------- */
        .ew-demo-box {
          background: #fff; border: 1px solid var(--line);
          border-radius: 14px; overflow: hidden;
          box-shadow: 0 10px 30px rgba(16,32,64,.06);
        }
        .ew-sablon-row {
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
          padding: 15px 20px; border-bottom: 1px solid var(--line);
          background: var(--bg-alt);
        }
        .ew-sablon-etiket { font-size: 13px; font-weight: 700; color: var(--ink-2); }
        .ew-sablon-list { display: flex; gap: 8px; flex-wrap: wrap; }
        .ew-chip {
          padding: 8px 14px; border-radius: 8px;
          background: #fff; border: 1px solid var(--line-2);
          font-size: 13.5px; font-weight: 550; color: var(--ink-2);
          cursor: pointer; font-family: inherit;
          transition: all .15s;
        }
        .ew-chip:hover { border-color: var(--blue); color: var(--blue); }
        .ew-chip.is-on { background: var(--blue); border-color: var(--blue); color: #fff; }

        .ew-demo-grid { display: grid; grid-template-columns: 330px 1fr; }
        .ew-demo-kontrol { padding: 22px; border-right: 1px solid var(--line); }
        .ew-k-baslik { font-size: 15px; font-weight: 700; margin-bottom: 18px; }
        .ew-k-label {
          display: block; font-size: 11.5px; font-weight: 600;
          letter-spacing: .04em; text-transform: uppercase;
          color: var(--faint); margin: 0 0 7px;
        }
        .ew-renk-row { display: flex; flex-direction: column; gap: 7px; margin-bottom: 18px; }
        .ew-renk {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 12px; border-radius: 8px;
          background: #fff; border: 1px solid var(--line-2);
          font-size: 13.5px; color: var(--ink-2); cursor: pointer;
          font-family: inherit; text-align: left;
          transition: all .15s;
        }
        .ew-renk:hover { border-color: var(--blue); }
        .ew-renk.is-on { border-color: var(--blue); background: var(--blue-soft); color: var(--blue); font-weight: 600; }
        .ew-renk-nokta {
          width: 16px; height: 16px; border-radius: 4px;
          border: 1px solid; flex-shrink: 0;
        }
        .ew-k-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; margin-bottom: 18px; }
        .ew-k-input {
          width: 100%; padding: 11px 12px;
          border: 1px solid var(--line-2); border-radius: 8px;
          font-size: 16px; font-weight: 600; color: var(--ink);
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-variant-numeric: tabular-nums;
          text-align: center; outline: none;
        }
        .ew-k-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(31,95,208,.13); }
        .ew-bolme-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin-bottom: 18px; }
        .ew-bolme {
          padding: 10px 0; border-radius: 8px;
          background: #fff; border: 1px solid var(--line-2);
          font-size: 15px; font-weight: 650; color: var(--ink-2);
          cursor: pointer; font-family: 'JetBrains Mono', monospace;
        }
        .ew-bolme:hover { border-color: var(--blue); }
        .ew-bolme.is-on { background: var(--blue); border-color: var(--blue); color: #fff; }
        .ew-demo-kilit {
          display: flex; gap: 8px; align-items: flex-start;
          padding: 11px 12px; border-radius: 8px;
          background: var(--bg-soft); color: var(--muted);
          font-size: 12.5px; line-height: 1.45;
        }
        .ew-demo-kilit svg { flex-shrink: 0; margin-top: 1px; }
        .ew-demo-tuval {
          padding: 24px;
          display: flex; align-items: center; justify-content: center;
          background:
            linear-gradient(var(--line) 1px, transparent 1px) 0 0/26px 26px,
            linear-gradient(90deg, var(--line) 1px, transparent 1px) 0 0/26px 26px,
            #fff;
        }


        /* ---------- ÖZELLİKLER ---------- */
        .ew-feat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; max-width: 900px; margin: 0 auto; }
        .ew-feat {
          background: #fff; border: 1px solid var(--line); border-radius: 13px;
          padding: 22px; display: flex; gap: 15px; align-items: flex-start;
        }
        .ew-feat-ic {
          width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
          background: var(--blue-soft); color: var(--blue);
          display: grid; place-items: center;
        }
        .ew-feat-h { font-size: 16.5px; font-weight: 700; margin: 0 0 6px; }
        .ew-feat-p { font-size: 14.2px; color: var(--muted); line-height: 1.55; margin: 0; }
        @media (max-width: 760px) { .ew-feat-grid { grid-template-columns: 1fr; } }

        /* ---------- İNDİR ---------- */
        .ew-store-row { display: flex; gap: 13px; justify-content: center; flex-wrap: wrap; }
        .ew-store {
          display: flex; align-items: center; gap: 11px;
          padding: 12px 22px; border-radius: 11px;
          background: var(--ink); color: #fff;
          text-decoration: none; border: none; cursor: pointer;
          font-family: inherit;
        }
        .ew-store:hover { background: #1c2a41; }
        .ew-store-t1 { font-size: 10px; letter-spacing: .06em; text-transform: uppercase; opacity: .72; }
        .ew-store-t2 { font-size: 15.5px; font-weight: 650; margin-top: 1px; }
        .ew-store-note { text-align: center; font-size: 13px; color: var(--faint); margin-top: 16px; }

        /* ---------- FİYAT ---------- */
        .ew-price-grid {
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px; max-width: 720px; margin: 0 auto;
        }
        .ew-price {
          position: relative;
          background: #fff; border: 1px solid var(--line);
          border-radius: 14px; padding: 28px 24px;
        }
        .ew-price.one { border-color: var(--blue); box-shadow: 0 10px 30px rgba(31,95,208,.13); }
        .ew-price-tag {
          position: absolute; top: -11px; left: 50%; transform: translateX(-50%);
          background: var(--blue); color: #fff;
          font-size: 11px; font-weight: 700; letter-spacing: .07em;
          text-transform: uppercase; padding: 5px 13px; border-radius: 100px;
          white-space: nowrap;
        }
        .ew-price-ad { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
        .ew-price-alt { font-size: 13.5px; color: var(--muted); margin-bottom: 18px; }
        .ew-price-n {
          display: flex; align-items: baseline; gap: 5px; margin-bottom: 20px;
          font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums;
        }
        .ew-price-n b { font-size: 38px; font-weight: 700; letter-spacing: -.03em; }
        .ew-price-n i { font-style: normal; font-size: 14px; color: var(--faint); }
        .ew-price-list { list-style: none; padding: 0; margin: 0 0 22px; display: flex; flex-direction: column; gap: 10px; }
        .ew-price-list li { display: flex; gap: 9px; align-items: flex-start; font-size: 14px; color: var(--ink-2); line-height: 1.45; }
        .ew-price-list svg { flex-shrink: 0; margin-top: 2px; }

        .ew-pay {
          margin-top: 34px; padding-top: 24px; border-top: 1px solid var(--line);
          text-align: center;
        }
        .ew-pay-logos { display: flex; gap: 14px; justify-content: center; align-items: center; flex-wrap: wrap; margin-bottom: 11px; }
        .ew-pay-card {
          height: 34px; padding: 0 13px; border-radius: 7px;
          background: #fff; border: 1px solid var(--line);
          display: flex; align-items: center; justify-content: center;
        }
        .ew-pay-note { font-size: 12.8px; color: var(--faint); line-height: 1.5; max-width: 46ch; margin: 0 auto; }


        /* ---------- PERİYOT SEÇİCİ ---------- */
        .ew-per {
          display: inline-flex; gap: 4px; padding: 4px;
          background: var(--bg-alt); border: 1px solid var(--line);
          border-radius: 10px; margin: 0 auto 34px; 
        }
        .ew-per-w { text-align: center; }
        .ew-per-b {
          padding: 9px 17px; border-radius: 7px; border: none; cursor: pointer;
          font-size: 13.5px; font-weight: 600; color: var(--muted);
          background: transparent; font-family: inherit; white-space: nowrap;
          transition: all .15s;
        }
        .ew-per-b:hover { color: var(--ink); }
        .ew-per-b.on { background: #fff; color: var(--blue); box-shadow: 0 1px 3px rgba(16,32,64,.1); }
        .ew-per-tag {
          display: inline-block; margin-left: 6px; padding: 2px 6px;
          border-radius: 5px; background: #dcf5e5; color: var(--ok);
          font-size: 10.5px; font-weight: 700;
        }
        .ew-price-eski {
          font-size: 13.5px; color: var(--faint); text-decoration: line-through;
          margin-bottom: 3px; font-family: 'JetBrains Mono', monospace;
        }
        .ew-price-not { font-size: 12.5px; color: var(--faint); margin: -12px 0 18px; }

        /* ---------- SOSYAL ---------- */
        .ew-sos { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
        .ew-sos a {
          width: 38px; height: 38px; border-radius: 9px;
          background: #1c2a41; color: #cbd5e4;
          display: grid; place-items: center; text-decoration: none;
          transition: background .15s, color .15s;
        }
        .ew-sos a:hover { background: var(--blue); color: #fff; }

        /* ---------- ADIMLAR ---------- */
        .ew-step-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .ew-step {
          background: #fff; border: 1px solid var(--line);
          border-radius: 13px; padding: 24px; text-align: left;
          font-family: inherit; cursor: pointer; width: 100%;
          transition: border-color .15s, transform .12s, box-shadow .15s;
        }
        .ew-step:hover {
          border-color: var(--blue); transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(31,95,208,.1);
        }
        .ew-step-git {
          display: inline-flex; align-items: center; gap: 5px; margin-top: 13px;
          font-size: 13.5px; font-weight: 650; color: var(--blue);
        }
        .ew-step-n {
          width: 38px; height: 38px; border-radius: 9px;
          background: var(--blue-soft); color: var(--blue);
          display: grid; place-items: center;
          font-size: 16px; font-weight: 700; margin-bottom: 15px;
          font-family: 'JetBrains Mono', monospace;
        }
        .ew-step-h { font-size: 16.5px; font-weight: 700; margin: 0 0 7px; }
        .ew-step-p { font-size: 14.2px; color: var(--muted); line-height: 1.55; margin: 0; }

        /* ---------- KİMLER ---------- */
        .ew-who { max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; gap: 11px; }
        .ew-who-i {
          display: flex; align-items: center; gap: 13px;
          padding: 16px 19px; border-radius: 11px;
          background: #fff; border: 1px solid var(--line);
          font-size: 15.2px; font-weight: 600; color: var(--ink-2);
        }
        .ew-who-dot {
          width: 9px; height: 9px; border-radius: 50%;
          background: var(--blue); flex-shrink: 0;
        }

        /* ---------- FOOTER ---------- */
        .ew-foot { background: var(--ink); color: #cbd5e4; padding: 44px 0 30px; }
        .ew-foot-in { text-align: center; }
        .ew-foot-logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .ew-foot-ad { font-size: 18px; font-weight: 700; color: #fff; }
        .ew-foot-p { font-size: 13.5px; color: #93a3b8; margin: 0 0 18px; }
        .ew-foot-links { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px; }
        .ew-foot-links a { color: #cbd5e4; font-size: 13.5px; text-decoration: none; }
        .ew-foot-links a:hover { color: #fff; text-decoration: underline; }
        .ew-foot-c { font-size: 12.3px; color: #75859b; padding-top: 18px; border-top: 1px solid #1e2b40; }

        /* ---------- MOBİL ---------- */
        @media (max-width: 980px) {
          .ew-hero-grid { grid-template-columns: 1fr; gap: 34px; }
          .ew-demo-grid { grid-template-columns: 1fr; }
          .ew-demo-kontrol { border-right: none; border-bottom: 1px solid var(--line); }
          .ew-step-grid { grid-template-columns: 1fr; }
          .ew-nav-links { display: none; }
        }
        @media (max-width: 620px) {
          .ew-sec { padding: 46px 0; }
          .ew-hero { padding: 34px 0 44px; }
          .ew-price-grid { grid-template-columns: 1fr; }
          .ew-card { padding: 20px; border-radius: 13px; }
          .ew-in, .ew-k-input { font-size: 16px; }
          .ew-btn { padding: 14px 18px; }
          .ew-hero-mini { gap: 20px; }
          .ew-row2 { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ===================== ÜST BAR ===================== */}
      <nav className="ew-nav">
        <div className="ew-nav-in">
          <div className="ew-logo">
            <MeLogo size={34} />
            <div>
              <div className="ew-logo-ad">eWindoore</div>
              <div className="ew-logo-alt">PVC Endüstri Çözümleri</div>
            </div>
          </div>
          <div className="ew-nav-links">
            <button className="ew-nav-link" onClick={() => kaydir('demo')}>Deneyin</button>
            <button className="ew-nav-link" onClick={() => kaydir('indir')}>Uygulama</button>
            <button className="ew-nav-link" onClick={() => kaydir('fiyatlar')}>Fiyatlar</button>
            <button className="ew-nav-link" onClick={() => kaydir('nasil')}>Nasıl Çalışır</button>
          </div>
          <button className="ew-nav-cta" onClick={() => moduDegistir(true)}>Giriş Yap</button>
        </div>
      </nav>

      {/* ===================== HERO + FORM ===================== */}
      <header className="ew-hero">
        <div className="ew-wrap ew-hero-grid">

          <div>
            <span className="ew-badge">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v5H3l4 7V8h4L7 1z" fill="currentColor" />
              </svg>
              14 gün ücretsiz — kart bilgisi istenmez
            </span>

            <h1 className="ew-h1">
              Atölyenizi dijitalleştirin, <span>hatalı ölçüye son verin.</span>
            </h1>

            <p className="ew-lead">
              Ölçüyü girin, doğrama çizimi anında oluşsun. İmalat dökümünü çıkarın,
              tek dokunuşla kurumsal PDF teklifinizi müşteriye gönderin.
            </p>

            <div className="ew-tick-list">
              {[
                'Sınırsız 2D doğrama çizimi',
                'Otomatik imalat ve kesim listesi',
                'Müşteri arşivi ve sipariş takibi',
              ].map((t) => (
                <div className="ew-tick" key={t}>
                  <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" fill="#e8f0fd" />
                    <path d="M6 10.3l2.6 2.6L14 7.5" stroke="#1f5fd0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t}
                </div>
              ))}
            </div>

            <div className="ew-hero-mini">
              <div>
                <div className="ew-mini-n ew-mono">2 dk</div>
                <div className="ew-mini-t">Ortalama teklif süresi</div>
              </div>
              <div>
                <div className="ew-mini-n ew-mono">%0</div>
                <div className="ew-mini-t">Ölçü hatası hedefi</div>
              </div>
              <div>
                <div className="ew-mini-n ew-mono">7/24</div>
                <div className="ew-mini-t">Tablet ve telefondan</div>
              </div>
            </div>
          </div>

          {/* ---------- GİRİŞ / KAYIT KARTI ---------- */}
          <div className="ew-card" id="giris-formu">
            <div className="ew-tabs">
              <button
                type="button"
                className={`ew-tab ${isLoginModu ? 'is-on' : ''}`}
                onClick={() => setIsLoginModu(true)}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                className={`ew-tab ${!isLoginModu ? 'is-on' : ''}`}
                onClick={() => setIsLoginModu(false)}
              >
                Kayıt Ol
              </button>
            </div>

            <h2 className="ew-card-h">
              {isLoginModu ? 'Tekrar hoş geldiniz' : 'Ücretsiz hesap oluşturun'}
            </h2>
            <p className="ew-card-s">
              {isLoginModu
                ? 'Hesabınıza giriş yapın, kaldığınız yerden devam edin.'
                : `14 gün boyunca tüm özellikler açık. ${paketTipi === 'kurumsal' ? 'Kurumsal' : 'Bireysel'} paketle başlıyorsunuz.`}
            </p>

            {hata && (
              <div className="ew-err">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
                  <line x1="8" y1="4.6" x2="8" y2="9" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="8" cy="11.2" r=".8" fill="currentColor" />
                </svg>
                <span>{hata}</span>
              </div>
            )}

            <form onSubmit={isLoginModu ? handleLogin : handleRegister}>
              {!isLoginModu && (
                <>
                  <div className="ew-f">
                    <label className="ew-lbl">Firma / Atölye Adı</label>
                    <input
                      className="ew-in" type="text" value={firmaAdi}
                      onChange={(e) => setFirmaAdi(e.target.value)}
                      placeholder="Örn: Koçak Yapı" autoComplete="organization"
                    />
                  </div>
                  <div className="ew-f ew-row2">
                    <div>
                      <label className="ew-lbl">Ad Soyad</label>
                      <input
                        className="ew-in" type="text" value={adSoyad}
                        onChange={(e) => setAdSoyad(e.target.value)}
                        placeholder="Mehmet Yılmaz" autoComplete="name"
                      />
                    </div>
                    <div>
                      <label className="ew-lbl">Telefon</label>
                      <input
                        className="ew-in" type="tel" inputMode="numeric" value={telefon}
                        onChange={(e) => setTelefon(e.target.value)}
                        placeholder="0555 000 00 00" autoComplete="tel"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="ew-f">
                <label className="ew-lbl">E-posta</label>
                <input
                  className="ew-in" type="email" value={kullaniciAdi}
                  onChange={(e) => setKullaniciAdi(e.target.value)}
                  placeholder="ornek@firma.com" autoComplete="email"
                />
              </div>

              <div className="ew-f">
                <label className="ew-lbl">Şifre</label>
                <div className="ew-inbox">
                  <input
                    className="ew-in has-eye"
                    type={sifreGorunur ? 'text' : 'password'}
                    value={sifre}
                    onChange={(e) => setSifre(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={isLoginModu ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button" className="ew-eye"
                    onClick={() => setSifreGorunur(!sifreGorunur)}
                    aria-label={sifreGorunur ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M2 9s2.7-4.5 7-4.5S16 9 16 9s-2.7 4.5-7 4.5S2 9 2 9z" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.3" />
                      {sifreGorunur && <line x1="3" y1="15" x2="15" y2="3" stroke="currentColor" strokeWidth="1.3" />}
                    </svg>
                  </button>
                </div>
              </div>

              {isLoginModu && (
                <div className="ew-alt-row">
                  <label className="ew-check">
                    <input
                      type="checkbox" checked={beniHatirla}
                      onChange={(e) => setBeniHatirla(e.target.checked)}
                    />
                    Beni hatırla
                  </label>
                  <button
                    type="button" className="ew-link-btn"
                    onClick={() => alert('Şifre sıfırlama yakında eklenecek. Şimdilik bizimle iletişime geçin.')}
                  >
                    Şifremi unuttum?
                  </button>
                </div>
              )}

              <button type="submit" className="ew-btn ew-btn-p" disabled={yukleniyor}>
                {yukleniyor ? 'Lütfen bekleyin...' : isLoginModu ? 'Giriş Yap' : '14 Gün Ücretsiz Başla'}
              </button>
            </form>

            <div className="ew-sep">veya</div>

            <button
              type="button" className="ew-btn ew-btn-o"
              onClick={() => googleLogin()} disabled={yukleniyor}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 009 18z" />
                <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 010-3.44V4.94H.96a9 9 0 000 8.12l3.01-2.34z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 00.96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
              </svg>
              Google ile devam et
            </button>

            <div className="ew-try">
              <button type="button" className="ew-try-b" onClick={() => kaydir('demo')}>
                Giriş yapmadan deneyin →
              </button>
              <div className="ew-try-n">Şablon seçin, ölçü girin, çizimi anında görün.</div>
            </div>

            {!isLoginModu && (
              <p className="ew-legal">
                Hesap oluşturarak <a href="/kullanici-sozlesmesi">Kullanıcı Sözleşmesi</a> ve{' '}
                <a href="/gizlilik-sozlesmesi">Gizlilik Politikası</a>
            <a href="/gizlilik-sozlesmesi#hesap-silme">Hesap Silme Talebi</a>'nı kabul etmiş olursunuz.
              </p>
            )}
          </div>
        </div>
      </header>

      {/* ===================== DEMO ===================== */}
      <section className="ew-sec" id="demo">
        <div className="ew-wrap">
          <div className="ew-eyebrow">Kayıt olmadan deneyin</div>
          <h2 className="ew-h2">Ölçüyü girin, çizim anında oluşsun</h2>
          <p className="ew-sec-lead">
            Hazır şablonlardan birini seçin veya kendi ölçünüzü girin. Çizim
            gerçek zamanlı güncellenir — tıpkı uygulamanın içinde olduğu gibi.
          </p>
          <DogramaDemo />
        </div>
      </section>


      {/* ===================== ÖZELLİKLER ===================== */}
      <section className="ew-sec" id="ozellikler">
        <div className="ew-wrap">
          <div className="ew-eyebrow">Özelliklerimiz</div>
          <h2 className="ew-h2">İşinizi kolaylaştıran araçlar</h2>
          <p className="ew-sec-lead">
            Ölçüden teklife, siparişten arşive kadar atölyenin tüm akışı tek yerde.
          </p>

          <div className="ew-feat-grid">
            {[
              {
                h: 'Otomatik Teklif',
                p: 'Malzeme listesi ve fiyatlandırma otomatik hesaplanır, kâr marjınızı ekleyip firma logolu PDF teklifi anında oluşturun.',
                ic: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    <path d="M14 3v5h5M9 13h6M9 16.5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                h: 'Proje Yönetimi',
                p: 'Her işin durumunu adım adım takip edin: kapora alındı, ölçü bekleniyor, imalatta, montaja hazır.',
                ic: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                h: 'Müşteri Arşivi',
                p: 'Müşteri bilgileri, geçmiş ölçüler ve verdiğiniz teklifler tek yerde. Eski işi saniyede bulun, kopyalayıp yeniden kullanın.',
                ic: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M3.5 19c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    <path d="M16.5 7.2a2.8 2.8 0 010 5.6M18.5 18.4c0-2-.8-3.4-2-4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                h: 'Patron Özeti',
                p: 'Ciro, maliyet ve kâr marjınızı tek ekranda görün. Ustalara fiyat gizlenir, patron her şeyi görür.',
                ic: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M4 19V11M10 19V5M16 19v-6M22 19H2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                ),
              },
            ].map((f) => (
              <div className="ew-feat" key={f.h}>
                <span className="ew-feat-ic">{f.ic}</span>
                <div>
                  <h3 className="ew-feat-h">{f.h}</h3>
                  <p className="ew-feat-p">{f.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== İNDİR ===================== */}
      <section className="ew-sec" id="indir">
        <div className="ew-wrap">
          <div className="ew-eyebrow">Mobil &amp; tablet uyumlu</div>
          <h2 className="ew-h2">Uygulamayı ücretsiz indirin</h2>
          <p className="ew-sec-lead">
            Atölyede veya şantiyede ölçüleri anında cebinizden girin, tek tıkla
            kurumsal teklif oluşturun.
          </p>

          <div className="ew-store-row">
            <button type="button" className="ew-store" onClick={() => alert('App Store yayını yakında. Şimdilik web üzerinden kullanabilirsiniz.')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.05 12.5c0-2.2 1.8-3.3 1.88-3.35-.98-1.5-2.55-1.7-3.1-1.72-1.32-.13-2.57.77-3.24.77-.68 0-1.71-.75-2.81-.73-1.45.02-2.78.84-3.53 2.13-1.5 2.6-.38 6.45 1.08 8.57.72 1.03 1.57 2.19 2.7 2.15 1.08-.04 1.5-.7 2.81-.7 1.3 0 1.68.7 2.81.68 1.16-.02 1.9-1.05 2.61-2.09.82-1.2 1.16-2.36 1.18-2.42-.03-.01-2.26-.87-2.28-3.44M15.2 5.1c.58-.7.97-1.68.86-2.65-.85.03-1.88.57-2.48 1.27-.54.62-1 1.62-.88 2.57.95.07 1.92-.48 2.5-1.19" />
              </svg>
              <span style={{ textAlign: 'left' }}>
                <span className="ew-store-t1" style={{ display: 'block' }}>Download on the</span>
                <span className="ew-store-t2" style={{ display: 'block' }}>App Store</span>
              </span>
            </button>

            <button type="button" className="ew-store" onClick={() => alert('Google Play yayını yakında. Şimdilik web üzerinden kullanabilirsiniz.')}>
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path d="M3.6 2.3c-.3.32-.48.8-.48 1.44v16.52c0 .63.18 1.12.48 1.43l9.06-9.7L3.6 2.3z" fill="#34A853" />
                <path d="M16.1 15.3l-3.44-3.31 3.45-3.7 4.05 2.35c1.15.67 1.15 1.76 0 2.43L16.1 15.3z" fill="#FBBC04" />
                <path d="M3.6 21.7c.4.42 1.06.47 1.8.05l10.7-6.45-3.44-3.31L3.6 21.7z" fill="#EA4335" />
                <path d="M3.6 2.3c.4-.42 1.06-.47 1.8-.05l10.7 6.04-3.45 3.7L3.6 2.3z" fill="#4285F4" />
              </svg>
              <span style={{ textAlign: 'left' }}>
                <span className="ew-store-t1" style={{ display: 'block' }}>Get it on</span>
                <span className="ew-store-t2" style={{ display: 'block' }}>Google Play</span>
              </span>
            </button>
          </div>
          <p className="ew-store-note">
            Mağaza yayını hazırlanıyor. Şu an tarayıcıdan tam sürümü kullanabilir,
            telefonunuza "Ana ekrana ekle" ile kurabilirsiniz.
          </p>
        </div>
      </section>

      {/* ===================== FİYATLAR ===================== */}
      <section className="ew-sec alt" id="fiyatlar">
        <div className="ew-wrap">
          <div className="ew-eyebrow">Şeffaf abonelik</div>
          <h2 className="ew-h2">Atölyenize uygun paketi seçin</h2>
          <p className="ew-sec-lead">
            İki paket, gizli ücret yok. Her ikisinde de çizim, teklif ve arşiv
            sınırsız — fark yalnızca kullanıcı sayısında.
          </p>

          <div className="ew-per-w">
            <div className="ew-per">
              {[
                { id: 'aylik', ad: 'Aylık' },
                { id: 'yillik', ad: 'Yıllık', tag: '%20 indirim' },
                { id: 'tek', ad: 'Tek Seferlik' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`ew-per-b ${periyot === p.id ? 'on' : ''}`}
                  onClick={() => setPeriyot(p.id)}
                >
                  {p.ad}
                  {p.tag && <span className="ew-per-tag">{p.tag}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="ew-price-grid">
            {PAKETLER.map((pk) => {
              const f = pk.fiyat[periyot];
              const one = pk.id === 'kurumsal';
              return (
                <div className={`ew-price ${one ? 'one' : ''}`} key={pk.id}>
                  {one && <span className="ew-price-tag">En çok tercih edilen</span>}
                  <div className="ew-price-ad">{pk.ad}</div>
                  <div className="ew-price-alt">{pk.alt}</div>

                  {f.eski && <div className="ew-price-eski">{f.eski} ₺</div>}
                  <div className="ew-price-n">
                    <b>{f.tutar}</b><i>₺ {f.birim}</i>
                  </div>
                  {f.not && <p className="ew-price-not">{f.not}</p>}

                  <ul className="ew-price-list">
                    {pk.ozellikler.map((t) => (
                      <li key={t}><Tik />{t}</li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={`ew-btn ${one ? 'ew-btn-p' : 'ew-btn-o'}`}
                    onClick={() => moduDegistir(false, pk.id)}
                  >
                    14 Gün Ücretsiz Başla
                  </button>
                </div>
              );
            })}
          </div>

          {/* ÖDEME */}
          <div className="ew-pay" id="odeme">
            <div className="ew-pay-logos">
              <VisaLogo />
              <MastercardLogo />
              <TroyLogo />
            </div>
            <p className="ew-pay-note">
              14 günlük deneme sonunda kredi veya banka kartıyla güvenli ödeme.
              Deneme süresince kart bilgisi istenmez, otomatik ücretlendirme yapılmaz.
              Ödemeler 3D Secure ile korunur.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== NASIL ÇALIŞIR ===================== */}
      <section className="ew-sec" id="nasil">
        <div className="ew-wrap">
          <div className="ew-eyebrow">3 basit adım</div>
          <h2 className="ew-h2">Nasıl çalışır?</h2>
          <p className="ew-sec-lead">
            Kurulum yok, eğitim yok. Hesabınızı açtığınız gün ilk teklifinizi
            gönderebilirsiniz.
          </p>

          <div className="ew-step-grid">
            {[
              {
                n: '01',
                h: 'Hesabınızı açın',
                p: 'Firma adı, telefon ve e-posta yeterli. Saniyeler içinde 14 günlük ücretsiz hesabınız hazır olur.',
                git: 'Hesap aç',
                tik: () => moduDegistir(false),
              },
              {
                n: '02',
                h: 'Ölçüyü girin, çizin',
                p: 'Şablon seçin veya ölçüyü elle girin. Doğrama çizimi ve imalat listesi anında oluşur.',
                git: 'Hemen dene',
                tik: () => kaydir('demo'),
              },
              {
                n: '03',
                h: 'Güvenli ödeme',
                p: 'Deneme süresi bitince size uygun paketi seçin. 3D Secure ile korumalı kart ödemesi.',
                git: 'Paketleri gör',
                tik: () => kaydir('fiyatlar'),
              },
            ].map((st) => (
              <button type="button" className="ew-step" key={st.n} onClick={st.tik}>
                <div className="ew-step-n">{st.n}</div>
                <h3 className="ew-step-h">{st.h}</h3>
                <p className="ew-step-p">{st.p}</p>
                <span className="ew-step-git">
                  {st.git}
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== KİMLER KULLANABİLİR ===================== */}
      <section className="ew-sec">
        <div className="ew-wrap">
          <div className="ew-eyebrow">Kimler kullanabilir</div>
          <h2 className="ew-h2">Sektörünüze göre çalışır</h2>
          <p className="ew-sec-lead">
            PVC ve alüminyum doğramanın her kolunda, atölyeden şantiyeye.
          </p>

          <div className="ew-who">
            {[
              'PVC pencere ve kapı sistemleri üreticileri',
              'Alüminyum doğrama atölyeleri',
              'Pilise perde ve sineklik imalatçıları',
              'Bağımsız ustalar ve montaj ekipleri',
            ].map((t) => (
              <div className="ew-who-i" key={t}>
                <span className="ew-who-dot" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="ew-foot">
        <div className="ew-wrap ew-foot-in">
          <div className="ew-foot-logo">
            <MeLogo size={32} koyuZemin />
            <span className="ew-foot-ad">eWindoore</span>
          </div>
          <p className="ew-foot-p">Yeni nesil PVC &amp; alüminyum atölye yönetim platformu</p>

          <div className="ew-sos">
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
              </svg>
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.98 3.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3 9h4v12H3V9zm6.5 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95C20.6 8.75 22 10.8 22 14.1V21h-4v-6.1c0-1.5-.54-2.5-1.85-2.5-1.02 0-1.62.68-1.89 1.34-.1.24-.12.57-.12.9V21h-4V9z" />
              </svg>
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X (Twitter)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.96 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.72 6.24 5.44-6.24zm-1.16 17.52h1.83L6.99 4.13H5.02l12.06 15.64z" />
              </svg>
            </a>
          </div>

          <div className="ew-foot-links">
            <a href="/kullanici-sozlesmesi">Kullanıcı Sözleşmesi</a>
            <a href="/gizlilik-sozlesmesi">Gizlilik Politikası</a>
            <a href="/hesap-silme">Hesap Silme Talebi</a>
            <button className="ew-nav-link" style={{ color: '#cbd5e4', fontSize: '13.5px' }} onClick={() => kaydir('fiyatlar')}>
              Fiyatlar
            </button>
          </div>

          <div className="ew-foot-c">
            © {new Date().getFullYear()} eWindoore Software. Tüm hakları saklıdır.
            Koçak Yapı iş birliğiyle geliştirilmiştir.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================
   YARDIMCI BİLEŞENLER
   ============================================================ */

function MeLogo({ size = 34, koyuZemin = false }) {
  const mavi = koyuZemin ? '#5aa2f5' : '#1f5fd0';
  const gri = koyuZemin ? '#7f8ea6' : '#9aa8bd';
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="eWindoore">
      <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="8" fill={koyuZemin ? '#16233a' : '#f2f7fe'} stroke={koyuZemin ? '#243550' : '#dbe7f8'} strokeWidth="1.5" />
      {/* M */}
      <path d="M8 28V12h3.2l3.4 7.4 3.4-7.4h3.2v16h-3V18.4l-2.7 5.9h-1.8l-2.7-5.9V28H8z" fill={mavi} />
      {/* E — üç yatay bar */}
      <rect x="24.5" y="12" width="8.5" height="3" rx="0.6" fill={mavi} />
      <rect x="24.5" y="18.5" width="7" height="3" rx="0.6" fill={gri} />
      <rect x="24.5" y="25" width="8.5" height="3" rx="0.6" fill={gri} />
    </svg>
  );
}


/* ---------- ÖDEME LOGOLARI ---------- */

function VisaLogo() {
  return (
    <span className="ew-pay-card" style={{ height: 38, padding: '0 15px' }}>
      <svg width="54" height="18" viewBox="0 0 54 18" aria-label="Visa">
        <path d="M21.1 17.4h-4.3L19.5.6h4.3l-2.7 16.8z" fill="#1a1f71" />
        <path d="M36.9 1a10.6 10.6 0 00-3.9-.7c-4.2 0-7.2 2.2-7.2 5.4 0 2.4 2.2 3.7 3.8 4.5 1.7.8 2.3 1.3 2.3 2 0 1.1-1.3 1.6-2.6 1.6-1.6 0-3-.4-4.3-1l-.6-.3-.6 3.7c1 .4 2.8.8 4.7.8 4.5 0 7.4-2.2 7.4-5.6 0-1.9-1.1-3.3-3.6-4.5-1.5-.8-2.4-1.3-2.4-2.1 0-.7.8-1.4 2.5-1.4 1.3 0 2.3.3 3 .6l.4.2.6-3.5z" fill="#1a1f71" />
        <path d="M45.6.6h-3.3c-1 0-1.8.3-2.2 1.4l-6.4 15.4h4.5l.9-2.5h5.5l.5 2.5h4L45.6.6zm-5.2 10.8l1.7-4.7.5-1.4.3 1.3 1 4.8h-3.5z" fill="#1a1f71" />
        <path d="M13.2.6L9 12.1l-.5-2.3C7.7 6.9 5.3 4 2.3 2.5l4 14.9h4.5L17.7.6h-4.5z" fill="#1a1f71" />
        <path d="M5.1.6H.1L0 1c3.9 1 6.5 3.4 7.6 6.3L6.4 2C6.2.9 5.8.6 5.1.6z" fill="#f7b600" />
      </svg>
    </span>
  );
}

function MastercardLogo() {
  return (
    <span className="ew-pay-card" style={{ height: 38, padding: '0 15px' }}>
      <svg width="44" height="27" viewBox="0 0 44 27" aria-label="Mastercard">
        <circle cx="15" cy="13.5" r="12.4" fill="#eb001b" />
        <circle cx="29" cy="13.5" r="12.4" fill="#f79e1b" />
        <path
          d="M22 3.6a12.4 12.4 0 000 19.8 12.4 12.4 0 000-19.8z"
          fill="#ff5f00"
        />
      </svg>
    </span>
  );
}

function TroyLogo() {
  return (
    <span className="ew-pay-card" style={{ height: 38, padding: '0 15px' }}>
      <svg width="52" height="20" viewBox="0 0 52 20" aria-label="Troy">
        <path d="M2 6.2h7.4v2.6H7.1v7.4H4.3V8.8H2V6.2z" fill="#00adef" />
        <path d="M10.6 6.2h4.6c2.2 0 3.5 1.2 3.5 3.1 0 1.4-.7 2.4-1.9 2.8l2.3 4.1h-3.1l-1.9-3.6h-.8v3.6h-2.7V6.2zm2.7 2.4v2.1h1.4c.7 0 1.2-.4 1.2-1.1 0-.6-.5-1-1.2-1h-1.4z" fill="#00adef" />
        <path d="M25.1 5.9c3.1 0 5.4 2.3 5.4 5.3s-2.3 5.3-5.4 5.3-5.4-2.3-5.4-5.3 2.3-5.3 5.4-5.3zm0 2.6c-1.5 0-2.6 1.1-2.6 2.7 0 1.6 1.1 2.7 2.6 2.7s2.6-1.1 2.6-2.7c0-1.6-1.1-2.7-2.6-2.7z" fill="#00adef" />
        <path d="M31.2 6.2h3l2 4.2 2-4.2h3l-3.6 7v3h-2.8v-3l-3.6-7z" fill="#00adef" />
        <path d="M44.6 3.4c1.9 1.7 3.1 4 3.1 6.7 0 2.7-1.2 5-3.1 6.7l-1.5-1.7c1.4-1.3 2.3-3 2.3-5s-.9-3.7-2.3-5l1.5-1.7z" fill="#e30613" />
      </svg>
    </span>
  );
}

function Tik() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
      <path d="M4 9.4l3 3L14 5.5" stroke="#1f5fd0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
