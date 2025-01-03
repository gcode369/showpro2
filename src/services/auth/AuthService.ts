import { supabase } from '../supabase';
import type { User } from '../../types/user';

export class AuthService {
  async register(email: string, password: string, userData: Partial<User>) {
    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role
          }
        }
      });

      if (error) {
        console.error('Supabase auth error:', error);
        if (error.message.includes('already registered')) {
          throw new Error('An account with this email already exists. Please try logging in instead.');
        }
        throw error;
      }

      if (!data.session || !data.user) {
        throw new Error('Registration failed - no user data returned');
      }

      // Create profile based on role
      if (userData.role === 'agent') {
        const { error: profileError } = await supabase
          .from('agent_profiles')
          .insert({
            user_id: data.user.id,
            name: userData.name,
            subscription_tier: 'basic',
            subscription_status: 'trial'
          });

        if (profileError) {
          console.error('Agent profile creation error:', profileError);
          throw profileError;
        }
      }

      return { session: data.session, user: data.user };
    } catch (err) {
      console.error('Registration process error:', err);
      throw err instanceof Error ? err : new Error('Registration failed');
    }
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}

export const authService = new AuthService();