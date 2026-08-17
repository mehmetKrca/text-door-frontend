import React from 'react';
import { CAM_TIPLERI, SINEKLIK_TIPLERI, PROFIL_SERILERI } from '../../utils/fiyatTablosu.js';
import ProfilKalibrasyon from '../../components/ProfilKalibrasyon.jsx';

export default function FiyatAyarlari({ tablo, yukleniyor, degistir, kaydet, aktifSeri, seriDegis }) {
  const profilPaylariUygula = (seri, paylar) => {
    Object.entries(paylar).forEach(([alan, deger]) => {
      degistir(['profilPaylari', seri, alan], deger);
    });
  };

  return (
    <>
      <div className="mobil-sutun" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
        <div className="mobil-tam-genislik">
          <strong style={{ color: '#1E3A8A', display: 'block', fontSize: '16px' }}>💰 Birim Fiyat Ayarları</strong>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Değişiklikleri veritabanına sabitleyin.</span>
        </div>
        <button className="mobil-tam-genislik" onClick={kaydet} disabled={yukleniyor} style={{ padding: '10px 16px', backgroundColor: '#1E3A8A', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
          {yukleniyor ? 'Yükleniyor...' : 'Fiyatları Sabitle ☁️'}
        </button>
      </div>

      <div className="mobil-sutun" style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button className="mobil-tam-genislik" onClick={() => seriDegis('beyaz')} style={{ flex: '1', padding: '8px', backgroundColor: aktifSeri === 'beyaz' ? '#1E3A8A' : '#f1f5f9', color: aktifSeri === 'beyaz' ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Beyaz Seri</button>
        <button className="mobil-tam-genislik" onClick={() => seriDegis('renkli')} style={{ flex: '1', padding: '8px', backgroundColor: aktifSeri === 'renkli' ? '#1E3A8A' : '#f1f5f9', color: aktifSeri === 'renkli' ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Renkli Seri</button>
      </div>

      {yukleniyor ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#1E3A8A', fontWeight: 'bold' }}>
          Fiyatlar veritabanından getiriliyor... ☁️
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#1E3A8A', borderBottom: '1px solid #eee', paddingBottom: '4px', fontSize: '13px' }}>
              {aktifSeri === 'beyaz' ? 'Beyaz Seri' : 'Renkli Seri'} Profilleri (m)
            </h4>
            {[
              { key: 'kasa', label: 'Kasa' },
              { key: 'ortakayit', label: 'Ortakayıt' },
              { key: 'pencereKanadi', label: 'Pencere Kanadı' },
              { key: 'kapiKanadi', label: 'Kapı Kanadı' },
              { key: 'surmeKasa', label: 'Sürme Kasa' },
              { key: 'surmeKanadi', label: 'Sürme Kanadı' },
              { key: 'lambiri', label: 'Lambiri' }
            ].map(item => (
              <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                {item.label}:
                <div><input type="number" value={tablo.seriler[aktifSeri][item.key] ?? ''} onChange={(e) => degistir(['seriler', aktifSeri, item.key], e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
              </label>
            ))}
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#1E3A8A', borderBottom: '1px solid #eee', paddingBottom: '4px', fontSize: '13px' }}>Cam Tipleri (m²)</h4>
            {CAM_TIPLERI.map(item => (
              <label key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                {item.ad}:
                <div><input type="number" value={tablo.camlar[item.id] ?? ''} onChange={(e) => degistir(['camlar', item.id], e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
              </label>
            ))}
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px', color: '#1E3A8A' }}>
              Cam İşçiliği:
              <div><input type="number" value={tablo.camIsciligi ?? ''} onChange={(e) => degistir(['camIsciligi'], e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
            </label>
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#1E3A8A', borderBottom: '1px solid #eee', paddingBottom: '4px', fontSize: '13px' }}>Aksesuarlar (Adet)</h4>
            {[
              { key: 'tekAcilim', label: 'Tek Açılım' },
              { key: 'ciftAcilim', label: 'Çift Açılım' },
              { key: 'vasistas', label: 'Vasistas' },
              { key: 'kapiAksesuar', label: 'Genel Aksesuar' },
              { key: 'surmeAksesuar', label: 'Sürme Aksesuarı' }
            ].map(item => (
              <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                {item.label}:
                <div><input type="number" value={tablo.aksesuarlar[item.key] ?? ''} onChange={(e) => degistir(['aksesuarlar', item.key], e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
              </label>
            ))}
          </div>
        </div>
      )}

      {!yukleniyor && (
        <div style={{ marginTop: '12px', backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, color: '#1E3A8A', fontSize: '13px' }}>Sineklik & Perde Fiyatları</h4>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Tepe Adımı (mm):
              <input type="number" value={tablo.tepeAdimiMM ?? ''} onChange={(e) => degistir(['tepeAdimiMM'], e.target.value)} style={{ width: '55px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {SINEKLIK_TIPLERI.map(sp => (
              <div key={sp.id}>
                <h5 style={{ margin: '0 0 8px 0', color: '#1E3A8A', fontSize: '12px' }}>{sp.ad}</h5>
                {[
                  { key: 'cerceveM', label: 'Çerçeve (₺/m)' },
                  ...(sp.renkVar ? [{ key: 'cerceveMRenkli', label: 'Renkli Çerçeve' }] : []),
                  { key: 'kumasM2', label: 'Kumaş/Tel (₺/m²)' },
                  { key: 'tepeBasiBirim', label: 'Tepe Başı (₺/adet)' },
                  { key: 'iscilik', label: 'İşçilik (₺)' }
                ].map(item => (
                  <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                    {item.label}:
                    <div><input type="number" value={tablo[sp.id]?.[item.key] ?? ''} onChange={(e) => degistir([sp.id, item.key], e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> ₺</div>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {!yukleniyor && (
        <div style={{ marginTop: '12px', backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 4px 0', color: '#1E3A8A', fontSize: '13px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>Profil Payları</h4>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 10px 0' }}>
            Bu değerler profil üreticinizin teknik katalogundan gelir. Cam ölçüsü bu paylara göre hesaplanır.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {PROFIL_SERILERI.map(seri => (
              <div key={seri}>
                <h5 style={{ margin: '0 0 8px 0', color: '#1E3A8A', fontSize: '12px' }}>{seri}'lik Seri</h5>
                {[
                  { key: 'kasaPayi', label: 'Kasa Payı (mm)' },
                  { key: 'kayitGenisligi', label: 'Kayıt Genişliği (mm)' },
                  { key: 'kanatCamPayi', label: 'Kanat Cam Payı (yan) (mm)' },
                  { key: 'kanatCamPayiBoy', label: 'Kanat Cam Payı (üst/alt) (mm)' },
                  { key: 'sabitCamPayi', label: 'Sabit Cam Payı (mm)' },
                ].map(item => (
                  <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                    {item.label}:
                    <div><input type="number" value={tablo.profilPaylari?.[seri]?.[item.key] ?? ''} onChange={(e) => degistir(['profilPaylari', seri, item.key], e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> mm</div>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {!yukleniyor && (
        <div style={{ marginTop: '12px' }}>
          <ProfilKalibrasyon tablo={tablo} onUygula={profilPaylariUygula} />
        </div>
      )}
    </>
  );
}
