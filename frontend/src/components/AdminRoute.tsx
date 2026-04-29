import { Navigate, Outlet } from 'react-router-dom';

export default function AdminRoute() {
    const role = localStorage.getItem('role');

    if (role !== 'ADMIN') {
        return <Navigate to="/home" replace />;
    }

    return <Outlet />;
}