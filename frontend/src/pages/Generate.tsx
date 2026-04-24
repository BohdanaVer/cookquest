'use client'

import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Camera, Shuffle, X, Upload, ChevronDown, ChevronUp, Plus, Refrigerator } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '../lib/constants'
import Mascot from '../components/mascot'
import { useActiveMascot } from '../components/mascot-provider'

// ============================================================================
// ⚠️ MOCK DATA
// ============================================================================
const MOCK_FRIDGE_ITEMS = ['Яйця', 'Томати', 'Сир', 'Куряче філе', 'Цибуля']
const MOCK_DETECTED_INGREDIENTS = ['Помідори', 'Яйця', 'Сир', 'Молоко']
const MOCK_GENERATED_RECIPES = [
    {
        id: 'mock-1',
        name: 'Омлет з сиром та томатами',
        description: 'Ніжний омлет із розплавленим сиром та соковитими томатами.',
        difficulty: 'easy' as const,
        points: 50,
        cuisine_type: 'Європейська',
        ingredients: ['2 яйця', '50г сиру', '1 томат'],
        instructions: [{ step: 1, title: 'Збиваємо', description: '...' }]
    }
]
// ============================================================================

export default function Generate() {
    const navigate = useNavigate()
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    const activeMascot = useActiveMascot()

    const [mode, setMode] = useState<'photo' | 'random'>('photo')
    const [step, setStep] = useState<'input' | 'ingredients' | 'recipes'>('input')
    const [loading, setLoading] = useState(false)

    // DATA
    const [photos, setPhotos] = useState<string[]>([])
    const [prompt, setPrompt] = useState(searchParams.get('challengeDescription') || '')
    const [fridgeItems] = useState<string[]>(MOCK_FRIDGE_ITEMS)
    const [selectedFridgeItems, setSelectedFridgeItems] = useState<Set<string>>(new Set())

    // RESULTS
    const [ingredients, setIngredients] = useState<string[]>([])
    const [excluded, setExcluded] = useState<Set<string>>(new Set())
    const [recipes, setRecipes] = useState<any[]>([])
    const [expandedIngredients, setExpandedIngredients] = useState<Set<number>>(new Set())

    const cameraInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)

    // LOGIC IMITATION
    const addPhotoMock = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (photos.length >= 3) return toast.error('Максимум 3 фото')
        setPhotos(prev => [...prev, URL.createObjectURL(file)])
        e.target.value = ''
    }

    const analyzePhotosMock = () => {
        setLoading(true)
        setTimeout(() => {
            setIngredients(MOCK_DETECTED_INGREDIENTS)
            setStep('ingredients')
            setLoading(false)
        }, 1500)
    }

    const generateRecipesMock = () => {
        setLoading(true)
        setTimeout(() => {
            setRecipes(MOCK_GENERATED_RECIPES)
            setStep('recipes')
            setLoading(false)
        }, 2000)
    }

    const toggleFridgeItem = (item: string) => {
        setSelectedFridgeItems(prev => {
            const next = new Set(prev)
            if (next.has(item)) next.delete(item)
            else next.add(item)
            return next
        })
    }


    if (step === 'recipes') {
        return (
            <div className="space-y-4 animate-slide-up">
                <div className="flex justify-center">
                    <Mascot name={activeMascot as any} mood="happy" size={80} message="Обери рецепт!" animation="pop" />
                </div>
                <div className="space-y-3">
                    {recipes.map((recipe, i) => (
                        <div key={recipe.id} className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-5 hover:border-orange-500/30 transition-all">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-white text-lg">{recipe.name}</h3>
                                <span className={cn('text-xs px-2 py-1 rounded-full font-bold', DIFFICULTY_COLORS[recipe.difficulty as keyof typeof DIFFICULTY_COLORS])}>
                  {DIFFICULTY_LABELS[recipe.difficulty as keyof typeof DIFFICULTY_LABELS]}
                </span>
                            </div>
                            <p className="text-gray-400 text-sm mb-3">{recipe.description}</p>
                            <button onClick={() => navigate(`/recipe/${recipe.id}`)} className="w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl">Обрати</button>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (step === 'ingredients') {
        return (
            <div className="space-y-5 animate-slide-up">
                <div className="flex justify-center">
                    <Mascot name={activeMascot as any} mood="happy" size={80} message="Ось що я знайшов!" animation="pop" />
                </div>
                <div className="flex flex-wrap gap-2">
                    {ingredients.map((ing, i) => (
                        <button key={i} onClick={() => setExcluded(prev => new Set(prev).add(ing))} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-300">
                            {ing}
                        </button>
                    ))}
                </div>
                <button onClick={generateRecipesMock} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl">Знайти рецепти</button>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex justify-center">
                <Mascot name={activeMascot as any} mood="neutral" size={90} message="Що приготуємо?" animation="pop" />
            </div>

            <div className="space-y-5">
                <div className="flex bg-white/5 rounded-xl p-1">
                    <button onClick={() => setMode('photo')} className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all', mode === 'photo' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500')}>
                        <Camera size={16} /> Фото
                    </button>
                    <button onClick={() => setMode('random')} className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all', mode === 'random' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500')}>
                        <Shuffle size={16} /> Генератор
                    </button>
                </div>

                {mode === 'photo' ? (
                    <div className="space-y-4 animate-slide-up">
                        <div className="grid grid-cols-3 gap-3">
                            {photos.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removePhoto(i)}
                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}

                            {photos.length < 3 && (
                                <div className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2">

                                    <button
                                        onClick={() => cameraInputRef.current?.click()}
                                        className="flex md:hidden items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Camera size={14} />
                                        Камера
                                    </button>

                                    <button
                                        onClick={() => galleryInputRef.current?.click()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Upload size={14} />
                                        Галерея
                                    </button>

                                    <span className="text-[10px] text-gray-600">{photos.length}/3</span>
                                </div>
                            )}
                        </div>
                        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={addPhotoMock} />
                        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={addPhotoMock} />
                    </div>
                ) : (
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        rows={3}
                        placeholder="Опишіть побажання..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none text-sm resize-none"
                    />
                )}
            </div>

            <div className="space-y-3">
                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] pl-1">мій холодильник</h2>
                <div className="flex flex-wrap gap-2">
                    {fridgeItems.map(item => {
                        const isSelected = selectedFridgeItems.has(item);
                        return (
                            <button
                                key={item}
                                onClick={() => toggleFridgeItem(item)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                                    isSelected
                                        ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                                        : "bg-[#1a1a2e] border-white/10 text-gray-300 hover:border-white/20"
                                )}
                            >
                                {item}
                            </button>
                        )
                    })}
                    <button className="w-10 h-10 rounded-xl border border-dashed border-white/10 text-gray-500 flex items-center justify-center hover:bg-white/5 transition-colors">
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            <div className="pt-2">
                <button
                    onClick={mode === 'photo' ? analyzePhotosMock : generateRecipesMock}
                    disabled={loading || (mode === 'photo' && photos.length === 0 && selectedFridgeItems.size === 0)}
                    className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
                >
                    {loading ? 'Обробка...' : mode === 'photo' ? 'Визначити продукти та знайти' : 'Знайти рецепти'}
                </button>
            </div>

        </div>
    )
}