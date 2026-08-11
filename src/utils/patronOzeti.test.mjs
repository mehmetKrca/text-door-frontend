/**
 * eWindoore — Patron Özeti Testleri
 * Çalıştırmak için: node src/utils/patronOzeti.test.mjs
 */

import {
  patronOzetiHesapla,
  kalemiNormalize,
  tarihiCoz,
  tarihAralikta,
  sineklikMi,
} from './patronOzeti.js';
import { VARSAYILAN_FIYATLAR } from './fiyatTablosu.js';

let gecen = 0;
let kalan = 0;

const esit = (ad, bulunan, beklenen, tol = 0) => {
  const ok = Math.abs(Number(bulunan) - Number(beklenen)) <= tol;
  if (ok) { gecen++; console.log(`  ✓ ${ad}`); }
  else { kalan++; console.log(`  ✗ ${ad}\n      beklenen: ${beklenen}\n      bulunan : ${bulunan}`); }
};
const dogru = (ad, k) => {
  if (k) { gecen++; console.log(`  ✓ ${ad}`); }
  else { kalan++; console.log(`  ✗ ${ad}`); }
};

const T = VARSAYILAN_FIYATLAR;
const BUGUN = new Date(2026, 7, 15);   // 15 Ağustos 2026

/* ============================================================ */
console.log('\nTEST 1 — tarih çözümleme');
{
  esit('gg.aa.yyyy → yıl', tarihiCoz('15.08.2026')?.getFullYear(), 2026);
  esit('gg.aa.yyyy → ay', tarihiCoz('15.08.2026')?.getMonth(), 7);
  esit('gg.aa.yyyy → gün', tarihiCoz('15.08.2026')?.getDate(), 15);
  esit('gg/aa/yyyy da olur', tarihiCoz('01/03/2025')?.getMonth(), 2);
  dogru('ISO biçimi çalışır', tarihiCoz('2026-08-15') instanceof Date);
  dogru('boş değer null', tarihiCoz('') === null);
  dogru('saçma değer null', tarihiCoz('abc') === null);
  dogru('undefined null', tarihiCoz(undefined) === null);
}

console.log('\nTEST 2 — aralık filtresi');
{
  dogru('bu ay içinde', tarihAralikta('10.08.2026', 'ay', BUGUN) === true);
  dogru('geçen ay dışında', tarihAralikta('10.07.2026', 'ay', BUGUN) === false);
  dogru('bu yıl içinde', tarihAralikta('10.02.2026', 'yil', BUGUN) === true);
  dogru('geçen yıl dışında', tarihAralikta('10.02.2025', 'yil', BUGUN) === false);
  dogru('tüm zamanlar hepsini alır', tarihAralikta('10.02.2019', 'tum', BUGUN) === true);
  dogru('tarihsiz kayıt tüm zamanlara girer', tarihAralikta(null, 'tum', BUGUN) === true);
  dogru('tarihsiz kayıt bu aya girmez', tarihAralikta(null, 'ay', BUGUN) === false);
}

console.log('\nTEST 3 — eski kalem dönüştürme');
{
  const eskiPencere = kalemiNormalize({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
    bolmeSayisi: 2, kanatlar: ['sabit', 'sag'],
    renk: 'antrasit', camTipi: 'standart', profilSerisi: 70, adet: 3, fiyat: 12000,
  });
  esit('standart cam → klasik', eskiPencere.camTipi === 'klasik' ? 1 : 0, 1);
  esit('antrasit → renkli kademe', eskiPencere.kademe === 'renkli' ? 1 : 0, 1);
  esit('adet korunur', eskiPencere.adet, 3);
  esit('kategori doğrama', eskiPencere.kategori === 'dograma' ? 1 : 0, 1);

  const sinerji = kalemiNormalize({ urunTipi: 'pencere', camTipi: 'sinerji' });
  esit('sinerji cam → klasik', sinerji.camTipi === 'klasik' ? 1 : 0, 1);

  const eskiPerde = kalemiNormalize({
    urunTipi: 'plise_perde', genislik: 700, yukseklik: 2000, adet: 2, fiyat: 6000,
  });
  esit('plise_perde → plisePerde', eskiPerde.tip === 'plisePerde' ? 1 : 0, 1);
  esit('kategori sineklik', eskiPerde.kategori === 'sineklik' ? 1 : 0, 1);
  esit('varsayılan yön dikey', eskiPerde.acilimYonu === 'dikey' ? 1 : 0, 1);

  const eskiSurgulu = kalemiNormalize({ urunTipi: 'surgulu_sineklik', genislik: 800, yukseklik: 1500 });
  esit('surgulu_sineklik → surguluSineklik', eskiSurgulu.tip === 'surguluSineklik' ? 1 : 0, 1);

  dogru('sineklikMi doğru', sineklikMi('plise_perde') && sineklikMi('menteseliSineklik'));
  dogru('sineklikMi pencerede false', sineklikMi('pencere') === false);

  // bozuk kalem patlatmamalı
  const bos = kalemiNormalize({});
  dogru('boş kalem varsayılana düşer', bos.urunTipi === 'pencere' && bos.camTipi === 'klasik');
  const nul = kalemiNormalize(null);
  dogru('null kalem patlamaz', nul.kategori === 'dograma');
}

