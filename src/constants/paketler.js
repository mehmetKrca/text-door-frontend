/* ============================================================
   PAKETLER — Login (pazarlama) ve Profil (abonelik) ekranlarinda
   ortak kullanilan fiyat tablosu.
   ============================================================ */
export const PAKETLER = [
  {
    id: 'bireysel',
    ad: 'Bireysel',
    alt: 'Tek kişi çalışan usta ve montaj ekipleri için',
    fiyat: {
      aylik: { tutar: '250', birim: '/ ay' },
      yillik: { tutar: '2.400', birim: '/ yıl', eski: '3.000', not: 'Ayda 200 ₺ — iki ay bedava' },
      tek: { tutar: '4.900', birim: 'tek ödeme', not: 'Ömür boyu erişim, abonelik yok' },
    },
    ozellikler: [
      'Sınırsız çizim ve teklif',
      'İmalat ve kesim listesi',
      'Kurumsal PDF teklif',
      'Müşteri arşivi ve sipariş takibi',
      '1 kullanıcı',
    ],
  },
  {
    id: 'kurumsal',
    ad: 'Kurumsal',
    alt: 'Atölye, bayi ve fabrikalar için — ekip çalışması',
    fiyat: {
      aylik: { tutar: '500', birim: '/ ay' },
      yillik: { tutar: '4.800', birim: '/ yıl', eski: '6.000', not: 'Ayda 400 ₺ — iki ay bedava' },
      tek: { tutar: '9.900', birim: 'tek ödeme', not: 'Ömür boyu erişim, abonelik yok' },
    },
    ozellikler: [
      'Bireysel paketteki her şey',
      'Sınırsız kullanıcı',
      'Patron / usta yetki ayrımı',
      'Ustalara fiyat gizleme',
      'Firma logolu teklifler',
    ],
  },
];

export const PERIYOT_ETIKETLERI = {
  aylik: 'Aylık',
  yillik: 'Yıllık',
  tek: 'Tek Seferlik',
};
