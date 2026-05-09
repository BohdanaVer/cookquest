import { useState, useEffect } from 'react'
import { Users, Search, UserPlus, RefreshCw, Loader2, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/axiosClient'

// Інтерфейс для пошуку та рекомендацій
interface UserSearchDto {
    userId: number;
    username: string;
    levelNumber?: number;
    mascotImageUrl?: string;
}

// Інтерфейс для списку існуючих друзів
interface FriendDto {
    friendshipId: number;
    username: string;
    friendSince: string;
    levelNumber?: number;
    mascotImageUrl?: string;
}

// Інтерфейс для вхідних запитів
interface FriendRequestDto {
    friendshipId: number;
    requesterUsername: string;
    senderMascotUrl?: string;
    createdAt: string;
}

// Інтерфейс для обробки помилок
interface ApiError {
    response?: {
        data?: {
            message?: string;
        }
    }
}

export default function Friends() {
    const { t } = useTranslation();

    const [friends, setFriends] = useState<FriendDto[]>([]);
    const [suggestions, setSuggestions] = useState<UserSearchDto[]>([]);
    const [searchResults, setSearchResults] = useState<UserSearchDto[]>([]);
    const [requests, setRequests] = useState<FriendRequestDto[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    
    // Зберігаємо юзернейми, яким ми щойно відправили запит
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

    const fetchFriendsAndSuggestions = async () => {
        try {
            const [friendsRes, suggRes, reqRes] = await Promise.all([
                api.get('/api/v1/friends'),
                api.get('/api/v1/friends/suggestions'),
                api.get('/api/v1/friends/requests')
            ]);
            setFriends(friendsRes.data);
            setSuggestions(suggRes.data);
            setRequests(reqRes.data);
        } catch (error) {
            console.error("Помилка завантаження даних", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchFriendsAndSuggestions();
        };
        
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setSearchLoading(true);
        try {
            const res = await api.get(`/api/v1/friends/search?query=${searchQuery}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error("Помилка пошуку", error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleRefreshSuggestions = async () => {
        setSuggestionsLoading(true);
        try {
            const res = await api.get('/api/v1/friends/suggestions');
            setSuggestions(res.data);
        } catch (error) {
            console.error("Помилка оновлення рекомендацій", error);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    const handleAddFriend = async (username: string) => {
        try {
            await api.post('/api/v1/friends/request', { targetUsername: username });
            setSentRequests(prev => new Set(prev).add(username));
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error("Помилка відправки запиту:", err);
        }
    };

    const handleRequestAction = async (friendshipId: number, action: 'accept' | 'decline') => {
        try {
            await api.post(`/api/v1/friends/${friendshipId}/${action}`);
            
            // Видаляємо запит зі списку
            setRequests(prev => prev.filter(req => req.friendshipId !== friendshipId));
            
            // Якщо прийняли запит - одразу оновлюємо список друзів
            if (action === 'accept') {
                const friendsRes = await api.get('/api/v1/friends');
                setFriends(friendsRes.data);
            }
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error("Помилка обробки запиту:", err);
        }
    };

    // Компонент-картка для результатів пошуку та рекомендацій
    const UserCard = ({ user }: { user: UserSearchDto }) => {
        const isSent = sentRequests.has(user.username);
        return (
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1a1a2e] rounded-full flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                        {user.mascotImageUrl ? (
                            <img src={user.mascotImageUrl} alt="avatar" className="w-full h-full object-contain" />
                        ) : (
                            <Users size={16} className="text-gray-500" />
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm line-clamp-1">{user.username}</p>
                        <p className="text-[10px] text-gray-500">LVL {user.levelNumber || 1}</p>
                    </div>
                </div>
                <button
                    onClick={() => handleAddFriend(user.username)}
                    disabled={isSent}
                    className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                        isSent ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                    }`}
                >
                    {isSent ? <Check size={16} /> : <UserPlus size={16} />}
                </button>
            </div>
        );
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-5 animate-in fade-in duration-500 pb-20">

            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <Users size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold text-white">{t('friends.title', 'Друзі')}</h1>
                        <p className="text-xs text-gray-400">
                            {t('friends.friendsCount', 'У вас {{count}} друзів', { count: friends.length })}
                        </p>
                    </div>
                </div>
            </div>

            {/* ПОШУК */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-4">
                <h2 className="font-bold text-white text-sm mb-3">{t('friends.findUser', 'Знайти користувача')}</h2>
                <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('friends.searchPlaceholder', 'Введіть ім\'я...')}
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={searchLoading}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center w-12 shrink-0"
                    >
                        {searchLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    </button>
                </form>

                {searchResults.length > 0 && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                        {searchResults.map(user => <UserCard key={user.userId} user={user} />)}
                    </div>
                )}
                {searchResults.length === 0 && searchQuery && !searchLoading && (
                    <p className="text-xs text-gray-500 text-center">{t('friends.noResults', 'Нікого не знайдено')}</p>
                )}
            </div>

            {/* ВХІДНІ ЗАПИТИ В ДРУЗІ */}
            {requests.length > 0 && (
                <div className="bg-[#1a1a2e] rounded-2xl border border-blue-500/30 p-4 animate-in slide-in-from-top-2">
                    <h2 className="font-bold text-white text-sm mb-3 flex items-center justify-between">
                        {t('friends.incomingRequests', 'Вхідні запити')}
                        <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
                            {requests.length}
                        </span>
                    </h2>
                    <div className="space-y-2">
                        {requests.map((request) => (
                            <div key={request.friendshipId} className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                        {request.senderMascotUrl ? (
                                            <img src={request.senderMascotUrl} alt="avatar" className="w-full h-full object-contain" />
                                        ) : (
                                            <UserPlus size={16} className="text-blue-400" />
                                        )}
                                    </div>
                                    <div className="truncate">
                                        <p className="font-bold text-white text-sm truncate">{request.requesterUsername}</p>
                                        <p className="text-[10px] text-blue-400/80">{t('friends.wantsToBeFriends', 'Хоче додати вас у друзі')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1.5 shrink-0 ml-2">
                                    <button 
                                        onClick={() => handleRequestAction(request.friendshipId, 'decline')}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleRequestAction(request.friendshipId, 'accept')}
                                        className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* РЕКОМЕНДАЦІЇ */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-white text-sm">{t('friends.suggestions', 'Рекомендації')}</h2>
                    <button 
                        onClick={handleRefreshSuggestions}
                        disabled={suggestionsLoading}
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                        <RefreshCw size={14} className={suggestionsLoading ? "animate-spin" : ""} />
                    </button>
                </div>
                <div className="space-y-2">
                    {suggestions.length > 0 ? (
                        suggestions.map(user => <UserCard key={user.userId} user={user} />)
                    ) : (
                        <p className="text-xs text-gray-500 text-center py-2">{t('friends.noSuggestions', 'Немає рекомендацій')}</p>
                    )}
                </div>
            </div>

            {/* МОЇ ДРУЗІ */}
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-4">
                <h2 className="font-bold text-white text-sm mb-3">
                    {t('friends.myFriends', 'Мої друзі ({{count}})', { count: friends.length })}
                </h2>

                {friends.length > 0 ? (
                    <div className="space-y-2">
                        {friends.map(friend => (
                            <div key={friend.friendshipId} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                                <div className="w-10 h-10 bg-[#1a1a2e] rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                                    {friend.mascotImageUrl ? (
                                        <img src={friend.mascotImageUrl} alt="avatar" className="w-full h-full object-contain" />
                                    ) : (
                                        <Users size={16} className="text-gray-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm line-clamp-1">{friend.username}</p>
                                    <p className="text-[10px] text-gray-500">LVL {friend.levelNumber || 1}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-gray-500 text-sm">{t('friends.noFriendsTitle')}</p>
                        <p className="text-gray-600 text-xs mt-1">{t('friends.noFriendsSub')}</p>
                    </div>
                )}
            </div>

        </div>
    )
}