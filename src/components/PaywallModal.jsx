import React from 'react';

/**
 * eWindoore — Paywall Modalı
 *
 * YARIM KİLİT (B seçeneği):
 *   Kullanıcı eski projelerini görebilir, arşivine bakabilir, PDF indirebilir.
 *   Ancak yeni çizim kaydedemez, kalem ekleyemez, fiyat tablosunu değiştiremez.
 *   Verisi rehin kalmıyor (KVKK), ama çalışmaya devam edemiyor.
 *
 * Bu yüzden modal KAPATILABİLİR. Kapatınca kullanıcı arşivine erişir;
 * kayıt denediğinde backend 402 döndürür ve modal yeniden açılır.
 *
 * ÖDEME: Henüz ödeme altyapısı yok. Kullanıcı WhatsApp / telefon ile
 * iletişime geçiyor, havale sonrası abonelik admin panelinden açılıyor.
 */

/* İletişim ve ödeme bilgileri .env dosyasından okunur.
   Şirket hesabına geçildiğinde yalnızca .env güncellenir, koda dokunulmaz.
   IBAN tanımlı değilse havale bölümü hiç gösterilmez. */
const WHATSAPP_NUMARA = import.meta.env.VITE_WHATSAPP || '905357274210';
const IBAN = import.meta.env.VITE_IBAN || '';
const IBAN_ALICI = import.meta.env.VITE_IBAN_ALICI || '';
const BANKA = import.meta.env.VITE_BANKA || '';

