/**
 * eWindoore — Fiyat Hesabı Testleri
 *
 * Çalıştırmak için:  node src/utils/fiyatHesapla.test.mjs
 *
 * Buradaki beklenen değerler ELLE HESAPLANMIŞTIR.
 * Bir test kırmızı yanarsa ya hesap bozulmuştur ya da bilinçli
 * bir değişiklik yapılmıştır — o zaman beklenen değer güncellenir.
 * Fiyatın doğruluğunun tek gerçek güvencesi budur.
 */

import { hesapla, hesaplaSineklik } from './fiyatHesapla.js';
import {
  VARSAYILAN_FIYATLAR,
  profilPaylariAl,
  seriNoDuzelt,
  PROFIL_SERILERI,
  fiyatTablosunuDonustur,
  fiyatTablosuUyarilari,
  sineklikRenkVarMi,
} from './fiyatTablosu.js';

let gecen = 0;
let kalan = 0;

function esit(ad, bulunan, beklenen, tolerans = 0) {
  const ok = Math.abs(Number(bulunan) - Number(beklenen)) <= tolerans;
  if (ok) { gecen++; console.log(`  ✓ ${ad}`); }
  else { kalan++; console.log(`  ✗ ${ad}\n      beklenen: ${beklenen}\n      bulunan : ${bulunan}`); }
}

function dogru(ad, kosul) {
  if (kosul) { gecen++; console.log(`  ✓ ${ad}`); }
  else { kalan++; console.log(`  ✗ ${ad}`); }
}

const T = VARSAYILAN_FIYATLAR;

/* ============================================================
   TEST 1 — 1500 × 1200, 2 bölme, biri sabit biri sağa açılır
   ============================================================

   p = 70 mm, beyaz seri
   icGen = 1500 - 140 = 1360
   dikme = 1 adet × 70 mm  →  net bölme toplamı = 1360 - 70 = 1290
   her bölme = 645 mm
   icYuk = 1200 - 140 = 1060

   Kasa   : (1500+1200)×2 / 1000 = 5,4 m × 1,12 = 6,048 m × 200 = 1.209,60
   Dikme  : (1 × 1060)/1000 = 1,06 m × 1,12 = 1,1872 m × 200 =    237,44
   Kanat  : 2×(645+1060)/1000 = 3,41 m × 1,12 = 3,8192 m × 200 = 763,84
   Cam    : sabit  → (645-32) × (1060-32) = 613 × 1028 = 0,630164 m²
            açılır → (645-140) × (1060-140) = 505 × 920 = 0,4646 m²
            toplam = 1,094764 m² × 1100 = 1.204,24
   Aksesuar: tek açılım = 400
   ------------------------------------------------
   Ham maliyet ≈ 1209,60 + 237,44 + 763,84 + 1204,24 + 400 = 3.815,12
*/
console.log('\nTEST 1 — 1500×1200 pencere, 2 bölme (sabit + sağa açılır)');
{
  const s = hesapla({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
    bolmeSayisi: 2, kanatlar: ['sabit', 'sag'],
    renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 1,
  }, T);

  esit('bölme genişliği 650 mm', s.olculer.bolmeGenislikleri[0], 650, 1);
  esit('kasa metrajı 6,048 m', s.metraj.kasaM, 6.048, 0.002);
  esit('kanat metrajı 3,875 m', s.metraj.kanatM, 3.875, 0.005);
  esit('cam alanı 1,134 m²', s.metraj.camM2, 1.134, 0.005);
  esit('profil maliyeti 2.227 ₺', s.maliyet.profil, 2227, 3);
  esit('cam maliyeti 1.248 ₺', s.maliyet.cam, 1248, 3);
  esit('aksesuar 400 ₺', s.maliyet.aksesuar, 400);
  esit('ham maliyet 3.874 ₺', s.maliyet.ham, 3874, 4);
  dogru('uyarı yok', s.uyarilar.length === 0);

  // KRİTİK: açılan kanadın cam ölçüsü kanat profilini de düşmeli
  const acilanCam = s.metraj.camParcalari.find((c) => c.bolme === 2);
  esit('açılan kanat cam eni 535 mm', acilanCam.en, 535, 1);
  esit('açılan kanat cam boyu 965 mm', acilanCam.boy, 965, 1);
}

/* ============================================================
   TEST 2 — ADET ÇARPANI (eski kodda yoktu)
   ============================================================ */
console.log('\nTEST 2 — adet çarpanı');
{
  const tek = hesapla({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
    bolmeSayisi: 2, kanatlar: ['sabit', 'sag'],
    renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 1,
  }, T);

  const bes = hesapla({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
    bolmeSayisi: 2, kanatlar: ['sabit', 'sag'],
    renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 5,
  }, T);

  esit('5 adet maliyeti = 5 × tek', bes.maliyet.ham, tek.maliyet.ham * 5, 5);
  esit('birim fiyat korunuyor', bes.teklifDetay.birimFiyat, tek.teklifDetay.toplam, 2);
  esit('5 adet cam m² = 5 × tek', bes.metraj.camM2Adetli, tek.metraj.camM2 * 5, 0.01);
}

