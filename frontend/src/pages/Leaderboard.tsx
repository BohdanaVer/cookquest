'use client'

import { useState, useEffect } from 'react'
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/axiosClient'
import { cn } from '../lib/utils'

const MASCOTS = [
    "broccoli", "slime", "cheese", "pepper",
    "icecream", "stove", "cauldron", "knightpan"
];

interface LeaderboardEntry {
    rank: number;
    username: string;
    xp: number;
    levelNumber: number;
    levelName: string;
    activeMascotId: number;
}

const getMascotName = (id: number) => {
    if (id >= 0 && id < MASCOTS.length) return MASCOTS[id];
    return "broccoli";
}

const ListItem = ({
                      user,
                      isPinned = false,
                      isMe,
                      youText
                  }: {
    user: LeaderboardEntry,
    isPinned?: boolean,
    isMe: boolean,
    youText: string
}) => {
    const mascotName = getMascotName(user.activeMascotId);

    return (
        <div className={cn(
            "flex items-center gap-4 p-3 rounded-2xl transition-all",
            isPinned ? "bg-white/10 border border-orange-500/30" :
                isMe ? "bg-white/5 border border-white/10" : "bg-transparent"
        )}>
            <div className="w-6 text-center shrink-0">
                <span className="text-gray-500 font-bold text-sm">#{user.rank}</span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-[#2a2a40] flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                <img
                    src={`/mascots/${mascotName}_happy.png`}
                    alt={mascotName}
                    className="w-8 h-8 object-contain"
                    onError={(e) => { e.currentTarget.src = '/mascots/broccoli_happy.png' }}
                />
            </div>

            <div className="flex-1 min-w-0">
                <h3 className={cn("font-bold text-sm truncate", isMe ? "text-orange-400" : "text-white")}>
                    {user.username} {isMe && <span className="text-orange-400/80 text-xs">{youText}</span>}
                </h3>
                <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                    Level {user.levelNumber}
                </p>
            </div>

            <div className="text-right shrink-0">
                <span className="text-orange-500 font-extrabold text-base">
                    {user.xp}
                </span>
            </div>
        </div>
    )
};

