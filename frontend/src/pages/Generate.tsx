'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Camera, Shuffle, X, Upload, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'
import { cn } from '../lib/utils'
import Mascot from '../components/mascot'
import { useActiveMascot } from '../components/mascot-provider'
import { useTranslation } from 'react-i18next'
import { api } from '../api/axiosClient'

type MascotName = "broccoli" | "slime" | "cheese" | "pepper" | "icecream" | "stove" | "cauldron" | "knightpan";

export interface Recipe {
    id: string;
    name: string;
    description: string;
    difficulty: string;
    points: number;
    cookingTimeMinutes: number;
    cuisine: string;
    dietaryTags: string[];
    ingredients: Array<{ name: string; amount: string; unit: string }>;
    steps: Array<{ text: string; isCheckpoint: boolean; checkpointLabel: string | null }>;
    stepCount: number;
}

export default function Generate() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    const activeMascot = useActiveMascot()

    const [mode, setMode] = useState<'photo' | 'random'>(() => sessionStorage.getItem('gen_mode') as 'photo' | 'random' || 'photo')
    const [step, setStep] = useState<'input' | 'ingredients' | 'recipes'>(() => sessionStorage.getItem('gen_step') as 'input' | 'ingredients' | 'recipes' || 'input')
    const [loading, setLoading] = useState(false)

    const [photos, setPhotos] = useState<File[]>([])
    const [photoUrls, setPhotoUrls] = useState<string[]>([])
    const [prompt, setPrompt] = useState(() => sessionStorage.getItem('gen_prompt') || searchParams.get('challengeDescription') || '')

    const [ingredients, setIngredients] = useState<string[]>(() => JSON.parse(sessionStorage.getItem('gen_ingredients') || '[]'))
    const [excluded, setExcluded] = useState<Set<string>>(() => new Set(JSON.parse(sessionStorage.getItem('gen_excluded') || '[]')))
    const [recipes, setRecipes] = useState<Recipe[]>(() => JSON.parse(sessionStorage.getItem('gen_recipes') || '[]'))
    const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null)

    const cameraInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        sessionStorage.setItem('gen_mode', mode)
        sessionStorage.setItem('gen_step', step)
        sessionStorage.setItem('gen_prompt', prompt)
        sessionStorage.setItem('gen_ingredients', JSON.stringify(ingredients))
        sessionStorage.setItem('gen_excluded', JSON.stringify(Array.from(excluded)))
        sessionStorage.setItem('gen_recipes', JSON.stringify(recipes))
    }, [mode, step, prompt, ingredients, excluded, recipes])

    const handleBack = () => {
        if (step === 'recipes') {
            setRecipes([]);
            setStep(mode === 'photo' ? 'ingredients' : 'input');
        } else if (step === 'ingredients') {
            setIngredients([]);
            setExcluded(new Set());
            setStep('input');
        }
    }

    const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (photos.length >= 3) return toast.error(t('generate.maxPhotosError', 'Максимум 3 фото'))

        setPhotos(prev => [...prev, file])
        setPhotoUrls(prev => [...prev, URL.createObjectURL(file)])
        e.target.value = ''
    }

    const removePhoto = (indexToRemove: number) => {
        setPhotos(prev => prev.filter((_, index) => index !== indexToRemove))
        setPhotoUrls(prev => prev.filter((_, index) => index !== indexToRemove))
    }

    const analyzePhotos = async () => {
        if (photos.length === 0) return toast.error(t('generate.addPhotoError', "Додайте хоча б одне фото"))

        setLoading(true)
        try {
            const formData = new FormData();
            photos.forEach(photo => formData.append('files', photo));

            const currentLang = i18n.language || window.localStorage.getItem('i18nextLng') || '';
            const lang = (currentLang.toLowerCase().includes('uk') || currentLang.toLowerCase().includes('ua')) ? 'uk' : 'en';

            const response = await api.post(`/api/v1/recipes/recognize?language=${lang}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const recognized = response.data.recognizedIngredients;
            if (recognized && recognized.length > 0) {
                setExcluded(new Set());
                setRecipes([]);
                setIngredients(recognized);
                setStep('ingredients');
                toast.success(t('generate.foundIngredients', 'Інгредієнти розпізнано!'));
            } else {
                toast.error(t('generate.recognizeError', "Не вдалося розпізнати інгредієнти"));
            }
        } catch (error) {
            console.error("Помилка розпізнавання:", error);
            toast.error(t('generate.analyzeError', "Сталася помилка при аналізі фото"));
        } finally {
            setLoading(false);
        }
    }

    const generateRecipes = async () => {
        const activeIngredients = ingredients.filter(ing => !excluded.has(ing));

        if (mode === 'random' && !prompt.trim()) {
            return toast.warning(t('generate.emptyPromptWarn', "Введіть запит для генерації"));
        }
        if (mode === 'photo' && activeIngredients.length === 0) {
            return toast.warning(t('generate.emptyIngredientsWarn', "Немає активних інгредієнтів для рецепту"));
        }

        setLoading(true)
        try {
            const currentLang = i18n.language || window.localStorage.getItem('i18nextLng') || '';
            const lang = (currentLang.toLowerCase().includes('uk') || currentLang.toLowerCase().includes('ua')) ? 'uk' : 'en';

            const payload = {
                textQuery: mode === 'random' ? prompt : "",
                ingredients: mode === 'photo' ? activeIngredients : [],
                requestLanguage: lang
            };

            const response = await api.post('/api/v1/recipes/generate', payload);

            if (response.data.recipes && response.data.recipes.length > 0) {
                setRecipes(response.data.recipes);
                setStep('recipes');
                toast.success(t('generate.recipesReady', "Рецепти готові!"));
            } else {
                toast.error(t('generate.generateError', "Не вдалося згенерувати рецепти"));
            }
        } catch (error) {
            console.error("Помилка генерації:", error);
            toast.error(t('generate.generateErrorFallback', "Не вдалося згенерувати рецепти. Спробуйте ще раз."));
        } finally {
            setLoading(false);
        }
    }

    const handleChooseRecipe = (recipe: Recipe) => {
        sessionStorage.setItem('current_viewing_recipe', JSON.stringify(recipe));
        navigate(`/recipe/${recipe.id}`);
    }

    if (step === 'recipes') {
        return (
            <div className="space-y-4 animate-slide-up pb-20">
                <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} /> {t('common.back', 'Назад')}
                </button>

                <div className="flex justify-center mb-6">
                    <Mascot name={activeMascot as MascotName} mood="happy" size={80} message={t('generate.mascotSelect', 'Обери рецепт!')} animation="pop" />
                </div>

                <div className="space-y-4">
                    {recipes.map((recipe) => {
                        const isExpanded = expandedRecipeId === recipe.id;

                        const difficultyColor = recipe.difficulty.toLowerCase() === 'easy' ? 'bg-green-500/20 text-green-400' :
                            recipe.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400';

                        return (
                            <div key={recipe.id} className="bg-[#1a1a2e] rounded-3xl border border-white/5 p-5 transition-all">

                                <div className="flex items-start justify-between mb-3 gap-2">
                                    <h3 className="font-bold text-white text-lg leading-tight">{recipe.name}</h3>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={cn('text-[10px] px-2.5 py-1 rounded-full font-bold uppercase', difficultyColor)}>
                                            {t(`difficulty.${recipe.difficulty.toLowerCase()}`, recipe.difficulty)}
                                        </span>
                                        <span className="text-orange-500 font-bold text-sm">
                                            +{recipe.points} XP
                                        </span>
                                    </div>
                                </div>

                                <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-3">
                                    {recipe.description}
                                </p>

                                <div className="mb-4">
                                    <button
                                        onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                                        className="flex items-center gap-1 text-orange-500 text-sm font-medium"
                                    >
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        {t('recipe.ingredientsCount', 'Інгредієнти ({{count}})', { count: recipe.ingredients.length })}
                                    </button>

                                    {isExpanded && (
                                        <div className="mt-3 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                                            {recipe.ingredients.map((ing, idx) => (
                                                <div key={idx} className="flex justify-between text-sm text-gray-300 bg-white/5 px-3 py-2 rounded-lg">
                                                    <span>{ing.name}</span>
                                                    <span className="text-gray-500 font-medium">{ing.amount} {ing.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleChooseRecipe(recipe)}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-lg shadow-orange-500/20"
                                >
                                    {t('generate.selectBtn', 'Обрати цей рецепт')}
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (step === 'ingredients') {
        return (
            <div className="space-y-6 animate-slide-up pb-10">
                <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} /> {t('common.back', 'Назад')}
                </button>

                <div className="flex justify-center">
                    <Mascot name={activeMascot as MascotName} mood="happy" size={80} message={t('generate.mascotFound', 'Я знайшов ці інгредієнти!')} animation="pop" />
                </div>

                <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-5">
                    <p className="text-sm text-gray-400 mb-4 text-center">
                        {t('generate.excludeHint', 'Натисніть на інгредієнт, якщо хочете виключити його з рецепту.')}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {ingredients.map((ing, i) => {
                            const isExcluded = excluded.has(ing);
                            return (
                                <button
                                    key={i}
                                    onClick={() => setExcluded(prev => {
                                        const newSet = new Set(prev);
                                        if (isExcluded) newSet.delete(ing);
                                        else newSet.add(ing);
                                        return newSet;
                                    })}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                                        isExcluded
                                            ? "bg-red-500/10 border-red-500/20 text-red-400 opacity-50 line-through"
                                            : "bg-white/10 border-white/10 text-white"
                                    )}
                                >
                                    {ing}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <button
                    onClick={generateRecipes}
                    disabled={loading || ingredients.filter(ing => !excluded.has(ing)).length === 0}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
                >
                    {loading ? t('generate.processing', 'Генерація...') : t('generate.findRecipesBtn', 'Згенерувати рецепти')}
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex justify-center">
                <Mascot name={activeMascot as MascotName} mood="neutral" size={90} message={t('generate.mascotStart', 'Що приготуємо?')} animation="pop" />
            </div>

            <div className="space-y-5">
                <div className="flex bg-white/5 rounded-2xl p-1.5">
                    <button onClick={() => setMode('photo')} className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all', mode === 'photo' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500')}>
                        <Camera size={18} /> {t('generate.photoTab', 'Фото')}
                    </button>
                    <button onClick={() => setMode('random')} className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all', mode === 'random' ? 'bg-[#1a1a2e] text-white shadow-lg' : 'text-gray-500')}>
                        <Shuffle size={18} /> {t('generate.generatorTab', 'Генератор')}
                    </button>
                </div>

                {mode === 'photo' ? (
                    <div className="space-y-4 animate-slide-up">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {photoUrls.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removePhoto(i)}
                                        className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}

                            {photos.length < 3 && (
                                <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-3">
                                    <button
                                        onClick={() => cameraInputRef.current?.click()}
                                        className="flex md:hidden items-center justify-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-xl text-xs font-bold"
                                    >
                                        <Camera size={16} /> {t('generate.cameraBtn', 'Камера')}
                                    </button>
                                    <button
                                        onClick={() => galleryInputRef.current?.click()}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 text-gray-300 rounded-xl text-xs font-bold hover:bg-white/20 transition-colors"
                                    >
                                        <Upload size={16} /> {t('generate.galleryBtn', 'Галерея')}
                                    </button>
                                    <span className="text-[10px] text-gray-500">{photos.length}/3 {t('generate.uploaded', 'завантажено')}</span>
                                </div>
                            )}
                        </div>
                        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoAdd} />
                        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoAdd} />
                    </div>
                ) : (
                    <div className="animate-slide-up">
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            rows={4}
                            placeholder={t('generate.promptPlaceholder', 'Наприклад: Згенеруй класичний рецепт лазаньї...')}
                            className="w-full px-5 py-4 bg-[#1a1a2e] border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 text-sm resize-none shadow-inner"
                        />
                    </div>
                )}
            </div>

            <div className="pt-4">
                <button
                    onClick={mode === 'photo' ? analyzePhotos : generateRecipes}
                    disabled={loading || (mode === 'photo' && photos.length === 0) || (mode === 'random' && prompt.trim().length === 0)}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-white/5 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
                >
                    {loading ? t('generate.processing', 'Зачекайте...') : mode === 'photo' ? t('generate.detectAndFindBtn', 'Визначити продукти') : t('generate.findRecipesBtn', 'Згенерувати рецепти')}
                </button>
            </div>

        </div>
    )
}