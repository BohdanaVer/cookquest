import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Shuffle, Swords, Zap, Trophy, ChefHat, ChevronDown, ChevronUp, Clock, UserPlus, Check, X, Loader2 } from 'lucide-react';
import { api } from '../api/axiosClient';
import { useTranslation } from 'react-i18next';

interface UserProfileData {
    id: number;
    username: string;
    xp: number;
    levelNumber: number;
    levelName: string;
    currentLevelXp: number;
    nextLevelXp: number;
    balance: number;
    ratingScore: number;
    language: string;
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

interface BattleResponse {
    battleId: number;
    status: string;
    recipePreview: {
        recipeId?: string;
        name: string;
        description?: string;
        difficulty?: string;
        points?: number;
        cookingTimeMinutes?: number;
        cuisine?: string;
        dietaryTags?: string[];
        ingredients?: unknown[]; // ВИПРАВЛЕНО: any -> unknown
        stepsCount?: number;
    };
    mySession?: {
        sessionId: number;
        recipe?: unknown; // ВИПРАВЛЕНО: any -> unknown
    };
    opponentName: string;
    isOpponentFinished: boolean;
    myTotalScore: number | null;
}

interface FriendRequestDto {
    friendshipId: number;
    requesterUsername: string;
    senderMascotUrl?: string;
    createdAt: string;
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
        }
    }
}

