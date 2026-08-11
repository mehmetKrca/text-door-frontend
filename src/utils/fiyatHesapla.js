/**
 * eWindoore — Fiyat ve Metraj Hesabı
 *
 * Bu dosya SAF (pure) fonksiyon içerir: arayüzle, React ile, ağ ile
 * hiçbir ilişkisi yoktur. Aynı girdi her zaman aynı çıktıyı verir.
 * Böylece test edilebilir ve fiyatın doğruluğu garanti altına alınır.
 *
 * TÜM ÖLÇÜLER mm CİNSİNDEN GİRİLİR.
 *
 * SÜRÜM 1'DE DÜZELTİLEN HATALAR:
 *  1. Cam alanı yalnızca kasa profilini düşüyordu, kanat profilini
 *     düşmüyordu → açılan kanatlarda cam ölçüsü ve maliyeti şişikti.
 *  2. Adet çarpanı yoktu (`adet: 1` sabitti).
 *  3. Enine kayıt cam alanını azaltmıyordu.
 *  4. Açılı pencerede profil payı hiç düşülmüyordu.
 *  5. Fiyat tablosunda eksik alan sessizce 0 oluyordu → artık uyarı üretilir.
 */

import { renkKademesi } from './fiyatTablosu.js';

/* köşe kesiminde oluşan fire (gönye kesim kaybı) */
export const FIRE_KATSAYISI = 1.12;

/* cam çıtası payı (sabit bölmelerde camın kenardan içeri girmesi) */
const CITA_MM = 16;

/* KDV oranı */
export const KDV_ORANI = 0.20;

/**
 * @param {object} g  girdi
 * @param {object} t  fiyat tablosu (sürüm 2)
 */
