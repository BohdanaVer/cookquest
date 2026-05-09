'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Check, Camera, Loader2, Clock, Swords } from 'lucide-react'
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
    xpMode: 'FULL' | 'REDUCED' | 'NONE' | 'BATTLE';
    completedSteps?: number;
}

interface BattleResponse {
    battleId: number;
    opponentName: string;
    status: string;
}

export default function Cook() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { t, i18n } = useTranslation()

    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [session, setSession] = useState<CookingSessionDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [isVerifying, setIsVerifying] = useState(false)

    const [completedSteps, setCompletedSteps] = useState<number>(0)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [pendingPhotoStepIndex, setPendingPhotoStepIndex] = useState<number | null>(null)

    const hasStartedRef = useRef(false)

    const searchParams = new URLSearchParams(location.search)
    const isResumeMode = searchParams.get('mode') === 'resume'
    const battleId = searchParams.get('battle')

    const [battleDetails, setBattleDetails] = useState<BattleResponse | null>(null)
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (session?.xpMode === 'BATTLE' && recipe) {
            const startTimestamp = new Date(session.startedAt).getTime();
            const timeLimitMs = recipe.cookingTimeMinutes * 60 * 1000;
            
            timer = setInterval(() => {
                const now = new Date().getTime();
                const elapsedMs = now - startTimestamp;
                const remaining = Math.max(-elapsedMs, timeLimitMs - elapsedMs); // can be negative
                setTimeRemaining(Math.floor(remaining / 1000));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [session, recipe]);

    const formatTime = (totalSeconds: number) => {
        const isNegative = totalSeconds < 0;
        const absSeconds = Math.abs(totalSeconds);
        const minutes = Math.floor(absSeconds / 60);
        const seconds = absSeconds % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        return isNegative ? `-${timeStr}` : timeStr;
    };

    useEffect(() => {
        if (!id || hasStartedRef.current) return;
        hasStartedRef.current = true;

        const initSession = async () => {
            try {
                if (isResumeMode) {
                    const activeResp = await api.get('/api/v1/cooking/active');
                    const activeSessions: CookingSessionDto[] = activeResp.data;
                    const existingSession = activeSessions.find(s => s.sessionId.toString() === id);

                    if (!existingSession) {
                        toast.error('Активну сесію не знайдено');
                        navigate('/home');
                        return;
                    }

                    setSession(existingSession);

                    let parsedRecipe: Recipe;
                    if (typeof existingSession.recipe === 'string') {
                        parsedRecipe = JSON.parse(existingSession.recipe) as Recipe;
                    } else {
                        parsedRecipe = existingSession.recipe as unknown as Recipe;
                    }
                    setRecipe(parsedRecipe);

                    setCompletedSteps(existingSession.completedSteps || 0);

                    if (battleId) {
                        try {
                            const battleRes = await api.get(`/api/v1/battles/${battleId}`);
                            setBattleDetails(battleRes.data);
                        } catch (e) {
                            console.error("Failed to load battle details", e);
                        }
                    }

                } else {
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
                }

            } catch (error) {
                console.error("Помилка ініціалізації сесії:", error);
                toast.error(t('cook.startError', 'Не вдалося завантажити сесію.'));
                hasStartedRef.current = false;
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        initSession();
    }, [id, isResumeMode, navigate, t]);

    const verifyStepOnBackend = async (stepIndex: number, file: File) => {
        if (!session) return false;
        setIsVerifying(true);

        try {
            const currentLang = i18n.language || window.localStorage.getItem('i18nextLng') || '';
            const lang = (currentLang.toLowerCase().includes('uk') || currentLang.toLowerCase().includes('ua')) ? 'uk' : 'en';

            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post(`/api/v1/cooking/${session.sessionId}/verify-step`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                params: {
                    stepNumber: stepIndex + 1,
                    language: lang
                }
            });

            const result = response.data;

            if (result && result.passed === false) {
                toast.error(result.feedback || t('cook.verifyFailed', 'Фото не пройшло перевірку. Спробуйте ще раз.'));
                return false;
            }

            if (result && result.feedback) {
                toast.success(result.feedback);
            }

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
        if (isVerifying) return;
        setCompletedSteps(prev => Math.max(prev, stepIndex + 1));
        toast.success(t('cook.stepDone', 'Крок {{n}} виконано!', { n: stepIndex + 1 }));
    };

    const handleTakePhoto = (stepIndex: number) => {
        if (isVerifying) return;
        setPendingPhotoStepIndex(stepIndex);
        fileInputRef.current?.click();
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || pendingPhotoStepIndex === null) return;

        const currentStepIndex = pendingPhotoStepIndex;
        e.target.value = '';

        const success = await verifyStepOnBackend(currentStepIndex, file);
        if (success) {
            completeStepLocally(currentStepIndex);
        }

        setPendingPhotoStepIndex(null);
    };

    const handleFinishCooking = () => {
        window.dispatchEvent(new Event('profileUpdated'));
        toast.success(t('cook.success', 'Готування завершено! Вітаємо!'));
        navigate(-1);
    };

    const handleCancelCooking = async () => {
        const isConfirmed = window.confirm(t('cook.confirmCancel', 'Ви впевнені, що хочете скасувати готування? Прогрес не збережеться.'));

        if (isConfirmed) {
            if (session) {
                try {
                    await api.post(`/api/v1/cooking/${session.sessionId}/cancel`);
                    // Якщо це батл — також скасувати участь у батлі
                    if (battleId) {
                        await api.post(`/api/v1/battles/${battleId}/cancel`);
                    }
                    toast.info(t('cook.cancelled', 'Готування скасовано.'));
                } catch (error) {
                    console.error("Failed to cancel cooking session:", error);
                }
            }
            navigate('/home');
        }
    };

    if (loading || !recipe || !session) {
        return <div className="flex justify-center items-center min-h-[50vh] text-gray-500 animate-pulse">
            {t('cook.preparing', 'Підготовка кухні...')}
        </div>
    }

    const totalSteps = recipe.steps.length;
    const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    const isAllCompleted = completedSteps >= totalSteps;

    return (
        <div className="relative min-h-screen pb-32 animate-in fade-in duration-500">

            <button onClick={handleCancelCooking} className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} /> {t('cook.cancelSession', 'Відмінити готування')}
            </button>

            {session?.xpMode === 'BATTLE' && battleDetails && (
                <div className="bg-[#ff3366]/10 border border-[#ff3366]/30 rounded-3xl p-5 mb-6 shadow-xl animate-in slide-in-from-top flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-[#ff3366] font-bold text-sm mb-1 uppercase tracking-wider">
                            <Swords size={18} /> {t('battle.opponentTurn', 'Батл проти')}
                        </div>
                        <div className="text-white font-extrabold text-xl">{battleDetails.opponentName}</div>
                    </div>
                    {timeRemaining !== null && (
                        <div className={cn(
                            "flex flex-col items-end",
                            timeRemaining < 0 ? "text-red-500" : "text-[#ff3366]"
                        )}>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
                                {timeRemaining < 0 ? t('battle.overtime', 'Запізнення') : t('battle.timeRemaining', 'Залишилось часу')}
                            </div>
                            <div className="text-3xl font-black tabular-nums tracking-tight flex items-center gap-2">
                                <Clock size={24} /> {formatTime(timeRemaining)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-[#2a1a1a] rounded-3xl p-6 mb-6 shadow-xl border border-orange-500/10">
                <h1 className="font-extrabold text-white text-2xl leading-tight mb-4">{recipe.name}</h1>

                <div className="flex items-center justify-end mb-6">
                    <span className="text-orange-500 font-extrabold text-sm">
                        +{recipe.points} XP
                    </span>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <span>{t('cook.progress', 'Прогрес')}</span>
                        <span>{Math.min(completedSteps, totalSteps)}/{totalSteps}</span>
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

                    const canTakeOptionalPhoto = session.xpMode === 'FULL' || ((session.xpMode === 'REDUCED' || session.xpMode === 'BATTLE') && isLastStep);
                    const isThisStepVerifying = isVerifying && (index === pendingPhotoStepIndex);

                    const hideManualDone = isLastStep && session.xpMode !== 'NONE';

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
                                    <p className={cn("text-sm leading-relaxed mb-3", isCompleted ? "text-gray-500" : "text-gray-400")}>
                                        {step.text}
                                    </p>

                                    {!isCompleted && isAccessible && (
                                        <div className="flex flex-wrap items-center gap-2 mt-2">

                                            {/* Кнопка ручного завершення (ховається на останньому кроці за потреби) */}
                                            {!hideManualDone && (
                                                <button
                                                    onClick={() => completeStepLocally(index)}
                                                    disabled={isVerifying}
                                                    className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 bg-orange-500/20 hover:bg-orange-500/30 text-orange-500"
                                                >
                                                    <Check size={16} /> {t('cook.done', 'Готово')}
                                                </button>
                                            )}

                                            {/* Кнопка фото */}
                                            {canTakeOptionalPhoto && (
                                                <button
                                                    onClick={() => handleTakePhoto(index)}
                                                    disabled={isVerifying}
                                                    className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                                                >
                                                    {isThisStepVerifying ? (
                                                        <><Loader2 size={16} className="animate-spin" /> {t('cook.verifying', 'Перевірка...')}</>
                                                    ) : (
                                                        <><Camera size={16} /> {hideManualDone ? t('cook.takePhotoRequired', 'Зробити фінальне фото') : t('cook.takePhotoXp', 'Фото +XP')}</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {isCompleted && (
                                        <div className="flex items-center gap-1.5 text-green-500 text-sm font-bold mt-1">
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