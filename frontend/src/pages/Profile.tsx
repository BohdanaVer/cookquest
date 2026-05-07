import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Zap, Settings, X, Plus, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'
import { MascotStatic } from '../components/mascot'
import { api } from "../api/axiosClient"
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const DIET_KEYS = [
    { key: 'none', emoji: '🍽️' },
    { key: 'vegetarian', emoji: '🥬' },
    { key: 'vegan', emoji: '🌱' },
    { key: 'pescatarian', emoji: '🐟' },
    { key: 'keto', emoji: '🥑' },
    { key: 'paleo', emoji: '🥩' },
]

const ALLERGEN_KEYS = [
    { key: 'gluten', emoji: '🌾' },
    { key: 'dairy', emoji: '🥛' },
    { key: 'nuts', emoji: '🥜' },
    { key: 'eggs', emoji: '🥚' },
    { key: 'soy', emoji: '🫘' },
    { key: 'seafood', emoji: '🦐' },
    { key: 'lactose', emoji: '🧀' },
    { key: 'honey', emoji: '🍯' },
]

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
    language?: string;
    dietaryPreferences?: {
        diet?: string;
        allergens?: string[];
        dislikes?: string[];
        customNote?: string;
    };
}

interface RecipeItem {
    id: string;
    name: string;
}

type MascotName = "broccoli" | "slime" | "cheese" | "pepper" | "icecream" | "stove" | "cauldron" | "knightpan";

