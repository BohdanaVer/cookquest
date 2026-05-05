'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Check, Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../lib/utils'
import { useTranslation } from 'react-i18next'
import { api } from '../api/axiosClient'

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

interface CookingSessionDto {
    sessionId: number;
    recipe: string;
    status: string;
    earnedPoints: number;
    startedAt: string;
    batchId: string;
    xpMode: 'FULL' | 'REDUCED' | 'NONE';
}

export default function Cook() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()

    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [session, setSession] = useState<CookingSessionDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [isVerifying, setIsVerifying] = useState(false)

    const [completedSteps, setCompletedSteps] = useState<number>(0)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [pendingPhotoStepIndex, setPendingPhotoStepIndex] = useState<number | null>(null)

    const hasStartedRef = useRef(false)

    useEffect(() => {
        if (!id || hasStartedRef.current) return;
        hasStartedRef.current = true;

        const startSession = async () => {
            try {
                const response = await api.post('/api/v1/cooking/start', { recipeId: id });
                const sessionData: CookingSessionDto = response.data;
                setSession(sessionData);

                let parsedRecipe: Recipe;
                if (typeof sessionData.recipe === 'string') {
                    parsedRecipe = JSON.parse(sessionData.recipe) as Recipe;
                } else {
                    parsedRecipe = sessionData.recipe as unknown as Recipe;
                }
                setRecipe(parsedRecipe);

            } catch (error) {
                console.error("Failed to start cooking session:", error);
                toast.error(t('cook.startError', 'Не вдалося почати готування. Спробуйте ще раз.'));
                hasStartedRef.current = false;
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        startSession();
    }, [id, navigate, t]);


    const verifyStepOnBackend = async (stepIndex: number, file: File) => {
        if (!session) return false;
        setIsVerifying(true);

        try {
            const formData = new FormData();
            formData.append('stepNumber', stepIndex.toString());
            formData.append('file', file);

            const currentLang = i18n.language || window.localStorage.getItem('i18nextLng') || '';
            const lang = (currentLang.toLowerCase().includes('uk') || currentLang.toLowerCase().includes('ua')) ? 'uk' : 'en';
            formData.append('language', lang);

            await api.post(`/api/v1/cooking/${session.sessionId}/verify-step`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            return true;
        } catch (error) {
            console.error("Помилка перевірки кроку:", error);
            toast.error(t('cook.verifyError', 'Помилка перевірки. Спробуйте ще раз.'));
            return false;
        } finally {
            setIsVerifying(false);
        }
    };

    const completeStepLocally = (stepIndex: number) => {
        setCompletedSteps(stepIndex + 1);
        toast.success(t('cook.stepDone', 'Крок {{n}} виконано!', { n: stepIndex + 1 }));
    };

    const handleStepAction = async (stepIndex: number) => {
        if (!session || !recipe || isVerifying) return;

        const isLastStep = stepIndex === recipe.steps.length - 1;
        const needsPhoto = session.xpMode === 'FULL' || (session.xpMode === 'REDUCED' && isLastStep);

        if (needsPhoto) {
            setPendingPhotoStepIndex(stepIndex);
            fileInputRef.current?.click();
        } else {
            completeStepLocally(stepIndex);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || pendingPhotoStepIndex === null) return;

        const success = await verifyStepOnBackend(pendingPhotoStepIndex, file);
        if (success) {
            completeStepLocally(pendingPhotoStepIndex);
        }

        setPendingPhotoStepIndex(null);
        e.target.value = '';
    };

    const handleFinishCooking = () => {
        toast.success(t('cook.success', 'Готування завершено! Вітаємо!'));
        navigate(-1);
    };


    if (loading || !recipe || !session) {
        return <div className="flex justify-center items-center min-h-[50vh] text-gray-500 animate-pulse">
            {t('cook.preparing', 'Підготовка кухні...')}
        </div>
    }

    const totalSteps = recipe.steps.length;
    const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    const isAllCompleted = completedSteps === totalSteps;

    return (
        <div className="relative min-h-screen pb-32 animate-in fade-in duration-500">

            <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} /> {t('cook.finishSession', 'Завершити готування')}
            </button>

            <div className="bg-[#2a1a1a] rounded-3xl p-6 mb-6 shadow-xl border border-orange-500/10">
                <h1 className="font-extrabold text-white text-2xl leading-tight mb-4">{recipe.name}</h1>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1.5 text-orange-400 font-bold">
                        <Clock size={16} /> {recipe.cookingTimeMinutes} {t('cook.minutes', 'хв')}
                    </div>
                    <span className="text-orange-500 font-extrabold text-sm">
                        +{recipe.points} XP
                    </span>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <span>{t('cook.progress', 'Прогрес')}</span>
                        <span>{completedSteps}/{totalSteps}</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-orange-500 transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
            />

            <div className="space-y-4">
                {recipe.steps.map((step, index) => {
                    const isAccessible = index <= completedSteps;
                    const isCompleted = index < completedSteps;
                    const isLastStep = index === totalSteps - 1;
                    const requiresPhoto = session.xpMode === 'FULL' || (session.xpMode === 'REDUCED' && isLastStep);

                    const isThisStepVerifying = isVerifying && (index === pendingPhotoStepIndex);

                    return (
                        <div
                            key={index}
                            className={cn(
                                "rounded-3xl p-5 transition-all duration-300 border-2",
                                isCompleted
                                    ? "bg-[#1a1a2e]/50 border-green-500/30 opacity-70"
                                    : isAccessible
                                        ? "bg-[#1a1a2e] border-orange-500/50 shadow-lg shadow-orange-500/5"
                                        : "bg-[#1a1a2e]/50 border-white/5 opacity-40 pointer-events-none grayscale"
                            )}
                        >
                            <div className="flex gap-4">
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 shrink-0 rounded-xl font-black text-sm transition-colors",
                                    isCompleted ? "bg-green-500/20 text-green-500" : "bg-orange-500/20 text-orange-500"
                                )}>
                                    {index + 1}
                                </div>

                                <div className="flex-1">
                                    <h3 className={cn("font-bold text-lg mb-2 leading-tight", isCompleted ? "text-gray-400 line-through" : "text-white")}>
                                        {step.checkpointLabel || `${t('cook.step', 'Крок')} ${index + 1}`}
                                    </h3>
                                    <p className={cn("text-sm leading-relaxed mb-4", isCompleted ? "text-gray-500" : "text-gray-400")}>
                                        {step.text}
                                    </p>

                                    {!isCompleted && isAccessible && (
                                        <button
                                            onClick={() => handleStepAction(index)}
                                            disabled={isVerifying}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50",
                                                requiresPhoto
                                                    ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                                                    : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-500"
                                            )}
                                        >
                                            {isThisStepVerifying ? (
                                                <><Loader2 size={16} className="animate-spin" /> {t('cook.verifying', 'Перевірка...')}</>
                                            ) : requiresPhoto ? (
                                                <><Camera size={16} /> {isLastStep ? t('cook.dishPhoto', 'Dish photo') : t('cook.takePhoto', 'Take photo')}</>
                                            ) : (
                                                <><Check size={16} /> {t('cook.done', 'Done')}</>
                                            )}
                                        </button>
                                    )}

                                    {isCompleted && (
                                        <div className="flex items-center gap-1.5 text-green-500 text-sm font-bold">
                                            <Check size={16} /> {t('cook.completed', 'Completed')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {isAllCompleted && (
                <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a]/95 to-transparent z-10 animate-in slide-in-from-bottom-10">
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={handleFinishCooking}
                            className="w-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-extrabold text-lg py-5 rounded-2xl shadow-[0_0_40px_-10px_rgba(34,197,94,0.5)] transition-all active:scale-95"
                        >
                            {t('cook.dishReady', 'Dish is ready!')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}