/* ============================================================
   TEST 3 — KÂR, MONTAJ, KDV
   ============================================================
   Ham 3.815 + %20 kâr (763) + montaj 1.000 = 5.578
   KDV %20 → 6.693,6 → 6.694
*/
console.log('\nTEST 3 — kâr / montaj / KDV');
{
  const s = hesapla({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
    bolmeSayisi: 2, kanatlar: ['sabit', 'sag'],
    renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 1,
    karYuzde: 20, montajTL: 1000, kdvEkle: true,
  }, T);

  esit('kâr tutarı 775 ₺', s.teklifDetay.kar, 775, 3);
  esit('montaj 1.000 ₺', s.teklifDetay.montaj, 1000);
  esit('KDV öncesi 5.649 ₺', s.teklifDetay.kdvOncesi, 5649, 5);
  esit('KDV 1.130 ₺', s.teklifDetay.kdv, 1130, 3);
  esit('teklif 6.779 ₺', s.teklifDetay.toplam, 6779, 5);
}

/* ============================================================
   TEST 4 — ENİNE KAYIT CAM ALANINI AZALTMALI (eski hata)
   ============================================================ */
console.log('\nTEST 4 — enine kayıt cam alanını azaltıyor');
{
  const ortak = {
    urunTipi: 'pencere', genislik: 1500, yukseklik: 2000,
    bolmeSayisi: 1, kanatlar: ['sabit'],
    renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 1,
  };
  const duz = hesapla({ ...ortak }, T);
  const enineli = hesapla({ ...ortak, enineBolmeVar: true, enineBolmeYerdenYukseklik: 900 }, T);

  dogru('enine kayıt aktif', enineli.olculer.enineAktif === true);
  dogru('cam alanı azaldı', enineli.metraj.camM2 < duz.metraj.camM2);
  dogru('cam iki parçaya bölündü', enineli.metraj.camParcalari.length === 2);
  dogru('yatay profil metrajı eklendi', enineli.metraj.yatayM > 0);
  dogru('cam maliyeti azaldı', enineli.maliyet.cam < duz.maliyet.cam);
}

/* ============================================================
   TEST 5 — LAMBİRİ CAM YERİNE PANEL KOYAR
   ============================================================ */
console.log('\nTEST 5 — WC kapısı lambiri');
{
  const s = hesapla({
    urunTipi: 'wc_kapi', genislik: 700, yukseklik: 2000,
    bolmeSayisi: 1, kanatlar: ['sag'],
    renk: 'beyaz', camTipi: 'buzlu_tek', profilSerisi: 70,
    lambiriVar: true, lambiriBoyu: 1400, adet: 1,
  }, T);

  dogru('lambiri m² hesaplandı', s.metraj.lambiriM2 > 0);
  dogru('lambiri maliyeti var', s.maliyet.lambiri > 0);
  dogru('üstte cam kaldı', s.metraj.camM2 > 0);
  dogru('cam tek parça (üst)', s.metraj.camParcalari.length === 1);
  esit('cam parçası üst konumda', s.metraj.camParcalari[0].konum === 'üst' ? 1 : 0, 1);
}

/* ============================================================
   TEST 6 — CAM TİPİ FİYATI DEĞİŞTİRİR
   ============================================================ */
console.log('\nTEST 6 — cam tipleri');
{
  const yap = (camTipi) => hesapla({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
    bolmeSayisi: 1, kanatlar: ['sabit'],
    renk: 'beyaz', camTipi, profilSerisi: 70, adet: 1,
  }, T);

  const buzlu = yap('buzlu_tek');
  const klasik = yap('klasik');
  const konfor = yap('konfor');
  const lamina = yap('lamina');

  dogru('buzlu < klasik', buzlu.maliyet.cam < klasik.maliyet.cam);
  dogru('klasik < konfor', klasik.maliyet.cam < konfor.maliyet.cam);
  dogru('konfor < lamina', konfor.maliyet.cam < lamina.maliyet.cam);
  esit('klasik cam m² fiyatı doğru uygulandı',
    Math.round(klasik.metraj.camM2 * 1100), klasik.maliyet.cam, 2);
}

/* ============================================================
   TEST 7 — RENKLİ SERİ DAHA PAHALI
   ============================================================ */
console.log('\nTEST 7 — beyaz / renkli seri');
{
  const ortak = {
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
    bolmeSayisi: 1, kanatlar: ['sabit'], camTipi: 'klasik',
    profilSerisi: 70, adet: 1,
  };
  const beyaz = hesapla({ ...ortak, renk: 'beyaz' }, T);
  const antrasit = hesapla({ ...ortak, renk: 'antrasit' }, T);
  const mese = hesapla({ ...ortak, renk: 'altin_mese' }, T);

  esit('beyaz kademesi', beyaz.kademe === 'beyaz' ? 1 : 0, 1);
  esit('antrasit → renkli kademesi', antrasit.kademe === 'renkli' ? 1 : 0, 1);
  esit('altın meşe → renkli kademesi', mese.kademe === 'renkli' ? 1 : 0, 1);
  dogru('renkli daha pahalı', antrasit.maliyet.profil > beyaz.maliyet.profil);
  esit('antrasit ve meşe aynı fiyat', antrasit.maliyet.profil, mese.maliyet.profil);
}

