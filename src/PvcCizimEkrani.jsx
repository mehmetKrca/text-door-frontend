import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API, { getAbonelikDurumu, abonelikBaslat } from './services/api';
import ProfilePage from './pages/ProfilePage';
import { useAuth } from './context/AuthContext.jsx';
import { hesapla, hesaplaSineklik } from './utils/fiyatHesapla.js';
import { VARSAYILAN_FIYATLAR, fiyatTablosunuDonustur, SINEKLIK_TIPLERI, sineklikRenkVarMi, CAM_TIPLERI } from './utils/fiyatTablosu.js';
import { patronOzetiHesapla, ARALIK_ADLARI, URUN_ADLARI, DURUM_ADLARI } from './utils/patronOzeti.js';
import DogramaCizim from './components/DogramaCizim.jsx';
import TeklifYazdir from './components/TeklifYazdir.jsx';

// 🎯 TOKEN ALMA YARDIMCI FONKSİYONU
const getAuthToken = () => {
  const token = localStorage.getItem('access') || localStorage.getItem('access_token');
  if (token && token !== 'null' && token !== 'undefined') return token;
  return null;
};

// 🎯 ESKİ CAM TİPİ DEĞERLERİNİ (standart/sinerji) YENİ ŞEMAYA TAŞIR
const camTipiDonustur = (deger) => {
  if (deger === 'standart' || deger === 'sinerji') return 'klasik';
  return deger || 'klasik';
};

// 🎯 ESKİ SİNEKLİK/PERDE ÜRÜN TİPİ DEĞERLERİNİ YENİ ŞEMAYA TAŞIR
const SP_TIPI_ESKI_YENI = { surgulu_sineklik: 'surguluSineklik', plise_perde: 'plisePerde' };
const spTipiDonustur = (deger) => SP_TIPI_ESKI_YENI[deger] || deger || 'menteseliSineklik';
// Rapor/arşiv taramalarında hem eski hem yeni sineklik/perde id'lerini yakalamak için
const SP_URUN_TIPLERI_TUMU = ['menteseliSineklik', 'surguluSineklik', 'plisePerde', 'surgulu_sineklik', 'plise_perde'];

