import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { login, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const success = await login(email, password);
    if (!success) {
      setError('Credenciais incorretas.');
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, insira seu e-mail para recuperar a senha.');
      return;
    }
    setError('');
    setMessage('');
    setIsResetting(true);
    const { success, error: resetError } = await resetPassword(email);
    setIsResetting(false);
    
    if (success) {
      setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } else {
      setError(resetError || 'Erro ao enviar e-mail de recuperação.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-3xl shadow-[0_20px_40px_-12px_rgba(0,30,64,0.12)] border border-outline-variant/20">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-on-primary font-black text-4xl mb-6 shadow-lg shadow-primary/30">
            C
          </div>
          <h1 className="text-3xl font-black text-primary font-headline tracking-tight">CapitalCorp</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant opacity-60 mt-1">Enterprise ERP</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-on-surface-variant ml-1">E-mail Corporativo</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                placeholder="seu.email@empresa.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="block text-sm font-bold text-on-surface-variant">Senha de Acesso</label>
              <button 
                type="button" 
                onClick={handleResetPassword}
                disabled={isResetting}
                className="text-xs font-bold text-primary hover:underline focus:outline-none"
              >
                {isResetting ? 'Enviando...' : 'Esqueceu a senha?'}
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">lock</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-12 text-sm focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary focus:outline-none flex items-center justify-center"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {error && <p className="text-error text-xs font-bold mt-2 ml-1 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{error}</p>}
            {message && <p className="text-emerald-600 text-xs font-bold mt-2 ml-1 flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span>{message}</p>}
          </div>
          
          <button type="submit" className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg hover:bg-primary-container hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2">
            Entrar no Sistema
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-on-surface-variant opacity-60">Acesso restrito a colaboradores autorizados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
