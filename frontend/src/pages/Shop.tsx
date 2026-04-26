import { useState, useEffect } from 'react'
import { ShoppingBag, Wand2, Sparkles, Lock, Check } from 'lucide-react'
import { cn } from '../lib/utils'
import Mascot from '../components/mascot'
import { api } from '../api/axiosClient'
import { useTranslation } from 'react-i18next'

// ============================================================================
// GENERATOR CONSTANTS (Тільки ключі та іконки)
// ============================================================================
const TYPES = [
    { id: 'chef', icon: '👨‍🍳' },
    { id: 'ingredient', icon: '🍅' },
    { id: 'dish', icon: '🍲' },
    { id: 'appliance', icon: '🍳' },
    { id: 'animal', icon: '🐻' },
    { id: 'trophy', icon: '🏆' },
]

const STYLES = ['cartoon', 'chibi', 'pixel', 'flat', '3d', 'fantasy']
const PERSONALITIES = ['happy', 'brave', 'cute', 'wise', 'energetic', 'mischievous']

const COLORS = [
    { id: 'red', hex: '#EF4444' },
    { id: 'orange', hex: '#F97316' },
    { id: 'green', hex: '#22C55E' },
    { id: 'blue', hex: '#3B82F6' },
    { id: 'purple', hex: '#8B5CF6' },
    { id: 'pink', hex: '#EC4899' },
    { id: 'brown', hex: '#92400E' },
    { id: 'gold', hex: '#D97706' },
    { id: 'rainbow', hex: null },
]

const RARITY_COLORS = {
    common: 'text-gray-600 bg-gray-100',
    rare: 'text-blue-600 bg-blue-100',
    epic: 'text-purple-600 bg-purple-100',
    legendary: 'text-yellow-600 bg-yellow-100',
}

// ============================================================================
// VISUAL TEMPLATE OF SHOP GRID
// ============================================================================
const MOCK_GRID = [
    { id: 'broccoli', rarity: 'common', state: 'active' },
    { id: 'slime', rarity: 'common', state: 'price', price: 100 },
    { id: 'cheese', rarity: 'rare', state: 'price', price: 200 },
    { id: 'pepper', rarity: 'rare', state: 'price', price: 300 },
    { id: 'icecream', rarity: 'epic', state: 'price', price: 500 },
    { id: 'stove', rarity: 'epic', state: 'price', price: 500 },
    { id: 'cauldron', rarity: 'epic', state: 'price', price: 800 },
    { id: 'knightpan', rarity: 'legendary', state: 'price', price: 1500 },
]

