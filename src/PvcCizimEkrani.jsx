import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API, { getAbonelikDurumu, abonelikBaslat } from './services/api';
import ProfilePage from './pages/ProfilePage';

// 🎯 TOKEN ALMA YARDIMCI FONKSİYONU
const getAuthToken = () => {
  const token = localStorage.getItem('access') || localStorage.getItem('access_token');
  if (token && token !== 'null' && token !== 'undefined') return token;
  return null;
};

export default function PvcCizimEkrani() {
  const navigate = useNavigate();
  const location = useLocation();

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

  const [aktifRol, setAktifRol] = useState('patron');

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
    if (aktifRol === 'usta' && ['patron', 'calisan_ekle'].includes(aktifSekme)) {
      handleSekmeDegistir('cizim');
    }
  }, [aktifRol, aktifSekme]);

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
  
  const [malzeme, setMalzeme] = useState('upvc'); 
  const [renk, setRenk] = useState('beyaz');
  
  const [profilSerisi, setProfilSerisi] = useState(() => {
    const kayitliSeri = localStorage.getItem('ustaProfilSerisi');
    return kayitliSeri ? Number(kayitliSeri) : 70;
  });

  useEffect(() => {
    localStorage.setItem('ustaProfilSerisi', profilSerisi);
  }, [profilSerisi]);

  const p = Number(profilSerisi) || 70;
  
  const [camTipi, setCamTipi] = useState('standart');
  const [sineklikIste, setSineklikIste] = useState(true);
  const [altPanelLambiri, setAltPanelLambiri] = useState(true);

  const [spTipi, setSpTipi] = useState('surgulu_sineklik'); 
  const [spGenislik, setSpGenislik] = useState(800);
  const [spYukseklik, setSpYukseklik] = useState(2000);
  const [spRenk, setSpRenk] = useState('beyaz');
  const [spAdet, setSpAdet] = useState(1);

  const [aktifRenkSekmesi, setAktifRenkSekmesi] = useState('beyaz');
  
  const varsayilanFiyatlar = {
    beyaz: { 
      kasa: 200, ortakayit: 200, pencereKanadi: 200, kapiKanadi: 220, surmeKasa: 230, surmeKanadi: 230, 
      aluKasa: 450, aluOrtakayit: 450, aluPencereKanadi: 450, aluKapiKanadi: 500, aluSurmeKasa: 500, aluSurmeKanadi: 500,
      cam: 1100, camIci: 0, upvcLambiri: 380, aluLambiri: 550, tekAcilim: 400, ciftAcilim: 750, vasistas: 350, kapiAksesuar: 600, surmeAksesuar: 1000, sineklik: 450,
      plisePerdeM2: 700, surguluSineklikM2: 850
    },
    antrasit: { 
      kasa: 260, ortakayit: 260, pencereKanadi: 260, kapiKanadi: 280, surmeKasa: 290, surmeKanadi: 290, 
      aluKasa: 550, aluOrtakayit: 550, aluPencereKanadi: 550, aluKapiKanadi: 600, aluSurmeKasa: 600, aluSurmeKanadi: 600,
      cam: 1100, camIci: 0, upvcLambiri: 480, aluLambiri: 700, tekAcilim: 400, ciftAcilim: 750, vasistas: 350, kapiAksesuar: 600, surmeAksesuar: 1000, sineklik: 450,
      plisePerdeM2: 700, surguluSineklikM2: 950
    },
    altin_mese: { 
      kasa: 240, ortakayit: 240, pencereKanadi: 240, kapiKanadi: 260, surmeKasa: 270, surmeKanadi: 270, 
      aluKasa: 500, aluOrtakayit: 500, aluPencereKanadi: 500, aluKapiKanadi: 550, aluSurmeKasa: 550, aluSurmeKanadi: 550,
      cam: 1100, camIci: 0, upvcLambiri: 430, aluLambiri: 650, tekAcilim: 400, ciftAcilim: 750, vasistas: 350, kapiAksesuar: 600, surmeAksesuar: 1000, sineklik: 450,
      plisePerdeM2: 700, surguluSineklikM2: 900
    }
  };

  const [fiyatTablo, setFiyatTablo] = useState(varsayilanFiyatlar);
  const [fiyatYukleniyor, setFiyatYukleniyor] = useState(true);

  const [raporBaslangic, setRaporBaslangic] = useState('');
  const [raporBitis, setRaporBitis] = useState('');

  useEffect(() => {
    const fiyatlariBuluttanGetir = async () => {
      try {
        const response = await API.get('users/fiyat-tablosu/');
        const gelenVeri = response.data?.veri || (Object.keys(response.data || {}).length > 0 ? response.data : null);

        if (gelenVeri && Object.keys(gelenVeri).length > 0 && gelenVeri.beyaz) {
          setFiyatTablo(gelenVeri);
          localStorage.setItem('ustaFiyatTablosu', JSON.stringify(gelenVeri));
        } else {
          const yerelFiyatlar = localStorage.getItem('ustaFiyatTablosu');
          if (yerelFiyatlar) setFiyatTablo(JSON.parse(yerelFiyatlar));
        }
      } catch (error) {
        console.error("Fiyatlar buluttan çekilemedi:", error);
        const yerelFiyatlar = localStorage.getItem('ustaFiyatTablosu');
        if (yerelFiyatlar) setFiyatTablo(JSON.parse(yerelFiyatlar));
      } finally {
        setFiyatYukleniyor(false);
      }
    };
    fiyatlariBuluttanGetir();
  }, []);

  const handleFiyatDegisimi = (seciliRenk, alan, deger) => {
    const guncelDeger = deger === '' ? '' : Number(deger);
    setFiyatTablo(prev => ({
      ...prev,
      [seciliRenk]: {
        ...prev[seciliRenk],
        [alan]: guncelDeger
      }
    }));
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
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('bayiMusteriArsivi'); 
      navigate('/login');
    }
  };

  // =======================================================
  // ⚡ DİNAMİK HESAPLAMA MOTORU (DIŞ ÖLÇÜ -> İÇ NET CAM)
  // =======================================================
  const hesaplananVeriler = useMemo(() => {
    let gGen = Number(genislik) || 0;
    let gYuk = Number(yukseklik) || 0;
    let gSagYuk = Number(sagYukseklik) || 0;
    let gAciVal = Number(manuelAci) || 0;
    let gLambiri = Number(lambiriBoyu) || 800;
    let gEnineYukseklik = Number(enineBolmeYerdenYukseklik) || 800;

    if (urunTipi === 'acili') {
      const tanDegeri = Math.tan(gAciVal * Math.PI / 180);
      if (aciModu === 'sag_boy_bul') {
        const fark = gGen * tanDegeri;
        gSagYuk = egimYonu === 'saga_yukselir' ? gYuk + fark : Math.max(0, gYuk - fark);
      } else if (aciModu === 'sol_boy_bul') {
        const fark = gGen * tanDegeri;
        gYuk = egimYonu === 'saga_yukselir' ? Math.max(0, gSagYuk - fark) : gSagYuk + fark;
      } else if (aciModu === 'en_bul') {
        if (tanDegeri > 0) {
          const fark = Math.abs(gSagYuk - gYuk);
          gGen = fark / tanDegeri;
        }
      }
    }

    const dikmeSayi = bolmeSayisi - 1;
    const isKapi = (urunTipi === 'wc_kapi' || urunTipi === 'balkonkapi' || urunTipi === 'kapi');
    const isSurmeSistem = (urunTipi === 'surgulu');
    
    let hesaplananGenislikler = [];
    const manuelTop = bolmeOlculeri.reduce((a, b) => a + (Number(b) || 0), 0);
    const otoSay = bolmeOlculeri.filter(b => (Number(b) || 0) === 0).length || 1; 

    if (manuelTop >= gGen && gGen > 0) {
      const sifirSayisi = bolmeOlculeri.filter(b => (Number(b) || 0) === 0).length;
      if (sifirSayisi === 0) {
        const oran = gGen / manuelTop;
        hesaplananGenislikler = bolmeOlculeri.map(b => (Number(b) || 0) * oran);
      } else {
        const oran = (gGen * 0.9) / manuelTop;
        const bosluk = (gGen * 0.1) / sifirSayisi;
        hesaplananGenislikler = bolmeOlculeri.map(b => (Number(b) || 0) > 0 ? (Number(b) || 0) * oran : bosluk);
      }
    } else {
      const kalanNet = Math.max(0, gGen - manuelTop);
      const otoGenislik = kalanNet / otoSay;
      hesaplananGenislikler = bolmeOlculeri.map(b => (Number(b) || 0) > 0 ? (Number(b) || 0) : otoGenislik);
    }

    const koseKesimFireKatsayisi = 1.12; 
    let kasaM = ((gGen + gYuk) * 2) / 1000;
    if (urunTipi === 'acili') {
      const fark = Math.abs(gSagYuk - gYuk);
      const egimliKenar = Math.sqrt((gGen * gGen) + (fark * fark));
      kasaM = (gGen + gYuk + gSagYuk + egimliKenar) / 1000;
    }
    const kasaMButun = kasaM * koseKesimFireKatsayisi;

    const icYuk = Math.max(0, gYuk - (2 * p));
    const dikmeM = ((dikmeSayi * icYuk) / 1000) * koseKesimFireKatsayisi; 
    
    let yatayKayitM = isKapi ? (gGen - (2*p)) / 1000 : 0;
    if (enineBolmeVar) { yatayKayitM += (gGen - (2 * p)) / 1000; }
    yatayKayitM = yatayKayitM * koseKesimFireKatsayisi;

    const acilirKanatListesi = kanatlar.filter(tip => tip !== 'sabit');
    const acilirAdet = acilirKanatListesi.length;
    
    let kanatM = 0;
    let camM2 = 0;

    hesaplananGenislikler.forEach((bg, index) => {
      let netCamW = Math.max(0, bg - (2 * p));
      let netCamH = Math.max(0, gYuk - (2 * p));
      camM2 += (netCamW * netCamH) / 1000000;

      if (kanatlar[index] !== 'sabit') {
        let kBoy = netCamH + 40; 
        let kEn = netCamW + 40;
        if (enineBolmeVar) { kBoy = gYuk - gEnineYukseklik - p + 40; }
        kanatM += (((kEn + kBoy) * 2) / 1000) * koseKesimFireKatsayisi;
      }
    });

    const gercekLambiri = (urunTipi === 'wc_kapi') || (urunTipi === 'balkonkapi' && altPanelLambiri);
    let lambiriMetrekare = 0;

    if (isKapi && gercekLambiri) {
      const lambiriY = Math.max(0, gLambiri - p); 
      lambiriMetrekare = ((gGen - (2*p)) * lambiriY) / 1000000;
      camM2 -= lambiriMetrekare; 
    } else if (urunTipi === 'acili') {
      camM2 = (gGen * ((gYuk + gSagYuk) / 2)) / 1000000;
    }

    const secilenTablo = fiyatTablo[renk] || fiyatTablo.beyaz;

    const uKasa = malzeme === 'aluminyum' ? (Number(secilenTablo.aluKasa) || 0) : (Number(secilenTablo.kasa) || 0);
    const uOrtakayit = malzeme === 'aluminyum' ? (Number(secilenTablo.aluOrtakayit) || 0) : (Number(secilenTablo.ortakayit) || 0);
    const uPencereKanadi = malzeme === 'aluminyum' ? (Number(secilenTablo.aluPencereKanadi) || 0) : (Number(secilenTablo.pencereKanadi) || 0);
    const uKapiKanadi = malzeme === 'aluminyum' ? (Number(secilenTablo.aluKapiKanadi) || 0) : (Number(secilenTablo.kapiKanadi) || 0);
    const uSurmeKasa = malzeme === 'aluminyum' ? (Number(secilenTablo.aluSurmeKasa) || 0) : (Number(secilenTablo.surmeKasa) || 0);
    const uSurmeKanadi = malzeme === 'aluminyum' ? (Number(secilenTablo.aluSurmeKanadi) || 0) : (Number(secilenTablo.surmeKanadi) || 0);
    const uLambiri = malzeme === 'aluminyum' ? (Number(secilenTablo.aluLambiri) || 0) : (Number(secilenTablo.upvcLambiri) || 0);

    const uSurmeAksesuar = Number(secilenTablo.surmeAksesuar) || 0;
    const uKapiAksesuar = Number(secilenTablo.kapiAksesuar) || 0;
    const uTekAcilim = Number(secilenTablo.tekAcilim) || 0;
    const uCiftAcilim = Number(secilenTablo.ciftAcilim) || 0;
    const uVasistas = Number(secilenTablo.vasistas) || 0;
    const uSineklik = Number(secilenTablo.sineklik) || 0;
    const uCamIci = Number(secilenTablo.camIci) || 0;

    const camFiyatlar = {
      standart: Number(secilenTablo.cam) || 0,
      sinerji: (Number(secilenTablo.cam) || 0) + 400,
      konfor: (Number(secilenTablo.cam) || 0) + 700
    };
    const seciliCamBirimFiyati = camFiyatlar[camTipi] || camFiyatlar.standart;

    const aktifKasaFiyati = isSurmeSistem ? uSurmeKasa : uKasa;
    const aktifKanatFiyati = isSurmeSistem ? uSurmeKanadi : (isKapi ? uKapiKanadi : uPencereKanadi);

    let toplamAksesuarMaliyeti = 0;
    kanatlar.forEach((tip) => {
      if (tip === 'sag' || tip === 'sol') {
        toplamAksesuarMaliyeti += isSurmeSistem ? uSurmeAksesuar : (isKapi ? uKapiAksesuar : uTekAcilim);
      } else if (tip === 'cift_sag' || tip === 'cift_sol') {
        toplamAksesuarMaliyeti += uCiftAcilim;
      } else if (tip === 'vasistas') {
        toplamAksesuarMaliyeti += uVasistas;
      }
    });

    const profilMaliyeti = (kasaMButun * aktifKasaFiyati) + (dikmeM * uOrtakayit) + (kanatM * aktifKanatFiyati) + (yatayKayitM * uOrtakayit);
    const camMaliyeti = Math.max(0, camM2) * (seciliCamBirimFiyati + uCamIci);
    const lambiriMaliyeti = Math.max(0, lambiriMetrekare) * uLambiri;
    const toplamSineklikMaliyeti = (sineklikIste && acilirAdet > 0) ? (acilirAdet * uSineklik) : 0;
    
    const hamImalatMaliyeti = profilMaliyeti + camMaliyeti + lambiriMaliyeti + toplamAksesuarMaliyeti + toplamSineklikMaliyeti;
    const toplamSatisOncesi = hamImalatMaliyeti + (Number(ustaKarTL) || 0) + (Number(montajPayiTL) || 0);
    const nihaiTeklifFiyati = kdvEkle ? Math.ceil(toplamSatisOncesi * 1.20) : Math.ceil(toplamSatisOncesi);

    return {
      gGenislik: gGen,
      gYukseklik: gYuk,
      gSagYukseklik: gSagYuk,
      icYukseklik: icYuk,
      hesaplananGenislikler: hesaplananGenislikler,
      isKapiMi: isKapi,
      gercekLambiriVarMi: gercekLambiri,
      hamImalatMaliyeti: Math.ceil(hamImalatMaliyeti),
      anlikGenelToplam: nihaiTeklifFiyati
    };
  }, [
    genislik, yukseklik, sagYukseklik, manuelAci, lambiriBoyu, enineBolmeYerdenYukseklik,
    urunTipi, aciModu, egimYonu, bolmeSayisi, bolmeOlculeri, enineBolmeVar, kanatlar,
    renk, malzeme, camTipi, sineklikIste, altPanelLambiri, profilSerisi, fiyatTablo, p,
    ustaKarTL, montajPayiTL, kdvEkle
  ]);

  const {
    gGenislik, gYukseklik, gSagYukseklik, icYukseklik, hesaplananGenislikler,
    isKapiMi, gercekLambiriVarMi, hamImalatMaliyeti, anlikGenelToplam
  } = hesaplananVeriler;

  const anlikSpTutar = useMemo(() => {
    const spAlanM2 = (Number(spGenislik) * Number(spYukseklik)) / 1000000;
    const spBirimFiyat = spTipi === 'plise_perde' 
      ? (Number(fiyatTablo.beyaz.plisePerdeM2) || 0) 
      : (Number(fiyatTablo[spRenk]?.surguluSineklikM2) || 0); 
    
    return Math.ceil(spAlanM2 * spBirimFiyat * (Number(spAdet) || 1));
  }, [spGenislik, spYukseklik, spTipi, spRenk, spAdet, fiyatTablo]);

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
      camIsmi: camFiyatlari[camTipi]?.isim || 'Standart Isıcam',
      sineklikIste, 
      altPanelLambiri, 
      malzeme, 
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
    const defaultIsim = spTipi === 'plise_perde' ? 'Plise Perde' : 'Sürgülü Sineklik';
    const kalemIsmi = kalemAdi.trim() === '' ? `${defaultIsim} ${sepet.length + 1}` : kalemAdi;
    const anlikTutar = Number(anlikSpTutar) || 0;
    const hedefId = duzenlenenKalemId ? duzenlenenKalemId : Date.now();

    const yeniKalem = {
      id: hedefId,
      isim: kalemIsmi,
      urunTipi: spTipi, 
      genislik: Number(spGenislik), 
      yukseklik: Number(spYukseklik), 
      adet: Number(spAdet) || 1,
      renk: spTipi === 'surgulu_sineklik' ? spRenk : 'Standart',
      renkIsmi: spTipi === 'surgulu_sineklik' ? (profilRenkleri[spRenk]?.isim || 'Klasik Beyaz') : 'Standart',
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

  const handleYeniProje = () => { setProjeAdi(''); setMusteriTel(''); setMusteriAdres(''); setSiparisNotu(''); setSepet([]); setKalemAdi(''); setDuzenlenenKalemId(null); setMalzeme('upvc'); };

  const profilRenkleri = {
    beyaz: { isim: 'Klasik Beyaz', fill: '#fcfcfc', border: '#b0bec5', shadow: '#cfd8dc', highlight: '#ffffff' },
    antrasit: { isim: 'Antrasit Gri', fill: '#37474f', border: '#263238', shadow: '#1e272c', highlight: '#546e7a' },
    altin_mese: { isim: 'Altın Meşe', fill: '#b8860b', border: '#5d4037', shadow: '#3e2723', highlight: '#daa520' }
  };
  
  const camFiyatlari = { standart: { isim: 'Standart Isıcam' }, sinerji: { isim: 'Sinerji Cam' }, konfor: { isim: 'Konfor Cam' } };
  const seciliRenk = profilRenkleri[renk] || profilRenkleri.beyaz;
  const seciliCam = camFiyatlari[camTipi] || camFiyatlari.standart;

  const handleSablonYukle = (sablonTipi) => {
    setDuzenlenenKalemId(null); setEnineBolmeVar(false);
    if (sablonTipi === 'wc') {
      setUrunTipi('wc_kapi'); setGenislik(800); setYukseklik(2100); setBolmeSayisi(1); setKanatlar(['sag']); setBolmeOlculeri([0]); setKalemAdi('WC Kapısı'); setSineklikIste(false); setMalzeme('upvc'); setLambiriBoyu(800); setAltPanelLambiri(true);
    } else if (sablonTipi === 'mutfak') {
      setUrunTipi('pencere'); setGenislik(1500); setYukseklik(1200); setBolmeSayisi(2); setKanatlar(['sabit', 'cift_sag']); setBolmeOlculeri([0, 0]); setKalemAdi('Mutfak Penceresi'); setSineklikIste(true); setMalzeme('upvc');
    } else if (sablonTipi === 'fransiz') {
      setUrunTipi('fransiz'); setGenislik(1400); setYukseklik(2100); setBolmeSayisi(2); setKanatlar(['sol', 'sag']); setBolmeOlculeri([0, 0]); setAltPanelLambiri(false); setKalemAdi('Fransız Balkon'); setMalzeme('upvc');
    } else if (sablonTipi === 'salon') {
      setUrunTipi('pencere'); setGenislik(2100); setYukseklik(1200); setBolmeSayisi(3); setKanatlar(['sabit', 'cift_sag', 'sabit']); setBolmeOlculeri([0, 0, 0]); setKalemAdi('Salon Penceresi'); setMalzeme('upvc');
    } else if (sablonTipi === 'balkon_kapi') {
      setUrunTipi('balkonkapi'); setGenislik(900); setYukseklik(2100); setBolmeSayisi(1); setKanatlar(['sag']); setBolmeOlculeri([0]); setKalemAdi('Balkon Kapısı'); setSineklikIste(true); setMalzeme('upvc'); setLambiriBoyu(800); setAltPanelLambiri(true);
    } else if (sablonTipi === 'surgulu_vw') {
      setUrunTipi('surgulu'); setGenislik(2000); setYukseklik(2100); setBolmeSayisi(2); setKanatlar(['sabit', 'sag']); setBolmeOlculeri([0, 0]); setKalemAdi('Sürgülü Sistem'); setSineklikIste(false); setMalzeme('upvc');
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
    if (kalem.urunTipi === 'plise_perde' || kalem.urunTipi === 'surgulu_sineklik') {
      setSpTipi(kalem.urunTipi); setSpGenislik(kalem.genislik || 800); setSpYukseklik(kalem.yukseklik || 2000); setSpRenk(kalem.renk === 'Standart' ? 'beyaz' : (kalem.renk || 'beyaz')); setSpAdet(kalem.adet || 1); handleSekmeDegistir('sineklik');
    } else {
      setUrunTipi(kalem.urunTipi); setGenislik(kalem.genislik); setYukseklik(kalem.yukseklik); setSagYukseklik(kalem.sagYukseklik || 1600); setBolmeSayisi(kalem.bolmeSayisi); setKanatlar(kalem.kanatlar); setBolmeOlculeri(kalem.bolmeOlculeri || Array(kalem.bolmeSayisi).fill(0)); setRenk(kalem.renk); setCamTipi(kalem.camTipi || 'standart'); setSineklikIste(kalem.sineklikIste || false); setAltPanelLambiri(kalem.altPanelLambiri !== undefined ? kalem.altPanelLambiri : true); setEnineBolmeVar(kalem.enineBolmeVar || false); setEnineBolmeYerdenYukseklik(kalem.enineBolmeYerdenYukseklik || 800); setMalzeme(kalem.malzeme || 'upvc'); setLambiriBoyu(kalem.lambiriBoyu || 800); setProfilSerisi(kalem.profilSerisi || 70); setAciModu(kalem.aciModu || 'aci_bul'); setManuelAci(kalem.manuelAci || 20); setEgimYonu(kalem.egimYonu || 'saga_yukselir'); handleSekmeDegistir('cizim'); 
    }
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handlePDFIndir = () => { window.print(); };
  const bolmeler = Array.from({ length: bolmeSayisi }, (_, index) => index);
  const sablonBtnStyle = { padding: '5px 10px', backgroundColor: '#f1f5f9', color: '#1E3A8A', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', flexShrink: 0, whiteSpace: 'nowrap' };

  const parseTarihTR = (tarihStr) => {
    if (!tarihStr) return new Date(0);
    const parcalar = tarihStr.split(/[./-]/);
    if (parcalar.length === 3) {
      if (parcalar[2].length === 4) return new Date(parcalar[2], parcalar[1] - 1, parcalar[0]); 
      else return new Date(parcalar[0], parcalar[1] - 1, parcalar[2]); 
    }
    return new Date();
  };

  let filtreliArsiv = musteriArsivi;
  if (raporBaslangic || raporBitis) {
    const bas = raporBaslangic ? new Date(raporBaslangic) : new Date(0);
    const bit = raporBitis ? new Date(raporBitis) : new Date();
    bit.setHours(23, 59, 59, 999);
    filtreliArsiv = musteriArsivi.filter(arsiv => {
      const pTarih = parseTarihTR(arsiv.teklifTarihi);
      return pTarih >= bas && pTarih <= bit;
    });
  }

  let raporCiro = 0; let raporCamM2 = 0; let raporSineklikM2 = 0;
  let profilTuketim = { upvc: { beyaz: 0, antrasit: 0, altin_mese: 0 }, aluminyum: { beyaz: 0, antrasit: 0, altin_mese: 0 } };

  filtreliArsiv.forEach(arsiv => {
    raporCiro += Number(arsiv.toplamFiyat) || 0;
    if (arsiv.sepet && Array.isArray(arsiv.sepet)) {
      arsiv.sepet.forEach(item => {
        let adet = Number(item.adet) || 1;
        if (item.urunTipi === 'surgulu_sineklik' || item.urunTipi === 'plise_perde') {
          raporSineklikM2 += ((Number(item.genislik) * Number(item.yukseklik)) / 1000000) * adet;
        } else {
          let pVal = Number(item.profilSerisi) || 70;
          let w = Number(item.genislik) || 0; let h = Number(item.yukseklik) || 0; let bolme = Number(item.bolmeSayisi) || 1;
          let kasaM = (w + h) * 2 / 1000;
          let dikmeM = bolme > 1 ? (bolme - 1) * (h - 2*pVal) / 1000 : 0;
          let kanatM = 0;
          if (item.kanatlar && Array.isArray(item.kanatlar)) {
            item.kanatlar.forEach(k => { if (k !== 'sabit') kanatM += ((w/bolme) + (h - 2*pVal)) * 2 / 1000; });
          }
          let yatayM = item.enineBolmeVar ? (w - 2*pVal)/1000 : 0;
          let totalProfil = (kasaM + Math.max(0, dikmeM) + kanatM + yatayM) * adet;
          let malzemeTipi = item.malzeme || 'upvc'; let renkTipi = item.renk || 'beyaz';
          if (profilTuketim[malzemeTipi] && profilTuketim[malzemeTipi][renkTipi] !== undefined) {
            profilTuketim[malzemeTipi][renkTipi] += totalProfil;
          }
          raporCamM2 += ((w * h) / 1000000) * adet; 
        }
      });
    }
  });

  return (
    <div className="ana-konteyner" style={{ position: 'relative', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1E3A8A', backgroundColor: '#f8fafc', width: '100%', overflowX: 'hidden' }}>
      
      {/* 🎯 SIFIR TAŞMA & MOBİL/DESKTOP STİLLERİ */}
      <style>{`
        * { box-sizing: border-box !important; }
        html, body { overflow-x: hidden !important; width: 100% !important; margin: 0; padding: 0; }
        
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background-color: white; color: black; margin: 0; padding: 0; }
          @page { margin: 15mm; }
          .fatura-cerceve { border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
        }
        @media screen { .print-only { display: none !important; } }
        
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
        <div className="no-print" style={{ backgroundColor: '#1E3A8A', color: '#ffffff', padding: '8px 10px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', width: '100%' }}>
          ⚡ eWindoore 14 Günlük Ücretsiz Deneme. Kalan Süreniz: <span style={{ color: '#93c5fd' }}>{kalanDenemeGunu} Gün</span>
        </div>
      )}

      {/* ANA KAPSAYICI */}
      <div className="ana-kapsayici" style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box', filter: !erisimIzni ? 'blur(6px)' : 'none', pointerEvents: !erisimIzni ? 'none' : 'auto' }}>

      {/* KURUMSAL FATURA ALANI */}
      <div className="print-only fatura-cerceve" style={{ width: '100%', minHeight: '100vh', position: 'relative', paddingBottom: '80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #1E3A8A', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h2 style={{ margin: '0 0 10px 0', color: '#1E3A8A', fontSize: '28px', textTransform: 'uppercase', letterSpacing: '2px' }}>PROFORMA FATURA</h2>
            <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Sayın / Firma:</strong> {projeAdi || 'Belirtilmedi'}</p>
            <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Telefon:</strong> {musteriTel || 'Belirtilmedi'}</p>
            <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Adres:</strong> {musteriAdres || 'Belirtilmedi'}</p>
            <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Tarih:</strong> {teklifTarihi}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            {firmaLogosu && <img src={firmaLogosu} alt="Firma Logosu" style={{ maxHeight: '80px', marginBottom: '10px' }} />}
            <h1 style={{ margin: '0', fontSize: '24px', color: '#1E3A8A', fontWeight: '900' }}>{firmaAdi}</h1>
            {kurumsalIban && <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#555' }}><strong>Banka IBAN:</strong> {kurumsalIban}</p>}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A', borderBottom: '2px solid #bfdbfe' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>No</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>Ürün / Açıklama</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>Sistem & Renk</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>Ölçü (En x Boy)</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>Tutar</th>
            </tr>
          </thead>
          <tbody>
            {sepet.length > 0 ? sepet.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '12px', fontSize: '14px', color: '#555' }}>{index + 1}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  <strong style={{ color: '#1E3A8A' }}>{item.isim}</strong>
                  {item.adet > 1 && <span style={{ color: '#1E3A8A', fontWeight: 'bold', marginLeft: '5px' }}>(x{item.adet})</span>}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#555' }}>
                  {item.urunTipi.replace('_', ' ').toUpperCase()} <br/>
                  {item.renkIsmi || item.renk}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#333' }}>
                  {item.genislik} x {item.yukseklik} mm
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: '#1E3A8A' }}>
                  {Math.ceil(Number(item.fiyat) || 0).toLocaleString('tr-TR')} ₺
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>Henüz ürün eklenmedi.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1E3A8A', paddingTop: '15px' }}>
          <div style={{ width: '55%' }}>
            {siparisNotu && (
              <>
                <strong style={{ color: '#1E3A8A', fontSize: '14px' }}>Siparişe Özel Notlar:</strong>
                <p style={{ fontSize: '13px', color: '#555', marginTop: '5px', padding: '10px', backgroundColor: '#fafafa', border: '1px solid #eee', borderRadius: '4px' }}>
                  {siparisNotu}
                </p>
              </>
            )}
          </div>
          <div style={{ width: '40%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '18px' }}>
              <strong style={{ color: '#1E3A8A' }}>Teklif Genel Toplamı:</strong>
              <strong style={{ color: '#1E3A8A', fontSize: '22px' }}>{Math.ceil(sepetGenelToplam).toLocaleString('tr-TR')} ₺</strong>
            </div>
          </div>
        </div>

        <div style={{ position: 'fixed', bottom: '0', left: '0', width: '100%', textAlign: 'center', borderTop: '1px solid #cfd8dc', paddingTop: '15px', paddingBottom: '10px', backgroundColor: 'white' }}>
          <span style={{ fontSize: '11px', color: '#78909c' }}>
            Bu fatura dijital olarak <strong style={{ color: '#1E3A8A', letterSpacing: '4px', fontSize: '13px' }}>eWindoore</strong> yazılım altyapısı kullanılarak oluşturulmuştur.
          </span>
        </div>
      </div>

      {/* NORMAL UYGULAMA PANELİ */}
      <div className="no-print">
        
        {/* HEADER */}
        <div className="baslik-kapsayici" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', marginBottom: '14px' }}>
          <h2 className="baslik-yazisi" style={{ margin: 0, color: '#1E3A8A', fontSize: '20px', fontWeight: '900' }}>eWindoore Dijital Çizim Sistemi</h2>
          
          <div className="ust-sag-aksiyonlar" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
              <span style={{ color: '#1E3A8A', fontWeight: 'bold' }}>Gözlem Modu:</span>
              <select value={aktifRol} onChange={(e) => setAktifRol(e.target.value)} style={{ border: 'none', background: 'transparent', fontWeight: 'bold', color: '#1E3A8A', cursor: 'pointer', outline: 'none' }}>
                <option value="patron">👑 Patron Arayüzü</option>
                <option value="usta">👷‍♂️ Usta / Personel Arayüzü</option>
              </select>
            </div>

            <button onClick={handlePDFIndir} style={{ padding: '6px 10px', backgroundColor: '#1E3A8A', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
              Kurumsal PDF 🖨️
            </button>

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
          <button className="sekme-buton" onClick={() => handleSekmeDegistir('fiyatlar')} style={{ flex: 1, padding: '10px 4px', backgroundColor: aktifSekme === 'fiyatlar' ? '#1E3A8A' : '#ffffff', color: aktifSekme === 'fiyatlar' ? '#ffffff' : '#1E3A8A', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Ayarlar</button>
          <button className="sekme-buton" onClick={() => handleSekmeDegistir('arsiv')} style={{ flex: 1, padding: '10px 4px', backgroundColor: aktifSekme === 'arsiv' ? '#1E3A8A' : '#ffffff', color: aktifSekme === 'arsiv' ? '#ffffff' : '#1E3A8A', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>📑 CRM Arşiv</button>
          {aktifRol === 'patron' && (
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '6px' }}>
                    <label style={{ cursor: 'pointer', fontSize: '11px', color: malzeme === 'upvc' ? '#1E3A8A' : '#666', fontWeight: malzeme === 'upvc' ? 'bold' : 'normal' }}>
                      <input type="radio" value="upvc" checked={malzeme === 'upvc'} onChange={(e) => setMalzeme(e.target.value)} style={{ marginRight: '4px' }} /> UPVC
                    </label>
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
              <svg viewBox={`-130 -50 ${(gGenislik || 1000) + 160} ${Math.max(gYukseklik, gSagYukseklik) + 210}`} style={{ width: '100%', maxWidth: '850px', height: 'auto', overflow: 'visible', margin: '0 auto' }}>
                <defs>
                  <linearGradient id="proCamGradyan" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e1f5fe" stopOpacity="0.95" />
                    <stop offset="40%" stopColor="#b3e5fc" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#81d4fa" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="profilGolge" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.2" />
                  </filter>
                </defs>

                {/* Yükseklik (Sol) */}
                <g stroke="#000000" strokeWidth="3" fill="none">
                   <line x1="-40" y1="0" x2="-40" y2={gYukseklik} />
                   <line x1="-55" y1="0" x2="-25" y2="0" />
                   <line x1="-55" y1={gYukseklik} x2="-25" y2={gYukseklik} />
                </g>
                <text x="-65" y={gYukseklik / 2} transform={`rotate(-90, -65, ${gYukseklik / 2})`} textAnchor="middle" fill="#000000" fontSize="52" fontWeight="900" paintOrder="stroke fill" stroke="#ffffff" strokeWidth="6">{Math.round(gYukseklik)}</text>

                {/* Bölme Ölçüleri (750 / 750 mm vb.) */}
                {hesaplananGenislikler.map((bg, i) => {
                  const cx = hesaplananGenislikler.slice(0, i).reduce((sum, val) => sum + val, 0);
                  const mid = cx + (bg / 2);
                  const isLast = i === hesaplananGenislikler.length - 1;
                  return (
                    <g key={`dim-${i}`}>
                      <line x1={cx} y1={gYukseklik + 40} x2={cx + bg} y2={gYukseklik + 40} stroke="#000000" strokeWidth="2.5" />
                      <line x1={cx} y1={gYukseklik + 25} x2={cx} y2={gYukseklik + 55} stroke="#000000" strokeWidth="2.5" />
                      {isLast && <line x1={cx + bg} y1={gYukseklik + 25} x2={cx + bg} y2={gYukseklik + 55} stroke="#000000" strokeWidth="2.5" />}
                      <text x={mid} y={gYukseklik + 35} textAnchor="middle" fill="#000000" fontSize="42" fontWeight="900" paintOrder="stroke fill" stroke="#ffffff" strokeWidth="6">{Math.round(bg)}</text>
                      {bolmeOlculeri[i] === 0 && <text x={mid} y={gYukseklik + 68} textAnchor="middle" fill="#666666" fontSize="24" fontWeight="bold">Auto</text>}
                    </g>
                  );
                })}

                {/* Toplam Genişlik Çizgisi (En Alt) */}
                <g stroke="#000000" strokeWidth="3" fill="none">
                   <line x1="0" y1={gYukseklik + 110} x2={gGenislik} y2={gYukseklik + 110} />
                   <line x1="0" y1={gYukseklik + 95} x2="0" y2={gYukseklik + 125} />
                   <line x1={gGenislik} y1={gYukseklik + 95} x2={gGenislik} y2={gYukseklik + 125} />
                </g>
                <text x={gGenislik / 2} y={gYukseklik + 105} textAnchor="middle" fill="#000000" fontSize="52" fontWeight="900" paintOrder="stroke fill" stroke="#ffffff" strokeWidth="6">{Math.round(gGenislik)}</text>

                {/* Pencere / Kapı Gövdesi */}
                <g>
                  <rect x="0" y="0" width={gGenislik} height={gYukseklik} fill={seciliRenk.shadow} rx="4" />
                  <rect x="0" y="0" width={gGenislik} height={gYukseklik} fill={seciliRenk.fill} stroke={seciliRenk.border} strokeWidth="10" rx="4" filter="url(#profilGolge)" />
                  <rect x={p*0.3} y={p*0.3} width={gGenislik - (p*0.6)} height={gYukseklik - (p*0.6)} fill="none" stroke={seciliRenk.border} strokeWidth="2.5" opacity="0.6" />

                  {/* 🎯 ENİNE BÖLME / ORTA KAYIT PROFİLİ (SVG ÇİZİMİ) */}
                  {enineBolmeVar && (
                    <g>
                      <rect 
                        x="0" 
                        y={Math.max(p, gYukseklik - Number(enineBolmeYerdenYukseklik) - (p/2))} 
                        width={gGenislik} 
                        height={p} 
                        fill={seciliRenk.fill} 
                        stroke={seciliRenk.border} 
                        strokeWidth="3" 
                      />
                    </g>
                  )}

                  {hesaplananGenislikler.map((bg, index) => {
                    const currentX = hesaplananGenislikler.slice(0, index).reduce((sum, val) => sum + val, 0);
                    const kanatTipi = kanatlar[index];
                    const isSonBolme = index === bolmeSayisi - 1;
                    
                    let camW = Math.max(0, bg - (2 * p)); 
                    let camH = Math.max(0, gYukseklik - (2 * p));
                    const camX = currentX + p;
                    const camY = p;

                    // Lambiri Varsa Cam Boyu Daralır
                    const lambiriAktif = isKapiMi && gercekLambiriVarMi;
                    const cLambiriYukseklik = lambiriAktif ? Math.min(camH - 100, Number(lambiriBoyu) || 800) : 0;
                    if (lambiriAktif) {
                      camH -= cLambiriYukseklik;
                    }

                    // 🎯 ÇİFT AÇILIM (ÇİFT ÇİZGİ) YÖN ÇİZGİLERİ
                    let cizgi1 = ""; 
                    let cizgi2 = "";
                    if (kanatTipi !== 'sabit') {
                      const sagCizgi = `M ${camX + camW} ${camY} L ${camX} ${camY + (camH/2)} L ${camX + camW} ${camY + camH}`;
                      const solCizgi = `M ${camX} ${camY} L ${camX + camW} ${camY + (camH/2)} L ${camX} ${camY + camH}`;
                      const vasistasCizgi = `M ${camX} ${camY + camH} L ${camX + (camW/2)} ${camY} L ${camX + camW} ${camY + camH}`;

                      if (kanatTipi === 'sag') cizgi1 = sagCizgi;
                      else if (kanatTipi === 'sol') cizgi1 = solCizgi;
                      else if (kanatTipi === 'vasistas') cizgi1 = vasistasCizgi;
                      else if (kanatTipi === 'cift_sag') { cizgi1 = sagCizgi; cizgi2 = vasistasCizgi; }
                      else if (kanatTipi === 'cift_sol') { cizgi1 = solCizgi; cizgi2 = vasistasCizgi; }
                    }

                    return (
                      <g key={`bolme-${index}`}>
                        {kanatTipi !== 'sabit' ? (
                          <g>
                            <rect x={currentX + (p/2)} y={p/2} width={bg - p} height={gYukseklik - p} fill={seciliRenk.fill} stroke={seciliRenk.border} strokeWidth="4" rx="2" />
                            
                            {/* Cam Alanı */}
                            <rect x={camX} y={camY} width={camW} height={camH} fill="url(#proCamGradyan)" stroke="#78909c" strokeWidth="2" />
                            
                            {/* 🎯 LAMBİRİ PANELİ ÇİZİMİ */}
                            {lambiriAktif && (
                              <g>
                                <rect 
                                  x={camX} 
                                  y={camY + camH} 
                                  width={camW} 
                                  height={cLambiriYukseklik} 
                                  fill={seciliRenk.fill} 
                                  stroke={seciliRenk.border} 
                                  strokeWidth="3" 
                                />
                                {Array.from({ length: Math.max(2, Math.floor(camW / 80)) }).map((_, lIdx) => (
                                  <line 
                                    key={`l-line-${lIdx}`} 
                                    x1={camX + (lIdx + 1) * (camW / (Math.floor(camW / 80) + 1))} 
                                    y1={camY + camH} 
                                    x2={camX + (lIdx + 1) * (camW / (Math.floor(camW / 80) + 1))} 
                                    y2={camY + camH + cLambiriYukseklik} 
                                    stroke={seciliRenk.border} 
                                    strokeWidth="1.5" 
                                  />
                                ))}
                                <text x={camX + camW/2} y={camY + camH + cLambiriYukseklik/2 + 8} textAnchor="middle" fontSize="32" fill="#000000" fontWeight="900" paintOrder="stroke fill" stroke="#ffffff" strokeWidth="6">
                                  Lambiri Panel
                                </text>
                              </g>
                            )}

                            {/* 🎯 BÜYÜTÜLMÜŞ VE BEYAZ DIŞ KONTURLU "CAM EN" VE "CAM BOY" YAZISI */}
                            {camW > 100 && (
                              <g>
                                <text x={camX + camW/2} y={camY + camH/2 - 20} textAnchor="middle" fontSize="40" fill="#0288d1" fontWeight="900" paintOrder="stroke fill" stroke="#ffffff" strokeWidth="8">
                                  Cam En: {Math.round(camW)}
                                </text>
                                <text x={camX + camW/2} y={camY + camH/2 + 30} textAnchor="middle" fontSize="40" fill="#dc2626" fontWeight="900" paintOrder="stroke fill" stroke="#ffffff" strokeWidth="8">
                                  Cam Boy: {Math.round(camH)}
                                </text>
                              </g>
                            )}
                            
                            {/* Açılım Yön Çizgileri (Çift Açılımda 2 Çizgi) */}
                            {cizgi1 && <path d={cizgi1} stroke="#0288d1" fill="none" strokeWidth="3.5" strokeDasharray="15,10" />}
                            {cizgi2 && <path d={cizgi2} stroke="#0288d1" fill="none" strokeWidth="3.5" strokeDasharray="15,10" />}
                            
                            {/* Kapı/Pencere Kolu ve Menteşeler */}
                            <g>
                              <rect 
                                x={kanatTipi.includes('sag') ? currentX + p + 10 : currentX + bg - p - 18} 
                                y={gYukseklik/2 - 25} 
                                width="10" 
                                height="50" 
                                rx="3" 
                                fill="#0f172a" 
                                stroke="#ffffff" 
                                strokeWidth="2" 
                              />
                              <circle 
                                cx={kanatTipi.includes('sag') ? currentX + p + 15 : currentX + bg - p - 13} 
                                cy={gYukseklik/2} 
                                r="6" 
                                fill="#0288d1" 
                              />
                              <rect x={kanatTipi.includes('sag') ? currentX + bg - (p/2) - 5 : currentX + (p/2) - 2} y={p + 40} width="7" height="32" fill="#334155" rx="1" />
                              <rect x={kanatTipi.includes('sag') ? currentX + bg - (p/2) - 5 : currentX + (p/2) - 2} y={gYukseklik - p - 70} width="7" height="32" fill="#334155" rx="1" />
                            </g>
                          </g>
                        ) : (
                          <g>
                            <rect x={camX} y={camY} width={camW} height={camH} fill="url(#proCamGradyan)" stroke="#78909c" strokeWidth="2" />
                            
                            {/* Sabit Camda Lambiri Varsa */}
                            {lambiriAktif && (
                              <g>
                                <rect 
                                  x={camX} 
                                  y={camY + camH} 
                                  width={camW} 
                                  height={cLambiriYukseklik} 
                                  fill={seciliRenk.fill} 
                                  stroke={seciliRenk.border} 
                                  strokeWidth="3" 
                                />
                                {Array.from({ length: Math.max(2, Math.floor(camW / 80)) }).map((_, lIdx) => (
                                  <line 
                                    key={`sl-line-${lIdx}`} 
                                    x1={camX + (lIdx + 1) * (camW / (Math.floor(camW / 80) + 1))} 
                                    y1={camY + camH} 
                                    x2={camX + (lIdx + 1) * (camW / (Math.floor(camW / 80) + 1))} 
                                    y2={camY + camH + cLambiriYukseklik} 
                                    stroke={seciliRenk.border} 
                                    strokeWidth="1.5" 
                                  />
                                ))}
                                <text x={camX + camW/2} y={camY + camH + cLambiriYukseklik/2 + 8} textAnchor="middle" fontSize="32" fill="#000000" fontWeight="900" paintOrder="stroke fill" stroke="#ffffff" strokeWidth="6">
                                  Lambiri Panel
                                </text>
                              </g>
                            )}

                            {camW > 100 && (
                              <g>
                                <text x={camX + camW/2} y={camY + camH/2 - 20} textAnchor="middle" fontSize="40" fill="#0288d1" fontWeight="900" paintOrder="stroke fill" stroke="#ffffff" strokeWidth="8">
                                  Cam En: {Math.round(camW)}
                                </text>
                                <text x={camX + camW/2} y={camY + camH/2 + 30} textAnchor="middle" fontSize="40" fill="#dc2626" fontWeight="900" paintOrder="stroke fill" stroke="#ffffff" strokeWidth="8">
                                  Cam Boy: {Math.round(camH)}
                                </text>
                              </g>
                            )}
                          </g>
                        )}
                        
                        {!isSonBolme && <rect x={currentX + bg - (p/2)} y={0} width={p} height={gYukseklik} fill={seciliRenk.fill} stroke={seciliRenk.border} strokeWidth="3" />}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* MALİYET KUTUSU */}
            <div className="mobil-tam-genislik" style={{ padding: '14px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
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
                  <option value="surgulu_sineklik">Sürgülü Sineklik</option>
                  <option value="plise_perde">Plise Perde</option>
                </select>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <label style={{ flex: '1', fontSize: '12px' }}>En (mm): <input type="number" value={spGenislik} onChange={e => setSpGenislik(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/></label>
                  <label style={{ flex: '1', fontSize: '12px' }}>Boy (mm): <input type="number" value={spYukseklik} onChange={e => setSpYukseklik(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/></label>
                  <label style={{ flex: '0.6', fontSize: '12px' }}>Adet: <input type="number" value={spAdet} onChange={e => setSpAdet(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/></label>
                </div>

                {spTipi === 'surgulu_sineklik' ? (
                  <>
                    <h4 style={{ margin: '10px 0 6px 0', color: '#1E3A8A', fontSize: '13px' }}>2. Profil Rengi</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      {Object.keys(profilRenkleri).map(r => (
                        <label key={r} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: spRenk === r ? 'bold' : 'normal' }}>
                          <input type="radio" value={r} checked={spRenk === r} onChange={e => setSpRenk(e.target.value)} />
                          {profilRenkleri[r].isim}
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '8px', backgroundColor: '#eff6ff', color: '#1E3A8A', borderRadius: '4px', fontSize: '11px', borderLeft: '3px solid #1E3A8A' }}>
                    Not: Plise perdelerde kasa rengi fiyatı etkilemez. Fiyat m² üzerinden hesaplanır.
                  </div>
                )}
              </div>

              <div className="mobil-tam-genislik" style={{ padding: '14px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', flex: '1', minWidth: '240px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1E3A8A', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '6px' }}>Maliyet Hesabı</h3>
                <div style={{ marginBottom: '12px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Toplam Tutar ({spAdet} Adet):</div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1E3A8A', marginTop: '2px' }}>
                    {Math.ceil(anlikSpTutar).toLocaleString('tr-TR')} ₺
                  </div>
                </div>

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
                        <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Tutar</th>
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
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 'bold', color: '#1E3A8A' }}>
                            {Math.ceil(Number(kalem.fiyat) || 0).toLocaleString('tr-TR')} ₺
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                            <button onClick={(e) => { e.stopPropagation(); setSepet(prev => prev.filter(k => k.id !== kalem.id)); }} style={{ padding: '4px 8px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>Sil</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '2px solid #cfd8dc', textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', color: '#546e7a', marginRight: '10px' }}>Proje Genel Toplamı:</span>
                  <h2 style={{ margin: '0', color: '#1E3A8A', fontSize: '24px', display: 'inline-block' }}>
                    {Math.ceil(sepetGenelToplam).toLocaleString('tr-TR')} ₺
                  </h2>
                </div>
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
        {aktifSekme === 'fiyatlar' && (
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
              <button className="mobil-tam-genislik" onClick={() => setAktifRenkSekmesi('beyaz')} style={{ flex: '1', padding: '8px', backgroundColor: aktifRenkSekmesi === 'beyaz' ? '#1E3A8A' : '#f1f5f9', color: aktifRenkSekmesi === 'beyaz' ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Beyaz Serisi</button>
              <button className="mobil-tam-genislik" onClick={() => setAktifRenkSekmesi('antrasit')} style={{ flex: '1', padding: '8px', backgroundColor: aktifRenkSekmesi === 'antrasit' ? '#1E3A8A' : '#f1f5f9', color: aktifRenkSekmesi === 'antrasit' ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Antrasit Serisi</button>
              <button className="mobil-tam-genislik" onClick={() => setAktifRenkSekmesi('altin_mese')} style={{ flex: '1', padding: '8px', backgroundColor: aktifRenkSekmesi === 'altin_mese' ? '#1E3A8A' : '#f1f5f9', color: aktifRenkSekmesi === 'altin_mese' ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Altın Meşe Serisi</button>
            </div>

            {fiyatYukleniyor ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#1E3A8A', fontWeight: 'bold' }}>
                Fiyatlar veritabanından getiriliyor... ☁️
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1E3A8A', borderBottom: '1px solid #eee', paddingBottom: '4px', fontSize: '13px' }}>UPVC Profilleri (m)</h4>
                  {[
                    { key: 'kasa', label: 'Kasa' },
                    { key: 'ortakayit', label: 'Ortakayıt' },
                    { key: 'pencereKanadi', label: 'Pencere Kanadı' },
                    { key: 'kapiKanadi', label: 'Kapı Kanadı' },
                    { key: 'surmeKasa', label: 'Sürme Kasa' },
                    { key: 'surmeKanadi', label: 'Sürme Kanadı' }
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                      {item.label}:
                      <div><input type="number" value={fiyatTablo[aktifRenkSekmesi][item.key] || ''} onChange={(e) => handleFiyatDegisimi(aktifRenkSekmesi, item.key, e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
                    </label>
                  ))}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1E3A8A', borderBottom: '1px solid #eee', paddingBottom: '4px', fontSize: '13px' }}>Alüminyum (m)</h4>
                  {[
                    { key: 'aluKasa', label: 'Kasa' },
                    { key: 'aluOrtakayit', label: 'Ortakayıt' },
                    { key: 'aluPencereKanadi', label: 'Pencere Kanadı' },
                    { key: 'aluKapiKanadi', label: 'Kapı Kanadı' },
                    { key: 'aluSurmeKasa', label: 'Sürme Kasa' },
                    { key: 'aluSurmeKanadi', label: 'Sürme Kanadı' }
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                      {item.label}:
                      <div><input type="number" value={fiyatTablo[aktifRenkSekmesi][item.key] || ''} onChange={(e) => handleFiyatDegisimi(aktifRenkSekmesi, item.key, e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
                    </label>
                  ))}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1E3A8A', borderBottom: '1px solid #eee', paddingBottom: '4px', fontSize: '13px' }}>Cam ve Panel (m²)</h4>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                    Cam Fiyatı:
                    <div><input type="number" value={fiyatTablo[aktifRenkSekmesi].cam || ''} onChange={(e) => handleFiyatDegisimi(aktifRenkSekmesi, 'cam', e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
                  </label>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px', color: '#1E3A8A' }}>
                    Cam İçi Çıta:
                    <div><input type="number" value={fiyatTablo[aktifRenkSekmesi].camIci || ''} onChange={(e) => handleFiyatDegisimi(aktifRenkSekmesi, 'camIci', e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
                  </label>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                    UPVC Lambiri:
                    <div><input type="number" value={fiyatTablo[aktifRenkSekmesi].upvcLambiri || ''} onChange={(e) => handleFiyatDegisimi(aktifRenkSekmesi, 'upvcLambiri', e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
                  </label>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                    Alü. Lambiri:
                    <div><input type="number" value={fiyatTablo[aktifRenkSekmesi].aluLambiri || ''} onChange={(e) => handleFiyatDegisimi(aktifRenkSekmesi, 'aluLambiri', e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
                  </label>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1E3A8A', borderBottom: '1px solid #eee', paddingBottom: '4px', fontSize: '13px' }}>Aksesuarlar (Adet)</h4>
                  {[
                    { key: 'tekAcilim', label: 'Tek Açılım' },
                    { key: 'ciftAcilim', label: 'Çift Açılım' },
                    { key: 'vasistas', label: 'Vasistas' },
                    { key: 'kapiAksesuar', label: 'Kapı Menteşe' },
                    { key: 'surmeAksesuar', label: 'Sürme Araba' },
                    { key: 'sineklik', label: 'Basit Sineklik' }
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                      {item.label}:
                      <div><input type="number" value={fiyatTablo[aktifRenkSekmesi][item.key] || ''} onChange={(e) => handleFiyatDegisimi(aktifRenkSekmesi, item.key, e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. SEKME: PATRON EKRANI */}
        {aktifSekme === 'patron' && (
          <div style={{ padding: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '380px', width: '100%', boxSizing: 'border-box' }}>
            <div className="mobil-sutun" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1E3A8A', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#1E3A8A', fontSize: '20px' }}>📊 Patron & Fabrika Analiz Özeti</h3>
                <p style={{ margin: 0, color: '#555', fontSize: '12px' }}>Seçtiğiniz tarihler arasındaki ciroyu ve malzeme tüketimini takip edin.</p>
              </div>
              <div className="mobil-tam-genislik" style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#1E3A8A' }}>Başlangıç: <input type="date" value={raporBaslangic} onChange={e => setRaporBaslangic(e.target.value)} style={{ padding: '4px', border: '1px solid #ccc', borderRadius: '3px' }}/></label>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#1E3A8A' }}>Bitiş: <input type="date" value={raporBitis} onChange={e => setRaporBitis(e.target.value)} style={{ padding: '4px', border: '1px solid #ccc', borderRadius: '3px' }}/></label>
                <button onClick={() => {setRaporBaslangic(''); setRaporBitis('');}} style={{ padding: '4px 8px', backgroundColor: '#1E3A8A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Sıfırla</button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', textAlign: 'center' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>💰</span>
                <strong style={{ color: '#757575', fontSize: '12px', display: 'block', textTransform: 'uppercase' }}>Filtrelenen Toplam Ciro</strong>
                <span style={{ color: '#1E3A8A', fontSize: '24px', fontWeight: '900', display: 'block', marginTop: '6px' }}>
                  {Math.ceil(raporCiro).toLocaleString('tr-TR')} ₺
                </span>
              </div>

              <div onClick={() => handleSekmeDegistir('arsiv')} style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', textAlign: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>📁</span>
                <strong style={{ color: '#757575', fontSize: '12px', display: 'block', textTransform: 'uppercase' }}>Üretilen Proje</strong>
                <span style={{ color: '#1E3A8A', fontSize: '24px', fontWeight: '900', display: 'block', marginTop: '6px' }}>
                  {filtreliArsiv.length} Adet
                </span>
              </div>

              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', textAlign: 'center' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>📐</span>
                <strong style={{ color: '#757575', fontSize: '12px', display: 'block', textTransform: 'uppercase' }}>Harcanan Profil</strong>
                <span style={{ color: '#1E3A8A', fontSize: '24px', fontWeight: '900', display: 'block', marginTop: '6px' }}>
                  {Math.round(
                    profilTuketim.upvc.beyaz + profilTuketim.upvc.antrasit + profilTuketim.upvc.altin_mese +
                    profilTuketim.aluminyum.beyaz + profilTuketim.aluminyum.antrasit + profilTuketim.aluminyum.altin_mese
                  ).toLocaleString('tr-TR')} Metre
                </span>
              </div>
            </div>

            <h4 style={{ color: '#1E3A8A', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Maliyet & Tüketim Raporu (Bill of Materials)</h4>
            <div className="tablo-kapsayici">
              <table style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '500px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Malzeme Tipi</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Beyaz</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Antrasit</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Altın Meşe</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#dbeafe' }}>Toplam Tüketim</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>UPVC Plastik Profil</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{Math.round(profilTuketim.upvc.beyaz)} m</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{Math.round(profilTuketim.upvc.antrasit)} m</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{Math.round(profilTuketim.upvc.altin_mese)} m</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>{Math.round(profilTuketim.upvc.beyaz + profilTuketim.upvc.antrasit + profilTuketim.upvc.altin_mese)} m</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Alüminyum Profil</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{Math.round(profilTuketim.aluminyum.beyaz)} m</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{Math.round(profilTuketim.aluminyum.antrasit)} m</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{Math.round(profilTuketim.aluminyum.altin_mese)} m</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>{Math.round(profilTuketim.aluminyum.beyaz + profilTuketim.aluminyum.antrasit + profilTuketim.aluminyum.altin_mese)} m</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Isıcam & Panel</td>
                    <td colSpan="3" style={{ padding: '8px', borderBottom: '1px solid #eee', fontStyle: 'italic', color: '#777' }}>Projedeki toplam cam alanı.</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>{raporCamM2.toFixed(2)} m²</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Sineklik & Perde Tülü</td>
                    <td colSpan="3" style={{ padding: '8px', borderBottom: '1px solid #eee', fontStyle: 'italic', color: '#777' }}>Toplam sineklik/perde tül metrajı.</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>{raporSineklikM2.toFixed(2)} m²</td>
                  </tr>
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

    </div>
  );
}