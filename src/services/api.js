import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8001/api/',
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('access');
    
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
// Abonelik durumunu (kalan gün, deneme bitti mi vs.) sorgular
export const getAbonelikDurumu = () => API.get('users/abonelik-durumu/');

// Paywall ekranında ödeme tamamlandığında aboneliği başlatır
export const abonelikBaslat = (periyot = 'Aylık') => API.post('users/abonelik-baslat/', { periyot });