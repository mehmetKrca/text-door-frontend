import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function KullaniciSozlesmesi() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '30px 20px', color: '#0F172A' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        
        {/* PROFİL SEKMESİNE DOĞRUDAN YÖNLENDİREN GERİ BUTONU */}
        <button 
          onClick={() => navigate('/cizim', { state: { aktifSekme: 'profil' } })} 
          style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: 'bold', color: '#1E3A8A', cursor: 'pointer', marginBottom: '20px' }}
        >
          ← Profilim Sekmesine Dön
        </button>

        <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1E3A8A', marginBottom: '10px', borderBottom: '2px solid #E2E8F0', paddingBottom: '15px' }}>
          eWindoore SAAS YAZILIM KULLANICI VE HİZMET SÖZLEŞMESİ
        </h1>
        <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '30px' }}>Son Güncelleme Tarihi: 05 Ağustos 2026</p>

        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#334155', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>1. Taraflar ve Sözleşmenin Konusu</h3>
            <p>İşbu Kullanıcı Sözleşmesi ("Sözleşme"), eWindoore Yazılım Teknolojileri A.Ş. ile eWindoore platformuna üye olan PVC / Alüminyum İmalatçısı, Atölye veya Kullanıcı arasında akdedilmiştir. Sözleşme, platformun kullanım şartlarını ve tarafların hak/yükümlülüklerini düzenler.</p>
          </section>

          <section>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>2. Hizmet Şartları ve Sorumluluk Sınırları</h3>
            <p>eWindoore; 2D doğrama çizimi, otomatik kaset/profil boyu hesaplama, fiyat matrisi çıkarma ve CRM süreç takibi hizmetleri sunan bir SaaS platformudur.</p>
            <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
              <li><strong>Çizim ve Ölçü Sorumluluğu:</strong> Kullanıcı, platforma girdiği milimetrik en/boy ve doğrama verilerinin doğruluğundan bizzat sorumludur. eWindoore, yanlış girilen ölçülerden kaynaklanan kesim ve imalat hatalarından sorumlu tutulamaz.</li>
              <li><strong>Hesap Güvenliği:</strong> Kullanıcı, hesabına ait kullanıcı adı ve şifrelerin güvenliğinden sorumludur. Alt usta/personel hesaplarının yetkisiz kullanımından doğacak zararlar Kullanıcı sorumluluğundadır.</li>
            </ul>
          </section>

          <section>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>3. Abonelik ve Fiyatlandırma</h3>
            <p>Kullanıcılar belirlenen 14 günlük ücretsiz deneme süresinin ardından seçtikleri aylık veya yıllık abonelik paketleri doğrultusunda hizmetten yararlanmaya devam ederler. Abonelik iptalleri bir sonraki fatura döneminden itibaren geçerli olur.</p>
          </section>

          <section>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>4. Fikri Mülkiyet Hakları</h3>
            <p>eWindoore yazılımının tüm kod yapısı, tasarım motoru, SVG çizim algoritmaları ve görsel arayüzleri eWindoore Software’e aittir. İzinsiz kopyalanması, kopyalanarak çoğaltılması veya tersine mühendislik uygulanması yasaktır.</p>
          </section>
        </div>

      </div>
    </div>
  );
}