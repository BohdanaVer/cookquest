import { useState } from 'react'
import { ShoppingBag, Wand2, Sparkles, Lock, Check } from 'lucide-react'
import { cn } from '../lib/utils'
import Mascot from '../components/mascot'

// ============================================================================
// GENERATOR VISUAL CONSTANTS
// ============================================================================
const TYPES = [
    { id: 'chef', icon: '👨‍🍳', label: 'Шеф' },
    { id: 'ingredient', icon: '🍅', label: 'Інгред.' },
    { id: 'dish', icon: '🍲', label: 'Страва' },
    { id: 'appliance', icon: '🍳', label: 'Прилад' },
    { id: 'animal', icon: '🐻', label: 'Тварина' },
    { id: 'trophy', icon: '🏆', label: 'Трофей' },
]

const STYLES = [
    { id: 'cartoon', label: 'Мульт' },
    { id: 'chibi',   label: 'Чіббі' },
    { id: 'pixel',   label: 'Піксель' },
    { id: 'flat',    label: 'Flat' },
    { id: '3d',      label: '3D' },
    { id: 'fantasy', label: 'Фентезі' },
]

const PERSONALITIES = [
    { id: 'happy', label: '😄 Веселий' },
    { id: 'brave', label: '💪 Відважний' },
    { id: 'cute',  label: '🥰 Милий' },
    { id: 'wise',  label: '🧐 Мудрий' },
    { id: 'energetic', label: '⚡ Живий' },
    { id: 'mischievous', label: '😏 Шибеник' },
]

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
    { id: 'broccoli', name: 'Броколі', description: 'Веселий друг-овоч. Стартовий маскот!', rarity: 'common', state: 'active' },
    { id: 'slime', name: 'Слаймі', description: 'Милий зелений слайм, що тягнеться до знань', rarity: 'common', state: 'price', price: 100 },
    { id: 'cheese', name: 'Сирко', description: 'Справжній сирний магнат на твоїй кухні', rarity: 'rare', state: 'price', price: 200 },
    { id: 'pepper', name: 'Перчик', description: 'Гострий та запальний помічник', rarity: 'rare', state: 'price', price: 300 },
    { id: 'icecream', name: 'Морозко', description: 'Холодний, але з теплим серцем', rarity: 'epic', state: 'price', price: 500 },
    { id: 'stove', name: 'Пічка', description: 'Хранитель вогню та смаку', rarity: 'epic', state: 'price', price: 500 },
    { id: 'cauldron', name: 'Казанок', description: 'Майстер магічної кулінарії', rarity: 'epic', state: 'price', price: 800 },
    { id: 'knightpan', name: 'Лицар', description: 'Непереможний воїн кухні!', rarity: 'legendary', state: 'price', price: 1500 },
]

export default function Shop() {
    const [type, setType] = useState('chef')
    const [style, setStyle] = useState('cartoon')
    const [personality, setPersonality] = useState('happy')
    const [color, setColor] = useState('orange')

    const balance = ""

    return (
        <div className="space-y-5 animate-in fade-in duration-500 pb-10">

            <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <ShoppingBag size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold text-white">Магазин</h1>
                        <p className="text-xs text-gray-400">
                            Баланс: <span className="text-yellow-400 font-bold text-sm">💰 {balance}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* ACTIVE MASCOT(MOCK) */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-orange-500/20 p-4">
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-2">Активний</p>
                <div className="flex items-center gap-4">
                    <Mascot name="broccoli" mood="happy" size={72} animation="bounce" interactive />
                    <div>
                        <p className="font-bold text-white text-lg">Броколі</p>
                        <p className="text-xs text-gray-500 mt-0.5">Веселий друг-овоч</p>
                    </div>
                </div>
            </div>

            {/* MASCOT GENERATOR(MOCK) */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-purple-500/30 p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Wand2 size={18} className="text-purple-400" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">Генератор маскотів</p>
                        <p className="text-[10px] text-gray-500">ШІ • Stability AI • 3 емоції</p>
                    </div>
                </div>

                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Тип</p>
                    <div className="grid grid-cols-3 gap-1.5">
                        {TYPES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setType(t.id)}
                                className={cn(
                                    'flex flex-col items-center gap-0.5 py-2 rounded-xl border text-xs transition-all',
                                    type === t.id ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/5 bg-white/[0.03] text-gray-400'
                                )}
                            >
                                <span className="text-lg leading-none">{t.icon}</span>
                                <span className="text-[10px]">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Стиль</p>
                    <div className="grid grid-cols-3 gap-1.5">
                        {STYLES.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setStyle(s.id)}
                                className={cn(
                                    'py-1.5 rounded-xl border text-xs transition-all',
                                    style === s.id ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/5 bg-white/[0.03] text-gray-400'
                                )}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Характер</p>
                    <div className="grid grid-cols-3 gap-1.5">
                        {PERSONALITIES.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setPersonality(p.id)}
                                className={cn(
                                    'py-1.5 rounded-xl border text-[10px] transition-all',
                                    personality === p.id ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/5 bg-white/[0.03] text-gray-400'
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Колір</p>
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
                    Згенерувати маскота
                </button>
            </div>

            {/* MASCOT GRID(MOCK) */}
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
                                <img src={`/mascots/${item.id}_happy.png`} alt={item.name} className="w-[72px] h-[72px] drop-shadow-md" />
                                {item.state === 'price' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Lock size={24} className="text-gray-400 drop-shadow-lg" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3 className="font-bold text-white text-center text-sm">{item.name}</h3>
                        <p className="text-[10px] text-gray-500 text-center mt-0.5 line-clamp-2 min-h-[30px]">{item.description}</p>

                        <div className="flex justify-center mt-2">
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold', RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS])}>
                {item.rarity === 'common' ? 'Звичайний' : item.rarity === 'rare' ? 'Рідкісний' : item.rarity === 'epic' ? 'Епічний' : 'Легендарний'}
              </span>
                        </div>

                        <div className="mt-3">
                            {item.state === 'active' ? (
                                <div className="w-full text-center py-2 text-orange-400 text-xs font-bold flex items-center justify-center gap-1">
                                    <Check size={14} /> Активний
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