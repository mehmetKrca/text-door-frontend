/**
 * eWindoore — Patron Özeti Toplama
 *
 * Arşivdeki tekliflerden gerçek tüketim ve ciro kırılımı çıkarır.
 *
 * YÖNTEM: Arşivde metraj saklanmıyor, yalnızca ölçüler saklanıyor.
 * Bu yüzden her kalem için fiyat motoru YENİDEN çalıştırılır. Böylece
 * rapor her zaman güncel hesap mantığıyla tutarlı olur — motoru
 * düzeltirsek geçmiş rapor da düzelir.
 *
 * ESKİ KAYITLAR: Yeni alanları içermeyen kayıtlar en yakın karşılığına
 * çevrilir (standart/sinerji cam → klasik ısıcam, antrasit → renkli seri,
 * plise_perde → plisePerde). Hiçbir kayıt rapordan düşmez.
 */

import { hesapla, hesaplaSineklik } from './fiyatHesapla.js';
import { CAM_TIPLERI, SINEKLIK_TIPLERI } from './fiyatTablosu.js';

/* ---------- eski → yeni eşleştirmeleri ---------- */

const CAM_ESKI_YENI = {
  standart: 'klasik',
  sinerji: 'klasik',
  klasik: 'klasik',
  konfor: 'konfor',
  lamina: 'lamina',
  buzlu_tek: 'buzlu_tek',
};

const SP_ESKI_YENI = {
  plise_perde: 'plisePerde',
  surgulu_sineklik: 'surguluSineklik',
  plisePerde: 'plisePerde',
  surguluSineklik: 'surguluSineklik',
  menteseliSineklik: 'menteseliSineklik',
};

const SP_TIP_IDLERI = Object.keys(SP_ESKI_YENI);

const RENK_KADEMESI = {
  beyaz: 'beyaz',
  antrasit: 'renkli',
  altin_mese: 'renkli',
  renkli: 'renkli',
};

export const sineklikMi = (urunTipi) => SP_TIP_IDLERI.includes(urunTipi);

/* ---------- tarih ---------- */