export default function Home() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [user, setUser] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    const [activeSessions, setActiveSessions] = useState<CookingSessionDto[]>([]);
    const [activeBattles, setActiveBattles] = useState<BattleResponse[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequestDto[]>([]);
    const [isSessionsExpanded, setIsSessionsExpanded] = useState(false);
    const [isBattlesExpanded, setIsBattlesExpanded] = useState(false);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const [profileRes, sessionsRes, requestsRes, battlesRes] = await Promise.all([
                    api.get('/api/v1/profiles/me'),
                    api.get('/api/v1/cooking/active'),
                    api.get('/api/v1/friends/requests').catch(() => ({ data: [] })),
                    api.get('/api/v1/battles/active').catch(() => ({ data: [] }))
                ]);

                setUser(profileRes.data);
                setActiveSessions(sessionsRes.data);
                setFriendRequests(requestsRes.data);
                setActiveBattles(
                    battlesRes.data.filter((b: BattleResponse) => b.myTotalScore === null || b.myTotalScore === undefined)
                );
            } catch (error) {
                console.error("Помилка завантаження даних головної сторінки", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    const handleRequestAction = async (friendshipId: number, action: 'accept' | 'decline') => {
        try {
            await api.post(`/api/v1/friends/${friendshipId}/${action}`);
            setFriendRequests(prev => prev.filter(req => req.friendshipId !== friendshipId));
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error("Помилка обробки запиту", err);
        }
    };

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

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    const totalCooked = 0;
    const totalCompleted = 0;

    const username = user.username;
    const mascotImageUrl = user.activeMascotImageUrlHappy || '';
    const currentXp = user.xp;
    const currentLevelXp = user.currentLevelXp;
    const nextLevelXp = user.nextLevelXp;
    const displayLevel = user.levelNumber;
    const ratingScore = user.ratingScore;
    // ВИПРАВЛЕНО: Видалено невикористану змінну levelName

    let xpProgress = 0;
    if (nextLevelXp > currentLevelXp) {
        xpProgress = ((currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    } else {
        xpProgress = 100;
    }
    xpProgress = Math.max(0, Math.min(100, xpProgress));

    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (xpProgress / 100) * circumference;

    return (
        <div className="space-y-5 pb-20">

            <div className="flex justify-center animate-slide-up mt-2 mb-6">
                <div className="flex flex-col items-center gap-2">
                    <div className="relative w-20 h-20">
                        {mascotImageUrl && (
                            <img
                                src={mascotImageUrl}
                                alt="Mascot"
                                className="w-full h-full object-contain drop-shadow-xl animate-bounce"
                            />
                        )}
                    </div>
                    <div className="relative bg-[#1f1f33] border border-white/5 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg">
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1f1f33] border-t border-l border-white/5 rotate-45"></div>
                        <span className="relative z-10">{t('home.welcome', { name: username })}</span>
                    </div>
                </div>
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
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            {mascotImageUrl && (
                                <img src={mascotImageUrl} alt="Avatar" className="w-full h-full object-contain drop-shadow-md" />
                            )}
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                            LVL {displayLevel}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-extrabold text-white truncate">
                            {username}
                        </h1>
                        <p className="text-xs text-gray-400 font-medium truncate uppercase tracking-wider">
                            {t(`ranks.rank${displayLevel}`)}
                        </p>
                        <div className="mt-2 flex items-center gap-2 w-full">
                            <Zap size={12} className="text-green-400 shrink-0" />
                            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                                <div className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full transition-all duration-1000" style={{ width: `${xpProgress}%` }} />
                            </div>
                            <span className="text-[10px] text-green-400 font-bold shrink-0 whitespace-nowrap">
                                {currentXp} / {nextLevelXp > currentLevelXp ? nextLevelXp : 'MAX'} XP
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-lg font-extrabold text-yellow-400">{totalCooked}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{t('home.recipesCooked', 'Рецептів')}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-lg font-extrabold text-purple-400">{totalCompleted}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{t('home.questsCompleted', 'Квестів')}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-lg font-extrabold text-orange-400">{ratingScore}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{t('home.rating', 'Рейтинг')}</p>
                    </div>
                </div>
            </div>

            {activeBattles.length > 0 && (
                <div className="bg-[#1a1a2e] border border-[#ff3366]/30 rounded-3xl p-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Swords size={18} className="text-[#ff3366]" />
                            <h2 className="text-sm font-bold text-white">{t('battle.activeBattles', 'Активні батли')}</h2>
                            <span className="bg-[#ff3366]/20 text-[#ff3366] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {activeBattles.length}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {activeBattles.slice(0, isBattlesExpanded ? activeBattles.length : 1).map((battle, index) => {
                            // ВИПРАВЛЕНО: Спрощено умову виклику (якщо немає mySession — значить ще не прийняв)
                            const isChallenged = !battle.mySession;

                            const goToRecipePreview = () => {
                                const recipeId = battle.recipePreview.recipeId;
                                if (!recipeId) return;
                                sessionStorage.setItem('current_viewing_recipe', JSON.stringify({
                                    id: recipeId,
                                    name: battle.recipePreview.name,
                                    description: battle.recipePreview.description ?? '',
                                    difficulty: battle.recipePreview.difficulty ?? '',
                                    points: battle.recipePreview.points ?? 0,
                                    cookingTimeMinutes: battle.recipePreview.cookingTimeMinutes ?? 30,
                                    cuisine: battle.recipePreview.cuisine ?? '',
                                    dietaryTags: battle.recipePreview.dietaryTags ?? [],
                                    ingredients: battle.recipePreview.ingredients ?? [],
                                    steps: [],
                                    stepCount: battle.recipePreview.stepsCount ?? 0,
                                }));
                                navigate(`/recipe/${recipeId}?battle=${battle.battleId}&pending=true`);
                            };

                            return (
                                <div key={battle.battleId} className={`flex items-center justify-between gap-4 ${index > 0 ? "pt-4 border-t border-white/5" : ""}`}>
                                    {/* ВИПРАВЛЕНО: Замість battle.recipeId використано battle.recipePreview?.recipeId */}
                                    <div
                                        className={`flex-1 min-w-0 ${isChallenged && battle.recipePreview?.recipeId ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                        onClick={isChallenged ? goToRecipePreview : undefined}
                                    >
                                        <p className="font-bold text-white text-sm truncate">{battle.recipePreview.name}</p>
                                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 font-medium">
                                            <span className="truncate">{t('battle.opponent', 'Суперник')}: {battle.opponentName}</span>
                                            <span className="text-gray-600">•</span>
                                            <span className={battle.status === 'WAITING_FOR_OPPONENT' ? 'text-yellow-500' : 'text-green-500'}>
                                                {t(`battle.status.${battle.status}`)}
                                            </span>
                                        </div>
                                    </div>

                                    {isChallenged ? (
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={goToRecipePreview}
                                                className="bg-green-500/20 hover:bg-green-500/30 text-green-500 p-2 rounded-xl transition-colors"
                                                title={t('battle.viewRecipe', 'Переглянути рецепт')}
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await api.post(`/api/v1/battles/${battle.battleId}/decline`);
                                                        setActiveBattles(prev => prev.filter(b => b.battleId !== battle.battleId));
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                }}
                                                className="bg-red-500/20 hover:bg-red-500/30 text-red-500 p-2 rounded-xl transition-colors"
                                                title={t('battle.decline', 'Відхилити')}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 shrink-0 items-center">
                                            {battle.mySession && (
                                                <Link
                                                    to={`/cook/${battle.mySession.sessionId}?mode=resume&battle=${battle.battleId}`}
                                                    className="bg-[#ff3366]/10 hover:bg-[#ff3366]/20 text-[#ff3366] text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                                                >
                                                    {t('home.continue', 'Продовжити')}
                                                </Link>
                                            )}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await api.post(`/api/v1/battles/${battle.battleId}/cancel`);
                                                        setActiveBattles(prev => prev.filter(b => b.battleId !== battle.battleId));
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                }}
                                                className="bg-red-500/20 hover:bg-red-500/30 text-red-500 p-2 rounded-xl transition-colors"
                                                title={t('battle.cancel', 'Скасувати батл')}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {activeBattles.length > 1 && (
                        <button
                            onClick={() => setIsBattlesExpanded(!isBattlesExpanded)}
                            className="mt-4 w-full py-2 flex items-center justify-center gap-1 text-[11px] font-bold text-gray-500 hover:text-white transition-colors border-t border-white/5"
                        >
                            {isBattlesExpanded ? <><ChevronUp size={14} /> Згорнути</> : <><ChevronDown size={14} /> Показати всі ({activeBattles.length})</>}
                        </button>
                    )}
                </div>
            )}

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

            {friendRequests.length > 0 && (
                <div className="bg-[#1a1a2e] rounded-3xl border border-blue-500/30 p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <UserPlus size={18} className="text-blue-500" />
                            {t('home.newFriendRequests', 'Запити в друзі')}
                        </h2>
                        <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                            {friendRequests.length}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {friendRequests.map((request) => (
                            <div key={request.friendshipId} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 bg-[#1a1a2e] rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                                        {request.senderMascotUrl ? (
                                            <img src={request.senderMascotUrl} alt="avatar" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="w-full h-full bg-blue-500/20 flex items-center justify-center">
                                                <UserPlus size={16} className="text-blue-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="truncate">
                                        <p className="font-bold text-white text-sm truncate">{request.requesterUsername}</p>
                                        <p className="text-[10px] text-blue-400/80">{t('home.wantsToBeFriends', 'Хоче додати вас у друзі')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0 ml-2">
                                    <button
                                        onClick={() => handleRequestAction(request.friendshipId, 'decline')}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleRequestAction(request.friendshipId, 'accept')}
                                        className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link to="/generate?mode=photo" className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-4 hover:border-orange-500/30 transition-all group">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
                        <Camera className="text-orange-400" size={22} />
                    </div>
                    <h3 className="font-bold text-white text-sm">{t('home.scanPhoto', 'Скан фото')}</h3>
                    <p className="text-[11px] text-gray-500 mt-1 leading-tight">{t('home.scanPhotoDesc', 'ШІ розпізнає страву')}</p>
                </Link>
                <Link to="/generate?mode=random" className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-4 hover:border-amber-500/30 transition-all group">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
                        <Shuffle className="text-amber-400" size={22} />
                    </div>
                    <h3 className="font-bold text-white text-sm">{t('home.generator', 'Генератор')}</h3>
                    <p className="text-[11px] text-gray-500 mt-1 leading-tight">{t('home.generatorDesc', 'Випадковий рецепт')}</p>
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