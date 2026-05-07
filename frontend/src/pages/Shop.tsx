import { useState, useEffect } from 'react'
import { ShoppingBag, Wand2, Sparkles, Lock, Check, ChevronDown, ChevronUp, Loader2, Info } from 'lucide-react'
import { cn } from '../lib/utils'
import { api } from '../api/axiosClient'
import { useTranslation } from 'react-i18next'

interface UserProfile {
    balance: number;
    language?: string;
    activeMascotId?: number;
}

interface MascotItem {
    id: number;
    name: string;
    description: string;
    type: string;
    imageUrlHappy: string;
    imageUrlNeutral?: string;
    imageUrlSad?: string;
    price: number;
    isOwned: boolean;
    isEquipped: boolean;
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
        }
    }
}

const TYPES = [
    { id: 'chef', icon: '👨‍🍳' },
    { id: 'ingredient', icon: '🍅' },
    { id: 'dish', icon: '🍲' },
    { id: 'appliance', icon: '🍳' },
    { id: 'animal', icon: '🐻' },
    { id: 'trophy', icon: '🏆' },
]

// Типи, які вимагають поля "Уточнення (Що малюємо?)"
const TYPES_WITH_SUBJECT = ['ingredient', 'dish', 'appliance', 'animal']

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

const RARITY_COLORS: Record<string, string> = {
    COMMON: 'text-gray-600 bg-gray-100',
    RARE: 'text-blue-600 bg-blue-100',
    EPIC: 'text-purple-600 bg-purple-100',
    LEGENDARY: 'text-yellow-600 bg-yellow-100',
}

