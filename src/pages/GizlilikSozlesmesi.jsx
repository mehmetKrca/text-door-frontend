import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function GizlilikSozlesmesi() {
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
          eWindoore SOFTWARE KİŞİSEL VERİLERİN KORUNMASI VE GİZLİLİK POLİTİKASI
        </h1>
        <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '30px' }}>Son Güncelleme Tarihi: 05 Ağustos 2026</p>

        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#334155', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>1. Veri Sorumlusu</h3>
            <p>eWindoore Yazılım Teknolojileri A.Ş. ("Şirket") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve ilgili mevzuat uyarınca, kullanıcılarımızın kişisel verilerinin gizliliğini ve güvenliğini en üst düzeyde korumayı taahhüt etmekteyiz.</p>
          </section>

          <section>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>2. İşlenen Kişisel Veriler ve Toplama Yöntemleri</h3>
            <p>Platformumuz üzerinden sağlanan hizmetler kapsamında aşağıdaki verileriniz işlenmektedir:</p>
            <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
              <li><strong>Kimlik ve İletişim Bilgileri:</strong> Ad, Soyad, Telefon Numarası, E-posta Adresi, Firma / Atölye Unvanı.</li>
              <li><strong>Sistem ve Kullanım Verileri:</strong> Çizim parametreleri, imalat metrajları, fiyat matrisleri, IP adresi ve cihaz bilgileri.</li>
              <li><strong>Finansal Veriler:</strong> Fatura bilgileri, ödeme / abonelik durumu (Kredi kartı bilgileriniz 256-bit SSL ile doğrudan BDDK lisanslı ödeme kuruluşuna aktarılır, sunucularımızda saklanmaz).</li>
            </ul>
          </section>

          <section>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>3. Verilerin İşlenme Amaçları</h3>
            <p>Toplanan kişisel verileriniz;</p>
            <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
              <li>eWindoore dijital çizim ve hesaplama motorunun kesintisiz çalıştırılması,</li>
              <li>Atölye verilerinizin ve müşteri teklif arşivlerinizin firma bazlı izolasyonu (Multi-Tenant) ve güvenli depolanması,</li>
              <li>Müşteri destek süreçlerinin yürütülmesi ve teknik güncellemelerin bildirilmesi,</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmektedir.</li>
            </ul>
          </section>

          <section>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>4. Veri İzolasyonu ve Üçüncü Taraflarla Paylaşım</h3>
            <p>eWindoore altyapısında depolanan proje çizimleriniz, müşteri bilgileriniz ve maliyet verileriniz strictly firma bazlı izole edilmiştir. Verileriniz, yasal zorunluluklar saklı kalmak kaydıyla rakip firmalarla veya alakasız üçüncü şahıslarla kesinlikle paylaşılmaz.</p>
          </section>

          <section>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>5. KVKK Kapsamındaki Haklarınız</h3>
            <p>KVKK'nın 11. maddesi uyarınca dilediğiniz zaman destek@eWindoore.com adresi üzerinden Şirketimize başvurarak verilerinizin silinmesini, anonim hale getirilmesini veya düzeltilmesini talep edebilirsiniz.</p>
          </section>
        </div>

      </div>
    </div>
  );
}