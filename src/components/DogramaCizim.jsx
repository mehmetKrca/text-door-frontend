import React, { useMemo } from 'react';
import { profilPaylariAl } from '../utils/fiyatTablosu.js';

/**
 * eWindoore — Ortak Doğrama Çizim Motoru
 *
 * Hem vitrindeki demoda hem asıl çizim ekranında BU bileşen kullanılır.
 * Böylece iki yerde farklı görünüm ve farklı ölçü olması imkânsız hale gelir.
 *
 * Ölçüler mm cinsindendir.
 * Cam etiketleri mümkünse fiyat motorundan (`camParcalari`) alınır;
 * gelmezse bileşen kendi geometrisinden türetir.
 */

/* ============================================================
   PROFİL RENKLERİ
   ============================================================ */
export const PROFIL_RENKLERI = {
  beyaz: { ad: 'Klasik Beyaz', yuz: '#f2f4f7', kenar: '#c3cad4', koyu: '#9aa4b2', isik: '#ffffff' },
  antrasit: { ad: 'Antrasit Gri', yuz: '#454d57', kenar: '#2b3138', koyu: '#1d2228', isik: '#5d6773' },
  altin_mese: { ad: 'Altın Meşe', yuz: '#a8792f', kenar: '#7c5720', koyu: '#5f4318', isik: '#c49546' },
};

/* uygulamanın kanat tipi sözlüğü */
const MENTESE_SOLDA = ['sag', 'cift_sag'];
const YANA_ACILIR = ['sag', 'sol', 'cift_sag', 'cift_sol'];
const USTTEN_ACILIR = ['vasistas', 'cift_sag', 'cift_sol'];

