import axios from 'axios';
import { toast } from 'sonner';

import i18n from '../lib/i18n';

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
            toast.error(i18n.t("server_unreachable", "Сервер недоступний. Перевірте з'єднання.") as string);
            return Promise.reject(error);
        }

        if (backendError?.errorCode === 'VALIDATION_ERROR') {
            return Promise.reject(backendError);
        }

        if (backendError?.errorCode) {
            toast.error(i18n.t(backendError.errorCode, backendError.message || backendError.errorCode) as string); 
        }

        return Promise.reject(error);
    }
);