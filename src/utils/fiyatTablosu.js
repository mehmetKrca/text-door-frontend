/**
 * eWindoore — Fiyat Tablosu (Sürüm 2)
 *
 * SÜRÜM 1'DEN FARKLAR:
 *  - Alüminyum kaldırıldı, yalnızca UPVC
 *  - 3 renk yerine 2 fiyat kademesi: beyaz seri / renkli seri
 *    (görsel renk ayrı tutulur: beyaz, antrasit, altın meşe)
 *  - Cam tipleri kodda gömülü zam yerine kendi m² fiyatını taşır
 *  - Sineklik ve plise perde bileşen bazlı fiyatlanır
 *  - `surum` alanı var; eski tablolar otomatik dönüştürülür
 */

export const FIYAT_TABLOSU_SURUMU = 2;

/* ============================================================
   GÖRSEL RENKLER  →  FİYAT KADEMESİ EŞLEŞMESİ
   Müşteri antrasit görür, fiyat "renkli" kademesinden hesaplanır.
   ============================================================ */
export const GORSEL_RENKLER = [
  { id: 'beyaz', ad: 'Klasik Beyaz', kademe: 'beyaz', yuz: '#f2f4f7', kenar: '#c3cad4', koyu: '#9aa4b2', isik: '#ffffff' },
  { id: 'antrasit', ad: 'Antrasit Gri', kademe: 'renkli', yuz: '#454d57', kenar: '#2b3138', koyu: '#1d2228', isik: '#5d6773' },
  { id: 'altin_mese', ad: 'Altın Meşe', kademe: 'renkli', yuz: '#a8792f', kenar: '#7c5720', koyu: '#5f4318', isik: '#c49546' },
];

export const renkKademesi = (renkId) =>
  GORSEL_RENKLER.find((r) => r.id === renkId)?.kademe || 'beyaz';


/* ============================================================
   PROFİL SERİLERİ — CAM ÖLÇÜSÜ PAYLARI

   ⚠️ KRİTİK BİLGİ: "70mm seri" profilin DERİNLİĞİDİR (kasa kalınlığı),
   görünen yüz genişliği DEĞİLDİR. Cam ölçüsü görünen yüz genişliklerine
   ve cam oturma paylarına göre hesaplanır.

   Bu değerler profil üreticisinin teknik katalogundan gelir —
   Winsa, Egepen, Fırat, Adopen, Pimapen hepsi farklıdır.
   Firma kendi profiline göre Fiyat Ayarları'ndan düzeltir.

     kasaPayi       : dış ölçüden HER KENARDAN düşülen kasa payı
     kayitGenisligi : orta kayıt (dikme) toplam görünen genişliği
     kanatCamPayi   : AÇILAN bölmede YAN kenarlardan düşülen pay
                      (kanat profili + cam çıtası) — EN hesabında kullanılır
     kanatCamPayiBoy: AÇILAN bölmede ÜST/ALT kenarlardan düşülen pay —
                      BOY hesabında kullanılır. Genelde yan kenarlardan
                      büyüktür çünkü kanadın alt rayı su tahliye kanalı
                      yüzünden daha geniş yapılır.
     sabitCamPayi   : SABİT bölmede her kenardan düşülen pay (yalnız çıta)

   ÖNEMLİ AYRIM — sabit cam ile kanat camı bambaşka çalışır:
     · SABİT bölmede cam doğrudan kasa/kayıt yuvasına oturur, çıta onu
       önden tutar. Bu yüzden pay çok küçüktür (~5 mm).
     · AÇILAN bölmede cam kanat profilinin İÇİNDE durur. Kanadın kendi
       genişliği devreye girer, pay büyüktür (~48 mm).

   70'lik seri gerçek bir pencereden ölçülerek kalibre edildi
   (çıta sökülü, kanat ve cam ayrı ayrı ölçüldü):
     Dış 1210×1380 · kanat dış 540×1310 · kanat camı 455×1200
     → kasaPayi 35 · kanatCamPayi 48 · kayitGenisligi 65 · sabitCamPayi 5

   60 ve 80'lik seriler bundan oranlanmıştır. Profili farklı olan firma
   Fiyat Ayarları → Profil Kalibrasyonu ile 5 dakikada kendi değerlerini
   hesaplatabilir.
   ============================================================ */

