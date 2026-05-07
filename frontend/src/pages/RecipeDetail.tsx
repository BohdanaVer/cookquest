'use client'

import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Bookmark, ChevronDown, ChevronUp, Swords, ChefHat, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../lib/utils'
import { useTranslation } from 'react-i18next'
import { api } from '../api/axiosClient'
import type { Recipe } from './Generate'
import { useEffect, useState } from "react";

export default function RecipeDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { t } = useTranslation()

    const [searchParams] = useSearchParams()
    const isQuest = searchParams.get('quest') === 'true'

    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [isIngredientsExpanded, setIsIngredientsExpanded] = useState(true)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const fetchRecipe = async () => {
            await Promise.resolve();

            const cachedRecipe = sessionStorage.getItem('current_viewing_recipe')
            if (cachedRecipe) {
                try {
                    const parsed = JSON.parse(cachedRecipe) as Recipe
                    if (parsed.id === id) {
                        setRecipe(parsed)
                        return
                    }
                } catch (e) {
                    console.error("Помилка парсингу кешу", e)
                }
            }

            try {
                const res = await api.get(`/api/v1/recipes/${id}`);
                setRecipe(res.data);
            } catch (err) {
                console.error(err);
                toast.error(t('recipe.notFound', 'Рецепт не знайдено.'));
                navigate(-1);
            }
        };

        if (id) {
            fetchRecipe();
        }
    }, [id, navigate, t])

    useEffect(() => {
        const checkIfSaved = async () => {
            if (!id) return;
            try {
                const response = await api.get('/api/v1/recipes/saved');
                const savedList = response.data;

                const alreadySaved = savedList.some((r: { id: string | number }) => String(r.id) === String(id));
                setIsBookmarked(alreadySaved);
            } catch (error) {
                console.error("Не вдалося перевірити статус збереження", error);
            }
        };

        checkIfSaved();
    }, [id]);

    const toggleBookmark = async () => {
        if (!recipe || isSaving) return;

        const previousState = isBookmarked;

        setIsBookmarked(!previousState);
        setIsSaving(true);

        try {
            if (!previousState) {
                await api.post(`/api/v1/recipes/${recipe.id}/save`);
                toast.success(t('recipe.saved', 'Рецепт збережено!'));
            } else {
                await api.delete(`/api/v1/recipes/${recipe.id}/save`);
                toast.success(t('recipe.unsaved', 'Рецепт видалено зі збережених.'));
            }
        } catch (error) {
            setIsBookmarked(previousState);
            toast.error(t('recipe.saveError', 'Помилка при оновленні збережених.'));
            console.error("Помилка збереження рецепту:", error);
        } finally {
            setIsSaving(false);
        }
    }

    if (!recipe) {
        return <div className="flex justify-center items-center min-h-[50vh] text-gray-500 animate-pulse">
            {t('common.loading', 'Завантаження...')}
        </div>
    }

    const difficultyColor = recipe.difficulty.toLowerCase() === 'easy' ? 'bg-green-500/20 text-green-400' :
        recipe.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400';

    return (
        <div className="relative min-h-[calc(100vh-80px)] pb-24 animate-in fade-in duration-500">

            <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} /> {t('common.back', 'Назад')}
            </button>

            <div className="bg-[#1a1a2e] rounded-3xl border border-white/5 p-6 mb-6 shadow-xl">

                <div className="flex items-start justify-between mb-4 gap-4">
                    <h1 className="font-extrabold text-white text-2xl leading-tight">{recipe.name}</h1>
                    <button
                        onClick={toggleBookmark}
                        disabled={isSaving}
                        className={cn(
                            "p-2.5 rounded-xl transition-all active:scale-95",
                            isBookmarked
                                ? "text-orange-500 bg-orange-500/10 shadow-inner"
                                : "text-gray-500 hover:text-white hover:bg-white/5",
                            isSaving && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Bookmark size={24} className={cn(isBookmarked ? "fill-current" : "", "transition-transform", isSaving && "animate-pulse")} />
                    </button>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    {recipe.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className={cn('text-[11px] px-3 py-1.5 rounded-full font-bold uppercase', difficultyColor)}>
                        {t(`difficulty.${recipe.difficulty.toLowerCase()}`, recipe.difficulty)}
                    </span>
                    <span className="text-orange-500 font-extrabold text-sm">
                        +{recipe.points} XP
                    </span>
                    {isQuest && (
                        <span className="bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase">
                            {t('recipe.questTask', 'Квестове завдання')}
                        </span>
                    )}
                    {recipe.cuisine && !isQuest && (
                        <span className="text-gray-500 text-sm font-medium">
                            {recipe.cuisine}
                        </span>
                    )}
                </div>

                <div className="border-t border-white/5 pt-4">
                    <button
                        onClick={() => setIsIngredientsExpanded(!isIngredientsExpanded)}
                        className="flex items-center gap-1 text-orange-500 text-sm font-medium transition-colors hover:text-orange-400"
                    >
                        {isIngredientsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        {t('recipe.ingredientsCount', 'Інгредієнти ({{count}})', { count: recipe.ingredients.length })}
                    </button>

                    {isIngredientsExpanded && (
                        <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                            {recipe.ingredients.map((ing, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm text-gray-300 py-1.5 border-b border-white/5 last:border-0">
                                    <span className="font-medium pr-4">{ing.name}</span>
                                    <span className="text-gray-500 whitespace-nowrap">{ing.amount} {ing.unit}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="fixed bottom-[80px] left-0 right-0 p-4 z-10 pointer-events-none">
                <div className="max-w-md mx-auto grid grid-cols-2 gap-3 pointer-events-auto">
                    <button
                        onClick={() => navigate(`/cook/${recipe.id}`)}
                        className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                    >
                        <ChefHat size={18} /> {t('recipe.cookBtn', 'Cook')}
                    </button>

                    {isQuest ? (
                        <button
                            onClick={() => toast.error(t('recipe.battleDisabledInQuest', 'Батли недоступні для квестових рецептів!'))}
                            className="flex items-center justify-center gap-2 bg-[#2a2a3e] text-gray-500 font-bold py-4 rounded-2xl transition-all cursor-not-allowed shadow-lg border border-white/5"
                        >
                            <Swords size={18} /> {t('recipe.battleBtn', 'Battle')}
                        </button>
                    ) : (
                        <button
                            onClick={() => toast.info(t('recipe.battleInDev', 'Режим Батлу ще в розробці!'))}
                            className="flex items-center justify-center gap-2 bg-[#ff3366] hover:bg-[#ff3366]/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#ff3366]/20 transition-all active:scale-95"
                        >
                            <Swords size={18} /> {t('recipe.battleBtn', 'Battle')}
                        </button>
                    )}
                </div>
            </div>

        </div>
    )
}