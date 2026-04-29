import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axiosClient';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Quest {
    id: number;
    recipeId: string;
    activeDate: string;
    xpMultiplier: number;
    cuisineName: string;
}

interface QuestFormState {
    recipeId: string;
    activeDate: string;
    xpMultiplier: number;
    cuisineName: string;
}

const INITIAL_FORM_STATE: QuestFormState = {
    recipeId: '',
    activeDate: new Date().toISOString().split('T')[0],
    xpMultiplier: 1.0,
    cuisineName: ''
};

export default function AdminQuestsPanel() {
    const { t } = useTranslation();

    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<QuestFormState>(INITIAL_FORM_STATE);
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchQuests = useCallback(async () => {
        try {
            const response = await api.get('/api/v1/admin/quests');
            setQuests(response.data);
        } catch (error) {
            toast.error(t('adminQuests.errorFetch'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        const loadInitialData = async () => {
            await fetchQuests();
        };
        loadInitialData();
    }, [fetchQuests]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'xpMultiplier' ? parseFloat(value) || 1.0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingId) {
                await api.put(`/api/v1/admin/quests/${editingId}`, formData);
                toast.success(t('adminQuests.successUpdate'));
            } else {
                await api.post('/api/v1/admin/quests', formData);
                toast.success(t('adminQuests.successCreate'));
            }

            resetForm();
            await fetchQuests();
        } catch (error) {
            toast.error(t('adminQuests.errorSave'));
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(t('adminQuests.confirmDelete'))) return;

        try {
            await api.delete(`/api/v1/admin/quests/${id}`);
            toast.success(t('adminQuests.successDelete'));
            await fetchQuests();
        } catch (error) {
            toast.error(t('adminQuests.errorDelete'));
            console.error(error);
        }
    };

    const handleEdit = (quest: Quest) => {
        setEditingId(quest.id);
        setFormData({
            recipeId: quest.recipeId,
            activeDate: quest.activeDate,
            xpMultiplier: quest.xpMultiplier,
            cuisineName: quest.cuisineName
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData(INITIAL_FORM_STATE);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">

            <div className="flex items-center gap-4 bg-[#1a1a2e] rounded-2xl border border-white/5 p-4">
                <Link to="/challenges" className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                        <Target className="text-red-400" />
                        {t('adminQuests.title')}
                    </h1>
                    <p className="text-xs text-gray-400">{t('adminQuests.subtitle')}</p>
                </div>
            </div>

            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white">
                        {editingId ? t('adminQuests.editTitle') : t('adminQuests.createTitle')}
                    </h2>
                    {editingId && (
                        <button onClick={resetForm} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                            <X size={16} /> {t('adminQuests.cancel')}
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">{t('adminQuests.recipeId')}</label>
                        <input
                            required
                            name="recipeId"
                            value={formData.recipeId}
                            onChange={handleChange}
                            placeholder={t('adminQuests.recipeIdPlaceholder')}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">{t('adminQuests.cuisineName')}</label>
                        <input
                            required
                            name="cuisineName"
                            value={formData.cuisineName}
                            onChange={handleChange}
                            placeholder={t('adminQuests.cuisinePlaceholder')}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">{t('adminQuests.activeDate')}</label>
                        <input
                            required
                            type="date"
                            name="activeDate"
                            value={formData.activeDate}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/50"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">{t('adminQuests.xpMultiplier')}</label>
                        <input
                            required
                            type="number"
                            step="0.1"
                            min="0.1"
                            name="xpMultiplier"
                            value={formData.xpMultiplier}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/50"
                        />
                    </div>

                    <div className="md:col-span-2 pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting
                                ? t('adminQuests.saving')
                                : editingId
                                    ? <><Save size={18} /> {t('adminQuests.saveBtn')}</>
                                    : <><Plus size={18} /> {t('adminQuests.createBtn')}</>}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6">
                <h2 className="text-lg font-bold text-white mb-4">{t('adminQuests.listTitle')}</h2>

                {loading ? (
                    <div className="text-center py-8 text-gray-500">{t('adminQuests.loading')}</div>
                ) : quests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                        {t('adminQuests.emptyList')}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {quests.map(quest => (
                            <div key={quest.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                            ID: {quest.id}
                                        </span>
                                        <h3 className="font-bold text-white">{quest.cuisineName}</h3>
                                    </div>
                                    <div className="text-xs text-gray-400 space-y-1">
                                        <p>🗓 {t('adminQuests.date')}: <span className="text-gray-300">{quest.activeDate}</span></p>
                                        <p>⚡️ {t('adminQuests.xpMultiplier')}: <span className="text-yellow-400 font-bold">x{quest.xpMultiplier}</span></p>
                                        <p className="truncate">🍲 {t('adminQuests.recipe')}: {quest.recipeId}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(quest)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Edit2 size={14} /> {t('adminQuests.editBtn')}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(quest.id)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}