export default function PaywallModal({
  acik,
  kapat,
  sebep = 'deneme',          // 'deneme' | 'abonelik' | 'donduruldu'
  kalanGun = 0,
  firmaAdi = '',
}) {
  const [kopyalandi, setKopyalandi] = React.useState(false);

  if (!acik) return null;

  const ibanKopyala = async () => {
    try {
      await navigator.clipboard.writeText(IBAN.replace(/\s/g, ''));
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2500);
    } catch {
      /* pano izni yoksa sessizce geç, kullanıcı elle seçebilir */
    }
  };

  const metinler = {
    deneme: {
      baslik: 'Ücretsiz deneme süreniz doldu',
      alt: '14 günlük deneme süreniz tamamlandı. Projeleriniz ve müşteri kayıtlarınız güvende — silinmedi, olduğu gibi duruyor.',
    },
    abonelik: {
      baslik: 'Aboneliğinizin süresi doldu',
      alt: 'Abonelik döneminiz sona erdi. Verileriniz korunuyor, yenileyerek kaldığınız yerden devam edebilirsiniz.',
    },
    donduruldu: {
      baslik: 'Hesabınız donduruldu',
      alt: 'Hesabınız sizin talebinizle donduruldu. Verileriniz korunuyor. Profil ekranından dondurmayı kaldırarak devam edebilirsiniz.',
    },
  };

  const m = metinler[sebep] || metinler.deneme;

  const wpMesaj = encodeURIComponent(
    `Merhaba, eWindoore aboneliği hakkında bilgi almak istiyorum.` +
    (firmaAdi ? ` Firma: ${firmaAdi}` : '')
  );

  return (
    <div className="pw-ort" onClick={kapat}>
      <style>{`
        .pw-ort{
          position:fixed;inset:0;z-index:9000;
          background:rgba(10,20,36,.55);backdrop-filter:blur(4px);
          display:flex;align-items:center;justify-content:center;
          padding:20px;overflow-y:auto;
          font-family:'Inter',system-ui,sans-serif;
        }
        .pw{
          --ink:#0f1a2e;--ink2:#334154;--muted:#5a6880;--faint:#8492a8;
          --line:#e2e9f2;--line2:#cfdae8;--blue:#1f5fd0;--blue-h:#1a51b3;
          --blue-s:#e8f0fd;--ok:#15803d;

          background:#fff;border-radius:16px;max-width:560px;width:100%;
          box-shadow:0 20px 60px rgba(10,20,36,.3);
          color:var(--ink);overflow:hidden;
          max-height:calc(100vh - 40px);overflow-y:auto;
        }
        .pw *{box-sizing:border-box;}

        .pw-ust{
          padding:26px 26px 20px;text-align:center;
          background:linear-gradient(180deg,#f6f9fd,#fff);
          border-bottom:1px solid var(--line);
        }
        .pw-ic{
          width:52px;height:52px;border-radius:14px;margin:0 auto 14px;
          background:var(--blue-s);color:var(--blue);
          display:grid;place-items:center;
        }
        .pw-h{font-size:20px;font-weight:800;letter-spacing:-.02em;margin:0 0 8px;}
        .pw-alt{font-size:14.2px;color:var(--muted);line-height:1.6;margin:0;}

        .pw-govde{padding:22px 26px 26px;}

        .pw-erisim{
          background:#f6f9fd;border:1px solid var(--line);border-radius:10px;
          padding:13px 15px;margin-bottom:20px;
        }
        .pw-erisim-bas{font-size:12.5px;font-weight:700;margin-bottom:8px;}
        .pw-liste{margin:0;padding:0;list-style:none;font-size:13.4px;line-height:1.65;}
        .pw-liste li{display:flex;gap:8px;align-items:flex-start;margin-bottom:3px;}
        .pw-liste svg{flex-shrink:0;margin-top:3px;}
        .pw-var{color:var(--ink2);}
        .pw-yok{color:var(--faint);}

        .pw-paketler{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;}
        .pw-paket{
          border:1px solid var(--line);border-radius:11px;padding:16px 15px;
          position:relative;
        }
        .pw-paket.one{border-color:var(--blue);background:#fbfdff;}
        .pw-paket-tag{
          position:absolute;top:-9px;left:50%;transform:translateX(-50%);
          background:var(--blue);color:#fff;font-size:9.5px;font-weight:700;
          letter-spacing:.06em;text-transform:uppercase;
          padding:3px 9px;border-radius:100px;white-space:nowrap;
        }
        .pw-paket-ad{font-size:14.5px;font-weight:700;margin-bottom:3px;}
        .pw-paket-not{font-size:12.2px;color:var(--faint);margin-bottom:11px;line-height:1.4;}
        .pw-paket-f{
          display:flex;align-items:baseline;gap:4px;margin-bottom:11px;
          font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;
        }
        .pw-paket-f b{font-size:25px;font-weight:800;letter-spacing:-.03em;}
        .pw-paket-f i{font-style:normal;font-size:12.5px;color:var(--faint);}
        .pw-paket-oz{list-style:none;margin:0;padding:0;font-size:12.6px;line-height:1.6;}
        .pw-paket-oz li{display:flex;gap:6px;align-items:flex-start;color:var(--ink2);}
        .pw-paket-oz svg{flex-shrink:0;margin-top:3px;}

        .pw-btn{
          width:100%;padding:14px;border-radius:10px;border:1px solid transparent;
          font-size:15px;font-weight:650;font-family:inherit;cursor:pointer;
          text-decoration:none;display:flex;align-items:center;justify-content:center;gap:9px;
          transition:background .15s,border-color .15s;
        }
        .pw-btn-wp{background:#1f9d55;color:#fff;}
        .pw-btn-wp:hover{background:#1a8549;}
        .pw-btn-o{
          background:#fff;border-color:var(--line2);color:var(--ink);margin-top:10px;
        }
        .pw-btn-o:hover{border-color:var(--blue);background:#f8fbff;}

        .pw-havale{
          background:#f6f9fd;border:1px solid var(--line);border-radius:10px;
          padding:14px 15px;margin-top:16px;
        }
        .pw-havale-bas{
          font-size:12.5px;font-weight:700;margin-bottom:10px;
          display:flex;align-items:center;gap:7px;
        }
        .pw-iban-sat{
          display:flex;align-items:center;gap:10px;
          background:#fff;border:1px solid var(--line2);border-radius:8px;
          padding:10px 12px;margin-bottom:8px;
        }
        .pw-iban-no{
          flex:1;min-width:0;font-family:'JetBrains Mono',monospace;
          font-size:13.2px;font-weight:600;letter-spacing:.02em;
          overflow-x:auto;white-space:nowrap;
        }
        .pw-kopyala{
          flex-shrink:0;padding:6px 11px;border-radius:7px;
          background:var(--blue-s);border:1px solid transparent;color:var(--blue);
          font-size:12px;font-weight:650;font-family:inherit;cursor:pointer;
          transition:background .15s;
        }
        .pw-kopyala:hover{background:#dbe8fb;}
        .pw-kopyala.ok{background:#e9f7ef;color:var(--ok);}
        .pw-havale-satir{
          display:flex;justify-content:space-between;gap:12px;
          font-size:12.8px;padding:3px 0;
        }
        .pw-havale-satir span:first-child{color:var(--faint);}
        .pw-havale-satir span:last-child{color:var(--ink2);font-weight:600;text-align:right;}
        .pw-havale-not{
          font-size:12.2px;color:var(--muted);line-height:1.55;
          margin-top:10px;padding-top:10px;border-top:1px solid var(--line);
        }
        .pw-havale-not strong{color:var(--ink);}

        .pw-havale{
          background:#f6f9fd;border:1px solid var(--line);border-radius:10px;
          padding:14px 15px;margin-top:16px;
        }
        .pw-havale-bas{
          font-size:12.5px;font-weight:700;margin-bottom:10px;
          display:flex;align-items:center;gap:7px;
        }
        .pw-iban-sat{
          display:flex;align-items:center;gap:10px;
          background:#fff;border:1px solid var(--line2);border-radius:8px;
          padding:10px 12px;margin-bottom:8px;
        }
        .pw-iban-no{
          flex:1;min-width:0;font-family:'JetBrains Mono',monospace;
          font-size:13.2px;font-weight:600;letter-spacing:.02em;
          overflow-x:auto;white-space:nowrap;
        }
        .pw-kopyala{
          flex-shrink:0;padding:6px 11px;border-radius:7px;
          background:var(--blue-s);border:1px solid transparent;color:var(--blue);
          font-size:12px;font-weight:650;font-family:inherit;cursor:pointer;
          transition:background .15s;
        }
        .pw-kopyala:hover{background:#dbe8fb;}
        .pw-kopyala.ok{background:#e9f7ef;color:var(--ok);}
        .pw-havale-satir{
          display:flex;justify-content:space-between;gap:12px;
          font-size:12.8px;padding:3px 0;
        }
        .pw-havale-satir span:first-child{color:var(--faint);}
        .pw-havale-satir span:last-child{color:var(--ink2);font-weight:600;text-align:right;}
        .pw-havale-not{
          font-size:12.2px;color:var(--muted);line-height:1.55;
          margin-top:10px;padding-top:10px;border-top:1px solid var(--line);
        }
        .pw-havale-not strong{color:var(--ink);}

        .pw-not{
          font-size:12.3px;color:var(--faint);line-height:1.55;
          text-align:center;margin-top:16px;padding-top:14px;
          border-top:1px solid var(--line);
        }

        @media (max-width:520px){
          .pw-ort{padding:12px;}
          .pw-paketler{grid-template-columns:1fr;}
          .pw-ust{padding:22px 20px 18px;}
          .pw-govde{padding:18px 20px 22px;}
        }
      `}</style>

      <div className="pw" onClick={(e) => e.stopPropagation()}>

        {/* ---------- ÜST ---------- */}
        <div className="pw-ust">
          <div className="pw-ic">
            {sebep === 'donduruldu' ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v18M4 7.5l16 9M20 7.5l-16 9" stroke="currentColor"
                  strokeWidth="1.9" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.9" />
                <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <h2 className="pw-h">{m.baslik}</h2>
          <p className="pw-alt">{m.alt}</p>
        </div>

        <div className="pw-govde">

          {/* ---------- NEYE ERİŞEBİLİR ---------- */}
          <div className="pw-erisim">
            <div className="pw-erisim-bas">Şu anda neler yapabilirsiniz</div>
            <ul className="pw-liste">
              {[
                'Eski projelerinizi ve müşteri arşivinizi görüntüleyebilirsiniz',
                'Kayıtlı tekliflerinizin PDF çıktısını alabilirsiniz',
                'Fiyat tablonuzu görebilirsiniz',
              ].map((t) => (
                <li className="pw-var" key={t}><Tik /> {t}</li>
              ))}
              {[
                'Yeni çizim kaydetme ve teklif oluşturma kapalı',
                'Fiyat tablosunu değiştirme kapalı',
              ].map((t) => (
                <li className="pw-yok" key={t}><Carpi /> {t}</li>
              ))}
            </ul>
          </div>

          {/* ---------- PAKETLER (dondurmada gösterilmez) ---------- */}
          {sebep !== 'donduruldu' && (
            <div className="pw-paketler">
              <div className="pw-paket">
                <div className="pw-paket-ad">Bireysel</div>
                <div className="pw-paket-not">Tek kişi çalışan usta ve montaj ekipleri</div>
                <div className="pw-paket-f"><b>250</b><i>₺ / ay</i></div>
                <ul className="pw-paket-oz">
                  <li><Tik /> Sınırsız çizim ve teklif</li>
                  <li><Tik /> Kesim listesi ve PDF</li>
                  <li><Tik /> 1 kullanıcı</li>
                </ul>
              </div>

              <div className="pw-paket one">
                <span className="pw-paket-tag">En çok tercih edilen</span>
                <div className="pw-paket-ad">Kurumsal</div>
                <div className="pw-paket-not">Atölye, bayi ve fabrikalar için</div>
                <div className="pw-paket-f"><b>500</b><i>₺ / ay</i></div>
                <ul className="pw-paket-oz">
                  <li><Tik /> Bireyseldeki her şey</li>
                  <li><Tik /> Sınırsız kullanıcı</li>
                  <li><Tik /> Patron / usta yetkileri</li>
                </ul>
              </div>
            </div>
          )}

          {/* ---------- AKSİYON ---------- */}
          {sebep === 'donduruldu' ? (
            <button className="pw-btn pw-btn-o" onClick={kapat}>
              Profil ekranından dondurmayı kaldırabilirsiniz
            </button>
          ) : (
            <>
              <a
                className="pw-btn pw-btn-wp"
                href={`https://wa.me/${WHATSAPP_NUMARA}?text=${wpMesaj}`}
                target="_blank" rel="noreferrer"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.5 14.4c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.23-.24-.58-.5-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1-1.03 2.45s1.06 2.84 1.2 3.04c.15.2 2.08 3.18 5.04 4.35 2.96 1.17 2.96.78 3.5.73.53-.05 1.73-.7 1.98-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.2-.57-.35z" />
                  <path d="M12 2C6.5 2 2 6.5 2 12c0 1.85.5 3.58 1.4 5.06L2 22l5.06-1.36A9.96 9.96 0 0012 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.7 0-3.3-.5-4.65-1.35l-.33-.2-3 .8.82-2.94-.22-.35A8.13 8.13 0 013.8 12c0-4.52 3.68-8.2 8.2-8.2s8.2 3.68 8.2 8.2-3.68 8.2-8.2 8.2z" />
                </svg>
                WhatsApp ile Abonelik Başlat
              </a>

              <button className="pw-btn pw-btn-o" onClick={kapat}>
                Şimdilik arşivime bakayım
              </button>

              {IBAN && (
                <div className="pw-havale">
                  <div className="pw-havale-bas">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="4.5" width="12" height="8.5" rx="1.4"
                        stroke="currentColor" strokeWidth="1.4" />
                      <path d="M2 7.5h12" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                    Havale / EFT ile ödeme
                  </div>

                  <div className="pw-iban-sat">
                    <span className="pw-iban-no">{IBAN}</span>
                    <button className={`pw-kopyala ${kopyalandi ? 'ok' : ''}`} onClick={ibanKopyala}>
                      {kopyalandi ? 'Kopyalandı' : 'Kopyala'}
                    </button>
                  </div>

                  {IBAN_ALICI && (
                    <div className="pw-havale-satir">
                      <span>Alıcı</span><span>{IBAN_ALICI}</span>
                    </div>
                  )}
                  {BANKA && (
                    <div className="pw-havale-satir">
                      <span>Banka</span><span>{BANKA}</span>
                    </div>
                  )}

                  <div className="pw-havale-not">
                    Açıklama kısmına <strong>firma adınızı</strong> yazmanız, ödemenizi
                    hızlıca eşleştirmemizi sağlar. Havale sonrası WhatsApp'tan bilgi
                    verirseniz aboneliğinizi <strong>aynı gün</strong> açarız.
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pw-not">
            Ödeme altyapımız hazırlanıyor. Şimdilik WhatsApp veya telefon ile
            iletişime geçiyor, havale sonrası aboneliğinizi aynı gün açıyoruz.
            <br />
            Verileriniz her durumda korunur, hiçbir zaman silinmez.
          </div>
        </div>
      </div>
    </div>
  );
}

function Tik() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 8.3l3 3L12.5 5" stroke="#15803d" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Carpi() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="#a9b5c4" strokeWidth="1.9"
        strokeLinecap="round" />
    </svg>
  );
}