/* ============================================================
   TEST 8 — EKSİK FİYAT SESSİZCE 0 OLMAMALI
   ============================================================ */
console.log('\nTEST 8 — eksik fiyat uyarı üretir');
{
  const bozukTablo = JSON.parse(JSON.stringify(T));
  bozukTablo.seriler.beyaz.kasa = 0;
  bozukTablo.camlar.klasik = 0;

  const s = hesapla({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
    bolmeSayisi: 1, kanatlar: ['sabit'],
    renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 1,
  }, bozukTablo);

  dogru('uyarı üretildi', s.uyarilar.length >= 2);
  dogru('kasa uyarısı var', s.uyarilar.some((u) => u.includes('Kasa')));
  dogru('cam uyarısı var', s.uyarilar.some((u) => u.toLowerCase().includes('cam')));

  const tabloUyari = fiyatTablosuUyarilari(bozukTablo);
  dogru('tablo denetimi de yakalıyor', tabloUyari.length >= 2);
}

/* ============================================================
   TEST 9 — ESKİ FİYAT TABLOSU DÖNÜŞÜMÜ
   ============================================================ */
console.log('\nTEST 9 — sürüm 1 → sürüm 2 dönüşümü');
{
  const eski = {
    beyaz: {
      kasa: 200, ortakayit: 200, pencereKanadi: 200, kapiKanadi: 220,
      surmeKasa: 230, surmeKanadi: 230,
      aluKasa: 450, aluPencereKanadi: 450,
      cam: 1100, camIci: 0, upvcLambiri: 380,
      tekAcilim: 400, ciftAcilim: 750, vasistas: 350,
      kapiAksesuar: 600, surmeAksesuar: 1000, sineklik: 450,
      plisePerdeM2: 700, surguluSineklikM2: 850,
    },
    antrasit: {
      kasa: 260, ortakayit: 260, pencereKanadi: 260, kapiKanadi: 280,
      surmeKasa: 290, surmeKanadi: 290, cam: 1100, upvcLambiri: 480,
    },
    altin_mese: { kasa: 240, ortakayit: 240 },
  };

  const yeni = fiyatTablosunuDonustur(eski);

  esit('sürüm 2 oldu', yeni.surum, 2);
  esit('beyaz kasa taşındı', yeni.seriler.beyaz.kasa, 200);
  esit('renkli kasa antrasitten geldi', yeni.seriler.renkli.kasa, 260);
  esit('klasik cam taşındı', yeni.camlar.klasik, 1100);
  dogru('alüminyum alanları yok', !JSON.stringify(yeni).includes('alu'));
  dogru('buzlu cam türetildi', yeni.camlar.buzlu_tek > 0);
  dogru('lamina cam türetildi', yeni.camlar.lamina > yeni.camlar.konfor);

  // dönüştürülen tabloyla hesap yapılabilmeli, uyarı çıkmamalı
  const s = hesapla({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
    bolmeSayisi: 2, kanatlar: ['sabit', 'sag'],
    renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 1,
  }, yeni);
  dogru('dönüştürülen tabloyla hesap sorunsuz', s.uyarilar.length === 0);
  esit('sonuç sürüm 1 ile aynı', s.maliyet.ham, 3874, 4);
}

/* ============================================================
   TEST 10 — SAÇMA GİRDİLER PATLATMAMALI
   ============================================================ */
console.log('\nTEST 10 — bozuk girdi dayanıklılığı');
{
  const senaryolar = [
    { ad: 'boş nesne', g: {} },
    { ad: 'negatif ölçü', g: { genislik: -500, yukseklik: -200 } },
    { ad: 'metin ölçü', g: { genislik: 'abc', yukseklik: 'xyz' } },
    { ad: 'sıfır bölme', g: { genislik: 1000, yukseklik: 1000, bolmeSayisi: 0 } },
    { ad: 'çok büyük', g: { genislik: 99999, yukseklik: 99999 } },
    { ad: 'kanat listesi eksik', g: { genislik: 1500, yukseklik: 1200, bolmeSayisi: 3 } },
    { ad: 'adet 0', g: { genislik: 1500, yukseklik: 1200, adet: 0 } },
    { ad: 'adet negatif', g: { genislik: 1500, yukseklik: 1200, adet: -7 } },
  ];

  senaryolar.forEach(({ ad, g }) => {
    let s;
    try { s = hesapla(g, T); }
    catch (e) { kalan++; console.log(`  ✗ ${ad} — HATA FIRLATTI: ${e.message}`); return; }
    const sayiMi = Number.isFinite(s.teklifDetay.toplam) && s.teklifDetay.toplam >= 0;
    dogru(`${ad} → geçerli sayı döndü (${s.teklifDetay.toplam} ₺)`, sayiMi);
  });

  const sifirAdet = hesapla({ genislik: 1500, yukseklik: 1200, adet: 0 }, T);
  esit('adet en az 1 olur', sifirAdet.olculer.adet, 1);
}

