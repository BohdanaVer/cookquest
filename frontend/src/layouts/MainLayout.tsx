import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ChefHat, Target, Trophy, ShoppingBag, Users, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../api/axiosClient';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await api.get('/api/v1/profiles/me');
        setUser(response.data);
      } catch (error) {
        console.error("Помилка завантаження даних шапки", error);
      }
    };

    fetchProfileData();
  }, []);

  const balance = user?.balance ?? "...";
  const ratingScore = user?.ratingScore ?? user?.rating_score ?? "...";
  const activeMascot = user?.activeMascot || "broccoli";

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { href: '/home', icon: Home, label: 'Головна' },
    { href: '/generate', icon: ChefHat, label: 'Рецепти' },
    { href: '/challenges', icon: Target, label: 'Квести' },
    { href: '/leaderboard', icon: Trophy, label: 'Рейтинг' },
    { href: '/shop', icon: ShoppingBag, label: 'Магазин' },
    { href: '/friends', icon: Users, label: 'Друзі' },
  ];

  return (
      <div className="min-h-screen bg-[#0f0f23] text-white flex flex-col relative">
        <nav className="bg-[#1a1a2e]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between h-12">
              <Link to="/home" className="flex items-center gap-2 font-bold text-orange-400">
                <span className="text-xl">🍳</span>
                <span className="text-sm font-extrabold tracking-wide uppercase">CookQuest</span>
              </Link>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-full text-xs font-bold">
                    <span>💰</span> {balance}
                  </div>
                  <div className="flex items-center gap-1 bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full text-xs font-bold">
                    <span>🏆</span> {ratingScore}
                  </div>
                </div>
                <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden border-2 border-orange-500/30 hover:border-orange-500 transition-colors flex-shrink-0">
                  <img src={`/mascots/${activeMascot}_happy.png`} alt="profile" className="w-full h-full object-cover" />
                </Link>
                <button onClick={handleLogout} className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 w-full max-w-lg mx-auto overflow-y-auto px-4 py-4 pb-24">
          <Outlet />
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a2e]/95 backdrop-blur-md border-t border-white/5">
          <div className="max-w-4xl mx-auto px-2">
            <div className="flex items-center justify-around h-16">
              {navItems.map(({ href, icon: Icon, label }) => {
                const isActive = location.pathname.startsWith(href);
                return (
                    <Link key={href} to={href} className={cn('flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px]', isActive ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300')}>
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-all', isActive ? 'bg-orange-500/20 shadow-[0_0_12px_rgba(255,107,53,0.2)]' : 'hover:bg-white/5')}>
                        <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                      </div>
                      <span className="text-[10px] font-medium">{label}</span>
                    </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
  );
}