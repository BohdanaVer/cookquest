'use client'

import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Bookmark, ChevronDown, ChevronUp, Swords, ChefHat, ArrowLeft, X, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../lib/utils'
import { useTranslation } from 'react-i18next'
import { api } from '../api/axiosClient'
import type { Recipe } from './Generate'
import { useEffect, useState } from "react";

interface FriendData {
    id: number | string;
    username: string;
    avatarUrl?: string;
}

export default function RecipeDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { t } = useTranslation()

    const [searchParams] = useSearchParams()
    const isQuest = searchParams.get('quest') === 'true'
    const incomingBattleId = searchParams.get('battle')
    const isPendingBattle = searchParams.get('pending') === 'true'

    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [isIngredientsExpanded, setIsIngredientsExpanded] = useState(true)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const [isBattleModalOpen, setIsBattleModalOpen] = useState(false)
    const [friends, setFriends] = useState<FriendData[]>([])
    const [isLoadingFriends, setIsLoadingFriends] = useState(false)
    const [isStartingBattle, setIsStartingBattle] = useState(false)

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

    const openBattleModal = async () => {
        setIsBattleModalOpen(true);
        setIsLoadingFriends(true);
        try {
            const response = await api.get('/api/v1/friends');
            setFriends(response.data);
        } catch (error) {
            console.error("Failed to load friends", error);
            toast.error(t('battle.noFriends', 'Немає друзів для батлу'));
        } finally {
            setIsLoadingFriends(false);
        }
    };

    const handleStartBattle = async (targetUsername: string) => {
        if (!recipe || isStartingBattle) return;
        setIsStartingBattle(true);

        try {
            const response = await api.post('/api/v1/battles', {
                recipeId: recipe.id,
                targetUsername: targetUsername
            });
            const battleId = response.data.battleId;
            const sessionId = response.data.mySession?.sessionId;

            toast.success(t('battle.challengeSent', 'Виклик відправлено!'));
            setIsBattleModalOpen(false);

            if (sessionId) {
                navigate(`/cook/${sessionId}?mode=resume&battle=${battleId}`);
            } else {
                navigate('/home');
            }
        } catch (error: unknown) {
            console.error("Failed to start battle", error);
        } finally {
            setIsStartingBattle(false);
        }
    };

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
                <div className={cn("max-w-md mx-auto gap-3 pointer-events-auto", (incomingBattleId && !isPendingBattle) ? "flex" : "grid grid-cols-2")}>

                    {incomingBattleId && isPendingBattle ? (
                        /* Pending invite — let user decide to accept or decline */
                        <>
                            <button
                                onClick={() => navigate('/home')}
                                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
                            >
                                {t('battle.decline', 'Відхилити')}
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await api.post(`/api/v1/battles/${incomingBattleId}/accept`);
                                        const sessionId = res.data.mySession?.sessionId;
                                        if (sessionId) {
                                            navigate(`/cook/${sessionId}?mode=resume&battle=${incomingBattleId}`);
                                        } else {
                                            navigate('/home');
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        toast.error(t('battle.acceptError', 'Помилка прийняття батлу'));
                                    }
                                }}
                                className="flex items-center justify-center gap-2 bg-[#ff3366] hover:bg-[#ff3366]/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#ff3366]/20 transition-all active:scale-95"
                            >
                                <Swords size={18} /> {t('battle.accept', 'Прийняти')} ⚔️
                            </button>
                        </>
                    ) : incomingBattleId && !isPendingBattle ? (
                        /* Battle already accepted — go to cooking session */
                        <button
                            onClick={async () => {
                                try {
                                    const battleRes = await api.get(`/api/v1/battles/${incomingBattleId}`);
                                    const battle = battleRes.data;
                                    if (battle.mySession?.sessionId) {
                                        navigate(`/cook/${battle.mySession.sessionId}?mode=resume&battle=${incomingBattleId}`);
                                    }
                                } catch (e) {
                                    console.error(e);
                                }
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#ff3366] hover:bg-[#ff3366]/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#ff3366]/20 transition-all active:scale-95"
                        >
                            <Swords size={18} /> {t('recipe.cookBtn', 'Готувати')} ⚔️
                        </button>
                    ) : (
                        /* Normal mode — Cook and Battle buttons */
                        <>
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
                                    onClick={openBattleModal}
                                    className="flex items-center justify-center gap-2 bg-[#ff3366] hover:bg-[#ff3366]/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#ff3366]/20 transition-all active:scale-95"
                                >
                                    <Swords size={18} /> {t('recipe.battleBtn', 'Battle')}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Battle Modal */}
            {isBattleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto">
                    <div className="bg-[#1a1a2e] w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Swords className="text-[#ff3366]" size={24} />
                                {t('battle.chooseOpponent', 'Оберіть суперника')}
                            </h2>
                            <button onClick={() => setIsBattleModalOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        {isLoadingFriends ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-[#ff3366]" size={32} />
                            </div>
                        ) : friends.length > 0 ? (
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {friends.map((friend) => (
                                    <div key={friend.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-white/10">
                                                {friend.avatarUrl ? (
                                                    <img src={friend.avatarUrl} alt={friend.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-purple-500 to-indigo-500 text-white uppercase">
                                                        {friend.username.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-bold text-white">{friend.username}</span>
                                        </div>
                                        <button
                                            onClick={() => handleStartBattle(friend.username)}
                                            disabled={isStartingBattle}
                                            className="px-4 py-2 rounded-xl text-sm font-bold bg-[#ff3366]/20 text-[#ff3366] hover:bg-[#ff3366]/30 transition-colors disabled:opacity-50"
                                        >
                                            {t('battle.sendChallenge', 'Кинути виклик')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8 px-4 bg-white/5 rounded-2xl border border-white/5">
                                <Users size={40} className="mx-auto mb-3 opacity-20" />
                                <p>{t('battle.noFriends', 'Немає друзів для батлу')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    )
}