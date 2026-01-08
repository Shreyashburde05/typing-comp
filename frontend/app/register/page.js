'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

export default function Register() {
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm();
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const onSubmit = async (data) => {
        setIsLoading(true);
        setServerError('');
        try {
            const response = await api.post('/auth/register', data);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('organizer', JSON.stringify(response.data.organizer));

            router.push('/dashboard');
        } catch (err) {
            setServerError(
                err.response?.data?.error || 'Registration failed. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <Navbar />
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-8">
                <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold mb-6 text-center text-blue-500">
                        Create Account
                    </h2>

                    {serverError && (
                        <div className="mb-4 p-3 bg-red-900/50 border border-red-800 text-red-200 rounded text-sm text-center">
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Full Name
                            </label>
                            <input
                                {...register('name', {
                                    required: 'Name is required',
                                    minLength: {
                                        value: 2,
                                        message: 'Name must be at least 2 characters',
                                    },
                                })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                                placeholder="John Doe"
                            />
                            {errors.name && (
                                <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Email Address
                            </label>
                            <input
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address',
                                    },
                                })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                                placeholder="you@example.com"
                            />
                            {errors.email && (
                                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: {
                                        value: 12,
                                        message: 'Password must be at least 12 characters',
                                    },
                                    pattern: {
                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                                        message:
                                            'Must contain uppercase, lowercase, number, and special char',
                                    },
                                })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                                placeholder="••••••••••••"
                            />
                            {errors.password && (
                                <p className="text-red-400 text-xs mt-1">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Creating Account...' : 'Register'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-400 hover:underline">
                            Log in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
