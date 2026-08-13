import React, { useMemo } from 'react';

/**
 * eWindoore — Sineklik / Plise Perde Çizimi
 *
 * Üç ürün gerçekte farklı görünür, o yüzden ayrı çizilir:
 *
 *   menteseliSineklik → çerçeveli, gergin tel, yan menteşeler + kol
 *   surguluSineklik   → üst/alt ray, SABİT BÖLME + kayan kanat, dikey kulp
 *   plisePerde        → kıvırımlı (plise) kumaş, toplama profili, çekme yönü
 *
 * RENK: 3 görsel seçenek (beyaz / antrasit / altın meşe) ama
 * 2 FİYAT KADEMESİ — beyaz kendi başına, diğer ikisi "renkli" sayılır.
 * Müşteri gerçek rengi görür, fiyat doğru kademeden hesaplanır.
 *
 * Tepe (kıvırım) sayısı fiyat motorundan gelir ve çizimde gösterilir —
 * usta kaç kıvırım sayıp keseceğini buradan görür.
 */

export const SINEKLIK_RENKLERI = {
  beyaz: {
    ad: 'Klasik Beyaz', kademe: 'beyaz',
    yuz: '#f2f4f7', kenar: '#c3cad4', koyu: '#9aa4b2', isik: '#ffffff',
  },
  antrasit: {
    ad: 'Antrasit Gri', kademe: 'renkli',
    yuz: '#454d57', kenar: '#2b3138', koyu: '#1d2228', isik: '#5d6773',
  },
  altin_mese: {
    ad: 'Altın Meşe', kademe: 'renkli',
    yuz: '#a8792f', kenar: '#7c5720', koyu: '#5f4318', isik: '#c49546',
  },
};

/** görsel renkten fiyat kademesine çevirir */
export const sineklikRenkKademesi = (renkId) =>
  SINEKLIK_RENKLERI[renkId]?.kademe || 'beyaz';