export function hesapla(g, t) {
  const uyarilar = [];

  /* ---------- 1. GİRDİLERİ GÜVENLİ HALE GETİR ---------- */
  const sayi = (v, yedek = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : yedek;
  };

  const gGen = Math.max(0, sayi(g.genislik));
  const gYuk = Math.max(0, sayi(g.yukseklik));
  const gSagYuk = Math.max(0, sayi(g.sagYukseklik, gYuk));
  const p = Math.max(30, sayi(g.profilSerisi, 70));       // profil genişliği
  const adet = Math.max(1, Math.floor(sayi(g.adet, 1)));
  const urunTipi = g.urunTipi || 'pencere';

  const isKapi = ['kapi', 'wc_kapi', 'balkonkapi'].includes(urunTipi);
  const isSurme = urunTipi === 'surme';
  const isAcili = urunTipi === 'acili';

  const bolmeSayisi = Math.max(1, Math.min(6, Math.floor(sayi(g.bolmeSayisi, 1))));
  const kanatlar = Array.isArray(g.kanatlar) && g.kanatlar.length
    ? g.kanatlar.slice(0, bolmeSayisi)
    : Array(bolmeSayisi).fill('sabit');
  while (kanatlar.length < bolmeSayisi) kanatlar.push('sabit');

  if (gGen < 200 || gYuk < 200) {
    uyarilar.push('Ölçüler çok küçük görünüyor (en az 200 mm).');
  }
  if (gGen > 6000 || gYuk > 3500) {
    uyarilar.push('Ölçüler çok büyük görünüyor — kontrol edin.');
  }

  /* ---------- 2. GEOMETRİ ---------- */
  const icGen = Math.max(0, gGen - 2 * p);
  const icYuk = Math.max(0, gYuk - 2 * p);

  const dikmeSayisi = bolmeSayisi - 1;
  const dikmeToplamGenislik = dikmeSayisi * p;
  const netBolmeToplam = Math.max(0, icGen - dikmeToplamGenislik);

  // bölme genişlikleri: elle girilenler korunur, kalan otomatik paylaşılır
  const elleOlculer = Array.isArray(g.bolmeOlculeri) ? g.bolmeOlculeri : [];
  const elleToplam = elleOlculer.reduce((a, b) => a + Math.max(0, sayi(b)), 0);
  const otoSayisi = bolmeSayisi - elleOlculer.filter((b) => sayi(b) > 0).length;

  let bolmeGenislikleri;
  if (otoSayisi === 0) {
    // hepsi elle girilmiş — toplam net açıklığa oranla
    const oran = elleToplam > 0 ? netBolmeToplam / elleToplam : 1;
    bolmeGenislikleri = Array.from({ length: bolmeSayisi }, (_, i) =>
      Math.max(0, sayi(elleOlculer[i]) * oran));
    if (Math.abs(elleToplam - netBolmeToplam) > 5) {
      uyarilar.push(
        `Elle girilen bölme ölçüleri toplamı (${Math.round(elleToplam)} mm) ` +
        `net açıklığa (${Math.round(netBolmeToplam)} mm) eşit değil, oranlandı.`
      );
    }
  } else {
    const kalan = Math.max(0, netBolmeToplam - elleToplam);
    const otoGen = kalan / otoSayisi;
    bolmeGenislikleri = Array.from({ length: bolmeSayisi }, (_, i) =>
      sayi(elleOlculer[i]) > 0 ? sayi(elleOlculer[i]) : otoGen);
  }

  /* --- enine (yatay) kayıt --- */
  const lambiriVar = isKapi && (urunTipi === 'wc_kapi' || !!g.lambiriVar);
  const enineIstendi = !!g.enineBolmeVar || lambiriVar;

  // kayıt ekseninin zeminden yüksekliği
  const kayitYuksekligi = lambiriVar
    ? Math.max(0, sayi(g.lambiriBoyu, 900))
    : Math.max(0, sayi(g.enineBolmeYerdenYukseklik, 900));

  // net alt ve üst yükseklikler (kayıt profili p kadar yer kaplar)
  let altNetYuk = 0;
  let ustNetYuk = icYuk;
  let enineAktif = false;

  if (enineIstendi) {
    const altHam = kayitYuksekligi - p - p / 2;   // zemin kasası + kayıt yarısı
    const ustHam = icYuk - Math.max(0, altHam) - p;
    if (altHam > 50 && ustHam > 50) {
      enineAktif = true;
      altNetYuk = altHam;
      ustNetYuk = ustHam;
    } else {
      uyarilar.push('Enine kayıt yüksekliği ölçülere sığmıyor, uygulanmadı.');
    }
  }

  /* ---------- 3. METRAJ ---------- */
  let kasaM;
  if (isAcili) {
    const fark = Math.abs(gSagYuk - gYuk);
    const egimliKenar = Math.sqrt(gGen * gGen + fark * fark);
    kasaM = (gGen + gYuk + gSagYuk + egimliKenar) / 1000;
  } else {
    kasaM = ((gGen + gYuk) * 2) / 1000;
  }
  const kasaMetraj = kasaM * FIRE_KATSAYISI;

  // dikey orta kayıtlar
  const dikmeMetraj = ((dikmeSayisi * icYuk) / 1000) * FIRE_KATSAYISI;

  // yatay kayıtlar: kapıda eşik + varsa enine kayıt
  let yatayHam = 0;
  if (isKapi) yatayHam += icGen / 1000;
  if (enineAktif) yatayHam += icGen / 1000;
  const yatayMetraj = yatayHam * FIRE_KATSAYISI;

  /* --- kanat metrajı ve cam alanı (DÜZELTİLDİ) --- */
  let kanatMetraj = 0;
  let camM2 = 0;
  let lambiriM2 = 0;
  const camParcalari = [];   // kesim listesi için

  bolmeGenislikleri.forEach((bg, i) => {
    const acilimTipi = kanatlar[i] || 'sabit';
    const acilirMi = acilimTipi !== 'sabit';

    // bu bölmenin dikey parçaları
    const parcalar = enineAktif
      ? [
          { yuk: ustNetYuk, alt: false },
          { yuk: altNetYuk, alt: true },
        ]
      : [{ yuk: icYuk, alt: false }];

    parcalar.forEach(({ yuk, alt }) => {
      if (bg <= 0 || yuk <= 0) return;

      // lambiri alt parçada camın yerini alır
      if (alt && lambiriVar) {
        lambiriM2 += (bg * yuk) / 1e6;
        return;
      }

      // DÜZELTME 1: açılan kanatta cam, kasa + kanat kadar küçülür
      const icPay = acilirMi ? p : CITA_MM;
      const camW = Math.max(0, bg - 2 * icPay);
      const camH = Math.max(0, yuk - 2 * icPay);

      camM2 += (camW * camH) / 1e6;
      camParcalari.push({
        bolme: i + 1,
        konum: alt ? 'alt' : (enineAktif ? 'üst' : 'tek'),
        en: Math.round(camW),
        boy: Math.round(camH),
        m2: Number(((camW * camH) / 1e6).toFixed(3)),
      });

      // kanat profili çevresi (kanat, net açıklık kadar)
      if (acilirMi) {
        kanatMetraj += ((2 * (bg + yuk)) / 1000) * FIRE_KATSAYISI;
      }
    });
  });

  // DÜZELTME 4: açılı pencerede de profil payı düşülür
  if (isAcili) {
    const ortYuk = (gYuk + gSagYuk) / 2;
    const netW = Math.max(0, gGen - 2 * p);
    const netH = Math.max(0, ortYuk - 2 * p);
    camM2 = (netW * netH) / 1e6;
    camParcalari.length = 0;
    camParcalari.push({
      bolme: 1, konum: 'açılı',
      en: Math.round(netW), boy: Math.round(netH),
      m2: Number(camM2.toFixed(3)),
    });
  }

  /* ---------- 4. BİRİM FİYATLAR ---------- */
  const kademe = renkKademesi(g.renk || 'beyaz');
  const seri = t?.seriler?.[kademe];

  if (!seri) {
    return hataliSonuc(['Fiyat tablosunda seri bulunamadı. Ayarları kontrol edin.']);
  }

  const bf = (deger, ad) => {
    const n = Number(deger);
    if (!Number.isFinite(n) || n <= 0) {
      uyarilar.push(`"${ad}" birim fiyatı girilmemiş — bu kalem 0 ₺ sayıldı.`);
      return 0;
    }
    return n;
  };

  const fKasa = bf(isSurme ? seri.surmeKasa : seri.kasa, isSurme ? 'Sürme kasa' : 'Kasa');
  const fKayit = bf(seri.ortakayit, 'Orta kayıt');
  const fKanat = bf(
    isSurme ? seri.surmeKanadi : (isKapi ? seri.kapiKanadi : seri.pencereKanadi),
    isSurme ? 'Sürme kanadı' : (isKapi ? 'Kapı kanadı' : 'Pencere kanadı')
  );
  const fLambiri = lambiriM2 > 0 ? bf(seri.lambiri, 'Lambiri') : 0;

  const camTipi = g.camTipi || 'klasik';
  const fCam = bf(t?.camlar?.[camTipi], `Cam (${camTipi})`);
  const fCamIsc = Math.max(0, Number(t?.camIsciligi) || 0);

  const aks = t?.aksesuarlar || {};

  /* ---------- 5. MALİYET ---------- */
  const profilMaliyeti =
    kasaMetraj * fKasa +
    dikmeMetraj * fKayit +
    yatayMetraj * fKayit +
    kanatMetraj * fKanat;

  const camMaliyeti = camM2 * (fCam + fCamIsc);
  const lambiriMaliyeti = lambiriM2 * fLambiri;

  let aksesuarMaliyeti = 0;
  const aksesuarDetay = [];
  kanatlar.forEach((tip) => {
    let tutar = 0;
    let ad = '';
    if (tip === 'sag' || tip === 'sol') {
      tutar = isSurme ? bf(aks.surmeAksesuar, 'Sürme aksesuar')
        : (isKapi ? bf(aks.kapiAksesuar, 'Kapı aksesuar') : bf(aks.tekAcilim, 'Tek açılım'));
      ad = isSurme ? 'Sürme takım' : (isKapi ? 'Kapı takımı' : 'Tek açılım takımı');
    } else if (tip === 'cift_sag' || tip === 'cift_sol') {
      tutar = bf(aks.ciftAcilim, 'Çift açılım');
      ad = 'Çift açılım takımı';
    } else if (tip === 'vasistas') {
      tutar = bf(aks.vasistas, 'Vasistas');
      ad = 'Vasistas takımı';
    }
    if (tutar > 0) {
      aksesuarMaliyeti += tutar;
      aksesuarDetay.push({ ad, tutar });
    }
  });

  /* --- sineklik (açılan kanat başına) --- */
  const acilirAdet = kanatlar.filter((k) => k !== 'sabit').length;
  let sineklikMaliyeti = 0;
  let sineklikDetay = null;
  if (g.sineklikIste && acilirAdet > 0) {
    const s = t?.sineklik || {};
    // her açılan kanat için ayrı sineklik
    const kanatOrtGen = bolmeGenislikleri.reduce((a, b) => a + b, 0) / bolmeSayisi;
    const cevreM = (2 * (kanatOrtGen + icYuk)) / 1000;
    const telM2Adet = (kanatOrtGen * icYuk) / 1e6;
    const tepeAdet = Math.max(0, Number(s.tepeBasiAdet) || 0);

    const birim =
      cevreM * (Number(s.cerceveM) || 0) +
      telM2Adet * (Number(s.telM2) || 0) +
      tepeAdet * (Number(s.tepeBasiBirim) || 0) +
      (Number(s.iscilik) || 0);

    sineklikMaliyeti = birim * acilirAdet;
    sineklikDetay = {
      adet: acilirAdet,
      cevreM: Number((cevreM * acilirAdet).toFixed(2)),
      telM2: Number((telM2Adet * acilirAdet).toFixed(3)),
      tepeBasiAdet: tepeAdet * acilirAdet,
      birimTutar: Math.round(birim),
    };
  }

  /* ---------- 6. TEKLİF ---------- */
  const birimHamMaliyet =
    profilMaliyeti + camMaliyeti + lambiriMaliyeti + aksesuarMaliyeti + sineklikMaliyeti;

  // DÜZELTME 2: adet çarpanı
  const hamMaliyet = birimHamMaliyet * adet;

  const karTL = Math.max(0, sayi(g.karTL));
  const karYuzde = Math.max(0, sayi(g.karYuzde));
  const montajTL = Math.max(0, sayi(g.montajTL));

  const karTutari = hamMaliyet * (karYuzde / 100) + karTL * adet;
  const montajTutari = montajTL * adet;

  const kdvOncesi = hamMaliyet + karTutari + montajTutari;
  const kdvTutari = g.kdvEkle ? kdvOncesi * KDV_ORANI : 0;
  const teklif = Math.ceil(kdvOncesi + kdvTutari);

  /* ---------- 7. SONUÇ ---------- */
  return {
    gecerli: true,
    uyarilar,

    olculer: {
      genislik: gGen,
      yukseklik: gYuk,
      icGenislik: Math.round(icGen),
      icYukseklik: Math.round(icYuk),
      bolmeGenislikleri: bolmeGenislikleri.map((b) => Math.round(b)),
      enineAktif,
      ustNetYuk: Math.round(ustNetYuk),
      altNetYuk: Math.round(altNetYuk),
      adet,
    },

    metraj: {
      kasaM: Number(kasaMetraj.toFixed(3)),
      dikmeM: Number(dikmeMetraj.toFixed(3)),
      yatayM: Number(yatayMetraj.toFixed(3)),
      kanatM: Number(kanatMetraj.toFixed(3)),
      toplamProfilM: Number((kasaMetraj + dikmeMetraj + yatayMetraj + kanatMetraj).toFixed(3)),
      camM2: Number(camM2.toFixed(3)),
      lambiriM2: Number(lambiriM2.toFixed(3)),
      camParcalari,
      // adet dahil toplamlar (patron özeti için)
      toplamProfilMAdetli: Number(((kasaMetraj + dikmeMetraj + yatayMetraj + kanatMetraj) * adet).toFixed(3)),
      camM2Adetli: Number((camM2 * adet).toFixed(3)),
      lambiriM2Adetli: Number((lambiriM2 * adet).toFixed(3)),
    },

    maliyet: {
      profil: Math.round(profilMaliyeti),
      cam: Math.round(camMaliyeti),
      lambiri: Math.round(lambiriMaliyeti),
      aksesuar: Math.round(aksesuarMaliyeti),
      sineklik: Math.round(sineklikMaliyeti),
      aksesuarDetay,
      sineklikDetay,
      birimHam: Math.round(birimHamMaliyet),
      ham: Math.round(hamMaliyet),
    },

    teklifDetay: {
      kar: Math.round(karTutari),
      montaj: Math.round(montajTutari),
      kdvOncesi: Math.round(kdvOncesi),
      kdv: Math.round(kdvTutari),
      toplam: teklif,
      birimFiyat: Math.ceil(teklif / adet),
    },

    camTipi,
    kademe,
  };
}

function hataliSonuc(uyarilar) {
  return {
    gecerli: false,
    uyarilar,
    olculer: null,
    metraj: null,
    maliyet: null,
    teklifDetay: { toplam: 0, birimFiyat: 0, kar: 0, montaj: 0, kdv: 0, kdvOncesi: 0 },
  };
}