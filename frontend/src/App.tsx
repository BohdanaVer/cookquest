import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Лейаути
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';

// Провайдери
import { MascotProvider } from './components/mascot-provider';

// Сторінки
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Generate from './pages/Generate';
import Shop from './pages/Shop';
import Leaderboard from './pages/Leaderboard';
import Friends from './pages/Friends';
import Challenges from './pages/Challenges';
import Profile from './pages/Profile';
import AdminRoute from "./components/AdminRoute.tsx";
import AdminQuestsPanel from './pages/AdminQuestsPanel';

import RecipeDetail from './pages/RecipeDetail';
import Cook from "./pages/Cook.tsx";

export default function App() {
  return (
      <BrowserRouter>
        <MascotProvider>
          <Toaster richColors position="top-right" />

          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route element={<MainLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/generate" element={<Generate />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/challenges" element={<Challenges />} />

              <Route path="/recipe/:id" element={<RecipeDetail />} />
              <Route path="/cook/:id" element={<Cook />} />

            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin/quests" element={<AdminQuestsPanel />} />
            </Route>
          </Routes>

        </MascotProvider>
      </BrowserRouter>
  );
}