export default function Shop() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-2xl font-black italic text-white">МАГАЗИН</h1>
        <p className="text-gray-500 text-sm">Витрачай зароблені монети</p>
      </div>
      
      <div className="bg-[#1a1a2e] border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center gap-4">
        <span className="text-5xl">🏪</span>
        <h2 className="text-xl font-bold text-white">Тут будуть маскоти</h2>
        <p className="text-sm text-gray-400">
          (Затичка: Пізніше ми підключимо сюди список маскотів з бази даних)
        </p>
      </div>
    </div>
  );
}