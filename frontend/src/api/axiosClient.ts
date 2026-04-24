import axios from 'axios';
import { toast } from 'sonner';

export const api = axios.create({
    baseURL: 'http://localhost:8080', 
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const backendError = error.response?.data;

        if (!error.response) {
            toast.error("Сервер недоступний. Перевірте з'єднання.");
            return Promise.reject(error);
        }

        if (backendError?.errorCode === 'VALIDATION_ERROR') {
            return Promise.reject(backendError);
        }

        // отут треба потім поміняти на нормальне повідомлення
        if (backendError?.errorCode) {
            toast.error(backendError.errorCode); 
        }

        return Promise.reject(error);
    }
);