export const PROFIL_SERILERI = [60, 70, 80];

export const VARSAYILAN_PROFIL_PAYLARI = {
  60: { kasaPayi: 32, kayitGenisligi: 60, kanatCamPayi: 39, kanatCamPayiBoy: 50, sabitCamPayi: 5 },
  70: { kasaPayi: 35, kayitGenisligi: 65, kanatCamPayi: 42.5, kanatCamPayiBoy: 55, sabitCamPayi: 5 },
  80: { kasaPayi: 40, kayitGenisligi: 72, kanatCamPayi: 47, kanatCamPayiBoy: 61, sabitCamPayi: 5 },
};

/** Seri numarasını güvenli hale getirir — 60/70/80 dışındaki değer 70 sayılır */
export const seriNoDuzelt = (seri) => {
  const n = Math.round(Number(seri));
  return PROFIL_SERILERI.includes(n) ? n : 70;
};

/**
 * Bir seri için geçerli payları döndürür.
 * Firma fiyat tablosunda özel değer varsa o kullanılır, yoksa varsayılan.
 * Geçersiz/sıfır değerler sessizce varsayılana düşer — cam ölçüsü asla
 * bozuk çıkmasın.
 */
export function profilPaylariAl(seri, tablo) {
  const no = seriNoDuzelt(seri);
  const varsayilan = VARSAYILAN_PROFIL_PAYLARI[no];
  const ozel = tablo?.profilPaylari?.[no] || tablo?.profilPaylari?.[String(no)];

  const al = (alan) => {
    const v = Number(ozel?.[alan]);
    return Number.isFinite(v) && v > 0 && v < 300 ? v : varsayilan[alan];
  };

  return {
    seri: no,
    kasaPayi: al('kasaPayi'),
    kayitGenisligi: al('kayitGenisligi'),
    kanatCamPayi: al('kanatCamPayi'),
    kanatCamPayiBoy: al('kanatCamPayiBoy'),
    sabitCamPayi: al('sabitCamPayi'),
  };
}


/* ============================================================
   PROFİL KALİBRASYONU

   Usta elindeki BİR pencereyi ölçer, uygulama profil paylarını
   kendisi hesaplar. Katalog aramaya gerek kalmaz.

   Ölçülecekler (çıta sökülü, kanat çıkarılmış hâlde):
     1. Pencerenin dış boyu           → disBoy
     2. Kanadın dış boyu              → kanatDisBoy
     3. Kanadın dış eni               → kanatDisEn
     4. Kanat camının eni             → kanatCamEn
     5. Orta kayıt genişliği (varsa)  → kayitGenisligi
     6. Sabit camın boyu (varsa)      → sabitCamBoy

   Türetilenler:
     kasaPayi       = (disBoy - kanatDisBoy) / 2
     kanatCamPayi    = (kanatDisEn  - kanatCamEn)  / 2   (yan kenarlar)
     kanatCamPayiBoy = (kanatDisBoy - kanatCamBoy) / 2   (üst/alt)
     sabitCamPayi   = (disBoy - 2·kasaPayi - sabitCamBoy) / 2
   ============================================================ */
