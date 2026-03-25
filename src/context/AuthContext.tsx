import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  updatePassword as firebaseUpdatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User 
} from 'firebase/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updatePassword: (email: string, oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error: any) {
      console.error('Error logging in:', error.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updatePassword = async (email: string, oldPassword: string, newPassword: string) => {
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Usuário não autenticado.' };
      }

      // First, verify the old password by reauthenticating
      const credential = EmailAuthProvider.credential(email, oldPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // If successful, update the password
      await firebaseUpdatePassword(auth.currentUser, newPassword);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        return { success: false, error: 'Email ou senha antiga incorretos.' };
      }
      return { success: false, error: error.message || 'Erro ao atualizar senha' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return { success: false, error: error.message || 'Erro ao enviar email de recuperação' };
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updatePassword, resetPassword, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
