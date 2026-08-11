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