export function paylariKalibreEt(olcum) {
  const s = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const disBoy = s(olcum?.disBoy);
  const kanatDisBoy = s(olcum?.kanatDisBoy);
  const kanatDisEn = s(olcum?.kanatDisEn);
  const kanatCamEn = s(olcum?.kanatCamEn);
  const kanatCamBoy = s(olcum?.kanatCamBoy);
  const kayitOlcum = s(olcum?.kayitGenisligi);
  const sabitCamBoy = s(olcum?.sabitCamBoy);

  const sonuc = { paylar: {}, uyarilar: [], eksik: [] };

  /* --- kasa payı --- */
  let kasaPayi = null;
  if (disBoy && kanatDisBoy) {
    if (kanatDisBoy >= disBoy) {
      sonuc.uyarilar.push('Kanat dış boyu pencere dış boyundan büyük olamaz.');
    } else {
      kasaPayi = (disBoy - kanatDisBoy) / 2;
      if (kasaPayi < 15 || kasaPayi > 120) {
        sonuc.uyarilar.push(
          `Kasa payı ${kasaPayi.toFixed(1)} mm çıktı — beklenen aralık 15-120 mm. Ölçüleri kontrol edin.`
        );
      } else {
        sonuc.paylar.kasaPayi = Number(kasaPayi.toFixed(1));
      }
    }
  } else {
    sonuc.eksik.push('Pencere dış boyu ve kanat dış boyu');
  }

  /* --- kanat cam payı --- */
  if (kanatDisEn && kanatCamEn) {
    if (kanatCamEn >= kanatDisEn) {
      sonuc.uyarilar.push('Cam eni kanat dış eninden büyük olamaz.');
    } else {
      const v = (kanatDisEn - kanatCamEn) / 2;
      if (v < 15 || v > 120) {
        sonuc.uyarilar.push(
          `Kanat cam payı ${v.toFixed(1)} mm çıktı — beklenen aralık 15-120 mm. Camı mı kanadı mı ölçtüğünüzü kontrol edin.`
        );
      } else {
        sonuc.paylar.kanatCamPayi = Number(v.toFixed(1));
      }
    }
  } else {
    sonuc.eksik.push('Kanat dış eni ve kanat camı eni');
  }

  /* --- kanat cam payı (boy) — alt ray genelde daha geniştir --- */
  if (kanatDisBoy && kanatCamBoy) {
    if (kanatCamBoy >= kanatDisBoy) {
      sonuc.uyarilar.push('Cam boyu kanat dış boyundan büyük olamaz.');
    } else {
      const v = (kanatDisBoy - kanatCamBoy) / 2;
      if (v < 15 || v > 120) {
        sonuc.uyarilar.push(
          `Kanat cam payı (boy) ${v.toFixed(1)} mm çıktı — beklenen aralık 15-120 mm.`
        );
      } else {
        sonuc.paylar.kanatCamPayiBoy = Number(v.toFixed(1));
      }
    }
  }

  /* --- orta kayıt: doğrudan ölçülür --- */
  if (kayitOlcum) {
    if (kayitOlcum < 30 || kayitOlcum > 200) {
      sonuc.uyarilar.push(`Orta kayıt ${kayitOlcum} mm çıktı — beklenen aralık 30-200 mm.`);
    } else {
      sonuc.paylar.kayitGenisligi = Number(kayitOlcum.toFixed(1));
    }
  }

  /* --- sabit cam payı --- */
  if (sabitCamBoy && (kasaPayi || sonuc.paylar.kasaPayi)) {
    const kp = sonuc.paylar.kasaPayi ?? kasaPayi;
    const icYuk = disBoy - 2 * kp;
    const v = (icYuk - sabitCamBoy) / 2;
    if (v < 0 || v > 60) {
      sonuc.uyarilar.push(
        `Sabit cam payı ${v.toFixed(1)} mm çıktı — beklenen aralık 0-60 mm.`
      );
    } else {
      sonuc.paylar.sabitCamPayi = Number(v.toFixed(1));
    }
  }

  sonuc.gecerli = Object.keys(sonuc.paylar).length > 0;
  return sonuc;
}

/* ============================================================
   CAM TİPLERİ
   ============================================================ */
export const CAM_TIPLERI = [
  { id: 'buzlu_tek', ad: 'Buzlu Tek Cam', kisa: 'Buzlu' },
  { id: 'klasik', ad: 'Klasik Isıcam', kisa: 'Isıcam' },
  { id: 'konfor', ad: 'Konfor Cam', kisa: 'Konfor' },
  { id: 'lamina', ad: 'Lamina Cam', kisa: 'Lamina' },
];

