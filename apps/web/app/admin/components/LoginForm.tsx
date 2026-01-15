// app/admin/components/LoginForm.tsx
'use client';
import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  message: string;
}

export default function LoginForm({ onLogin, message }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic tracking-tighter text-black mb-2">
            FOOT<span className="text-blue-600">MARK</span>.
          </h1>
          <p className="text-stone-500 font-bold text-sm tracking-widest uppercase">Admin Portal</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              placeholder="admin@footmark.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              placeholder="••••••"
            />
          </div>
          {message && (
            <div className={`p-3 rounded-lg text-sm font-bold ${message.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
          <button
            onClick={handleSubmit}
            className="w-full bg-black text-white py-4 rounded-lg font-bold uppercase tracking-wider hover:bg-stone-800 transition"
          >
            Truy cập hệ thống
          </button>
        </div>
        <div className="mt-8 p-4 bg-stone-50 rounded-lg border border-stone-200 text-center">
          <p className="text-xs text-stone-500">
            <strong>Default Account:</strong><br />
            admin@techstore.com / admin123456
          </p>
        </div>
      </div>
    </div>
  );
}