/* ============================================================
   TEST 11 — TEKLİF ASLA NaN VEYA SONSUZ OLMAZ
   ============================================================ */
console.log('\nTEST 11 — 500 rastgele senaryo');
{
  const tipler = ['pencere', 'kapi', 'wc_kapi', 'balkonkapi', 'surme', 'acili'];
  const acilimlar = ['sabit', 'sag', 'sol', 'cift_sag', 'cift_sol', 'vasistas'];
  const camlar = ['buzlu_tek', 'klasik', 'konfor', 'lamina'];
  const renkler = ['beyaz', 'antrasit', 'altin_mese'];

  let sorun = 0;
  for (let i = 0; i < 500; i++) {
    const bs = 1 + Math.floor(Math.random() * 4);
    const s = hesapla({
      urunTipi: tipler[Math.floor(Math.random() * tipler.length)],
      genislik: 300 + Math.random() * 5000,
      yukseklik: 300 + Math.random() * 3000,
      sagYukseklik: 300 + Math.random() * 3000,
      bolmeSayisi: bs,
      kanatlar: Array.from({ length: bs }, () => acilimlar[Math.floor(Math.random() * acilimlar.length)]),
      renk: renkler[Math.floor(Math.random() * renkler.length)],
      camTipi: camlar[Math.floor(Math.random() * camlar.length)],
      profilSerisi: [60, 70, 80][Math.floor(Math.random() * 3)],
      adet: 1 + Math.floor(Math.random() * 20),
      enineBolmeVar: Math.random() > 0.5,
      enineBolmeYerdenYukseklik: 200 + Math.random() * 2000,
      lambiriVar: Math.random() > 0.5,
      lambiriBoyu: 200 + Math.random() * 1600,
      sineklikIste: Math.random() > 0.5,
      karYuzde: Math.random() * 60,
      montajTL: Math.random() * 3000,
      kdvEkle: Math.random() > 0.5,
    }, T);

    const v = s.teklifDetay.toplam;
    if (!Number.isFinite(v) || v < 0 || v > 1e9) sorun++;
    if (!Number.isFinite(s.metraj.camM2) || s.metraj.camM2 < 0) sorun++;
    if (!Number.isFinite(s.metraj.toplamProfilM) || s.metraj.toplamProfilM < 0) sorun++;
  }
  dogru(`500 senaryoda hiç geçersiz sonuç yok (${sorun} sorun)`, sorun === 0);
}


/* ============================================================
   TEST 12 — SİNEKLİK / PERDE HESABI
   ============================================================
   2000 × 700 plise perde, tepe adımı 20 mm

   tepe sayısı = 700 ... DİKKAT: boy 2000 mm ise 2000/20 = 100 tepe
   çerçeve = 2 × (700 + 2000) / 1000 = 5,4 m × 160 =   864,00
   kumaş   = 700 × 2000 / 1e6 = 1,4 m² × 700       = 980,00
   tepe    = 100 × 12                              = 1.200,00
   işçilik                                          =   200,00
   ------------------------------------------------------------
   birim ham = 3.244,00
*/
console.log('\nTEST 12 — plise perde 700×2000');
{
  const s = hesaplaSineklik({
    tip: 'plisePerde', genislik: 700, yukseklik: 2000, adet: 1,
  }, T);

  esit('tepe adımı 20 mm', s.tepeAdimi, 20);
  esit('tepe sayısı 100', s.tepeSayisi, 100);
  esit('çerçeve 5,4 m', s.metraj.cerceveM, 5.4, 0.01);
  esit('kumaş 1,4 m²', s.metraj.kumasM2, 1.4, 0.01);
  esit('çerçeve tutarı 864 ₺', s.maliyet.cerceve, 864, 2);
  esit('kumaş tutarı 980 ₺', s.maliyet.kumas, 980, 2);
  esit('tepe tutarı 1.200 ₺', s.maliyet.tepe, 1200, 2);
  esit('birim ham 3.244 ₺', s.maliyet.birimHam, 3244, 3);
  dogru('uyarı yok', s.uyarilar.length === 0);
}

console.log('\nTEST 13 — üç sineklik tipi de çalışıyor');
{
  ['menteseliSineklik', 'surguluSineklik', 'plisePerde'].forEach((tip) => {
    const s = hesaplaSineklik({ tip, genislik: 700, yukseklik: 2000, adet: 1 }, T);
    dogru(`${tip} geçerli sonuç verdi (${s.maliyet.birimHam} ₺)`, s.gecerli && s.maliyet.birimHam > 0);
    dogru(`${tip} tepe sayısı hesaplandı (${s.tepeSayisi})`, s.tepeSayisi === 100);
  });

  const gecersiz = hesaplaSineklik({ tip: 'olmayan_tip', genislik: 700, yukseklik: 2000 }, T);
  dogru('geçersiz tip reddedildi', gecersiz.gecerli === false);
}