/* ============================================================
   SİNEKLİK / PERDE ÜRÜN TİPLERİ
   ============================================================ */
export const SINEKLIK_TIPLERI = [
  { id: 'menteseliSineklik', ad: 'Menteşeli Sineklik', kisa: 'Menteşeli', renkVar: true },
  { id: 'surguluSineklik', ad: 'Sürgülü Sineklik', kisa: 'Sürgülü', renkVar: true },
  { id: 'plisePerde', ad: 'Plise Perde', kisa: 'Plise', renkVar: false },
];

/* bu tipte beyaz / renkli kademe seçilebilir mi? */
export const sineklikRenkVarMi = (tip) =>
  !!SINEKLIK_TIPLERI.find((s) => s.id === tip)?.renkVar;

/* ============================================================
   VARSAYILAN FİYATLAR
   Tüm profil fiyatları ₺/metre, cam ₺/m², aksesuar ₺/adet
   ============================================================ */
export const VARSAYILAN_FIYATLAR = {
  surum: FIYAT_TABLOSU_SURUMU,

  seriler: {
    beyaz: {
      ad: 'Beyaz Seri',
      kasa: 200,
      ortakayit: 200,
      pencereKanadi: 200,
      kapiKanadi: 220,
      surmeKasa: 230,
      surmeKanadi: 230,
      lambiri: 380,          // ₺/m²
    },
    renkli: {
      ad: 'Renkli Seri',
      kasa: 260,
      ortakayit: 260,
      pencereKanadi: 260,
      kapiKanadi: 280,
      surmeKasa: 290,
      surmeKanadi: 290,
      lambiri: 480,
    },
  },

  /* profil payları — firma kendi profiline göre düzeltebilir */
  profilPaylari: {
    60: { kasaPayi: 32, kayitGenisligi: 60, kanatCamPayi: 39, kanatCamPayiBoy: 50, sabitCamPayi: 5 },
    70: { kasaPayi: 35, kayitGenisligi: 65, kanatCamPayi: 42.5, kanatCamPayiBoy: 55, sabitCamPayi: 5 },
    80: { kasaPayi: 40, kayitGenisligi: 72, kanatCamPayi: 47, kanatCamPayiBoy: 61, sabitCamPayi: 5 },
  },

  camlar: {
    buzlu_tek: 550,
    klasik: 1100,
    konfor: 1800,
    lamina: 2400,
  },
  camIsciligi: 0,            // ₺/m² — cam takma / çıta işçiliği

  aksesuarlar: {
    tekAcilim: 400,
    ciftAcilim: 750,
    vasistas: 350,
    kapiAksesuar: 600,
    surmeAksesuar: 1000,
  },

  /* --- SİNEKLİK / PERDE ÜRÜNLERİ ---
     Üçü de aynı formülle fiyatlanır:
       çevre profili (m) + kumaş/tel (m²) + tepe sayısı × tepe başı + işçilik
     Tepe sayısı = boy ÷ tepe adımı
  */
  tepeAdimiMM: 20,           // kumaşın kıvrım adımı — firmaya göre değişir

  menteseliSineklik: {
    ad: 'Menteşeli Sineklik',
    cerceveM: 140,          // beyaz seri
    cerceveMRenkli: 185,    // renkli seri
    kumasM2: 280,
    tepeBasiBirim: 8,
    iscilik: 180,
  },
  surguluSineklik: {
    ad: 'Sürgülü Sineklik',
    cerceveM: 190,          // beyaz seri
    cerceveMRenkli: 245,    // renkli seri
    kumasM2: 300,
    tepeBasiBirim: 10,
    iscilik: 250,
  },
  plisePerde: {
    ad: 'Plise Perde',
    cerceveM: 160,
    kumasM2: 700,
    tepeBasiBirim: 12,
    iscilik: 200,
  },
};

/* ============================================================
   ESKİ TABLODAN DÖNÜŞTÜRME

   Sürüm 1 yapısı:
     { beyaz: {kasa, aluKasa, ...}, antrasit: {...}, altin_mese: {...} }

   Dönüşüm kuralı:
     beyaz          → beyaz kademesi
     antrasit       → renkli kademesi (daha yüksek olan tercih edilir)
     alüminyum      → tamamen atılır
     cam            → klasik ısıcam fiyatı olur, diğerleri oranlanır
   ============================================================ */