export default function Shop() {
    const { t, i18n } = useTranslation()

    const [user, setUser] = useState<UserProfile | null>(null)
    const [mascots, setMascots] = useState<MascotItem[]>([])
    const [generationPrice, setGenerationPrice] = useState(2000)
    
    // Стан для відображення попапу з новим маскотом
    const [generatedMascot, setGeneratedMascot] = useState<MascotItem | null>(null)
    
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)

    // Поля генератора
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState('chef')
    const [subject, setSubject] = useState('')
    const [style, setStyle] = useState('cartoon')
    const [personality, setPersonality] = useState('happy')
    const [color, setColor] = useState('orange')
    const [extraDetails, setExtraDetails] = useState('')
    
    const fetchShopData = async () => {
        try {
            const [profileRes, mascotsRes, settingsRes] = await Promise.all([
                api.get('/api/v1/profiles/me'),
                api.get('/api/v1/mascots'),
                api.get('/api/v1/mascots/settings').catch(() => ({ data: { generationPrice: 2000 } }))
            ])
            
            setUser(profileRes.data)
            setMascots(mascotsRes.data)
            setGenerationPrice(settingsRes.data.generationPrice)

            if (profileRes.data.language) {
                i18n.changeLanguage(profileRes.data.language.toLowerCase())
            }
        } catch (error) {
            console.error("Помилка завантаження даних магазину", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const loadData = async () => {
            await fetchShopData();
        };
        
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleBuy = async (id: number) => {
        if (actionLoading) return
        setActionLoading(true)
        try {
            await api.post(`/api/v1/mascots/${id}/buy`)
            await fetchShopData()
        } catch (error: unknown) {
            const err = error as ApiError
            alert(err.response?.data?.message || "Помилка покупки")
        } finally {
            setActionLoading(false)
        }
    }

    const handleEquip = async (id: number) => {
        if (actionLoading) return
        setActionLoading(true)
        try {
            await api.post(`/api/v1/mascots/${id}/equip`)
            await fetchShopData()
        } catch (error: unknown) {
            const err = error as ApiError
            alert(err.response?.data?.message || "Помилка екіпірування")
        } finally {
            setActionLoading(false)
        }
    }

    const handleGenerate = async () => {
        if (actionLoading) return
        const currentBalance = user?.balance ?? 0
        
        if (currentBalance < generationPrice) {
            alert(`Недостатньо монет! Потрібно ${generationPrice} 💰`)
            return
        }

        setActionLoading(true)
        try {
            const response = await api.post('/api/v1/mascots/generate', {
                name,
                description,
                type,
                subject: TYPES_WITH_SUBJECT.includes(type) ? subject : '', 
                style,
                personality,
                color,
                extraDetails
            })
            
            // Показуємо модалку з новим маскотом
            setGeneratedMascot(response.data)
            
            await fetchShopData()
            setIsGeneratorOpen(false) 
            
            // Очищаємо форму
            setName(''); setDescription(''); setSubject(''); setExtraDetails('');
        } catch (error: unknown) {
            const err = error as ApiError
            alert(err.response?.data?.message || "Помилка генерації")
        } finally {
            setActionLoading(false)
        }
    }

    const balance = user?.balance ?? 0
    const activeMascot = mascots.find(m => m.isEquipped)

    return (
        <div className="space-y-5 animate-in fade-in duration-500 pb-20">

            {/* HEADER */}
            <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <ShoppingBag size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold text-white">{t('shop.title', 'Магазин')}</h1>
                        <p className="text-xs text-gray-400">
                            {t('shop.balance', 'Баланс:')} <span className="text-yellow-400 font-bold text-sm">💰 {loading ? "..." : balance}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* ACTIVE MASCOT */}
            {activeMascot && (
                <div className="bg-[#1a1a2e] rounded-2xl border border-orange-500/20 p-4">
                    <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-2">{t('shop.activeLabel', 'Активний маскот')}</p>
                    <div className="flex items-center gap-4">
                        <div className="w-[72px] h-[72px] flex items-center justify-center shrink-0">
                            <img src={activeMascot.imageUrlHappy} alt="Active Mascot" className="w-full h-full object-contain animate-bounce" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-lg">{t(activeMascot.name)}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t(activeMascot.description)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* MASCOT GRID */}
            <div className="grid grid-cols-2 gap-3">
                {loading ? (
                    <div className="col-span-2 py-10 flex justify-center"><Loader2 className="animate-spin text-purple-500" /></div>
                ) : mascots.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            'bg-[#1a1a2e] flex flex-col rounded-2xl border-2 p-4 transition-all',
                            item.isEquipped ? 'border-orange-500 shadow-[0_0_15px_rgba(255,107,53,0.15)]' : 'border-white/5',
                            item.isOwned && !item.isEquipped && 'border-green-500/30'
                        )}
                    >
                        <div className="flex justify-center mb-2 grow items-center min-h-[80px]">
                            <div className={cn('relative w-full h-[72px] flex justify-center', !item.isOwned && 'opacity-60 grayscale')}>
                                <img src={item.imageUrlHappy} alt={t(item.name)} className="max-w-[72px] max-h-[72px] w-auto h-auto object-contain drop-shadow-md" />
                                {!item.isOwned && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Lock size={24} className="text-gray-200 drop-shadow-lg" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3 className="font-bold text-white text-center text-sm">{t(item.name)}</h3>
                        <p className="text-[10px] text-gray-500 text-center mt-0.5 line-clamp-2 min-h-[30px]">{t(item.description)}</p>

                        <div className="flex justify-center mt-2">
                            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold', RARITY_COLORS[item.type === 'CUSTOM' ? 'LEGENDARY' : 'COMMON'])}>
                                {item.type === 'CUSTOM' ? t('shop.rarities.legendary', 'Легендарний') : t('shop.rarities.common', 'Звичайний')} 
                            </span>
                        </div>

                        <div className="mt-3">
                            {item.isEquipped ? (
                                <div className="w-full text-center py-2 text-orange-400 text-xs font-bold flex items-center justify-center gap-1">
                                    <Check size={14} /> {t('shop.states.active', 'Активний')}
                                </div>
                            ) : item.isOwned ? (
                                <button 
                                    onClick={() => handleEquip(item.id)}
                                    disabled={actionLoading}
                                    className="w-full bg-white/10 text-white font-bold py-2 rounded-xl text-xs hover:bg-white/20 transition-colors"
                                >
                                    {t('shop.states.equip', 'Екіпірувати')}
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleBuy(item.id)}
                                    disabled={actionLoading}
                                    className="w-full bg-orange-500 text-white font-bold py-2 rounded-xl text-xs hover:bg-orange-400 transition-colors"
                                >
                                    💰 {item.price}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* GENERATOR ACCORDION */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-purple-500/30 overflow-hidden mt-8">
                <button 
                    onClick={() => setIsGeneratorOpen(!isGeneratorOpen)}
                    className="w-full p-4 flex items-center justify-between bg-purple-500/5 hover:bg-purple-500/10 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                            <Wand2 size={20} className="text-purple-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-white">{t('shop.generatorTitle', 'Згенерувати кастомного')}</p>
                            <p className="text-xs text-yellow-400 font-bold">💰 {generationPrice} монет</p>
                        </div>
                    </div>
                    {isGeneratorOpen ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                </button>

                <div className={cn(
                    "transition-all duration-300 ease-in-out",
                    isGeneratorOpen ? "max-h-[2000px] opacity-100 p-4 border-t border-purple-500/20" : "max-h-0 opacity-0 overflow-hidden"
                )}>
                    <div className="space-y-5">
                        
                        {/* Назва (не впливає на ШІ) */}
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">{t('shop.nameField', 'Назва (не впливає на генерацію)')}</p>
                            <input 
                                type="text" 
                                placeholder={t('shop.namePlaceholder', 'Наприклад: Сер Кіт')}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        {/* Опис (не впливає на ШІ) */}
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">{t('shop.descField', 'Опис (не впливає на генерацію)')}</p>
                            <input 
                                type="text" 
                                placeholder={t('shop.descPlaceholder', 'Наприклад: Найкрутіший маскот у світі...')}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={50}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        {/* Тип */}
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

                        {/* Уточнення (Що малюємо?) */}
                        {TYPES_WITH_SUBJECT.includes(type) && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Info size={12} /> {t('shop.subjectField', 'Уточніть, що саме малюємо?')}
                                </p>
                                <input 
                                    type="text" 
                                    placeholder={t('shop.subjectPlaceholder', 'Наприклад: Помідор, ведмідь, каструля...')}
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                                />
                            </div>
                        )}

                        {/* Стиль */}
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

                        {/* Настрій */}
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

                        {/* Колір */}
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

                        {/* Додаткові деталі для ШІ */}
                        <div className="pt-2 border-t border-white/5">
                            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-1.5">
                                {t('shop.aiDetailsField', 'Додаткові деталі для ШІ')}
                            </p>
                            <p className="text-[10px] text-gray-500 mb-2 leading-tight">
                                {t('shop.aiDetailsWarning', 'Описуйте лише зовнішній вигляд маскота (одяг, аксесуари). Весь опис фону чи інтер\'єру буде проігноровано системою.')}
                            </p>
                            <textarea 
                                placeholder={t('shop.aiDetailsPlaceholder', 'Наприклад: в сонцезахисних окулярах, з кухарською лопаткою...')}
                                value={extraDetails}
                                onChange={(e) => setExtraDetails(e.target.value)}
                                rows={3}
                                className="w-full bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={actionLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-purple-600 to-violet-600 active:scale-95 text-white hover:opacity-90 disabled:opacity-50 disabled:active:scale-100 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                        >
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {actionLoading ? t('shop.generating', 'Створюємо магію...') : `${t('shop.generateBtn', 'Згенерувати кастомного')} (💰 ${generationPrice})`}
                        </button>
                    </div>
                </div>
            </div>

            {/* МОДАЛКА З НОВИМ МАСКОТОМ */}
            {generatedMascot && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[#1a1a2e] border-2 border-purple-500 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-[0_0_50px_rgba(139,92,246,0.4)] animate-in zoom-in-95 duration-500">
                        
                        {/* Магічне світіння на фоні маскота */}
                        <div className="relative w-48 h-48 mb-6 flex justify-center items-center">
                            <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
                            <img 
                                src={generatedMascot.imageUrlHappy} 
                                alt={generatedMascot.name} 
                                className="relative w-full h-full object-contain drop-shadow-2xl animate-bounce" 
                            />
                        </div>

                        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
                            {t('shop.successTitle', 'Новий маскот!')}
                        </h2>
                        
                        <p className="text-white font-bold text-xl mb-1">{generatedMascot.name}</p>
                        <p className="text-gray-400 text-sm mb-8 line-clamp-3">{generatedMascot.description}</p>

                        <button
                            onClick={() => setGeneratedMascot(null)}
                            className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(217,70,239,0.4)]"
                        >
                            {t('shop.successBtn', 'Супер!')}
                        </button>
                    </div>
                </div>
            )}
            
        </div>
    )
}