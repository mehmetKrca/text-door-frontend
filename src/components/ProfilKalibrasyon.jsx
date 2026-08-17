import React, { useState, useMemo } from 'react';
import {
  PROFIL_SERILERI,
  VARSAYILAN_PROFIL_PAYLARI,
  paylariKalibreEt,
  profilPaylariAl,
} from '../utils/fiyatTablosu.js';

/**
 * eWindoore — Profil Kalibrasyonu
 *
 * NEDEN VAR:
 * Cam ölçüsü profilin görünen yüz genişliklerine ve cam oturma paylarına
 * göre hesaplanır. Bu değerler her markada farklıdır (Winsa, Egepen, Fırat,
 * Adopen, Pimapen...). Katalog aramak yerine usta elindeki BİR pencereyi
 * ölçer, uygulama payları kendisi hesaplar.
 *
 * Ölçüm 5 dakika sürer ve bir kez yapılır. Sonrasında o firmanın bütün
 * cam ölçüleri ve kesim listeleri doğru çıkar.
 */

export default function ProfilKalibrasyon({ tablo, onUygula }) {
  const [seri, setSeri] = useState(70);
  const [olcum, setOlcum] = useState({
    disBoy: '', kanatDisBoy: '',
    kanatDisEn: '', kanatCamEn: '', kanatCamBoy: '',
    kayitGenisligi: '', sabitCamBoy: '',
  });
  const [uygulandi, setUygulandi] = useState(false);

  const guncel = useMemo(() => profilPaylariAl(seri, tablo), [seri, tablo]);
  const sonuc = useMemo(() => paylariKalibreEt(olcum), [olcum]);

  const yaz = (alan) => (e) => {
    setOlcum((o) => ({ ...o, [alan]: e.target.value }));
    setUygulandi(false);
  };

  const temizle = () => {
    setOlcum({
      disBoy: '', kanatDisBoy: '',
      kanatDisEn: '', kanatCamEn: '', kanatCamBoy: '',
      kayitGenisligi: '', sabitCamBoy: '',
    });
    setUygulandi(false);
  };

  const uygula = () => {
    if (!sonuc.gecerli) return;
    onUygula?.(seri, sonuc.paylar);
    setUygulandi(true);
  };

  const ETIKET = {
    kasaPayi: 'Kasa payı',
    kayitGenisligi: 'Orta kayıt genişliği',
    kanatCamPayi: 'Kanat cam payı (yan)',
    kanatCamPayiBoy: 'Kanat cam payı (üst/alt)',
    sabitCamPayi: 'Sabit cam payı',
  };

  const bulunanSayisi = Object.keys(sonuc.paylar).length;

  return (
    <div className="pk">
      <style>{`
        .pk {
          --ink:#0f1a2e; --ink2:#334154; --muted:#5a6880; --faint:#8492a8;
          --line:#e2e9f2; --line2:#cfdae8; --blue:#1f5fd0; --blue-s:#e8f0fd;
          --ok:#15803d; --ok-bg:#e9f7ef; --warn:#8a5d00; --warn-bg:#fdf6e3;
          font-family:'Inter',system-ui,sans-serif; color:var(--ink);
        }
        .pk *{box-sizing:border-box;}

        .pk-bas{font-size:15px;font-weight:700;margin:0 0 6px;}
        .pk-aciklama{
          font-size:13px;color:var(--muted);line-height:1.55;margin:0 0 16px;
        }
        .pk-aciklama strong{color:var(--ink);}

        .pk-seri{display:flex;gap:7px;margin-bottom:18px;}
        .pk-seri button{
          flex:1;padding:9px;border-radius:8px;border:1px solid var(--line2);
          background:#fff;font-family:inherit;font-size:13.5px;font-weight:600;
          color:var(--ink2);cursor:pointer;transition:all .15s;
        }
        .pk-seri button:hover{border-color:var(--blue);}
        .pk-seri button.on{background:var(--blue);border-color:var(--blue);color:#fff;}

        .pk-adim{
          border:1px solid var(--line);border-radius:10px;
          padding:14px 15px;margin-bottom:12px;background:#fff;
        }
        .pk-adim-bas{
          display:flex;align-items:center;gap:9px;
          font-size:13.5px;font-weight:700;margin-bottom:4px;
        }
        .pk-adim-no{
          width:21px;height:21px;border-radius:50%;flex-shrink:0;
          background:var(--blue-s);color:var(--blue);
          display:grid;place-items:center;font-size:11.5px;font-weight:700;
        }
        .pk-adim-not{
          font-size:12.2px;color:var(--faint);line-height:1.5;
          margin:0 0 11px 30px;
        }
        .pk-alanlar{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .pk-alan label{
          display:block;font-size:11.5px;font-weight:600;
          color:var(--ink2);margin-bottom:5px;
        }
        .pk-in{
          width:100%;padding:10px 11px;border:1px solid var(--line2);
          border-radius:8px;font-size:15px;color:var(--ink);
          font-family:'JetBrains Mono',ui-monospace,monospace;
          font-variant-numeric:tabular-nums;text-align:center;outline:none;
        }
        .pk-in:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(31,95,208,.13);}

        .pk-sonuc{
          border:1px solid var(--line);border-radius:10px;
          padding:15px;margin-top:16px;background:#f6f9fd;
        }
        .pk-sonuc.hazir{background:var(--ok-bg);border-color:#bfe5cd;}
        .pk-sonuc-bas{font-size:13.5px;font-weight:700;margin-bottom:11px;}
        .pk-satir{
          display:flex;justify-content:space-between;align-items:baseline;
          padding:6px 0;border-bottom:1px solid rgba(0,0,0,.05);
          font-size:13.3px;
        }
        .pk-satir:last-child{border-bottom:none;}
        .pk-satir-ad{color:var(--ink2);}
        .pk-satir-deger{
          font-family:'JetBrains Mono',monospace;font-weight:700;
          display:flex;align-items:baseline;gap:8px;
        }
        .pk-eski{font-size:11.5px;color:var(--faint);font-weight:400;}
        .pk-yeni{color:var(--ok);}
        .pk-degismedi{color:var(--muted);}

        .pk-uyari{
          display:flex;gap:8px;align-items:flex-start;
          background:var(--warn-bg);border:1px solid #f0e0b8;
          border-radius:8px;padding:11px 12px;margin-top:11px;
          font-size:12.8px;color:var(--warn);line-height:1.5;
        }
        .pk-eksik{
          font-size:12.5px;color:var(--faint);margin-top:9px;line-height:1.5;
        }

        .pk-butonlar{display:flex;gap:9px;margin-top:14px;}
        .pk-btn{
          flex:1;padding:12px;border-radius:8px;border:1px solid transparent;
          font-size:14.5px;font-weight:650;font-family:inherit;cursor:pointer;
          transition:background .15s,border-color .15s;
        }
        .pk-btn:disabled{opacity:.5;cursor:not-allowed;}
        .pk-btn-p{background:var(--blue);color:#fff;}
        .pk-btn-p:hover:not(:disabled){background:#1a51b3;}
        .pk-btn-p.ok{background:var(--ok);}
        .pk-btn-o{background:#fff;border-color:var(--line2);color:var(--ink);flex:0 0 auto;padding:12px 16px;}
        .pk-btn-o:hover{border-color:var(--blue);}

        @media (max-width:560px){
          .pk-alanlar{grid-template-columns:1fr;}
        }
      `}</style>

      <div className="pk-bas">Profil Kalibrasyonu</div>
      <p className="pk-aciklama">
        Cam ölçüsü profilin görünen yüz genişliklerine göre hesaplanır ve
        bu değerler <strong>her markada farklıdır</strong>. Elinizdeki bir
        pencereyi ölçün, uygulama kendi paylarınızı hesaplayıp kaydeder.
        <br /><br />
        Ölçüm için <strong>çıtayı sökün</strong> ve <strong>camın kendisini</strong>
        {' '}ölçün — kanat profilini değil. Bir kez yapılır, 5 dakika sürer.
      </p>

      <div className="pk-seri">
        {PROFIL_SERILERI.map((sr) => (
          <button
            key={sr}
            type="button"
            className={seri === sr ? 'on' : ''}
            onClick={() => { setSeri(sr); setUygulandi(false); }}
          >
            {sr} mm Seri
          </button>
        ))}
      </div>

      {/* ---------- ADIM 1 ---------- */}
      <div className="pk-adim">
        <div className="pk-adim-bas">
          <span className="pk-adim-no">1</span>
          Kasa payını bulalım
        </div>
        <p className="pk-adim-not">
          Pencerenin dış boyunu, sonra kanadı çıkarıp kanadın dış boyunu ölçün.
          Aradaki fark kasanın iki kenarda yediği paydır.
        </p>
        <div className="pk-alanlar">
          <div className="pk-alan">
            <label>Pencere dış boyu (mm)</label>
            <input className="pk-in" type="number" inputMode="numeric"
              value={olcum.disBoy} onChange={yaz('disBoy')} placeholder="1380" />
          </div>
          <div className="pk-alan">
            <label>Kanat dış boyu (mm)</label>
            <input className="pk-in" type="number" inputMode="numeric"
              value={olcum.kanatDisBoy} onChange={yaz('kanatDisBoy')} placeholder="1310" />
          </div>
        </div>
      </div>

      {/* ---------- ADIM 2 ---------- */}
      <div className="pk-adim">
        <div className="pk-adim-bas">
          <span className="pk-adim-no">2</span>
          Kanat cam payını bulalım
        </div>
        <p className="pk-adim-not">
          Kanadın dış ölçüsü ile içindeki camın ölçüsü. Alt ray su tahliye
          kanalı yüzünden yan kenarlardan geniş olduğu için en ve boy
          ayrı ayrı hesaplanır.
        </p>
        <div className="pk-alanlar">
          <div className="pk-alan">
            <label>Kanat dış eni (mm)</label>
            <input className="pk-in" type="number" inputMode="numeric"
              value={olcum.kanatDisEn} onChange={yaz('kanatDisEn')} placeholder="540" />
          </div>
          <div className="pk-alan">
            <label>Kanat camı eni (mm)</label>
            <input className="pk-in" type="number" inputMode="numeric"
              value={olcum.kanatCamEn} onChange={yaz('kanatCamEn')} placeholder="455" />
          </div>
          <div className="pk-alan" style={{ gridColumn: '1 / -1' }}>
            <label>Kanat camı boyu (mm) — isteğe bağlı</label>
            <input className="pk-in" type="number" inputMode="numeric"
              value={olcum.kanatCamBoy} onChange={yaz('kanatCamBoy')} placeholder="1200" />
          </div>
        </div>
      </div>

      {/* ---------- ADIM 3 ---------- */}
      <div className="pk-adim">
        <div className="pk-adim-bas">
          <span className="pk-adim-no">3</span>
          Orta kayıt ve sabit cam — isteğe bağlı
        </div>
        <p className="pk-adim-not">
          Orta kayıdı doğrudan ölçün. Sabit bölme varsa camının boyunu girin;
          sabit camda pay çok küçüktür çünkü cam doğrudan kasa yuvasına oturur.
        </p>
        <div className="pk-alanlar">
          <div className="pk-alan">
            <label>Orta kayıt genişliği (mm)</label>
            <input className="pk-in" type="number" inputMode="numeric"
              value={olcum.kayitGenisligi} onChange={yaz('kayitGenisligi')} placeholder="65" />
          </div>
          <div className="pk-alan">
            <label>Sabit cam boyu (mm)</label>
            <input className="pk-in" type="number" inputMode="numeric"
              value={olcum.sabitCamBoy} onChange={yaz('sabitCamBoy')} placeholder="1300" />
          </div>
        </div>
      </div>

      {/* ---------- SONUÇ ---------- */}
      <div className={`pk-sonuc ${sonuc.gecerli ? 'hazir' : ''}`}>
        <div className="pk-sonuc-bas">
          {sonuc.gecerli
            ? `Hesaplanan paylar — ${seri} mm seri`
            : `Ölçüleri girin — ${seri} mm seri`}
        </div>

        {Object.keys(ETIKET).map((alan) => {
          const yeni = sonuc.paylar[alan];
          const eski = guncel[alan];
          const degisti = yeni !== undefined && Math.abs(yeni - eski) > 0.05;
          return (
            <div className="pk-satir" key={alan}>
              <span className="pk-satir-ad">{ETIKET[alan]}</span>
              <span className="pk-satir-deger">
                {yeni !== undefined ? (
                  <>
                    {degisti && <span className="pk-eski">{eski} →</span>}
                    <span className={degisti ? 'pk-yeni' : 'pk-degismedi'}>{yeni} mm</span>
                  </>
                ) : (
                  <span className="pk-degismedi" style={{ fontWeight: 400 }}>
                    {eski} mm <span className="pk-eski">(mevcut)</span>
                  </span>
                )}
              </span>
            </div>
          );
        })}

        {sonuc.uyarilar.map((u, i) => (
          <div className="pk-uyari" key={i}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M8 2l6 11H2L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M8 6.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="8" cy="11.3" r=".7" fill="currentColor" />
            </svg>
            <span>{u}</span>
          </div>
        ))}

        {sonuc.eksik.length > 0 && (
          <div className="pk-eksik">
            Eksik ölçü: {sonuc.eksik.join(' · ')}
          </div>
        )}

        <div className="pk-butonlar">
          <button
            type="button"
            className={`pk-btn pk-btn-p ${uygulandi ? 'ok' : ''}`}
            onClick={uygula}
            disabled={!sonuc.gecerli || uygulandi}
          >
            {uygulandi
              ? `✓ ${seri} mm seriye uygulandı`
              : `${bulunanSayisi} değeri ${seri} mm seriye uygula`}
          </button>
          <button type="button" className="pk-btn pk-btn-o" onClick={temizle}>
            Temizle
          </button>
        </div>

        {uygulandi && (
          <div className="pk-eksik" style={{ color: 'var(--ok)' }}>
            Değerler uygulandı. <strong>Fiyat Ayarları'nı kaydetmeyi unutmayın.</strong>
          </div>
        )}
      </div>

      <p className="pk-aciklama" style={{ marginTop: 16, marginBottom: 0 }}>
        Varsayılan değerler gerçek bir 70 mm pencereden ölçülerek kalibre
        edilmiştir. Profiliniz farklıysa bu ölçümü yapın —
        <strong> tek pencere bütün hesabı düzeltir.</strong>
      </p>
    </div>
  );
}

/** Varsayılan paylara döndürmek için yardımcı — Fiyat Ayarları'nda kullanılabilir */
export const varsayilanPaylar = (seri) =>
  ({ ...VARSAYILAN_PROFIL_PAYLARI[seri] });