console.log('\nTEST 14 — sineklik adet ve tepe adımı');
{
  const tek = hesaplaSineklik({ tip: 'plisePerde', genislik: 700, yukseklik: 2000, adet: 1 }, T);
  const uc = hesaplaSineklik({ tip: 'plisePerde', genislik: 700, yukseklik: 2000, adet: 3 }, T);

  esit('3 adet = 3 × tek', uc.maliyet.ham, tek.maliyet.ham * 3, 3);
  esit('toplam tepe 300', uc.tepeSayisiToplam, 300);
  esit('birim tepe yine 100', uc.tepeSayisi, 100);

  // tepe adımı değişince tepe sayısı değişmeli
  const tablo25 = JSON.parse(JSON.stringify(T));
  tablo25.tepeAdimiMM = 25;
  const s25 = hesaplaSineklik({ tip: 'plisePerde', genislik: 700, yukseklik: 2000, adet: 1 }, tablo25);
  esit('25 mm adımda 80 tepe', s25.tepeSayisi, 80);
  dogru('25 mm adımda maliyet düştü', s25.maliyet.tepe < tek.maliyet.tepe);
}

console.log('\nTEST 15 — doğramada artık zorunlu sineklik yok');
{
  const sineklikli = hesapla({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
    bolmeSayisi: 2, kanatlar: ['sabit', 'sag'],
    renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 1,
    sineklikIste: true,
  }, T);
  const sinekliksiz = hesapla({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
    bolmeSayisi: 2, kanatlar: ['sabit', 'sag'],
    renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 1,
    sineklikIste: false,
  }, T);

  esit('sineklik kalemi sıfır', sineklikli.maliyet.sineklik, 0);
  esit('iki hesap aynı', sineklikli.maliyet.ham, sinekliksiz.maliyet.ham);
  esit('doğrama maliyeti 3.874 ₺ olarak kaldı', sineklikli.maliyet.ham, 3874, 4);
}

console.log('\nTEST 16 — sineklikte bozuk girdi dayanıklılığı');
{
  const senaryolar = [
    { ad: 'boş', g: {} },
    { ad: 'negatif', g: { tip: 'plisePerde', genislik: -700, yukseklik: -2000 } },
    { ad: 'metin', g: { tip: 'plisePerde', genislik: 'abc', yukseklik: 'x' } },
    { ad: 'adet 0', g: { tip: 'plisePerde', genislik: 700, yukseklik: 2000, adet: 0 } },
    { ad: 'çok büyük', g: { tip: 'plisePerde', genislik: 99999, yukseklik: 99999 } },
  ];
  senaryolar.forEach(({ ad, g }) => {
    let s;
    try { s = hesaplaSineklik(g, T); }
    catch (e) { kalan++; console.log(`  ✗ ${ad} — HATA: ${e.message}`); return; }
    dogru(`${ad} → geçerli sayı (${s.teklifDetay.toplam} ₺)`, Number.isFinite(s.teklifDetay.toplam) && s.teklifDetay.toplam >= 0);
  });

  const bozukTablo = JSON.parse(JSON.stringify(T));
  delete bozukTablo.plisePerde;
  const s = hesaplaSineklik({ tip: 'plisePerde', genislik: 700, yukseklik: 2000 }, bozukTablo);
  dogru('tablo eksikse uyarı verir, çökmez', s.gecerli === false && s.uyarilar.length > 0);
}


/* ============================================================
   TEST 17 — TEPE SAYISI AÇILIM YÖNÜNE GÖRE HESAPLANIR
   ============================================================
   700 × 2000, tepe adımı 20 mm
     dikey açılım → 2000 / 20 = 100 tepe
     yatay açılım →  700 / 20 =  35 tepe
*/
console.log('\nTEST 17 — açılım yönü tepe sayısını değiştirir');
{
  const ortak = { tip: 'plisePerde', genislik: 700, yukseklik: 2000, adet: 1 };

  const dikey = hesaplaSineklik({ ...ortak, acilimYonu: 'dikey' }, T);
  const yatay = hesaplaSineklik({ ...ortak, acilimYonu: 'yatay' }, T);
  const varsayilan = hesaplaSineklik({ ...ortak }, T);

  esit('dikey → 100 tepe', dikey.tepeSayisi, 100);
  esit('yatay → 35 tepe', yatay.tepeSayisi, 35);
  esit('varsayılan dikey', varsayilan.tepeSayisi, 100);
  esit('dikey ölçüsü boy', dikey.tepeOlcusu, 2000);
  esit('yatay ölçüsü en', yatay.tepeOlcusu, 700);

  dogru('yatayda tepe maliyeti daha az', yatay.maliyet.tepe < dikey.maliyet.tepe);
  esit('yatay tepe tutarı 420 ₺', yatay.maliyet.tepe, 420, 2);

  // çerçeve ve kumaş yönden etkilenmemeli
  esit('çerçeve aynı', yatay.metraj.cerceveM, dikey.metraj.cerceveM, 0.001);
  esit('kumaş aynı', yatay.metraj.kumasM2, dikey.metraj.kumasM2, 0.001);

  // geçersiz yön dikey sayılır
  const bozukYon = hesaplaSineklik({ ...ortak, acilimYonu: 'saçma' }, T);
  esit('geçersiz yön dikey olur', bozukYon.tepeSayisi, 100);
}

