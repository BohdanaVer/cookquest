import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/axiosClient';
import { toast } from 'sonner';
import type { BackendError } from '../types';
import type { Path } from 'react-hook-form';

interface LoginForm {
    email: string;
    password: string;
}

export default function Login() {
    const navigate = useNavigate();
    
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginForm>();

    const onSubmit = async (data: LoginForm) => {
        try {
            const response = await api.post('/api/auth/login', data);
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            toast.success("З поверненням!");
            navigate('/home');
            
        } catch (e) {
                    const error = e as BackendError; 
                    
                    if (error.validationErrors) {
                        Object.keys(error.validationErrors).forEach((field) => {
                            setError(field as Path<LoginForm>, { 
                                type: "server", 
                                message: error.validationErrors![field] 
                            });
                        });
                    }
                }
    };

    return (
            <div className="w-full max-w-md bg-[#1a1a2e] rounded-2xl border border-white/5 p-8">
                <h2 className="text-2xl font-extrabold text-white mb-6">Вхід</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input
                            {...register('email')} 
                            placeholder="your@email.com"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                        {errors.email && (
                            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Пароль</label>
                        <input
                            type="password"
                            {...register('password')}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                        {errors.password && (
                            <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors"
                    >
                        {isSubmitting ? 'Входимо...' : 'Увійти'}
                    </button>
                </form>
                
                <p className="text-center text-gray-500 mt-6 text-sm">
                    Ще немає акаунту?{' '}
                    <Link to="/register" className="text-orange-400 font-bold hover:underline">
                        Зареєструватися
                    </Link>
                </p>
            </div>
        
    );
}