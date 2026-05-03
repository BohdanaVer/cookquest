import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axiosClient';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Target, Wand2, Calendar, Clock, Star, ChefHat, Flame, List, ListOrdered, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Day { id: number; date: string; dayOfWeek: string; }
interface Week { id: number; theme: string; startDate: string; endDate: string; days: Day[]; }
interface Quest { id: number; recipeId: string; dayId: number; xpMultiplier: number; cuisineName?: string; }

// НОВЕ: Додали cuisineName сюди
interface QuestFormState { recipeId: string; dayId: number | ''; xpMultiplier: number; cuisineName: string; }

interface GeneratedRecipe {
    id: string; name: string; description: string; difficulty: string; points: number; cookingTimeMinutes: number;
    cuisine: string; dietaryTags: string[];
    ingredients: Array<{ name: string; amount: string; unit: string }>;
    steps: Array<{ text: string; isCheckpoint: boolean; checkpointLabel: string | null }>;
    stepCount: number; [key: string]: unknown;
}

export default function AdminQuestsPanel() {
    const { t } = useTranslation();

    const [quests, setQuests] = useState<Quest[]>([]);
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // НОВЕ: Додали cuisineName у початковий стан форми
    const [formData, setFormData] = useState<QuestFormState>({ recipeId: '', dayId: '', xpMultiplier: 1.0, cuisineName: '' });
    const [editingId, setEditingId] = useState<number | null>(null);

    const [aiPrompt, setAiPrompt] = useState('');
    const [parsedRecipe, setParsedRecipe] = useState<GeneratedRecipe | null>(null);
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
        let isMounted = true;
        if (isMounted) fetchData();
        return () => { isMounted = false; };
    }, [fetchData]);

    const handleCreateWeek = async (e: React.FormEvent) => {
        e.preventDefault();
        const dateObj = new Date(weekStartDate);
        if (dateObj.getDay() !== 1) {
            toast.error("Помилка! Дата початку має бути виключно Понеділком.");
            return;
        }

        try {
            await api.post('/api/v1/admin/quests/weeks', { theme: weekTheme, startDate: weekStartDate });
            toast.success("Новий тиждень успішно створено!");
            setWeekTheme('');
            setWeekStartDate('');
            fetchData();
        } catch (error) {
            toast.error("Помилка створення тижня");
            console.error(error);
        }
    };

    const handleGenerateRecipe = async () => {
        if (!aiPrompt.trim()) {
            toast.warning("Введіть запит для генерації");
            return;
        }

        setGenerating(true);
        try {
            const payload = { ingredients: [], textQuery: aiPrompt, challengeCuisine: "Глобальний квест", count: 1, requestLanguage: "uk" };
            const response = await api.post('/api/v1/admin/recipes/generate', payload);
            const generatedRecipe = response.data.recipes[0];

            if (generatedRecipe) {
                // НОВЕ: Автоматично підтягуємо кухню у форму квесту!
                setFormData(prev => ({
                    ...prev,
                    recipeId: generatedRecipe.id,
                    cuisineName: generatedRecipe.cuisine || 'Тематична кухня'
                }));

                if (!generatedRecipe.ingredients) generatedRecipe.ingredients = [];
                if (!generatedRecipe.steps) generatedRecipe.steps = [];
                if (!generatedRecipe.dietaryTags) generatedRecipe.dietaryTags = [];

                setParsedRecipe(generatedRecipe);
                toast.success("Рецепт згенеровано!");
            }
        } catch (error) {
            toast.error("Помилка генерації рецепту");
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    const handleRecipeFieldChange = (field: keyof GeneratedRecipe, value: string | number) => {
        if (parsedRecipe) setParsedRecipe({ ...parsedRecipe, [field]: value });
    };

    const handleIngredientChange = (index: number, field: string, value: string) => {
        if (!parsedRecipe) return;
        const newIngredients = [...parsedRecipe.ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setParsedRecipe({ ...parsedRecipe, ingredients: newIngredients });
    };

    const handleStepChange = (index: number, field: string, value: string | boolean) => {
        if (!parsedRecipe) return;
        const newSteps = [...parsedRecipe.steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        if (field === 'isCheckpoint' && !value) newSteps[index].checkpointLabel = null;
        setParsedRecipe({ ...parsedRecipe, steps: newSteps });
    };

    const handleTagChange = (index: number, value: string) => {
        if (!parsedRecipe) return;
        const newTags = [...parsedRecipe.dietaryTags];
        newTags[index] = value;
        setParsedRecipe({ ...parsedRecipe, dietaryTags: newTags });
    };

    const handleUpdateRecipe = async () => {
        if (!parsedRecipe) return;
        setUpdatingRecipe(true);
        try {
            const recipeToSave = { ...parsedRecipe, stepCount: parsedRecipe.steps.length };
            await api.put(`/api/v1/admin/recipes/${parsedRecipe.id}`, recipeToSave);
            toast.success("Зміни в рецепті збережено!");
        } catch (error) {
            toast.error("Помилка оновлення рецепту.");
            console.error(error);
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
                toast.success('Квест оновлено');
            } else {
                await api.post('/api/v1/admin/quests', formData);
                toast.success('Квест створено');
            }
            setEditingId(null);
            setFormData({ recipeId: '', dayId: '', xpMultiplier: 1.0, cuisineName: '' });
            setParsedRecipe(null);
            setAiPrompt('');
            fetchData();
        } catch (error) {
            toast.error('Помилка збереження квесту');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
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
                        <Target className="text-red-400" /> {t('adminQuests.title', 'Панель адміністратора')}
                    </h1>
                    <p className="text-xs text-gray-400">Керування тижнями та квестами</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ЛІВА КОЛОНКА */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Calendar size={18} className="text-blue-400" /> Створити Тиждень
                        </h2>
                        <form onSubmit={handleCreateWeek} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Дата початку (ПН)</label>
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
                                    placeholder="Напр. Мексиканська"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Plus size={16} /> Додати тиждень
                            </button>
                        </form>
                    </div>
                </div>

                {/* ПРАВА КОЛОНКА */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">Створити новий квест</h2>
                        </div>

                        {/* БЛОК ГЕНЕРАЦІЇ ШІ */}
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

                            {/* ГАРНИЙ БЛОК РЕДАГУВАННЯ РЕЦЕПТУ */}
                            {parsedRecipe ? (
                                <div className="mt-4 p-4 bg-[#0f0f1a] border border-white/10 rounded-xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                        <h3 className="text-sm font-bold text-green-400 flex items-center gap-2">
                                            <ChefHat size={16} /> Попередній перегляд та редагування
                                        </h3>
                                        <span className="text-[10px] text-gray-500">ID: {parsedRecipe.id.substring(0, 8)}...</span>
                                    </div>

                                    {/* ОСНОВНА ІНФО */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Назва рецепту</label>
                                            <input
                                                value={parsedRecipe.name || ''}
                                                onChange={(e) => handleRecipeFieldChange('name', e.target.value)}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Короткий опис</label>
                                            <textarea
                                                value={parsedRecipe.description || ''}
                                                onChange={(e) => handleRecipeFieldChange('description', e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 resize-y"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Clock size={12}/> Час (хв)</label>
                                                <input
                                                    type="number"
                                                    value={parsedRecipe.cookingTimeMinutes || 0}
                                                    onChange={(e) => handleRecipeFieldChange('cookingTimeMinutes', Number(e.target.value))}
                                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Star size={12}/> Бали (XP)</label>
                                                <input
                                                    type="number"
                                                    value={parsedRecipe.points || 0}
                                                    onChange={(e) => handleRecipeFieldChange('points', Number(e.target.value))}
                                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Flame size={12}/> Складність</label>
                                                <select
                                                    value={parsedRecipe.difficulty || 'EASY'}
                                                    onChange={(e) => handleRecipeFieldChange('difficulty', e.target.value)}
                                                    className="w-full px-3 py-2 bg-[#1a1a2e] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                                                >
                                                    <option value="easy">EASY</option>
                                                    <option value="medium">MEDIUM</option>
                                                    <option value="hard">HARD</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Кухня</label>
                                                <input
                                                    value={parsedRecipe.cuisine || ''}
                                                    onChange={(e) => handleRecipeFieldChange('cuisine', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* БЛОК ДІЄТИЧНИХ ТЕГІВ */}
                                    <div className="mt-4 border-t border-white/10 pt-4">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                            <Tag size={12}/> Дієтичні теги
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {parsedRecipe.dietaryTags.map((tag, idx) => (
                                                <div key={idx} className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
                                                    <input
                                                        value={tag}
                                                        onChange={(e) => handleTagChange(idx, e.target.value)}
                                                        placeholder="Напр. Веган"
                                                        className="bg-transparent text-xs text-white focus:outline-none w-24"
                                                    />
                                                    <button type="button" onClick={() => {
                                                        const newTags = [...parsedRecipe.dietaryTags];
                                                        newTags.splice(idx, 1);
                                                        setParsedRecipe({...parsedRecipe, dietaryTags: newTags});
                                                    }} className="text-gray-500 hover:text-red-400">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setParsedRecipe({...parsedRecipe, dietaryTags: [...parsedRecipe.dietaryTags, '']})}
                                                className="text-xs text-purple-400 hover:text-purple-300 font-bold px-2 py-1 bg-purple-500/10 rounded-lg"
                                            >
                                                + Додати тег
                                            </button>
                                        </div>
                                    </div>

                                    {/* БЛОК ІНГРЕДІЄНТІВ */}
                                    <div className="mt-4 border-t border-white/10 pt-4">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                            <List size={12}/> Інгредієнти
                                        </label>
                                        <div className="space-y-2">
                                            {parsedRecipe.ingredients.map((ing, idx) => (
                                                <div key={idx} className="flex gap-2 items-start">
                                                    <input
                                                        value={ing.name || ''}
                                                        onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                                                        placeholder="Назва"
                                                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50"
                                                    />
                                                    <input
                                                        value={ing.amount || ''}
                                                        onChange={(e) => handleIngredientChange(idx, 'amount', e.target.value)}
                                                        placeholder="К-сть"
                                                        className="w-20 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50"
                                                    />
                                                    <input
                                                        value={ing.unit || ''}
                                                        onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                                                        placeholder="Од."
                                                        className="w-20 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50"
                                                    />
                                                    <button type="button" onClick={() => {
                                                        const newArr = [...parsedRecipe.ingredients];
                                                        newArr.splice(idx, 1);
                                                        setParsedRecipe({...parsedRecipe, ingredients: newArr});
                                                    }} className="p-1.5 text-gray-500 hover:text-red-400 bg-white/5 rounded-lg">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => setParsedRecipe({...parsedRecipe, ingredients: [...parsedRecipe.ingredients, {name: '', amount: '', unit: ''}]})} className="text-xs text-purple-400 hover:text-purple-300 font-bold">+ Додати інгредієнт</button>
                                        </div>
                                    </div>

                                    {/* НОВИЙ БЛОК КРОКІВ (ОБ'ЄКТИ) */}
                                    <div className="mt-4 border-t border-white/10 pt-4">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                            <ListOrdered size={12}/> Кроки приготування
                                        </label>
                                        <div className="space-y-3">
                                            {parsedRecipe.steps.map((step, idx) => (
                                                <div key={idx} className="flex flex-col gap-2 p-3 bg-white/5 border border-white/5 rounded-xl">
                                                    <div className="flex gap-2 items-start">
                                                        <span className="text-xs text-gray-500 font-bold mt-2">{idx + 1}.</span>
                                                        <textarea
                                                            value={step.text || ''}
                                                            onChange={(e) => handleStepChange(idx, 'text', e.target.value)}
                                                            rows={2}
                                                            placeholder="Опис кроку..."
                                                            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 resize-y"
                                                        />
                                                        <button type="button" onClick={() => {
                                                            const newArr = [...parsedRecipe.steps];
                                                            newArr.splice(idx, 1);
                                                            setParsedRecipe({...parsedRecipe, steps: newArr});
                                                        }} className="p-1.5 mt-0.5 text-gray-500 hover:text-red-400 bg-white/5 rounded-lg">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    {/* НАЛАШТУВАННЯ ЧЕКПОІНТУ */}
                                                    <div className="flex items-center gap-3 pl-6">
                                                        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={step.isCheckpoint || false}
                                                                onChange={(e) => handleStepChange(idx, 'isCheckpoint', e.target.checked)}
                                                                className="accent-purple-500 w-3 h-3 cursor-pointer"
                                                            />
                                                            Це чекпоінт?
                                                        </label>

                                                        {step.isCheckpoint && (
                                                            <input
                                                                value={step.checkpointLabel || ''}
                                                                onChange={(e) => handleStepChange(idx, 'checkpointLabel', e.target.value)}
                                                                placeholder="Назва етапу (напр. 'Змішування')"
                                                                className="flex-1 px-3 py-1 bg-[#1a1a2e] border border-white/10 rounded-md text-[10px] text-white focus:outline-none focus:border-purple-500/50"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => setParsedRecipe({...parsedRecipe, steps: [...parsedRecipe.steps, { text: '', isCheckpoint: false, checkpointLabel: null }]})} className="text-xs text-purple-400 hover:text-purple-300 font-bold">+ Додати крок</button>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleUpdateRecipe}
                                        disabled={updatingRecipe}
                                        className="w-full bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/50 text-purple-200 font-bold py-2.5 rounded-xl text-sm transition-colors mt-4"
                                    >
                                        {updatingRecipe ? 'Збереження...' : '💾 Зберегти зміни в тексті рецепту'}
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 bg-[#0f0f1a] border border-white/10 rounded-xl text-xs text-gray-500 font-mono text-center">
                                    Тут з'явиться картка згенерованого рецепту...
                                </div>
                            )}
                        </div>

                        {/* ФОРМА КВЕСТУ */}
                        <form onSubmit={handleSubmitQuest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">ID Рецепту</label>
                                <input
                                    required
                                    name="recipeId"
                                    value={formData.recipeId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                            {/* НОВЕ ПОЛЕ: Тематика (Кухня) для Квесту */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Тематика (Кухня)</label>
                                <input
                                    required
                                    name="cuisineName"
                                    value={formData.cuisineName}
                                    onChange={handleChange}
                                    placeholder="Напр. Італійська"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Множник XP</label>
                                <input
                                    required
                                    type="number"
                                    step="0.1"
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
                                                <option key={day.id} value={day.id}>{day.dayOfWeek} - {day.date}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2 pt-2">
                                <button type="submit" disabled={submitting} className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                                    {submitting ? 'Збереження...' : editingId ? <><Save size={18} /> Зберегти зміни Квесту</> : <><Plus size={18} /> Створити Квест</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* СПИСОК КВЕСТІВ */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6 mt-6">
                <h2 className="text-lg font-bold text-white mb-4">Список активних квестів</h2>
                {loading ? <div className="text-center py-8 text-gray-500">Завантаження...</div> : quests.length === 0 ? <div className="text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">Ще немає жодного квесту.</div> : (
                    <div className="space-y-3">
                        {quests.map(quest => (
                            <div key={quest.id} className="flex justify-between bg-white/5 p-4 rounded-xl border border-white/5 gap-4">
                                <div>
                                    <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">ID: {quest.id}</span>
                                    <h3 className="font-bold text-white mt-1">{quest.cuisineName || 'Тематичний квест'}</h3>
                                    <p className="text-xs text-gray-400 mt-1">Множник XP: x{quest.xpMultiplier} | Рецепт: {quest.recipeId.substring(0,8)}...</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => {
                                        setEditingId(quest.id);
                                        setFormData({ recipeId: quest.recipeId, dayId: quest.dayId, xpMultiplier: quest.xpMultiplier, cuisineName: quest.cuisineName || '' });
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }} className="px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-bold transition-colors">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => { api.delete(`/api/v1/admin/quests/${quest.id}`).then(() => fetchData()) }} className="px-3 py-2 bg-white/5 text-gray-400 hover:text-red-400 rounded-lg">
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