console.log('\nTEST 18 — üç tipte de yön çalışıyor');
{
  ['menteseliSineklik', 'surguluSineklik', 'plisePerde'].forEach((tip) => {
    const d = hesaplaSineklik({ tip, genislik: 700, yukseklik: 2000, acilimYonu: 'dikey' }, T);
    const y = hesaplaSineklik({ tip, genislik: 700, yukseklik: 2000, acilimYonu: 'yatay' }, T);
    esit(`${tip} dikey 100 tepe`, d.tepeSayisi, 100);
    esit(`${tip} yatay 35 tepe`, y.tepeSayisi, 35);
    dogru(`${tip} yatayda daha ucuz`, y.maliyet.birimHam < d.maliyet.birimHam);
  });
}


/* ============================================================
   TEST 19 — SİNEKLİKTE BEYAZ / RENKLİ KADEME
   ============================================================
   Menteşeli sineklik 700 × 2000, dikey
     beyaz  çerçeve 5,4 m × 140 = 756
     renkli çerçeve 5,4 m × 185 = 999
   Fark yalnızca çerçevede olmalı; kumaş, tepe ve işçilik aynı.
*/
console.log('\nTEST 19 — sineklikte renk kademesi');
{
  const ortak = { genislik: 700, yukseklik: 2000, adet: 1, acilimYonu: 'dikey' };

  const mBeyaz = hesaplaSineklik({ ...ortak, tip: 'menteseliSineklik', renkKademesi: 'beyaz' }, T);
  const mRenkli = hesaplaSineklik({ ...ortak, tip: 'menteseliSineklik', renkKademesi: 'renkli' }, T);

  esit('menteşeli renk seçilebilir', mBeyaz.renkVar ? 1 : 0, 1);
  esit('beyaz kademe', mBeyaz.kademe === 'beyaz' ? 1 : 0, 1);
  esit('renkli kademe', mRenkli.kademe === 'renkli' ? 1 : 0, 1);
  esit('beyaz çerçeve 756 ₺', mBeyaz.maliyet.cerceve, 756, 2);
  esit('renkli çerçeve 999 ₺', mRenkli.maliyet.cerceve, 999, 2);
  esit('kumaş aynı', mRenkli.maliyet.kumas, mBeyaz.maliyet.kumas);
  esit('tepe aynı', mRenkli.maliyet.tepe, mBeyaz.maliyet.tepe);
  esit('işçilik aynı', mRenkli.maliyet.iscilik, mBeyaz.maliyet.iscilik);
  dogru('renkli daha pahalı', mRenkli.maliyet.birimHam > mBeyaz.maliyet.birimHam);

  const sBeyaz = hesaplaSineklik({ ...ortak, tip: 'surguluSineklik', renkKademesi: 'beyaz' }, T);
  const sRenkli = hesaplaSineklik({ ...ortak, tip: 'surguluSineklik', renkKademesi: 'renkli' }, T);
  dogru('sürgülüde de renkli pahalı', sRenkli.maliyet.birimHam > sBeyaz.maliyet.birimHam);

  // plise perdede renk fiyatı etkilememeli
  const pBeyaz = hesaplaSineklik({ ...ortak, tip: 'plisePerde', renkKademesi: 'beyaz' }, T);
  const pRenkli = hesaplaSineklik({ ...ortak, tip: 'plisePerde', renkKademesi: 'renkli' }, T);
  esit('plisede renk seçilemez', pBeyaz.renkVar ? 1 : 0, 0);
  esit('plisede renk fiyatı değiştirmiyor', pRenkli.maliyet.birimHam, pBeyaz.maliyet.birimHam);
  esit('plise her zaman beyaz kademe', pRenkli.kademe === 'beyaz' ? 1 : 0, 1);

  // yardımcı fonksiyon
  dogru('sineklikRenkVarMi menteşeli true', sineklikRenkVarMi('menteseliSineklik') === true);
  dogru('sineklikRenkVarMi sürgülü true', sineklikRenkVarMi('surguluSineklik') === true);
  dogru('sineklikRenkVarMi plise false', sineklikRenkVarMi('plisePerde') === false);

  // renkli fiyat girilmemişse beyaz fiyatına düşmeli, sıfırlanmamalı
  const eksik = JSON.parse(JSON.stringify(T));
  eksik.menteseliSineklik.cerceveMRenkli = 0;
  const yedekli = hesaplaSineklik({ ...ortak, tip: 'menteseliSineklik', renkKademesi: 'renkli' }, eksik);
  esit('renkli fiyat yoksa beyaza düşer', yedekli.maliyet.cerceve, 756, 2);
  dogru('sessizce sıfırlanmadı', yedekli.maliyet.cerceve > 0);
}