export default function SineklikCizim({
  tip = 'menteseliSineklik',
  genislik = 800,
  yukseklik = 2000,
  acilimYonu = 'dikey',
  renkId = 'beyaz',
  tepeSayisi = 0,
  adet = 1,
  tuvalGenisligi = 620,
  tuvalYuksekligi = 430,
}) {
  const renk = SINEKLIK_RENKLERI[renkId] || SINEKLIK_RENKLERI.beyaz;
  const isPlise = tip === 'plisePerde';
  const isSurgulu = tip === 'surguluSineklik';
  const isMenteseli = tip === 'menteseliSineklik';

  const g = useMemo(() => {
    const TW = tuvalGenisligi;
    const TH = tuvalYuksekligi;

    const mmEn = Math.min(Math.max(Number(genislik) || 200, 150), 4000);
    const mmBoy = Math.min(Math.max(Number(yukseklik) || 200, 150), 4000);

    const alanW = TW - 175;
    const alanH = TH - 135;
    const olcek = Math.min(alanW / mmEn, alanH / mmBoy);

    const W = mmEn * olcek;
    const H = mmBoy * olcek;
    const X = 92 + (alanW - W) / 2;
    const Y = 30 + (alanH - H) / 2;

    // profil kalınlıkları (mm cinsinden gerçekçi değerler)
    const disKasa = Math.max(6, 32 * olcek);     // sürgülüde dış kasa
    const kanatP = Math.max(5, 26 * olcek);      // kanat profili
    const rayY = Math.max(4, 18 * olcek);        // ray yüksekliği

    return { TW, TH, olcek, mmEn, mmBoy, W, H, X, Y, disKasa, kanatP, rayY };
  }, [genislik, yukseklik, tuvalGenisligi, tuvalYuksekligi]);

  const { TW, TH, olcek, mmEn, mmBoy, W, H, X, Y, disKasa, kanatP, rayY } = g;

  /* Görsel kıvırım sayısı: gerçek tepe 100+ olabilir, o kadar çizgi
     görüntüyü karartır. Makul sayıda çizip gerçek rakamı etikette yazıyoruz. */
  const cizilecekKivrim = useMemo(() => {
    if (!isPlise) return 0;
    const uzunluk = acilimYonu === 'yatay' ? W : H;
    return Math.max(5, Math.min(32, Math.floor(uzunluk / 7)));
  }, [isPlise, acilimYonu, W, H]);

  const tipAdi = {
    menteseliSineklik: 'MENTEŞELİ SİNEKLİK',
    surguluSineklik: 'SÜRGÜLÜ SİNEKLİK',
    plisePerde: 'PLİSE PERDE',
  }[tip] || 'SİNEKLİK';

  /* gönye köşe izleri */
  const gonye = (x, y, w, h, t) => [
    `M${x} ${y} L${x + t} ${y + t}`,
    `M${x + w} ${y} L${x + w - t} ${y + t}`,
    `M${x} ${y + h} L${x + t} ${y + h - t}`,
    `M${x + w} ${y + h} L${x + w - t} ${y + h - t}`,
  ].join(' ');

  /* ---------- MENTEŞE (gerçekçi: gövde + pim + bilezikler) ---------- */
  const Mentese = ({ cx, cy }) => (
    <g>
      {/* kasa kanadı */}
      <rect x={cx - 3.6} y={cy - 9} width="3.4" height="18" rx="1.2"
        fill="#c9ced5" stroke="#6b7480" strokeWidth="0.5" />
      {/* kanat kanadı */}
      <rect x={cx + 0.4} y={cy - 9} width="3.4" height="18" rx="1.2"
        fill="#dfe3e8" stroke="#6b7480" strokeWidth="0.5" />
      {/* pim gövdesi */}
      <rect x={cx - 1.5} y={cy - 11} width="3" height="22" rx="1.5"
        fill="#aab1ba" stroke="#5c6672" strokeWidth="0.5" />
      {/* bilezikler */}
      <line x1={cx - 1.5} y1={cy - 5.5} x2={cx + 1.5} y2={cy - 5.5}
        stroke="#7d8590" strokeWidth="0.7" />
      <line x1={cx - 1.5} y1={cy + 5.5} x2={cx + 1.5} y2={cy + 5.5}
        stroke="#7d8590" strokeWidth="0.7" />
    </g>
  );

  /* ---------- KOL (gerçekçi: taban plakası + kollu sap) ---------- */
  const Kol = ({ x, y, sola = false }) => (
    <g>
      {/* taban plakası */}
      <rect x={x - 3} y={y - 13} width="6.5" height="26" rx="2.6"
        fill="#e2e6ea" stroke="#6b7480" strokeWidth="0.6" />
      {/* vida noktaları */}
      <circle cx={x + 0.25} cy={y - 9} r="0.8" fill="#9aa2ac" />
      <circle cx={x + 0.25} cy={y + 9} r="0.8" fill="#9aa2ac" />
      {/* sap */}
      <rect
        x={sola ? x - 17 : x + 2} y={y - 2.6}
        width="16" height="5.4" rx="2.7"
        fill="#eceff2" stroke="#6b7480" strokeWidth="0.6"
      />
      {/* sap ucu yuvarlaması */}
      <circle cx={sola ? x - 15 : x + 16} cy={y + 0.1} r="2.7"
        fill="#f4f6f8" stroke="#6b7480" strokeWidth="0.6" />
    </g>
  );

  return (
    <svg viewBox={`0 0 ${TW} ${TH}`} width="100%" style={{ display: 'block' }}>
      <defs>
        {/* sineklik teli — ince örgü */}
        <pattern id="skTel" width="3.2" height="3.2" patternUnits="userSpaceOnUse">
          <rect width="3.2" height="3.2" fill="#e9edf1" />
          <path d="M0 0 H3.2 M0 1.6 H3.2" stroke="#6f7b88" strokeWidth="0.45" opacity="0.72" />
          <path d="M0 0 V3.2 M1.6 0 V3.2" stroke="#6f7b88" strokeWidth="0.45" opacity="0.72" />
        </pattern>

        {/* plise kumaşı */}
        <linearGradient id="skKumas" x1="0" y1="0" x2="0.55" y2="1">
          <stop offset="0%" stopColor="#f3efe8" />
          <stop offset="48%" stopColor="#ddd6c9" />
          <stop offset="100%" stopColor="#cbc2b1" />
        </linearGradient>

        {/* profil yüzeyi */}
        <linearGradient id="skProfil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={renk.isik} />
          <stop offset="36%" stopColor={renk.yuz} />
          <stop offset="100%" stopColor={renk.kenar} />
        </linearGradient>

        {/* dikey profiller için yandan ışık */}
        <linearGradient id="skProfilD" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={renk.isik} />
          <stop offset="36%" stopColor={renk.yuz} />
          <stop offset="100%" stopColor={renk.kenar} />
        </linearGradient>

        <marker id="skOk" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0 0 L7 3.5 L0 7 z" fill="#2c6fb5" />
        </marker>
        <marker id="skOkGeri" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
          <path d="M7 0 L0 3.5 L7 7 z" fill="#2c6fb5" />
        </marker>
      </defs>

      {/* ============================================================
          SÜRGÜLÜ — dış kasa + sabit bölme + kayan kanat + raylar
          ============================================================ */}
      {isSurgulu && (() => {
        const kanatW = W * 0.52;          // kayan kanat genişliği
        const icX = X + disKasa;
        const icY = Y + disKasa;
        const icW = W - disKasa * 2;
        const icH = H - disKasa * 2;

        return (
          <g>
            {/* dış kasa */}
            <rect x={X} y={Y} width={W} height={H}
              fill="url(#skProfil)" stroke={renk.koyu} strokeWidth="1.1" />
            <rect x={icX} y={icY} width={icW} height={icH}
              fill="#ffffff" stroke={renk.koyu} strokeWidth="0.8" />
            <path d={gonye(X, Y, W, H, disKasa)}
              stroke={renk.koyu} strokeWidth="0.7" opacity="0.5" fill="none" />

            {/* üst ve alt ray */}
            <rect x={icX} y={icY} width={icW} height={rayY}
              fill="url(#skProfil)" stroke={renk.koyu} strokeWidth="0.8" />
            <line x1={icX} y1={icY + rayY * 0.55} x2={icX + icW} y2={icY + rayY * 0.55}
              stroke={renk.koyu} strokeWidth="0.55" opacity="0.5" />

            <rect x={icX} y={icY + icH - rayY} width={icW} height={rayY}
              fill="url(#skProfil)" stroke={renk.koyu} strokeWidth="0.8" />
            <line x1={icX} y1={icY + icH - rayY * 0.55} x2={icX + icW} y2={icY + icH - rayY * 0.55}
              stroke={renk.koyu} strokeWidth="0.55" opacity="0.5" />

            {/* SABİT BÖLME (sağ) — boş, açıklık */}
            <rect x={icX + kanatW} y={icY + rayY} width={icW - kanatW} height={icH - rayY * 2}
              fill="#fbfcfd" stroke={renk.koyu} strokeWidth="0.6" opacity="0.9" />
            <text
              x={icX + kanatW + (icW - kanatW) / 2} y={icY + icH / 2}
              textAnchor="middle" fontSize="8.5" fill="#a9b5c4"
              fontFamily="'JetBrains Mono', monospace"
            >
              AÇIKLIK
            </text>

            {/* KAYAN KANAT (sol) */}
            <rect x={icX} y={icY + rayY} width={kanatW} height={icH - rayY * 2}
              fill="url(#skProfil)" stroke={renk.koyu} strokeWidth="1" />
            <path d={gonye(icX, icY + rayY, kanatW, icH - rayY * 2, kanatP)}
              stroke={renk.koyu} strokeWidth="0.6" opacity="0.45" fill="none" />

            {/* tel */}
            <rect
              x={icX + kanatP} y={icY + rayY + kanatP}
              width={Math.max(0, kanatW - kanatP * 2)}
              height={Math.max(0, icH - rayY * 2 - kanatP * 2)}
              fill="url(#skTel)" stroke={renk.koyu} strokeWidth="0.7"
            />

            {/* kayma oku */}
            <line
              x1={icX + kanatW * 0.3} y1={icY + icH / 2}
              x2={icX + kanatW + (icW - kanatW) * 0.62} y2={icY + icH / 2}
              stroke="#2c6fb5" strokeWidth="1.5" markerEnd="url(#skOk)" opacity="0.85"
            />

            {/* dikey kulp — kanadın sağ kenarında */}
            <g>
              <rect x={icX + kanatW - 5.5} y={icY + icH / 2 - 15} width="4.5" height="30" rx="2.2"
                fill="#e2e6ea" stroke="#6b7480" strokeWidth="0.6" />
              <rect x={icX + kanatW - 4.6} y={icY + icH / 2 - 9} width="2.7" height="18" rx="1.3"
                fill="#c2c8cf" />
            </g>

            {/* ray etiketleri */}
            <text x={X + W + 8} y={icY + rayY - 1} fontSize="7.5" fill="#8492a8"
              fontFamily="'JetBrains Mono', monospace">RAY</text>
            <text x={X + W + 8} y={icY + icH - 1} fontSize="7.5" fill="#8492a8"
              fontFamily="'JetBrains Mono', monospace">RAY</text>
          </g>
        );
      })()}

      {/* ============================================================
          MENTEŞELİ — çerçeve + gergin tel + menteşe + kol
          ============================================================ */}
      {isMenteseli && (() => {
        const icX = X + kanatP;
        const icY = Y + kanatP;
        const icW = W - kanatP * 2;
        const icH = H - kanatP * 2;

        return (
          <g>
            {/* çerçeve */}
            <rect x={X} y={Y} width={W} height={H}
              fill="url(#skProfil)" stroke={renk.koyu} strokeWidth="1.1" />
            <path d={gonye(X, Y, W, H, kanatP)}
              stroke={renk.koyu} strokeWidth="0.7" opacity="0.5" fill="none" />

            {/* tel */}
            <rect x={icX} y={icY} width={icW} height={icH}
              fill="url(#skTel)" stroke={renk.koyu} strokeWidth="0.8" />
            {/* tel gergi çıtası — iç kenarda ince çizgi */}
            <rect x={icX + 1.2} y={icY + 1.2}
              width={Math.max(0, icW - 2.4)} height={Math.max(0, icH - 2.4)}
              fill="none" stroke={renk.koyu} strokeWidth="0.5" opacity="0.45" />

            {/* açılım oku — tepe kol tarafını gösterir */}
            <path
              d={`M${icX + 4} ${icY + 4} L${icX + icW - 4} ${icY + icH / 2} L${icX + 4} ${icY + icH - 4}`}
              stroke="#2c6fb5" strokeWidth="1" strokeDasharray="6 4"
              fill="none" opacity="0.75"
            />

            {/* menteşeler — sol kenar */}
            {(() => {
              const adetM = H > 150 ? 3 : 2;
              return Array.from({ length: adetM }).map((_, i) => {
                const oran = adetM === 3 ? [0.14, 0.5, 0.86][i] : [0.2, 0.8][i];
                return <Mentese key={i} cx={X} cy={Y + H * oran} />;
              });
            })()}

            {/* kol — sağ kenar, orta yükseklik */}
            <Kol x={X + W} y={Y + H / 2} />
          </g>
        );
      })()}

      {/* ============================================================
          PLİSE PERDE — üst/alt profil + kıvırımlı kumaş
          ============================================================ */}
      {isPlise && (() => {
        const profilK = Math.max(5, 22 * olcek);
        const yatay = acilimYonu === 'yatay';

        // kumaş alanı: kıvırımların yönüne göre profiller kenarlarda
        const kX = yatay ? X + profilK : X;
        const kY = yatay ? Y : Y + profilK;
        const kW = yatay ? W - profilK * 2 : W;
        const kH = yatay ? H : H - profilK * 2;

        return (
          <g>
            {/* kumaş */}
            <rect x={kX} y={kY} width={kW} height={kH} fill="url(#skKumas)" />

            {/* kıvırım çizgileri */}
            {Array.from({ length: cizilecekKivrim }).map((_, i) => {
              if (yatay) {
                const x = kX + ((i + 1) * kW) / (cizilecekKivrim + 1);
                return (
                  <g key={i}>
                    <line x1={x} y1={kY} x2={x} y2={kY + kH}
                      stroke="#a3967f" strokeWidth="0.75" opacity="0.85" />
                    <line x1={x + 1} y1={kY} x2={x + 1} y2={kY + kH}
                      stroke="#fffdf8" strokeWidth="0.75" opacity="0.8" />
                  </g>
                );
              }
              const y = kY + ((i + 1) * kH) / (cizilecekKivrim + 1);
              return (
                <g key={i}>
                  <line x1={kX} y1={y} x2={kX + kW} y2={y}
                    stroke="#a3967f" strokeWidth="0.75" opacity="0.85" />
                  <line x1={kX} y1={y + 1} x2={kX + kW} y2={y + 1}
                    stroke="#fffdf8" strokeWidth="0.75" opacity="0.8" />
                </g>
              );
            })}

            <rect x={kX} y={kY} width={kW} height={kH}
              fill="none" stroke={renk.koyu} strokeWidth="0.7" opacity="0.6" />

            {/* üst/alt (veya sol/sağ) profiller */}
            {yatay ? (
              <>
                <rect x={X} y={Y} width={profilK} height={H}
                  fill="url(#skProfilD)" stroke={renk.koyu} strokeWidth="0.9" />
                <rect x={X + W - profilK} y={Y} width={profilK} height={H}
                  fill="url(#skProfilD)" stroke={renk.koyu} strokeWidth="0.9" />
                {/* çekme kulpu — sağ profilde */}
                <rect x={X + W - profilK + 1} y={Y + H / 2 - 11} width={profilK - 2} height="22" rx="2"
                  fill="#e2e6ea" stroke="#6b7480" strokeWidth="0.5" />
              </>
            ) : (
              <>
                <rect x={X} y={Y} width={W} height={profilK}
                  fill="url(#skProfil)" stroke={renk.koyu} strokeWidth="0.9" />
                <rect x={X} y={Y + H - profilK} width={W} height={profilK}
                  fill="url(#skProfil)" stroke={renk.koyu} strokeWidth="0.9" />
                {/* çekme kulpu — alt profilde */}
                <rect x={X + W / 2 - 11} y={Y + H - profilK + 1} width="22" height={profilK - 2} rx="2"
                  fill="#e2e6ea" stroke="#6b7480" strokeWidth="0.5" />
              </>
            )}

            {/* çekme yönü oku */}
            {yatay ? (
              <line x1={X + W * 0.68} y1={Y + H / 2} x2={X + W * 0.3} y2={Y + H / 2}
                stroke="#2c6fb5" strokeWidth="1.4" markerEnd="url(#skOk)" opacity="0.8" />
            ) : (
              <line x1={X + W / 2} y1={Y + H * 0.3} x2={X + W / 2} y2={Y + H * 0.68}
                stroke="#2c6fb5" strokeWidth="1.4" markerEnd="url(#skOk)" opacity="0.8" />
            )}
          </g>
        );
      })()}

      {/* ================= ÖLÇÜ ÇİZGİLERİ ================= */}

      {/* yatay: genişlik */}
      <g stroke="#3d4b60">
        <line x1={X} y1={Y + H + 8} x2={X} y2={Y + H + 38} strokeWidth="0.5" opacity="0.5" />
        <line x1={X + W} y1={Y + H + 8} x2={X + W} y2={Y + H + 38} strokeWidth="0.5" opacity="0.5" />
        <line x1={X} y1={Y + H + 32} x2={X + W} y2={Y + H + 32} strokeWidth="0.9" />
        <line x1={X - 4} y1={Y + H + 36} x2={X + 4} y2={Y + H + 28} strokeWidth="0.9" />
        <line x1={X + W - 4} y1={Y + H + 36} x2={X + W + 4} y2={Y + H + 28} strokeWidth="0.9" />
      </g>
      <rect x={X + W / 2 - 30} y={Y + H + 20} width="60" height="16" fill="#fff" />
      <text x={X + W / 2} y={Y + H + 32.5} textAnchor="middle" fontSize="11.5"
        fill="#16273d" fontWeight="700" fontFamily="'JetBrains Mono', monospace">
        {mmEn}
      </text>

      {/* dikey: yükseklik */}
      <g stroke="#3d4b60">
        <line x1={X - 8} y1={Y} x2={X - 42} y2={Y} strokeWidth="0.5" opacity="0.5" />
        <line x1={X - 8} y1={Y + H} x2={X - 42} y2={Y + H} strokeWidth="0.5" opacity="0.5" />
        <line x1={X - 36} y1={Y} x2={X - 36} y2={Y + H} strokeWidth="0.9" />
        <line x1={X - 40} y1={Y + 4} x2={X - 32} y2={Y - 4} strokeWidth="0.9" />
        <line x1={X - 40} y1={Y + H + 4} x2={X - 32} y2={Y + H - 4} strokeWidth="0.9" />
      </g>
      <rect x={X - 45} y={Y + H / 2 - 30} width="18" height="60" fill="#fff" />
      <text x={X - 36} y={Y + H / 2} textAnchor="middle" fontSize="11.5"
        fill="#16273d" fontWeight="700" fontFamily="'JetBrains Mono', monospace"
        transform={`rotate(-90 ${X - 36} ${Y + H / 2})`}>
        {mmBoy}
      </text>

      {/* ---------- PLİSE: kıvırım sayısı ---------- */}
      {isPlise && tepeSayisi > 0 && (
        <g>
          <rect x={X + W + 14} y={Y + H / 2 - 27} width="72" height="54" rx="6"
            fill="#f6f9fd" stroke="#c8d3e0" strokeWidth="0.9" />
          <text x={X + W + 50} y={Y + H / 2 - 11} textAnchor="middle" fontSize="7.5"
            fill="#7d8b9e" fontFamily="'JetBrains Mono', monospace">KIVIRIM</text>
          <text x={X + W + 50} y={Y + H / 2 + 8} textAnchor="middle" fontSize="20"
            fill="#1b5e9e" fontWeight="800" fontFamily="'JetBrains Mono', monospace">
            {tepeSayisi}
          </text>
          <text x={X + W + 50} y={Y + H / 2 + 21} textAnchor="middle" fontSize="7.5"
            fill="#7d8b9e" fontFamily="'JetBrains Mono', monospace">TEPE</text>
        </g>
      )}

      {/* ================= TEKNİK ETİKET ================= */}
      <g>
        <line x1={TW - 210} y1={TH - 34} x2={TW - 10} y2={TH - 34}
          stroke="#c8d3e0" strokeWidth="0.9" />
        <text x={TW - 10} y={TH - 21} textAnchor="end" fontSize="8.5" fill="#7d8b9e"
          fontFamily="'JetBrains Mono', monospace">
          {tipAdi} · {renk.ad.toUpperCase()}{adet > 1 ? ` · ${adet} ADET` : ''}
        </text>
        <text x={TW - 10} y={TH - 9} textAnchor="end" fontSize="8" fill="#a9b5c4"
          fontFamily="'JetBrains Mono', monospace">
          {acilimYonu === 'yatay' ? 'YATAY AÇILIM' : 'DİKEY AÇILIM'} · ÖLÇÜLER mm ·
          ÖLÇEK 1:{Math.max(1, Math.round(1 / olcek))}
        </text>
      </g>
    </svg>
  );
}
