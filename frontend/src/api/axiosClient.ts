import axios from 'axios';

export const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api', // Адреса твого Spring Boot
    headers: {
        'Content-Type': 'application/json'
    }
});

// Автоматично додаємо токен до кожного запиту (якщо він є)
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});