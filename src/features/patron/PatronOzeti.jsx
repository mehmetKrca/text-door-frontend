import React from 'react';
import { ARALIK_ADLARI, URUN_ADLARI, DURUM_ADLARI } from '../../utils/patronOzeti.js';
import { CAM_TIPLERI, SINEKLIK_TIPLERI } from '../../utils/fiyatTablosu.js';

const monoStil = { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' };

export default function PatronOzeti({ ozet, aralik, aralikDegis, baslangic, bitis, baslangicDegis, bitisDegis }) {
  return (
    <div style={{ padding: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '380px', width: '100%', boxSizing: 'border-box' }}>
      <div className="mobil-sutun" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1E3A8A', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', color: '#1E3A8A', fontSize: '20px' }}>📊 Patron & Fabrika Analiz Özeti</h3>
          <p style={{ margin: 0, color: '#555', fontSize: '12px' }}>Seçtiğiniz döneme göre ciro, tüketim ve satış kırılımını görün.</p>
        </div>
        <div className="mobil-tam-genislik" style={{ display: 'flex', gap: '6px' }}>
          {Object.entries(ARALIK_ADLARI).map(([id, ad]) => (
            <button key={id} onClick={() => aralikDegis(id)} style={{ flex: 1, padding: '8px 14px', backgroundColor: aralik === id ? '#1E3A8A' : '#f1f5f9', color: aralik === id ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap' }}>
              {ad}
            </button>
          ))}
        </div>
      </div>

      {aralik === 'ozel' && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#1E3A8A', fontWeight: 'bold' }}>
            Başlangıç:
            <input type="date" value={baslangic || ''} onChange={(e) => baslangicDegis(e.target.value)} style={{ display: 'block', marginTop: '4px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }} />
          </label>
          <label style={{ fontSize: '12px', color: '#1E3A8A', fontWeight: 'bold' }}>
            Bitiş:
            <input type="date" value={bitis || ''} onChange={(e) => bitisDegis(e.target.value)} style={{ display: 'block', marginTop: '4px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }} />
          </label>
          {!baslangic || !bitis ? (
            <span style={{ fontSize: '11px', color: '#c62828', paddingBottom: '8px' }}>İki tarihi de seçin.</span>
          ) : null}
        </div>
      )}

      {/* 4 ÖZET KART */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', textAlign: 'center' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>💰</span>
          <strong style={{ color: '#757575', fontSize: '12px', display: 'block', textTransform: 'uppercase' }}>Ciro</strong>
          <span style={{ ...monoStil, color: '#1E3A8A', fontSize: '22px', fontWeight: '900', display: 'block', marginTop: '6px' }}>
            {ozet.ciro.toLocaleString('tr-TR')} ₺
          </span>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', textAlign: 'center' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>📁</span>
          <strong style={{ color: '#757575', fontSize: '12px', display: 'block', textTransform: 'uppercase' }}>Proje Sayısı</strong>
          <span style={{ ...monoStil, color: '#1E3A8A', fontSize: '22px', fontWeight: '900', display: 'block', marginTop: '6px' }}>
            {ozet.projeSayisi}
          </span>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', textAlign: 'center' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>📦</span>
          <strong style={{ color: '#757575', fontSize: '12px', display: 'block', textTransform: 'uppercase' }}>Kalem Sayısı</strong>
          <span style={{ ...monoStil, color: '#1E3A8A', fontSize: '22px', fontWeight: '900', display: 'block', marginTop: '6px' }}>
            {ozet.kalemSayisi}
          </span>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', textAlign: 'center' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>🔢</span>
          <strong style={{ color: '#757575', fontSize: '12px', display: 'block', textTransform: 'uppercase' }}>Toplam Adet</strong>
          <span style={{ ...monoStil, color: '#1E3A8A', fontSize: '22px', fontWeight: '900', display: 'block', marginTop: '6px' }}>
            {ozet.toplamAdet}
          </span>
        </div>
      </div>

      {/* PROFİL TÜKETİMİ */}
      <h4 style={{ color: '#1E3A8A', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Profil Tüketimi</h4>
      <div className="tablo-kapsayici" style={{ marginBottom: '24px' }}>
        <table style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '320px' }}>
          <thead>
            <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A' }}>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Seri</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Metre</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Beyaz Seri</td>
              <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{ozet.profil.beyaz.metre.toLocaleString('tr-TR')} m</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Renkli Seri</td>
              <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{ozet.profil.renkli.metre.toLocaleString('tr-TR')} m</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>Toplam</td>
              <td style={{ ...monoStil, padding: '8px', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>{ozet.profil.toplamMetre.toLocaleString('tr-TR')} m</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* CAM TÜKETİMİ */}
      <h4 style={{ color: '#1E3A8A', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Cam Tüketimi</h4>
      <div className="tablo-kapsayici" style={{ marginBottom: '24px' }}>
        <table style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '320px' }}>
          <thead>
            <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A' }}>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Cam Tipi</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>m²</th>
            </tr>
          </thead>
          <tbody>
            {CAM_TIPLERI.map(c => (
              <tr key={c.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{c.ad}</td>
                <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{(ozet.camlar[c.id]?.m2 ?? 0).toFixed(2)} m²</td>
              </tr>
            ))}
            <tr>
              <td style={{ padding: '8px', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>Toplam</td>
              <td style={{ ...monoStil, padding: '8px', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>{ozet.camToplamM2.toFixed(2)} m²</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SİNEKLİK VE PERDE TÜKETİMİ */}
      <h4 style={{ color: '#1E3A8A', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Sineklik ve Perde Tüketimi</h4>
      <div className="tablo-kapsayici" style={{ marginBottom: '24px' }}>
        <table style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '560px' }}>
          <thead>
            <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A' }}>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Tip</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Adet</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Çerçeve (m)</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Kumaş/Tel (m²)</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Tepe Sayısı</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#dbeafe' }}>Ciro</th>
            </tr>
          </thead>
          <tbody>
            {SINEKLIK_TIPLERI.map(sp => {
              const s = ozet.sineklikler[sp.id] || { adet: 0, cerceveM: 0, kumasM2: 0, tepeSayisi: 0, ciro: 0 };
              return (
                <tr key={sp.id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{sp.ad}</td>
                  <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{s.adet}</td>
                  <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{s.cerceveM.toLocaleString('tr-TR')} m</td>
                  <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{s.kumasM2.toFixed(2)} m²</td>
                  <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{s.tepeSayisi}</td>
                  <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee', backgroundColor: '#dbeafe', fontWeight: 'bold', color: '#1E3A8A' }}>{s.ciro.toLocaleString('tr-TR')} ₺</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ÜRÜN BAZLI SATIŞ */}
      <h4 style={{ color: '#1E3A8A', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Ürün Bazlı Satış</h4>
      <div className="tablo-kapsayici" style={{ marginBottom: '24px' }}>
        <table style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '320px' }}>
          <thead>
            <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A' }}>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Ürün</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Adet</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Ciro</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(ozet.urunTipleri).length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: '12px', textAlign: 'center', color: '#777' }}>Bu dönemde satış yok.</td>
              </tr>
            ) : (
              Object.entries(ozet.urunTipleri)
                .sort((a, b) => b[1].ciro - a[1].ciro)
                .map(([tip, v]) => (
                  <tr key={tip}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{URUN_ADLARI[tip] || tip}</td>
                    <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{v.adet}</td>
                    <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{v.ciro.toLocaleString('tr-TR')} ₺</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* DURUM DAĞILIMI */}
      <h4 style={{ color: '#1E3A8A', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Durum Dağılımı</h4>
      <div className="tablo-kapsayici">
        <table style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '320px' }}>
          <thead>
            <tr style={{ backgroundColor: '#eff6ff', color: '#1E3A8A' }}>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Durum</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Proje Sayısı</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(ozet.durumlar).length === 0 ? (
              <tr>
                <td colSpan="2" style={{ padding: '12px', textAlign: 'center', color: '#777' }}>Bu dönemde proje yok.</td>
              </tr>
            ) : (
              Object.entries(ozet.durumlar).map(([durum, sayi]) => (
                <tr key={durum}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{DURUM_ADLARI[durum] || durum}</td>
                  <td style={{ ...monoStil, padding: '8px', borderBottom: '1px solid #eee' }}>{sayi}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
