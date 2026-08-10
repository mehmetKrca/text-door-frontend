import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api/';

const API = axios.create({
  baseURL: BASE_URL,
});

// Refresh cagrisi icin interceptor'suz ayri bir axios instance'i
// (aksi halde bu istek de Authorization header'i alir ve dongu riski dogar)
const refreshClient = axios.create({
  baseURL: BASE_URL,
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

// Ayni anda birden fazla istek 401 alirsa tek bir refresh cagrisi yapilir,
// digerleri bu cagrinin sonucunu bekler.
let isRefreshing = false;
let pendingQueue = [];

const resolvePendingQueue = (error, newAccessToken) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(newAccessToken);
    }
  });
  pendingQueue = [];
};

const oturumuSonlandir = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('access');
  window.location.href = '/login';
};

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      oturumuSonlandir();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Refresh zaten devam ediyor: bu istegi kuyruga ekleyip sonucunu bekle
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newAccessToken) => {
        originalRequest._retry = true;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      }).catch((queueError) => Promise.reject(queueError));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    return refreshClient
      .post('users/login/refresh/', { refresh: refreshToken })
      .then((response) => {
        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }

        resolvePendingQueue(null, newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      })
      .catch((refreshError) => {
        resolvePendingQueue(refreshError, null);
        oturumuSonlandir();
        return Promise.reject(refreshError);
      })
      .finally(() => {
        isRefreshing = false;
      });
  }
);

export default API;

// Abonelik durumunu (kalan gün, deneme bitti mi vs.) sorgular
export const getAbonelikDurumu = () => API.get('users/abonelik-durumu/');

// Paywall ekranında ödeme tamamlandığında aboneliği başlatır
export const abonelikBaslat = (periyot = 'Aylık') => API.post('users/abonelik-baslat/', { periyot });
