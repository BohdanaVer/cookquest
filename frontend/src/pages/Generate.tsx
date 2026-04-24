import { useState } from 'react';
import { Camera, Plus, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Generate() {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  
  // ЗА ТИЧКА: Це прийде з БД (список продуктів у холодильнику)
  const fridgeItems = ['Яйця', 'Томати', 'Сир', 'Куряче філе', 'Цибуля'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-2xl font-black italic text-white">МАГІЯ РЕЦЕПТІВ</h1>
        <p className="text-gray-500 text-sm">Вибери інгредієнти або зроби фото</p>
      </div>

      {/* Кнопка Камери (Затичка) */}
      <div className="bg-gradient-to-br from-orange-500 to-red-600 p-[1px] rounded-3xl overflow-hidden shadow-lg shadow-orange-500/20">
        <button 
          onClick={() => alert("Камера відкриється, коли підключимо API для розпізнавання фото")}
          className="w-full bg-[#1a1a2e] py-8 flex flex-col items-center gap-3 rounded-[23px] hover:bg-[#222240] transition-colors"
        >
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center">
            <Camera className="text-orange-400" size={32} />
          </div>
          <span className="font-bold text-lg">ЗРОБИТИ ФОТО</span>
        </button>
      </div>

      {/* Холодильник (Затичка) */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Мій холодильник</h3>
        <div className="flex flex-wrap gap-2">
          {fridgeItems.map(item => (
            <button
              key={item}
              onClick={() => setSelectedIngredients(prev => 
                prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
              )}
              className={cn(
                "px-4 py-2 rounded-xl border text-sm font-bold transition-all",
                selectedIngredients.includes(item) 
                  ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/30 scale-105" 
                  : "bg-white/5 border-white/10 text-gray-400"
              )}
            >
              {item}
            </button>
          ))}
          <button className="p-2 rounded-xl bg-white/5 border border-dashed border-white/20 text-gray-500">
            <Plus size={18} />
          </button>
        </div>
      </section>

      {/* Кнопка Генерації */}
      <button 
        disabled={selectedIngredients.length === 0}
        className="w-full bg-orange-500 disabled:opacity-30 disabled:grayscale py-4 rounded-2xl font-black text-white shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <Sparkles size={20} /> ГЕНЕРУВАТИ РЕЦЕПТ
      </button>

      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[11px] text-blue-400 italic">
        * Це затичка інтерфейсу. Логіка вибору продуктів з холодильника та калорійність будуть додані після налаштування БД.
      </div>
    </div>
  );
}