/** "gg.aa.yyyy" veya ISO biçimini Date'e çevirir */
export function tarihiCoz(deger) {
  if (!deger) return null;
  if (deger instanceof Date) return Number.isNaN(deger.getTime()) ? null : deger;

  const metin = String(deger).trim();

  // gg.aa.yyyy veya gg/aa/yyyy
  const tr = metin.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (tr) {
    const d = new Date(Number(tr[3]), Number(tr[2]) - 1, Number(tr[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(metin);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** aralik: 'ay' | 'yil' | 'tum' */
export function tarihAralikta(tarih, aralik, bugun = new Date()) {
  if (aralik === 'tum') return true;
  const d = tarihiCoz(tarih);
  if (!d) return false;   // tarihi okunamayan kayıt dönemsel rapora girmez
  if (aralik === 'yil') return d.getFullYear() === bugun.getFullYear();
  if (aralik === 'ay') {
    return d.getFullYear() === bugun.getFullYear() && d.getMonth() === bugun.getMonth();
  }
  return true;
}

/* ---------- kalem normalize ---------- */

/** Arşivdeki bir kalemi güncel şemaya çevirir. */
export function kalemiNormalize(kalem) {
  const k = kalem || {};
  const hamTip = k.urunTipi || 'pencere';

  if (sineklikMi(hamTip)) {
    return {
      kategori: 'sineklik',
      tip: SP_ESKI_YENI[hamTip] || 'menteseliSineklik',
      genislik: Number(k.genislik) || 0,
      yukseklik: Number(k.yukseklik) || 0,
      adet: Math.max(1, Number(k.adet) || 1),
      acilimYonu: k.acilimYonu === 'yatay' ? 'yatay' : 'dikey',
      renkKademesi: RENK_KADEMESI[k.renkKademesi] || RENK_KADEMESI[k.renk] || 'beyaz',
      fiyat: Number(k.fiyat) || 0,
      isim: k.isim || '',
    };
  }

  const camTipi = CAM_ESKI_YENI[k.camTipi] || 'klasik';
  const renk = ['beyaz', 'antrasit', 'altin_mese'].includes(k.renk) ? k.renk : 'beyaz';

  return {
    kategori: 'dograma',
    urunTipi: hamTip,
    genislik: Number(k.genislik) || 0,
    yukseklik: Number(k.yukseklik) || 0,
    sagYukseklik: Number(k.sagYukseklik) || Number(k.yukseklik) || 0,
    bolmeSayisi: Math.max(1, Number(k.bolmeSayisi) || 1),
    bolmeOlculeri: Array.isArray(k.bolmeOlculeri) ? k.bolmeOlculeri : [],
    kanatlar: Array.isArray(k.kanatlar) && k.kanatlar.length ? k.kanatlar : ['sabit'],
    renk,
    kademe: RENK_KADEMESI[renk] || 'beyaz',
    camTipi,
    profilSerisi: Number(k.profilSerisi) || 70,
    lambiriVar: !!k.altPanelLambiri,
    lambiriBoyu: Number(k.lambiriBoyu) || 900,
    enineBolmeVar: !!k.enineBolmeVar,
    enineBolmeYerdenYukseklik: Number(k.enineBolmeYerdenYukseklik) || 900,
    adet: Math.max(1, Number(k.adet) || 1),
    fiyat: Number(k.fiyat) || 0,
    isim: k.isim || '',
  };
}

/* ---------- ana toplama ---------- */

export function patronOzetiHesapla(arsiv, fiyatTablo, secenekler = {}) {
  const aralik = ['ay', 'yil', 'tum'].includes(secenekler.aralik) ? secenekler.aralik : 'tum';
  const bugun = secenekler.bugun instanceof Date ? secenekler.bugun : new Date();

  const bosSeri = () => ({ metre: 0, kalemAdet: 0 });
  const bosCam = () => ({ m2: 0, kalemAdet: 0 });
  const bosSineklik = () => ({ adet: 0, cerceveM: 0, kumasM2: 0, tepeSayisi: 0, ciro: 0 });

  const ozet = {
    aralik,
    projeSayisi: 0,
    kalemSayisi: 0,
    toplamAdet: 0,
    ciro: 0,
    ciroDograma: 0,
    ciroSineklik: 0,

    profil: {
      beyaz: bosSeri(),
      renkli: bosSeri(),
      toplamMetre: 0,
    },

    camlar: CAM_TIPLERI.reduce((a, c) => { a[c.id] = bosCam(); return a; }, {}),
    camToplamM2: 0,

    lambiri: { m2: 0, kalemAdet: 0 },

    sineklikler: SINEKLIK_TIPLERI.reduce((a, s) => { a[s.id] = bosSineklik(); return a; }, {}),
    sineklikToplamAdet: 0,
    tepeToplam: 0,

    urunTipleri: {},
    durumlar: {},
    atlanan: 0,
  };

  const liste = Array.isArray(arsiv) ? arsiv : [];

  liste.forEach((proje) => {
    if (!proje) return;
    if (!tarihAralikta(proje.teklifTarihi, aralik, bugun)) return;

    ozet.projeSayisi += 1;

    const durum = proje.durum || 'teklif';
    ozet.durumlar[durum] = (ozet.durumlar[durum] || 0) + 1;

    const kalemler = Array.isArray(proje.sepet) ? proje.sepet : [];

    kalemler.forEach((hamKalem) => {
      let k;
      try {
        k = kalemiNormalize(hamKalem);
      } catch {
        ozet.atlanan += 1;
        return;
      }

      ozet.kalemSayisi += 1;
      ozet.toplamAdet += k.adet;
      ozet.ciro += k.fiyat;

      /* ---------- SİNEKLİK / PERDE ---------- */
      if (k.kategori === 'sineklik') {
        ozet.ciroSineklik += k.fiyat;
        const s = hesaplaSineklik({
          tip: k.tip,
          genislik: k.genislik,
          yukseklik: k.yukseklik,
          adet: k.adet,
          acilimYonu: k.acilimYonu,
          renkKademesi: k.renkKademesi,
        }, fiyatTablo);

        const hedef = ozet.sineklikler[k.tip];
        if (hedef && s && s.metraj) {
          hedef.adet += k.adet;
          hedef.cerceveM += s.metraj.cerceveMAdetli || 0;
          hedef.kumasM2 += s.metraj.kumasM2Adetli || 0;
          hedef.tepeSayisi += s.tepeSayisiToplam || 0;
          hedef.ciro += k.fiyat;

          ozet.sineklikToplamAdet += k.adet;
          ozet.tepeToplam += s.tepeSayisiToplam || 0;
        } else {
          ozet.atlanan += 1;
        }

        const t = ozet.urunTipleri[k.tip] || { adet: 0, ciro: 0 };
        t.adet += k.adet;
        t.ciro += k.fiyat;
        ozet.urunTipleri[k.tip] = t;
        return;
      }

      /* ---------- DOĞRAMA ---------- */
      ozet.ciroDograma += k.fiyat;

      const s = hesapla({
        urunTipi: k.urunTipi,
        genislik: k.genislik,
        yukseklik: k.yukseklik,
        sagYukseklik: k.sagYukseklik,
        bolmeSayisi: k.bolmeSayisi,
        bolmeOlculeri: k.bolmeOlculeri,
        kanatlar: k.kanatlar,
        renk: k.renk,
        camTipi: k.camTipi,
        profilSerisi: k.profilSerisi,
        lambiriVar: k.lambiriVar,
        lambiriBoyu: k.lambiriBoyu,
        enineBolmeVar: k.enineBolmeVar,
        enineBolmeYerdenYukseklik: k.enineBolmeYerdenYukseklik,
        adet: k.adet,
      }, fiyatTablo);

      if (!s || !s.gecerli || !s.metraj) {
        ozet.atlanan += 1;
        return;
      }

      // profil metresi — fiyat kademesine göre
      const seri = ozet.profil[k.kademe] || ozet.profil.beyaz;
      seri.metre += s.metraj.toplamProfilMAdetli || 0;
      seri.kalemAdet += k.adet;
      ozet.profil.toplamMetre += s.metraj.toplamProfilMAdetli || 0;

      // cam m² — cam tipine göre
      const cam = ozet.camlar[k.camTipi] || ozet.camlar.klasik;
      cam.m2 += s.metraj.camM2Adetli || 0;
      cam.kalemAdet += k.adet;
      ozet.camToplamM2 += s.metraj.camM2Adetli || 0;

      // lambiri
      if ((s.metraj.lambiriM2Adetli || 0) > 0) {
        ozet.lambiri.m2 += s.metraj.lambiriM2Adetli;
        ozet.lambiri.kalemAdet += k.adet;
      }

      const t = ozet.urunTipleri[k.urunTipi] || { adet: 0, ciro: 0 };
      t.adet += k.adet;
      t.ciro += k.fiyat;
      ozet.urunTipleri[k.urunTipi] = t;
    });
  });

  /* ---------- yuvarlama ---------- */
  const y2 = (n) => Number((n || 0).toFixed(2));
  const y3 = (n) => Number((n || 0).toFixed(3));

  ozet.profil.beyaz.metre = y2(ozet.profil.beyaz.metre);
  ozet.profil.renkli.metre = y2(ozet.profil.renkli.metre);
  ozet.profil.toplamMetre = y2(ozet.profil.toplamMetre);

  Object.values(ozet.camlar).forEach((c) => { c.m2 = y3(c.m2); });
  ozet.camToplamM2 = y3(ozet.camToplamM2);
  ozet.lambiri.m2 = y3(ozet.lambiri.m2);

  Object.values(ozet.sineklikler).forEach((s) => {
    s.cerceveM = y2(s.cerceveM);
    s.kumasM2 = y3(s.kumasM2);
    s.ciro = Math.round(s.ciro);
  });

  ozet.ciro = Math.round(ozet.ciro);
  ozet.ciroDograma = Math.round(ozet.ciroDograma);
  ozet.ciroSineklik = Math.round(ozet.ciroSineklik);
  Object.values(ozet.urunTipleri).forEach((t) => { t.ciro = Math.round(t.ciro); });

  return ozet;
}

/* ---------- görüntüleme yardımcıları ---------- */

export const ARALIK_ADLARI = {
  ay: 'Bu Ay',
  yil: 'Bu Yıl',
  tum: 'Tüm Zamanlar',
};

export const URUN_ADLARI = {
  pencere: 'Pencere',
  kapi: 'Kapı',
  wc_kapi: 'WC / Banyo Kapısı',
  balkonkapi: 'Balkon Kapısı',
  fransiz: 'Fransız Balkon',
  surgulu: 'Sürgülü Sistem',
  acili: 'Açılı Pencere',
  menteseliSineklik: 'Menteşeli Sineklik',
  surguluSineklik: 'Sürgülü Sineklik',
  plisePerde: 'Plise Perde',
};

export const DURUM_ADLARI = {
  teklif: 'Teklif Aşamasında',
  kapora: 'Kapora Alındı',
  olcu: 'Ölçü Bekleniyor',
  imalat: 'İmalatta',
  montaj: 'Montaja Hazır',
  tamamlandi: 'Tamamlandı',
};