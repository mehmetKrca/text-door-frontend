import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import API from '../services/api'

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firma_adi: '',
    telefon: '',
    paket_id: ''
  })

  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [mesaj, setMesaj] = useState({ text: '', type: '' })

  // Sayfa açıldığı an admin panelindeki paketleri Django'dan çekiyoruz
  useEffect(() => {
    API.get('users/packages/')
      .then(response => {
        // Django'dan gelen veri listesini state'e atıyoruz
        setPackages(response.data)
      })
      .catch(error => {
        console.error("Paketler yüklenirken hata oluştu:", error)
      })
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMesaj({ text: '', type: '' })

    try {
      const response = await API.post('users/register/', formData)

      if (response.status === 201 || response.status === 200) {
        setMesaj({ text: 'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsun...', type: 'success' })
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      }
    } catch (error) {
      console.error("Kayıt hatası:", error.response?.data)
      setMesaj({ text: 'Bu kullanıcı adı veya e-posta zaten alınmış ya da eksik alan var kanka!', type: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid min-vh-100 d-flex justify-content-center align-items-center bg-gradient py-5" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
      <div className="card shadow-lg p-5 border-0" style={{ width: '100%', maxWidth: '500px', borderRadius: '20px', backdropFilter: 'blur(10px)' }}>
        
        <div className="text-center mb-4">
          <div className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-2 rounded-pill mb-3">
            🚀 Profesyonel SaaS Altyapısı
          </div>
          <h2 className="fw-bold text-dark">Hemen Ücretsiz Başla</h2>
          <p className="text-muted small">İşletmeni dijitale taşı, projelerini kolayca yönet.</p>
        </div>

        {mesaj.text && (
          <div className={`alert alert-${mesaj.type} text-center fw-semibold`} role="alert">
            {mesaj.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold text-secondary small">Kullanıcı Adı</label>
              <input
                type="text"
                name="username"
                className="form-control form-control-lg bg-light border-0"
                placeholder="farkli_bir_isim"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold text-secondary small">Firma Adı</label>
              <input
                type="text"
                name="firma_adi"
                className="form-control form-control-lg bg-light border-0"
                placeholder="Firma / Atölye adınız"
                value={formData.firma_adi}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary small">Telefon Numarası</label>
            <input
              type="text"
              name="telefon"
              className="form-control form-control-lg bg-light border-0"
              placeholder="0532 000 00 00"
              value={formData.telefon}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary small">E-posta Adresi</label>
            <input
              type="email"
              name="email"
              className="form-control form-control-lg bg-light border-0"
              placeholder="ornek@mail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Admin Panelinden Eklediğin Paketlerin Listelendiği Alan */}
          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary small">Abonelik Paketi Seçin</label>
            <select
              name="paket_id"
              className="form-control form-control-lg bg-light border-0"
              value={formData.paket_id}
              onChange={handleChange}
              required
            >
              <option value="">-- Bir Paket Seçiniz --</option>
              {packages && packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.ad} ({pkg.periyot}) - {pkg.fiyat} ₺
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold text-secondary small">Şifre (Giriş için kullanılacak)</label>
            <input
              type="password"
              name="password"
              className="form-control form-control-lg bg-light border-0"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg w-100 fw-bold py-3 shadow-sm"
            style={{ borderRadius: '12px', background: 'linear-gradient(90deg, #007bff 0%, #0056b3 100%)', border: 'none' }}
            disabled={loading}
          >
            {loading ? 'Hesap Oluşturuluyor...' : 'Kayıt Ol ve Firmayı Kur 🚀'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-muted small">
            Zaten hesabın var mı? <Link to="/login" className="text-primary fw-bold text-decoration-none">Giriş Yap</Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default Register