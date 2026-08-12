import React from 'react';

export default function SiparisSepeti({ proje, projeAlanDegistir, sepet, sepetAksiyonlari, patronMu, aksiyonlar }) {
  const { liste, genelToplam, duzenlenenId } = sepet;

  return (
    <div style={{ padding: '14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
      <div className="mobil-sutun" style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div className="mobil-tam-genislik" style={{ flex: '1.5', minWidth: '260px' }}>
          <strong style={{ color: '#1E3A8A', display: 'block', marginBottom: '8px', fontSize: '14px' }}>📝 Proje ve Müşteri Bilgileri:</strong>
          <div className="mobil-sutun" style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Müşteri / Proje Adı (Zorunlu)" value={proje.ad} onChange={(e) => projeAlanDegistir('ad', e.target.value)} style={{ flex: '2', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}/>
            <input type="text" placeholder="Telefon (Opsiyonel)" value={proje.tel} onChange={(e) => projeAlanDegistir('tel', e.target.value)} style={{ flex: '1', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}/>
            <input type="text" value={proje.tarih} onChange={(e) => projeAlanDegistir('tarih', e.target.value)} style={{ width: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}/>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <input type="text" placeholder="Müşteri Adresi (Fatura için opsiyonel)" value={proje.adres} onChange={(e) => projeAlanDegistir('adres', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}/>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <textarea placeholder="Siparişe / Atölyeye özel notlar ekleyin (Müşteri PDF'te görebilir)" value={proje.not} onChange={(e) => projeAlanDegistir('not', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', minHeight: '50px' }}></textarea>
          </div>

          <div className="mobil-sutun" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="mobil-tam-genislik" onClick={aksiyonlar.kaydet} style={{ padding: '8px 12px', backgroundColor: '#1E3A8A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Arşive Kaydet</button>
            <button className="mobil-tam-genislik" onClick={aksiyonlar.whatsapp} style={{ padding: '8px 12px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>WhatsApp 💬</button>
            <button className="mobil-tam-genislik" onClick={aksiyonlar.pdfYazdir} style={{ padding: '8px 12px', backgroundColor: '#37474f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>PDF Yazdır 🖨️</button>
            <button className="mobil-tam-genislik" onClick={aksiyonlar.yeniProje} style={{ padding: '8px 12px', backgroundColor: '#78909c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Yeni Proje</button>
          </div>
        </div>
      </div>

      <h3 style={{ margin: '0 0 12px 0', color: '#1E3A8A', borderBottom: '2px solid #ddd', paddingBottom: '8px', fontSize: '16px' }}>
        Sipariş Listesi ve Fiyatlar
      </h3>

      {liste.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px' }}><p style={{ color: '#777', fontStyle: 'italic', fontSize: '13px' }}>Sepetinizde ürün bulunmamaktadır.</p></div>
      ) : (
        <div>
          <div className="tablo-kapsayici">
            <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #e2e8f0', minWidth: '550px' }}>
              <thead>
                <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A' }}>
                  <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Kalem Adı</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Tip</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Ölçü</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Detay</th>
                  {patronMu && (
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Tutar</th>
                  )}
                  <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((kalem) => (
                  <tr key={kalem.id} onClick={() => sepetAksiyonlari.duzenle(kalem)} style={{ cursor: 'pointer', backgroundColor: duzenlenenId === kalem.id ? '#f1f5f9' : 'transparent' }}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#1E3A8A' }}>{kalem.isim}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textTransform: 'capitalize' }}>{kalem.urunTipi.replace('_', ' ')}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{kalem.genislik}x{kalem.yukseklik} {kalem.adet > 1 && `(x${kalem.adet})`}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{kalem.renkIsmi || kalem.renk}</td>
                    {patronMu && (
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 'bold', color: '#1E3A8A' }}>
                        {Math.ceil(Number(kalem.fiyat) || 0).toLocaleString('tr-TR')} ₺
                      </td>
                    )}
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                      <button onClick={(e) => { e.stopPropagation(); sepetAksiyonlari.sil(kalem.id); }} style={{ padding: '4px 8px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>Sil</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {patronMu && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '2px solid #cfd8dc', textAlign: 'right' }}>
              <span style={{ fontSize: '14px', color: '#546e7a', marginRight: '10px' }}>Proje Genel Toplamı:</span>
              <h2 style={{ margin: '0', color: '#1E3A8A', fontSize: '24px', display: 'inline-block' }}>
                {Math.ceil(genelToplam).toLocaleString('tr-TR')} ₺
              </h2>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
