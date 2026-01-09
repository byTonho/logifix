import React, { useState } from 'react';
import { Truck, Lock, Mail } from 'lucide-react';
import { User } from '../types';

import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Fetch profile data for the user
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        onLogin({
          id: data.user.id,
          email: data.user.email || '',
          name: profile?.name || 'Usuário',
          role: profile?.role || 'Usuário',
          password: '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center" style={{ backgroundColor: '#007db3' }}>
          <div className="w-24 h-24 mx-auto mb-4 overflow-hidden flex items-center justify-center">
            <img src="/bytonho.png" alt="byTonho Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">LogiFix - byTonho</h1>
          <p className="text-blue-100 italic">Gestão de Ocorrências Logísticas</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg"
            >
              Entrar no Sistema
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            &copy; 2026 Hidran Cosméticos. Todos os direitos reservados para byTonho.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;