import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Zap, Settings, X, Plus } from 'lucide-react'
import { cn } from '../lib/utils'
import { MascotStatic } from '../components/mascot'
import { api } from "../api/axiosClient"
import { useTranslation } from 'react-i18next';

// ============================================================================
// SETTINGS CONSTANTS
// ============================================================================
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

export default function Profile() {
    const [diet, setDiet] = useState('none')
    const [allergens, setAllergens] = useState<string[]>([])
    const [dislikes, setDislikes] = useState<string[]>([])
    const [customNote, setCustomNote] = useState('')
    const [dislikeInput, setDislikeInput] = useState('')
    const [saving, setSaving] = useState(false)
    const [language, setLanguage] = useState('UK')

    const { t, i18n } = useTranslation();

    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const activeMascot = user?.activeMascot || "broccoli"

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/api/v1/profiles/me');
                const data = response.data;
                setUser(data);

                if (data.preferences) {
                    setDiet(data.preferences.diet || 'none');
                    setAllergens(data.preferences.allergens || []);
                    setDislikes(data.preferences.dislikes || []);
                    setCustomNote(data.preferences.customNote || '');
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

        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await api.patch('/api/v1/profiles/me/preferences', {
                diet: diet,
                allergens: allergens,
                dislikes: dislikes,
                customNote: customNote
            });
            setUser(response.data);
        } catch (error) {
            console.error("Помилка збереження налаштувань", error);
        } finally {
            setSaving(false);
        }
    }

    const handleLanguageChange = async (newLang: string) => {
        setLanguage(newLang);
        i18n.changeLanguage(newLang);

        try {
            await api.patch('/api/v1/profiles/me/language', {
                language: newLang
            });
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

    const xpProgress = user && user.max_xp ? (user.xp / user.max_xp) * 100 : 0;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (xpProgress / 100) * circumference;

    return (
        <div className="space-y-5 animate-in fade-in duration-500 pb-10">

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
                            {loading ? t('profile.loading') : user?.username}
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
                        <div className="text-[10px] text-gray-500">{t('profile.balance')}</div>
                    </div>
                    <div className="bg-purple-500/10 rounded-xl p-3 text-center">
                        <div className="text-lg font-extrabold text-purple-400">🏆 {user?.ratingScore || user?.rating_score || 0}</div>
                        <div className="text-[10px] text-gray-500">{t('profile.rating')}</div>
                    </div>
                </div>
            </div>

            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-5">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-orange-400" />
                    {t('profile.savedRecipes')} (0)
                </h2>
                <div className="py-4 text-center">
                    <MascotStatic name={activeMascot as any} mood="neutral" size={100} message={t('profile.noRecipes')} />
                </div>
            </div>

            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-5">
                <h2 className="font-bold text-white mb-3 flex items-center gap-2">
                    {t('profile.myMascot')}
                </h2>
                <div className="flex items-center gap-4">
                    <MascotStatic name={activeMascot as any} mood="happy" size={64} />
                    <div>
                        <p className="font-bold text-white">{t('profile.mascotName')}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t('profile.mascotDesc')}</p>
                        <Link to="/shop" className="inline-block mt-2 text-xs text-orange-400 hover:text-orange-300 font-bold transition-colors">
                            {t('profile.changeInShop')}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-5">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Settings size={18} className="text-blue-400" />
                    {t('profile.appLanguage')}
                </h2>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => handleLanguageChange('UK')}
                        className={cn(
                            'py-2.5 rounded-xl text-sm font-bold transition-all',
                            language === 'UK' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                        )}
                    >
                        {t('profile.ukrainian')}
                    </button>
                    <button
                        onClick={() => handleLanguageChange('EN')}
                        className={cn(
                            'py-2.5 rounded-xl text-sm font-bold transition-all',
                            language === 'EN' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                        )}
                    >
                        {t('profile.english')}
                    </button>
                </div>
            </div>

            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-5">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Settings size={18} className="text-green-400" />
                    {t('profile.preferences')}
                </h2>

                <div className="mb-4">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{t('profile.dietType')}</p>
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
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{t('profile.allergens')}</p>
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
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{t('profile.dislikes')}</p>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={dislikeInput}
                            onChange={e => setDislikeInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addDislike()}
                            placeholder={t('profile.dislikesPlaceholder')}
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
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{t('profile.additionalWishes')}</p>
                    <textarea
                        value={customNote}
                        onChange={e => setCustomNote(e.target.value)}
                        placeholder={t('profile.wishesPlaceholder')}
                        rows={2}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-70 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                    {saving ? t('profile.saving') : t('profile.savePrefs')}
                </button>
            </div>
        </div>
    )
}