import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

/**
 * eWindoore — Hesap Silme Talebi (Web)
 *
 * GOOGLE PLAY ZORUNLULUĞU:
 * Uygulama içi silme yolu tek başına yeterli değil. Google, kullanıcının
 * uygulamayı yeniden kurmadan da silme talebi gönderebileceği, giriş
 * gerektirmeyen bir web sayfası istiyor. Bu sayfanın adresi Play Console'daki
 * "Data safety" formuna da girilecek.
 *
 * Bu sayfa giriş gerektirmez (backend ucu AllowAny). Talep kaydedilir,
 * yönetici admin panelinden görüp işler.
 */

export default function HesapSilmeTalebi() {
  const navigate = useNavigate();

  const [eposta, setEposta] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [onay, setOnay] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  const [hata, setHata] = useState('');

  const gonder = async (e) => {
    e.preventDefault();
    setHata('');

    if (!eposta.trim()) return setHata('E-posta adresinizi girin.');
    if (!/\S+@\S+\.\S+/.test(eposta)) return setHata('Geçerli bir e-posta adresi girin.');
    if (!onay) return setHata('Verilerin kalıcı olarak silineceğini onaylamanız gerekiyor.');

    setGonderiliyor(true);
    try {
      await API.post('users/hesap-silme-talebi/', {
        email: eposta.trim(),
        aciklama: aciklama.trim(),
      });
      setGonderildi(true);
    } catch (err) {
      const v = err?.response?.data;
      setHata(v?.error || 'Talebiniz gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <div className="hs">
      <style>{`
        .hs{
          --ink:#0f1a2e; --ink2:#334154; --muted:#5a6880; --faint:#8492a8;
          --line:#e2e9f2; --line2:#cfdae8; --bg:#f5f8fc; --card:#fff;
          --blue:#1f5fd0; --blue-h:#1a51b3; --blue-s:#e8f0fd;
          --err:#c62828; --err-bg:#fdf0f0;
          --ok:#15803d; --ok-bg:#e9f7ef;

          min-height:100vh;background:var(--bg);color:var(--ink);
          font-family:'Inter',system-ui,sans-serif;
          padding:32px 16px 56px;
        }
        .hs *{box-sizing:border-box;}
        .hs-kap{max-width:560px;margin:0 auto;}

        .hs-logo{
          display:flex;align-items:center;justify-content:center;gap:10px;
          margin-bottom:28px;
        }
        .hs-logo-ad{font-size:19px;font-weight:800;letter-spacing:-.02em;}

        .hs-kart{
          background:var(--card);border:1px solid var(--line);
          border-radius:14px;padding:26px;
          box-shadow:0 1px 2px rgba(16,32,64,.04),0 10px 28px rgba(16,32,64,.06);
        }
        .hs-h1{font-size:23px;font-weight:800;letter-spacing:-.02em;margin:0 0 8px;}
        .hs-lead{font-size:14.5px;color:var(--muted);line-height:1.6;margin:0 0 22px;}

        .hs-bilgi{
          background:#fafcfe;border:1px solid var(--line);border-left:3px solid var(--blue);
          border-radius:9px;padding:14px 15px;margin-bottom:22px;
        }
        .hs-bilgi-bas{font-size:13px;font-weight:700;margin-bottom:8px;}
        .hs-bilgi ul{margin:0;padding-left:18px;font-size:13.3px;color:var(--ink2);line-height:1.65;}
        .hs-bilgi li{margin-bottom:3px;}

        .hs-f{margin-bottom:16px;}
        .hs-lbl{display:block;font-size:12.8px;font-weight:600;color:var(--ink2);margin-bottom:6px;}
        .hs-in{
          width:100%;padding:12px 13px;background:#fff;
          border:1px solid var(--line2);border-radius:9px;
          font-size:15px;color:var(--ink);font-family:inherit;outline:none;
          transition:border-color .15s,box-shadow .15s;
        }
        .hs-in:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(31,95,208,.13);}
        textarea.hs-in{resize:vertical;min-height:82px;line-height:1.5;}
        .hs-ipucu{font-size:12.2px;color:var(--faint);margin-top:5px;line-height:1.45;}

        .hs-onay{
          display:flex;gap:10px;align-items:flex-start;
          padding:13px 14px;border-radius:9px;
          background:var(--err-bg);border:1px solid #f3cccc;
          margin-bottom:18px;cursor:pointer;
        }
        .hs-onay input{width:17px;height:17px;margin-top:1px;flex-shrink:0;accent-color:var(--err);cursor:pointer;}
        .hs-onay span{font-size:13.3px;color:#8c3535;line-height:1.5;}

        .hs-btn{
          width:100%;padding:14px;border-radius:9px;border:1px solid transparent;
          font-size:15px;font-weight:650;font-family:inherit;cursor:pointer;
          transition:background .15s,border-color .15s;
        }
        .hs-btn:disabled{opacity:.55;cursor:not-allowed;}
        .hs-btn-t{background:var(--err);color:#fff;}
        .hs-btn-t:hover:not(:disabled){background:#a91d1d;}
        .hs-btn-o{
          background:#fff;border-color:var(--line2);color:var(--ink);margin-top:10px;
        }
        .hs-btn-o:hover{border-color:var(--blue);}

        .hs-hata{
          display:flex;gap:9px;align-items:flex-start;
          background:var(--err-bg);border:1px solid #f3cccc;border-radius:9px;
          padding:12px 14px;margin-bottom:18px;
          font-size:13.6px;color:var(--err);line-height:1.45;
        }

        .hs-ok-ic{
          width:56px;height:56px;border-radius:50%;margin:0 auto 16px;
          background:var(--ok-bg);color:var(--ok);display:grid;place-items:center;
        }
        .hs-ok-bas{font-size:20px;font-weight:800;text-align:center;margin:0 0 10px;}
        .hs-ok-metin{
          font-size:14.3px;color:var(--muted);line-height:1.65;
          text-align:center;margin:0 0 22px;
        }

        .hs-alt{
          margin-top:20px;padding-top:18px;border-top:1px solid var(--line);
          font-size:12.5px;color:var(--faint);line-height:1.6;
        }
        .hs-alt a{color:var(--muted);}

        @media (max-width:520px){
          .hs{padding:20px 14px 44px;}
          .hs-kart{padding:20px;}
          .hs-in{font-size:16px;}
        }
      `}</style>

      <div className="hs-kap">

        <div className="hs-logo">
          <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
            <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="8" fill="#f2f7fe" stroke="#dbe7f8" strokeWidth="1.5" />
            <path d="M8 28V12h3.2l3.4 7.4 3.4-7.4h3.2v16h-3V18.4l-2.7 5.9h-1.8l-2.7-5.9V28H8z" fill="#1f5fd0" />
            <rect x="24.5" y="12" width="8.5" height="3" rx="0.6" fill="#1f5fd0" />
            <rect x="24.5" y="18.5" width="7" height="3" rx="0.6" fill="#9aa8bd" />
            <rect x="24.5" y="25" width="8.5" height="3" rx="0.6" fill="#9aa8bd" />
          </svg>
          <span className="hs-logo-ad">eWindoore</span>
        </div>

        <div className="hs-kart">
          {gonderildi ? (
            /* ---------- BAŞARILI ---------- */
            <>
              <div className="hs-ok-ic">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="hs-ok-bas">Talebiniz alındı</h1>
              <p className="hs-ok-metin">
                <strong>{eposta}</strong> adresine ait hesap silme talebiniz kaydedildi.
                <br /><br />
                Talebiniz <strong>en geç 30 gün içinde</strong> işlenir ve hesabınıza ait
                tüm veriler kalıcı olarak silinir. İşlem tamamlandığında bu adrese
                bilgilendirme e-postası gönderilir.
                <br /><br />
                Bu süre içinde fikrinizi değiştirirseniz bizimle iletişime geçebilirsiniz.
              </p>
              <button className="hs-btn hs-btn-o" onClick={() => navigate('/')}>
                Ana Sayfaya Dön
              </button>
            </>
          ) : (
            /* ---------- FORM ---------- */
            <>
              <h1 className="hs-h1">Hesap Silme Talebi</h1>
              <p className="hs-lead">
                Hesabınızı ve ilişkili tüm verilerinizi kalıcı olarak silmek için
                aşağıdaki formu doldurun. Uygulamaya giriş yapabiliyorsanız,
                <strong> Profil → Hesabımı Sil</strong> yolundan anında da silebilirsiniz.
              </p>

              <div className="hs-bilgi">
                <div className="hs-bilgi-bas">Silinecek veriler</div>
                <ul>
                  <li>Giriş hesabınız ve iletişim bilgileriniz</li>
                  <li>Kaydettiğiniz tüm projeler, ölçüler ve çizimler</li>
                  <li>Müşteri kayıtları ve verdiğiniz teklifler</li>
                  <li>Fiyat tablonuz ve firma ayarlarınız</li>
                  <li>Firma sahibiyseniz: firmanıza bağlı personel hesapları</li>
                </ul>
              </div>

              {hata && (
                <div className="hs-hata">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
                    <line x1="8" y1="4.6" x2="8" y2="9" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="8" cy="11.2" r=".8" fill="currentColor" />
                  </svg>
                  <span>{hata}</span>
                </div>
              )}

              <form onSubmit={gonder}>
                <div className="hs-f">
                  <label className="hs-lbl">Hesabınızın E-posta Adresi</label>
                  <input
                    className="hs-in" type="email" value={eposta}
                    onChange={(e) => setEposta(e.target.value)}
                    placeholder="ornek@firma.com" autoComplete="email"
                  />
                  <div className="hs-ipucu">
                    Uygulamaya giriş yaparken kullandığınız e-posta adresini yazın.
                  </div>
                </div>

                <div className="hs-f">
                  <label className="hs-lbl">Açıklama (isteğe bağlı)</label>
                  <textarea
                    className="hs-in" value={aciklama}
                    onChange={(e) => setAciklama(e.target.value)}
                    placeholder="Firma adınız veya eklemek istediğiniz bilgiler..."
                  />
                  <div className="hs-ipucu">
                    Firma adınızı yazarsanız talebinizi daha hızlı doğrulayabiliriz.
                  </div>
                </div>

                <label className="hs-onay">
                  <input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} />
                  <span>
                    Hesabımın ve yukarıda listelenen tüm verilerimin <strong>kalıcı olarak
                    silineceğini</strong>, bu işlemin <strong>geri alınamayacağını</strong> anlıyorum.
                  </span>
                </label>

                <button className="hs-btn hs-btn-t" type="submit" disabled={gonderiliyor}>
                  {gonderiliyor ? 'Gönderiliyor...' : 'Silme Talebi Gönder'}
                </button>
              </form>

              <button className="hs-btn hs-btn-o" onClick={() => navigate('/')}>
                Vazgeç
              </button>

              <div className="hs-alt">
                Talepler en geç <strong>30 gün</strong> içinde işlenir. Yasal olarak
                saklanması zorunlu kayıtlar (fatura ve muhasebe belgeleri gibi) mevzuatta
                öngörülen süre boyunca tutulabilir; bunun dışındaki tüm veriler silinir.
                Ayrıntılar için <a href="/gizlilik-sozlesmesi">Gizlilik Politikası</a>.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