export default function Shop() {
    const { t, i18n } = useTranslation()

    const [type, setType] = useState('chef')
    const [style, setStyle] = useState('cartoon')
    const [personality, setPersonality] = useState('happy')
    const [color, setColor] = useState('orange')

    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/api/v1/profiles/me')
                const data = response.data
                setUser(data)

                if (data.language) {
                    i18n.changeLanguage(data.language.toUpperCase())
                }
            } catch (error) {
                console.error("Помилка завантаження даних магазину", error)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [i18n])

    const balance = user?.balance ?? 0
    const activeMascotId = user?.activeMascot || "broccoli"

    return (
        <div className="space-y-5 animate-in fade-in duration-500 pb-10">

            <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <ShoppingBag size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold text-white">{t('shop.title')}</h1>
                        <p className="text-xs text-gray-400">
                            {t('shop.balance')} <span className="text-yellow-400 font-bold text-sm">💰 {loading ? "..." : balance}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-[#1a1a2e] rounded-2xl border border-orange-500/20 p-4">
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-2">{t('shop.activeLabel')}</p>
                <div className="flex items-center gap-4">
                    <Mascot name={activeMascotId as any} mood="happy" size={72} animation="bounce" interactive />
                    <div>
                        <p className="font-bold text-white text-lg">{t(`shop.items.${activeMascotId}.name`, t('shop.items.broccoli.name'))}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t(`shop.items.${activeMascotId}.desc`, t('shop.items.broccoli.desc'))}</p>
                    </div>
                </div>
            </div>

            <div className="bg-[#1a1a2e] rounded-2xl border border-purple-500/30 p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Wand2 size={18} className="text-purple-400" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">{t('shop.generatorTitle')}</p>
                        <p className="text-[10px] text-gray-500">{t('shop.generatorSubtitle')}</p>
                    </div>
                </div>

                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">{t('shop.type')}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                        {TYPES.map(tItem => (
                            <button
                                key={tItem.id}
                                onClick={() => setType(tItem.id)}
                                className={cn(
                                    'flex flex-col items-center gap-0.5 py-2 rounded-xl border text-xs transition-all',
                                    type === tItem.id ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/5 bg-white/[0.03] text-gray-400'
                                )}
                            >
                                <span className="text-lg leading-none">{tItem.icon}</span>
                                <span className="text-[10px]">{t(`shop.types.${tItem.id}`)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">{t('shop.style')}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                        {STYLES.map(s => (
                            <button
                                key={s}
                                onClick={() => setStyle(s)}
                                className={cn(
                                    'py-1.5 rounded-xl border text-xs transition-all',
                                    style === s ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/5 bg-white/[0.03] text-gray-400'
                                )}
                            >
                                {t(`shop.styles.${s}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">{t('shop.personality')}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                        {PERSONALITIES.map(p => (
                            <button
                                key={p}
                                onClick={() => setPersonality(p)}
                                className={cn(
                                    'py-1.5 rounded-xl border text-[10px] transition-all',
                                    personality === p ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/5 bg-white/[0.03] text-gray-400'
                                )}
                            >
                                {t(`shop.personalities.${p}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">{t('shop.color')}</p>
                    <div className="flex flex-wrap gap-2">
                        {COLORS.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setColor(c.id)}
                                className={cn(
                                    'w-7 h-7 rounded-full border-2 transition-all',
                                    color === c.id ? 'border-white scale-110' : 'border-transparent'
                                )}
                                style={c.hex ? { backgroundColor: c.hex } : { background: 'conic-gradient(red, orange, yellow, green, blue, violet, red)' }}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => {}}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-purple-600 to-violet-600 active:scale-95 text-white hover:opacity-90"
                >
                    <Sparkles size={16} />
                    {t('shop.generateBtn')}
                </button>
            </div>

            {/* MASCOT GRID */}
            <div className="grid grid-cols-2 gap-3">
                {MOCK_GRID.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            'bg-[#1a1a2e] rounded-2xl border-2 p-4 transition-all',
                            item.state === 'active' ? 'border-orange-500 shadow-[0_0_15px_rgba(255,107,53,0.15)]' : 'border-white/5',
                            item.state === 'owned' && 'border-green-500/30'
                        )}
                    >
                        <div className="flex justify-center mb-2">
                            <div className={cn('relative', item.state === 'price' && 'opacity-50 grayscale')}>
                                <img src={`/mascots/${item.id}_happy.png`} alt={t(`shop.items.${item.id}.name`)} className="w-[72px] h-[72px] drop-shadow-md" />
                                {item.state === 'price' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Lock size={24} className="text-gray-400 drop-shadow-lg" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3 className="font-bold text-white text-center text-sm">{t(`shop.items.${item.id}.name`)}</h3>
                        <p className="text-[10px] text-gray-500 text-center mt-0.5 line-clamp-2 min-h-[30px]">{t(`shop.items.${item.id}.desc`)}</p>

                        <div className="flex justify-center mt-2">
                            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold', RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS])}>
                                {t(`shop.rarities.${item.rarity}`)}
                            </span>
                        </div>

                        <div className="mt-3">
                            {item.state === 'active' ? (
                                <div className="w-full text-center py-2 text-orange-400 text-xs font-bold flex items-center justify-center gap-1">
                                    <Check size={14} /> {t('shop.states.active')}
                                </div>
                            ) : (
                                <button className="w-full bg-orange-500 text-white font-bold py-2 rounded-xl text-xs hover:bg-orange-400 transition-colors">
                                    💰 {item.price}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}