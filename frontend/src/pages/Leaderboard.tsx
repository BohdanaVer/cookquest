export default function Leaderboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-2xl font-black italic text-white">РЕЙТИНГ</h1>
        <p className="text-gray-500 text-sm">Змагайся з іншими кухарями</p>
      </div>
      
      <div className="bg-[#1a1a2e] border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center gap-4">
        <span className="text-5xl">🏆</span>
        <h2 className="text-xl font-bold text-white">Таблиця лідерів</h2>
        <p className="text-sm text-gray-400">
          (Затичка: Пізніше тут буде топ гравців за кількістю XP)
        </p>
      </div>
    </div>
  );
}