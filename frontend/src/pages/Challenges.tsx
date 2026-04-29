import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Target, Settings, Play } from 'lucide-react';
import { api } from '../api/axiosClient';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Quest {
    id: number;
    recipeId: string;
    activeDate: string;
    xpMultiplier: number;
    cuisineName: string;
}

export default function Challenges() {
    const { t } = useTranslation();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);

    const isAdmin = localStorage.getItem('role') === 'ADMIN';

    const fetchUserQuests = useCallback(async () => {
        try {
            const response = await api.get('/api/v1/quests');
            setQuests(response.data);
        } catch (error) {
            toast.error(t('quests.fetchError'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        const loadInitialData = async () => {
            await fetchUserQuests();
        };

        loadInitialData();
    }, [fetchUserQuests]);

    return (
        <div className="space-y-5 animate-in fade-in duration-500 pb-10">
            <div className="bg-linear-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/20 rounded-2xl p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Target size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold text-white">{t('quests.title')}</h1>
                        <p className="text-xs text-gray-400">{t('quests.subtitle')}</p>
                    </div>
                </div>

                {isAdmin && (
                    <Link
                        to="/admin/quests"
                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                        <Settings size={14} />
                        <span className="hidden sm:inline">{t('quests.adminBtn')}</span>
                    </Link>
                )}
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-8 text-center text-gray-500">
                        {t('quests.loading')}
                    </div>
                ) : quests.length === 0 ? (
                    <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-8 text-center text-gray-500">
                        {t('quests.empty')}
                    </div>
                ) : (
                    quests.map(quest => (
                        <div key={quest.id} className="bg-[#1a1a2e] rounded-2xl border border-purple-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-500/30 transition-colors">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{quest.cuisineName}</h3>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                    <span className="bg-white/5 px-2 py-1 rounded-md">
                                        🗓 {t('quests.activeDate')} <span className="text-gray-300">{quest.activeDate}</span>
                                    </span>
                                    <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-md font-bold">
                                        ⚡️ {t('quests.multiplier')} x{quest.xpMultiplier}
                                    </span>
                                </div>
                            </div>

                            <button className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-bold py-2 px-4 rounded-xl transition-colors">
                                <Play size={16} fill="currentColor" />
                                {t('quests.startBtn')}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}