import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * eWindoore — Profil Ekranı
 *
 * Backend uçları:
 *   GET  users/me/               → kullanıcı + rol + firma_adi
 *   GET  users/istatistikler/    → proje_sayisi, cizim_sayisi, teklif_sayisi, calisan_sayisi
 *   GET  users/abonelik-durumu/  → kalan gün, paket durumu
 *   PATCH users/profile-update/  → ad, soyad, eposta, telefon, firma adı
 *   POST users/password-change/  → şifre değiştir
 *   POST users/calisan-ekle/     → çalışan ekle (sadece patron)
 *   POST users/hesap-dondur/     → dondurma toggle (sadece patron)
 *   POST users/hesap-sil/        → hesap sil (firma_adi doğrulaması ister)
 */

export default function ProfilePage() {
  const navigate = useNavigate();
  const { kullanici, patronMu, cikis } = useAuth();

  const [gorunum, setGorunum] = useState('ana');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesaj, setMesaj] = useState(null);   // { tip: 'ok'|'hata', metin }

  const [profil, setProfil] = useState({
    adSoyad: '', eposta: '', telefon: '', firmaAdi: '',
  });

  const [istatistik, setIstatistik] = useState({
    proje_sayisi: 0, cizim_sayisi: 0, teklif_sayisi: 0, calisan_sayisi: 0,
  });

  const [abonelik, setAbonelik] = useState({
    kalan_deneme_gunu: null, abonelik_aktif: false, deneme_doldu_mu: false,
  });

  const [profilKaydediliyor, setProfilKaydediliyor] = useState(false);

  const [sifre, setSifre] = useState({ mevcut: '', yeni: '', tekrar: '' });
  const [sifreKaydediliyor, setSifreKaydediliyor] = useState(false);

  const [calisan, setCalisan] = useState({
    ad_soyad: '', email: '', telefon: '', password: '',
  });
  const [calisanKaydediliyor, setCalisanKaydediliyor] = useState(false);
  const [ekip, setEkip] = useState([]);
  const [ekipYukleniyor, setEkipYukleniyor] = useState(false);
  const [silinenId, setSilinenId] = useState(null);

  const [dondurulmus, setDondurulmus] = useState(false);
  const [dondurmaIsleniyor, setDondurmaIsleniyor] = useState(false);

  const [silmeOnayi, setSilmeOnayi] = useState('');
  const [silmeIsleniyor, setSilmeIsleniyor] = useState(false);

  /* ---------- şirket ayarları (localStorage) ---------- */
  const [firmaLogosu, setFirmaLogosu] = useState(() => localStorage.getItem('ustaFirmaLogosu') || '');
  const [iban, setIban] = useState(() => localStorage.getItem('ustaKurumsalIban') || '');
  const [profilSerisi, setProfilSerisi] = useState(() => Number(localStorage.getItem('ustaProfilSerisi')) || 70);

  const bildir = (tip, metin) => {
    setMesaj({ tip, metin });
    setTimeout(() => setMesaj(null), 5000);
  };

  /* ---------- veri yükleme ---------- */
  const verileriYukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const [meRes, statRes] = await Promise.all([
        API.get('users/me/'),
        API.get('users/istatistikler/').catch(() => null),
      ]);

      const u = meRes.data || {};
      setProfil({
        adSoyad: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        eposta: u.email || '',
        telefon: u.telefon || '',
        firmaAdi: u.firma_adi || '',
      });

      if (statRes?.data) setIstatistik(statRes.data);

      try {
        const abRes = await API.get('users/abonelik-durumu/');
        if (abRes?.data) {
          setAbonelik(abRes.data);
          setDondurulmus(!!abRes.data.abonelik_donduruldu);
        }
      } catch { /* usta 403 alabilir, sorun değil */ }
    } catch (e) {
      console.error('Profil yüklenemedi:', e);
      bildir('hata', 'Profil bilgileri yüklenemedi.');
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { verileriYukle(); }, [verileriYukle]);

  /* ---------- ekip listesi (sadece patron) ---------- */
  const ekibiYukle = useCallback(async () => {
    if (!patronMu) return;
    setEkipYukleniyor(true);
    try {
      const res = await API.get('users/calisan-listesi/');
      setEkip(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Ekip listesi alınamadı:', e);
    } finally {
      setEkipYukleniyor(false);
    }
  }, [patronMu]);

  useEffect(() => {
    if (gorunum === 'ekip') ekibiYukle();
  }, [gorunum, ekibiYukle]);

  /* ---------- personel sil ---------- */
  const personelSil = async (kisi) => {
    const adi = `${kisi.first_name || ''} ${kisi.last_name || ''}`.trim() || kisi.username;
    const soru =
      `${adi} adlı personeli silmek istediğinize emin misiniz?\n\n` +
      `• Giriş hesabı kalıcı olarak silinir\n` +
      `• Kaydettiği projeler SİLİNMEZ, size devredilir\n\n` +
      `Bu işlem geri alınamaz.`;
    if (!window.confirm(soru)) return;

    setSilinenId(kisi.id);
    try {
      await API.delete(`users/calisan-sil/${kisi.id}/`);
      setEkip((prev) => prev.filter((k) => k.id !== kisi.id));
      bildir('ok', `${adi} ekipten çıkarıldı. Projeleri size devredildi.`);
      verileriYukle();
    } catch (e) {
      bildir('hata', hataMetni(e, 'Personel silinemedi.'));
    } finally {
      setSilinenId(null);
    }
  };

  /* ---------- profil güncelle ---------- */
  const profilKaydet = async () => {
    if (!profil.adSoyad.trim()) return bildir('hata', 'Ad soyad boş olamaz.');
    setProfilKaydediliyor(true);
    try {
      const parcalar = profil.adSoyad.trim().split(' ');
      await API.patch('users/profile-update/', {
        first_name: parcalar[0] || '',
        last_name: parcalar.slice(1).join(' ') || '',
        email: profil.eposta,
        telefon: profil.telefon,
        firma_adi: profil.firmaAdi,
      });
      bildir('ok', 'Bilgileriniz güncellendi.');
      setGorunum('ana');
    } catch (e) {
      bildir('hata', hataMetni(e, 'Bilgiler güncellenemedi.'));
    } finally {
      setProfilKaydediliyor(false);
    }
  };

  /* ---------- şifre değiştir ---------- */
  const sifreKaydet = async () => {
    if (!sifre.mevcut || !sifre.yeni) return bildir('hata', 'Tüm alanları doldurun.');
    if (sifre.yeni !== sifre.tekrar) return bildir('hata', 'Yeni şifreler birbiriyle uyuşmuyor.');
    if (sifre.yeni.length < 8) return bildir('hata', 'Şifre en az 8 karakter olmalı.');

    setSifreKaydediliyor(true);
    try {
      await API.post('users/password-change/', {
        old_password: sifre.mevcut,
        new_password: sifre.yeni,
      });
      bildir('ok', 'Şifreniz güncellendi.');
      setSifre({ mevcut: '', yeni: '', tekrar: '' });
      setGorunum('ana');
    } catch (e) {
      bildir('hata', hataMetni(e, 'Şifre değiştirilemedi.'));
    } finally {
      setSifreKaydediliyor(false);
    }
  };

  /* ---------- çalışan ekle ---------- */
  const calisanKaydet = async () => {
    if (!calisan.ad_soyad || !calisan.email || !calisan.password) {
      return bildir('hata', 'Ad soyad, e-posta ve şifre zorunlu.');
    }
    setCalisanKaydediliyor(true);
    try {
      const parcalar = calisan.ad_soyad.trim().split(' ');
      await API.post('users/calisan-ekle/', {
        username: calisan.email,
        email: calisan.email,
        first_name: parcalar[0] || '',
        last_name: parcalar.slice(1).join(' ') || '',
        telefon: calisan.telefon,
        password: calisan.password,
      });
      bildir('ok', `${calisan.ad_soyad} ekibinize eklendi.`);
      setCalisan({ ad_soyad: '', email: '', telefon: '', password: '' });
      verileriYukle();
      ekibiYukle();
    } catch (e) {
      bildir('hata', hataMetni(e, 'Çalışan eklenemedi.'));
    } finally {
      setCalisanKaydediliyor(false);
    }
  };

  /* ---------- şirket ayarları ---------- */
  const logoSec = (e) => {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    if (dosya.size > 500 * 1024) {
      return bildir('hata', 'Logo 500 KB\'dan küçük olmalı.');
    }
    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      const veri = okuyucu.result;
      setFirmaLogosu(veri);
      localStorage.setItem('ustaFirmaLogosu', veri);
      bildir('ok', 'Logo kaydedildi.');
    };
    okuyucu.readAsDataURL(dosya);
  };

  const sirketKaydet = () => {
    localStorage.setItem('ustaKurumsalIban', iban);
    localStorage.setItem('ustaProfilSerisi', String(profilSerisi));
    bildir('ok', 'Şirket ayarları kaydedildi.');
    setGorunum('ana');
  };

  /* ---------- dondurma ---------- */
  const dondurmaDegistir = async () => {
    const soru = dondurulmus
      ? 'Hesabınızın dondurulmasını kaldırmak istiyor musunuz?'
      : 'Hesabınızı dondurmak istiyor musunuz? Verileriniz korunur, dilediğinizde geri dönebilirsiniz.';
    if (!window.confirm(soru)) return;

    setDondurmaIsleniyor(true);
    try {
      const res = await API.post('users/hesap-dondur/', {});
      setDondurulmus(!!res.data?.abonelik_donduruldu);
      bildir('ok', res.data?.message || 'İşlem tamamlandı.');
    } catch (e) {
      bildir('hata', hataMetni(e, 'İşlem tamamlanamadı.'));
    } finally {
      setDondurmaIsleniyor(false);
    }
  };

  /* ---------- hesap sil ---------- */
  const hesabiSil = async () => {
    if (silmeOnayi.trim() !== profil.firmaAdi.trim()) {
      return bildir('hata', 'Firma adını tam olarak yazmanız gerekiyor.');
    }
    const uyari = patronMu
      ? `SON UYARI\n\n"${profil.firmaAdi}" firmasına ait TÜM veriler kalıcı olarak silinecek:\n\n• ${istatistik.proje_sayisi} proje\n• ${istatistik.cizim_sayisi} çizim\n• Fiyat tablonuz\n• ${istatistik.calisan_sayisi} kullanıcı hesabı\n\nBu işlem GERİ ALINAMAZ. Devam edilsin mi?`
      : 'Hesabınız kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?';
    if (!window.confirm(uyari)) return;

    setSilmeIsleniyor(true);
    try {
      await API.post('users/hesap-sil/', { firma_adi: profil.firmaAdi });
      alert('Hesabınız silindi. İlginiz için teşekkür ederiz.');
      cikis();
      navigate('/login');
    } catch (e) {
      bildir('hata', hataMetni(e, 'Hesap silinemedi.'));
      setSilmeIsleniyor(false);
    }
  };

  const cikisYap = () => {
    if (!window.confirm('Çıkış yapmak istediğinize emin misiniz?')) return;
    cikis();
    navigate('/login');
  };

  const basHarfler = (profil.firmaAdi || profil.adSoyad || 'EW')
    .split(' ').filter(Boolean).slice(0, 2)
    .map((k) => k[0]).join('').toUpperCase();

  const paketEtiketi = abonelik.abonelik_aktif
    ? (patronMu ? 'Kurumsal Üye' : 'Ekip Üyesi')
    : (abonelik.deneme_doldu_mu ? 'Deneme Bitti' : `Deneme · ${abonelik.kalan_deneme_gunu ?? 14} gün`);

  return (
    <div className="pf">
      <style>{`
        .pf {
          --ink:#0f1a2e; --ink2:#334154; --muted:#5a6880; --faint:#8492a8;
          --line:#e2e9f2; --line2:#cfdae8; --bg:#f5f8fc; --card:#ffffff;
          --blue:#1f5fd0; --blue-h:#1a51b3; --blue-s:#e8f0fd;
          --ok:#15803d; --ok-bg:#e9f7ef; --warn:#8a5d00; --warn-bg:#fdf6e3;
          --err:#c62828; --err-bg:#fdf0f0;

          min-height:100vh; background:var(--bg); color:var(--ink);
          font-family:'Inter',system-ui,sans-serif; padding-bottom:48px;
        }
        .pf *{box-sizing:border-box;}
        .pf-kap{max-width:640px;margin:0 auto;padding:0 16px;}

        /* ---------- ÜST BAR ---------- */
        .pf-bar{
          position:sticky;top:0;z-index:20;background:rgba(245,248,252,.94);
          backdrop-filter:blur(8px);border-bottom:1px solid var(--line);
          padding:12px 0;margin-bottom:20px;
        }
        .pf-bar-in{max-width:640px;margin:0 auto;padding:0 16px;
          display:flex;align-items:center;gap:12px;}
        .pf-geri{
          background:none;border:none;cursor:pointer;font-family:inherit;
          font-size:14.5px;font-weight:600;color:var(--blue);padding:6px 2px;
          display:flex;align-items:center;gap:5px;
        }
        .pf-geri:hover{text-decoration:underline;}
        .pf-bar-baslik{font-size:15px;font-weight:700;}

        /* ---------- BAŞLIK KARTI ---------- */
        .pf-ust{text-align:center;padding:8px 0 22px;}
        .pf-avatar{
          width:84px;height:84px;border-radius:50%;margin:0 auto 12px;
          background:linear-gradient(145deg,#dcecfb,#b8d8f5);
          color:#123a63;display:grid;place-items:center;
          font-size:30px;font-weight:800;letter-spacing:-.02em;
          border:3px solid #fff;box-shadow:0 3px 12px rgba(16,32,64,.12);
          overflow:hidden;
        }
        .pf-avatar img{width:100%;height:100%;object-fit:contain;background:#fff;}
        .pf-ad{font-size:21px;font-weight:800;letter-spacing:-.02em;margin:0 0 3px;}
        .pf-alt{font-size:13.5px;color:var(--muted);margin:0 0 12px;}
        .pf-etiket{
          display:inline-flex;align-items:center;gap:6px;
          padding:5px 13px;border-radius:100px;font-size:12.5px;font-weight:650;
          background:var(--blue-s);color:var(--blue);
        }
        .pf-etiket.uyari{background:var(--warn-bg);color:var(--warn);}
        .pf-etiket.don{background:#eef1f5;color:var(--muted);}

        /* ---------- İSTATİSTİK ---------- */
        .pf-stat{
          display:grid;grid-template-columns:repeat(3,1fr);
          background:var(--card);border:1px solid var(--line);
          border-radius:13px;overflow:hidden;margin-bottom:20px;
        }
        .pf-stat-h{padding:16px 8px;text-align:center;border-right:1px solid var(--line);}
        .pf-stat-h:last-child{border-right:none;}
        .pf-stat-n{
          font-size:23px;font-weight:800;color:var(--ink);
          font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;
        }
        .pf-stat-t{font-size:11.5px;color:var(--faint);margin-top:3px;}

        /* ---------- MENÜ ---------- */
        .pf-grup{
          background:var(--card);border:1px solid var(--line);
          border-radius:13px;overflow:hidden;margin-bottom:16px;
        }
        .pf-grup-bas{
          font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
          color:var(--faint);padding:0 4px 7px;
        }
        .pf-sat{
          width:100%;display:flex;align-items:center;gap:13px;
          padding:14px 15px;background:none;border:none;cursor:pointer;
          font-family:inherit;font-size:14.8px;color:var(--ink);text-align:left;
          border-bottom:1px solid var(--line);transition:background .13s;
        }
        .pf-sat:last-child{border-bottom:none;}
        .pf-sat:hover{background:#f8fbff;}
        .pf-sat-ic{
          width:34px;height:34px;border-radius:9px;flex-shrink:0;
          background:var(--blue-s);color:var(--blue);
          display:grid;place-items:center;
        }
        .pf-sat-metin{flex:1;min-width:0;}
        .pf-sat-ad{font-weight:600;}
        .pf-sat-not{font-size:12.3px;color:var(--faint);margin-top:1px;}
        .pf-sat-sag{
          font-size:13px;color:var(--muted);flex-shrink:0;
          display:flex;align-items:center;gap:7px;
        }
        .pf-ok{color:var(--faint);flex-shrink:0;}

        .pf-sat.tehlike .pf-sat-ic{background:var(--err-bg);color:var(--err);}
        .pf-sat.tehlike .pf-sat-ad{color:var(--err);}

        /* ---------- FORM ---------- */
        .pf-form{
          background:var(--card);border:1px solid var(--line);
          border-radius:13px;padding:18px;margin-bottom:16px;
        }
        .pf-f{margin-bottom:14px;}
        .pf-lbl{display:block;font-size:12.5px;font-weight:600;color:var(--ink2);margin-bottom:6px;}
        .pf-in{
          width:100%;padding:12px 13px;background:#fff;
          border:1px solid var(--line2);border-radius:9px;
          font-size:15px;color:var(--ink);font-family:inherit;outline:none;
          transition:border-color .15s,box-shadow .15s;
        }
        .pf-in:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(31,95,208,.13);}
        .pf-in:disabled{background:#f4f7fb;color:var(--muted);}
        .pf-ipucu{font-size:12px;color:var(--faint);margin-top:5px;line-height:1.45;}

        .pf-btn{
          width:100%;padding:13px;border-radius:9px;border:1px solid transparent;
          font-size:15px;font-weight:650;font-family:inherit;cursor:pointer;
          transition:background .15s,border-color .15s;
        }
        .pf-btn:disabled{opacity:.55;cursor:not-allowed;}
        .pf-btn-p{background:var(--blue);color:#fff;}
        .pf-btn-p:hover:not(:disabled){background:var(--blue-h);}
        .pf-btn-o{background:#fff;border-color:var(--line2);color:var(--ink);}
        .pf-btn-o:hover:not(:disabled){border-color:var(--blue);}
        .pf-btn-t{background:var(--err);color:#fff;}
        .pf-btn-t:hover:not(:disabled){background:#a91d1d;}
        .pf-btn-cikis{
          background:#fff;border-color:#f0cdcd;color:var(--err);
          display:flex;align-items:center;justify-content:center;gap:8px;
        }
        .pf-btn-cikis:hover{background:var(--err-bg);}

        /* ---------- TEMA / SEÇİM ---------- */
        .pf-secim{display:flex;gap:8px;}
        .pf-secim button{
          flex:1;padding:11px;border-radius:9px;border:1px solid var(--line2);
          background:#fff;font-family:inherit;font-size:13.5px;font-weight:600;
          color:var(--ink2);cursor:pointer;transition:all .15s;
        }
        .pf-secim button:hover{border-color:var(--blue);}
        .pf-secim button.on{background:var(--blue);border-color:var(--blue);color:#fff;}


        /* ---------- EKİP LİSTESİ ---------- */
        .pf-ekip{border:1px solid var(--line);border-radius:10px;overflow:hidden;}
        .pf-ekip-sat{
          display:flex;align-items:center;gap:12px;padding:12px 13px;
          border-bottom:1px solid var(--line);background:#fff;
        }
        .pf-ekip-sat:last-child{border-bottom:none;}
        .pf-ekip-av{
          width:36px;height:36px;border-radius:50%;flex-shrink:0;
          background:#e9f0f9;color:#2b4a70;display:grid;place-items:center;
          font-size:13px;font-weight:700;
        }
        .pf-ekip-metin{flex:1;min-width:0;}
        .pf-ekip-ad{
          display:flex;align-items:center;gap:7px;flex-wrap:wrap;
          font-size:14.3px;font-weight:650;
        }
        .pf-ekip-not{
          display:block;font-size:12.3px;color:var(--faint);margin-top:1px;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
        }
        .pf-rol{
          font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
          padding:2px 7px;border-radius:5px;background:#eef1f5;color:var(--muted);
        }
        .pf-rol.patron{background:var(--blue-s);color:var(--blue);}
        .pf-ekip-siz{font-size:12.5px;color:var(--faint);flex-shrink:0;}
        .pf-ekip-sil{
          width:34px;height:34px;border-radius:8px;flex-shrink:0;
          background:#fff;border:1px solid var(--line2);color:var(--muted);
          cursor:pointer;display:grid;place-items:center;
          transition:all .15s;
        }
        .pf-ekip-sil:hover:not(:disabled){
          border-color:#f0cdcd;background:var(--err-bg);color:var(--err);
        }
        .pf-ekip-sil:disabled{opacity:.5;cursor:not-allowed;}

        /* ---------- BİLDİRİM ---------- */
        .pf-mesaj{
          display:flex;gap:9px;align-items:flex-start;
          padding:12px 14px;border-radius:10px;margin-bottom:16px;
          font-size:13.8px;line-height:1.45;
        }
        .pf-mesaj.ok{background:var(--ok-bg);border:1px solid #bfe5cd;color:var(--ok);}
        .pf-mesaj.hata{background:var(--err-bg);border:1px solid #f3cccc;color:var(--err);}

        /* ---------- UYARI KUTUSU ---------- */
        .pf-uyari{
          background:var(--err-bg);border:1px solid #f3cccc;border-radius:11px;
          padding:15px;margin-bottom:16px;
        }
        .pf-uyari-bas{font-size:14.5px;font-weight:700;color:var(--err);margin-bottom:7px;}
        .pf-uyari-metin{font-size:13.3px;color:#8c3535;line-height:1.55;}
        .pf-uyari-metin ul{margin:8px 0 0;padding-left:18px;}
        .pf-uyari-metin li{margin-bottom:3px;}

        .pf-logo-on{
          width:100%;height:96px;border:1px dashed var(--line2);border-radius:9px;
          display:grid;place-items:center;background:#fafcfe;margin-bottom:10px;
          overflow:hidden;
        }
        .pf-logo-on img{max-width:100%;max-height:100%;object-fit:contain;}
        .pf-logo-bos{font-size:13px;color:var(--faint);}

        .pf-yuk{text-align:center;padding:60px 20px;color:var(--muted);font-size:14px;}

        @media (max-width:520px){
          .pf-stat-n{font-size:20px;}
          .pf-in{font-size:16px;}
        }
      `}</style>

      {/* ================= ÜST BAR ================= */}
      <div className="pf-bar">
        <div className="pf-bar-in">
          {gorunum === 'ana' ? (
            <>
              <button className="pf-geri" onClick={() => navigate('/cizim')}>
                <Ok yon="sol" /> Çizim Ekranı
              </button>
              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--faint)' }}>
                {patronMu ? 'Patron' : 'Usta'}
              </span>
            </>
          ) : (
            <>
              <button className="pf-geri" onClick={() => { setGorunum('ana'); setMesaj(null); }}>
                <Ok yon="sol" /> Geri
              </button>
              <span className="pf-bar-baslik">{BASLIKLAR[gorunum] || ''}</span>
            </>
          )}
        </div>
      </div>

      <div className="pf-kap">
        {mesaj && (
          <div className={`pf-mesaj ${mesaj.tip}`}>
            <span>{mesaj.tip === 'ok' ? '✓' : '!'}</span>
            <span>{mesaj.metin}</span>
          </div>
        )}

        {yukleniyor ? (
          <div className="pf-yuk">Bilgiler yükleniyor...</div>
        ) : gorunum === 'ana' ? (
          <>
            {/* ---------- BAŞLIK ---------- */}
            <div className="pf-ust">
              <div className="pf-avatar">
                {firmaLogosu ? <img src={firmaLogosu} alt="" /> : basHarfler}
              </div>
              <h1 className="pf-ad">{profil.firmaAdi || 'Firma adı girilmedi'}</h1>
              <p className="pf-alt">
                {profil.adSoyad || kullanici?.username}
                {profil.eposta ? ` · ${profil.eposta}` : ''}
              </p>
              <span className={`pf-etiket ${dondurulmus ? 'don' : (abonelik.deneme_doldu_mu ? 'uyari' : '')}`}>
                {dondurulmus ? '❄ Hesap Donduruldu' : paketEtiketi}
              </span>
            </div>

            {/* ---------- İSTATİSTİK ---------- */}
            <div className="pf-stat">
              <div className="pf-stat-h">
                <div className="pf-stat-n">{istatistik.proje_sayisi}</div>
                <div className="pf-stat-t">Proje</div>
              </div>
              <div className="pf-stat-h">
                <div className="pf-stat-n">{istatistik.cizim_sayisi}</div>
                <div className="pf-stat-t">Çizim</div>
              </div>
              <div className="pf-stat-h">
                <div className="pf-stat-n">{istatistik.teklif_sayisi}</div>
                <div className="pf-stat-t">Teklif</div>
              </div>
            </div>

            {/* ---------- HESAP ---------- */}
            <div className="pf-grup-bas">Hesap</div>
            <div className="pf-grup">
              <Satir
                ic={<IcKisi />} ad="Hesap Bilgileri"
                not="Ad, e-posta, telefon, firma adı"
                onClick={() => setGorunum('bilgi')}
              />
              <Satir
                ic={<IcKilit />} ad="Şifre Değiştir"
                not="Giriş şifrenizi güncelleyin"
                onClick={() => setGorunum('sifre')}
              />
              <Satir
                ic={<IcZil />} ad="Bildirimler"
                not="Yakında"
                sag="—"
                onClick={() => bildir('ok', 'Bildirim ayarları yakında eklenecek.')}
              />
            </div>

            {/* ---------- UYGULAMA ---------- */}
            <div className="pf-grup-bas">Uygulama</div>
            <div className="pf-grup">
              <Satir
                ic={<IcDil />} ad="Dil"
                not="Şu an yalnızca Türkçe"
                sag="Türkçe"
                onClick={() => bildir('ok', 'İngilizce dil desteği yakında eklenecek.')}
              />
            </div>

            {/* ---------- FİRMA (sadece patron) ---------- */}
            {patronMu && (
              <>
                <div className="pf-grup-bas">Firma</div>
                <div className="pf-grup">
                  <Satir
                    ic={<IcBina />} ad="Şirket Ayarları"
                    not="Logo, IBAN, profil serisi"
                    onClick={() => setGorunum('sirket')}
                  />
                  <Satir
                    ic={<IcEkip />} ad="Ekip Yönetimi"
                    not="Usta ve personel hesapları"
                    sag={`${istatistik.calisan_sayisi} kişi`}
                    onClick={() => setGorunum('ekip')}
                  />
                  <Satir
                    ic={<IcTaç />} ad="Abonelik"
                    not={dondurulmus ? 'Donduruldu' : paketEtiketi}
                    onClick={() => setGorunum('abonelik')}
                  />
                </div>
              </>
            )}

            {/* ---------- TEHLİKELİ ---------- */}
            <div className="pf-grup-bas">Hesap İşlemleri</div>
            <div className="pf-grup">
              {patronMu && (
                <Satir
                  ic={<IcKar />} ad={dondurulmus ? 'Dondurmayı Kaldır' : 'Hesabımı Dondur'}
                  not="Verileriniz korunur, sonra geri dönebilirsiniz"
                  onClick={dondurmaDegistir}
                />
              )}
              <Satir
                tehlike ic={<IcCop />} ad="Hesabımı Sil"
                not={patronMu ? 'Firma ve tüm veriler kalıcı olarak silinir' : 'Hesabınız kalıcı olarak silinir'}
                onClick={() => setGorunum('sil')}
              />
            </div>

            <button className="pf-btn pf-btn-cikis" onClick={cikisYap}>
              <IcCikis /> Çıkış Yap
            </button>
          </>

        ) : gorunum === 'bilgi' ? (
          <div className="pf-form">
            <div className="pf-f">
              <label className="pf-lbl">Ad Soyad</label>
              <input className="pf-in" value={profil.adSoyad}
                onChange={(e) => setProfil({ ...profil, adSoyad: e.target.value })} />
            </div>
            <div className="pf-f">
              <label className="pf-lbl">E-posta</label>
              <input className="pf-in" type="email" value={profil.eposta}
                onChange={(e) => setProfil({ ...profil, eposta: e.target.value })} />
            </div>
            <div className="pf-f">
              <label className="pf-lbl">Telefon</label>
              <input className="pf-in" type="tel" inputMode="numeric" value={profil.telefon}
                onChange={(e) => setProfil({ ...profil, telefon: e.target.value })} />
            </div>
            <div className="pf-f">
              <label className="pf-lbl">Firma / Atölye Adı</label>
              <input className="pf-in" value={profil.firmaAdi} disabled={!patronMu}
                onChange={(e) => setProfil({ ...profil, firmaAdi: e.target.value })} />
              {!patronMu && <div className="pf-ipucu">Firma adını yalnızca patron değiştirebilir.</div>}
            </div>
            <button className="pf-btn pf-btn-p" onClick={profilKaydet} disabled={profilKaydediliyor}>
              {profilKaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>

        ) : gorunum === 'sifre' ? (
          <div className="pf-form">
            <div className="pf-f">
              <label className="pf-lbl">Mevcut Şifre</label>
              <input className="pf-in" type="password" value={sifre.mevcut}
                onChange={(e) => setSifre({ ...sifre, mevcut: e.target.value })}
                autoComplete="current-password" />
            </div>
            <div className="pf-f">
              <label className="pf-lbl">Yeni Şifre</label>
              <input className="pf-in" type="password" value={sifre.yeni}
                onChange={(e) => setSifre({ ...sifre, yeni: e.target.value })}
                autoComplete="new-password" />
              <div className="pf-ipucu">En az 8 karakter, sadece sayı olmasın.</div>
            </div>
            <div className="pf-f">
              <label className="pf-lbl">Yeni Şifre (Tekrar)</label>
              <input className="pf-in" type="password" value={sifre.tekrar}
                onChange={(e) => setSifre({ ...sifre, tekrar: e.target.value })}
                autoComplete="new-password" />
            </div>
            <button className="pf-btn pf-btn-p" onClick={sifreKaydet} disabled={sifreKaydediliyor}>
              {sifreKaydediliyor ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </div>

        ) : gorunum === 'sirket' ? (
          <div className="pf-form">
            <div className="pf-f">
              <label className="pf-lbl">Firma Logosu</label>
              <div className="pf-logo-on">
                {firmaLogosu
                  ? <img src={firmaLogosu} alt="Logo" />
                  : <span className="pf-logo-bos">Logo yüklenmedi</span>}
              </div>
              <input className="pf-in" type="file" accept="image/*" onChange={logoSec} />
              <div className="pf-ipucu">
                Teklif PDF'inin üst kısmında görünür. En fazla 500 KB, PNG veya JPG.
              </div>
            </div>
            <div className="pf-f">
              <label className="pf-lbl">Kurumsal IBAN</label>
              <input className="pf-in" value={iban} placeholder="TR00 0000 0000 0000 0000 0000 00"
                onChange={(e) => setIban(e.target.value)} />
              <div className="pf-ipucu">Teklif PDF'inde ödeme bilgisi olarak görünür.</div>
            </div>
            <div className="pf-f">
              <label className="pf-lbl">Varsayılan Profil Serisi (mm)</label>
              <div className="pf-secim">
                {[60, 70, 80].map((s) => (
                  <button key={s} className={profilSerisi === s ? 'on' : ''}
                    onClick={() => setProfilSerisi(s)}>{s} mm</button>
                ))}
              </div>
              <div className="pf-ipucu">Yeni çizimlerde bu seri seçili gelir.</div>
            </div>
            <button className="pf-btn pf-btn-p" onClick={sirketKaydet}>Kaydet</button>
          </div>

        ) : gorunum === 'ekip' ? (
          <>
            <div className="pf-form">
              <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>Yeni Personel Ekle</div>
              <div className="pf-ipucu" style={{ marginBottom: 14 }}>
                Eklediğiniz kişi <strong>usta</strong> rolünde açılır: ölçü girer, çizim
                yapar, sepete ekler — ancak fiyatları ve raporları göremez.
              </div>
              <div className="pf-f">
                <label className="pf-lbl">Ad Soyad</label>
                <input className="pf-in" value={calisan.ad_soyad}
                  onChange={(e) => setCalisan({ ...calisan, ad_soyad: e.target.value })} />
              </div>
              <div className="pf-f">
                <label className="pf-lbl">E-posta (giriş için)</label>
                <input className="pf-in" type="email" value={calisan.email}
                  onChange={(e) => setCalisan({ ...calisan, email: e.target.value })} />
              </div>
              <div className="pf-f">
                <label className="pf-lbl">Telefon</label>
                <input className="pf-in" type="tel" inputMode="numeric" value={calisan.telefon}
                  onChange={(e) => setCalisan({ ...calisan, telefon: e.target.value })} />
              </div>
              <div className="pf-f">
                <label className="pf-lbl">Geçici Şifre</label>
                <input className="pf-in" type="text" value={calisan.password}
                  onChange={(e) => setCalisan({ ...calisan, password: e.target.value })} />
                <div className="pf-ipucu">
                  En az 8 karakter. Personele iletin, ilk girişten sonra kendisi değiştirebilir.
                </div>
              </div>
              <button className="pf-btn pf-btn-p" onClick={calisanKaydet} disabled={calisanKaydediliyor}>
                {calisanKaydediliyor ? 'Ekleniyor...' : 'Personeli Ekle'}
              </button>
            </div>
            <div className="pf-form">
              <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 12 }}>
                Ekibiniz {ekip.length > 0 && <span style={{ color: 'var(--faint)', fontWeight: 500 }}>({ekip.length} kişi)</span>}
              </div>

              {ekipYukleniyor ? (
                <div style={{ fontSize: 13.5, color: 'var(--muted)', padding: '8px 0' }}>
                  Liste yükleniyor...
                </div>
              ) : ekip.length === 0 ? (
                <div style={{ fontSize: 13.5, color: 'var(--muted)', padding: '8px 0' }}>
                  Henüz personel eklenmemiş.
                </div>
              ) : (
                <div className="pf-ekip">
                  {ekip.map((k) => {
                    const adi = `${k.first_name || ''} ${k.last_name || ''}`.trim() || k.username;
                    const bu = k.rol === 'patron';
                    return (
                      <div className="pf-ekip-sat" key={k.id}>
                        <span className="pf-ekip-av">
                          {adi.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                        </span>
                        <span className="pf-ekip-metin">
                          <span className="pf-ekip-ad">
                            {adi}
                            <span className={`pf-rol ${bu ? 'patron' : ''}`}>
                              {bu ? 'Patron' : 'Usta'}
                            </span>
                          </span>
                          <span className="pf-ekip-not">{k.email || k.username}</span>
                          {k.telefon && <span className="pf-ekip-not">{k.telefon}</span>}
                        </span>
                        {bu ? (
                          <span className="pf-ekip-siz">Siz</span>
                        ) : (
                          <button className="pf-ekip-sil" onClick={() => personelSil(k)}
                            disabled={silinenId === k.id} title="Personeli sil">
                            {silinenId === k.id ? '...' : <IcCop />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pf-ipucu" style={{ marginTop: 12 }}>
                Bireysel pakette tek kullanıcı, kurumsal pakette sınırsız kullanıcı bulunur.
                Bir personeli sildiğinizde kaydettiği projeler silinmez, size devredilir.
              </div>
            </div>
          </>

        ) : gorunum === 'abonelik' ? (
          <div className="pf-form">
            <div className="pf-f">
              <label className="pf-lbl">Mevcut Durum</label>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                {dondurulmus ? 'Donduruldu' : paketEtiketi}
              </div>
              {!abonelik.abonelik_aktif && !abonelik.deneme_doldu_mu && (
                <div className="pf-ipucu">
                  Deneme süreniz bittiğinde çizim yapmaya devam etmek için abonelik
                  başlatmanız gerekir. Mevcut projeleriniz her durumda korunur.
                </div>
              )}
            </div>
            <div className="pf-f">
              <label className="pf-lbl">Paketler</label>
              <div style={{ fontSize: 13.8, color: 'var(--ink2)', lineHeight: 1.7 }}>
                <div><strong>Bireysel · 250 ₺/ay</strong> — tek kullanıcı, her şey sınırsız</div>
                <div><strong>Kurumsal · 500 ₺/ay</strong> — sınırsız kullanıcı, yetki ayrımı</div>
              </div>
              <div className="pf-ipucu">
                Ödeme altyapısı hazırlanıyor. Abonelik başlatmak için bizimle
                iletişime geçebilirsiniz.
              </div>
            </div>
            <button className="pf-btn pf-btn-o" onClick={dondurmaDegistir} disabled={dondurmaIsleniyor}>
              {dondurmaIsleniyor
                ? 'İşleniyor...'
                : dondurulmus ? 'Dondurmayı Kaldır' : 'Hesabımı Dondur'}
            </button>
          </div>

        ) : gorunum === 'sil' ? (
          <>
            <div className="pf-uyari">
              <div className="pf-uyari-bas">Bu işlem geri alınamaz</div>
              <div className="pf-uyari-metin">
                {patronMu ? (
                  <>
                    <strong>{profil.firmaAdi}</strong> firmasına ait her şey kalıcı olarak silinecek:
                    <ul>
                      <li>{istatistik.proje_sayisi} proje ve {istatistik.cizim_sayisi} çizim</li>
                      <li>Tüm müşteri kayıtları ve teklifler</li>
                      <li>Fiyat tablonuz ve ayarlarınız</li>
                      <li>{istatistik.calisan_sayisi} kullanıcı hesabı (personeliniz dahil)</li>
                    </ul>
                  </>
                ) : (
                  <>
                    Hesabınız kalıcı olarak silinecek. Firmanın diğer kayıtları
                    etkilenmez, yalnızca sizin giriş hesabınız kaldırılır.
                  </>
                )}
              </div>
            </div>

            <div className="pf-form">
              <div className="pf-f">
                <label className="pf-lbl">
                  Onaylamak için firma adını yazın: <strong>{profil.firmaAdi}</strong>
                </label>
                <input className="pf-in" value={silmeOnayi}
                  onChange={(e) => setSilmeOnayi(e.target.value)}
                  placeholder={profil.firmaAdi} autoComplete="off" />
                <div className="pf-ipucu">
                  Yanlışlıkla silmeyi önlemek için firma adını tam olarak yazmanız gerekiyor.
                </div>
              </div>
              <button className="pf-btn pf-btn-t" onClick={hesabiSil}
                disabled={silmeIsleniyor || silmeOnayi.trim() !== profil.firmaAdi.trim()}>
                {silmeIsleniyor ? 'Siliniyor...' : 'Hesabımı Kalıcı Olarak Sil'}
              </button>
            </div>

            <button className="pf-btn pf-btn-o" onClick={() => { setGorunum('ana'); setSilmeOnayi(''); }}>
              Vazgeç
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ============================================================
   YARDIMCILAR
   ============================================================ */

const BASLIKLAR = {
  bilgi: 'Hesap Bilgileri',
  sifre: 'Şifre Değiştir',
  sirket: 'Şirket Ayarları',
  ekip: 'Ekip Yönetimi',
  abonelik: 'Abonelik',
  sil: 'Hesabı Sil',
};

function hataMetni(e, yedek) {
  const v = e?.response?.data;
  if (!v) return yedek;
  if (typeof v === 'string' && v.trim()) return v;
  if (v.error) return Array.isArray(v.error) ? v.error.join(' ') : String(v.error);
  if (v.detail) return Array.isArray(v.detail) ? v.detail.join(' ') : String(v.detail);
  if (typeof v === 'object') {
    const satirlar = Object.entries(v)
      .map(([alan, m]) => `${alan}: ${Array.isArray(m) ? m.join(' ') : m}`);
    if (satirlar.length) return satirlar.join(' · ');
  }
  return yedek;
}

function Satir({ ic, ad, not, sag, onClick, tehlike }) {
  return (
    <button className={`pf-sat ${tehlike ? 'tehlike' : ''}`} onClick={onClick}>
      <span className="pf-sat-ic">{ic}</span>
      <span className="pf-sat-metin">
        <span className="pf-sat-ad" style={{ display: 'block' }}>{ad}</span>
        {not && <span className="pf-sat-not" style={{ display: 'block' }}>{not}</span>}
      </span>
      <span className="pf-sat-sag">
        {sag}
        <span className="pf-ok"><Ok yon="sag" /></span>
      </span>
    </button>
  );
}

function Ok({ yon }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d={yon === 'sol' ? 'M10 3.5L5.5 8l4.5 4.5' : 'M6 3.5L10.5 8L6 12.5'}
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const svg = (cocuk) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">{cocuk}</svg>
);

const IcKisi = () => svg(<>
  <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
  <path d="M5 20c0-3.3 3.1-5.4 7-5.4s7 2.1 7 5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
</>);

const IcKilit = () => svg(<>
  <rect x="4.5" y="10.5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
  <path d="M8 10.5V7.5a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" />
</>);

const IcZil = () => svg(<>
  <path d="M6.5 10a5.5 5.5 0 0111 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  <path d="M10 18.5a2.2 2.2 0 004 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
</>);

const IcDil = () => svg(<>
  <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
  <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.3 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.3-3.6-8.5S9.6 5.8 12 3.5z"
    stroke="currentColor" strokeWidth="1.7" />
</>);

const IcBina = () => svg(<>
  <rect x="4" y="3.5" width="10" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
  <path d="M14 9h5a1.5 1.5 0 011.5 1.5v10H14" stroke="currentColor" strokeWidth="1.8" />
  <path d="M7 7.5h4M7 11h4M7 14.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
</>);

const IcEkip = () => svg(<>
  <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.8" />
  <path d="M3.5 19.5c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  <path d="M16.5 6.7a2.9 2.9 0 010 5.6M18.5 18c0-2-.8-3.4-2-4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
</>);

const IcTaç = () => svg(<>
  <path d="M3.5 8l3.5 3 5-6 5 6 3.5-3-2 10.5H5.5L3.5 8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
</>);

const IcKar = () => svg(<>
  <path d="M12 3v18M4 7.5l16 9M20 7.5l-16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
</>);

const IcCop = () => svg(<>
  <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  <path d="M10.5 11v5.5M13.5 11v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
</>);

const IcCikis = () => svg(<>
  <path d="M15 4.5H18a2 2 0 012 2v11a2 2 0 01-2 2h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  <path d="M10 8l-4 4 4 4M6 12h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
</>);