/* ============================================================
   TEST 4 — GERÇEK ARŞİVLE TOPLAMA
   ============================================================
   İki proje:
   A) 15.08.2026 — beyaz pencere (2 adet, klasik cam) + plise perde (1)
   B) 10.03.2026 — antrasit pencere (1 adet, konfor cam)
*/
const ARSIV = [
  {
    id: 1, projeAdi: 'Yılmaz Apartmanı', teklifTarihi: '15.08.2026', durum: 'imalat',
    sepet: [
      {
        isim: 'Mutfak', urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
        bolmeSayisi: 2, kanatlar: ['sabit', 'sag'], bolmeOlculeri: [0, 0],
        renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 2, fiyat: 9000,
      },
      {
        isim: 'Salon Perde', urunTipi: 'plisePerde', genislik: 700, yukseklik: 2000,
        adet: 1, acilimYonu: 'dikey', renkKademesi: 'beyaz', fiyat: 4000,
      },
    ],
  },
  {
    id: 2, projeAdi: 'Demir Villa', teklifTarihi: '10.03.2026', durum: 'teklif',
    sepet: [
      {
        isim: 'Yatak Odası', urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
        bolmeSayisi: 2, kanatlar: ['sabit', 'sag'], bolmeOlculeri: [0, 0],
        renk: 'antrasit', camTipi: 'konfor', profilSerisi: 70, adet: 1, fiyat: 7000,
      },
    ],
  },
];

console.log('\nTEST 4 — bu ay');
{
  const o = patronOzetiHesapla(ARSIV, T, { aralik: 'ay', bugun: BUGUN });

  esit('1 proje', o.projeSayisi, 1);
  esit('2 kalem', o.kalemSayisi, 2);
  esit('toplam adet 3', o.toplamAdet, 3);
  esit('ciro 13.000 ₺', o.ciro, 13000);
  esit('doğrama cirosu 9.000 ₺', o.ciroDograma, 9000);
  esit('sineklik cirosu 4.000 ₺', o.ciroSineklik, 4000);

  // 1500×1200 tek kalemin profil metrajı: kasa 6,048 + dikme 1,187 + kanat 3,819 = 11,054
  // 2 adet → 22,108 m
  esit('beyaz seri profil ~22,11 m', o.profil.beyaz.metre, 22.11, 0.05);
  esit('renkli seri 0 m', o.profil.renkli.metre, 0);

  // cam 1,095 m² × 2 adet = 2,19
  esit('klasik cam ~2,19 m²', o.camlar.klasik.m2, 2.19, 0.01);
  esit('konfor cam 0', o.camlar.konfor.m2, 0);

  esit('plise adet 1', o.sineklikler.plisePerde.adet, 1);
  esit('plise tepe 100', o.sineklikler.plisePerde.tepeSayisi, 100);
  esit('plise çerçeve 5,4 m', o.sineklikler.plisePerde.cerceveM, 5.4, 0.01);
  esit('menteşeli 0', o.sineklikler.menteseliSineklik.adet, 0);

  esit('durum imalat 1', o.durumlar.imalat, 1);
  esit('atlanan yok', o.atlanan, 0);
}

console.log('\nTEST 5 — bu yıl (iki proje birleşir)');
{
  const o = patronOzetiHesapla(ARSIV, T, { aralik: 'yil', bugun: BUGUN });

  esit('2 proje', o.projeSayisi, 2);
  esit('3 kalem', o.kalemSayisi, 3);
  esit('toplam adet 4', o.toplamAdet, 4);
  esit('ciro 20.000 ₺', o.ciro, 20000);

  esit('beyaz profil ~22,11 m', o.profil.beyaz.metre, 22.11, 0.05);
  esit('renkli profil ~11,05 m', o.profil.renkli.metre, 11.05, 0.05);
  esit('toplam profil ~33,16 m', o.profil.toplamMetre, 33.16, 0.1);

  esit('klasik cam ~2,19 m²', o.camlar.klasik.m2, 2.19, 0.01);
  esit('konfor cam ~1,095 m²', o.camlar.konfor.m2, 1.095, 0.01);
  esit('cam toplam ~3,285 m²', o.camToplamM2, 3.285, 0.02);

  esit('pencere adet 3', o.urunTipleri.pencere.adet, 3);
  esit('pencere ciro 16.000 ₺', o.urunTipleri.pencere.ciro, 16000);
  esit('atlanan yok', o.atlanan, 0);
}

