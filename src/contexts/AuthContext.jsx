import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  function signInWithGoogle() {
    supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  function signInWithDiscord() {
    supabase.auth.signInWithOAuth({ provider: 'discord' });
  }

  function signOut() {
    supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin: !!profile?.is_admin,
      signInWithGoogle,
      signInWithDiscord,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
