import React from 'react';
import { createPortal } from 'react-dom';
import DogramaCizim from './DogramaCizim.jsx';

/**
 * eWindoore — Kurumsal Teklif Yazdırma Şablonu
 *
 * Yalnızca yazdırmada görünür (ekranda gizli). A4'e göre tasarlandı.
 * Tarayıcının "PDF olarak kaydet" özelliğiyle kusursuz çıktı verir:
 * çizimler SVG olduğu için vektör kalitesinde basılır, Türkçe
 * karakterler sorunsuz çıkar.
 *
 * MÜŞTERİYE GİDEN BELGE OLDUĞU İÇİN:
 *  - Cam kesim ölçüleri gizlenir (camEtiketGoster={false})
 *  - Maliyet, kâr marjı, metraj gösterilmez — yalnızca satış fiyatları
 *  - Çizimlerde yalnızca dış ölçüler görünür
 */

const SP_TIPLERI = ['menteseliSineklik', 'surguluSineklik', 'plisePerde', 'surgulu_sineklik', 'plise_perde'];

const paraFormat = (n) => (Number(n) || 0).toLocaleString('tr-TR');

const URUN_ADLARI = {
  pencere: 'Pencere',
  kapi: 'Kapı',
  wc_kapi: 'WC / Banyo Kapısı',
  balkonkapi: 'Balkon Kapısı',
  fransiz: 'Fransız Balkon',
  surgulu: 'Sürgülü Sistem',
  acili: 'Açılı Pencere',
  menteseliSineklik: 'Menteşeli Sineklik',
  surguluSineklik: 'Sürgülü Sineklik',
  plisePerde: 'Plise Perde',
  surgulu_sineklik: 'Sürgülü Sineklik',
  plise_perde: 'Plise Perde',
};