/* ============================================================
   TEST 20 — BÖLME ÖLÇÜLERİ EKSEN BAZLIDIR
   ============================================================
   Kullanıcı bölme genişliği girerken EKSEN ölçüsü girer:
   kasa dışından kayıt eksenine, kayıt ekseninden kasa dışına.
   Girilen değerlerin toplamı toplam genişliğe eşit olmalıdır.

   1500 mm, 2 bölme, p=70:
   70'lik seride: kasaPayi 60, kayitGenisligi 80
     750 girildi → net = 750 - 60 (kasa) - 40 (yarım kayıt) = 650
     750 girildi → net = 750 - 40 (yarım kayıt) - 60 (kasa) = 650
   Toplam net = 1300 = icGen(1380) - kayıt(80) ✓
*/
console.log('\nTEST 20 — bölme ölçüleri eksen bazlı');
{
  const yap = (olculer, bolme = 2, kanatlar = ['sabit', 'sag']) => hesapla({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200,
    bolmeSayisi: bolme, kanatlar, bolmeOlculeri: olculer,
    renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 1,
  }, T);

  /* eksen ölçüsünü net açıklıktan geri hesaplar (70'lik seri payları) */
  const KASA = 60, KAYIT = 80;
  const eksene = (net, i, n) =>
    Math.round(net + (i === 0 ? KASA : KAYIT / 2) + (i === n - 1 ? KASA : KAYIT / 2));

  // --- simetrik ---
  const a = yap([750, 750]);
  esit('750/750 → net 650', a.olculer.bolmeGenislikleri[0], 650, 1);
  esit('750/750 → net 650 (2.)', a.olculer.bolmeGenislikleri[1], 650, 1);
  esit('eksen geri 750', eksene(a.olculer.bolmeGenislikleri[0], 0, 2), 750, 1);
  esit('eksen geri 750 (2.)', eksene(a.olculer.bolmeGenislikleri[1], 1, 2), 750, 1);
  dogru('simetrikte uyarı yok', a.uyarilar.length === 0);

  // --- asimetrik: eski kod burada 21 mm sapıyordu ---
  const b = yap([900, 600]);
  esit('900/600 → net 800', b.olculer.bolmeGenislikleri[0], 800, 1);
  esit('900/600 → net 500', b.olculer.bolmeGenislikleri[1], 500, 1);
  esit('eksen geri 900', eksene(b.olculer.bolmeGenislikleri[0], 0, 2), 900, 1);
  esit('eksen geri 600', eksene(b.olculer.bolmeGenislikleri[1], 1, 2), 600, 1);
  dogru('asimetrikte uyarı yok', b.uyarilar.length === 0);

  // --- 3 bölme: ortadaki iki yarım kayıt payı düşer ---
  const c = yap([500, 500, 500], 3, ['sabit', 'sag', 'sabit']);
  esit('3 bölme ilk net 400', c.olculer.bolmeGenislikleri[0], 400, 1);
  esit('3 bölme orta net 420', c.olculer.bolmeGenislikleri[1], 420, 1);
  esit('3 bölme son net 400', c.olculer.bolmeGenislikleri[2], 400, 1);
  esit('3 bölme eksen 500', eksene(c.olculer.bolmeGenislikleri[1], 1, 3), 500, 1);

  // --- toplam tutmuyorsa oranla + uyar ---
  const d = yap([800, 800]);
  dogru('yanlış toplamda uyarı var', d.uyarilar.some((u) => u.includes('toplam')));
  esit('oranlanmış net 650', d.olculer.bolmeGenislikleri[0], 650, 2);

  // --- hiç girilmemişse eşit böl ---
  const e = yap([]);
  esit('otomatik eşit böl', e.olculer.bolmeGenislikleri[0], 650, 1);
  dogru('otomatikte uyarı yok', e.uyarilar.length === 0);

  // --- net toplam her durumda doğru olmalı ---
  [a, b, c, d, e].forEach((s, i) => {
    const toplam = s.olculer.bolmeGenislikleri.reduce((x, y) => x + y, 0);
    const n = s.olculer.bolmeGenislikleri.length;
    const beklenen = s.olculer.icGenislik - (n - 1) * KAYIT;
    dogru(`senaryo ${i + 1} net toplamı tutuyor`, Math.abs(toplam - beklenen) < 2);
  });
}

console.log('\nTEST 21 — lambiri sadece kullanıcı isterse');
{
  const yap = (urunTipi, lambiriVar) => hesapla({
    urunTipi, genislik: 800, yukseklik: 2000, bolmeSayisi: 1,
    kanatlar: ['sag'], renk: 'beyaz', camTipi: 'buzlu_tek',
    profilSerisi: 70, lambiriBoyu: 800, lambiriVar, adet: 1,
  }, T);

  esit('WC kapısı lambirisiz → 0 m²', yap('wc_kapi', false).metraj.lambiriM2, 0);
  dogru('WC kapısı lambirili → m² var', yap('wc_kapi', true).metraj.lambiriM2 > 0);
  dogru('balkon kapısı lambirili', yap('balkonkapi', true).metraj.lambiriM2 > 0);
  dogru('fransız balkon lambirili', yap('fransiz', true).metraj.lambiriM2 > 0);
  esit('pencerede lambiri yok', yap('pencere', true).metraj.lambiriM2, 0);
  esit('sürgülüde lambiri yok', yap('surgulu', true).metraj.lambiriM2, 0);
}


