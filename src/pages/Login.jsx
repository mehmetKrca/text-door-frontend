import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  
  // --- EKRAN GEÇİŞ STATE'İ (Giriş Yap / Kayıt Ol) ---
  const [isLoginModu, setIsLoginModu] = useState(true);

  // --- GİRİŞ / KAYIT FORM STATE'LERİ ---
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  
  // Kayıt Ol Ekstra Alanları
  const [firmaAdi, setFirmaAdi] = useState('');
  const [adSoyad, setAdSoyad] = useState('');
  const [telefon, setTelefon] = useState('');

  // --- GOOGLE BAŞARILI GİRİŞ FONKSİYONU ---
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await axios.post('http://127.0.0.1:8001/api/users/google/', {
          access_token: tokenResponse.access_token,
        });

        localStorage.setItem('access_token', response.data.access);
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }
        
        alert("Tebrikler kanka! eWindoore'ya Google ile başarıyla giriş yaptık! 🚀");
        navigate('/cizim');

      } catch (error) {
        console.error("Google giriş backend hatası:", error);
        const hataMesaji = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        alert("Giriş hatası:\n\n" + hataMesaji);
      }
    },
    onError: (error) => {
      console.error("Google popup hatası:", error);
      alert("Google ile giriş iptal edildi veya bir hata oluştu.");
    }
  });

  // --- STANDART GİRİŞ (LOGIN) FONKSİYONU ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (kullaniciAdi && sifre) {
      try {
        const response = await axios.post('http://127.0.0.1:8001/api/users/login/', {
          username: kullaniciAdi,
          password: sifre
        });

        localStorage.setItem('access_token', response.data.access);
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }
        navigate('/cizim');
        
      } catch (error) {
        console.error("Giriş hatası:", error);
        alert("Giriş başarısız dostum. E-posta adresini veya şifreyi yanlış girmiş olabilirsin.");
      }
    } else {
      alert("Lütfen e-posta ve şifrenizi giriniz.");
    }
  };

  // GERÇEK DJANGO KAYIT (REGISTER) FONKSİYONU
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8001/api/users/register/', {
        username: kullaniciAdi,
        email: kullaniciAdi,
        password: sifre,
        firma_adi: firmaAdi,
        ad_soyad: adSoyad,
        telefon: telefon
      });

      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }
      }

      alert(`Harika kanka! "${firmaAdi}" hesabın başarıyla oluşturuldu ve içeri giriyoruz! 🚀`);
      navigate('/cizim');

    } catch (error) {
      console.error("Kayıt hatası:", error);
      const hataMesaji = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      alert("Kayıt olurken hata oluştu:\n\n" + hataMesaji);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      padding: '0'
    }}>
      
      <style>{`
        .auth-card {
          background: #ffffff;
          border-radius: 0px;
          box-shadow: none;
          border: none;
          width: 100%;
          max-width: 460px;
          padding: 40px;
          transition: all 0.3s ease;
        }
        .btn-bakir {
          background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
          color: #ffffff;
          transition: all 0.2s ease;
        }
        .btn-bakir:hover {
          opacity: 0.95;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
        }
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background-color: #f8fafc;
          font-size: 14px;
          color: #1e293b;
          box-sizing: border-box;
          transition: all 0.2s;
        }
        .form-input:focus {
          border-color: #D97706 !important;
          background-color: #ffffff !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15) !important;
        }

        /* Bilgisayarda şık bir orta kutu (card) görünümü korunsun */
        @media (min-width: 768px) {
          .auth-card {
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
            background: #ffffff;
          }
          body {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
          }
        }

        /* Telefonda (%768 altı) ekranı uçtan uca %100 doldursun */
        @media (max-width: 767px) {
          .auth-card {
            max-width: 100% !important;
            height: 100vh !important;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 30px 20px !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <div className="auth-card">
        
        {/* LOGO VE BAŞLIK */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <svg width="34" height="34" viewBox="0 0 50 50" fill="none">
              <path d="M10 10 L25 40 L40 10" stroke="#D97706" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M25 40 L40 10 L40 40 Z" fill="#D97706" opacity="0.2"/>
            </svg>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '2px' }}>eWindoore</span>
          </div>

          <h2 style={{ color: '#1e293b', fontSize: '21px', fontWeight: '800', margin: '0 0 4px 0' }}>
            {isLoginModu ? 'Tekrar Hoş Geldiniz 👋' : 'Hemen Ücretsiz Başlayın 🚀'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
            {isLoginModu ? 'Bilgilerinizle hesabınıza giriş yapın.' : '14 gün boyunca tüm özellikleri sınırsız deneyin.'}
          </p>
        </div>

        {/* GİRİŞ / KAYIT SEKME BUTONLARI */}
        <div style={{ display: 'flex', marginBottom: '20px', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '4px', border: '1px solid #e2e8f0' }}>
          <button 
            onClick={() => setIsLoginModu(true)} 
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: isLoginModu ? '#ffffff' : 'transparent', color: isLoginModu ? '#0f172a' : '#64748b', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: isLoginModu ? '0 2px 5px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
            Giriş Yap
          </button>
          <button 
            onClick={() => setIsLoginModu(false)} 
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: !isLoginModu ? '#ffffff' : 'transparent', color: !isLoginModu ? '#D97706' : '#64748b', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: !isLoginModu ? '0 2px 5px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
            Kayıt Ol (14 Gün Bedava)
          </button>
        </div>

        {/* GOOGLE İLE GİRİŞ */}
        <button 
          type="button"
          onClick={() => googleLogin()} 
          style={{ width: '100%', padding: '12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '18px', transition: 'background 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google ile {isLoginModu ? 'Giriş Yap' : 'Kayıt Ol'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>veya e-posta ile</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
        </div>

        {/* ANA FORM */}
        <form onSubmit={isLoginModu ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!isLoginModu && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: '#475569', fontWeight: '600', fontSize: '12px' }}>Firma Adı</label>
                <input type="text" required value={firmaAdi} onChange={(e) => setFirmaAdi(e.target.value)} placeholder="Örn: Koçak Yapı" className="form-input" />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#475569', fontWeight: '600', fontSize: '12px' }}>Ad Soyad</label>
                  <input type="text" required value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} placeholder="Mehmet Yılmaz" className="form-input" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#475569', fontWeight: '600', fontSize: '12px' }}>Telefon</label>
                  <input type="text" value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="0555..." className="form-input" />
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: '#475569', fontWeight: '600', fontSize: '12px' }}>E-Posta Adresi</label>
            <input type="email" required value={kullaniciAdi} onChange={(e) => setKullaniciAdi(e.target.value)} placeholder="ornek@firma.com" className="form-input" />
          </div>
          
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#475569', fontWeight: '600', fontSize: '12px' }}>
              Şifre
            </label>
            <input type="password" required value={sifre} onChange={(e) => setSifre(e.target.value)} placeholder="••••••••" className="form-input" />
          </div>

          <button 
            type="submit" 
            className="btn-bakir"
            style={{ padding: '14px', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>
            {isLoginModu ? 'Sisteme Giriş Yap ➔' : 'Hesabımı Oluştur ve Başla 🚀'}
          </button>
        </form>

        {/* ALT BİLGİ VE ANA SAYFAYA DÖN */}
        <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', cursor: 'pointer', fontWeight: '600' }} onClick={() => navigate('/')}>
            ← Ana Vitrin Sayfasına Geri Dön
          </span>
        </div>

      </div>
    </div>
  );
}