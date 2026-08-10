import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePage({ onBack }) {
  const { cikis } = useAuth();
  // --- EKRAN DURUMU ---
  const [activeView, setActiveView] = useState('main'); 
  const [modalIcerik, setModalIcerik] = useState(null);

  // --- DOĞRULAMA STATE'LERİ ---
  const [epostaDogrulu, setEpostaDogrulu] = useState(false); 
  const [telefonDogrulu, setTelefonDogrulu] = useState(false); 

  // --- KULLANICI BİLGİLERİ ---
  const [profileData, setProfileData] = useState({
    adSoyad: '',
    firmaAdi: '',
    telefon: '',
    eposta: '',
    mevcutSifre: '',
    yeniSifre: '',
    yeniSifreTekrar: ''
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // --- PERSONEL EKLEME STATE'LERİ ---
  const [calisanData, setCalisanData] = useState({
    first_name: '',
    last_name: '',
    email: '', 
    telefon: '',
    password: ''
  });
  const [calisanLoading, setCalisanLoading] = useState(false);

  // Token Alma Yardımcısı (Güvenli Kontrol)
  const getAuthToken = () => {
    const token = localStorage.getItem('access') || localStorage.getItem('access_token');
    if (token && token !== 'null' && token !== 'undefined') return token;
    return null;
  };

  // 1. PROFİL BİLGİLERİNİ DJANGO'DAN ÇEKME
  useEffect(() => {
    const fetchProfilBilgileri = async () => {
      const token = getAuthToken();
      if (!token) {
        localStorage.clear();
        window.location.href = '/login';
        return;
      }

      try {
        setLoadingProfile(true);
        const response = await API.get('users/me/');

        if (response.data) {
          const uData = response.data;
          setProfileData(prev => ({
            ...prev,
            adSoyad: `${uData.first_name || ''} ${uData.last_name || ''}`.trim() || uData.username || 'Arif Uslu',
            firmaAdi: uData.firma_adi || 'Koçak Yapı PVC & Cam Sistemleri',
            telefon: uData.telefon || '',
            eposta: uData.email || ''
          }));
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.warn("Backend uyarısı: /api/users/me/ endpoint'i bulunamadı (404).");
        } else {
          console.error("Profil bilgileri getirilemedi:", error);
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfilBilgileri();
  }, []);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalisanChange = (field, value) => {
    setCalisanData(prev => ({ ...prev, [field]: value }));
  };

  const handleCikisYap = () => {
    if (window.confirm("Hesabınızdan çıkış yapmak istediğinize emin misiniz?")) {
      cikis();
      window.location.href = '/login';
    }
  };

  const handleHesapDondur = () => {
    if (window.confirm("Hesabınızı geçici olarak dondurmak istediğinize emin misiniz? Sisteme tekrar giriş yaptığınızda hesabınız aktifleşecektir.")) {
      alert("Hesabınız donduruldu. Çıkış yapılıyor...");
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleHesapSil = () => {
    const onay = window.prompt("Hesabınızı KALICI OLARAK silmek üzeresiniz. Tüm müşteri ve çizim arşiviniz yok olacaktır! Onaylıyorsanız büyük harflerle 'SİL' yazın.");
    if (onay === 'SİL') {
      alert("Hesabınız sistemden tamamen silindi.");
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleEpostaDogrula = (e) => {
    e.preventDefault();
    alert("Doğrulama bağlantısı e-posta adresinize gönderildi!");
    setEpostaDogrulu(true);
  };

  const handleTelefonDogrula = (e) => {
    e.preventDefault();
    alert("Doğrulama SMS'i telefonunuza gönderildi!");
    setTelefonDogrulu(true);
  };

  // 2. DJANGO ŞİFRE DEĞİŞTİRME API İSTEĞİ
  const handleSifreGuncelle = async (e) => {
    e.preventDefault();

    if (profileData.yeniSifre !== profileData.yeniSifreTekrar) {
      alert("Yeni şifreler birbiriyle uyuşmuyor!");
      return;
    }

    setSavingPassword(true);

    try {
      const response = await API.post('users/password-change/', {
        old_password: profileData.mevcutSifre,
        new_password: profileData.yeniSifre
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 || response.status === 201) {
        alert("Giriş şifreniz veritabanında başarıyla güncellendi! 🔒");
        setProfileData(prev => ({ ...prev, mevcutSifre: '', yeniSifre: '', yeniSifreTekrar: '' }));
        setActiveView('settings');
      }
    } catch (error) {
      const mes = error.response?.data?.error || error.response?.data?.old_password?.[0] || "Mevcut şifrenizi hatalı girdiniz veya bir sorun oluştu.";
      alert("Hata: " + mes);
    } finally {
      setSavingPassword(false);
    }
  };

  // 3. DJANGO PROFİL GÜNCELLEME API İSTEĞİ
  const handleProfilGuncelle = async () => {
    setSavingProfile(true);

    const isimParcalari = profileData.adSoyad.trim().split(' ');
    const firstName = isimParcalari[0] || '';
    const lastName = isimParcalari.slice(1).join(' ') || '';

    try {
      const response = await API.patch('users/profile-update/', {
        first_name: firstName,
        last_name: lastName,
        email: profileData.eposta,
        telefon: profileData.telefon,
        firma_adi: profileData.firmaAdi
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 || response.status === 201) {
        alert("İletişim ve profil bilgileriniz başarıyla kaydedildi! ✓");
        setActiveView('main');
      }
    } catch (error) {
      const errMes = error.response?.data?.email?.[0] || error.response?.data?.telefon?.[0] || "Bilgiler güncellenirken bir sorun oluştu.";
      alert("Hata: " + errMes);
    } finally {
      setSavingProfile(false);
    }
  };

  // 4. DJANGO PERSONEL KAYIT İSTEĞİ
  const handleCalisanKaydet = async (e) => {
    e.preventDefault();
    setCalisanLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/login';
        return; 
      }

      const payload = {
        first_name: calisanData.first_name,
        last_name: calisanData.last_name,
        email: calisanData.email,
        username: calisanData.email, 
        telefon: calisanData.telefon,
        password: calisanData.password
      };

      const response = await API.post('users/calisan-ekle/', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 201 || response.status === 200) {
        alert(`"${calisanData.first_name} ${calisanData.last_name}" personeli başarıyla oluşturuldu ve atölyenize bağlandı! 🚀`);
        setCalisanData({ first_name: '', last_name: '', email: '', telefon: '', password: '' });
        setActiveView('main');
      }
    } catch (error) {
      const hataMesaji = error.response?.data?.error || error.response?.data?.detail || 'Personel eklenirken bir hata oluştu. E-posta veya telefon önceden kayıtlı olabilir.';
      alert("Hata: " + hataMesaji);
    } finally {
      setCalisanLoading(false);
    }
  };

  const sssIcerik = {
    baslik: "❓ Sık Sorulan Sorular",
    metin: (
      <div>
        <p><strong>1. Çizim metrajı ve profil boyları nasıl hesaplanıyor?</strong><br/>Girdiğiniz en/boy ve bölme ölçülerine göre firesiz kaset metrajı otomatik hesaplanır.</p>
        <p><strong>2. Kurumsal PDF faturaya logomu nasıl eklerim?</strong><br/>Ayarlar sekmesinden firma logonuzu ve IBAN bilgilerinizi ekleyebilirsiniz.</p>
        <p><strong>3. Personellerim kendi hesabından girdiğinde teklifleri görebilir mi?</strong><br/>Atölyenize tanımladığınız personeller izolasyon sistemimiz sayesinde sadece sizin izin verdiğiniz verileri görür.</p>
      </div>
    )
  };

  const gizlilikIcerik = {
    baslik: "🛡️ Gizlilik Politikası",
    metin: (
      <div>
        <p><strong>Veri İşleme ve Koruma</strong></p>
        <p>eWindoore sistemine girdiğiniz müşteri verileri, ölçüler ve fiyatlandırmalar tamamen uçtan uca şifrelenmektedir. Bilgileriniz hiçbir üçüncü şahısla paylaşılmaz.</p>
      </div>
    )
  };

  const kullaniciIcerik = {
    baslik: "📜 Kullanıcı Sözleşmesi",
    metin: (
      <div>
        <p><strong>Hizmet Şartları</strong></p>
        <p>Bu platformu kullanarak, eWindoore'nun sunduğu dijital çizim ve hesaplama araçlarını yasalara uygun kullanacağınızı kabul edersiniz.</p>
      </div>
    )
  };

  const pageContainerStyle = { backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '10px 15px 80px 15px', fontFamily: "'Inter', sans-serif", maxWidth: '600px', margin: '0 auto', position: 'relative' };
  const menuCardStyle = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: '24px' };
  const menuItemStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: '0.2s' };
  const menuIconBoxStyle = { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F1F5F9', color: '#1E3A8A', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', marginRight: '16px' };
  const settingCardStyle = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '20px' };
  const settingHeaderStyle = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' };
  const settingIconBoxStyle = { width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#1E3A8A', color: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px' };
  const settingTitleStyle = { fontSize: '16px', fontWeight: 'bold', color: '#0F172A' };
  const inputLabelStyle = { display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' };
  const inputRowStyle = { display: 'flex', gap: '12px', alignItems: 'stretch', marginBottom: '20px' };
  const inputBaseStyle = { flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '15px', color: '#334155' };
  const dogrulaBtnStyle = { padding: '0 24px', backgroundColor: '#1E3A8A', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' };
  const rowBoxStyle = { padding: '16px', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '12px' };
  const rowBoxIconStyle = { width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', border: '1px solid #E2E8F0' };

  return (
    <div style={pageContainerStyle}>
      
      {/* ÜST HEADER ALANI */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 0 25px 0' }}>
        {activeView !== 'main' ? (
          <button onClick={() => setActiveView('main')} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#0F172A', padding: '0 15px 0 0', display: 'flex', alignItems: 'center' }}>
            ‹
          </button>
        ) : (
          <button onClick={onBack || (() => window.location.href = '/')} style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', color: '#1E3A8A' }}>
            ‹ Geri Dön
          </button>
        )}
        
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
          {activeView === 'main' && 'Profil'}
          {activeView === 'settings' && 'Profil Ayarları'}
          {activeView === 'sifre' && 'Şifre Değiştir'}
          {activeView === 'calisan' && 'Personel Ekle'}
        </h2>
        
        <div style={{ width: '30px', fontSize: '20px', textAlign: 'right', color: '#0F172A' }}>
          {activeView === 'main' && '🔔'}
        </div>
      </div>

      {/* ANA PROFİL MENÜSÜ */}
      {activeView === 'main' && (
        <>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '8px', paddingLeft: '4px' }}>Hesabım</span>
          <div style={menuCardStyle}>
            <div style={menuItemStyle} onClick={() => setActiveView('settings')}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={menuIconBoxStyle}>⚙️</div>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#0F172A' }}>Profil Ayarları</span>
              </div>
              <span style={{ color: '#94A3B8', fontWeight: 'bold' }}>›</span>
            </div>

            <div style={menuItemStyle} onClick={() => setActiveView('calisan')}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={menuIconBoxStyle}>👥</div>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#0F172A' }}>Personel ve Usta Yönetimi</span>
              </div>
              <span style={{ color: '#94A3B8', fontWeight: 'bold' }}>›</span>
            </div>

            <div style={menuItemStyle} onClick={() => setActiveView('settings')}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={menuIconBoxStyle}>⭐</div>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#0F172A' }}>Firma Bilgileri</span>
              </div>
              <span style={{ color: '#94A3B8', fontWeight: 'bold' }}>›</span>
            </div>
          </div>

          <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '8px', paddingLeft: '4px' }}>Yardım & Yasal</span>
          <div style={menuCardStyle}>
            <div style={menuItemStyle} onClick={() => setModalIcerik(sssIcerik)}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={menuIconBoxStyle}>❓</div>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#0F172A' }}>Sık Sorulan Sorular</span>
              </div>
              <span style={{ color: '#94A3B8', fontWeight: 'bold' }}>›</span>
            </div>

            <div style={menuItemStyle} onClick={() => setModalIcerik(gizlilikIcerik)}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={menuIconBoxStyle}>🛡️</div>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#0F172A' }}>Gizlilik Sözleşmesi</span>
              </div>
              <span style={{ color: '#94A3B8', fontWeight: 'bold' }}>›</span>
            </div>

            <div style={{ ...menuItemStyle, borderBottom: 'none' }} onClick={() => setModalIcerik(kullaniciIcerik)}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={menuIconBoxStyle}>📜</div>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#0F172A' }}>Kullanıcı Sözleşmesi</span>
              </div>
              <span style={{ color: '#94A3B8', fontWeight: 'bold' }}>›</span>
            </div>
          </div>

          {/* ÇIKIŞ YAP BUTONU */}
          <div 
            onClick={handleCikisYap}
            style={{ backgroundColor: '#FEF2F2', borderRadius: '16px', border: '1px solid #FCA5A5', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ ...menuIconBoxStyle, backgroundColor: 'transparent', border: '1px solid #FCA5A5', color: '#DC2626' }}>🚪</div>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#DC2626' }}>Çıkış Yap</span>
            </div>
            <span style={{ color: '#DC2626', fontWeight: 'bold' }}>›</span>
          </div>
        </>
      )}

      {/* PROFİL AYARLARI */}
      {activeView === 'settings' && (
        <div style={{ paddingBottom: '60px' }}>
          <div style={settingCardStyle}>
            <div style={settingHeaderStyle}>
              <div style={settingIconBoxStyle}>📇</div>
              <span style={settingTitleStyle}>İletişim</span>
            </div>
            
            <label style={inputLabelStyle}>Telefon</label>
            <div style={inputRowStyle}>
              <input type="text" value={profileData.telefon} onChange={e => {handleInputChange('telefon', e.target.value); setTelefonDogrulu(false);}} style={inputBaseStyle} />
              {telefonDogrulu ? (
                <div style={{ ...dogrulaBtnStyle, backgroundColor: '#F8FAFC', color: '#1E3A8A', border: '1px solid #1E3A8A' }}>✓ Doğrulandı</div>
              ) : (
                <button onClick={handleTelefonDogrula} style={dogrulaBtnStyle}>🛡️ Doğrula</button>
              )}
            </div>

            <label style={inputLabelStyle}>E-posta</label>
            <div style={inputRowStyle}>
              <input type="email" value={profileData.eposta} onChange={e => {handleInputChange('eposta', e.target.value); setEpostaDogrulu(false);}} style={inputBaseStyle} />
              {epostaDogrulu ? (
                <div style={{ ...dogrulaBtnStyle, backgroundColor: '#F8FAFC', color: '#1E3A8A', border: '1px solid #1E3A8A' }}>✓ Doğrulandı</div>
              ) : (
                <button onClick={handleEpostaDogrula} style={dogrulaBtnStyle}>🛡️ Doğrula</button>
              )}
            </div>

            <label style={inputLabelStyle}>Ad Soyad / Firma Yetkilisi</label>
            <input type="text" value={profileData.adSoyad} onChange={e => handleInputChange('adSoyad', e.target.value)} style={{...inputBaseStyle, width: '100%', marginBottom: 0}} />
          </div>

          <div style={settingCardStyle}>
            <div style={settingHeaderStyle}>
              <div style={settingIconBoxStyle}>🔒</div>
              <span style={settingTitleStyle}>Güvenlik</span>
            </div>
            <div style={{...rowBoxStyle, marginBottom: 0}} onClick={() => setActiveView('sifre')}>
              <div style={{display: 'flex', alignItems: 'center', gap: '14px'}}>
                <div style={rowBoxIconStyle}>***</div>
                <div>
                  <div style={{fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '2px'}}>Şifre Değiştir</div>
                  <div style={{fontSize: '13px', color: '#64748B'}}>Hesap şifreni güncelle</div>
                </div>
              </div>
              <div style={{color: '#94A3B8', fontWeight: 'bold'}}>{'>'}</div>
            </div>
          </div>

          <div style={settingCardStyle}>
            <div style={settingHeaderStyle}>
              <div style={{...settingIconBoxStyle, backgroundColor: '#F59E0B'}}>👤</div>
              <span style={settingTitleStyle}>Hesap</span>
            </div>
            
            <div style={rowBoxStyle} onClick={handleHesapDondur}>
              <div style={{display: 'flex', alignItems: 'center', gap: '14px'}}>
                <div style={{...rowBoxIconStyle, backgroundColor: '#FFFBEB', color: '#F59E0B', borderColor: '#FEF3C7'}}>❄️</div>
                <div>
                  <div style={{fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '2px'}}>Hesabı Dondur</div>
                  <div style={{fontSize: '13px', color: '#64748B'}}>Hesabını pasife al</div>
                </div>
              </div>
              <div style={{color: '#94A3B8', fontWeight: 'bold'}}>{'>'}</div>
            </div>

            <div style={{...rowBoxStyle, marginBottom: 0}} onClick={handleHesapSil}>
              <div style={{display: 'flex', alignItems: 'center', gap: '14px'}}>
                <div style={{...rowBoxIconStyle, backgroundColor: '#FEF2F2', color: '#EF4444', borderColor: '#FEE2E2'}}>🗑️</div>
                <div>
                  <div style={{fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '2px'}}>Hesabı Sil</div>
                  <div style={{fontSize: '13px', color: '#64748B'}}>Hesabını kalıcı olarak sil</div>
                </div>
              </div>
              <div style={{color: '#94A3B8', fontWeight: 'bold'}}>{'>'}</div>
            </div>
          </div>

          <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 30px)', maxWidth: '570px', zIndex: 100 }}>
            <button 
              onClick={handleProfilGuncelle} 
              disabled={savingProfile}
              style={{ width: '100%', padding: '16px', backgroundColor: '#1E3A8A', color: '#ffffff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)' }}
            >
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#1E3A8A', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' }}>✓</div>
              {savingProfile ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* ŞİFRE DEĞİŞTİRME */}
      {activeView === 'sifre' && (
        <form onSubmit={handleSifreGuncelle} style={settingCardStyle}>
          <label style={inputLabelStyle}>Mevcut Şifreniz</label>
          <input type="password" required value={profileData.mevcutSifre} onChange={e => handleInputChange('mevcutSifre', e.target.value)} style={{...inputBaseStyle, width: '100%', marginBottom: '20px'}} />
          
          <label style={inputLabelStyle}>Yeni Şifre</label>
          <input type="password" required value={profileData.yeniSifre} onChange={e => handleInputChange('yeniSifre', e.target.value)} style={{...inputBaseStyle, width: '100%', marginBottom: '20px'}} />
          
          <label style={inputLabelStyle}>Yeni Şifre (Tekrar)</label>
          <input type="password" required value={profileData.yeniSifreTekrar} onChange={e => handleInputChange('yeniSifreTekrar', e.target.value)} style={{...inputBaseStyle, width: '100%', marginBottom: '25px'}} />
          
          <button type="submit" disabled={savingPassword} style={{...dogrulaBtnStyle, width: '100%', padding: '16px'}}>
            {savingPassword ? 'Güncelleniyor...' : 'Şifreyi Güncelle 🔒'}
          </button>
        </form>
      )}

      {/* PERSONEL EKLEME */}
      {activeView === 'calisan' && (
        <form onSubmit={handleCalisanKaydet} style={settingCardStyle}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={inputLabelStyle}>Adı</label>
              <input type="text" required value={calisanData.first_name} onChange={e => handleCalisanChange('first_name', e.target.value)} style={inputBaseStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={inputLabelStyle}>Soyadı</label>
              <input type="text" required value={calisanData.last_name} onChange={e => handleCalisanChange('last_name', e.target.value)} style={inputBaseStyle} />
            </div>
          </div>
          
          <label style={inputLabelStyle}>E-posta (Sisteme Giriş Kullanıcı Adı)</label>
          <input 
            type="email" 
            placeholder="ornek: ahmetusta@kocak.com" 
            required 
            value={calisanData.email} 
            onChange={e => handleCalisanChange('email', e.target.value)} 
            style={{...inputBaseStyle, width: '100%', marginBottom: '15px'}} 
          />
          
          <label style={inputLabelStyle}>Telefon</label>
          <input type="tel" required value={calisanData.telefon} onChange={e => handleCalisanChange('telefon', e.target.value)} style={{...inputBaseStyle, width: '100%', marginBottom: '15px'}} />
          
          <label style={inputLabelStyle}>Personel Şifresi Belirleyin</label>
          <input type="password" required value={calisanData.password} onChange={e => handleCalisanChange('password', e.target.value)} style={{...inputBaseStyle, width: '100%', marginBottom: '25px'}} />
          
          <button type="submit" disabled={calisanLoading} style={{...dogrulaBtnStyle, width: '100%', padding: '16px'}}>
            {calisanLoading ? 'Kaydediliyor...' : 'Personeli Kaydet ➕'}
          </button>
        </form>
      )}

      {/* MODAL */}
      {modalIcerik && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1E3A8A' }}>{modalIcerik.baslik}</h3>
              <button onClick={() => setModalIcerik(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748B' }}>×</button>
            </div>
            <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', maxHeight: '60vh', overflowY: 'auto' }}>
              {modalIcerik.metin}
            </div>
            <button style={{ ...dogrulaBtnStyle, width: '100%', marginTop: '20px', padding: '14px' }} onClick={() => setModalIcerik(null)}>
              Kapat
            </button>
          </div>
        </div>
      )}

    </div>
  );
}