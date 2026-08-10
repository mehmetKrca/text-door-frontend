import React, { useState, useMemo } from 'react';

/* ============================================================
   PROFİL RENKLERİ
   ============================================================ */
const RENKLER = [
  { id: 'beyaz', ad: 'Klasik Beyaz', yuz: '#f2f4f7', kenar: '#c3cad4', koyu: '#9aa4b2', isik: '#ffffff' },
  { id: 'antrasit', ad: 'Antrasit Gri', yuz: '#454d57', kenar: '#2b3138', koyu: '#1d2228', isik: '#5d6773' },
  { id: 'mese', ad: 'Altın Meşe', yuz: '#a8792f', kenar: '#7c5720', koyu: '#5f4318', isik: '#c49546' },
];

/* ============================================================
   AÇILIM TİPLERİ
   ============================================================ */
const ACILIM_ADLARI = {
  sabit: 'Sabit',
  sag: 'Sağa Açılır',
  sol: 'Sola Açılır',
  vasistas: 'Vasistas (Üstten)',
  sagCift: 'Sağa Çift Açılım',
  solCift: 'Sola Çift Açılım',
};

const MENTESE_SOLDA = ['sag', 'sagCift'];
const YANA_ACILIR = ['sag', 'sol', 'sagCift', 'solCift'];
const USTTEN_ACILIR = ['vasistas', 'sagCift', 'solCift'];

/* ============================================================
   ŞABLONLAR
   ============================================================ */
const SABLONLAR = [
  {
    id: 'wc', ad: 'WC / Banyo Kapısı', en: 700, boy: 2000, bolme: 1, tip: 'kapi',
    acilim: ['sag'], lambiri: true, yatay: true, kayitMM: 1400,
  },
  {
    id: 'mutfak', ad: 'Mutfak Penceresi', en: 1500, boy: 1200, bolme: 2, tip: 'pencere',
    acilim: ['sabit', 'sagCift'], lambiri: false, yatay: false, kayitMM: 600,
  },
  {
    id: 'balkon', ad: 'Balkon Kapısı', en: 800, boy: 2100, bolme: 1, tip: 'kapi',
    acilim: ['sol'], lambiri: true, yatay: true, kayitMM: 900,
  },
  {
    id: 'fransiz', ad: 'Fransız Balkon', en: 900, boy: 2200, bolme: 1, tip: 'kapi',
    acilim: ['sag'], lambiri: false, yatay: false, kayitMM: 900,
  },
  {
    id: 'salon', ad: 'Salon (3 Bölme)', en: 2400, boy: 1600, bolme: 3, tip: 'pencere',
    acilim: ['sol', 'sabit', 'sagCift'], lambiri: false, yatay: false, kayitMM: 700,
  },
  {
    id: 'vitrin', ad: 'Vitrin + Vasistas', en: 1800, boy: 2400, bolme: 2, tip: 'pencere',
    acilim: ['sabit', 'sabit'], lambiri: false, yatay: true, kayitMM: 1900,
  },
];

/* ============================================================
   ÇİZİM MOTORU
   ============================================================ */
