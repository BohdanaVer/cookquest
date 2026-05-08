import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Shuffle, Swords, Zap, Trophy, ChefHat, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { MascotStatic } from '../components/mascot';
import { useActiveMascot } from '../components/mascot-provider';
import { getLevelInfo, getXpProgress } from '../lib/utils';
import { api } from '../api/axiosClient';
import { useTranslation } from 'react-i18next';

type MascotName = "broccoli" | "slime" | "cheese" | "pepper" | "icecream" | "stove" | "cauldron" | "knightpan";

interface UserProfileData {
  username?: string;
  level?: number;
  levelName?: string;
  xp?: number;
  max_xp?: number;
  balance?: number;
  ratingScore?: number;
  rating_score?: number;
  activeMascot?: string;
  activeMascotImageUrlHappy?: string;
  activeMascotImageUrlNeutral?: string;
  activeMascotImageUrlSad?: string;
}

interface CookingSessionDto {
  sessionId: number;
  recipe: unknown;
  status: string;
  startedAt: string;
}

interface PendingBattle {
  id: string | number;
  challenger: { username: string };
  recipe: { name: string };
}

export default function Home() {
  const { t } = useTranslation();
  const globalActiveMascot = useActiveMascot();

  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeSessions, setActiveSessions] = useState<CookingSessionDto[]>([]);
  const [isSessionsExpanded, setIsSessionsExpanded] = useState(false);

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

    const fetchActiveSessions = async () => {
      try {
        const response = await api.get('/api/v1/cooking/active');
        setActiveSessions(response.data);
      } catch (error) {
        console.error("Помилка завантаження активних сесій", error);
      }
    };

    fetchProfile();
    fetchActiveSessions();
  }, []);

  const getRecipeData = (recipeData: unknown) => {
    if (!recipeData) return { id: '', name: 'Невідомий рецепт' };
    try {
      const parsed = (typeof recipeData === 'string' ? JSON.parse(recipeData) : recipeData) as Record<string, unknown>;
      const realId = parsed.id || parsed.recipeId || parsed.recipe_id || '';
      return { id: String(realId), name: String(parsed.name || 'Невідомий рецепт') };
    } catch {
      return { id: '', name: 'Невідомий рецепт' };
    }
  };

  const totalCooked = 0;
  const totalCompleted = 0;

  const pendingBattles: PendingBattle[] = [];

  const currentXp = user?.xp || 0;
  const ratingScore = user?.ratingScore || user?.rating_score || 0;
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
              name={activeMascot as MascotName}
              mood="happy"
              size={100}
              message={loading ? t('home.loading') : t('home.welcome', { name: username })}
              customImageUrls={{
                  happy: user?.activeMascotImageUrlHappy,
                  neutral: user?.activeMascotImageUrlNeutral,
                  sad: user?.activeMascotImageUrlSad
              }}
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
                <img src={user?.activeMascotImageUrlNeutral || `/mascots/${activeMascot}_happy.png`} alt="" className="w-[60px] h-[60px] object-contain drop-shadow-md" />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg">
                LVL {displayLevel}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold text-white truncate">
                {loading ? t('home.loading') : username}
              </h1>
              <p className="text-xs text-gray-400 font-medium">
                {user?.levelName ? t(`ranks.rank${user.levelName.replace('LEVEL_', '')}`) : t('home.defaultRank')}
              </p>
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
              <p className="text-[10px] text-gray-500 font-medium">{t('home.recipesCooked')}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <p className="text-lg font-extrabold text-purple-400">{totalCompleted}</p>
              <p className="text-[10px] text-gray-500 font-medium">{t('home.questsCompleted')}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <p className="text-lg font-extrabold text-orange-400">{ratingScore}</p>
              <p className="text-[10px] text-gray-500 font-medium">{t('home.rating')}</p>
            </div>
          </div>
        </div>

        {activeSessions.length > 0 && (
            <div className="bg-[#1a1a2e] border border-orange-500/20 rounded-3xl p-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <div className="flex items-center gap-2 mb-4">
                <ChefHat size={18} className="text-orange-500" />
                <h2 className="text-sm font-bold text-white">{t('home.activeSessions', 'Активні готування')}</h2>
                <span className="bg-orange-500/20 text-orange-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {activeSessions.length}
                </span>
              </div>

              <div className="space-y-4">
                {activeSessions.slice(0, isSessionsExpanded ? activeSessions.length : 1).map((session, index) => {
                  const recipe = getRecipeData(session.recipe);
                  return (
                      <div key={session.sessionId} className={`flex items-center justify-between gap-4 ${index > 0 ? "pt-4 border-t border-white/5" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm truncate">{recipe.name}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 font-medium">
                            <Clock size={12} />
                            {t('home.startedAt', 'Розпочато:')} {new Date(session.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        <Link
                            to={`/cook/${session.sessionId}?mode=resume`}
                            className="shrink-0 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                        >
                          {t('home.continue', 'Продовжити')}
                        </Link>
                      </div>
                  );
                })}
              </div>

              {activeSessions.length > 1 && (
                  <button
                      onClick={() => setIsSessionsExpanded(!isSessionsExpanded)}
                      className="w-full mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {isSessionsExpanded ? (
                        <><ChevronUp size={14} /> {t('common.collapse', 'Згорнути')}</>
                    ) : (
                        <><ChevronDown size={14} /> {t('common.expand', 'Показати ще')} ({activeSessions.length - 1})</>
                    )}
                  </button>
              )}
            </div>
        )}

        {pendingBattles.length > 0 && (
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {pendingBattles.map((battle) => (
                  <div key={battle.id} className="block bg-red-500/10 border border-red-500/20 rounded-2xl p-4 hover:bg-red-500/15 transition-all animate-pulse-glow" style={{ '--accent-glow': 'rgba(239,68,68,0.3)' } as React.CSSProperties}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                        <Swords size={20} className="text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-red-300 text-sm">
                          {t('home.battleChallenge', { name: battle.challenger.username })}
                        </p>
                        <p className="text-xs text-red-400/60">{battle.recipe.name}</p>
                      </div>
                      <span className="text-xs text-red-400 font-bold bg-red-500/20 px-2 py-1 rounded-lg">
                        {t('home.battleBadge')}
                      </span>
                    </div>
                  </div>
              ))}
            </div>
        )}

        <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link to="/generate?mode=photo" className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-4 hover:border-orange-500/30 transition-all group">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
              <Camera className="text-orange-400" size={22} />
            </div>
            <h3 className="font-bold text-white text-sm">{t('home.scanPhoto')}</h3>
            <p className="text-[11px] text-gray-500 mt-1 leading-tight">{t('home.scanPhotoDesc')}</p>
          </Link>
          <Link to="/generate?mode=random" className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-4 hover:border-amber-500/30 transition-all group">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
              <Shuffle className="text-amber-400" size={22} />
            </div>
            <h3 className="font-bold text-white text-sm">{t('home.generator')}</h3>
            <p className="text-[11px] text-gray-500 mt-1 leading-tight">{t('home.generatorDesc')}</p>
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
              <p className="font-bold text-white text-sm">{t('home.leaderboard', 'Рейтингова дошка')}</p>
              <p className="text-xs text-gray-500">{t('home.yourRating', 'Ваш рейтинг: {{score}}', { score: ratingScore })}</p>
            </div>
            <span className="text-xs text-yellow-400 font-bold">→</span>
          </div>
        </Link>
      </div>
  );
}