export default function TeklifYazdir({
  firmaAdi = 'eWindoore',
  firmaLogosu = null,
  firmaTelefon = '',
  firmaEposta = '',
  iban = '',
  projeAdi = '',
  musteriTel = '',
  musteriAdres = '',
  siparisNotu = '',
  teklifTarihi = '',
  teklifNo = '',
  sepet = [],
  kdvDahilMi = false,
  gecerlilikGunu = 7,
}) {
  const toplam = sepet.reduce((a, k) => a + (Number(k.fiyat) || 0), 0);
  const toplamAdet = sepet.reduce((a, k) => a + (Number(k.adet) || 1), 0);

  const bugun = teklifTarihi || new Date().toLocaleDateString('tr-TR');
  const no = teklifNo || `TKL-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

  const gecerlilik = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (Number(gecerlilikGunu) || 7));
    return d.toLocaleDateString('tr-TR');
  })();

  const dogramalar = sepet.filter((k) => !SP_TIPLERI.includes(k.urunTipi));

  const icerik = (
    <div className="ew-yazdir">
      <style>{`
        /* ---------- EKRANDA GİZLİ, SADECE YAZDIRMADA ---------- */
        .ew-yazdir { display: none; }

        @media print {
          /* Bu bileşen createPortal ile doğrudan body'ye basılır, bu yüzden
             body'nin diğer doğrudan çocuklarını (#root dahil) gizlemek yeterli.
             Eskiden .ew-yazdir sarmalayıcı #root'un içindeydi ve #root gizlenince
             o da gizleniyordu — çıktı boş sayfa geliyordu. */
          body > *:not(.ew-yazdir) { display: none !important; }
          .ew-yazdir { display: block !important; }

          @page {
            size: A4;
            margin: 14mm 12mm;
          }

          html, body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }

        .ew-yazdir {
          font-family: 'Inter', system-ui, sans-serif;
          color: #12213a;
          font-size: 10.5pt;
          line-height: 1.45;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .ew-yazdir * { box-sizing: border-box; }

        /* ---------- ÜST BAŞLIK ---------- */
        .yz-ust {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding-bottom: 10px; margin-bottom: 14px;
          border-bottom: 2.5px solid #12213a;
        }
        .yz-firma { display: flex; gap: 12px; align-items: flex-start; }
        .yz-logo {
          width: 62px; height: 62px; object-fit: contain;
          border: 1px solid #dfe6f0; border-radius: 6px; padding: 3px;
        }
        .yz-firma-ad { font-size: 17pt; font-weight: 800; letter-spacing: -0.02em; }
        .yz-firma-alt { font-size: 8.5pt; color: #5d6b80; margin-top: 2px; }
        .yz-belge { text-align: right; }
        .yz-belge-ad {
          font-size: 13pt; font-weight: 800; letter-spacing: 0.04em;
          text-transform: uppercase; margin-bottom: 5px;
        }
        .yz-belge-satir {
          font-size: 9pt; color: #3d4b60;
          font-family: 'JetBrains Mono', monospace;
        }

        /* ---------- MÜŞTERİ ---------- */
        .yz-musteri {
          display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
          background: #f6f9fd; border: 1px solid #e2e9f2; border-radius: 6px;
          padding: 11px 13px; margin-bottom: 14px;
        }
        .yz-alan-etiket {
          font-size: 7.5pt; letter-spacing: 0.09em; text-transform: uppercase;
          color: #7d8b9e; margin-bottom: 2px;
        }
        .yz-alan-deger { font-size: 10.5pt; font-weight: 600; }

        /* ---------- FİYAT TABLOSU ---------- */
        .yz-tablo { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
        .yz-tablo thead th {
          background: #12213a; color: #fff;
          font-size: 8.5pt; letter-spacing: 0.05em; text-transform: uppercase;
          padding: 7px 8px; text-align: left; font-weight: 700;
        }
        .yz-tablo thead th.sag { text-align: right; }
        .yz-tablo thead th.orta { text-align: center; }
        .yz-tablo tbody td {
          padding: 7px 8px; border-bottom: 1px solid #e6ecf5;
          font-size: 10pt; vertical-align: top;
        }
        .yz-tablo tbody tr:nth-child(even) td { background: #fafcfe; }
        .yz-tablo td.sag {
          text-align: right;
          font-family: 'JetBrains Mono', monospace;
          font-variant-numeric: tabular-nums;
        }
        .yz-tablo td.orta { text-align: center; font-family: 'JetBrains Mono', monospace; }
        .yz-sira { color: #8492a8; font-size: 9pt; }
        .yz-urun-ad { font-weight: 650; }
        .yz-urun-not { font-size: 8.5pt; color: #5d6b80; margin-top: 1px; }

        /* ---------- TOPLAM ---------- */
        .yz-toplam-kutu {
          display: flex; justify-content: flex-end; margin-top: 8px; margin-bottom: 16px;
        }
        .yz-toplam { width: 260px; }
        .yz-toplam-satir {
          display: flex; justify-content: space-between;
          padding: 5px 0; font-size: 10pt;
        }
        .yz-toplam-genel {
          display: flex; justify-content: space-between; align-items: baseline;
          border-top: 2px solid #12213a; margin-top: 4px; padding-top: 7px;
        }
        .yz-toplam-genel span { font-size: 10.5pt; font-weight: 700; }
        .yz-toplam-genel b {
          font-size: 16pt; font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
          font-variant-numeric: tabular-nums;
        }

        /* ---------- NOT / IBAN ---------- */
        .yz-alt-bilgi {
          display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
          margin-bottom: 16px;
        }
        .yz-kutu {
          border: 1px solid #e2e9f2; border-radius: 6px; padding: 10px 12px;
          background: #fafcfe;
        }
        .yz-kutu-baslik {
          font-size: 8pt; letter-spacing: 0.08em; text-transform: uppercase;
          color: #7d8b9e; margin-bottom: 5px; font-weight: 700;
        }
        .yz-kutu-icerik { font-size: 9.5pt; line-height: 1.5; }
        .yz-iban {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10pt; font-weight: 600; letter-spacing: 0.02em;
        }

        /* ---------- ÇİZİM GALERİSİ ---------- */
        .yz-cizimler { page-break-before: always; break-before: page; }
        .yz-bolum-baslik {
          font-size: 12pt; font-weight: 800; letter-spacing: -0.01em;
          padding-bottom: 6px; margin-bottom: 12px;
          border-bottom: 2px solid #12213a;
        }
        .yz-cizim-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        .yz-cizim-kart {
          border: 1px solid #dfe6f0; border-radius: 6px; padding: 8px;
          page-break-inside: avoid; break-inside: avoid;
          background: #fff;
        }
        .yz-cizim-baslik {
          display: flex; justify-content: space-between; align-items: baseline;
          margin-bottom: 4px; padding-bottom: 4px;
          border-bottom: 1px solid #eef2f7;
        }
        .yz-cizim-ad { font-size: 10pt; font-weight: 700; }
        .yz-cizim-olcu {
          font-size: 9pt; color: #5d6b80;
          font-family: 'JetBrains Mono', monospace;
        }

        /* ---------- İMZA ---------- */
        .yz-imza {
          display: grid; grid-template-columns: 1fr 1fr; gap: 40px;
          margin-top: 22px; page-break-inside: avoid;
        }
        .yz-imza-alan { text-align: center; }
        .yz-imza-cizgi {
          border-top: 1px solid #12213a; margin-bottom: 5px; height: 42px;
        }
        .yz-imza-etiket { font-size: 9pt; color: #5d6b80; }

        .yz-dipnot {
          margin-top: 16px; padding-top: 8px;
          border-top: 1px solid #e6ecf5;
          font-size: 8pt; color: #8492a8; text-align: center; line-height: 1.5;
        }
      `}</style>

      {/* ================= ÜST BAŞLIK ================= */}
      <div className="yz-ust">
        <div className="yz-firma">
          {firmaLogosu && <img className="yz-logo" src={firmaLogosu} alt="" />}
          <div>
            <div className="yz-firma-ad">{firmaAdi}</div>
            <div className="yz-firma-alt">PVC &amp; Alüminyum Doğrama Sistemleri</div>
            {(firmaTelefon || firmaEposta) && (
              <div className="yz-firma-alt">
                {firmaTelefon}{firmaTelefon && firmaEposta ? ' · ' : ''}{firmaEposta}
              </div>
            )}
          </div>
        </div>

        <div className="yz-belge">
          <div className="yz-belge-ad">Fiyat Teklifi</div>
          <div className="yz-belge-satir">No: {no}</div>
          <div className="yz-belge-satir">Tarih: {bugun}</div>
          <div className="yz-belge-satir">Geçerlilik: {gecerlilik}</div>
        </div>
      </div>

      {/* ================= MÜŞTERİ ================= */}
      <div className="yz-musteri">
        <div>
          <div className="yz-alan-etiket">Sayın / Proje</div>
          <div className="yz-alan-deger">{projeAdi || '—'}</div>
        </div>
        <div>
          <div className="yz-alan-etiket">Telefon</div>
          <div className="yz-alan-deger">{musteriTel || '—'}</div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="yz-alan-etiket">Adres</div>
          <div className="yz-alan-deger" style={{ fontWeight: 500 }}>
            {musteriAdres || '—'}
          </div>
        </div>
      </div>

      {/* ================= FİYAT TABLOSU ================= */}
      <table className="yz-tablo">
        <thead>
          <tr>
            <th style={{ width: '28px' }}>#</th>
            <th>Ürün</th>
            <th className="orta" style={{ width: '108px' }}>Ölçü (mm)</th>
            <th className="orta" style={{ width: '52px' }}>Adet</th>
            <th className="sag" style={{ width: '92px' }}>Birim (₺)</th>
            <th className="sag" style={{ width: '100px' }}>Tutar (₺)</th>
          </tr>
        </thead>
        <tbody>
          {sepet.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', color: '#8492a8', padding: '18px' }}>
                Teklife eklenmiş ürün bulunmuyor.
              </td>
            </tr>
          ) : (
            sepet.map((k, i) => {
              const adet = Number(k.adet) || 1;
              const tutar = Number(k.fiyat) || 0;
              const birim = Math.round(tutar / adet);
              return (
                <tr key={k.id || i}>
                  <td className="yz-sira">{i + 1}</td>
                  <td>
                    <div className="yz-urun-ad">{k.isim || URUN_ADLARI[k.urunTipi] || 'Ürün'}</div>
                    <div className="yz-urun-not">
                      {URUN_ADLARI[k.urunTipi] || k.urunTipi}
                      {k.renkIsmi && k.renkIsmi !== 'Standart' ? ` · ${k.renkIsmi}` : ''}
                      {k.camIsmi ? ` · ${k.camIsmi}` : ''}
                    </div>
                  </td>
                  <td className="orta">
                    {Math.round(Number(k.genislik) || 0)} × {Math.round(Number(k.yukseklik) || 0)}
                  </td>
                  <td className="orta">{adet}</td>
                  <td className="sag">{paraFormat(birim)}</td>
                  <td className="sag" style={{ fontWeight: 700 }}>{paraFormat(tutar)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* ================= TOPLAM ================= */}
      <div className="yz-toplam-kutu">
        <div className="yz-toplam">
          <div className="yz-toplam-satir">
            <span>Kalem sayısı</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{sepet.length}</span>
          </div>
          <div className="yz-toplam-satir">
            <span>Toplam adet</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{toplamAdet}</span>
          </div>
          <div className="yz-toplam-genel">
            <span>GENEL TOPLAM</span>
            <b>{paraFormat(toplam)} ₺</b>
          </div>
          <div style={{ textAlign: 'right', fontSize: '8.5pt', color: '#5d6b80', marginTop: '3px' }}>
            {kdvDahilMi ? 'KDV dahildir.' : 'Fiyatlara KDV dahil değildir.'}
          </div>
        </div>
      </div>

      {/* ================= NOT / ÖDEME ================= */}
      <div className="yz-alt-bilgi">
        <div className="yz-kutu">
          <div className="yz-kutu-baslik">Sipariş Notu</div>
          <div className="yz-kutu-icerik">
            {siparisNotu || 'Belirtilen ölçüler yerinde teyit edildikten sonra imalata başlanır.'}
          </div>
        </div>
        <div className="yz-kutu">
          <div className="yz-kutu-baslik">Ödeme Bilgileri</div>
          <div className="yz-kutu-icerik">
            {iban ? (
              <>
                <div style={{ color: '#5d6b80', fontSize: '8.5pt' }}>IBAN</div>
                <div className="yz-iban">{iban}</div>
                <div style={{ marginTop: 4, fontSize: '8.5pt', color: '#5d6b80' }}>
                  Alıcı: {firmaAdi}
                </div>
              </>
            ) : (
              'Ödeme koşulları için lütfen bizimle iletişime geçin.'
            )}
          </div>
        </div>
      </div>

      {/* ================= ÇİZİM GALERİSİ ================= */}
      {dogramalar.length > 0 && (
        <div className="yz-cizimler">
          <div className="yz-bolum-baslik">Ürün Görselleri</div>
          <div className="yz-cizim-grid">
            {dogramalar.map((k, i) => (
              <div className="yz-cizim-kart" key={k.id || `c-${i}`}>
                <div className="yz-cizim-baslik">
                  <span className="yz-cizim-ad">{k.isim || URUN_ADLARI[k.urunTipi]}</span>
                  <span className="yz-cizim-olcu">
                    {Math.round(Number(k.genislik) || 0)} × {Math.round(Number(k.yukseklik) || 0)}
                    {(Number(k.adet) || 1) > 1 ? ` · ${k.adet} adet` : ''}
                  </span>
                </div>
                <DogramaCizim
                  urunTipi={k.urunTipi}
                  genislik={k.genislik}
                  yukseklik={k.yukseklik}
                  sagYukseklik={k.sagYukseklik}
                  bolmeSayisi={k.bolmeSayisi || 1}
                  bolmeGenislikleri={null}
                  kanatlar={k.kanatlar || ['sabit']}
                  renkId={k.renk || 'beyaz'}
                  profilSerisi={k.profilSerisi || 70}
                  lambiriVar={!!k.altPanelLambiri}
                  lambiriBoyu={k.lambiriBoyu || 900}
                  enineBolmeVar={!!k.enineBolmeVar}
                  enineBolmeYuksekligi={k.enineBolmeYerdenYukseklik || 900}
                  sineklikIste={false}
                  camParcalari={null}
                  camEtiketGoster={false}
                  etiketGoster={false}
                  tuvalGenisligi={420}
                  tuvalYuksekligi={300}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= İMZA ================= */}
      <div className="yz-imza">
        <div className="yz-imza-alan">
          <div className="yz-imza-cizgi" />
          <div className="yz-imza-etiket">{firmaAdi} — Yetkili</div>
        </div>
        <div className="yz-imza-alan">
          <div className="yz-imza-cizgi" />
          <div className="yz-imza-etiket">Müşteri — Onay</div>
        </div>
      </div>

      <div className="yz-dipnot">
        Bu teklif {gecerlilik} tarihine kadar geçerlidir. Ölçüler yerinde teyit edilecektir.
        <br />
        eWindoore ile hazırlanmıştır.
      </div>
    </div>
  );

  /* Şablon doğrudan body'ye basılır: böylece yazdırmada #root'u gizlemek
     onu da gizlemez. Ekranda görünmez (display:none), sadece @media print
     içinde açılır. */
  if (typeof document === 'undefined' || !document.body) return null;
  return createPortal(icerik, document.body);
}
