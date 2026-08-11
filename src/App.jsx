import { Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import PvcCizimEkrani from './PvcCizimEkrani'
import { useAuth } from './context/AuthContext.jsx'

// --- YENİ EKLENEN YASAL SÖZLEŞME SAYFALARI ---
import GizlilikSozlesmesi from './pages/GizlilikSozlesmesi'
import KullaniciSozlesmesi from './pages/KullaniciSozlesmesi'

// --- GÜVENLİK DUVARI (KORUMALI ROTA) BİLEŞENİ ---
const KorumaliRota = ({ children }) => {
  const { girisYapildiMi, yukleniyor } = useAuth();

  if (yukleniyor) {
    return <div>Yükleniyor...</div>;
  }

  if (!girisYapildiMi) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      {/* --- HERKESE AÇIK ROTALAR --- */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      
      {/* Yasal Sözleşme Sayfaları */}
      <Route path="/gizlilik-sozlesmesi" element={<GizlilikSozlesmesi />} />
      <Route path="/kullanici-sozlesmesi" element={<KullaniciSozlesmesi />} />
      
      {/* --- KORUMALI ROTALAR (Giriş Zorunlu) --- */}
      <Route 
        path="/cizim" 
        element={
          <KorumaliRota>
            <PvcCizimEkrani />
          </KorumaliRota>
        } 
      />

      <Route 
        path="/dashboard" 
        element={
          <KorumaliRota>
            <PvcCizimEkrani /> {/* Dashboard yerine doğrudan zengin çizim ekranına yönlendirdik */}
          </KorumaliRota>
        } 
      />

      {/* Tanımsız bir URL girilirse ana sayfaya (Vitrini) at */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
  
}
export default App;