import { Trophy } from 'lucide-react'

export default function Leaderboard() {
    return (
        <div className="space-y-5 animate-in fade-in duration-500">

            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                        <Trophy size={20} className="text-yellow-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold text-white">Leaderboard</h1>
                        <p className="text-xs text-gray-400">
                            Твоє місце: <span className="text-yellow-400 font-bold">—</span>
                        </p>
                    </div>
                </div>
            </div>


            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 overflow-hidden">
                <p className="text-center text-gray-600 py-12 text-sm">
                    Поки немає учасників
                </p>

            </div>

        </div>
    )
}