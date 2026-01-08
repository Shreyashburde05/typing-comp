'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { ArrowRight, Keyboard } from 'lucide-react';

export default function Home() {
    const [code, setCode] = useState('');
    const router = useRouter();

    const handleJoin = (e) => {
        e.preventDefault();
        if (code.trim().length === 6) {
            router.push(`/competition/${code.toUpperCase()}`);
        } else {
            alert('Please enter a valid 6-character code.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <Navbar />

            <main className="flex flex-col items-center justify-center px-6 py-24 text-center">
                <div className="mb-8 p-4 bg-gray-900 rounded-full">
                    <Keyboard className="w-12 h-12 text-blue-500" />
                </div>

                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    Fast Fingers, Faster Results.
                </h1>

                <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mb-12">
                    Join real-time typing competitions, track your WPM, and compete with friends instantly. No account required to join.
                </p>

                <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <input
                        type="text"
                        placeholder="Enter Competition Code (e.g., A1B2C3)"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="flex-1 px-4 py-3 rounded-lg bg-gray-900 border border-gray-800 focus:outline-none focus:border-blue-500 transition-colors uppercase placeholder:normal-case"
                    />
                    <button
                        type="submit"
                        className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        Join <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-gray-400">
                    <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
                        <h3 className="text-white font-semibold mb-2">Real-time</h3>
                        <p>Live leaderboards update as you type.</p>
                    </div>
                    <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
                        <h3 className="text-white font-semibold mb-2">Secure</h3>
                        <p>Anti-cheat detection for fair play.</p>
                    </div>
                    <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
                        <h3 className="text-white font-semibold mb-2">Analytics</h3>
                        <p>Detailed breakdown of your performance.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
