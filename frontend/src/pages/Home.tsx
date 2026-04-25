import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Shuffle, Swords, Target, Zap, Trophy } from 'lucide-react';
import { MascotStatic } from '../components/mascot';
import { useActiveMascot } from '../components/mascot-provider';
import { getLevelInfo, getXpProgress } from '../lib/utils';
import { api } from '../api/axiosClient'; // Підключаємо твій клієнт

export default function Home() {
  const globalActiveMascot = useActiveMascot();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/v1/profiles/me');
        setUser(response.data);
      } catch (error) {
        console.error("Помилка завантаження профілю", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const totalCooked = 0;
  const totalCompleted = 0;
  const cuisine = 'Італійська';

  const todayChallenge = {
    description: 'Приготуй будь-яку страву Італійської кухні',
    bonus_points: 75
  };

  const pendingBattles: any[] = [];

  const currentXp = user?.xp || 0;
  const ratingScore = user?.ratingScore || 0;
  const levelInfo = getLevelInfo(currentXp);
  const xpProgress = getXpProgress(currentXp);
  const displayLevel = user?.level || levelInfo?.level || 1;
  const username = user?.username || 'Користувач';
  const activeMascot = user?.activeMascot || globalActiveMascot || 'broccoli';

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (xpProgress / 100) * circumference;

  return (
      <div className="space-y-5">

        <div className="flex justify-center animate-slide-up">
          <MascotStatic
              name={activeMascot as any}
              mood="happy"
              size={100}
              message={loading ? "Завантаження..." : `Вітаю, ${username}!`}
          />
        </div>

        <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-3xl p-5 border border-white/5 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <svg width="100" height="100" className="rotate-[-90deg]">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#2a2a4a" strokeWidth="6" />
                <circle
                    cx="50" cy="50" r={radius} fill="none" stroke="#58cc02" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={dashOffset} className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <img src={`/mascots/${activeMascot}_happy.png`} alt="" className="w-[60px] h-[60px] object-contain drop-shadow-md" />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg">
                LVL {displayLevel}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold text-white truncate">
                {loading ? 'Завантаження...' : username}
              </h1>
              <p className="text-xs text-gray-400 font-medium">{levelInfo?.name || 'Досвідчений кухар'}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <Zap size={12} className="text-green-400" />
                <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full transition-all duration-1000" style={{ width: `${xpProgress}%` }} />
                </div>
                <span className="text-[10px] text-green-400 font-bold">{currentXp} XP</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <p className="text-lg font-extrabold text-yellow-400">{totalCooked}</p>
              <p className="text-[10px] text-gray-500 font-medium">Рецептів</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <p className="text-lg font-extrabold text-purple-400">{totalCompleted}</p>
              <p className="text-[10px] text-gray-500 font-medium">Квестів</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <p className="text-lg font-extrabold text-orange-400">{ratingScore}</p>
              <p className="text-[10px] text-gray-500 font-medium">Рейтинг</p>
            </div>
          </div>
        </div>

        {/* Виклики на батл */}
        {pendingBattles.length > 0 && (
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {pendingBattles.map((battle) => (
                  <div key={battle.id} className="block bg-red-500/10 border border-red-500/20 rounded-2xl p-4 hover:bg-red-500/15 transition-all animate-pulse-glow" style={{ '--accent-glow': 'rgba(239,68,68,0.3)' } as React.CSSProperties}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                        <Swords size={20} className="text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-red-300 text-sm">{battle.challenger.username} кидає виклик!</p>
                        <p className="text-xs text-red-400/60">{battle.recipe.name}</p>
                      </div>
                      <span className="text-xs text-red-400 font-bold bg-red-500/20 px-2 py-1 rounded-lg">БАТЛ</span>
                    </div>
                  </div>
              ))}
            </div>
        )}

        {/* Конкретний щоденний квест */}
        {todayChallenge && (
            <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/20 rounded-2xl p-5 hover:border-purple-500/40 transition-all cursor-pointer">
                <div className="absolute top-2 right-2 bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  +{todayChallenge.bonus_points} XP
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Target size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Квест дня</p>
                    <p className="text-xs text-gray-500">{cuisine} кухня</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-white mt-1">{todayChallenge.description}</p>
                <div className="mt-3 bg-purple-500 hover:bg-purple-400 text-white text-center font-bold py-2 rounded-xl text-sm transition-colors">
                  Виконати квест
                </div>
              </div>
            </div>
        )}

        {/* Тиждень кухні */}
        <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="bg-gradient-to-br from-purple-600/10 to-violet-600/10 border border-purple-500/10 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Target size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Тиждень {cuisine} кухні</p>
                <p className="text-xs text-gray-500">Готуй та отримуй бонусні бали</p>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки генерації */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link to="/generate?mode=photo" className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-4 hover:border-orange-500/30 transition-all group">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
              <Camera className="text-orange-400" size={22} />
            </div>
            <h3 className="font-bold text-white text-sm">Скан фото</h3>
            <p className="text-[11px] text-gray-500 mt-1 leading-tight">AI визначить інгредієнти</p>
          </Link>
          <Link to="/generate?mode=random" className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-4 hover:border-amber-500/30 transition-all group">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
              <Shuffle className="text-amber-400" size={22} />
            </div>
            <h3 className="font-bold text-white text-sm">Генератор</h3>
            <p className="text-[11px] text-gray-500 mt-1 leading-tight">AI підбере рецепт</p>
          </Link>
        </div>

        <Link
            to="/leaderboard"
            className="block bg-[#1a1a2e] border border-white/5 rounded-2xl p-4 hover:border-yellow-500/20 transition-all animate-slide-up"
            style={{ animationDelay: '0.25s' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Trophy className="text-yellow-400" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm">Leaderboard</p>
              <p className="text-xs text-gray-500">Your rating: #{ratingScore}</p>
            </div>
            <span className="text-xs text-yellow-400 font-bold">→</span>
          </div>
        </Link>
      </div>
  );
}