function Dograma({ en, boy, bolmeSayisi, acilimlar, renk, tip, lambiri, sineklik, yatayKayit, kayitYuksekligi }) {
  const TUVAL_W = 700;
  const TUVAL_H = 450;

  const g = useMemo(() => {
    const mmEn = Math.min(Math.max(Number(en) || 300, 300), 6000);
    const mmBoy = Math.min(Math.max(Number(boy) || 300, 300), 3500);

    const alanW = TUVAL_W - 190;
    const alanH = TUVAL_H - 140;
    const olcek = Math.min(alanW / mmEn, alanH / mmBoy);

    const W = mmEn * olcek;
    const H = mmBoy * olcek;
    const X = 96 + (alanW - W) / 2;
    const Y = 32 + (alanH - H) / 2;

    // profil kalınlıkları (mm)
    const KASA_MM = 62, KANAT_MM = 74, KAYIT_MM = 90, CITA_MM = 16, CONTA_MM = 6;

    const kasa = Math.max(6, KASA_MM * olcek);
    const kanat = Math.max(5, KANAT_MM * olcek);
    const kayit = Math.max(6, KAYIT_MM * olcek);
    const cita = Math.max(2, CITA_MM * olcek);
    const conta = Math.max(1.2, CONTA_MM * olcek);

    const icX = X + kasa, icY = Y + kasa;
    const icW = W - kasa * 2, icH = H - kasa * 2;

    const n = Math.max(1, Math.min(4, Number(bolmeSayisi) || 1));
    const bolmeW = (icW - kayit * (n - 1)) / n;

    // --- enine (yatay) kayıt ekseni: alttan ölçülür ---
    const enineAktif = !!yatayKayit || !!(lambiri && tip === 'kapi');
    const istenenMM = Math.min(Math.max(Number(kayitYuksekligi) || 900, 250), mmBoy - 250);
    const eksenY = Y + H - istenenMM * olcek;
    const yatayBand = { ust: eksenY - kayit / 2, alt: eksenY + kayit / 2 };
    // ölçü zincirinde kullanılacak gerçek mm değerleri
    const altMM = Math.round(istenenMM);
    const ustMM = Math.round(mmBoy - istenenMM);

    // --- dikey kayıt eksenleri (ölçü zinciri için) ---
    const eksenler = [];
    for (let i = 0; i < n - 1; i++) {
      eksenler.push(icX + (i + 1) * bolmeW + i * kayit + kayit / 2);
    }
    // eksen bazlı ara ölçüler → toplamı tam olarak mmEn verir
    const sinirlar = [X, ...eksenler, X + W];
    const araOlculer = [];
    for (let i = 0; i < sinirlar.length - 1; i++) {
      araOlculer.push({
        x1: sinirlar[i],
        x2: sinirlar[i + 1],
        mm: Math.round((sinirlar[i + 1] - sinirlar[i]) / olcek),
      });
    }
    // yuvarlama farkını son ölçüye yaz, toplam tam çıksın
    const toplam = araOlculer.reduce((a, b) => a + b.mm, 0);
    if (araOlculer.length && toplam !== mmEn) {
      araOlculer[araOlculer.length - 1].mm += (mmEn - toplam);
    }

    const bolmeler = [];
    for (let i = 0; i < n; i++) {
      const bx = icX + i * (bolmeW + kayit);
      const acilim = acilimlar[i] || 'sabit';
      const acilirMi = acilim !== 'sabit';

      const kOfset = acilirMi ? conta : 0;
      const kx = bx + kOfset, ky = icY + kOfset;
      const kw = bolmeW - kOfset * 2, kh = icH - kOfset * 2;

      const icPay = acilirMi ? kanat : cita;
      const cx = kx + icPay, cy = ky + icPay;
      const cw = kw - icPay * 2, ch = kh - icPay * 2;

      // enine kayıt bu bölmenin cam alanının içine düşüyor mu?
      const eninePayVar = enineAktif && yatayBand.ust > cy + 12 && yatayBand.alt < cy + ch - 12;

      const ustCam = eninePayVar
        ? { y: cy, h: yatayBand.ust - cy }
        : { y: cy, h: ch };
      const altCam = eninePayVar
        ? { y: yatayBand.alt, h: cy + ch - yatayBand.alt }
        : null;

      bolmeler.push({
        i, acilim, acilirMi, bx, bolmeW,
        kx, ky, kw, kh, cx, cy, cw, ch,
        eninePayVar, ustCam, altCam,
      });
    }

    return {
      mmEn, mmBoy, olcek, W, H, X, Y,
      kasa, kanat, kayit, cita,
      icX, icY, icW, icH, n, bolmeW,
      bolmeler, eksenler, araOlculer,
      enineAktif, yatayBand, eksenY, altMM, ustMM,
    };
  }, [en, boy, bolmeSayisi, acilimlar, lambiri, tip, yatayKayit, kayitYuksekligi]);

  const {
    mmEn, mmBoy, olcek, W, H, X, Y, kasa, kayit,
    icX, icY, icW, icH, n, bolmeW, bolmeler, araOlculer,
    enineAktif, yatayBand, eksenY, altMM, ustMM,
  } = g;

  const kapiMi = tip === 'kapi';
  const lambiriAktif = lambiri && kapiMi;

  // gönye (45°) köşe izleri
  const gonye = (x, y, w, h, t) => [
    `M${x} ${y} L${x + t} ${y + t}`,
    `M${x + w} ${y} L${x + w - t} ${y + t}`,
    `M${x} ${y + h} L${x + t} ${y + h - t}`,
    `M${x + w} ${y + h} L${x + w - t} ${y + h - t}`,
  ].join(' ');

  const mm = (px) => Math.round(px / olcek);

  // tek cam yüzeyi çizen yardımcı
  const CamYuzey = ({ x, y, w, h, tel }) => {
    if (w <= 1 || h <= 1) return null;
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="url(#camG)" />
        <polygon
          points={`${x},${y + h} ${x},${y + h * 0.52} ${x + w * 0.62},${y} ${x + w * 0.24},${y}`}
          fill="url(#yansima)"
        />
        <rect x={x} y={y} width={w} height={h} fill="none" stroke={renk.koyu} strokeWidth="0.8" />
        <rect x={x + 0.9} y={y + 0.9} width={Math.max(0, w - 1.8)} height={Math.max(0, h - 1.8)}
          fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.5" />
        {tel && (
          <>
            <rect x={x} y={y} width={w} height={h} fill="url(#tel)" />
            <rect x={x} y={y} width={w} height={h} fill="none" stroke="#4a545f" strokeWidth="1.4" />
          </>
        )}
        {w > 46 && h > 32 && (
          <g>
            <rect x={x + w / 2 - 29} y={y + h / 2 - 12.5} width="58" height="25" rx="3"
              fill="#ffffff" opacity="0.87" stroke="#c8d3e0" strokeWidth="0.6" />
            <text x={x + w / 2} y={y + h / 2 - 1.5} textAnchor="middle" fontSize="9.2" fill="#28455f"
              fontFamily="'JetBrains Mono', monospace" fontWeight="600">{mm(w)}</text>
            <text x={x + w / 2} y={y + h / 2 + 9} textAnchor="middle" fontSize="9.2" fill="#28455f"
              fontFamily="'JetBrains Mono', monospace" fontWeight="600">× {mm(h)}</text>
          </g>
        )}
      </g>
    );
  };

  // lambiri paneli
  const LambiriPanel = ({ x, y, w, h }) => {
    if (w <= 1 || h <= 6) return null;
    const yivSayisi = Math.max(2, Math.floor(h / 10));
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="url(#profilG)" stroke={renk.koyu} strokeWidth="0.8" />
        {Array.from({ length: yivSayisi }).map((_, li) => {
          const ly = y + (li + 1) * (h / (yivSayisi + 1));
          return (
            <g key={li}>
              <line x1={x + 2} y1={ly} x2={x + w - 2} y2={ly} stroke={renk.koyu} strokeWidth="0.55" opacity="0.7" />
              <line x1={x + 2} y1={ly + 0.9} x2={x + w - 2} y2={ly + 0.9} stroke={renk.isik} strokeWidth="0.5" opacity="0.55" />
            </g>
          );
        })}
        {w > 46 && h > 30 && (
          <g>
            <rect x={x + w / 2 - 29} y={y + h / 2 - 8} width="58" height="16" rx="3"
              fill="#ffffff" opacity="0.9" stroke="#c8d3e0" strokeWidth="0.6" />
            <text x={x + w / 2} y={y + h / 2 + 3.5} textAnchor="middle" fontSize="8.6" fill="#54637a"
              fontFamily="'JetBrains Mono', monospace" fontWeight="600">
              LAMBİRİ {mm(h)}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${TUVAL_W} ${TUVAL_H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="camG" x1="0" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor="#dff0fb" />
          <stop offset="42%" stopColor="#c3dff2" />
          <stop offset="70%" stopColor="#d9ecf8" />
          <stop offset="100%" stopColor="#b9d8ee" />
        </linearGradient>
        <linearGradient id="yansima" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="profilG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={renk.isik} />
          <stop offset="38%" stopColor={renk.yuz} />
          <stop offset="100%" stopColor={renk.kenar} />
        </linearGradient>
        <pattern id="tel" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 0 H4 M0 2 H4" stroke="#5c6672" strokeWidth="0.45" opacity="0.75" />
          <path d="M0 0 V4 M2 0 V4" stroke="#5c6672" strokeWidth="0.45" opacity="0.75" />
        </pattern>
      </defs>

      {/* ---------- KASA ---------- */}
      <rect x={X} y={Y} width={W} height={H} fill="url(#profilG)" stroke={renk.koyu} strokeWidth="1.1" />
      <rect x={icX} y={icY} width={icW} height={icH} fill="#ffffff" stroke={renk.koyu} strokeWidth="0.9" />
      <path d={gonye(X, Y, W, H, kasa)} stroke={renk.koyu} strokeWidth="0.7" opacity="0.65" fill="none" />

      {/* ---------- DİKEY ORTA KAYITLAR ---------- */}
      {Array.from({ length: n - 1 }).map((_, i) => {
        const kx = icX + (i + 1) * bolmeW + i * kayit;
        return (
          <g key={`dk-${i}`}>
            <rect x={kx} y={icY} width={kayit} height={icH} fill="url(#profilG)" stroke={renk.koyu} strokeWidth="0.9" />
            <line x1={kx + kayit / 2} y1={icY} x2={kx + kayit / 2} y2={icY + icH}
              stroke={renk.koyu} strokeWidth="0.4" opacity="0.4" />
          </g>
        );
      })}

      {/* ---------- BÖLMELER ---------- */}
      {bolmeler.map((b) => {
        if (b.cw <= 1 || b.ch <= 1) return null;
        const telVar = sineklik && b.acilirMi;

        return (
          <g key={b.i}>
            {/* kanat profili */}
            {b.acilirMi && (
              <>
                <rect x={b.kx} y={b.ky} width={b.kw} height={b.kh} fill="url(#profilG)" stroke={renk.koyu} strokeWidth="1" />
                <path d={gonye(b.kx, b.ky, b.kw, b.kh, g.kanat)} stroke={renk.koyu} strokeWidth="0.6" opacity="0.6" fill="none" />
              </>
            )}

            {/* üst cam */}
            <CamYuzey x={b.cx} y={b.ustCam.y} w={b.cw} h={b.ustCam.h} tel={telVar} />

            {/* enine kayıt + alt bölge */}
            {b.eninePayVar && b.altCam && (
              <>
                <rect x={b.cx} y={yatayBand.ust} width={b.cw} height={kayit}
                  fill="url(#profilG)" stroke={renk.koyu} strokeWidth="0.9" />
                <line x1={b.cx} y1={eksenY} x2={b.cx + b.cw} y2={eksenY}
                  stroke={renk.koyu} strokeWidth="0.4" opacity="0.4" />

                {lambiriAktif
                  ? <LambiriPanel x={b.cx} y={b.altCam.y} w={b.cw} h={b.altCam.h} />
                  : <CamYuzey x={b.cx} y={b.altCam.y} w={b.cw} h={b.altCam.h} tel={telVar} />}
              </>
            )}

            {/* açılım sembolleri — tepe noktası KOL tarafını gösterir */}
            {(b.acilim === 'sag' || b.acilim === 'sagCift') && (
              <path
                d={`M${b.cx + 1} ${b.ustCam.y + 1} L${b.cx + b.cw - 1} ${b.ustCam.y + b.ustCam.h / 2} L${b.cx + 1} ${b.ustCam.y + b.ustCam.h - 1}`}
                stroke="#2c6fb5" strokeWidth="0.9" strokeDasharray="5 3" fill="none" opacity="0.9" />
            )}
            {(b.acilim === 'sol' || b.acilim === 'solCift') && (
              <path
                d={`M${b.cx + b.cw - 1} ${b.ustCam.y + 1} L${b.cx + 1} ${b.ustCam.y + b.ustCam.h / 2} L${b.cx + b.cw - 1} ${b.ustCam.y + b.ustCam.h - 1}`}
                stroke="#2c6fb5" strokeWidth="0.9" strokeDasharray="5 3" fill="none" opacity="0.9" />
            )}
            {USTTEN_ACILIR.includes(b.acilim) && (
              <path
                d={`M${b.cx + 1} ${b.ustCam.y + b.ustCam.h - 1} L${b.cx + b.cw / 2} ${b.ustCam.y + 1} L${b.cx + b.cw - 1} ${b.ustCam.y + b.ustCam.h - 1}`}
                stroke="#2c6fb5" strokeWidth="0.9" strokeDasharray="5 3" fill="none" opacity="0.9" />
            )}

            {/* menteşeler */}
            {YANA_ACILIR.includes(b.acilim) && (() => {
              const solda = MENTESE_SOLDA.includes(b.acilim);
              const mx = solda ? b.kx - 1.5 : b.kx + b.kw - 2.5;
              const adet = b.kh > 150 ? 3 : 2;
              return Array.from({ length: adet }).map((_, mi) => {
                const oran = adet === 3 ? [0.12, 0.5, 0.88][mi] : [0.17, 0.83][mi];
                const my = b.ky + b.kh * oran - 6;
                return (
                  <g key={`m-${mi}`}>
                    <rect x={mx} y={my} width="4.5" height="12" rx="1.6" fill="#8d959f" stroke="#5c6672" strokeWidth="0.5" />
                    <circle cx={mx + 2.25} cy={my + 6} r="1" fill="#4a545f" />
                  </g>
                );
              });
            })()}

            {/* kol */}
            {b.acilim === 'vasistas' && (
              <rect x={b.kx + b.kw / 2 - 7} y={b.ky + b.kh - 3.5} width="14" height="4.5" rx="1.8"
                fill="#9aa2ac" stroke="#5c6672" strokeWidth="0.5" />
            )}
            {YANA_ACILIR.includes(b.acilim) && (() => {
              const solda = MENTESE_SOLDA.includes(b.acilim);
              const kolX = solda ? b.kx + b.kw - 3.5 : b.kx - 1;
              // enine kayıt varsa kol kayıdın hemen üstünde (gerçek montaj)
              const kolY = b.eninePayVar
                ? Math.max(b.ky + 14, yatayBand.ust - 16)
                : b.ky + b.kh * (kapiMi ? 0.52 : 0.5);
              const yon = solda ? 1 : -1;
              return (
                <g>
                  <rect x={kolX} y={kolY - 7} width="4.5" height="14" rx="1.6" fill="#9aa2ac" stroke="#5c6672" strokeWidth="0.5" />
                  <rect
                    x={solda ? kolX + 3.5 : kolX - 11} y={kolY - 1.6}
                    width="11" height="3.4" rx="1.6" fill="#aab2bc" stroke="#5c6672" strokeWidth="0.5"
                    transform={`rotate(${yon * 16} ${solda ? kolX + 3.5 : kolX + 4.5} ${kolY})`} />
                </g>
              );
            })()}
          </g>
        );
      })}

      {/* ================= ÖLÇÜ ÇİZGİLERİ ================= */}

      {/* --- ara ölçüler (eksen bazlı, toplamı = toplam en) --- */}
      {n > 1 && araOlculer.map((a, i) => (
        <g key={`ao-${i}`} stroke="#94a1b2" strokeWidth="0.8">
          <line x1={a.x1} y1={Y + H + 21} x2={a.x2} y2={Y + H + 21} />
          <line x1={a.x1} y1={Y + H + 16} x2={a.x1} y2={Y + H + 26} />
          <line x1={a.x2} y1={Y + H + 16} x2={a.x2} y2={Y + H + 26} />
          <rect x={(a.x1 + a.x2) / 2 - 21} y={Y + H + 13} width="42" height="15" fill="#ffffff" stroke="none" />
          <text x={(a.x1 + a.x2) / 2} y={Y + H + 24.5} textAnchor="middle" fontSize="9.5"
            fill="#54637a" stroke="none" fontFamily="'JetBrains Mono', monospace">{a.mm}</text>
        </g>
      ))}

      {/* --- toplam genişlik --- */}
      {(() => {
        const yBase = Y + H + (n > 1 ? 48 : 30);
        return (
          <>
            <g stroke="#3d4b60">
              <line x1={X} y1={Y + H + 8} x2={X} y2={yBase + 6} strokeWidth="0.5" opacity="0.5" />
              <line x1={X + W} y1={Y + H + 8} x2={X + W} y2={yBase + 6} strokeWidth="0.5" opacity="0.5" />
              <line x1={X} y1={yBase} x2={X + W} y2={yBase} strokeWidth="0.9" />
              <line x1={X - 4} y1={yBase + 4} x2={X + 4} y2={yBase - 4} strokeWidth="0.9" />
              <line x1={X + W - 4} y1={yBase + 4} x2={X + W + 4} y2={yBase - 4} strokeWidth="0.9" />
            </g>
            <rect x={X + W / 2 - 34} y={yBase - 13} width="68" height="17" fill="#ffffff" />
            <text x={X + W / 2} y={yBase + 0.5} textAnchor="middle" fontSize="12" fill="#16273d"
              fontWeight="700" fontFamily="'JetBrains Mono', monospace">{mmEn}</text>
          </>
        );
      })()}

      {/* --- dikey ara ölçüler (enine kayıt varsa) --- */}
      {enineAktif && (
        <g stroke="#94a1b2" strokeWidth="0.8">
          {/* üst parça */}
          <line x1={X + W + 22} y1={Y} x2={X + W + 22} y2={eksenY} />
          <line x1={X + W + 17} y1={Y} x2={X + W + 27} y2={Y} />
          <line x1={X + W + 17} y1={eksenY} x2={X + W + 27} y2={eksenY} />
          <rect x={X + W + 14} y={(Y + eksenY) / 2 - 21} width="16" height="42" fill="#ffffff" stroke="none" />
          <text x={X + W + 22} y={(Y + eksenY) / 2} textAnchor="middle" fontSize="9.5" fill="#54637a"
            stroke="none" fontFamily="'JetBrains Mono', monospace"
            transform={`rotate(-90 ${X + W + 22} ${(Y + eksenY) / 2})`}>{ustMM}</text>

          {/* alt parça */}
          <line x1={X + W + 22} y1={eksenY} x2={X + W + 22} y2={Y + H} />
          <line x1={X + W + 17} y1={Y + H} x2={X + W + 27} y2={Y + H} />
          <rect x={X + W + 14} y={(eksenY + Y + H) / 2 - 21} width="16" height="42" fill="#ffffff" stroke="none" />
          <text x={X + W + 22} y={(eksenY + Y + H) / 2} textAnchor="middle" fontSize="9.5" fill="#54637a"
            stroke="none" fontFamily="'JetBrains Mono', monospace"
            transform={`rotate(-90 ${X + W + 22} ${(eksenY + Y + H) / 2})`}>{altMM}</text>
        </g>
      )}

      {/* --- toplam yükseklik --- */}
      <g stroke="#3d4b60">
        <line x1={X - 8} y1={Y} x2={X - 42} y2={Y} strokeWidth="0.5" opacity="0.5" />
        <line x1={X - 8} y1={Y + H} x2={X - 42} y2={Y + H} strokeWidth="0.5" opacity="0.5" />
        <line x1={X - 36} y1={Y} x2={X - 36} y2={Y + H} strokeWidth="0.9" />
        <line x1={X - 40} y1={Y + 4} x2={X - 32} y2={Y - 4} strokeWidth="0.9" />
        <line x1={X - 40} y1={Y + H + 4} x2={X - 32} y2={Y + H - 4} strokeWidth="0.9" />
      </g>
      <rect x={X - 45} y={Y + H / 2 - 34} width="18" height="68" fill="#ffffff" />
      <text x={X - 36} y={Y + H / 2} textAnchor="middle" fontSize="12" fill="#16273d" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        transform={`rotate(-90 ${X - 36} ${Y + H / 2})`}>{mmBoy}</text>

      {/* ================= TEKNİK ETİKET ================= */}
      <g>
        <line x1={TUVAL_W - 210} y1={TUVAL_H - 44} x2={TUVAL_W - 12} y2={TUVAL_H - 44}
          stroke="#c8d3e0" strokeWidth="0.9" />
        <text x={TUVAL_W - 12} y={TUVAL_H - 31} textAnchor="end" fontSize="8.8" fill="#7d8b9e"
          fontFamily="'JetBrains Mono', monospace">
          {kapiMi ? 'KAPI' : 'PENCERE'} · {n} BÖLME{enineAktif ? ' · ENİNE KAYIT' : ''} · UPVC 70mm
        </text>
        <text x={TUVAL_W - 12} y={TUVAL_H - 19.5} textAnchor="end" fontSize="8.8" fill="#7d8b9e"
          fontFamily="'JetBrains Mono', monospace">
          {renk.ad.toUpperCase()}
          {acilimlar.some((a) => a === 'sagCift' || a === 'solCift') ? ' · ÇİFT AÇILIM' : ''}
          {sineklik ? ' · SİNEKLİK' : ''}
          {lambiriAktif ? ' · LAMBİRİ' : ''}
        </text>
        <text x={TUVAL_W - 12} y={TUVAL_H - 8} textAnchor="end" fontSize="8.2" fill="#a9b5c4"
          fontFamily="'JetBrains Mono', monospace">
          ÖLÇÜLER mm · DIŞTAN GÖRÜNÜŞ · ÖLÇEK 1:{Math.round(1 / olcek)}
        </text>
      </g>
    </svg>
  );
}

/* ============================================================
   DEMO PANELİ
   ============================================================ */
export default function DogramaDemo() {
  const [sablonId, setSablonId] = useState('mutfak');
  const [en, setEn] = useState(1500);
  const [boy, setBoy] = useState(1200);
  const [bolme, setBolme] = useState(2);
  const [acilimlar, setAcilimlar] = useState(['sabit', 'sagCift']);
  const [renk, setRenk] = useState(RENKLER[0]);
  const [tip, setTip] = useState('pencere');
  const [lambiri, setLambiri] = useState(false);
  const [sineklik, setSineklik] = useState(false);
  const [yatayKayit, setYatayKayit] = useState(false);
  const [kayitYuksekligi, setKayitYuksekligi] = useState(600);

  const sablonSec = (s) => {
    setSablonId(s.id);
    setEn(s.en); setBoy(s.boy); setBolme(s.bolme);
    setTip(s.tip); setLambiri(!!s.lambiri);
    setAcilimlar(s.acilim); setSineklik(false);
    setYatayKayit(!!s.yatay);
    setKayitYuksekligi(s.kayitMM);
  };

  const bolmeDegistir = (n) => {
    setBolme(n);
    setAcilimlar((prev) => {
      const y = [...prev];
      while (y.length < n) y.push(y.length % 2 === 0 ? 'sabit' : 'sag');
      return y.slice(0, n);
    });
  };

  const acilimDegistir = (i, deger) => {
    setAcilimlar((prev) => {
      const y = [...prev];
      y[i] = deger;
      return y;
    });
  };

  // lambiri açılınca enine kayıt zorunlu (kayıt lambirinin bittiği yere gelir)
  const lambiriToggle = () => {
    const yeni = !lambiri;
    setLambiri(yeni);
    if (yeni) setYatayKayit(true);
  };

  // lambiri yüksekliğine göre sektör karşılığı
  const kayitIpucu = useMemo(() => {
    const h = Number(kayitYuksekligi) || 0;
    if (!lambiri || tip !== 'kapi') return null;
    if (h >= 1300) return 'WC / Banyo kapısı ölçüsü';
    if (h >= 700) return 'Balkon kapısı ölçüsü';
    return 'Alçak süpürgelik panel';
  }, [kayitYuksekligi, lambiri, tip]);

  const enineAcik = yatayKayit || (lambiri && tip === 'kapi');

  return (
    <div className="dd">
      <style>{`
        .dd {
          --ink:#0f1a2e; --ink2:#334154; --muted:#5a6880; --faint:#8492a8;
          --line:#e2e9f2; --line2:#cfdae8; --blue:#1f5fd0; --blue-s:#e8f0fd;
          background:#fff; border:1px solid var(--line); border-radius:14px;
          overflow:hidden; box-shadow:0 10px 30px rgba(16,32,64,.06);
          font-family:'Inter',system-ui,sans-serif; color:var(--ink);
        }
        .dd *,.dd *::before,.dd *::after{box-sizing:border-box;}
        .dd-top{display:flex;align-items:center;gap:13px;flex-wrap:wrap;
          padding:14px 18px;border-bottom:1px solid var(--line);background:#f6f9fd;}
        .dd-top-lbl{font-size:12.5px;font-weight:700;color:var(--ink2);}
        .dd-chips{display:flex;gap:7px;flex-wrap:wrap;}
        .dd-chip{padding:7px 13px;border-radius:8px;background:#fff;
          border:1px solid var(--line2);font-size:13px;font-weight:550;
          color:var(--ink2);cursor:pointer;font-family:inherit;transition:all .15s;}
        .dd-chip:hover{border-color:var(--blue);color:var(--blue);}
        .dd-chip.on{background:var(--blue);border-color:var(--blue);color:#fff;}

        .dd-grid{display:grid;grid-template-columns:304px 1fr;}
        .dd-ctrl{padding:18px;border-right:1px solid var(--line);}
        .dd-lbl{display:block;font-size:11px;font-weight:700;letter-spacing:.05em;
          text-transform:uppercase;color:var(--faint);margin:0 0 6px;}
        .dd-blok{margin-bottom:16px;}

        .dd-renkler{display:flex;flex-direction:column;gap:6px;}
        .dd-renk{display:flex;align-items:center;gap:9px;padding:8px 11px;
          border-radius:8px;background:#fff;border:1px solid var(--line2);
          font-size:13px;color:var(--ink2);cursor:pointer;font-family:inherit;
          text-align:left;transition:all .15s;}
        .dd-renk:hover{border-color:var(--blue);}
        .dd-renk.on{border-color:var(--blue);background:var(--blue-s);color:var(--blue);font-weight:600;}
        .dd-sw{width:17px;height:17px;border-radius:4px;border:1px solid;flex-shrink:0;}

        .dd-2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .dd-in{width:100%;padding:10px 11px;border:1px solid var(--line2);
          border-radius:8px;font-size:15.5px;font-weight:600;color:var(--ink);
          font-family:'JetBrains Mono',ui-monospace,monospace;
          font-variant-numeric:tabular-nums;text-align:center;outline:none;}
        .dd-in:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(31,95,208,.13);}

        .dd-4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
        .dd-num{padding:9px 0;border-radius:8px;background:#fff;border:1px solid var(--line2);
          font-size:14.5px;font-weight:650;color:var(--ink2);cursor:pointer;
          font-family:'JetBrains Mono',monospace;}
        .dd-num:hover{border-color:var(--blue);}
        .dd-num.on{background:var(--blue);border-color:var(--blue);color:#fff;}

        .dd-sel{width:100%;padding:8px 10px;border:1px solid var(--line2);
          border-radius:8px;font-size:13px;color:var(--ink);background:#fff;
          font-family:inherit;outline:none;cursor:pointer;}
        .dd-sel:focus{border-color:var(--blue);}
        .dd-sel-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
        .dd-sel-n{width:22px;flex-shrink:0;font-size:11px;color:var(--faint);
          font-family:'JetBrains Mono',monospace;}

        .dd-tog{display:flex;gap:6px;}
        .dd-tgl{flex:1;padding:9px 6px;border-radius:8px;background:#fff;
          border:1px solid var(--line2);font-size:12.2px;font-weight:600;
          color:var(--ink2);cursor:pointer;font-family:inherit;transition:all .15s;}
        .dd-tgl:hover:not(:disabled){border-color:var(--blue);}
        .dd-tgl.on{background:var(--blue);border-color:var(--blue);color:#fff;}
        .dd-tgl:disabled{opacity:.4;cursor:not-allowed;}

        .dd-range{width:100%;accent-color:var(--blue);margin:2px 0 4px;}
        .dd-range-val{display:flex;justify-content:space-between;align-items:baseline;
          font-size:12px;color:var(--muted);}
        .dd-range-val b{font-family:'JetBrains Mono',monospace;font-size:14px;color:var(--ink);}
        .dd-ipucu{font-size:11.5px;color:var(--blue);font-weight:600;margin-top:3px;}

        .dd-kilit{display:flex;gap:8px;align-items:flex-start;padding:10px 11px;
          border-radius:8px;background:#eef4fb;color:var(--muted);
          font-size:12.2px;line-height:1.45;}
        .dd-kilit svg{flex-shrink:0;margin-top:1px;}

        .dd-tuval{padding:18px;display:flex;align-items:center;justify-content:center;
          background:linear-gradient(#eef2f7 1px,transparent 1px) 0 0/24px 24px,
            linear-gradient(90deg,#eef2f7 1px,transparent 1px) 0 0/24px 24px,#fff;}

        @media (max-width:980px){
          .dd-grid{grid-template-columns:1fr;}
          .dd-ctrl{border-right:none;border-bottom:1px solid var(--line);}
        }
        @media (max-width:620px){
          .dd-in{font-size:16px;}
          .dd-tuval{padding:10px;}
        }
      `}</style>

      <div className="dd-top">
        <span className="dd-top-lbl">Hazır Şablonlar</span>
        <div className="dd-chips">
          {SABLONLAR.map((s) => (
            <button key={s.id} type="button"
              className={`dd-chip ${sablonId === s.id ? 'on' : ''}`}
              onClick={() => sablonSec(s)}>
              {s.ad}
            </button>
          ))}
        </div>
      </div>

      <div className="dd-grid">
        <div className="dd-ctrl">

          <div className="dd-blok">
            <label className="dd-lbl">Profil Rengi</label>
            <div className="dd-renkler">
              {RENKLER.map((r) => (
                <button key={r.id} type="button"
                  className={`dd-renk ${renk.id === r.id ? 'on' : ''}`}
                  onClick={() => setRenk(r)}>
                  <span className="dd-sw" style={{ background: r.yuz, borderColor: r.kenar }} />
                  {r.ad}
                </button>
              ))}
            </div>
          </div>

          <div className="dd-blok dd-2">
            <div>
              <label className="dd-lbl">Genişlik</label>
              <input className="dd-in" type="number" inputMode="numeric" value={en}
                onChange={(e) => setEn(e.target.value)} />
            </div>
            <div>
              <label className="dd-lbl">Yükseklik</label>
              <input className="dd-in" type="number" inputMode="numeric" value={boy}
                onChange={(e) => setBoy(e.target.value)} />
            </div>
          </div>

          <div className="dd-blok">
            <label className="dd-lbl">Dikey Bölme Sayısı</label>
            <div className="dd-4">
              {[1, 2, 3, 4].map((k) => (
                <button key={k} type="button"
                  className={`dd-num ${bolme === k ? 'on' : ''}`}
                  onClick={() => bolmeDegistir(k)}>{k}</button>
              ))}
            </div>
          </div>

          <div className="dd-blok">
            <label className="dd-lbl">Kanat Açılım Tipleri</label>
            {Array.from({ length: bolme }).map((_, i) => (
              <div className="dd-sel-row" key={i}>
                <span className="dd-sel-n">{i + 1}.</span>
                <select className="dd-sel" value={acilimlar[i] || 'sabit'}
                  onChange={(e) => acilimDegistir(i, e.target.value)}>
                  {Object.entries(ACILIM_ADLARI).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="dd-blok">
            <label className="dd-lbl">Enine Bölme</label>
            <div className="dd-tog">
              <button type="button"
                className={`dd-tgl ${enineAcik ? 'on' : ''}`}
                onClick={() => { setYatayKayit(!yatayKayit); if (yatayKayit) setLambiri(false); }}>
                Orta Kayıt
              </button>
              <button type="button"
                className={`dd-tgl ${lambiri && tip === 'kapi' ? 'on' : ''}`}
                onClick={lambiriToggle}
                disabled={tip !== 'kapi'}
                title={tip !== 'kapi' ? 'Lambiri yalnızca kapılarda kullanılır' : ''}>
                Lambiri
              </button>
              <button type="button"
                className={`dd-tgl ${sineklik ? 'on' : ''}`}
                onClick={() => setSineklik(!sineklik)}>
                Sineklik
              </button>
            </div>
          </div>

          {enineAcik && (
            <div className="dd-blok">
              <label className="dd-lbl">Kayıt Yüksekliği (alttan)</label>
              <input
                className="dd-range" type="range"
                min="250" max={Math.max(300, (Number(boy) || 1200) - 250)} step="10"
                value={kayitYuksekligi}
                onChange={(e) => setKayitYuksekligi(Number(e.target.value))}
              />
              <div className="dd-range-val">
                <span><b>{kayitYuksekligi}</b> mm</span>
                <span>üst: {Math.max(0, (Number(boy) || 0) - kayitYuksekligi)} mm</span>
              </div>
              {kayitIpucu && <div className="dd-ipucu">≈ {kayitIpucu}</div>}
            </div>
          )}

          <div className="dd-kilit">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
              <path d="M5.5 7V5.2a2.5 2.5 0 015 0V7" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            <span>Fiyat hesabı, kesim listesi ve PDF teklif üyelere açıktır.</span>
          </div>
        </div>

        <div className="dd-tuval">
          <Dograma
            en={en} boy={boy} bolmeSayisi={bolme} acilimlar={acilimlar}
            renk={renk} tip={tip} lambiri={lambiri} sineklik={sineklik}
            yatayKayit={yatayKayit} kayitYuksekligi={kayitYuksekligi}
          />
        </div>
      </div>
    </div>
  );
}
