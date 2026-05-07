import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, Settings, Play, Check, Lock } from 'lucide-react';
import { api } from '../api/axiosClient';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

interface Quest {
    id: number;
    recipeId: string;
    activeDate: string;
    xpMultiplier: number;
    cuisineName: string;
    status?: 'AVAILABLE' | 'COMPLETED' | 'EXPIRED' | 'LOCKED';
}

export default function Challenges() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);

    const isAdmin = localStorage.getItem('role') === 'ADMIN';

    useEffect(() => {
        const fetchUserQuests = async () => {
            try {
                const response = await api.get('/api/v1/quests');
                const sortedQuests = response.data.sort((a: Quest, b: Quest) =>
                    new Date(a.activeDate).getTime() - new Date(b.activeDate).getTime()
                );
                setQuests(sortedQuests);
            } catch (error) {
                toast.error(t('quests.fetchError', 'Помилка завантаження квестів'));
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserQuests();
    }, [t]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA', { weekday: 'long', day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-500 pb-10">
            <div className="bg-linear-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/20 rounded-2xl p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Target size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold text-white">{t('quests.title', 'Квести тижня')}</h1>
                        <p className="text-xs text-gray-400">{t('quests.subtitle', 'Виконуй завдання щодня')}</p>
                    </div>
                </div>

                {isAdmin && (
                    <Link
                        to="/admin/quests"
                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                        <Settings size={14} />
                        <span className="hidden sm:inline">{t('quests.adminBtn', 'Адмін')}</span>
                    </Link>
                )}
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-8 text-center text-gray-500">
                        {t('quests.loading', 'Завантаження...')}
                    </div>
                ) : quests.length === 0 ? (
                    <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-8 text-center text-gray-500">
                        {t('quests.empty', 'На цей тиждень ще немає квестів')}
                    </div>
                ) : (
                    quests.map(quest => {
                        const isLocked = quest.status === 'LOCKED';
                        const isCompleted = quest.status === 'COMPLETED';

                        return (
                            <div key={quest.id} className={cn(
                                "bg-[#1a1a2e] rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all",
                                isCompleted ? "border-white/5 opacity-60 grayscale" :
                                    isLocked ? "border-white/5 opacity-50" :
                                        "border-purple-500/20 hover:border-purple-500/40 shadow-lg shadow-purple-500/5"
                            )}>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white mb-1 capitalize">{quest.cuisineName}</h3>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                        <span className="bg-white/5 px-2 py-1 rounded-md capitalize font-medium text-gray-300">
                                            🗓 {formatDate(quest.activeDate)}
                                        </span>
                                        <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-md font-bold">
                                            ⚡️ x{quest.xpMultiplier} XP
                                        </span>
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    {isCompleted ? (
                                        <button disabled className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2a2a3e] text-gray-500 font-bold py-2.5 px-5 rounded-xl cursor-not-allowed border border-white/5">
                                            <Check size={16} />
                                            {t('quests.done', 'Виконано')}
                                        </button>
                                    ) : isLocked ? (
                                        <button disabled className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1a1a2e] text-gray-600 font-bold py-2.5 px-5 rounded-xl cursor-not-allowed border border-white/5">
                                            <Lock size={16} />
                                            {t('quests.locked', 'Зачинено')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => navigate(`/recipe/${quest.recipeId}?quest=true&mult=${quest.xpMultiplier}`)}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-bold py-2.5 px-5 rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-500/20"
                                        >
                                            <Play size={16} fill="currentColor" />
                                            {t('quests.startBtn', 'Почати')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}