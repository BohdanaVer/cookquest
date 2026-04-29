import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axiosClient';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Target, Wand2, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Day {
    id: number;
    date: string;
    dayOfWeek: string;
}

interface Week {
    id: number;
    theme: string;
    startDate: string;
    endDate: string;
    days: Day[];
}

interface Quest {
    id: number;
    recipeId: string;
    dayId: number;
    xpMultiplier: number;
    cuisineName?: string;
}

interface QuestFormState {
    recipeId: string;
    dayId: number | '';
    xpMultiplier: number;
}

export default function AdminQuestsPanel() {
    const { t } = useTranslation();

    const [quests, setQuests] = useState<Quest[]>([]);
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<QuestFormState>({ recipeId: '', dayId: '', xpMultiplier: 1.0 });
    const [editingId, setEditingId] = useState<number | null>(null);

    const [aiPrompt, setAiPrompt] = useState('');
    const [recipeJson, setRecipeJson] = useState('');
    const [generating, setGenerating] = useState(false);
    const [updatingRecipe, setUpdatingRecipe] = useState(false);

    const [weekTheme, setWeekTheme] = useState('');
    const [weekStartDate, setWeekStartDate] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [questsRes, weeksRes] = await Promise.all([
                api.get('/api/v1/admin/quests'),
                api.get('/api/v1/admin/quests/weeks')
            ]);
            setQuests(questsRes.data);
            setWeeks(weeksRes.data);
        } catch (error) {
            toast.error(t('adminQuests.errorFetch', 'Помилка завантаження даних'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateWeek = async (e: React.FormEvent) => {
        e.preventDefault();

        const dateObj = new Date(weekStartDate);
        if (dateObj.getDay() !== 1) {
            toast.error("Помилка! Дата початку має бути виключно Понеділком.");
            return;
        }

        try {
            await api.post('/api/v1/admin/quests', { theme: weekTheme, startDate: weekStartDate });
            toast.success("Новий тиждень успішно створено!");
            setWeekTheme('');
            setWeekStartDate('');
            fetchData();
        } catch (error) {
            toast.error("Помилка створення тижня");
        }
    };

    const handleGenerateRecipe = async () => {
        if (!aiPrompt.trim()) {
            toast.warning("Введіть запит для генерації");
            return;
        }

        setGenerating(true);
        try {
            const payload = {
                ingredients: [],
                textQuery: aiPrompt,
                challengeCuisine: "Глобальний квест",
                count: 1,
                requestLanguage: "uk"
            };

            const response = await api.post('/api/v1/admin/recipes/generate', payload);
            const generatedRecipe = response.data.recipes[0];

            if (generatedRecipe) {
                setFormData(prev => ({ ...prev, recipeId: generatedRecipe.id }));
                setRecipeJson(JSON.stringify(generatedRecipe, null, 2));
                toast.success("Рецепт згенеровано та збережено в базу!");
            }
        } catch (error) {
            toast.error("Помилка генерації");
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    const handleUpdateRecipeJson = async () => {
        if (!formData.recipeId || !recipeJson) return;
        setUpdatingRecipe(true);
        try {
            await api.put(`/api/v1/admin/recipes/${formData.recipeId}`, JSON.parse(recipeJson));
            toast.success("Відредагований текст рецепту збережено!");
        } catch (error) {
            toast.error("Помилка оновлення JSON. Перевірте синтаксис.");
        } finally {
            setUpdatingRecipe(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'xpMultiplier' || name === 'dayId' ? Number(value) : value
        }));
    };

    const handleSubmitQuest = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await api.put(`/api/v1/admin/quests/${editingId}`, formData);
                toast.success(t('adminQuests.successUpdate', 'Квест оновлено'));
            } else {
                await api.post('/api/v1/admin/quests', formData);
                toast.success(t('adminQuests.successCreate', 'Квест створено'));
            }
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(t('adminQuests.errorSave', 'Помилка збереження квесту'));
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ recipeId: '', dayId: '', xpMultiplier: 1.0 });
        setRecipeJson('');
        setAiPrompt('');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">

            {/* ШАПКА */}
            <div className="flex items-center gap-4 bg-[#1a1a2e] rounded-2xl border border-white/5 p-4">
                <Link to="/challenges" className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                        <Target className="text-red-400" />
                        {t('adminQuests.title', 'Панель адміністратора')}
                    </h1>
                    <p className="text-xs text-gray-400">{t('adminQuests.subtitle', 'Керування тижнями та квестами')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Calendar size={18} className="text-blue-400" /> Створити Тиждень
                        </h2>
                        <form onSubmit={handleCreateWeek} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Дата початку (Понеділок)</label>
                                <input
                                    required
                                    type="date"
                                    value={weekStartDate}
                                    onChange={(e) => setWeekStartDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Тематика (Кухня)</label>
                                <input
                                    required
                                    value={weekTheme}
                                    onChange={(e) => setWeekTheme(e.target.value)}
                                    placeholder="Напр. Італійський тиждень"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Plus size={16} /> Додати тиждень
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">

                    <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">
                                {editingId ? 'Редагування квесту' : 'Створити новий квест'}
                            </h2>
                            {editingId && (
                                <button onClick={resetForm} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                                    <X size={16} /> Скасувати
                                </button>
                            )}
                        </div>

                        <div className="mb-6 bg-purple-500/5 border border-purple-500/20 p-4 rounded-xl space-y-3">
                            <label className="block text-xs font-bold text-purple-400 uppercase">1. Згенерувати або вставити рецепт</label>

                            <div className="flex gap-2">
                                <input
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Напр. Згенеруй класичний рецепт лазаньї..."
                                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500/50"
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateRecipe}
                                    disabled={generating}
                                    className="bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                                >
                                    <Wand2 size={16} /> {generating ? 'Генерація...' : 'ШІ'}
                                </button>
                            </div>

                            <textarea
                                value={recipeJson}
                                onChange={(e) => setRecipeJson(e.target.value)}
                                rows={6}
                                placeholder="Тут з'явиться JSON згенерованого рецепту. Ви можете редагувати його вручну..."
                                className="w-full px-4 py-2 bg-[#0f0f1a] border border-white/10 rounded-xl text-xs text-green-400 font-mono focus:outline-none focus:border-purple-500/50 resize-y"
                            />

                            {recipeJson && (
                                <button
                                    type="button"
                                    onClick={handleUpdateRecipeJson}
                                    disabled={updatingRecipe}
                                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2 rounded-xl text-sm transition-colors"
                                >
                                    {updatingRecipe ? 'Збереження...' : '💾 Зберегти зміни в тексті рецепту'}
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmitQuest} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">ID Рецепту</label>
                                <input
                                    required
                                    name="recipeId"
                                    value={formData.recipeId}
                                    onChange={handleChange}
                                    placeholder="Згенерується автоматично або введіть вручну"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Множник XP</label>
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

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">2. Прив'язка до Дня (Тижня)</label>
                                <select
                                    required
                                    name="dayId"
                                    value={formData.dayId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/50"
                                >
                                    <option value="" disabled>Оберіть день...</option>
                                    {weeks.map(week => (
                                        <optgroup key={week.id} label={`${week.theme} (${week.startDate})`}>
                                            {week.days.map(day => (
                                                <option key={day.id} value={day.id}>
                                                    {day.dayOfWeek} - {day.date}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting ? 'Збереження...' : editingId ? <><Save size={18} /> Зберегти зміни Квесту</> : <><Plus size={18} /> Створити Квест</>}
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}