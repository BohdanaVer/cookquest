export interface BackendError {
    errorCode?: string;
    message?: string;
    validationErrors?: Record<string, string>;
}