console.log('\nTEST 6 — eski şemalı arşiv de raporlanır');
{
  const eskiArsiv = [{
    id: 9, projeAdi: 'Eski Proje', teklifTarihi: '05.08.2026', durum: 'teklif',
    sepet: [
      {
        isim: 'Eski Pencere', urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
        bolmeSayisi: 2, kanatlar: ['sabit', 'sag'],
        renk: 'antrasit', camTipi: 'standart',   // eski değerler
        malzeme: 'aluminyum',                     // artık yok, yok sayılmalı
        profilSerisi: 70, adet: 1, fiyat: 8000,
      },
      {
        isim: 'Eski Perde', urunTipi: 'plise_perde',   // eski id
        genislik: 700, yukseklik: 2000, adet: 1, fiyat: 3500,
        renk: 'Standart',
      },
    ],
  }];

  const o = patronOzetiHesapla(eskiArsiv, T, { aralik: 'ay', bugun: BUGUN });

  esit('eski kayıt rapora girdi', o.kalemSayisi, 2);
  esit('hiçbir kalem atlanmadı', o.atlanan, 0);
  esit('standart cam klasiğe sayıldı', o.camlar.klasik.m2 > 0 ? 1 : 0, 1);
  esit('antrasit renkli seriye sayıldı', o.profil.renkli.metre > 0 ? 1 : 0, 1);
  esit('beyaz seri boş', o.profil.beyaz.metre, 0);
  esit('eski plise tanındı', o.sineklikler.plisePerde.adet, 1);
  esit('ciro 11.500 ₺', o.ciro, 11500);
}

console.log('\nTEST 7 — bozuk veri dayanıklılığı');
{
  const senaryolar = [
    { ad: 'null arşiv', a: null },
    { ad: 'boş dizi', a: [] },
    { ad: 'sepeti olmayan proje', a: [{ id: 1, teklifTarihi: '15.08.2026' }] },
    { ad: 'sepeti null', a: [{ id: 1, teklifTarihi: '15.08.2026', sepet: null }] },
    { ad: 'boş kalem', a: [{ id: 1, teklifTarihi: '15.08.2026', sepet: [{}] }] },
    { ad: 'null kalem', a: [{ id: 1, teklifTarihi: '15.08.2026', sepet: [null] }] },
    { ad: 'metin ölçü', a: [{ id: 1, teklifTarihi: '15.08.2026', sepet: [{ urunTipi: 'pencere', genislik: 'abc', yukseklik: 'x' }] }] },
    { ad: 'dizi olmayan arşiv', a: { bozuk: true } },
    { ad: 'tarihsiz proje', a: [{ id: 1, sepet: [] }] },
  ];

  senaryolar.forEach(({ ad, a }) => {
    let o;
    try { o = patronOzetiHesapla(a, T, { aralik: 'tum', bugun: BUGUN }); }
    catch (e) { kalan++; console.log(`  ✗ ${ad} — HATA: ${e.message}`); return; }
    const saglam =
      Number.isFinite(o.ciro) && o.ciro >= 0 &&
      Number.isFinite(o.profil.toplamMetre) && o.profil.toplamMetre >= 0 &&
      Number.isFinite(o.camToplamM2) && o.camToplamM2 >= 0;
    dogru(`${ad} → sağlam sonuç`, saglam);
  });

  // fiyat tablosu yoksa da çökmemeli
  let o;
  try {
    o = patronOzetiHesapla(ARSIV, null, { aralik: 'tum', bugun: BUGUN });
    dogru('fiyat tablosu null → çökmez', Number.isFinite(o.ciro));
  } catch (e) {
    kalan++; console.log(`  ✗ fiyat tablosu null — HATA: ${e.message}`);
  }
}

console.log('\nTEST 8 — adet çarpanı metraja yansıyor');
{
  const tek = patronOzetiHesapla([{
    id: 1, teklifTarihi: '15.08.2026',
    sepet: [{ urunTipi: 'pencere', genislik: 1500, yukseklik: 1200, bolmeSayisi: 1,
      kanatlar: ['sabit'], renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 1, fiyat: 1000 }],
  }], T, { aralik: 'tum', bugun: BUGUN });

  const on = patronOzetiHesapla([{
    id: 1, teklifTarihi: '15.08.2026',
    sepet: [{ urunTipi: 'pencere', genislik: 1500, yukseklik: 1200, bolmeSayisi: 1,
      kanatlar: ['sabit'], renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 10, fiyat: 10000 }],
  }], T, { aralik: 'tum', bugun: BUGUN });

  esit('10 adet profil = 10 × tek', on.profil.beyaz.metre, tek.profil.beyaz.metre * 10, 0.05);
  esit('10 adet cam = 10 × tek', on.camlar.klasik.m2, tek.camlar.klasik.m2 * 10, 0.02);
  esit('toplam adet 10', on.toplamAdet, 10);
}

/* ============================================================ */
console.log('\n' + '='.repeat(52));
console.log(`  GEÇEN: ${gecen}    KALAN: ${kalan}`);
console.log('='.repeat(52) + '\n');
if (kalan > 0) process.exit(1);