export function fiyatTablosunuDonustur(gelen) {
  // hiç veri yok → varsayılan
  if (!gelen || typeof gelen !== 'object' || Array.isArray(gelen)) {
    return yapiyiKopyala(VARSAYILAN_FIYATLAR);
  }

  // zaten sürüm 2 → eksik alanları varsayılanla tamamla
  if (Number(gelen.surum) >= 2) {
    return eksikleriTamamla(gelen);
  }

  // --- sürüm 1 → sürüm 2 ---
  const yeni = yapiyiKopyala(VARSAYILAN_FIYATLAR);
  const eskiBeyaz = gelen.beyaz || {};
  const eskiRenkli = gelen.antrasit || gelen.altin_mese || {};

  const say = (v, yedek) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : yedek;
  };

  yeni.seriler.beyaz = {
    ad: 'Beyaz Seri',
    kasa: say(eskiBeyaz.kasa, yeni.seriler.beyaz.kasa),
    ortakayit: say(eskiBeyaz.ortakayit, yeni.seriler.beyaz.ortakayit),
    pencereKanadi: say(eskiBeyaz.pencereKanadi, yeni.seriler.beyaz.pencereKanadi),
    kapiKanadi: say(eskiBeyaz.kapiKanadi, yeni.seriler.beyaz.kapiKanadi),
    surmeKasa: say(eskiBeyaz.surmeKasa, yeni.seriler.beyaz.surmeKasa),
    surmeKanadi: say(eskiBeyaz.surmeKanadi, yeni.seriler.beyaz.surmeKanadi),
    lambiri: say(eskiBeyaz.upvcLambiri, yeni.seriler.beyaz.lambiri),
  };

  yeni.seriler.renkli = {
    ad: 'Renkli Seri',
    kasa: say(eskiRenkli.kasa, yeni.seriler.renkli.kasa),
    ortakayit: say(eskiRenkli.ortakayit, yeni.seriler.renkli.ortakayit),
    pencereKanadi: say(eskiRenkli.pencereKanadi, yeni.seriler.renkli.pencereKanadi),
    kapiKanadi: say(eskiRenkli.kapiKanadi, yeni.seriler.renkli.kapiKanadi),
    surmeKasa: say(eskiRenkli.surmeKasa, yeni.seriler.renkli.surmeKasa),
    surmeKanadi: say(eskiRenkli.surmeKanadi, yeni.seriler.renkli.surmeKanadi),
    lambiri: say(eskiRenkli.upvcLambiri, yeni.seriler.renkli.lambiri),
  };

  // eski tek "cam" alanı klasik ısıcam sayılır
  const eskiCam = say(eskiBeyaz.cam, 0);
  if (eskiCam > 0) {
    yeni.camlar.klasik = eskiCam;
    yeni.camlar.buzlu_tek = Math.round(eskiCam * 0.5);
    yeni.camlar.konfor = Math.round(eskiCam * 1.65);
    yeni.camlar.lamina = Math.round(eskiCam * 2.2);
  }
  yeni.camIsciligi = say(eskiBeyaz.camIci, 0) || 0;

  yeni.aksesuarlar = {
    tekAcilim: say(eskiBeyaz.tekAcilim, yeni.aksesuarlar.tekAcilim),
    ciftAcilim: say(eskiBeyaz.ciftAcilim, yeni.aksesuarlar.ciftAcilim),
    vasistas: say(eskiBeyaz.vasistas, yeni.aksesuarlar.vasistas),
    kapiAksesuar: say(eskiBeyaz.kapiAksesuar, yeni.aksesuarlar.kapiAksesuar),
    surmeAksesuar: say(eskiBeyaz.surmeAksesuar, yeni.aksesuarlar.surmeAksesuar),
  };

  // eski m² bazlı sineklik/perde fiyatları → tel/kumaş m² fiyatı olur
  const eskiSineklikAdet = say(eskiBeyaz.sineklik, 0);
  if (eskiSineklikAdet > 0) yeni.menteseliSineklik.iscilik = eskiSineklikAdet;
  const eskiPerde = say(eskiBeyaz.plisePerdeM2, 0);
  if (eskiPerde > 0) yeni.plisePerde.kumasM2 = eskiPerde;
  const eskiSurgulu = say(eskiBeyaz.surguluSineklikM2, 0);
  if (eskiSurgulu > 0) yeni.surguluSineklik.kumasM2 = eskiSurgulu;

  yeni.surum = FIYAT_TABLOSU_SURUMU;
  return yeni;
}