/* ============================================================
   TEST 22 — CAM ÖLÇÜSÜ GERÇEK PENCEREYLE DOĞRULANDI
   ============================================================
   Bu test gerçek bir pencerenin elle ölçülmüş cam ebatlarına dayanır.
   Kırılırsa cam ölçüsü hesabı bozulmuş demektir — imalata yanlış cam
   siparişi gider. ASLA "beklenen değeri güncelleyerek" geçirilmemeli,
   önce sebebi bulunmalı.

   Gerçek pencere:  1120 × 1480, 70'lik seri
   Bölme eksenleri: 700 (açılır) / 420 (sabit)
   Elle ölçülen cam: açılır 485 mm · sabit 270 mm
*/
console.log('\nTEST 22 — cam ölçüsü gerçek pencereyle doğrulama');
{
  const s = hesapla({
    urunTipi: 'pencere', genislik: 1120, yukseklik: 1480,
    bolmeSayisi: 2, kanatlar: ['cift_sag', 'sabit'],
    bolmeOlculeri: [700, 420],
    renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 1,
  }, T);

  const acilir = s.metraj.camParcalari.find((c) => c.bolme === 1);
  const sabit = s.metraj.camParcalari.find((c) => c.bolme === 2);

  esit('AÇILIR cam eni 485 mm (gerçek ölçü)', acilir.en, 485, 1);
  esit('SABİT cam eni 270 mm (gerçek ölçü)', sabit.en, 270, 1);
  esit('açılır net açıklık 600', s.olculer.bolmeGenislikleri[0], 600, 1);
  esit('sabit net açıklık 320', s.olculer.bolmeGenislikleri[1], 320, 1);
  dogru('sabit cam açılırdan daha az pay yer', sabit.boy > acilir.boy);
}

console.log('\nTEST 23 — profil serisi payları');
{
  dogru('sadece 60/70/80 var', PROFIL_SERILERI.join() === '60,70,80');
  esit('geçersiz seri 70 olur', seriNoDuzelt(50), 70);
  esit('geçersiz seri 70 olur (metin)', seriNoDuzelt('abc'), 70);
  esit('60 korunur', seriNoDuzelt(60), 60);
  esit('80 korunur', seriNoDuzelt('80'), 80);

  // seri büyüdükçe cam küçülür — profil daha kalın
  const camEni = (seri) => hesapla({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200, bolmeSayisi: 1,
    kanatlar: ['sag'], renk: 'beyaz', camTipi: 'klasik',
    profilSerisi: seri, adet: 1,
  }, T).metraj.camParcalari[0].en;

  dogru('60 > 70 > 80 (cam küçülüyor)', camEni(60) > camEni(70) && camEni(70) > camEni(80));

  // firma kendi payını girebilir
  const ozelTablo = JSON.parse(JSON.stringify(T));
  ozelTablo.profilPaylari[70].kanatCamPayi = 40;   // daha az pay → daha büyük cam
  const varsayilan = hesapla({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200, bolmeSayisi: 1,
    kanatlar: ['sag'], renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 1,
  }, T).metraj.camParcalari[0].en;
  const ozel = hesapla({
    urunTipi: 'pencere', genislik: 1500, yukseklik: 1200, bolmeSayisi: 1,
    kanatlar: ['sag'], renk: 'beyaz', camTipi: 'klasik', profilSerisi: 70, adet: 1,
  }, ozelTablo).metraj.camParcalari[0].en;
  dogru('firma özel payı uygulanıyor', ozel > varsayilan);
  esit('özel pay farkı 35 mm', ozel - varsayilan, 35, 1);

  // bozuk değer varsayılana düşer
  const bozuk = JSON.parse(JSON.stringify(T));
  bozuk.profilPaylari[70].kanatCamPayi = 0;
  const p = profilPaylariAl(70, bozuk);
  esit('sıfır pay varsayılana düşer', p.kanatCamPayi, 57.5, 0.01);
  const p2 = profilPaylariAl(70, { profilPaylari: { 70: { kasaPayi: 9999 } } });
  esit('saçma pay varsayılana düşer', p2.kasaPayi, 60);
  const p3 = profilPaylariAl(70, null);
  esit('tablo yoksa varsayılan', p3.kayitGenisligi, 80);
}

/* ============================================================
   ÖZET
   ============================================================ */
console.log('\n' + '='.repeat(52));
console.log(`  GEÇEN: ${gecen}    KALAN: ${kalan}`);
console.log('='.repeat(52) + '\n');

if (kalan > 0) process.exit(1);