/* ============================================================ */
export default function DogramaCizim({
  urunTipi = 'pencere',
  genislik = 1500,
  yukseklik = 1200,
  sagYukseklik,
  bolmeSayisi = 1,
  bolmeGenislikleri,          // fiyat motorundan gelirse kullanılır
  kanatlar = ['sabit'],
  renkId = 'beyaz',
  profilSerisi = 70,
  lambiriVar = false,
  lambiriBoyu = 900,
  lambiriYonu = 'yatay',      // 'yatay' | 'dikey' — lambiri yivlerinin yönü
  enineBolmeVar = false,
  enineBolmeYuksekligi = 900,
  sineklikIste = false,
  camParcalari = null,        // fiyat motorundan
  tuvalGenisligi = 700,
  tuvalYuksekligi = 460,
  olcuGoster = true,
  fiyatTablosu = null,      // profil payları buradan okunur, motorla aynı olsun
  camEtiketGoster = true,   // müşteriye giden teklifte cam kesim ölçüleri gizlenir
  etiketGoster = true,      // sağ alttaki teknik etiket
}) {
  const renk = PROFIL_RENKLERI[renkId] || PROFIL_RENKLERI.beyaz;
  const isKapi = ['kapi', 'wc_kapi', 'balkonkapi', 'fransiz'].includes(urunTipi);
  const isSurgulu = urunTipi === 'surgulu';
  const isAcili = urunTipi === 'acili';

  const g = useMemo(() => {
    const TW = tuvalGenisligi;
    const TH = tuvalYuksekligi;

    const mmEn = Math.min(Math.max(Number(genislik) || 300, 200), 8000);
    const mmSol = Math.min(Math.max(Number(yukseklik) || 300, 200), 4000);
    const mmSag = isAcili
      ? Math.min(Math.max(Number(sagYukseklik) || mmSol, 200), 4000)
      : mmSol;
    const mmMax = Math.max(mmSol, mmSag);

    const alanW = TW - (olcuGoster ? 190 : 40);
    const alanH = TH - (olcuGoster ? 140 : 40);
    const olcek = Math.min(alanW / mmEn, alanH / mmMax);

    const W = mmEn * olcek;
    const Hsol = mmSol * olcek;
    const Hsag = mmSag * olcek;
    const Hmax = mmMax * olcek;

    const X = (olcuGoster ? 96 : 20) + (alanW - W) / 2;
    const Y = (olcuGoster ? 32 : 20) + (alanH - Hmax) / 2;

    /* ⚠️ Profil payları fiyat motoruyla AYNI KAYNAKTAN gelir.
       profilPaylariAl() hem burada hem fiyatHesapla.js'te kullanılır —
       böylece çizimdeki ara ölçüler ile kesim listesi asla ayrışamaz.
       Daha önce burada profilSerisi doğrudan kullanılıyordu ve cam
       ölçüsü gerçekten 40 mm sapıyordu. */
    const pay = profilPaylariAl(profilSerisi, fiyatTablosu);
    const p = pay.kasaPayi;
    const kasa = Math.max(6, pay.kasaPayi * olcek);
    const kanat = Math.max(5, pay.kanatCamPayi * olcek);
    const kayit = Math.max(6, pay.kayitGenisligi * olcek);
    const cita = Math.max(2, pay.sabitCamPayi * olcek);
    const conta = Math.max(1.2, 6 * olcek);

    // üst kenar eğimli olabilir (açılı pencere)
    const ustSol = Y + (Hmax - Hsol);
    const ustSag = Y + (Hmax - Hsag);
    const alt = Y + Hmax;

    // belirli bir x noktasında üst kenarın y değeri
    const ustY = (x) => {
      if (!isAcili) return ustSol;
      const t = W === 0 ? 0 : (x - X) / W;
      return ustSol + (ustSag - ustSol) * t;
    };

    const icX = X + kasa;
    const icSag = X + W - kasa;
    const icAlt = alt - kasa;
    const icW = Math.max(0, icSag - icX);

    const n = Math.max(1, Math.min(6, Number(bolmeSayisi) || 1));

    // bölme genişlikleri: motordan geldiyse ölçekle, gelmediyse eşit böl
    let bgPx;
    if (Array.isArray(bolmeGenislikleri) && bolmeGenislikleri.length === n) {
      bgPx = bolmeGenislikleri.map((b) => Math.max(0, Number(b) || 0) * olcek);
    } else {
      const netToplam = Math.max(0, icW - kayit * (n - 1));
      bgPx = Array(n).fill(netToplam / n);
    }

    // enine kayıt ekseni (alttan)
    const enineAktif = enineBolmeVar || (lambiriVar && isKapi);
    const istenen = lambiriVar && isKapi
      ? Number(lambiriBoyu) || 900
      : Number(enineBolmeYuksekligi) || 900;
    const eksenY = alt - Math.min(Math.max(istenen, 200), mmSol - 200) * olcek;

    const bolmeler = [];
    let imlec = icX;
    for (let i = 0; i < n; i++) {
      const bw = bgPx[i] || 0;
      const bx = imlec;
      imlec += bw + kayit;

      const acilim = kanatlar[i] || 'sabit';
      const acilirMi = acilim !== 'sabit';

      const bUstY = Math.max(ustY(bx), ustY(bx + bw)) + kasa;
      const bUstYsol = ustY(bx) + kasa;
      const bUstYsag = ustY(bx + bw) + kasa;

      // sürgülüde kanat kasa içine oturur, conta yok
      const ofset = acilirMi && !isSurgulu ? conta : 0;
      const kx = bx + ofset;
      const ky = (isAcili ? bUstY : ustSol + kasa) + ofset;
      const kw = Math.max(0, bw - ofset * 2);
      const kh = Math.max(0, icAlt - ky - ofset);

      const icPay = acilirMi ? kanat : cita;
      const cx = kx + icPay;
      const cy = ky + icPay;
      const cw = Math.max(0, kw - icPay * 2);
      const ch = Math.max(0, kh - icPay * 2);

      const enineVarBurada =
        enineAktif && eksenY - kayit / 2 > cy + 10 && eksenY + kayit / 2 < cy + ch - 10;

      bolmeler.push({
        i, acilim, acilirMi,
        bx, bw, bUstYsol, bUstYsag,
        kx, ky, kw, kh,
        cx, cy, cw, ch,
        enineVarBurada,
        ustCamH: enineVarBurada ? eksenY - kayit / 2 - cy : ch,
        altCamY: eksenY + kayit / 2,
        altCamH: enineVarBurada ? cy + ch - (eksenY + kayit / 2) : 0,
      });
    }

    return {
      TW, TH, olcek, mmEn, mmSol, mmSag, mmMax,
      W, Hsol, Hsag, Hmax, X, Y, alt, ustSol, ustSag, ustY,
      kasa, kanat, kayit, cita,
      icX, icSag, icAlt, icW, n, bolmeler,
      enineAktif, eksenY, p, pay,
    };
  }, [
    genislik, yukseklik, sagYukseklik, bolmeSayisi, bolmeGenislikleri,
    kanatlar, profilSerisi, lambiriVar, lambiriBoyu, enineBolmeVar,
    enineBolmeYuksekligi, urunTipi, tuvalGenisligi, tuvalYuksekligi, olcuGoster,
    fiyatTablosu,
    lambiriYonu,
    camEtiketGoster, etiketGoster,
  ]);

  const {
    TW, TH, olcek, mmEn, mmSol, mmSag, W, Hmax, X, Y, alt, ustSol, ustSag,
    kasa, kayit, icX, icSag, icAlt, n, bolmeler, enineAktif, eksenY, pay,
  } = g;

  const mm = (px) => Math.round(px / olcek);

  /* gönye köşe izleri */
  const gonye = (x, y, w, h, t) => [
    `M${x} ${y} L${x + t} ${y + t}`,
    `M${x + w} ${y} L${x + w - t} ${y + t}`,
    `M${x} ${y + h} L${x + t} ${y + h - t}`,
    `M${x + w} ${y + h} L${x + w - t} ${y + h - t}`,
  ].join(' ');

  /* motordan gelen cam etiketi */
  const camEtiketi = (bolmeNo, konum) => {
    if (!Array.isArray(camParcalari)) return null;
    return (
      camParcalari.find((c) => c.bolme === bolmeNo && c.konum === konum) ||
      camParcalari.find((c) => c.bolme === bolmeNo && konum === 'üst' && c.konum === 'tek') ||
      null
    );
  };

  /* ---------- CAM YÜZEYİ ---------- */
  const Cam = ({ x, y, w, h, tel, etiket }) => {
    if (w <= 1 || h <= 1) return null;
    const en = etiket ? etiket.en : mm(w);
    const boy = etiket ? etiket.boy : mm(h);
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="url(#ewCam)" />
        <polygon
          points={`${x},${y + h} ${x},${y + h * 0.54} ${x + w * 0.6},${y} ${x + w * 0.22},${y}`}
          fill="url(#ewYansima)"
        />
        <rect x={x} y={y} width={w} height={h} fill="none" stroke={renk.koyu} strokeWidth="0.8" />
        <rect x={x + 0.9} y={y + 0.9} width={Math.max(0, w - 1.8)} height={Math.max(0, h - 1.8)}
          fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.5" />
        {tel && (
          <>
            <rect x={x} y={y} width={w} height={h} fill="url(#ewTel)" />
            <rect x={x} y={y} width={w} height={h} fill="none" stroke="#4a545f" strokeWidth="1.4" />
          </>
        )}
        {camEtiketGoster && w > 52 && h > 34 && (
          <g>
            <rect x={x + w / 2 - 31} y={y + h / 2 - 13} width="62" height="26" rx="3"
              fill="#ffffff" opacity="0.88" stroke="#c8d3e0" strokeWidth="0.6" />
            <text x={x + w / 2} y={y + h / 2 - 2} textAnchor="middle" fontSize="9.4"
              fill="#1b5e9e" fontFamily="'JetBrains Mono', monospace" fontWeight="700">{en}</text>
            <text x={x + w / 2} y={y + h / 2 + 9} textAnchor="middle" fontSize="9.4"
              fill="#c0392b" fontFamily="'JetBrains Mono', monospace" fontWeight="700">× {boy}</text>
          </g>
        )}
      </g>
    );
  };

  /* ---------- LAMBİRİ PANELİ ---------- */
  const Lambiri = ({ x, y, w, h }) => {
    if (w <= 1 || h <= 6) return null;

    /* Yivler yatay ya da dikey dizilebilir — usta hangisini imal edecekse
       onu seçer. Yiv sayısı panelin o yöndeki uzunluğuna göre belirlenir. */
    const dikeyMi = lambiriYonu === 'dikey';
    const uzunluk = dikeyMi ? w : h;
    const yiv = Math.max(2, Math.floor(uzunluk / 11));

    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="url(#ewProfil)" stroke={renk.koyu} strokeWidth="0.8" />
        {Array.from({ length: yiv }).map((_, k) => {
          if (dikeyMi) {
            const lx = x + (k + 1) * (w / (yiv + 1));
            return (
              <g key={k}>
                <line x1={lx} y1={y + 2} x2={lx} y2={y + h - 2} stroke={renk.koyu} strokeWidth="0.55" opacity="0.7" />
                <line x1={lx + 0.9} y1={y + 2} x2={lx + 0.9} y2={y + h - 2} stroke={renk.isik} strokeWidth="0.5" opacity="0.55" />
              </g>
            );
          }
          const ly = y + (k + 1) * (h / (yiv + 1));
          return (
            <g key={k}>
              <line x1={x + 2} y1={ly} x2={x + w - 2} y2={ly} stroke={renk.koyu} strokeWidth="0.55" opacity="0.7" />
              <line x1={x + 2} y1={ly + 0.9} x2={x + w - 2} y2={ly + 0.9} stroke={renk.isik} strokeWidth="0.5" opacity="0.55" />
            </g>
          );
        })}
        {camEtiketGoster && w > 52 && h > 28 && (
          <g>
            <rect x={x + w / 2 - 30} y={y + h / 2 - 8} width="60" height="16" rx="3"
              fill="#ffffff" opacity="0.9" stroke="#c8d3e0" strokeWidth="0.6" />
            <text x={x + w / 2} y={y + h / 2 + 3.5} textAnchor="middle" fontSize="8.5"
              fill="#54637a" fontFamily="'JetBrains Mono', monospace" fontWeight="600">
              LAMBİRİ {mm(h)}
            </text>
          </g>
        )}
      </g>
    );
  };

  /* dış kasa yolu (açılı pencerede eğik üst kenar) */
  const kasaDisYol = isAcili
    ? `M${X} ${ustSol} L${X + W} ${ustSag} L${X + W} ${alt} L${X} ${alt} Z`
    : null;
  const kasaIcYol = isAcili
    ? `M${icX} ${ustSol + kasa} L${icSag} ${ustSag + kasa} L${icSag} ${icAlt} L${icX} ${icAlt} Z`
    : null;

  return (
    <svg viewBox={`0 0 ${TW} ${TH}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="ewCam" x1="0" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor="#e2f2fc" />
          <stop offset="42%" stopColor="#c3dff2" />
          <stop offset="70%" stopColor="#d9ecf8" />
          <stop offset="100%" stopColor="#b6d6ed" />
        </linearGradient>
        <linearGradient id="ewYansima" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ewProfil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={renk.isik} />
          <stop offset="38%" stopColor={renk.yuz} />
          <stop offset="100%" stopColor={renk.kenar} />
        </linearGradient>
        <pattern id="ewTel" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 0 H4 M0 2 H4" stroke="#5c6672" strokeWidth="0.45" opacity="0.75" />
          <path d="M0 0 V4 M2 0 V4" stroke="#5c6672" strokeWidth="0.45" opacity="0.75" />
        </pattern>
        <marker id="ewOk" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0 0 L7 3.5 L0 7 z" fill="#2c6fb5" />
        </marker>
        <marker id="ewOkGeri" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
          <path d="M7 0 L0 3.5 L7 7 z" fill="#2c6fb5" />
        </marker>
      </defs>

      {/* ---------- KASA ---------- */}
      {isAcili ? (
        <>
          <path d={kasaDisYol} fill="url(#ewProfil)" stroke={renk.koyu} strokeWidth="1.1" />
          <path d={kasaIcYol} fill="#ffffff" stroke={renk.koyu} strokeWidth="0.9" />
        </>
      ) : (
        <>
          <rect x={X} y={ustSol} width={W} height={alt - ustSol}
            fill="url(#ewProfil)" stroke={renk.koyu} strokeWidth="1.1" />
          <rect x={icX} y={ustSol + kasa} width={Math.max(0, icSag - icX)} height={Math.max(0, icAlt - ustSol - kasa)}
            fill="#ffffff" stroke={renk.koyu} strokeWidth="0.9" />
          <path d={gonye(X, ustSol, W, alt - ustSol, kasa)} stroke={renk.koyu} strokeWidth="0.7" opacity="0.62" fill="none" />
        </>
      )}

      {/* ---------- SÜRGÜLÜ RAYLARI ---------- */}
      {isSurgulu && (
        <g>
          <line x1={icX} y1={ustSol + kasa + 2.5} x2={icSag} y2={ustSol + kasa + 2.5}
            stroke={renk.koyu} strokeWidth="0.9" opacity="0.55" />
          <line x1={icX} y1={ustSol + kasa + 5} x2={icSag} y2={ustSol + kasa + 5}
            stroke={renk.koyu} strokeWidth="0.9" opacity="0.35" />
          <line x1={icX} y1={icAlt - 2.5} x2={icSag} y2={icAlt - 2.5}
            stroke={renk.koyu} strokeWidth="0.9" opacity="0.55" />
          <line x1={icX} y1={icAlt - 5} x2={icSag} y2={icAlt - 5}
            stroke={renk.koyu} strokeWidth="0.9" opacity="0.35" />
        </g>
      )}

      {/* ---------- DİKEY ORTA KAYITLAR ---------- */}
      {bolmeler.slice(0, -1).map((b) => {
        const kx = b.bx + b.bw;
        const yUst = isAcili ? Math.min(g.ustY(kx), g.ustY(kx + kayit)) + kasa : ustSol + kasa;
        return (
          <g key={`k-${b.i}`}>
            <rect x={kx} y={yUst} width={kayit} height={Math.max(0, icAlt - yUst)}
              fill="url(#ewProfil)" stroke={renk.koyu} strokeWidth="0.9" />
            <line x1={kx + kayit / 2} y1={yUst} x2={kx + kayit / 2} y2={icAlt}
              stroke={renk.koyu} strokeWidth="0.4" opacity="0.4" />
          </g>
        );
      })}

      {/* ---------- BÖLMELER ---------- */}
      {bolmeler.map((b) => {
        if (b.cw <= 1 || b.ch <= 1) return null;
        const telVar = sineklikIste && b.acilirMi;
        const lambiriBurada = lambiriVar && isKapi && b.enineVarBurada;

        return (
          <g key={b.i}>
            {/* kanat profili */}
            {b.acilirMi && (
              <>
                <rect x={b.kx} y={b.ky} width={b.kw} height={b.kh}
                  fill="url(#ewProfil)" stroke={renk.koyu} strokeWidth="1" />
                <path d={gonye(b.kx, b.ky, b.kw, b.kh, g.kanat)}
                  stroke={renk.koyu} strokeWidth="0.6" opacity="0.58" fill="none" />
              </>
            )}

            {/* üst cam */}
            <Cam
              x={b.cx} y={b.cy} w={b.cw} h={b.ustCamH} tel={telVar}
              etiket={camEtiketi(b.i + 1, b.enineVarBurada ? 'üst' : 'tek')}
            />

            {/* enine kayıt + alt bölge */}
            {b.enineVarBurada && (
              <>
                <rect x={b.cx} y={eksenY - kayit / 2} width={b.cw} height={kayit}
                  fill="url(#ewProfil)" stroke={renk.koyu} strokeWidth="0.9" />
                {lambiriBurada
                  ? <Lambiri x={b.cx} y={b.altCamY} w={b.cw} h={b.altCamH} />
                  : <Cam x={b.cx} y={b.altCamY} w={b.cw} h={b.altCamH} tel={telVar}
                      etiket={camEtiketi(b.i + 1, 'alt')} />}
              </>
            )}

            {/* ---------- AÇILIM SEMBOLLERİ ---------- */}
            {isSurgulu ? (
              /* sürgülüde yatay kayma oku */
              b.acilirMi && b.cw > 40 && (
                <g>
                  <line
                    x1={b.cx + b.cw * 0.2} y1={b.cy + b.ustCamH / 2}
                    x2={b.cx + b.cw * 0.8} y2={b.cy + b.ustCamH / 2}
                    stroke="#2c6fb5" strokeWidth="1.5"
                    markerEnd="url(#ewOk)" markerStart="url(#ewOkGeri)"
                  />
                  <text
                    x={b.cx + b.cw / 2} y={b.cy + b.ustCamH / 2 - 8}
                    textAnchor="middle" fontSize="8.5" fill="#2c6fb5"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    SÜRGÜ
                  </text>
                </g>
              )
            ) : (
              <>
                {(b.acilim === 'sag' || b.acilim === 'cift_sag') && (
                  <path
                    d={`M${b.cx + 1} ${b.cy + 1} L${b.cx + b.cw - 1} ${b.cy + b.ustCamH / 2} L${b.cx + 1} ${b.cy + b.ustCamH - 1}`}
                    stroke="#2c6fb5" strokeWidth="0.9" strokeDasharray="5 3" fill="none" opacity="0.9" />
                )}
                {(b.acilim === 'sol' || b.acilim === 'cift_sol') && (
                  <path
                    d={`M${b.cx + b.cw - 1} ${b.cy + 1} L${b.cx + 1} ${b.cy + b.ustCamH / 2} L${b.cx + b.cw - 1} ${b.cy + b.ustCamH - 1}`}
                    stroke="#2c6fb5" strokeWidth="0.9" strokeDasharray="5 3" fill="none" opacity="0.9" />
                )}
                {USTTEN_ACILIR.includes(b.acilim) && (
                  <path
                    d={`M${b.cx + 1} ${b.cy + b.ustCamH - 1} L${b.cx + b.cw / 2} ${b.cy + 1} L${b.cx + b.cw - 1} ${b.cy + b.ustCamH - 1}`}
                    stroke="#2c6fb5" strokeWidth="0.9" strokeDasharray="5 3" fill="none" opacity="0.9" />
                )}
              </>
            )}

            {/* ---------- MENTEŞELER (sürgülüde yok) ---------- */}
            {!isSurgulu && YANA_ACILIR.includes(b.acilim) && (() => {
              const solda = MENTESE_SOLDA.includes(b.acilim);
              const mx = solda ? b.kx - 1.5 : b.kx + b.kw - 2.5;
              const adet = b.kh > 150 ? 3 : 2;
              return Array.from({ length: adet }).map((_, k) => {
                const oran = adet === 3 ? [0.12, 0.5, 0.88][k] : [0.17, 0.83][k];
                const my = b.ky + b.kh * oran - 6;
                return (
                  <g key={`m${k}`}>
                    <rect x={mx} y={my} width="4.5" height="12" rx="1.6"
                      fill="#8d959f" stroke="#5c6672" strokeWidth="0.5" />
                    <circle cx={mx + 2.25} cy={my + 6} r="1" fill="#4a545f" />
                  </g>
                );
              });
            })()}

            {/* ---------- KOL ---------- */}
            {b.acilim === 'vasistas' && !isSurgulu && (
              <rect x={b.kx + b.kw / 2 - 7} y={b.ky + b.kh - 3.5} width="14" height="4.5" rx="1.8"
                fill="#9aa2ac" stroke="#5c6672" strokeWidth="0.5" />
            )}
            {isSurgulu && b.acilirMi && (() => {
              const solda = MENTESE_SOLDA.includes(b.acilim);
              const kolX = solda ? b.kx + b.kw - 4 : b.kx;
              const kolY = b.ky + b.kh * 0.5;
              return (
                <rect x={kolX} y={kolY - 9} width="4" height="18" rx="1.8"
                  fill="#9aa2ac" stroke="#5c6672" strokeWidth="0.5" />
              );
            })()}
            {!isSurgulu && YANA_ACILIR.includes(b.acilim) && (() => {
              const solda = MENTESE_SOLDA.includes(b.acilim);
              const kolX = solda ? b.kx + b.kw - 3.5 : b.kx - 1;
              const kolY = b.enineVarBurada
                ? Math.max(b.ky + 14, eksenY - kayit / 2 - 16)
                : b.ky + b.kh * (isKapi ? 0.52 : 0.5);
              const yon = solda ? 1 : -1;
              return (
                <g>
                  <rect x={kolX} y={kolY - 7} width="4.5" height="14" rx="1.6"
                    fill="#9aa2ac" stroke="#5c6672" strokeWidth="0.5" />
                  <rect x={solda ? kolX + 3.5 : kolX - 11} y={kolY - 1.6}
                    width="11" height="3.4" rx="1.6" fill="#aab2bc" stroke="#5c6672" strokeWidth="0.5"
                    transform={`rotate(${yon * 16} ${solda ? kolX + 3.5 : kolX + 4.5} ${kolY})`} />
                </g>
              );
            })()}
          </g>
        );
      })}

      {/* ================= ÖLÇÜ ÇİZGİLERİ ================= */}
      {olcuGoster && (
        <>
          {/* ara ölçüler — eksen bazlı, toplamı toplam ene eşit */}
          {n > 1 && (() => {
            const sinirlar = [X];
            bolmeler.slice(0, -1).forEach((b) => sinirlar.push(b.bx + b.bw + kayit / 2));
            sinirlar.push(X + W);
            const parcalar = [];
            let toplam = 0;
            for (let i = 0; i < sinirlar.length - 1; i++) {
              const d = Math.round((sinirlar[i + 1] - sinirlar[i]) / olcek);
              toplam += d;
              parcalar.push({ x1: sinirlar[i], x2: sinirlar[i + 1], mm: d });
            }
            if (parcalar.length) parcalar[parcalar.length - 1].mm += (mmEn - toplam);

            return parcalar.map((a, i) => (
              <g key={`ao${i}`} stroke="#94a1b2" strokeWidth="0.8">
                <line x1={a.x1} y1={alt + 21} x2={a.x2} y2={alt + 21} />
                <line x1={a.x1} y1={alt + 16} x2={a.x1} y2={alt + 26} />
                <line x1={a.x2} y1={alt + 16} x2={a.x2} y2={alt + 26} />
                <rect x={(a.x1 + a.x2) / 2 - 21} y={alt + 13} width="42" height="15" fill="#fff" stroke="none" />
                <text x={(a.x1 + a.x2) / 2} y={alt + 24.5} textAnchor="middle" fontSize="9.5"
                  fill="#54637a" stroke="none" fontFamily="'JetBrains Mono', monospace">{a.mm}</text>
              </g>
            ));
          })()}

          {/* toplam genişlik */}
          {(() => {
            const yb = alt + (n > 1 ? 48 : 30);
            return (
              <>
                <g stroke="#3d4b60">
                  <line x1={X} y1={alt + 8} x2={X} y2={yb + 6} strokeWidth="0.5" opacity="0.5" />
                  <line x1={X + W} y1={alt + 8} x2={X + W} y2={yb + 6} strokeWidth="0.5" opacity="0.5" />
                  <line x1={X} y1={yb} x2={X + W} y2={yb} strokeWidth="0.9" />
                  <line x1={X - 4} y1={yb + 4} x2={X + 4} y2={yb - 4} strokeWidth="0.9" />
                  <line x1={X + W - 4} y1={yb + 4} x2={X + W + 4} y2={yb - 4} strokeWidth="0.9" />
                </g>
                <rect x={X + W / 2 - 34} y={yb - 13} width="68" height="17" fill="#fff" />
                <text x={X + W / 2} y={yb + 0.5} textAnchor="middle" fontSize="12"
                  fill="#16273d" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{mmEn}</text>
              </>
            );
          })()}

          {/* dikey ara ölçüler (enine kayıt varsa) */}
          {enineAktif && (
            <g stroke="#94a1b2" strokeWidth="0.8">
              <line x1={X + W + 22} y1={ustSol} x2={X + W + 22} y2={eksenY} />
              <line x1={X + W + 17} y1={ustSol} x2={X + W + 27} y2={ustSol} />
              <line x1={X + W + 17} y1={eksenY} x2={X + W + 27} y2={eksenY} />
              <rect x={X + W + 14} y={(ustSol + eksenY) / 2 - 21} width="16" height="42" fill="#fff" stroke="none" />
              <text x={X + W + 22} y={(ustSol + eksenY) / 2} textAnchor="middle" fontSize="9.5"
                fill="#54637a" stroke="none" fontFamily="'JetBrains Mono', monospace"
                transform={`rotate(-90 ${X + W + 22} ${(ustSol + eksenY) / 2})`}>
                {mm(eksenY - ustSol)}
              </text>

              <line x1={X + W + 22} y1={eksenY} x2={X + W + 22} y2={alt} />
              <line x1={X + W + 17} y1={alt} x2={X + W + 27} y2={alt} />
              <rect x={X + W + 14} y={(eksenY + alt) / 2 - 21} width="16" height="42" fill="#fff" stroke="none" />
              <text x={X + W + 22} y={(eksenY + alt) / 2} textAnchor="middle" fontSize="9.5"
                fill="#54637a" stroke="none" fontFamily="'JetBrains Mono', monospace"
                transform={`rotate(-90 ${X + W + 22} ${(eksenY + alt) / 2})`}>
                {mm(alt - eksenY)}
              </text>
            </g>
          )}

          {/* toplam yükseklik (sol) */}
          <g stroke="#3d4b60">
            <line x1={X - 8} y1={ustSol} x2={X - 42} y2={ustSol} strokeWidth="0.5" opacity="0.5" />
            <line x1={X - 8} y1={alt} x2={X - 42} y2={alt} strokeWidth="0.5" opacity="0.5" />
            <line x1={X - 36} y1={ustSol} x2={X - 36} y2={alt} strokeWidth="0.9" />
            <line x1={X - 40} y1={ustSol + 4} x2={X - 32} y2={ustSol - 4} strokeWidth="0.9" />
            <line x1={X - 40} y1={alt + 4} x2={X - 32} y2={alt - 4} strokeWidth="0.9" />
          </g>
          <rect x={X - 45} y={(ustSol + alt) / 2 - 34} width="18" height="68" fill="#fff" />
          <text x={X - 36} y={(ustSol + alt) / 2} textAnchor="middle" fontSize="12"
            fill="#16273d" fontWeight="700" fontFamily="'JetBrains Mono', monospace"
            transform={`rotate(-90 ${X - 36} ${(ustSol + alt) / 2})`}>{mmSol}</text>

          {/* açılı pencerede sağ yükseklik ayrıca yazılır */}
          {isAcili && (
            <>
              <g stroke="#3d4b60">
                <line x1={X + W + 8} y1={ustSag} x2={X + W + 44} y2={ustSag} strokeWidth="0.5" opacity="0.5" />
                <line x1={X + W + 8} y1={alt} x2={X + W + 44} y2={alt} strokeWidth="0.5" opacity="0.5" />
                <line x1={X + W + 38} y1={ustSag} x2={X + W + 38} y2={alt} strokeWidth="0.9" />
                <line x1={X + W + 34} y1={ustSag + 4} x2={X + W + 42} y2={ustSag - 4} strokeWidth="0.9" />
                <line x1={X + W + 34} y1={alt + 4} x2={X + W + 42} y2={alt - 4} strokeWidth="0.9" />
              </g>
              <rect x={X + W + 29} y={(ustSag + alt) / 2 - 34} width="18" height="68" fill="#fff" />
              <text x={X + W + 38} y={(ustSag + alt) / 2} textAnchor="middle" fontSize="12"
                fill="#16273d" fontWeight="700" fontFamily="'JetBrains Mono', monospace"
                transform={`rotate(-90 ${X + W + 38} ${(ustSag + alt) / 2})`}>{mmSag}</text>
            </>
          )}
        </>
      )}

      {/* ================= TEKNİK ETİKET ================= */}
      {etiketGoster && (
      <g>
        <line x1={TW - 220} y1={TH - 44} x2={TW - 12} y2={TH - 44} stroke="#c8d3e0" strokeWidth="0.9" />
        <text x={TW - 12} y={TH - 31} textAnchor="end" fontSize="8.8" fill="#7d8b9e"
          fontFamily="'JetBrains Mono', monospace">
          {urunTipiAdi(urunTipi)} · {n} BÖLME{enineAktif ? ' · ENİNE KAYIT' : ''} · UPVC {pay.seri}mm
        </text>
        <text x={TW - 12} y={TH - 19.5} textAnchor="end" fontSize="8.8" fill="#7d8b9e"
          fontFamily="'JetBrains Mono', monospace">
          {renk.ad.toUpperCase()}
          {kanatlar.some((k) => k === 'cift_sag' || k === 'cift_sol') ? ' · ÇİFT AÇILIM' : ''}
          {sineklikIste ? ' · SİNEKLİK' : ''}
          {lambiriVar && isKapi ? (lambiriYonu === 'dikey' ? ' · LAMBİRİ (DİKEY)' : ' · LAMBİRİ (YATAY)') : ''}
        </text>
        <text x={TW - 12} y={TH - 8} textAnchor="end" fontSize="8.2" fill="#a9b5c4"
          fontFamily="'JetBrains Mono', monospace">
          ÖLÇÜLER mm · DIŞTAN GÖRÜNÜŞ · ÖLÇEK 1:{Math.max(1, Math.round(1 / olcek))}
        </text>
      </g>
      )}
    </svg>
  );
}

function urunTipiAdi(t) {
  const s = {
    pencere: 'PENCERE',
    kapi: 'KAPI',
    wc_kapi: 'WC / BANYO KAPISI',
    balkonkapi: 'BALKON KAPISI',
    fransiz: 'FRANSIZ BALKON',
    surgulu: 'SÜRGÜLÜ SİSTEM',
    acili: 'AÇILI PENCERE',
  };
  return s[t] || 'DOĞRAMA';
}
