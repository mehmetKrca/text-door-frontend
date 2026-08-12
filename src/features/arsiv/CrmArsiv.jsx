import React from 'react';

export default function CrmArsiv({ arsiv, yukleniyor, durumGuncelle, yukle, sil, durumRenkleri, patronMu }) {
  return (
    <div style={{ padding: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', color: '#1E3A8A', fontSize: '18px' }}>📑 Gelişmiş CRM ve Sipariş Takip Paneli</h3>
          <span style={{ fontSize: '11px', color: '#666' }}>Müşterilerinizin durumunu ve süreçlerini anlık yönetin.</span>
        </div>
        <span style={{ fontSize: '11px', color: '#1E3A8A', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #93c5fd' }}>
          Toplam {arsiv.length} Kayıt
        </span>
      </div>

      {yukleniyor ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#1E3A8A', fontWeight: 'bold' }}>Bulut arşiviniz yükleniyor... ☁️</div>
      ) : arsiv.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ddd' }}><p style={{ color: '#777', fontStyle: 'italic', fontSize: '13px' }}>Henüz kaydedilmiş CRM kaydı yok.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {arsiv.map(kayit => {
            const drm = kayit.durum || 'teklif';
            const drmAyar = durumRenkleri[drm] || durumRenkleri.teklif;
            return (
              <div key={kayit.id} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: `2px solid ${drmAyar.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#777', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Sipariş Durumu:</label>
                  <select value={drm} onChange={(e) => durumGuncelle(kayit.id, e.target.value)} style={{ padding: '6px 8px', borderRadius: '4px', border: `1px solid ${drmAyar.color}`, backgroundColor: drmAyar.bg, color: drmAyar.color, fontWeight: 'bold', fontSize: '12px', width: '100%', cursor: 'pointer', outline: 'none' }}>
                    {Object.keys(durumRenkleri).map(k => (
                      <option key={k} value={k}>{durumRenkleri[k].icon} {durumRenkleri[k].label}</option>
                    ))}
                  </select>
                </div>

                <h4 style={{ margin: '0 0 6px 0', color: '#1E3A8A', fontSize: '15px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                  👤 {kayit.projeAdi || 'İsimsiz Müşteri'}
                </h4>

                <div style={{ fontSize: '12px', color: '#555', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                  <div><strong>📅 Tarih:</strong> {kayit.teklifTarihi}</div>
                  <div><strong>📞 Tel:</strong> {kayit.musteriTel || 'Belirtilmedi'}</div>
                  {kayit.musteriAdres && <div><strong>📍 Adres:</strong> {kayit.musteriAdres}</div>}
                </div>

                {patronMu && (
                  <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#777' }}>Proje Tutarı:</span>
                    <strong style={{ fontSize: '15px', color: '#1E3A8A' }}>{Math.ceil(Number(kayit.toplamFiyat) || 0).toLocaleString('tr-TR')} ₺</strong>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => yukle(kayit)} style={{ flex: '1', padding: '6px 10px', backgroundColor: '#1E3A8A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>Sepete Yükle</button>
                  <button onClick={() => sil(kayit.id)} style={{ padding: '6px 10px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Sil</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
