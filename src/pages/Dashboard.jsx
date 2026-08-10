import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

function Dashboard() {
  const navigate = useNavigate()
  
  // Çalışan ekleme formu için state'ler
  const [calisanData, setCalisanData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    telefon: '',
    password: ''
  })
  const [mesaj, setMesaj] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Token kontrolü yapalım, giriş yapmamışsa login'e atalım
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login')
  }

  const handleChange = (e) => {
    setCalisanData({
      ...calisanData,
      [e.target.name]: e.target.value
    })
  }

  const handleCalisanSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMesaj({ text: '', type: '' })

    try {
      const token = localStorage.getItem('access_token')

      const response = await API.post('calisan-ekle/', calisanData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.status === 201 || response.status === 200) {
        setMesaj({ text: 'Çalışan başarıyla sisteme eklendi ve firmaya bağlandı! 🚀', type: 'success' })
        setCalisanData({
          username: '',
          first_name: '',
          last_name: '',
          email: '',
          telefon: '',
          password: ''
        })
      }
    } catch (error) {
      console.error("Çalışan ekleme hatası:", error.response?.data)
      setMesaj({ text: 'Çalışan eklenirken bir hata oluştu. Bilgileri kontrol et kanka.', type: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid min-vh-100 bg-light p-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">🚀 Yönetim Paneli (Dashboard)</h2>
        <button onClick={handleLogout} className="btn btn-danger fw-bold px-4">
          Çıkış Yap
        </button>
      </div>

      <div className="card shadow-sm p-4 border-0 mb-4" style={{ borderRadius: '15px' }}>
        <h4>Hoş geldin kanka! 🎉</h4>
        <p className="text-muted mb-0">14 günlük deneme süren aktif, işletmeni ve çalışanlarını buradan yönetebilirsin.</p>
      </div>

      {/* Çalışan / Usta Ekleme Paneli */}
      <div className="card shadow-sm p-4 border-0" style={{ borderRadius: '15px', maxWidth: '700px' }}>
        <h4 className="fw-bold text-dark mb-3">👥 Yeni Çalışan / Usta Ekle</h4>
        <p className="text-muted small mb-4">Şirketine yeni bir eleman tanımla, belirlediğin şifreyle sisteme giriş yapsın.</p>

        {mesaj.text && (
          <div className={`alert alert-${mesaj.type} text-center fw-semibold`} role="alert">
            {mesaj.text}
          </div>
        )}

        <form onSubmit={handleCalisanSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold text-secondary small">Adı</label>
              <input
                type="text"
                name="first_name"
                className="form-control bg-light border-0"
                placeholder="Mehmet"
                value={calisanData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold text-secondary small">Soyadı</label>
              <input
                type="text"
                name="last_name"
                className="form-control bg-light border-0"
                placeholder="Uslu"
                value={calisanData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold text-secondary small">Kullanıcı Adı</label>
              <input
                type="text"
                name="username"
                className="form-control bg-light border-0"
                placeholder="mehmet_usta"
                value={calisanData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold text-secondary small">Telefon Numarası</label>
              <input
                type="text"
                name="telefon"
                className="form-control bg-light border-0"
                placeholder="0532 000 00 00"
                value={calisanData.telefon}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary small">E-posta Adresi</label>
            <input
              type="email"
              name="email"
              className="form-control bg-light border-0"
              placeholder="mehmet@ornek.com"
              value={calisanData.email}
              onChange={handleChange}
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold text-secondary small">Personel Giriş Şifresi</label>
            <input
              type="password"
              name="password"
              className="form-control bg-light border-0"
              placeholder="••••••••"
              value={calisanData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-success btn-lg w-100 fw-bold py-3 shadow-sm"
            style={{ borderRadius: '12px', border: 'none' }}
            disabled={loading}
          >
            {loading ? 'Kaydediliyor...' : 'Çalışanı Firmaya Kaydet ➕'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Dashboard