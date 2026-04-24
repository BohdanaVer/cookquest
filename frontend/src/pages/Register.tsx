import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/axiosClient';
import { toast } from 'sonner';
import type { BackendError } from '../types';
import type { Path } from 'react-hook-form';

interface RegisterForm {
    username: string;
    email: string;
    password: string;
}

export default function Register() {
    const navigate = useNavigate();
    
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RegisterForm>();

    const onSubmit = async (data: RegisterForm) => {
        try {
            const response = await api.post('/api/auth/register', data);
            
            localStorage.setItem('token', response.data.token);
            toast.success('Акаунт успішно створено!');
            navigate('/home');
            
        } catch (e) {
            const error = e as BackendError; 
            
            if (error.validationErrors) {
                Object.keys(error.validationErrors).forEach((field) => {
                    setError(field as Path<RegisterForm>, { 
                        type: "server", 
                        message: error.validationErrors![field] 
                    });
                });
            }
        }
    };

    return (
            <div className="w-full max-w-md bg-[#1a1a2e] rounded-2xl border border-white/5 p-8">
                <h2 className="text-2xl font-extrabold text-white mb-6">Реєстрація</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Поле Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Ім'я користувача
                        </label>
                        <input
                            {...register('username', {
                                pattern: {
                                    value: /^[a-zA-Z0-9_]+$/,
                                    message: "Тільки латинські літери, цифри, _"
                                }
                            })}
                            placeholder="your_username"
                            className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:border-transparent ${
                                errors.username ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-orange-500/50'
                            }`}
                        />
                        {errors.username ? (
                            <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>
                        ) : (
                            <p className="text-gray-600 text-xs mt-1">Тільки латинські літери, цифри, _</p>
                        )}
                    </div>

                    {/* Поле Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            {...register('email')}
                            placeholder="your@email.com"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                        {errors.email && (
                            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Поле Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Пароль
                        </label>
                        <input
                            type="password"
                            {...register('password')}
                            placeholder="мінімум 6 символів"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                        {errors.password && (
                            <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors mt-2"
                    >
                        {isSubmitting ? 'Реєструємось...' : 'Створити акаунт'}
                    </button>
                </form>
                
                <p className="text-center text-gray-500 mt-6 text-sm">
                    Вже є акаунт?{' '}
                    <Link to="/login" className="text-orange-400 font-bold hover:underline">
                        Увійти
                    </Link>
                </p>
            </div>
    );
}