export default function PvcCizimEkrani() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cikis, patronMu } = useAuth();

  const [aktifSekme, setAktifSekme] = useState(() => {
    if (sessionStorage.getItem('return_to_profil') === 'true') {
      sessionStorage.removeItem('return_to_profil');
      return 'profil';
    }
    const kaydedilenSekme = localStorage.getItem('eWindoore_aktif_sekme');
    if (kaydedilenSekme && kaydedilenSekme !== 'profil') {
      return kaydedilenSekme;
    }
    return 'cizim';
  });

  const handleSekmeDegistir = (sekmeAdi) => {
    setAktifSekme(sekmeAdi);
    if (sekmeAdi !== 'profil') {
      localStorage.setItem('eWindoore_aktif_sekme', sekmeAdi);
    }
  };

  // --- ABONELİK VE PAYWALL STATE'LERİ ---
  const [erisimIzni, setErisimIzni] = useState(true);
  const [kalanDenemeGunu, setKalanDenemeGunu] = useState(14);
  const [abonelikAktif, setAbonelikAktif] = useState(false);
  const [paywallModalAcik, setPaywallModalAcik] = useState(false);

  const [seciliPeriyot, setSeciliPeriyot] = useState('Aylık');
  const [kartAd, setKartAd] = useState('');
  const [kartNo, setKartNo] = useState('');
  const [odemeYukleniyor, setOdemeYukleniyor] = useState(false);

  useEffect(() => {
    const denetle = async () => {
      try {
        const res = await getAbonelikDurumu();
        if (res.data) {
          setErisimIzni(res.data.erisim_izni);
          setKalanDenemeGunu(res.data.kalan_deneme_gunu);
          setAbonelikAktif(res.data.abonelik_aktif);
          if (!res.data.erisim_izni) setPaywallModalAcik(true);
        }
      } catch (err) {
        console.error("Abonelik durumu sorgulanamadı:", err);
      }
    };
    denetle();
  }, []);

  const handleAbonelikOde = async (e) => {
    e.preventDefault();
    setOdemeYukleniyor(true);
    try {
      const res = await abonelikBaslat(seciliPeriyot);
      if (res.data && res.data.erisim_izni) {
        alert("Tebrikler! eWindoore Premium aboneliğin başarıyla başlatıldı. 🚀");
        setErisimIzni(true);
        setAbonelikAktif(true);
        setPaywallModalAcik(false);
      }
    } catch (err) {
      alert("Ödeme alınırken bir hata oluştu, lütfen tekrar deneyiniz.");
    } finally {
      setOdemeYukleniyor(false);
    }
  };

  useEffect(() => {
    if (!patronMu && ['patron', 'fiyatlar', 'calisan_ekle'].includes(aktifSekme)) {
      handleSekmeDegistir('cizim');
    }
  }, [patronMu, aktifSekme]);

  // --- MÜŞTERİ ARŞİVİ VE BULUT SENKRONİZASYONU ---
  const [projeAdi, setProjeAdi] = useState('');
  const [sepet, setSepet] = useState([]);
  const [kalemAdi, setKalemAdi] = useState('');
  const [duzenlenenKalemId, setDuzenlenenKalemId] = useState(null);
  
  const [pvcEklendi, setPvcEklendi] = useState(false);
  const [spEklendi, setSpEklendi] = useState(false);

  const [musteriArsivi, setMusteriArsivi] = useState(() => {
    const kayitli = localStorage.getItem('bayiMusteriArsivi');
    return kayitli ? JSON.parse(kayitli) : [];
  });
  const [arsivYukleniyor, setArsivYukleniyor] = useState(false);

  const [musteriAdres, setMusteriAdres] = useState('');
  const [siparisNotu, setSiparisNotu] = useState('');
  const [kurumsalIban, setKurumsalIban] = useState(() => localStorage.getItem('ustaKurumsalIban') || '');

  // --- USTAYA ÖZEL MARJ STATE'LERİ ---
  const [ustaKarTL, setUstaKarTL] = useState(800); 
  const [montajPayiTL, setMontajPayiTL] = useState(500); 
  const [kdvEkle, setKdvEkle] = useState(false); 

  useEffect(() => {
    localStorage.setItem('ustaKurumsalIban', kurumsalIban);
  }, [kurumsalIban]);

  const [firmaLogosu, setFirmaLogosu] = useState(() => localStorage.getItem('ustaFirmaLogosu') || '');

  const handleLogoYukle = (e) => {
    const dosya = e.target.files[0];
    if (dosya) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFirmaLogosu(reader.result);
        localStorage.setItem('ustaFirmaLogosu', reader.result);
      };
      reader.readAsDataURL(dosya);
    }
  };

  useEffect(() => {
    const projeleriBuluttanGetir = async () => {
      const token = getAuthToken();
      if (!token) { setArsivYukleniyor(false); return; }
      try {
        setArsivYukleniyor(true);
        const response = await API.get('users/projeleri-getir/');
        if (response.data && Array.isArray(response.data)) {
          setMusteriArsivi(prev => {
             const yerelArsiv = prev.length > 0 ? prev : JSON.parse(localStorage.getItem('bayiMusteriArsivi') || '[]');
             const birlesmis = [...response.data];
             yerelArsiv.forEach(yItem => {
               if (!birlesmis.some(bItem => String(bItem.id) === String(yItem.id))) {
                 birlesmis.push(yItem);
               }
             });
             localStorage.setItem('bayiMusteriArsivi', JSON.stringify(birlesmis));
             return birlesmis;
          });
        }
      } catch (error) {
        console.error("Bulut verisi senkron hatası:", error);
      } finally {
        setArsivYukleniyor(false);
      }
    };
    if (aktifSekme === 'arsiv' || aktifSekme === 'patron') {
      projeleriBuluttanGetir();
    }
  }, [aktifSekme]);

  const [firmaAdi, setFirmaAdi] = useState('KOÇAK YAPI / PVC ve Doğrama Sistemleri');
  const [musteriTel, setMusteriTel] = useState('');
  const [teklifTarihi, setTeklifTarihi] = useState(new Date().toLocaleDateString('tr-TR'));

  const [urunTipi, setUrunTipi] = useState('pencere'); 
  const [genislik, setGenislik] = useState(1500);
  const [yukseklik, setYukseklik] = useState(1200); 
  const [sagYukseklik, setSagYukseklik] = useState(1600); 
  const [bolmeSayisi, setBolmeSayisi] = useState(2);
  const [kanatlar, setKanatlar] = useState(['sabit', 'cift_sag']);
  const [bolmeOlculeri, setBolmeOlculeri] = useState([0, 0]);
  
  const [enineBolmeVar, setEnineBolmeVar] = useState(false);
  const [enineBolmeYerdenYukseklik, setEnineBolmeYerdenYukseklik] = useState(800);

  const [lambiriBoyu, setLambiriBoyu] = useState(800);
  const [aciModu, setAciModu] = useState('aci_bul');
  const [manuelAci, setManuelAci] = useState(20);
  const [egimYonu, setEgimYonu] = useState('saga_yukselir');

  const [renk, setRenk] = useState('beyaz');
  
  const [profilSerisi, setProfilSerisi] = useState(() => {
    const kayitliSeri = localStorage.getItem('ustaProfilSerisi');
    return kayitliSeri ? Number(kayitliSeri) : 70;
  });

  useEffect(() => {
    localStorage.setItem('ustaProfilSerisi', profilSerisi);
  }, [profilSerisi]);

  const p = Number(profilSerisi) || 70;
  
  const [camTipi, setCamTipi] = useState('klasik');
  const [altPanelLambiri, setAltPanelLambiri] = useState(true);

  const [spTipi, setSpTipi] = useState('menteseliSineklik');
  const [spGenislik, setSpGenislik] = useState(800);
  const [spYukseklik, setSpYukseklik] = useState(2000);
  const [spAdet, setSpAdet] = useState(1);
  const [spAcilimYonu, setSpAcilimYonu] = useState('dikey');
  const [spRenkKademesi, setSpRenkKademesi] = useState('beyaz');

  const [aktifRenkSekmesi, setAktifRenkSekmesi] = useState('beyaz');
  
  const [fiyatTablo, setFiyatTablo] = useState(VARSAYILAN_FIYATLAR);
  const [fiyatYukleniyor, setFiyatYukleniyor] = useState(true);

  const [raporAralik, setRaporAralik] = useState('ay');

  useEffect(() => {
    const fiyatlariBuluttanGetir = async () => {
      try {
        const response = await API.get('users/fiyat-tablosu/');
        const gelenVeri = response.data?.veri || (Object.keys(response.data || {}).length > 0 ? response.data : null);

        if (gelenVeri && Object.keys(gelenVeri).length > 0 && (gelenVeri.beyaz || gelenVeri.seriler)) {
          const donusturulmusTablo = fiyatTablosunuDonustur(gelenVeri);
          setFiyatTablo(donusturulmusTablo);
          localStorage.setItem('ustaFiyatTablosu', JSON.stringify(donusturulmusTablo));
        } else {
          const yerelFiyatlar = localStorage.getItem('ustaFiyatTablosu');
          if (yerelFiyatlar) setFiyatTablo(fiyatTablosunuDonustur(JSON.parse(yerelFiyatlar)));
        }
      } catch (error) {
        console.error("Fiyatlar buluttan çekilemedi:", error);
        const yerelFiyatlar = localStorage.getItem('ustaFiyatTablosu');
        if (yerelFiyatlar) setFiyatTablo(fiyatTablosunuDonustur(JSON.parse(yerelFiyatlar)));
      } finally {
        setFiyatYukleniyor(false);
      }
    };
    fiyatlariBuluttanGetir();
  }, []);

  // yol: ic ice fiyatTablo anahtarlarina giden dizi. Ornek: ['seriler','beyaz','kasa'], ['camlar','klasik'], ['camIsciligi'], ['aksesuarlar','tekAcilim']
  const handleFiyatDegisimi = (yol, deger) => {
    const guncelDeger = deger === '' ? '' : Number(deger);
    setFiyatTablo(prev => {
      const kopya = JSON.parse(JSON.stringify(prev));
      let hedef = kopya;
      for (let i = 0; i < yol.length - 1; i++) {
        hedef = hedef[yol[i]];
      }
      hedef[yol[yol.length - 1]] = guncelDeger;
      return kopya;
    });
  };

  const handleFiyatlariBulutaKaydet = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      await API.post('users/fiyat-tablosu/', fiyatTablo, { headers });
      alert("Birim fiyatlarınız veritabanına başarıyla sabitlendi! 🚀");
      localStorage.setItem('ustaFiyatTablosu', JSON.stringify(fiyatTablo));
    } catch (error) {
      console.error("Fiyatlar kaydedilemedi:", error);
      alert("Fiyatlar veritabanına kaydedilirken bir hata oluştu!");
    }
  };

  const handleCikisYap = () => {
    if (window.confirm("Hesabınızdan çıkış yapmak istediğinize emin misiniz?")) {
      cikis();
      navigate('/login');
    }
  };

  // =======================================================
  // ⚡ DİNAMİK HESAPLAMA MOTORU (DIŞ ÖLÇÜ -> İÇ NET CAM)
  // =======================================================
  const hesaplananVeriler = useMemo(() => {
    // --- Açılı pencerede seçili açı moduna göre eksik ölçüyü türet ---
    let turetilmisGenislik = genislik;
    let turetilmisYukseklik = yukseklik;
    let turetilmisSagYukseklik = sagYukseklik;

    if (urunTipi === 'acili') {
      const gGenHam = Number(genislik) || 0;
      let gYukHam = Number(yukseklik) || 0;
      let gSagYukHam = Number(sagYukseklik) || 0;
      const gAciVal = Number(manuelAci) || 0;
      const tanDegeri = Math.tan(gAciVal * Math.PI / 180);

      if (aciModu === 'sag_boy_bul') {
        const fark = gGenHam * tanDegeri;
        gSagYukHam = egimYonu === 'saga_yukselir' ? gYukHam + fark : Math.max(0, gYukHam - fark);
        turetilmisSagYukseklik = gSagYukHam;
      } else if (aciModu === 'sol_boy_bul') {
        const fark = gGenHam * tanDegeri;
        gYukHam = egimYonu === 'saga_yukselir' ? Math.max(0, gSagYukHam - fark) : gSagYukHam + fark;
        turetilmisYukseklik = gYukHam;
      } else if (aciModu === 'en_bul') {
        if (tanDegeri > 0) {
          const fark = Math.abs(gSagYukHam - gYukHam);
          turetilmisGenislik = fark / tanDegeri;
        }
      }
    }

    const girdi = {
      genislik: turetilmisGenislik,
      yukseklik: turetilmisYukseklik,
      sagYukseklik: turetilmisSagYukseklik,
      profilSerisi,
      urunTipi,
      bolmeSayisi,
      bolmeOlculeri,
      kanatlar,
      renk,
      camTipi,
      enineBolmeVar,
      enineBolmeYerdenYukseklik,
      lambiriVar: altPanelLambiri,
      lambiriBoyu,
      karTL: ustaKarTL,
      montajTL: montajPayiTL,
      kdvEkle,
      adet: 1,
    };

    const sonuc = hesapla(girdi, fiyatTablo);

    const gGen = sonuc.olculer?.genislik ?? Math.max(0, Number(turetilmisGenislik) || 0);
    const gYuk = sonuc.olculer?.yukseklik ?? Math.max(0, Number(turetilmisYukseklik) || 0);
    const sagYukNum = Number(turetilmisSagYukseklik);
    const gSagYuk = Number.isFinite(sagYukNum) ? Math.max(0, sagYukNum) : gYuk;

    return {
      gGenislik: gGen,
      gYukseklik: gYuk,
      gSagYukseklik: gSagYuk,
      icYukseklik: sonuc.olculer?.icYukseklik ?? Math.max(0, gYuk - (2 * p)),
      hesaplananGenislikler: sonuc.olculer?.bolmeGenislikleri ?? [],
      isKapiMi: ['kapi', 'wc_kapi', 'balkonkapi'].includes(urunTipi),
      gercekLambiriVarMi: (sonuc.metraj?.lambiriM2 ?? 0) > 0,
      hamImalatMaliyeti: sonuc.maliyet?.ham ?? 0,
      anlikGenelToplam: sonuc.teklifDetay?.toplam ?? 0,
      sonuc,
    };
  }, [
    genislik, yukseklik, sagYukseklik, manuelAci, aciModu, egimYonu,
    profilSerisi, urunTipi, bolmeSayisi, bolmeOlculeri, kanatlar, renk,
    camTipi, enineBolmeVar, enineBolmeYerdenYukseklik,
    altPanelLambiri, lambiriBoyu, ustaKarTL, montajPayiTL, kdvEkle,
    fiyatTablo, p
  ]);

  const {
    gGenislik, gYukseklik, gSagYukseklik, icYukseklik, hesaplananGenislikler,
    isKapiMi, gercekLambiriVarMi, hamImalatMaliyeti, anlikGenelToplam, sonuc
  } = hesaplananVeriler;

  const sineklikSonucu = useMemo(() => {
    const girdi = {
      genislik: spGenislik,
      yukseklik: spYukseklik,
      adet: spAdet,
      tip: spTipi,
      acilimYonu: spAcilimYonu,
      renkKademesi: spRenkKademesi,
    };
    return hesaplaSineklik(girdi, fiyatTablo);
  }, [spGenislik, spYukseklik, spAdet, spTipi, spAcilimYonu, spRenkKademesi, fiyatTablo]);

  const sepetGenelToplam = useMemo(() => sepet.reduce((acc, kalem) => acc + (Number(kalem.fiyat) || 0), 0), [sepet]);
  const sepetToplamAdet = useMemo(() => sepet.reduce((acc, kalem) => acc + (Number(kalem.adet) || 1), 0), [sepet]);

  const handlePvcSepeteEkle = () => {
    const kalemIsmi = kalemAdi.trim() === '' ? `Doğrama ${sepet.length + 1}` : kalemAdi;
    const anlikFiyat = Number(anlikGenelToplam) || 0;
    const hedefId = duzenlenenKalemId ? duzenlenenKalemId : Date.now();

    const yeniKalem = {
      id: hedefId,
      isim: kalemIsmi,
      urunTipi, 
      genislik: Math.round(gGenislik), 
      yukseklik: Math.round(gYukseklik), 
      sagYukseklik: Math.round(gSagYukseklik), 
      bolmeSayisi, 
      kanatlar: [...kanatlar], 
      bolmeOlculeri: [...bolmeOlculeri],
      renk, 
      renkIsmi: profilRenkleri[renk]?.isim || 'Klasik Beyaz', 
      camTipi,
      camIsmi: camFiyatlari[camTipi]?.isim || 'Klasik Isıcam',
      altPanelLambiri,
      lambiriBoyu,
      enineBolmeVar, 
      enineBolmeYerdenYukseklik: Number(enineBolmeYerdenYukseklik) || 800,
      profilSerisi,
      aciModu, 
      manuelAci, 
      egimYonu,
      adet: 1,
      fiyat: Math.ceil(anlikFiyat)
    };

    setSepet(prev => duzenlenenKalemId ? prev.map(k => k.id === duzenlenenKalemId ? yeniKalem : k) : [...prev, yeniKalem]);
    setDuzenlenenKalemId(null); setKalemAdi(''); setPvcEklendi(true);
    setTimeout(() => setPvcEklendi(false), 1500);
  };

  const handleSpSepeteEkle = () => {
    const defaultIsim = SINEKLIK_TIPLERI.find(t => t.id === spTipi)?.ad || 'Sineklik';
    const kalemIsmi = kalemAdi.trim() === '' ? `${defaultIsim} ${sepet.length + 1}` : kalemAdi;
    const anlikTutar = Number(sineklikSonucu.teklifDetay?.toplam) || 0;
    const hedefId = duzenlenenKalemId ? duzenlenenKalemId : Date.now();

    const yeniKalem = {
      id: hedefId,
      isim: kalemIsmi,
      urunTipi: spTipi,
      genislik: Number(spGenislik),
      yukseklik: Number(spYukseklik),
      adet: Number(spAdet) || 1,
      renk: sineklikRenkVarMi(spTipi) ? spRenkKademesi : 'Standart',
      renkIsmi: sineklikRenkVarMi(spTipi) ? (spRenkKademesi === 'renkli' ? 'Renkli Seri' : 'Beyaz Seri') : 'Standart',
      renkKademesi: sineklikRenkVarMi(spTipi) ? spRenkKademesi : 'beyaz',
      acilimYonu: spAcilimYonu,
      tepeSayisi: sineklikSonucu.tepeSayisi,
      fiyat: Math.ceil(anlikTutar)
    };

    setSepet(prev => duzenlenenKalemId ? prev.map(k => k.id === duzenlenenKalemId ? yeniKalem : k) : [...prev, yeniKalem]);
    setDuzenlenenKalemId(null); setKalemAdi(''); setSpEklendi(true);
    setTimeout(() => setSpEklendi(false), 1500);
  };

  const handleProjeKaydet = async () => {
    if (!projeAdi.trim()) { alert("Lütfen kaydetmeden önce Müşteri veya Proje Adı giriniz."); return; }
    if (sepet.length === 0) { alert("Projeye henüz ürün eklemediniz."); return; }

    const guncelToplam = Math.ceil(sepetGenelToplam);
    const geciciId = Date.now();

    const yeniKayit = {
      id: geciciId, projeAdi, musteriTel, musteriAdres, siparisNotu, teklifTarihi, sepet: [...sepet], durum: 'teklif', toplamFiyat: guncelToplam
    };

    setMusteriArsivi(prev => [yeniKayit, ...prev]);
    localStorage.setItem('bayiMusteriArsivi', JSON.stringify([yeniKayit, ...musteriArsivi]));

    const token = getAuthToken();
    if (token) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        const djangoVerisi = {
          proje_adi: projeAdi, musteri_tel: musteriTel || '', notlar: siparisNotu || '', iban_bilgisi: kurumsalIban || '', durum: 'teklif', teklif_tarihi: teklifTarihi, toplam_fiyat: guncelToplam,
          kalemler: sepet.map(item => ({ isim: item.isim, urun_tipi: item.urunTipi, genislik: item.genislik, yukseklik: item.yukseklik, fiyat: Math.ceil(item.fiyat), detaylar: item }))
        };
        const response = await API.post('users/proje-kaydet/', djangoVerisi, { headers });
        if (response.data && response.data.id) {
           setMusteriArsivi(prev => prev.map(item => item.id === geciciId ? { ...item, id: response.data.id } : item));
        }
      } catch (error) { console.error("Bulut kaydı esnasında hata:", error); }
    }

    alert(`"${projeAdi}" Müşteri Arşivi'ne başarıyla eklendi! 🚀`);
    setProjeAdi(''); setMusteriTel(''); setMusteriAdres(''); setSiparisNotu(''); setSepet([]); handleSekmeDegistir('arsiv'); 
  };

  const handleDurumGuncelle = async (id, yeniDurum) => {
    setMusteriArsivi(prev => prev.map(item => String(item.id) === String(id) ? { ...item, durum: yeniDurum } : item));
    const token = getAuthToken();
    if (token) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        await API.patch(`users/proje-durum-guncelle/${id}/`, { durum: yeniDurum }, { headers });
      } catch (error) { console.error("Durum veritabanında güncellenirken sorun oluştu:", error); }
    }
  };

  const durumRenkleri = {
    teklif: { bg: '#eff6ff', color: '#1E3A8A', border: '#c7d2fe', icon: '📝', label: 'Teklif Verildi / Onay Bekliyor' },
    kapora: { bg: '#eff6ff', color: '#1E3A8A', border: '#c7d2fe', icon: '💵', label: 'Kapora / Ödeme Alındı' },
    olcu: { bg: '#eff6ff', color: '#1E3A8A', border: '#c7d2fe', icon: '📐', label: 'Ölçü Bekleniyor / Kontrol' },
    uretim: { bg: '#eff6ff', color: '#1E3A8A', border: '#c7d2fe', icon: '🏭', label: 'Atölyede / İmalatta' },
    montaj: { bg: '#eff6ff', color: '#1E3A8A', border: '#c7d2fe', icon: '🚛', label: 'Montaja Hazır / Sevkiyatta' },
    teslim: { bg: '#eff6ff', color: '#1E3A8A', border: '#c7d2fe', icon: '✅', label: 'Montaj Tamamlandı & Teslim' }
  };

  const handleWhatsAppGonder = () => {
    if (sepet.length === 0) { alert("Sepette ürün bulunmamaktadır!"); return; }
    let mesaj = `*eWindoore - DİJİTAL FİYAT TEKLİFİ*%0A-----------------------------------%0A`;
    mesaj += `*Proje / Müşteri:* ${projeAdi || 'Belirtilmedi'}%0A*Tarih:* ${teklifTarihi}%0A%0A*Sipariş Detayları:*%0A`;
    sepet.forEach((item, i) => {
      mesaj += `${i + 1}) ${item.isim}%0A    Tip: ${item.urunTipi.replace('_', ' ').toUpperCase()}%0A    Ölçü: ${item.genislik} x ${item.yukseklik} mm%0A`;
      if(item.adet > 1) mesaj += `    Adet: ${item.adet}%0A`;
      mesaj += `    Tutar: ${Math.ceil(item.fiyat).toLocaleString('tr-TR')} TL%0A%0A`;
    });
    mesaj += `-----------------------------------%0A*GENEL TOPLAM: ${Math.ceil(sepetGenelToplam).toLocaleString('tr-TR')} TL*%0A-----------------------------------%0ABizi tercih ettiğiniz için teşekkür ederiz!`;
    window.open(`https://wa.me/?text=${mesaj}`, '_blank');
  };

  const handleArsivdenYukle = (arsivProjesi) => {
    setProjeAdi(arsivProjesi.projeAdi || ''); setMusteriTel(arsivProjesi.musteriTel || ''); setMusteriAdres(arsivProjesi.musteriAdres || ''); setSiparisNotu(arsivProjesi.siparisNotu || ''); setTeklifTarihi(arsivProjesi.teklifTarihi || new Date().toLocaleDateString('tr-TR')); setSepet(arsivProjesi.sepet || []); handleSekmeDegistir('sepet');
  };

  const handleArsivdenSil = async (id) => {
    if(window.confirm('Bu arşivi silmek istediğinize emin misiniz?')) {
      const guncel = musteriArsivi.filter(item => String(item.id) !== String(id));
      setMusteriArsivi(guncel); localStorage.setItem('bayiMusteriArsivi', JSON.stringify(guncel));
    }
  };

  const handleYeniProje = () => { setProjeAdi(''); setMusteriTel(''); setMusteriAdres(''); setSiparisNotu(''); setSepet([]); setKalemAdi(''); setDuzenlenenKalemId(null); };

  const profilRenkleri = {
    beyaz: { isim: 'Klasik Beyaz', fill: '#fcfcfc', border: '#b0bec5', shadow: '#cfd8dc', highlight: '#ffffff' },
    antrasit: { isim: 'Antrasit Gri', fill: '#37474f', border: '#263238', shadow: '#1e272c', highlight: '#546e7a' },
    altin_mese: { isim: 'Altın Meşe', fill: '#b8860b', border: '#5d4037', shadow: '#3e2723', highlight: '#daa520' }
  };
  
  const camFiyatlari = {
    buzlu_tek: { isim: 'Buzlu Tek Cam' },
    klasik: { isim: 'Klasik Isıcam' },
    konfor: { isim: 'Konfor Cam' },
    lamina: { isim: 'Lamina Cam' },
  };
  const seciliRenk = profilRenkleri[renk] || profilRenkleri.beyaz;
  const seciliCam = camFiyatlari[camTipi] || camFiyatlari.klasik;

  const handleSablonYukle = (sablonTipi) => {
    setDuzenlenenKalemId(null); setEnineBolmeVar(false);
    if (sablonTipi === 'wc') {
      setUrunTipi('wc_kapi'); setGenislik(800); setYukseklik(2100); setBolmeSayisi(1); setKanatlar(['sag']); setBolmeOlculeri([0]); setKalemAdi('WC Kapısı'); setLambiriBoyu(800); setAltPanelLambiri(true);
    } else if (sablonTipi === 'mutfak') {
      setUrunTipi('pencere'); setGenislik(1500); setYukseklik(1200); setBolmeSayisi(2); setKanatlar(['sabit', 'cift_sag']); setBolmeOlculeri([0, 0]); setKalemAdi('Mutfak Penceresi');
    } else if (sablonTipi === 'fransiz') {
      setUrunTipi('fransiz'); setGenislik(1400); setYukseklik(2100); setBolmeSayisi(2); setKanatlar(['sol', 'sag']); setBolmeOlculeri([0, 0]); setAltPanelLambiri(false); setKalemAdi('Fransız Balkon');
    } else if (sablonTipi === 'salon') {
      setUrunTipi('pencere'); setGenislik(2100); setYukseklik(1200); setBolmeSayisi(3); setKanatlar(['sabit', 'cift_sag', 'sabit']); setBolmeOlculeri([0, 0, 0]); setKalemAdi('Salon Penceresi');
    } else if (sablonTipi === 'balkon_kapi') {
      setUrunTipi('balkonkapi'); setGenislik(900); setYukseklik(2100); setBolmeSayisi(1); setKanatlar(['sag']); setBolmeOlculeri([0]); setKalemAdi('Balkon Kapısı'); setLambiriBoyu(800); setAltPanelLambiri(true);
    } else if (sablonTipi === 'surgulu_vw') {
      setUrunTipi('surgulu'); setGenislik(2000); setYukseklik(2100); setBolmeSayisi(2); setKanatlar(['sabit', 'sag']); setBolmeOlculeri([0, 0]); setKalemAdi('Sürgülü Sistem');
    }
  };

  const handleUrunTipiDegisimi = (e) => {
    const tip = e.target.value; setUrunTipi(tip); setEnineBolmeVar(false); 
    if (tip === 'wc_kapi' || tip === 'balkonkapi' || tip === 'fransiz') {
      setYukseklik(2100); setBolmeSayisi(1); setKanatlar(['sag']); setBolmeOlculeri([0]); setLambiriBoyu(800); setAltPanelLambiri(tip !== 'fransiz');
    } else if (tip === 'pencere' || tip === 'surgulu') { setYukseklik(1200); }
    else if (tip === 'acili') { setBolmeSayisi(1); setKanatlar(['sabit']); setBolmeOlculeri([0]); }
  };

  const handleBolmeDegisimi = (e) => {
    const yeniSayi = Number(e.target.value); setBolmeSayisi(yeniSayi); setKanatlar(Array(yeniSayi).fill('sabit')); setBolmeOlculeri(Array(yeniSayi).fill(0)); 
  };

  const handleKanatDegisimi = (index, yeniTip) => {
    const yeniKanatlar = [...kanatlar]; yeniKanatlar[index] = yeniTip; setKanatlar(yeniKanatlar);
  };

  const handleBolmeOlcuDegisimi = (index, val) => {
    const yeniOlculer = [...bolmeOlculeri]; yeniOlculer[index] = val === '' ? '' : Number(val); setBolmeOlculeri(yeniOlculer);
  };

  const handleKalemiDuzenle = (kalem) => {
    setDuzenlenenKalemId(kalem.id); setKalemAdi(kalem.isim);
    if (SP_URUN_TIPLERI_TUMU.includes(kalem.urunTipi)) {
      setSpTipi(spTipiDonustur(kalem.urunTipi)); setSpGenislik(kalem.genislik || 800); setSpYukseklik(kalem.yukseklik || 2000); setSpAdet(kalem.adet || 1); setSpAcilimYonu(kalem.acilimYonu === 'yatay' ? 'yatay' : 'dikey'); setSpRenkKademesi(kalem.renkKademesi === 'renkli' ? 'renkli' : 'beyaz'); handleSekmeDegistir('sineklik');
    } else {
      setUrunTipi(kalem.urunTipi); setGenislik(kalem.genislik); setYukseklik(kalem.yukseklik); setSagYukseklik(kalem.sagYukseklik || 1600); setBolmeSayisi(kalem.bolmeSayisi); setKanatlar(kalem.kanatlar); setBolmeOlculeri(kalem.bolmeOlculeri || Array(kalem.bolmeSayisi).fill(0)); setRenk(kalem.renk); setCamTipi(camTipiDonustur(kalem.camTipi)); setAltPanelLambiri(kalem.altPanelLambiri !== undefined ? kalem.altPanelLambiri : true); setEnineBolmeVar(kalem.enineBolmeVar || false); setEnineBolmeYerdenYukseklik(kalem.enineBolmeYerdenYukseklik || 800); setLambiriBoyu(kalem.lambiriBoyu || 800); setProfilSerisi(kalem.profilSerisi || 70); setAciModu(kalem.aciModu || 'aci_bul'); setManuelAci(kalem.manuelAci || 20); setEgimYonu(kalem.egimYonu || 'saga_yukselir'); handleSekmeDegistir('cizim');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handlePDFIndir = () => { window.print(); };
  const bolmeler = Array.from({ length: bolmeSayisi }, (_, index) => index);
  const sablonBtnStyle = { padding: '5px 10px', backgroundColor: '#f1f5f9', color: '#1E3A8A', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', flexShrink: 0, whiteSpace: 'nowrap' };

  const patronOzeti = useMemo(
    () => patronOzetiHesapla(musteriArsivi, fiyatTablo, { aralik: raporAralik }),
    [musteriArsivi, fiyatTablo, raporAralik]
  );
  const monoStil = { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' };

  return (
    <div className="ana-konteyner" style={{ position: 'relative', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1E3A8A', backgroundColor: '#f8fafc', width: '100%', overflowX: 'hidden' }}>

      {/* 🎯 SIFIR TAŞMA & MOBİL/DESKTOP STİLLERİ */}
      <style>{`
        * { box-sizing: border-box !important; }
        html, body { overflow-x: hidden !important; width: 100% !important; margin: 0; padding: 0; }

        /* 📱 MOBİL DÜZEN */
        @media screen and (max-width: 768px) {
          .ana-kapsayici { padding: 10px !important; width: 100% !important; }
          .baslik-kapsayici { flex-direction: column !important; align-items: center !important; text-align: center !important; gap: 8px !important; }
          .baslik-yazisi { font-size: 18px !important; text-align: center !important; width: 100% !important; }
          .ust-sag-aksiyonlar { width: 100% !important; justify-content: center !important; flex-wrap: wrap !important; gap: 6px !important; }
          
          .sekmeler-konteyner { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 4px !important; border-bottom: none !important; width: 100% !important; }
          .sekme-buton { width: 100% !important; font-size: 11px !important; padding: 9px 2px !important; text-align: center !important; border-radius: 4px !important; margin-bottom: 0 !important; }
          
          .mobil-sutun { flex-direction: column !important; width: 100% !important; margin-bottom: 8px !important; }
          .mobil-tam-genislik { width: 100% !important; min-width: 100% !important; margin-bottom: 8px !important; box-sizing: border-box !important; }
          
          .kutu-ici-scroll { overflow-x: auto !important; display: flex !important; width: 100% !important; padding-bottom: 6px !important; white-space: nowrap !important; -webkit-overflow-scrolling: touch; }
          .tablo-kapsayici { overflow-x: auto !important; width: 100% !important; }
          
          .cizim-svg-kapsayici svg { max-height: 320px !important; }
        }

        /* 💻 BİLGİSAYAR / DESKTOP */
        @media screen and (min-width: 769px) {
          .cizim-svg-kapsayici svg { max-height: 520px !important; height: auto !important; }
        }
      `}</style>

      {/* BANT 1: BİLDİRİM BANNERI */}
      {!abonelikAktif && erisimIzni && (
        <div style={{ backgroundColor: '#1E3A8A', color: '#ffffff', padding: '8px 10px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', width: '100%' }}>
          ⚡ eWindoore 14 Günlük Ücretsiz Deneme. Kalan Süreniz: <span style={{ color: '#93c5fd' }}>{kalanDenemeGunu} Gün</span>
        </div>
      )}

      {/* ANA KAPSAYICI */}
      <div className="ana-kapsayici" style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box', filter: !erisimIzni ? 'blur(6px)' : 'none', pointerEvents: !erisimIzni ? 'none' : 'auto' }}>

      {/* NORMAL UYGULAMA PANELİ */}
      <div>

        {/* HEADER */}
        <div className="baslik-kapsayici" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', marginBottom: '14px' }}>
          <h2 className="baslik-yazisi" style={{ margin: 0, color: '#1E3A8A', fontSize: '20px', fontWeight: '900' }}>eWindoore Dijital Çizim Sistemi</h2>
          
          <div className="ust-sag-aksiyonlar" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {patronMu && (
              <button onClick={handlePDFIndir} style={{ padding: '6px 10px', backgroundColor: '#1E3A8A', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                Kurumsal PDF 🖨️
              </button>
            )}

            <div 
              onClick={() => handleSekmeDegistir('profil')} 
              style={{ padding: '5px 10px', borderRadius: '15px', backgroundColor: '#1E3A8A', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}
              title="Profil Ayarları"
            >
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#1E3A8A', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', fontWeight: '900' }}>AU</div>
              <span>Profil</span>
            </div>
          </div>
        </div>

        {/* SEKMELER */}
        <div className="sekmeler-konteyner" style={{ display: 'flex', gap: '4px', marginBottom: '14px', borderBottom: '2px solid #1E3A8A' }}>
          <button className="sekme-buton" onClick={() => handleSekmeDegistir('cizim')} style={{ flex: 1, padding: '10px 4px', backgroundColor: aktifSekme === 'cizim' ? '#1E3A8A' : '#ffffff', color: aktifSekme === 'cizim' ? '#ffffff' : '#1E3A8A', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Doğrama ve Çizim</button>
          <button className="sekme-buton" onClick={() => handleSekmeDegistir('sineklik')} style={{ flex: 1, padding: '10px 4px', backgroundColor: aktifSekme === 'sineklik' ? '#1E3A8A' : '#ffffff', color: aktifSekme === 'sineklik' ? '#ffffff' : '#1E3A8A', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Sineklik ve Perde</button>
          <button className="sekme-buton" onClick={() => handleSekmeDegistir('sepet')} style={{ flex: 1, padding: '10px 4px', backgroundColor: aktifSekme === 'sepet' ? '#1E3A8A' : '#ffffff', color: aktifSekme === 'sepet' ? '#ffffff' : '#1E3A8A', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Sipariş Sepeti ({sepetToplamAdet})</button>
          {patronMu && (
            <button className="sekme-buton" onClick={() => handleSekmeDegistir('fiyatlar')} style={{ flex: 1, padding: '10px 4px', backgroundColor: aktifSekme === 'fiyatlar' ? '#1E3A8A' : '#ffffff', color: aktifSekme === 'fiyatlar' ? '#ffffff' : '#1E3A8A', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Fiyat Ayarları</button>
          )}
          <button className="sekme-buton" onClick={() => handleSekmeDegistir('arsiv')} style={{ flex: 1, padding: '10px 4px', backgroundColor: aktifSekme === 'arsiv' ? '#1E3A8A' : '#ffffff', color: aktifSekme === 'arsiv' ? '#ffffff' : '#1E3A8A', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>📑 CRM Arşiv</button>
          {patronMu && (
            <button className="sekme-buton" onClick={() => handleSekmeDegistir('patron')} style={{ flex: 1, padding: '10px 4px', backgroundColor: aktifSekme === 'patron' ? '#1E3A8A' : '#ffffff', color: aktifSekme === 'patron' ? '#ffffff' : '#1E3A8A', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>📊 Patron Özeti</button>
          )}
        </div>

        {/* 1. SEKME: DOĞRAMA VE ÇİZİM (PVC) */}
        {aktifSekme === 'cizim' && (
          <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
            
            {/* HIZLI ŞABLONLAR */}
            <div className="kutu-ici-scroll" style={{ marginBottom: '14px', padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', gap: '6px', alignItems: 'center' }}>
              <strong style={{ color: '#1E3A8A', fontSize: '11px', flexShrink: 0 }}>Hızlı Şablonlar:</strong>
              <button onClick={() => handleSablonYukle('wc')} style={sablonBtnStyle}>1. WC Kapısı</button>
              <button onClick={() => handleSablonYukle('mutfak')} style={sablonBtnStyle}>2. Mutfak Penceresi</button>
              <button onClick={() => handleSablonYukle('fransiz')} style={sablonBtnStyle}>3. Fransız Balkon</button>
              <button onClick={() => handleSablonYukle('salon')} style={sablonBtnStyle}>4. Salon (Çift Açılım)</button>
              <button onClick={() => handleSablonYukle('balkon_kapi')} style={sablonBtnStyle}>5. Balkon Kapısı</button>
              <button onClick={() => handleSablonYukle('surgulu_vw')} style={sablonBtnStyle}>6. Sürgülü (VW)</button>
            </div>

            {duzenlenenKalemId && (
              <div style={{ marginBottom: '14px', padding: '10px', backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#1E3A8A', fontWeight: 'bold', fontSize: '12px' }}>Düzenleme Modu: "{kalemAdi}" güncelleniyor.</span>
                <button onClick={() => { setDuzenlenenKalemId(null); setKalemAdi(''); }} style={{ padding: '4px 8px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>İptal</button>
              </div>
            )}

            <div className="mobil-sutun" style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <div className="mobil-tam-genislik" style={{ padding: '12px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', flex: '1' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1E3A8A', fontSize: '13px', fontWeight: 'bold' }}>1. Sistem ve Ölçü</h4>
                <select value={urunTipi} onChange={handleUrunTipiDegisimi} style={{ padding: '6px', width: '100%', marginBottom: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}>
                  <option value="pencere">Standart Pencere</option>
                  <option value="wc_kapi">WC / Banyo Kapısı</option>
                  <option value="balkonkapi">Balkon Kapısı</option>
                  <option value="fransiz">Fransız Cam Balkon</option>
                  <option value="surgulu">Sürgülü Sistem (VW)</option>
                  <option value="acili">Açılı / Çatı Penceresi</option>
                </select>

                {urunTipi !== 'acili' && (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', flex: '1' }}>En (mm): <input type="number" value={genislik} onChange={(e) => setGenislik(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '5px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}/></label>
                    <label style={{ fontSize: '11px', flex: '1' }}>Boy (mm): <input type="number" value={yukseklik} onChange={(e) => setYukseklik(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '5px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}/></label>
                  </div>
                )}

                {urunTipi !== 'acili' && (
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>Bölme Sayısı: 
                    <select value={bolmeSayisi} onChange={handleBolmeDegisimi} style={{ marginLeft: '6px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}>
                      {[1, 2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num} Bölme</option>)}
                    </select>
                  </label>
                )}
                
                {urunTipi !== 'acili' && (
                  <div style={{ padding: '8px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b' }}>Bölme Genişlikleri (mm)</h4>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                       {bolmeler.map((index) => (
                          <input key={index} type="number" value={bolmeOlculeri[index] === 0 ? '' : bolmeOlculeri[index]} onChange={(e) => handleBolmeOlcuDegisimi(index, e.target.value)} placeholder="Oto" style={{ width: '50px', padding: '4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/>
                       ))}
                    </div>
                  </div>
                )}

                {/* 🎯 ORTA KAYIT (ENİNE BÖLME) VE LAMBİRİ AYARLARI (GERİ EKLENDİ) */}
                <div style={{ paddingTop: '6px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold', color: '#1E3A8A' }}>
                    <input type="checkbox" checked={enineBolmeVar} onChange={e => setEnineBolmeVar(e.target.checked)} />
                    Enine / Orta Kayıt Ekle
                  </label>
                  {enineBolmeVar && (
                    <div style={{ paddingLeft: '18px' }}>
                      <label style={{ fontSize: '10px', color: '#555', display: 'block' }}>Orta Kayıt Yüksekliği (mm):</label>
                      <input type="number" value={enineBolmeYerdenYukseklik} onChange={e => setEnineBolmeYerdenYukseklik(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }} />
                    </div>
                  )}

                  {isKapiMi && (
                    <>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold', color: '#1E3A8A' }}>
                        <input type="checkbox" checked={altPanelLambiri} onChange={e => setAltPanelLambiri(e.target.checked)} />
                        Alt Panel Lambiri Yap
                      </label>
                      {altPanelLambiri && (
                        <div style={{ paddingLeft: '18px' }}>
                          <label style={{ fontSize: '10px', color: '#555', display: 'block' }}>Lambiri Yüksekliği (mm):</label>
                          <input type="number" value={lambiriBoyu} onChange={e => setLambiriBoyu(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }} />
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>

              <div className="mobil-tam-genislik" style={{ padding: '12px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', flex: '1.2', display: 'flex', gap: '10px' }}>
                <div style={{ flex: '1' }}>
                  <h4 style={{ margin: '0 0 6px 0', color: '#1E3A8A', fontSize: '13px' }}>2. Profil & Renk</h4>
                  <div style={{ marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#555', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Cam Tipi</label>
                    <select value={camTipi} onChange={(e) => setCamTipi(e.target.value)} style={{ padding: '4px', width: '100%', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                      <option value="buzlu_tek">Buzlu Tek Cam</option>
                      <option value="klasik">Klasik Isıcam</option>
                      <option value="konfor">Konfor Cam</option>
                      <option value="lamina">Lamina Cam</option>
                    </select>
                  </div>
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '6px' }}>
                    {Object.keys(profilRenkleri).map((r) => (
                      <label key={r} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontSize: '11px' }}>
                        <input type="radio" name="renk" value={r} checked={renk === r} onChange={(e) => setRenk(e.target.value)} />
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: profilRenkleri[r].fill, border: `1px solid ${profilRenkleri[r].border}`, borderRadius: '2px' }}></span>
                        {profilRenkleri[r].isim}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div style={{ borderLeft: '1px solid #eee', paddingLeft: '8px', flex: '1.2' }}>
                  <h4 style={{ margin: '0 0 6px 0', color: '#1E3A8A', fontSize: '13px' }}>3. Kanat Tipi</h4>
                  {kanatlar.map((kanatTipi, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#777', display: 'block' }}>{index + 1}. Bölme</span>
                      <select value={kanatTipi} onChange={(e) => handleKanatDegisimi(index, e.target.value)} style={{ padding: '4px', width: '100%', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                        <option value="sabit">Sabit (Açılmaz)</option>
                        <option value="sag">Sağa Açılır</option>
                        <option value="sol">Sola Açılır</option>
                        <option value="cift_sag">Sağ Çift Açılım</option>
                        <option value="cift_sol">Sol Çift Açılım</option>
                        <option value="vasistas">Vasistas</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 🎯 TEKNİK ÇİZİM ALANI (YÜKSEK KONTRASTLI BÜYÜK YAZILAR + MENTEŞE/KOL/LAMBİRİ/ORTA KAYIT DETAYLI) */}
            <div className="mobil-tam-genislik cizim-svg-kapsayici" style={{ border: '1px solid #cbd5e1', padding: '12px 10px', backgroundColor: '#ffffff', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '14px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <DogramaCizim
                urunTipi={urunTipi}
                genislik={gGenislik}
                yukseklik={gYukseklik}
                sagYukseklik={gSagYukseklik}
                bolmeSayisi={bolmeSayisi}
                bolmeGenislikleri={hesaplananGenislikler}
                kanatlar={kanatlar}
                renkId={renk}
                profilSerisi={profilSerisi}
                lambiriVar={gercekLambiriVarMi}
                lambiriBoyu={lambiriBoyu}
                enineBolmeVar={enineBolmeVar}
                enineBolmeYuksekligi={enineBolmeYerdenYukseklik}
                camParcalari={sonuc?.metraj?.camParcalari}
              />
            </div>

            {/* MALİYET KUTUSU */}
            <div className="mobil-tam-genislik" style={{ padding: '14px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              {patronMu && (
                <>
                  <h3 style={{ margin: '0 0 8px 0', color: '#1E3A8A', fontSize: '15px', borderBottom: '1px solid #eee', paddingBottom: '6px' }}>Maliyet & Teklif Hesabı</h3>

                  <div style={{ marginBottom: '10px', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Saf Malzeme / İmalat Maliyeti:</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E3A8A', marginTop: '2px' }}>
                      {hamImalatMaliyeti.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '6px', border: '1px solid #bfdbfe', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <strong style={{ fontSize: '11px', color: '#1E3A8A' }}>🛠️ Usta / Bayi Marj Ayarları (TL)</strong>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: '#555', display: 'block' }}>Kâr Marjı (TL):</label>
                        <input
                          type="number"
                          value={ustaKarTL}
                          onChange={e => setUstaKarTL(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="800"
                          style={{ width: '100%', padding: '6px', border: '1px solid #1E3A8A', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: '#555', display: 'block' }}>Montaj Payı (TL):</label>
                        <input
                          type="number"
                          value={montajPayiTL}
                          onChange={e => setMontajPayiTL(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="500"
                          style={{ width: '100%', padding: '6px', border: '1px solid #1E3A8A', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}
                        />
                      </div>
                    </div>

                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold', color: '#1E3A8A' }}>
                      <input type="checkbox" checked={kdvEkle} onChange={e => setKdvEkle(e.target.checked)} />
                      %20 KDV Dahil Et
                    </label>
                  </div>

                  <div style={{ marginBottom: '12px', backgroundColor: '#eff6ff', padding: '10px', borderRadius: '6px', border: '1px solid #93c5fd' }}>
                    <div style={{ fontSize: '11px', color: '#1E3A8A', fontWeight: 'bold' }}>Müşteriye Verilecek Teklif:</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1E3A8A', marginTop: '2px' }}>
                      {Math.ceil(anlikGenelToplam).toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                </>
              )}

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>Sipariş Odası / Adı:</label>
                <input type="text" placeholder="Örn: Mutfak Penceresi" value={kalemAdi} onChange={(e) => setKalemAdi(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
              </div>
              <button onClick={handlePvcSepeteEkle} style={{ width: '100%', padding: '12px', backgroundColor: '#1E3A8A', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                {pvcEklendi ? 'Eklendi! ✅' : (duzenlenenKalemId ? 'Değişikliği Kaydet' : 'Sepete Ekle 🛒')}
              </button>
            </div>

          </div>
        )}

        {/* 2. SEKME: SİNEKLİK VE PERDE */}
        {aktifSekme === 'sineklik' && (
          <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
            <div className="mobil-sutun" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="mobil-tam-genislik" style={{ padding: '12px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', flex: '1', minWidth: '260px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1E3A8A', fontSize: '14px' }}>1. Ürün Tipi ve Ölçüler</h4>
                <select value={spTipi} onChange={(e) => setSpTipi(e.target.value)} style={{ padding: '8px', width: '100%', marginBottom: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                  {SINEKLIK_TIPLERI.map(t => (
                    <option key={t.id} value={t.id}>{t.ad}</option>
                  ))}
                </select>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <label style={{ flex: '1', fontSize: '12px' }}>En (mm): <input type="number" value={spGenislik} onChange={e => setSpGenislik(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/></label>
                  <label style={{ flex: '1', fontSize: '12px' }}>Boy (mm): <input type="number" value={spYukseklik} onChange={e => setSpYukseklik(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/></label>
                  <label style={{ flex: '0.6', fontSize: '12px' }}>Adet: <input type="number" value={spAdet} onChange={e => setSpAdet(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/></label>
                </div>

                <h4 style={{ margin: '0 0 6px 0', color: '#1E3A8A', fontSize: '13px' }}>2. Açılım Yönü</h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button type="button" onClick={() => setSpAcilimYonu('dikey')} style={{ flex: 1, padding: '8px', backgroundColor: spAcilimYonu === 'dikey' ? '#1E3A8A' : '#f1f5f9', color: spAcilimYonu === 'dikey' ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Dikey Açılım</button>
                  <button type="button" onClick={() => setSpAcilimYonu('yatay')} style={{ flex: 1, padding: '8px', backgroundColor: spAcilimYonu === 'yatay' ? '#1E3A8A' : '#f1f5f9', color: spAcilimYonu === 'yatay' ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Yatay Açılım</button>
                </div>

                {sineklikRenkVarMi(spTipi) ? (
                  <>
                    <h4 style={{ margin: '0 0 6px 0', color: '#1E3A8A', fontSize: '13px' }}>3. Profil Rengi</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" onClick={() => setSpRenkKademesi('beyaz')} style={{ flex: 1, padding: '8px', backgroundColor: spRenkKademesi === 'beyaz' ? '#1E3A8A' : '#f1f5f9', color: spRenkKademesi === 'beyaz' ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Beyaz Seri</button>
                      <button type="button" onClick={() => setSpRenkKademesi('renkli')} style={{ flex: 1, padding: '8px', backgroundColor: spRenkKademesi === 'renkli' ? '#1E3A8A' : '#f1f5f9', color: spRenkKademesi === 'renkli' ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Renkli Seri</button>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '8px', backgroundColor: '#eff6ff', color: '#1E3A8A', borderRadius: '4px', fontSize: '11px', borderLeft: '3px solid #1E3A8A' }}>
                    Not: Plise perdede profil rengi fiyatı etkilemez.
                  </div>
                )}
              </div>

              <div className="mobil-tam-genislik" style={{ padding: '14px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', flex: '1', minWidth: '240px' }}>
                {patronMu && (
                  <>
                    <h3 style={{ margin: '0 0 8px 0', color: '#1E3A8A', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '6px' }}>Maliyet Hesabı</h3>
                    <div style={{ marginBottom: '12px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>Toplam Tutar ({spAdet} Adet):</div>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1E3A8A', marginTop: '2px' }}>
                        {(sineklikSonucu.teklifDetay?.toplam ?? 0).toLocaleString('tr-TR')} ₺
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        Kıvırım (tepe) sayısı: <strong style={{ color: '#1E3A8A' }}>{sineklikSonucu.tepeSayisi ?? 0}</strong> adet
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                        {sineklikSonucu.tepeSayisi ?? 0} tepe {spAcilimYonu === 'yatay' ? 'en' : 'boy'} {sineklikSonucu.tepeOlcusu ?? 0}mm üzerinden
                      </div>
                    </div>
                  </>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>Açıklama:</label>
                  <input type="text" placeholder="Örn: Mutfak Sinekliği" value={kalemAdi} onChange={(e) => setKalemAdi(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                </div>
                <button onClick={handleSpSepeteEkle} style={{ width: '100%', padding: '12px', backgroundColor: '#1E3A8A', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                  {spEklendi ? 'Eklendi! ✅' : (duzenlenenKalemId ? 'Değişikliği Kaydet' : 'Sepete Ekle 🛒')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. SEKME: SİPARİŞ SEPETİ VE PROJE YÖNETİMİ */}
        {aktifSekme === 'sepet' && (
          <div style={{ padding: '14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
            <div className="mobil-sutun" style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="mobil-tam-genislik" style={{ flex: '1.5', minWidth: '260px' }}>
                <strong style={{ color: '#1E3A8A', display: 'block', marginBottom: '8px', fontSize: '14px' }}>📝 Proje ve Müşteri Bilgileri:</strong>
                <div className="mobil-sutun" style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <input type="text" placeholder="Müşteri / Proje Adı (Zorunlu)" value={projeAdi} onChange={(e) => setProjeAdi(e.target.value)} style={{ flex: '2', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}/>
                  <input type="text" placeholder="Telefon (Opsiyonel)" value={musteriTel} onChange={(e) => setMusteriTel(e.target.value)} style={{ flex: '1', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}/>
                  <input type="text" value={teklifTarihi} onChange={(e) => setTeklifTarihi(e.target.value)} style={{ width: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}/>
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <input type="text" placeholder="Müşteri Adresi (Fatura için opsiyonel)" value={musteriAdres} onChange={(e) => setMusteriAdres(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}/>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <textarea placeholder="Siparişe / Atölyeye özel notlar ekleyin (Müşteri PDF'te görebilir)" value={siparisNotu} onChange={(e) => setSiparisNotu(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', minHeight: '50px' }}></textarea>
                </div>

                <div className="mobil-sutun" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="mobil-tam-genislik" onClick={handleProjeKaydet} style={{ padding: '8px 12px', backgroundColor: '#1E3A8A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Arşive Kaydet</button>
                  <button className="mobil-tam-genislik" onClick={handleWhatsAppGonder} style={{ padding: '8px 12px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>WhatsApp 💬</button>
                  <button className="mobil-tam-genislik" onClick={handlePDFIndir} style={{ padding: '8px 12px', backgroundColor: '#37474f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>PDF Yazdır 🖨️</button>
                  <button className="mobil-tam-genislik" onClick={handleYeniProje} style={{ padding: '8px 12px', backgroundColor: '#78909c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Yeni Proje</button>
                </div>
              </div>
            </div>

            <h3 style={{ margin: '0 0 12px 0', color: '#1E3A8A', borderBottom: '2px solid #ddd', paddingBottom: '8px', fontSize: '16px' }}>
              Sipariş Listesi ve Fiyatlar
            </h3>
            
            {sepet.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px' }}><p style={{ color: '#777', fontStyle: 'italic', fontSize: '13px' }}>Sepetinizde ürün bulunmamaktadır.</p></div>
            ) : (
              <div>
                <div className="tablo-kapsayici">
                  <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #e2e8f0', minWidth: '550px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A' }}>
                        <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Kalem Adı</th>
                        <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Tip</th>
                        <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Ölçü</th>
                        <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Detay</th>
                        {patronMu && (
                          <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Tutar</th>
                        )}
                        <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sepet.map((kalem) => (
                        <tr key={kalem.id} onClick={() => handleKalemiDuzenle(kalem)} style={{ cursor: 'pointer', backgroundColor: duzenlenenKalemId === kalem.id ? '#f1f5f9' : 'transparent' }}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#1E3A8A' }}>{kalem.isim}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee', textTransform: 'capitalize' }}>{kalem.urunTipi.replace('_', ' ')}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{kalem.genislik}x{kalem.yukseklik} {kalem.adet > 1 && `(x${kalem.adet})`}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{kalem.renkIsmi || kalem.renk}</td>
                          {patronMu && (
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 'bold', color: '#1E3A8A' }}>
                              {Math.ceil(Number(kalem.fiyat) || 0).toLocaleString('tr-TR')} ₺
                            </td>
                          )}
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                            <button onClick={(e) => { e.stopPropagation(); setSepet(prev => prev.filter(k => k.id !== kalem.id)); }} style={{ padding: '4px 8px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>Sil</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {patronMu && (
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '2px solid #cfd8dc', textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', color: '#546e7a', marginRight: '10px' }}>Proje Genel Toplamı:</span>
                    <h2 style={{ margin: '0', color: '#1E3A8A', fontSize: '24px', display: 'inline-block' }}>
                      {Math.ceil(sepetGenelToplam).toLocaleString('tr-TR')} ₺
                    </h2>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. SEKME: CRM VE SÜREÇ TAKİP EKRANI */}
        {aktifSekme === 'arsiv' && (
          <div style={{ padding: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#1E3A8A', fontSize: '18px' }}>📑 Gelişmiş CRM ve Sipariş Takip Paneli</h3>
                <span style={{ fontSize: '11px', color: '#666' }}>Müşterilerinizin durumunu ve süreçlerini anlık yönetin.</span>
              </div>
              <span style={{ fontSize: '11px', color: '#1E3A8A', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #93c5fd' }}>
                Toplam {musteriArsivi.length} Kayıt
              </span>
            </div>
            
            {arsivYukleniyor ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#1E3A8A', fontWeight: 'bold' }}>Bulut arşiviniz yükleniyor... ☁️</div>
            ) : musteriArsivi.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ddd' }}><p style={{ color: '#777', fontStyle: 'italic', fontSize: '13px' }}>Henüz kaydedilmiş CRM kaydı yok.</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {musteriArsivi.map(arsiv => {
                  const drm = arsiv.durum || 'teklif';
                  const drmAyar = durumRenkleri[drm] || durumRenkleri.teklif;
                  return (
                    <div key={arsiv.id} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: `2px solid ${drmAyar.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#777', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Sipariş Durumu:</label>
                        <select value={drm} onChange={(e) => handleDurumGuncelle(arsiv.id, e.target.value)} style={{ padding: '6px 8px', borderRadius: '4px', border: `1px solid ${drmAyar.color}`, backgroundColor: drmAyar.bg, color: drmAyar.color, fontWeight: 'bold', fontSize: '12px', width: '100%', cursor: 'pointer', outline: 'none' }}>
                          {Object.keys(durumRenkleri).map(k => (
                            <option key={k} value={k}>{durumRenkleri[k].icon} {durumRenkleri[k].label}</option>
                          ))}
                        </select>
                      </div>

                      <h4 style={{ margin: '0 0 6px 0', color: '#1E3A8A', fontSize: '15px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                        👤 {arsiv.projeAdi || 'İsimsiz Müşteri'}
                      </h4>

                      <div style={{ fontSize: '12px', color: '#555', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                        <div><strong>📅 Tarih:</strong> {arsiv.teklifTarihi}</div>
                        <div><strong>📞 Tel:</strong> {arsiv.musteriTel || 'Belirtilmedi'}</div>
                        {arsiv.musteriAdres && <div><strong>📍 Adres:</strong> {arsiv.musteriAdres}</div>}
                      </div>
                      
                      <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#777' }}>Proje Tutarı:</span>
                        <strong style={{ fontSize: '15px', color: '#1E3A8A' }}>{Math.ceil(Number(arsiv.toplamFiyat) || 0).toLocaleString('tr-TR')} ₺</strong>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleArsivdenYukle(arsiv)} style={{ flex: '1', padding: '6px 10px', backgroundColor: '#1E3A8A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>Sepete Yükle</button>
                        <button onClick={() => handleArsivdenSil(arsiv.id)} style={{ padding: '6px 10px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Sil</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. SEKME: FİYAT VE PROFİL AYARLARI */}
        {aktifSekme === 'fiyatlar' && patronMu && (
          <div style={{ padding: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
            
            <div className="mobil-sutun" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
              <div className="mobil-tam-genislik" style={{ flex: 1, minWidth: '240px' }}>
                <strong style={{ color: '#1E3A8A', display: 'block', fontSize: '16px', marginBottom: '4px' }}>🏢 Kurumsal PDF Fatura Ayarları</strong>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '10px' }}>Logonuz ve IBAN bilginiz "PDF Yazdır" butonunda kağıda yansır.</span>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1E3A8A', display: 'block', marginBottom: '4px' }}>Firma Logosu Yükle:</label>
                  <input type="file" accept="image/*" onChange={handleLogoYukle} style={{ display: 'block', fontSize: '12px', width: '100%' }} />
                </div>
                
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1E3A8A', display: 'block', marginBottom: '4px' }}>Banka & IBAN Bilgisi:</label>
                  <input type="text" placeholder="Örn: TR00 0000 0000..." value={kurumsalIban} onChange={(e) => setKurumsalIban(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                </div>
              </div>

              {firmaLogosu && (
                <div className="mobil-tam-genislik" style={{ padding: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', minWidth: '120px' }}>
                  <strong style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Mevcut Logo</strong>
                  <img src={firmaLogosu} alt="Önizleme" style={{ maxWidth: '100%', maxHeight: '60px', margin: '0 auto' }} />
                </div>
              )}
            </div>

            <div className="mobil-sutun" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
              <div className="mobil-tam-genislik">
                <strong style={{ color: '#1E3A8A', display: 'block', fontSize: '16px' }}>💰 Birim Fiyat Ayarları</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Değişiklikleri veritabanına sabitleyin.</span>
              </div>
              <button className="mobil-tam-genislik" onClick={handleFiyatlariBulutaKaydet} disabled={fiyatYukleniyor} style={{ padding: '10px 16px', backgroundColor: '#1E3A8A', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                {fiyatYukleniyor ? 'Yükleniyor...' : 'Fiyatları Sabitle ☁️'}
              </button>
            </div>

            <div style={{ marginBottom: '16px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <strong style={{ color: '#1E3A8A', fontSize: '13px' }}>Profil Serisi:</strong>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[50, 60, 70, 80, 90].map(seri => (
                  <label key={seri} style={{ cursor: 'pointer', fontSize: '12px', fontWeight: profilSerisi === seri ? 'bold' : 'normal', color: profilSerisi === seri ? '#1E3A8A' : '#555', display: 'flex', alignItems: 'center' }}>
                    <input type="radio" name="profilSerisi" value={seri} checked={profilSerisi === seri} onChange={(e) => setProfilSerisi(Number(e.target.value))} style={{ marginRight: '3px' }} />
                    {seri}'lik
                  </label>
                ))}
              </div>
            </div>
            
            <div className="mobil-sutun" style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button className="mobil-tam-genislik" onClick={() => setAktifRenkSekmesi('beyaz')} style={{ flex: '1', padding: '8px', backgroundColor: aktifRenkSekmesi === 'beyaz' ? '#1E3A8A' : '#f1f5f9', color: aktifRenkSekmesi === 'beyaz' ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Beyaz Seri</button>
              <button className="mobil-tam-genislik" onClick={() => setAktifRenkSekmesi('renkli')} style={{ flex: '1', padding: '8px', backgroundColor: aktifRenkSekmesi === 'renkli' ? '#1E3A8A' : '#f1f5f9', color: aktifRenkSekmesi === 'renkli' ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Renkli Seri</button>
            </div>

            {fiyatYukleniyor ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#1E3A8A', fontWeight: 'bold' }}>
                Fiyatlar veritabanından getiriliyor... ☁️
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1E3A8A', borderBottom: '1px solid #eee', paddingBottom: '4px', fontSize: '13px' }}>
                    {aktifRenkSekmesi === 'beyaz' ? 'Beyaz Seri' : 'Renkli Seri'} Profilleri (m)
                  </h4>
                  {[
                    { key: 'kasa', label: 'Kasa' },
                    { key: 'ortakayit', label: 'Ortakayıt' },
                    { key: 'pencereKanadi', label: 'Pencere Kanadı' },
                    { key: 'kapiKanadi', label: 'Kapı Kanadı' },
                    { key: 'surmeKasa', label: 'Sürme Kasa' },
                    { key: 'surmeKanadi', label: 'Sürme Kanadı' },
                    { key: 'lambiri', label: 'Lambiri' }
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                      {item.label}:
                      <div><input type="number" value={fiyatTablo.seriler[aktifRenkSekmesi][item.key] ?? ''} onChange={(e) => handleFiyatDegisimi(['seriler', aktifRenkSekmesi, item.key], e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
                    </label>
                  ))}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1E3A8A', borderBottom: '1px solid #eee', paddingBottom: '4px', fontSize: '13px' }}>Cam Tipleri (m²)</h4>
                  {[
                    { key: 'buzlu_tek', label: 'Buzlu Tek Cam' },
                    { key: 'klasik', label: 'Klasik Isıcam' },
                    { key: 'konfor', label: 'Konfor Cam' },
                    { key: 'lamina', label: 'Lamina Cam' }
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                      {item.label}:
                      <div><input type="number" value={fiyatTablo.camlar[item.key] ?? ''} onChange={(e) => handleFiyatDegisimi(['camlar', item.key], e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
                    </label>
                  ))}
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px', color: '#1E3A8A' }}>
                    Cam İşçiliği:
                    <div><input type="number" value={fiyatTablo.camIsciligi ?? ''} onChange={(e) => handleFiyatDegisimi(['camIsciligi'], e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
                  </label>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1E3A8A', borderBottom: '1px solid #eee', paddingBottom: '4px', fontSize: '13px' }}>Aksesuarlar (Adet)</h4>
                  {[
                    { key: 'tekAcilim', label: 'Tek Açılım' },
                    { key: 'ciftAcilim', label: 'Çift Açılım' },
                    { key: 'vasistas', label: 'Vasistas' },
                    { key: 'kapiAksesuar', label: 'Genel Aksesuar' },
                    { key: 'surmeAksesuar', label: 'Sürme Aksesuarı' }
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                      {item.label}:
                      <div><input type="number" value={fiyatTablo.aksesuarlar[item.key] ?? ''} onChange={(e) => handleFiyatDegisimi(['aksesuarlar', item.key], e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {!fiyatYukleniyor && (
              <div style={{ marginTop: '12px', backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, color: '#1E3A8A', fontSize: '13px' }}>Sineklik & Perde Fiyatları</h4>
                  <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Tepe Adımı (mm):
                    <input type="number" value={fiyatTablo.tepeAdimiMM ?? ''} onChange={(e) => handleFiyatDegisimi(['tepeAdimiMM'], e.target.value)} style={{ width: '55px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/>
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {SINEKLIK_TIPLERI.map(sp => (
                    <div key={sp.id}>
                      <h5 style={{ margin: '0 0 8px 0', color: '#1E3A8A', fontSize: '12px' }}>{sp.ad}</h5>
                      {[
                        { key: 'cerceveM', label: 'Çerçeve (₺/m)' },
                        ...(sp.renkVar ? [{ key: 'cerceveMRenkli', label: 'Renkli Çerçeve' }] : []),
                        { key: 'kumasM2', label: 'Kumaş/Tel (₺/m²)' },
                        { key: 'tepeBasiBirim', label: 'Tepe Başı (₺/adet)' },
                        { key: 'iscilik', label: 'İşçilik (₺)' }
                      ].map(item => (
                        <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                          {item.label}:
                          <div><input type="number" value={fiyatTablo[sp.id]?.[item.key] ?? ''} onChange={(e) => handleFiyatDegisimi([sp.id, item.key], e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. SEKME: PATRON EKRANI */}
        {aktifSekme === 'patron' && patronMu && (
          <div style={{ padding: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '380px', width: '100%', boxSizing: 'border-box' }}>
            <div className="mobil-sutun" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1E3A8A', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#1E3A8A', fontSize: '20px' }}>📊 Patron & Fabrika Analiz Özeti</h3>
                <p style={{ margin: 0, color: '#555', fontSize: '12px' }}>Seçtiğiniz döneme göre ciro, tüketim ve satış kırılımını görün.</p>
              </div>
              <div className="mobil-tam-genislik" style={{ display: 'flex', gap: '6px' }}>
                {Object.entries(ARALIK_ADLARI).map(([id, ad]) => (
                  <button key={id} onClick={() => setRaporAralik(id)} style={{ flex: 1, padding: '8px 14px', backgroundColor: raporAralik === id ? '#1E3A8A' : '#f1f5f9', color: raporAralik === id ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {ad}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 ÖZET KART */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', textAlign: 'center' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>💰</span>
                <strong style={{ color: '#757575', fontSize: '12px', display: 'block', textTransform: 'uppercase' }}>Ciro</strong>
                <span style={{ ...monoStil, color: '#1E3A8A', fontSize: '22px', fontWeight: '900', display: 'block', marginTop: '6px' }}>
                  {patronOzeti.ciro.toLocaleString('tr-TR')} ₺
                </span>
              </div>

              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', textAlign: 'center' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>📁</span>
                <strong style={{ color: '#757575', fontSize: '12px', display: 'block', textTransform: 'uppercase' }}>Proje Sayısı</strong>
                <span style={{ ...monoStil, color: '#1E3A8A', fontSize: '22px', fontWeight: '900', display: 'block', marginTop: '6px' }}>
                  {patronOzeti.projeSayisi}
                </span>
              </div>

              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', textAlign: 'center' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>📦</span>
                <strong style={{ color: '#757575', fontSize: '12px', display: 'block', textTransform: 'uppercase' }}>Kalem Sayısı</strong>
                <span style={{ ...monoStil, color: '#1E3A8A', fontSize: '22px', fontWeight: '900', display: 'block', marginTop: '6px' }}>
                  {patronOzeti.kalemSayisi}
                </span>
              </div>

              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', textAlign: 'center' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>🔢</span>
                <strong style={{ color: '#757575', fontSize: '12px', display: 'block', textTransform: 'uppercase' }}>Toplam Adet</strong>
                <span style={{ ...monoStil, color: '#1E3A8A', fontSize: '22px', fontWeight: '900', display: 'block', marginTop: '6px' }}>
                  {patronOzeti.toplamAdet}
                </span>
              </div>
            </div>

            {/* PROFİL TÜKETİMİ */}
            <h4 style={{ color: '#1E3A8A', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Profil Tüketimi</h4>
            <div className="tablo-kapsayici" style={{ marginBottom: '24px' }}>
              <table style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '320px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Seri</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Metre</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Beyaz Seri</td>
                    <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{patronOzeti.profil.beyaz.metre.toLocaleString('tr-TR')} m</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Renkli Seri</td>
                    <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{patronOzeti.profil.renkli.metre.toLocaleString('tr-TR')} m</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>Toplam</td>
                    <td style={{ ...monoStil, padding: '8px', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>{patronOzeti.profil.toplamMetre.toLocaleString('tr-TR')} m</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CAM TÜKETİMİ */}
            <h4 style={{ color: '#1E3A8A', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Cam Tüketimi</h4>
            <div className="tablo-kapsayici" style={{ marginBottom: '24px' }}>
              <table style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '320px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Cam Tipi</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>m²</th>
                  </tr>
                </thead>
                <tbody>
                  {CAM_TIPLERI.map(c => (
                    <tr key={c.id}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{c.ad}</td>
                      <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{(patronOzeti.camlar[c.id]?.m2 ?? 0).toFixed(2)} m²</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding: '8px', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>Toplam</td>
                    <td style={{ ...monoStil, padding: '8px', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>{patronOzeti.camToplamM2.toFixed(2)} m²</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SİNEKLİK VE PERDE TÜKETİMİ */}
            <h4 style={{ color: '#1E3A8A', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Sineklik ve Perde Tüketimi</h4>
            <div className="tablo-kapsayici" style={{ marginBottom: '24px' }}>
              <table style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '560px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Tip</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Adet</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Çerçeve (m)</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Kumaş/Tel (m²)</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Tepe Sayısı</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#dbeafe' }}>Ciro</th>
                  </tr>
                </thead>
                <tbody>
                  {SINEKLIK_TIPLERI.map(sp => {
                    const s = patronOzeti.sineklikler[sp.id] || { adet: 0, cerceveM: 0, kumasM2: 0, tepeSayisi: 0, ciro: 0 };
                    return (
                      <tr key={sp.id}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{sp.ad}</td>
                        <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{s.adet}</td>
                        <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{s.cerceveM.toLocaleString('tr-TR')} m</td>
                        <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{s.kumasM2.toFixed(2)} m²</td>
                        <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{s.tepeSayisi}</td>
                        <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>{s.ciro.toLocaleString('tr-TR')} ₺</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ÜRÜN BAZLI SATIŞ */}
            <h4 style={{ color: '#1E3A8A', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Ürün Bazlı Satış</h4>
            <div className="tablo-kapsayici" style={{ marginBottom: '24px' }}>
              <table style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '320px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Ürün</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Adet</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Ciro</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(patronOzeti.urunTipleri).length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '12px', textAlign: 'center', color: '#777' }}>Bu dönemde satış yok.</td>
                    </tr>
                  ) : (
                    Object.entries(patronOzeti.urunTipleri)
                      .sort((a, b) => b[1].ciro - a[1].ciro)
                      .map(([tip, v]) => (
                        <tr key={tip}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{URUN_ADLARI[tip] || tip}</td>
                          <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{v.adet}</td>
                          <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{v.ciro.toLocaleString('tr-TR')} ₺</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* DURUM DAĞILIMI */}
            <h4 style={{ color: '#1E3A8A', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Durum Dağılımı</h4>
            <div className="tablo-kapsayici">
              <table style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '320px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Durum</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Proje Sayısı</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(patronOzeti.durumlar).length === 0 ? (
                    <tr>
                      <td colSpan="2" style={{ padding: '12px', textAlign: 'center', color: '#777' }}>Bu dönemde proje yok.</td>
                    </tr>
                  ) : (
                    Object.entries(patronOzeti.durumlar).map(([durum, sayi]) => (
                      <tr key={durum}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{DURUM_ADLARI[durum] || durum}</td>
                        <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{sayi}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 👤 7. SEKME: PROFİL SAYFASI EKRANI */}
        {aktifSekme === 'profil' && (
          <ProfilePage onBack={() => handleSekmeDegistir('cizim')} />
        )}

      </div>

      </div>

      {/* PAYWALL MODALI */}
      {(paywallModalAcik || !erisimIzni) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1E3A8A', margin: '0 0 10px 0' }}>14 Günlük Deneme Doldu!</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Kullanmaya devam etmek için aboneliğinizi başlatın.</p>
            <form onSubmit={handleAbonelikOde} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" required value={kartAd} onChange={e => setKartAd(e.target.value)} placeholder="Kart Ad Soyad" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <input type="text" required maxLength="19" value={kartNo} onChange={e => setKartNo(e.target.value)} placeholder="Kart Numarası" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <button type="submit" disabled={odemeYukleniyor} style={{ width: '100%', backgroundColor: '#1E3A8A', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                {odemeYukleniyor ? 'İşleniyor...' : 'Aboneliği Başlat 💳'}
              </button>
            </form>
          </div>
        </div>
      )}

      <TeklifYazdir
        firmaAdi={firmaAdi}
        firmaLogosu={firmaLogosu}
        iban={kurumsalIban}
        projeAdi={projeAdi}
        musteriTel={musteriTel}
        musteriAdres={musteriAdres}
        siparisNotu={siparisNotu}
        teklifTarihi={teklifTarihi}
        sepet={sepet}
        kdvDahilMi={kdvEkle}
      />

    </div>
  );
}