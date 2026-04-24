import { Users, Search } from 'lucide-react'

export default function Friends() {
    return (
        <div className="space-y-5 animate-in fade-in duration-500">

            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <Users size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold text-white">Друзі</h1>
                        <p className="text-xs text-gray-400">0 друзів</p>
                    </div>
                </div>
            </div>

            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-4">
                <h2 className="font-bold text-white text-sm mb-3">Знайти користувача</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Ім'я користувача..."
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    />
                    <button
                        type="button"
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl transition-colors"
                    >
                        <Search size={16} />
                    </button>
                </div>

                {/* PLACE FOR SEARCHING RESULTS */}
            </div>

            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-4">
                <h2 className="font-bold text-white text-sm mb-3">Мої друзі (0)</h2>

                {/* FRIENDS ABSENCE MOCK */}
                <div className="py-8 text-center">
                    <p className="text-gray-500 text-sm">У тебе поки немає друзів.</p>
                    <p className="text-gray-600 text-xs mt-1">Скористайся пошуком вище, щоб знайти їх!</p>
                </div>
            </div>

        </div>
    )
}