/* eksik alanları varsayılandan tamamla — sessizce 0 olmasın */
function eksikleriTamamla(gelen) {
  const v = yapiyiKopyala(VARSAYILAN_FIYATLAR);
  const birlestir = (hedef, kaynak) => {
    if (!kaynak || typeof kaynak !== 'object') return hedef;
    Object.keys(hedef).forEach((k) => {
      const gv = kaynak[k];
      if (gv && typeof gv === 'object' && !Array.isArray(gv)) {
        hedef[k] = birlestir(hedef[k], gv);
      } else if (typeof hedef[k] === 'number') {
        const n = Number(gv);
        if (Number.isFinite(n) && n >= 0) hedef[k] = n;
      } else if (typeof hedef[k] === 'string' && typeof gv === 'string') {
        hedef[k] = gv;
      }
    });
    return hedef;
  };
  const sonuc = birlestir(v, gelen);
  sonuc.surum = FIYAT_TABLOSU_SURUMU;
  return sonuc;
}

function yapiyiKopyala(o) {
  return JSON.parse(JSON.stringify(o));
}

/* ============================================================
   SAĞLIK KONTROLÜ
   Fiyat tablosunda sıfır veya saçma değer var mı?
   Sıfır fiyatlı teklif göndermek en kötü senaryodur.
   ============================================================ */
export function fiyatTablosuUyarilari(tablo) {
  const uyarilar = [];
  if (!tablo) return ['Fiyat tablosu yüklenemedi.'];

  ['beyaz', 'renkli'].forEach((k) => {
    const s = tablo.seriler?.[k];
    if (!s) { uyarilar.push(`${k} serisi tanımlı değil.`); return; }
    Object.entries(s).forEach(([alan, deger]) => {
      if (alan === 'ad') return;
      const n = Number(deger);
      if (!Number.isFinite(n) || n <= 0) {
        uyarilar.push(`${s.ad || k}: "${alan}" fiyatı girilmemiş.`);
      } else if (n > 20000) {
        uyarilar.push(`${s.ad || k}: "${alan}" fiyatı çok yüksek görünüyor (${n} ₺).`);
      }
    });
  });

  CAM_TIPLERI.forEach((c) => {
    const n = Number(tablo.camlar?.[c.id]);
    if (!Number.isFinite(n) || n <= 0) uyarilar.push(`${c.ad} m² fiyatı girilmemiş.`);
    else if (n > 30000) uyarilar.push(`${c.ad} fiyatı çok yüksek görünüyor (${n} ₺).`);
  });

  ['menteseliSineklik', 'surguluSineklik', 'plisePerde'].forEach((k) => {
    const u = tablo[k];
    if (!u) { uyarilar.push(`${k} fiyatlari tanimli degil.`); return; }
    ['cerceveM', 'kumasM2', 'iscilik'].forEach((alan) => {
      const n = Number(u[alan]);
      if (!Number.isFinite(n) || n < 0) uyarilar.push(`${u.ad || k}: "${alan}" fiyati girilmemis.`);
    });
  });

  const adim = Number(tablo.tepeAdimiMM);
  if (!Number.isFinite(adim) || adim < 5 || adim > 100) {
    uyarilar.push('Tepe adimi gecersiz (5-100 mm arasi olmali).');
  }

  return uyarilar;
}