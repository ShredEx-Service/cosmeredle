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

  async function signUp(email, password, username) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: username } },
    });
    return error;
  }

  async function signIn(usernameOrEmail, password) {
    // Try to look up email by username first
    const looksLikeEmail = usernameOrEmail.includes('@');
    let email = usernameOrEmail;
    if (!looksLikeEmail) {
      const { data } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', usernameOrEmail)
        .single();
      if (!data?.email) return { message: 'Username not found' };
      email = data.email;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin: !!profile?.is_admin,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
