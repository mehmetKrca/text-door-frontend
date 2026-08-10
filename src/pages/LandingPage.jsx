import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import API from '../services/api';
import axios from 'axios';

export default function LandingPage() {
  const navigate = useNavigate();

  // --- FORM STATE'LERİ ---
  const [formTipi, setFormTipi] = useState('bireysel');
  const [firmaAdi, setFirmaAdi] = useState('');
  const [adSoyad, setAdSoyad] = useState('');
  const [telefon, setTelefon] = useState('');
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [onay, setOnay] = useState(false);
  const [kayitYukleniyor, setKayitYukleniyor] = useState(false);

  // --- MODAL STATE'LERİ ---
  const [aydinlatmaModalAcik, setAydinlatmaModalAcik] = useState(false);
  const [odemeModalAcik, setOdemeModalAcik] = useState(false);
  const [seciliPaket, setSeciliPaket] = useState(null);
  const [yillikMi, setYillikMi] = useState(true);

  const [kartAd, setKartAd] = useState('');
  const [kartNo, setKartNo] = useState('');
  const [ay, setAy] = useState('');
  const [yil, setYil] = useState('');
  const [cvv, setCvv] = useState('');
  const [kartOnay, setKartOnay] = useState(false);

  // --- SMOOTH SCROLL SAYFA İÇİ YÖNLENDİRME ---
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- GOOGLE İLE TEK TIKLA GİRİŞ ---
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await axios.post('http://127.0.0.1:8001/api/users/google/', {
          access_token: tokenResponse.access_token,
        });

        if (response.data.access) {
          localStorage.setItem('access_token', response.data.access);
        }
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }

        alert("Tebrikler! eWindoore'ya Google ile başarıyla giriş yapıldı! 🚀");
        navigate('/cizim');

      } catch (error) {
        console.error("Google giriş backend hatası:", error);
        navigate('/cizim');
      }
    },
    onError: (error) => {
      console.error("Google popup hatası:", error);
      alert("Google ile giriş iptal edildi veya bir hata oluştu.");
    }
  });

  // --- MİMARİ ÇİZİM VE ŞABLON MOTORU STATE'LERİ ---
  const [urunTipi, setUrunTipi] = useState('pencere');
  const [genislik, setGenislik] = useState(1500);
  const [yukseklik, setYukseklik] = useState(1200);
  const [bolmeSayisi, setBolmeSayisi] = useState(2);
  const [kanatlar, setKanatlar] = useState(['sabit', 'sag']);
  const [bolmeOlculeri, setBolmeOlculeri] = useState([0, 0]);
  const [renk, setRenk] = useState('antrasit'); 
  const profilSerisi = 70;

  const profilRenkleri = {
    beyaz: { isim: 'Klasik Beyaz', fill: '#fcfcfc', border: '#b0bec5' },
    antrasit: { isim: 'Antrasit Gri', fill: '#37474f', border: '#263238' },
    altin_mese: { isim: 'Altın Meşe', fill: '#b8860b', border: '#5d4037' }
  };

  const p = profilSerisi;
  const gGenislik = Number(genislik) || 0;
  const gYukseklik = Number(yukseklik) || 0;
  const seciliRenk = profilRenkleri[renk] || profilRenkleri.antrasit;

  const dikmeSayisi = bolmeSayisi - 1;
  const icYukseklik = Math.max(0, gYukseklik - (2 * p));
  const netCamAlaniGenisligi = Math.max(0, gGenislik - (2 * p) - (dikmeSayisi * p));
  
  const manuelToplam = bolmeOlculeri.reduce((a, b) => a + (Number(b) || 0), 0);
  const otoSayisi = bolmeOlculeri.filter(b => (Number(b) || 0) === 0).length || 1; 
  let hesaplananGenislikler = [];

  if (manuelToplam >= netCamAlaniGenisligi && netCamAlaniGenisligi > 0) {
    const sifirSayisi = bolmeOlculeri.filter(b => (Number(b) || 0) === 0).length;
    if (sifirSayisi === 0) {
      const oran = netCamAlaniGenisligi / manuelToplam;
      hesaplananGenislikler = bolmeOlculeri.map(b => (Number(b) || 0) * oran);
    } else {
      const oran = (netCamAlaniGenisligi * 0.9) / manuelToplam;
      const bosluk = (netCamAlaniGenisligi * 0.1) / sifirSayisi;
      hesaplananGenislikler = bolmeOlculeri.map(b => (Number(b) || 0) > 0 ? (Number(b) || 0) * oran : bosluk);
    }
  } else {
    const kalanNet = Math.max(0, netCamAlaniGenisligi - manuelToplam);
    const otoGenislik = kalanNet / otoSayisi;
    hesaplananGenislikler = bolmeOlculeri.map(b => (Number(b) || 0) > 0 ? (Number(b) || 0) : otoGenislik);
  }

  const bolmeler = Array.from({ length: bolmeSayisi }, (_, index) => index);

  const handleSablonYukle = (sablonTipi) => {
    if (sablonTipi === 'wc') {
      setUrunTipi('wc_kapi'); setGenislik(800); setYukseklik(2100); 
      setBolmeSayisi(1); setKanatlar(['sag']); setBolmeOlculeri([0]);
    } else if (sablonTipi === 'mutfak') {
      setUrunTipi('pencere'); setGenislik(1500); setYukseklik(1200);
      setBolmeSayisi(2); setKanatlar(['sabit', 'sag']); setBolmeOlculeri([0, 0]);
    } else if (sablonTipi === 'fransiz') {
      setUrunTipi('fransiz'); setGenislik(1400); setYukseklik(2100);
      setBolmeSayisi(2); setKanatlar(['sol', 'sag']); setBolmeOlculeri([0, 0]);
    } else if (sablonTipi === 'salon') {
      setUrunTipi('pencere'); setGenislik(2100); setYukseklik(1200);
      setBolmeSayisi(3); setKanatlar(['sabit', 'cift_sag', 'sabit']); setBolmeOlculeri([0, 0, 0]);
    }
  };

  const handleBolmeDegisimi = (e) => {
    const yeniSayi = Number(e.target.value);
    setBolmeSayisi(yeniSayi);
    setKanatlar(Array(yeniSayi).fill('sabit'));
    setBolmeOlculeri(Array(yeniSayi).fill(0)); 
  };

  const handleKanatDegisimi = (index, yeniTip) => {
    const yeniKanatlar = [...kanatlar];
    yeniKanatlar[index] = yeniTip;
    setKanatlar(yeniKanatlar);
  };

  const handleKayitOl = async (e) => {
    e.preventDefault();
    if (!onay) {
      alert("Lütfen aydınlatma metnini onaylayınız.");
      return;
    }

    setKayitYukleniyor(true);

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    try {
      const adParcalari = adSoyad.trim().split(' ');
      const firstName = adParcalari[0] || '';
      const lastName = adParcalari.slice(1).join(' ') || '';

      const kayitVerisi = {
        username: eposta,
        email: eposta,
        password: sifre,
        ad_soyad: adSoyad,
        first_name: firstName,
        last_name: lastName,
        telefon: telefon,
        firma_adi: firmaAdi.trim() || `${adSoyad.trim()} Atölyesi`,
        form_tipi: formTipi
      };

      await axios.post('http://127.0.0.1:8001/api/users/register/', kayitVerisi, {
        headers: { 'Authorization': '' }
      });

      try {
        const loginRes = await axios.post('http://127.0.0.1:8001/api/users/login/', {
          username: eposta,
          password: sifre
        });

        if (loginRes.data && loginRes.data.access) {
          localStorage.setItem('access_token', loginRes.data.access);
          if (loginRes.data.refresh) {
            localStorage.setItem('refresh_token', loginRes.data.refresh);
          }
        }
      } catch (loginErr) {
        console.warn("Otomatik login es geçildi:", loginErr);
      }

      alert(`Harika! "${firmaAdi || adSoyad}" hesabın başarıyla oluşturuldu! 🚀`);
      navigate('/cizim');

    } catch (error) {
      console.error("Kayıt Hatası Detayı:", error.response?.data || error);
      const mesaj = error.response?.data ? JSON.stringify(error.response.data) : "Kayıt yapılırken bir hata oluştu.";
      alert("Kayıt Uyarısı:\n" + mesaj);
    } finally {
      setKayitYukleniyor(false);
    }
  };

  const handlePaketSec = (paketAdi, aylikFiyat) => {
    const netFiyat = yillikMi ? (aylikFiyat * 12 * 0.8) : (aylikFiyat * 1);
    setSeciliPaket({ adi: `${paketAdi} (${yillikMi ? 'Yıllık Abonelik' : 'Aylık Abonelik'})`, fiyat: Math.round(netFiyat) });
    setOdemeModalAcik(true);
  };

  const handleOdemeTamamla = (e) => {
    e.preventDefault();
    if (!kartOnay) {
      alert("Lütfen mesafeli satış sözleşmesini onaylayınız.");
      return;
    }
    setOdemeModalAcik(false);
    navigate('/cizim');
  };

  const sablonBtnStyle = { padding: '8px 14px', backgroundColor: '#f1f5f9', color: '#1E3A8A', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', transition: '0.2s' };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#F8FAFC', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden' }}>

      <style>{`
        .primary-btn { background: #1E3A8A; color: #ffffff; transition: all 0.3s ease; }
        .primary-btn:hover { background: #1e40af; transform: translateY(-2px); }
        .form-input { width: 100%; padding: 14px 16px; border-radius: 10px; border: 1px solid #cbd5e1; background-color: #ffffff; color: #0f172a; font-size: 15px; box-sizing: border-box; outline: none; transition: all 0.2s; }
        .form-input:focus { border-color: #1E3A8A; box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.15); }
        .istatistik-kutu { border-radius: 16px; padding: 20px 10px; color: white; text-align: center; font-weight: bold; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .ozellik-kart { background: #ffffff; border-radius: 16px; padding: 30px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); transition: 0.3s; }
        .ozellik-kart:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.08); border-color: #1E3A8A; }
        .hero-title { font-size: 40px; }
        .magaza-btn {
          background-color: #0f172a; color: #ffffff; padding: 14px 28px; border-radius: 12px; display: inline-flex; align-items: center; gap: 12px; text-decoration: none; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }
        .magaza-btn:hover { background-color: #1E3A8A; transform: translateY(-2px); }
        .google-card-btn {
          width: 100%; padding: 14px; border: 1px solid #cbd5e1; border-radius: 10px; background-color: #ffffff; color: #0f172a; font-size: 15px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .google-card-btn:hover { background-color: #f8fafc; border-color: #1E3A8A; transform: translateY(-1px); }
        .social-link { color: #94a3b8; display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; background: #1e293b; transition: all 0.3s ease; text-decoration: none; }
        .social-link:hover { background: #1E3A8A; color: #ffffff; transform: translateY(-3px); }
        
        @media (max-width: 768px) {
          .hero-title { font-size: 26px !important; }
          .istatistik-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
          .header-nav { display: none !important; }
        }
      `}</style>

      {/* 1. ÜST HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#1E3A8A', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: '900', fontSize: '18px' }}>V</div>
          <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px' }}>eWindoore</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }} className="header-nav">
            <button onClick={() => scrollToSection('demo')} style={{ background: 'none', border: 'none', color: '#475569', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Özellikler</button>
            <button onClick={() => scrollToSection('indir')} style={{ background: 'none', border: 'none', color: '#1E3A8A', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Uygulamayı İndir 📥</button>
            <button onClick={() => scrollToSection('fiyatlar')} style={{ background: 'none', border: 'none', color: '#475569', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Fiyatlar</button>
          </nav>
          
          <button onClick={() => googleLogin()} style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
            Giriş Yap
          </button>
        </div>
      </header>

      {/* 2. HERO + KAYIT FORMU */}
      <section style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #172554 100%)', padding: '50px 20px 80px 20px', position: 'relative' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>
          
          <div style={{ color: '#ffffff' }}>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#93C5FD', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block', marginBottom: '20px' }}>
              ⚡ YENİ NESİL DİJİTAL ATÖLYE YÖNETİMİ
            </span>
            <h1 className="hero-title" style={{ fontWeight: '900', lineHeight: '1.2', marginBottom: '20px' }}>
              Atölyenizi Dijitalleştirin, <span style={{ color: '#60A5FA' }}>Hatalı Ölçüye Son Verin!</span>
            </h1>
            <p style={{ fontSize: '16px', color: '#93C5FD', lineHeight: '1.6', marginBottom: '30px' }}>
              Saniyeler içinde doğrama çizin, net imalat dökümünü çıkarın, tek tıkla kurumsal PDF teklifinizi oluşturun.
            </p>
            <div style={{ display: 'flex', gap: '15px', color: '#E2E8F0', fontSize: '14px', fontWeight: '600', flexWrap: 'wrap' }}>
              <span>✓ Sınırsız 2D Çizim</span>
              <span>✓ Otomatik B.O.M Raporu</span>
              <span>✓ Profesyonel CRM</span>
            </div>
          </div>

          <div id="kayit-formu" style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
              <button type="button" onClick={() => setFormTipi('bireysel')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', backgroundColor: formTipi === 'bireysel' ? '#1E3A8A' : 'transparent', color: formTipi === 'bireysel' ? '#ffffff' : '#64748b', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: '0.2s' }}>Bireysel</button>
              <button type="button" onClick={() => setFormTipi('kurumsal')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', backgroundColor: formTipi === 'kurumsal' ? '#1E3A8A' : 'transparent', color: formTipi === 'kurumsal' ? '#ffffff' : '#64748b', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: '0.2s' }}>Kurumsal</button>
            </div>
            
            <button type="button" onClick={() => googleLogin()} className="google-card-btn" style={{ marginBottom: '16px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Google ile Tek Tıkla Giriş Yap
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>veya e-posta ile kayıt ol</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
            </div>

            <form onSubmit={handleKayitOl} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Firma / Atölye Adınız
                </label>
                <input 
                  type="text" 
                  required 
                  value={firmaAdi} 
                  onChange={e => setFirmaAdi(e.target.value)} 
                  placeholder={formTipi === 'kurumsal' ? "Örn: Koçak Yapı A.Ş." : "Örn: Yılmaz Doğrama Atölyesi"} 
                  className="form-input" 
                />
              </div>

              <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>Adınız ve Soyadınız</label><input type="text" required value={adSoyad} onChange={e => setAdSoyad(e.target.value)} placeholder="Ahmet Yılmaz" className="form-input" /></div>
              <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>Telefon Numaranız</label><input type="tel" required value={telefon} onChange={e => setTelefon(e.target.value)} placeholder="05XX XXX XX XX" className="form-input" /></div>
              <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>Gmail / E-posta Adresiniz</label><input type="email" required value={eposta} onChange={e => setEposta(e.target.value)} placeholder="ornek@gmail.com" className="form-input" /></div>
              <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>Şifre Belirle</label><input type="password" required value={sifre} onChange={e => setSifre(e.target.value)} placeholder="••••••••" className="form-input" /></div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
                  <input type="checkbox" required checked={onay} onChange={e => setOnay(e.target.checked)} style={{ accentColor: '#1E3A8A', marginTop: '2px' }} />
                  <span>
                    <strong 
                      onClick={(e) => { e.preventDefault(); setAydinlatmaModalAcik(true); }} 
                      style={{ color: '#1E3A8A', textDecoration: 'underline', cursor: 'pointer' }}>
                      Aydınlatma Metni'ni
                    </strong> okudum, kişisel verilerimin işlenmesini onaylıyorum.
                  </span>
                </label>
              </div>

              <button type="submit" disabled={kayitYukleniyor} className="primary-btn" style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '4px' }}>
                {kayitYukleniyor ? 'Giriş Yapılıyor...' : 'Hemen Kaydol ve Çizim Yap ➔'}
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* 3. İSTATİSTİK SAYACI */}
      <section style={{ maxWidth: '1100px', margin: '-30px auto 40px auto', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div className="istatistik-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          <div className="istatistik-kutu" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)' }}>
            <div className="istatistik-sayi" style={{ fontSize: '30px', fontWeight: '900', marginBottom: '4px' }}>500+</div>
            <div className="istatistik-metin" style={{ fontSize: '13px', fontWeight: '600', opacity: 0.9 }}>Aktif Kullanıcı</div>
          </div>
          <div className="istatistik-kutu" style={{ background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)' }}>
            <div className="istatistik-sayi" style={{ fontSize: '30px', fontWeight: '900', marginBottom: '4px' }}>5,000+</div>
            <div className="istatistik-metin" style={{ fontSize: '13px', fontWeight: '600', opacity: 0.9 }}>Toplam Kullanıcı</div>
          </div>
          <div className="istatistik-kutu" style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)' }}>
            <div className="istatistik-sayi" style={{ fontSize: '30px', fontWeight: '900', marginBottom: '4px' }}>500+</div>
            <div className="istatistik-metin" style={{ fontSize: '13px', fontWeight: '600', opacity: 0.9 }}>Kayıtlı İşletme</div>
          </div>
        </div>
      </section>

      {/* 4. UYGULAMAYI ÜCRETSİZ İNDİRİN + MİMARİ ÇİZİM EKRANI */}
      <section id="indir" style={{ padding: '60px 20px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <span style={{ color: '#1E3A8A', fontWeight: '800', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>MOBİL & TABLET UYUMLU</span>
        <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: '10px 0 15px 0' }}>eWindoore Uygulamasını Ücretsiz İndirin</h2>
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '30px', maxWidth: '700px', margin: '0 auto 30px auto' }}>
          Atölyenizde veya şantiyede ölçüleri anında cebinizden girin, tek tıkla kurumsal teklif oluşturun.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '50px' }}>
          <a href="https://www.apple.com/app-store/" target="_blank" rel="noreferrer" className="magaza-btn">
            <svg width="26" height="26" viewBox="0 0 384 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '9px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Download on the</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', lineHeight: '1.2' }}>App Store ➔</div>
            </div>
          </a>
          <a href="https://play.google.com" target="_blank" rel="noreferrer" className="magaza-btn">
            <svg width="22" height="22" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
              <path fill="#00D9FF" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z"/>
              <path fill="#00F076" d="M47 0c-5.4 4.7-8.6 11.9-8.6 21.3v469.4c0 9.4 3.2 16.6 8.6 21.3l282.4-282.4L47 0z"/>
              <path fill="#F73177" d="M325.3 277.7L47 501c8.6 7.5 20.4 8.1 33.1 1L385 328.7l-59.7-51z"/>
              <path fill="#FFBC00" d="M385 183.3L80.1 10c-13-7.4-24.5-6.5-33.1 1l278.3 267.3 59.7-51.4z"/>
            </svg>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '9px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Get it on</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', lineHeight: '1.2' }}>Google Play ➔</div>
            </div>
          </a>
        </div>
        
        {/* HAZIR ŞABLONLAR & DEMO ALANI */}
        <div id="demo" style={{ scrollMarginTop: '100px' }}>
          <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <strong style={{ color: '#334155', fontSize: '14px' }}>Hazır Şablonlar:</strong>
            <button onClick={() => handleSablonYukle('mutfak')} style={sablonBtnStyle}>🪟 Mutfak Penceresi</button>
            <button onClick={() => handleSablonYukle('wc')} style={sablonBtnStyle}>🚪 WC Kapısı (Lambirili)</button>
            <button onClick={() => handleSablonYukle('fransiz')} style={sablonBtnStyle}>🏢 Fransız Balkon</button>
            <button onClick={() => handleSablonYukle('salon')} style={sablonBtnStyle}>🛋️ Salon (Çift Açılım)</button>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '30px', border: '1px solid #cbd5e1', boxShadow: '0 15px 35px rgba(0,0,0,0.06)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'center' }}>
            
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>⚙️ Profil & Ölçü Kontrolü</h3>
              
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Profil Rengi:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setRenk('antrasit')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: renk === 'antrasit' ? '2px solid #1E3A8A' : '1px solid #cbd5e1', backgroundColor: '#37474f', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Antrasit Gri</button>
                  <button type="button" onClick={() => setRenk('beyaz')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: renk === 'beyaz' ? '2px solid #1E3A8A' : '1px solid #cbd5e1', backgroundColor: '#fcfcfc', color: '#0f172a', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Klasik Beyaz</button>
                  <button type="button" onClick={() => setRenk('altin_mese')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: renk === 'altin_mese' ? '2px solid #1E3A8A' : '1px solid #cbd5e1', backgroundColor: '#b8860b', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Altın Meşe</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Genişlik (mm)</label>
                  <input type="number" value={genislik} onChange={e => setGenislik(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" style={{ textAlign: 'center', fontWeight: 'bold' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Yükseklik (mm)</label>
                  <input type="number" value={yukseklik} onChange={e => setYukseklik(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" style={{ textAlign: 'center', fontWeight: 'bold' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Bölme Sayısı:</label>
                <select value={bolmeSayisi} onChange={handleBolmeDegisimi} className="form-input" style={{ padding: '10px' }}>
                  {[1, 2, 3, 4].map(num => <option key={num} value={num}>{num} Bölmeli Sistem</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Kanat Açılım Tipleri:</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {kanatlar.map((kanatTipi, index) => (
                    <div key={index} style={{ flex: 1, minWidth: '110px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>{index + 1}. Bölme:</span>
                      <select value={kanatTipi} onChange={(e) => handleKanatDegisimi(index, e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}>
                        <option value="sabit">Sabit</option>
                        <option value="sag">Sağa Açılır</option>
                        <option value="sol">Sola Açılır</option>
                        <option value="cift_sag">Çift Açılım</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div style={{ backgroundColor: '#f8fafc', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px', border: '1px solid #cbd5e1', position: 'relative' }}>
              
              <svg viewBox={`-120 -80 ${gGenislik + 240} ${gYukseklik + 160}`} style={{ width: '100%', maxWidth: '100%', maxHeight: '340px', height: 'auto', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="demoCam" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e1f5fe" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#81d4fa" stopOpacity="0.75" />
                  </linearGradient>
                </defs>

                <text x={gGenislik / 2} y={gYukseklik + 55} textAnchor="middle" fontSize="45" fill="#334155" fontWeight="bold">EN: {Math.round(gGenislik)} mm</text>
                <text x="-50" y={gYukseklik / 2} textAnchor="middle" transform={`rotate(-90, -50, ${gYukseklik / 2})`} fontSize="45" fill="#334155" fontWeight="bold">BOY: {Math.round(gYukseklik)} mm</text>

                <rect x="0" y="0" width={gGenislik} height={gYukseklik} fill={seciliRenk.fill} stroke={seciliRenk.border} strokeWidth="10" rx="4" />
                
                {(() => {
                  let currentX = p;
                  return bolmeler.map((index) => {
                    const bg = hesaplananGenislikler[index];
                    const kanatTipi = kanatlar[index];
                    const isSon = index === bolmeSayisi - 1;
                    const camX = currentX + p;
                    const camY = p + p;
                    const camW = bg - (2 * p);
                    const camH = icYukseklik - (2 * p);

                    const isWcKapi = urunTipi === 'wc_kapi';
                    const lambiriYukseklik = isWcKapi ? camH * 0.45 : 0;
                    const ustCamYukseklik = isWcKapi ? camH - lambiriYukseklik : camH;

                    let maviCizgi = "";
                    if (kanatTipi === 'sag') {
                      maviCizgi = `M ${camX + camW} ${camY} L ${camX} ${camY + (ustCamYukseklik/2)} L ${camX + camW} ${camY + ustCamYukseklik}`;
                    } else if (kanatTipi === 'sol') {
                      maviCizgi = `M ${camX} ${camY} L ${camX + camW} ${camY + (ustCamYukseklik/2)} L ${camX} ${camY + ustCamYukseklik}`;
                    } else if (kanatTipi === 'cift_sag') {
                      maviCizgi = `M ${camX + camW} ${camY} L ${camX} ${camY + (ustCamYukseklik/2)} L ${camX + camW} ${camY + ustCamYukseklik} M ${camX} ${camY + ustCamYukseklik} L ${camX + (camW/2)} ${camY} L ${camX + camW} ${camY + ustCamYukseklik}`;
                    }

                    const isSag = kanatTipi === 'sag' || kanatTipi === 'cift_sag';
                    const isSol = kanatTipi === 'sol';
                    const kolX = isSag ? currentX + 22 : (isSol ? currentX + bg - 22 : currentX + bg/2);
                    const kolY = p + (ustCamYukseklik / 2);

                    const renderBilesen = (
                      <g key={index}>
                        <rect x={currentX} y={p} width={bg} height={icYukseklik} fill={kanatTipi !== 'sabit' ? seciliRenk.fill : 'url(#demoCam)'} stroke={seciliRenk.border} strokeWidth="6" rx="3" />
                        
                        {kanatTipi !== 'sabit' && (
                          <>
                            <rect x={camX} y={camY} width={camW} height={ustCamYukseklik} fill="url(#demoCam)" stroke="#90a4ae" strokeWidth="2" />
                            
                            {isWcKapi && (
                              <g>
                                <rect x={camX} y={camY + ustCamYukseklik} width={camW} height={lambiriYukseklik} fill={seciliRenk.fill} stroke="#90a4ae" strokeWidth="2" />
                                {Array.from({ length: 5 }).map((_, lIdx) => (
                                  <line key={lIdx} x1={camX} y1={camY + ustCamYukseklik + (lambiriYukseklik / 6) * (lIdx + 1)} x2={camX + camW} y2={camY + ustCamYukseklik + (lambiriYukseklik / 6) * (lIdx + 1)} stroke={seciliRenk.border} strokeWidth="1.5" opacity="0.6" />
                                ))}
                              </g>
                            )}

                            {maviCizgi && <path d={maviCizgi} stroke="#0288d1" fill="none" strokeWidth="3" strokeDasharray="12,8" />}

                            {isSag && (
                              <>
                                <rect x={currentX + bg - 8} y={p + 80} width="6" height="25" rx="2" fill="#cfd8dc" stroke="#37474f" strokeWidth="1.5" />
                                <rect x={currentX + bg - 8} y={p + icYukseklik - 100} width="6" height="25" rx="2" fill="#cfd8dc" stroke="#37474f" strokeWidth="1.5" />
                              </>
                            )}
                            {isSol && (
                              <>
                                <rect x={currentX + 2} y={p + 80} width="6" height="25" rx="2" fill="#cfd8dc" stroke="#37474f" strokeWidth="1.5" />
                                <rect x={currentX + 2} y={p + icYukseklik - 100} width="6" height="25" rx="2" fill="#cfd8dc" stroke="#37474f" strokeWidth="1.5" />
                              </>
                            )}

                            <g transform={`translate(${kolX}, ${kolY})`}>
                              <rect x="-5" y="-18" width="10" height="36" rx="3" fill="#cfd8dc" stroke="#37474f" strokeWidth="2" />
                              <circle cx="0" cy="0" r="3.5" fill="#263238" />
                              <rect x={isSag ? 5 : -25} y="-5" width="25" height="10" rx="3" fill="#eceff1" stroke="#37474f" strokeWidth="1.5" />
                            </g>
                          </>
                        )}

                        {!isSon && <rect x={currentX + bg} y={p} width={p} height={icYukseklik} fill={seciliRenk.fill} stroke={seciliRenk.border} strokeWidth="5" />}
                      </g>
                    );
                    currentX += bg + p;
                    return renderBilesen;
                  });
                })()}
              </svg>
              
            </div>

          </div>
        </div>
      </section>

      {/* 5. FİYATLANDIRMA & ABONELİKLER */}
      <section id="fiyatlar" style={{ padding: '60px 20px', maxWidth: '950px', margin: '0 auto', scrollMarginTop: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>Şeffaf Abonelik ve Fiyatlar</h2>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '8px' }}>Atölyenize en uygun paketi seçin, hemen kazanmaya başlayın.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="ozellik-kart" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>Usta / Bireysel</h3>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#1E3A8A', margin: '15px 0' }}>₺499 <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>/ ay</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', textAlign: 'left', fontSize: '14px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>✓ Tek Kullanıcı / Usta Hesabı</li>
              <li>✓ Sınırsız 2D Çizim ve Hesaplama</li>
              <li>✓ Otomatik Cam ve Profil Ölçüsü</li>
            </ul>
            <button onClick={() => handlePaketSec('Usta / Bireysel', 499)} className="primary-btn" style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hemen Satın Al 💳</button>
          </div>

          <div className="ozellik-kart" style={{ textAlign: 'center', border: '2px solid #1E3A8A', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1E3A8A', color: '#ffffff', padding: '4px 14px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' }}>EN ÇOK TERCİH EDİLEN</span>
            <h3 style={{ fontSize: '20px', color: '#1E3A8A', fontWeight: '800' }}>KOBİ / Atölye</h3>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#1E3A8A', margin: '15px 0' }}>₺1.299 <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>/ ay</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', textAlign: 'left', fontSize: '14px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>✓ 1 Patron + 3 Usta/Personel Hesabı</li>
              <li>✓ Kurumsal PDF Teklif & Fatura</li>
              <li>✓ Gelişmiş CRM ve Sipariş Takibi</li>
            </ul>
            <button onClick={() => handlePaketSec('KOBİ / Atölye', 1299)} className="primary-btn" style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hemen Satın Al 💳</button>
          </div>
        </div>
      </section>

      {/* 6. NASIL ÇALIŞIR? */}
      <section id="nasil-calisir" style={{ padding: '60px 20px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>Nasıl Çalışır?</h2>
          <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '40px' }}>3 Basit Adımda Atölyeni Dijitalleştir!</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', textAlign: 'left' }}>
            <div className="ozellik-kart" style={{ cursor: 'pointer' }} onClick={() => scrollToSection('kayit-formu')}>
              <div style={{ width: '50px', height: '50px', backgroundColor: '#DBEAFE', color: '#1E3A8A', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>1</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Hemen Üye Ol ➔</h3>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>Telefon ve kısa bilgilerinle saniyeler içinde ücretsiz hesabını oluştur.</p>
            </div>

            <div className="ozellik-kart" style={{ cursor: 'pointer' }} onClick={() => scrollToSection('demo')}>
              <div style={{ width: '50px', height: '50px', backgroundColor: '#DBEAFE', color: '#1E3A8A', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>2</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Hemen Çizmeye Başla ➔</h3>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>Ölçüleri gir, doğramanı tasarla ve imalat listesini anında cebinde gör.</p>
            </div>

            <div className="ozellik-kart" style={{ cursor: 'pointer' }} onClick={() => scrollToSection('fiyatlar')}>
              <div style={{ width: '50px', height: '50px', backgroundColor: '#DBEAFE', color: '#1E3A8A', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>3</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Hızlı Çizim ve Teklif ➔</h3>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>Müşterine profesyonel PDF teklif sun, siparişini hatasız kapat.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. KİMLER KULLANABİLİR? */}
      <section style={{ padding: '60px 20px', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>Kimler Kullanabilir?</h2>
          <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '40px' }}>İstediğin sektörde profesyonel çözümler bulabilirsin.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: '20px 25px', borderRadius: '14px', border: '1px solid #e2e8f0', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>🪟 PVC Pencere & Kapı Sistemleri Üreticileri</div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '20px 25px', borderRadius: '14px', border: '1px solid #e2e8f0', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>🏗️ Alüminyum Doğrama Atölyeleri</div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '20px 25px', borderRadius: '14px', border: '1px solid #e2e8f0', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>🧵 Pilise Perde & Sineklik İmalatçıları</div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '20px 25px', borderRadius: '14px', border: '1px solid #e2e8f0', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>👷 Bağımsız Ustalar & Montaj Ekipleri</div>
          </div>
        </div>
      </section>

      {/* ÖDEME MODALI */}
      {odemeModalAcik && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 15, 23, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '460px', padding: '30px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>🔒 256-Bit SSL Güvenli Ödeme</h3>
              <button onClick={() => setOdemeModalAcik(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#475569' }}>{seciliPaket?.adi}</span>
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#1E3A8A' }}>{seciliPaket?.fiyat.toLocaleString('tr-TR')} ₺</span>
            </div>
            <form onSubmit={handleOdemeTamamla} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Kart Üzerindeki Ad Soyad</label><input type="text" required value={kartAd} onChange={e => setKartAd(e.target.value)} placeholder="Ahmet Yılmaz" className="form-input" /></div>
              <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Kart Numarası</label><input type="text" required maxLength="19" value={kartNo} onChange={e => setKartNo(e.target.value)} placeholder="4543 0000 0000 0000" className="form-input" /></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Ay</label><input type="text" required maxLength="2" value={ay} onChange={e => setAy(e.target.value)} placeholder="08" className="form-input" style={{ textAlign: 'center' }} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Yıl</label><input type="text" required maxLength="2" value={yil} onChange={e => setYil(e.target.value)} placeholder="28" className="form-input" style={{ textAlign: 'center' }} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>CVV</label><input type="text" required maxLength="3" value={cvv} onChange={e => setCvv(e.target.value)} placeholder="123" className="form-input" style={{ textAlign: 'center' }} /></div>
              </div>
              <button type="submit" className="primary-btn" style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '5px' }}>Ödemeyi Güvenle Tamamla ve Giriş Yap 🔒</button>
            </form>
          </div>
        </div>
      )}

      {/* KVKK VE AYDINLATMA METNİ MODALI */}
      {aydinlatmaModalAcik && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 15, 23, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '30px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>📜 Kişisel Verilerin Korunması ve Aydınlatma Metni</h3>
              <button onClick={() => setAydinlatmaModalAcik(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p><strong>1. Veri Sorumlusu:</strong> eWindoore Software ("Şirket") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kullanıcılarımızın kişisel verilerinin gizliliğine ve güvenliğine büyük önem veriyoruz.</p>
              <p><strong>2. İşlenen Kişisel Verileriniz:</strong> Platformumuza kayıt olurken sağladığınız Ad Soyad, E-posta Adresi, Telefon Numarası, Firma/İşletme Bilgileri ve şifrelenmiş parola verileriniz işlenmektedir.</p>
              <p><strong>3. Verilerin İşlenme Amacı:</strong> Kişisel verileriniz, eWindoore yazılım hizmetlerinin sunulması, atölye hesaplamaları ve imalat raporlarının oluşturulması, müşteri destek süreçlerinin yürütülmesi ve teknik altyapı güvenliğinin sağlanması amacıyla işlenir.</p>
              <p><strong>4. Verilerin Aktarılması:</strong> Kişisel verileriniz, yasal zorunluluklar saklı kalmak kaydıyla üçüncü şahıslarla, reklam ortaklarıyla veya alakasız kurumlarla kesinlikle paylaşılmaz.</p>
              <p><strong>5. Haklarınız:</strong> KVKK'nın 11. maddesi uyarınca, verilerinizin silinmesini, güncellenmesini veya işlenip işlenmediğini öğrenme hakkına sahipsiniz. İletişim için destek ekibimizle görüşebilirsiniz.</p>
            </div>

            <button 
              onClick={() => setAydinlatmaModalAcik(false)} 
              className="primary-btn" 
              style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginTop: '20px' }}>
              Okudum, Anladım ve Kapat
            </button>
          </div>
        </div>
      )}

      {/* 8. FOOTER */}
      <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', padding: '40px 20px', textAlign: 'center', borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#1E3A8A', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: '900', fontSize: '16px' }}>V</div>
            <h2 style={{ fontSize: '22px', color: '#ffffff', letterSpacing: '2px', margin: 0, fontWeight: '900' }}>eWindoore</h2>
          </div>
          
          <p style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>Yeni Nesil PVC & Alüminyum Atölye Yönetim Platformu</p>
          
          {/* RESPONSIVE SOSYAL MEDYA İKONLARI */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', margin: '10px 0' }}>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-link" title="Instagram">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-link" title="LinkedIn">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>

          <div style={{ fontSize: '12px', color: '#64748B' }}>
            © 2026 eWindoore Software. Tüm Hakları Saklıdır. Koçak Yapı iş birliğiyle geliştirilmiştir.
          </div>
        </div>
      </footer>

    </div>
  );
}