import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { updatePassword } = useAuth();
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !oldPassword || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const result = await updatePassword(email, oldPassword, password);
    setLoading(false);

    if (result.success) {
      setSuccess('Senha atualizada com sucesso!');
      setEmail('');
      setOldPassword('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } else {
      setError(result.error || 'Erro ao atualizar a senha.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest">
              <h2 className="text-xl font-headline font-bold text-primary">Mudar Senha</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-secondary-container text-on-secondary-container rounded-lg text-sm font-medium">
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant ml-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  placeholder="Digite seu email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant ml-1">Senha Antiga</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  placeholder="Digite a senha atual"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant ml-1">Nova Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  placeholder="Digite a nova senha"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant ml-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim"
                  placeholder="Confirme a nova senha"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-lg font-bold text-sm bg-surface-variant text-on-surface-variant hover:bg-outline-variant transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg font-bold text-sm bg-primary text-on-primary hover:bg-primary-container transition-colors disabled:opacity-70 flex justify-center items-center"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  ) : (
                    'Salvar Senha'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChangePasswordModal;
