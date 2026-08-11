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

import { hesapla } from './fiyatHesapla.js';
import {
  VARSAYILAN_FIYATLAR,
  fiyatTablosunuDonustur,
  fiyatTablosuUyarilari,
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

  esit('bölme genişliği 645 mm', s.olculer.bolmeGenislikleri[0], 645, 1);
  esit('kasa metrajı 6,048 m', s.metraj.kasaM, 6.048, 0.002);
  esit('kanat metrajı 3,819 m', s.metraj.kanatM, 3.819, 0.005);
  esit('cam alanı 1,095 m²', s.metraj.camM2, 1.095, 0.005);
  esit('profil maliyeti 2.211 ₺', s.maliyet.profil, 2211, 3);
  esit('cam maliyeti 1.204 ₺', s.maliyet.cam, 1204, 3);
  esit('aksesuar 400 ₺', s.maliyet.aksesuar, 400);
  esit('ham maliyet 3.815 ₺', s.maliyet.ham, 3815, 4);
  dogru('uyarı yok', s.uyarilar.length === 0);

  // KRİTİK: açılan kanadın cam ölçüsü kanat profilini de düşmeli
  const acilanCam = s.metraj.camParcalari.find((c) => c.bolme === 2);
  esit('açılan kanat cam eni 505 mm', acilanCam.en, 505, 1);
  esit('açılan kanat cam boyu 920 mm', acilanCam.boy, 920, 1);
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

  esit('kâr tutarı 763 ₺', s.teklifDetay.kar, 763, 3);
  esit('montaj 1.000 ₺', s.teklifDetay.montaj, 1000);
  esit('KDV öncesi 5.578 ₺', s.teklifDetay.kdvOncesi, 5578, 5);
  esit('KDV 1.116 ₺', s.teklifDetay.kdv, 1116, 3);
  esit('teklif 6.694 ₺', s.teklifDetay.toplam, 6694, 5);
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
  esit('sonuç sürüm 1 ile aynı', s.maliyet.ham, 3815, 4);
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
   ÖZET
   ============================================================ */
console.log('\n' + '='.repeat(52));
console.log(`  GEÇEN: ${gecen}    KALAN: ${kalan}`);
console.log('='.repeat(52) + '\n');

if (kalan > 0) process.exit(1);