export default function Leaderboard() {
    const { t } = useTranslation()

    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [myUsername, setMyUsername] = useState<string | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [leaderboardRes, profileRes] = await Promise.all([
                    api.get('/api/v1/profiles/leaderboard'),
                    api.get('/api/v1/profiles/me').catch(() => ({ data: null }))
                ]);

                setLeaders(leaderboardRes.data || []);

                if (profileRes.data && profileRes.data.username) {
                    setMyUsername(profileRes.data.username);
                }
            } catch (error) {
                console.error("Помилка завантаження рейтингу:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const myEntry = myUsername ? leaders.find(u => u.username === myUsername) : null;
    const totalUsers = leaders.length;

    const top3 = leaders.slice(0, 3);
    const firstPlace = top3[0];
    const secondPlace = top3[1];
    const thirdPlace = top3[2];

    const listLimit = isExpanded ? 50 : 10;
    const restOfList = leaders.slice(3, listLimit);

    const isMeInVisibleList = myEntry && myEntry.rank <= listLimit;

    const youText = t('leaderboard.you', '(Ти)');

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">

            <div className="bg-gradient-to-r from-[#593f1d] to-[#3a2512] rounded-[30px] p-6 shadow-lg border border-orange-500/20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border-2 border-yellow-500/50 rounded-2xl flex items-center justify-center shrink-0">
                        <Trophy size={24} className="text-yellow-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-white leading-tight">
                            {t('leaderboard.title', 'Leaderboard')}
                        </h1>
                        <p className="text-sm text-gray-300 mt-1 font-medium">
                            {t('leaderboard.yourRank', 'Your place:')} <span className="text-yellow-400 font-extrabold ml-1">
                                {myEntry ? `#${myEntry.rank}` : '—'}
                            </span>
                            <span className="text-gray-400 ml-1">
                                {t('leaderboard.outOf', 'out of {{total}}', { total: totalUsers })}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <div className="animate-pulse flex items-center gap-2 text-gray-500 font-bold">
                        {t('common.loading', 'Завантаження...')}
                    </div>
                </div>
            ) : totalUsers === 0 ? (
                <div className="bg-[#1a1a2e] rounded-3xl border border-white/5 py-16 text-center">
                    <p className="text-gray-500 text-sm font-medium">
                        {t('leaderboard.noParticipants', 'Поки немає учасників')}
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex justify-center items-end gap-2 sm:gap-6 mt-10 mb-8 px-2">
                        {secondPlace && (
                            <div className="flex flex-col items-center pb-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                <div className="w-16 h-16 rounded-3xl bg-[#2a2a40] border-2 border-gray-400 flex items-center justify-center mb-3 shadow-lg shadow-gray-400/20">
                                    <img src={`/mascots/${getMascotName(secondPlace.activeMascotId)}_happy.png`} alt="" className="w-10 h-10 object-contain" />
                                </div>
                                <span className="text-white font-bold text-xs mb-1 truncate max-w-[80px]">{secondPlace.username}</span>
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                                    <span className="text-sm">🥈</span>
                                    <span className="text-gray-300 font-bold text-xs">{secondPlace.xp}</span>
                                </div>
                            </div>
                        )}

                        {firstPlace && (
                            <div className="flex flex-col items-center z-10 animate-slide-up" style={{ animationDelay: '0s' }}>
                                <div className="w-20 h-20 rounded-3xl bg-[#2a2a40] border-2 border-yellow-400 flex items-center justify-center mb-3 shadow-xl shadow-yellow-500/30 ring-4 ring-yellow-500/10">
                                    <img src={`/mascots/${getMascotName(firstPlace.activeMascotId)}_happy.png`} alt="" className="w-12 h-12 object-contain drop-shadow-md" />
                                </div>
                                <span className="text-yellow-400 font-extrabold text-sm mb-1 truncate max-w-[90px]">{firstPlace.username}</span>
                                <div className="flex items-center gap-1 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20">
                                    <span className="text-base">🥇</span>
                                    <span className="text-yellow-400 font-extrabold text-sm">{firstPlace.xp}</span>
                                </div>
                            </div>
                        )}

                        {thirdPlace && (
                            <div className="flex flex-col items-center pb-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                <div className="w-16 h-16 rounded-3xl bg-[#2a2a40] border-2 border-amber-600 flex items-center justify-center mb-3 shadow-lg shadow-amber-600/20">
                                    <img src={`/mascots/${getMascotName(thirdPlace.activeMascotId)}_happy.png`} alt="" className="w-10 h-10 object-contain" />
                                </div>
                                <span className="text-white font-bold text-xs mb-1 truncate max-w-[80px]">{thirdPlace.username}</span>
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                                    <span className="text-sm">🥉</span>
                                    <span className="text-amber-500 font-bold text-xs">{thirdPlace.xp}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {restOfList.length > 0 && (
                        <div className="bg-[#1a1a2e] rounded-[30px] border border-white/5 p-4 shadow-xl">
                            <div className="space-y-1">
                                {restOfList.map((user) => (
                                    <ListItem
                                        key={user.username}
                                        user={user}
                                        isMe={user.username === myUsername}
                                        youText={youText}
                                    />
                                ))}
                            </div>

                            {totalUsers > 10 && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="w-full mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-1 text-xs font-bold text-gray-500 hover:text-white transition-colors"
                                >
                                    {isExpanded ? (
                                        <><ChevronUp size={16} /> {t('common.collapse', 'Згорнути')}</>
                                    ) : (
                                        <><ChevronDown size={16} /> {t('leaderboard.expandTop50', 'Розгорнути Топ-50')}</>
                                    )}
                                </button>
                            )}

                            {!isMeInVisibleList && myEntry && (
                                <div className="mt-4 pt-4 border-t border-white/10 relative">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1a1a2e] px-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                        {t('leaderboard.youAreHere', 'Ти знаходишся тут')}
                                    </div>
                                    <ListItem
                                        user={myEntry}
                                        isPinned={true}
                                        isMe={true}
                                        youText={youText}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}