export default function Profile() {
    const { t, i18n } = useTranslation();

    const [language, setLanguage] = useState(() => i18n.language?.toUpperCase() || 'UK')
    const [diet, setDiet] = useState('none')
    const [allergens, setAllergens] = useState<string[]>([])
    const [dislikes, setDislikes] = useState<string[]>([])
    const [customNote, setCustomNote] = useState('')
    const [dislikeInput, setDislikeInput] = useState('')
    const [saving, setSaving] = useState(false)

    // Стейт для профілю
    const [user, setUser] = useState<UserProfileData | null>(null)
    const [loading, setLoading] = useState(true)

    // Стейт для збережених рецептів
    const [savedRecipes, setSavedRecipes] = useState<RecipeItem[]>([])
    const [isRecipesExpanded, setIsRecipesExpanded] = useState(false)
    const [loadingRecipes, setLoadingRecipes] = useState(true)

    // ДОДАНО: Стейт для історії генерацій
    const [historyRecipes, setHistoryRecipes] = useState<RecipeItem[]>([])
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false)
    const [loadingHistory, setLoadingHistory] = useState(true)

    const activeMascot = user?.activeMascot || "broccoli"

    useEffect(() => {
        // 1. Завантаження профілю
        const fetchProfileData = async () => {
            try {
                const profileResp = await api.get('/api/v1/profiles/me');
                const data = profileResp.data;
                setUser(data);

                if (data.dietaryPreferences) {
                    setDiet(data.dietaryPreferences.diet || 'none');
                    setAllergens(data.dietaryPreferences.allergens || []);
                    setDislikes(data.dietaryPreferences.dislikes || []);
                    setCustomNote(data.dietaryPreferences.customNote || '');
                }

                if (data.language) {
                    const dbLang = data.language.toUpperCase();
                    setLanguage(dbLang);
                    i18n.changeLanguage(dbLang);
                }
            } catch (error) {
                console.error("Помилка завантаження профілю", error);
            } finally {
                setLoading(false);
            }
        };

        // 2. Завантаження збережених рецептів
        const fetchSavedRecipes = async () => {
            try {
                const recipesResp = await api.get('/api/v1/recipes/saved');
                setSavedRecipes(recipesResp.data || []);
            } catch (error) {
                console.error("Помилка завантаження збережених рецептів", error);
            } finally {
                setLoadingRecipes(false);
            }
        };

        // 3. ДОДАНО: Завантаження історії генерацій
        const fetchHistoryRecipes = async () => {
            try {
                const historyResp = await api.get('/api/v1/recipes/history');
                setHistoryRecipes(historyResp.data || []);
            } catch (error) {
                console.error("Помилка завантаження історії генерацій", error);
            } finally {
                setLoadingHistory(false);
            }
        };

        // Запускаємо всі запити паралельно
        fetchProfileData();
        fetchSavedRecipes();
        fetchHistoryRecipes();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await api.patch('/api/v1/profiles/me/preferences', {
                diet,
                allergens,
                dislikes,
                customNote
            });
            setUser(response.data);

            toast.success(t('profile.saveSuccess', 'Налаштування збережено!'));

        } catch (error) {
            console.error("Помилка збереження налаштувань", error);
            toast.error(t('profile.saveError', 'Помилка при збереженні'));
        } finally {
            setSaving(false);
        }
    }

    const handleLanguageChange = async (newLang: string) => {
        setLanguage(newLang);
        i18n.changeLanguage(newLang);
        try {
            await api.patch('/api/v1/profiles/me/language', { language: newLang });
        } catch (error) {
            console.error("Помилка збереження мови", error);
        }
    }

    const toggleAllergen = (key: string) => {
        setAllergens(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key])
    }

    const addDislike = () => {
        const val = dislikeInput.trim()
        if (!val || dislikes.includes(val)) return
        setDislikes(prev => [...prev, val])
        setDislikeInput('')
    }

    const removeDislike = (item: string) => {
        setDislikes(prev => prev.filter(d => d !== item))
    }

    const currentXp = user?.xp || 0;
    const maxXp = user?.max_xp || 0;
    const xpProgress = maxXp > 0 ? (currentXp / maxXp) * 100 : 0;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (xpProgress / 100) * circumference;

    return (
        <div className="space-y-5 animate-in fade-in duration-500 pb-10">

            {/* Блок з аватаром і статами */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-5">
                <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                        <svg width="80" height="80" className="rotate-[-90deg]">
                            <circle cx="40" cy="40" r={radius} fill="none" stroke="#2a2a4a" strokeWidth="5" />
                            <circle
                                cx="40" cy="40" r={radius} fill="none"
                                stroke="#58cc02" strokeWidth="5" strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <img
                                src={`/mascots/${activeMascot}_happy.png`}
                                alt="mascot"
                                className="w-10 h-10 drop-shadow-md object-contain"
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-extrabold text-white truncate">
                            {loading ? t('profile.loading', 'Завантаження...') : user?.username}
                        </h1>
                        <p className="text-xs text-gray-400">
                            {user?.levelName || t('profile.rank')} • {t('profile.level')} {user?.level || 0}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                            <Zap size={12} className="text-green-400" />
                            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full transition-all"
                                    style={{ width: `${xpProgress}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-green-400 font-bold whitespace-nowrap">
                                {user?.xp || 0} / {user?.max_xp || 0}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-yellow-500/10 rounded-xl p-3 text-center">
                        <div className="text-lg font-extrabold text-yellow-400">💰 {user?.balance || 0}</div>
                        <div className="text-[10px] text-gray-500">{t('profile.balance', 'Баланс')}</div>
                    </div>
                    <div className="bg-purple-500/10 rounded-xl p-3 text-center">
                        <div className="text-lg font-extrabold text-purple-400">🏆 {user?.ratingScore || user?.rating_score || 0}</div>
                        <div className="text-[10px] text-gray-500">{t('profile.rating', 'Рейтинг')}</div>
                    </div>
                </div>
            </div>

            {/* ДОДАНО: Блок Історії Генерацій */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-5">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-400" />
                    {t('profile.generationHistory', 'Історія генерацій')} {!loadingHistory && `(${historyRecipes.length})`}
                </h2>

                {loadingHistory ? (
                    <div className="py-6 flex justify-center">
                        <div className="animate-pulse flex items-center gap-2 text-gray-500 text-sm font-bold">
                            <Sparkles size={16} className="animate-pulse text-purple-400/50" />
                            {t('common.loading', 'Завантаження...')}
                        </div>
                    </div>
                ) : historyRecipes.length === 0 ? (
                    <div className="py-4 text-center">
                        <p className="text-sm text-gray-500 font-medium">{t('profile.noHistory', 'Ви ще нічого не генерували')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {historyRecipes.slice(0, isHistoryExpanded ? historyRecipes.length : 1).map((recipe, index) => (
                            <div key={`hist-${recipe.id}`} className={`flex items-center justify-between gap-4 ${index > 0 ? "pt-4 border-t border-white/5" : ""}`}>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm truncate">{recipe.name}</p>
                                </div>
                                <Link
                                    to={`/recipe/${recipe.id}`}
                                    className="shrink-0 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                                >
                                    {t('common.view', 'Відкрити')}
                                </Link>
                            </div>
                        ))}

                        {historyRecipes.length > 1 && (
                            <button
                                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                className="w-full mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                            >
                                {isHistoryExpanded ? (
                                    <><ChevronUp size={14} /> {t('common.collapse', 'Згорнути')}</>
                                ) : (
                                    <><ChevronDown size={14} /> {t('common.expand', 'Показати всі')} ({historyRecipes.length - 1})</>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Блок збережених рецептів */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-5">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-orange-400" />
                    {t('profile.savedRecipes', 'Збережені рецепти')} {!loadingRecipes && `(${savedRecipes.length})`}
                </h2>

                {loadingRecipes ? (
                    <div className="py-6 flex justify-center">
                        <div className="animate-pulse flex items-center gap-2 text-gray-500 text-sm font-bold">
                            <BookOpen size={16} className="animate-bounce text-orange-400/50" />
                            {t('common.loading', 'Завантаження...')}
                        </div>
                    </div>
                ) : savedRecipes.length === 0 ? (
                    <div className="py-4 text-center">
                        <MascotStatic name={activeMascot as MascotName} mood="neutral" size={100} message={t('profile.noRecipes', 'Немає збережених рецептів')} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {savedRecipes.slice(0, isRecipesExpanded ? savedRecipes.length : 1).map((recipe, index) => (
                            <div key={`saved-${recipe.id}`} className={`flex items-center justify-between gap-4 ${index > 0 ? "pt-4 border-t border-white/5" : ""}`}>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm truncate">{recipe.name}</p>
                                </div>
                                <Link
                                    to={`/recipe/${recipe.id}`}
                                    className="shrink-0 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                                >
                                    {t('common.view', 'Відкрити')}
                                </Link>
                            </div>
                        ))}

                        {savedRecipes.length > 1 && (
                            <button
                                onClick={() => setIsRecipesExpanded(!isRecipesExpanded)}
                                className="w-full mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                            >
                                {isRecipesExpanded ? (
                                    <><ChevronUp size={14} /> {t('common.collapse', 'Згорнути')}</>
                                ) : (
                                    <><ChevronDown size={14} /> {t('common.expand', 'Показати всі')} ({savedRecipes.length - 1})</>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Блок з Маскотом */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-5">
                <h2 className="font-bold text-white mb-3 flex items-center gap-2">
                    {t('profile.myMascot', 'Мій Маскот')}
                </h2>
                <div className="flex items-center gap-4">
                    <MascotStatic name={activeMascot as MascotName} mood="happy" size={64} />
                    <div>
                        <p className="font-bold text-white">{t('profile.mascotName', 'Компаньйон')}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t('profile.mascotDesc', 'Допомагає на кухні')}</p>
                        <Link to="/shop" className="inline-block mt-2 text-xs text-orange-400 hover:text-orange-300 font-bold transition-colors">
                            {t('profile.changeInShop', 'Змінити в магазині')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Блок з Мовою */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-5">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Settings size={18} className="text-blue-400" />
                    {t('profile.appLanguage', 'Мова додатку')}
                </h2>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => handleLanguageChange('UK')}
                        className={cn(
                            'py-2.5 rounded-xl text-sm font-bold transition-all',
                            language === 'UK' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                        )}
                    >
                        {t('profile.ukrainian', 'Українська')}
                    </button>
                    <button
                        onClick={() => handleLanguageChange('EN')}
                        className={cn(
                            'py-2.5 rounded-xl text-sm font-bold transition-all',
                            language === 'EN' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                        )}
                    >
                        {t('profile.english', 'English')}
                    </button>
                </div>
            </div>

            {/* Блок з Налаштуваннями дієти */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-5">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Settings size={18} className="text-green-400" />
                    {t('profile.preferences', 'Харчові вподобання')}
                </h2>

                <div className="mb-4">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{t('profile.dietType', 'Тип дієти')}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                        {DIET_KEYS.map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setDiet(opt.key)}
                                className={cn(
                                    'px-2 py-2 rounded-xl text-xs font-bold transition-all text-center',
                                    diet === opt.key
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                                )}
                            >
                                <span className="block text-base mb-0.5">{opt.emoji}</span>
                                {t(`profile.diets.${opt.key}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{t('profile.allergens', 'Алергени')}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {ALLERGEN_KEYS.map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => toggleAllergen(opt.key)}
                                className={cn(
                                    'px-3 py-1.5 rounded-full text-xs font-bold transition-all border',
                                    allergens.includes(opt.key)
                                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                        : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                                )}
                            >
                                {opt.emoji} {t(`profile.allergenList.${opt.key}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{t('profile.dislikes', 'Не люблю')}</p>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={dislikeInput}
                            onChange={e => setDislikeInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addDislike()}
                            placeholder={t('profile.dislikesPlaceholder', 'Наприклад: цибуля')}
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        />
                        <button
                            onClick={addDislike}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 transition-colors"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    {dislikes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {dislikes.map(item => (
                                <span
                                    key={item}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/10 text-orange-400 rounded-full text-xs font-bold"
                                >
                                    {item}
                                    <button onClick={() => removeDislike(item)} className="hover:text-orange-300">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{t('profile.additionalWishes', 'Особливі побажання')}</p>
                    <textarea
                        value={customNote}
                        onChange={e => setCustomNote(e.target.value)}
                        placeholder={t('profile.wishesPlaceholder', 'Додаткова інформація...')}
                        rows={2}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-70 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                    {saving ? t('profile.saving', 'Збереження...') : t('profile.savePrefs', 'Зберегти налаштування')}
                </button>
            </div>
        </div>
    )
}