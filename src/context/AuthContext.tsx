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
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type UserRole = 'admin' | 'gerente' | 'caixa';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  userRole: UserRole | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updatePassword: (email: string, oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (role: UserRole) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          
          // Set up real-time listener for role changes
          unsubscribeSnapshot = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
              setUserRole(docSnap.data().role as UserRole);
            } else {
              // Default to admin for the first user or if not set
              const defaultRole = 'admin';
              setUserRole(defaultRole);
              await setDoc(userDocRef, {
                email: currentUser.email,
                role: defaultRole,
                createdAt: new Date().toISOString()
              });
            }
            setLoading(false);
          }, (error) => {
            console.error("Error listening to user role:", error);
            setUserRole('admin'); // Fallback
            setLoading(false);
          });
          
        } catch (error) {
          console.error("Error setting up user role listener:", error);
          setUserRole('admin'); // Fallback
          setLoading(false);
        }
      } else {
        setUserRole(null);
        setLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const updateUserRole = async (role: UserRole) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { role });
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error: any) {
      console.error('Error logging in:', error.message);
      
      // Auto-register specific requested email if it doesn't exist
      if ((email === 'controlbusinesssolution@gmail.com' && password === 'controlbusiness') || 
          (email === 'litovaldemar@gmail.com')) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          
          // Add to users collection if it's the specific user
          if (email === 'controlbusinesssolution@gmail.com') {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              email: email,
              role: 'user',
              createdAt: new Date().toISOString()
            });
          }
          
          return true;
        } catch (createError: any) {
          console.error('Error creating user:', createError.message);
        }
      }
      
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
    <AuthContext.Provider value={{ isAuthenticated, user, userRole, login, logout, updatePassword, resetPassword, updateUserRole, loading }}>
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
