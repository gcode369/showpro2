import { supabase } from '../supabase';
import type { User } from '../../types/user';

export class AuthService {
  async login(email: string, password: string) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;

    // Get user profile based on role
    const { data: profile, error: profileError } = await supabase
      .from('agent_profiles')
      .select('subscription_status, subscription_tier, name')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    return {
      session: authData.session,
      profile: {
        id: authData.user.id,
        email: authData.user.email!,
        name: profile?.name || authData.user.user_metadata.name,
        role: authData.user.user_metadata.role || 'client',
        subscriptionStatus: profile?.subscription_status,
        subscriptionTier: profile?.subscription_tier
      }
    };
  }

  // ... rest of the class implementation stays the same
}

export const authService = new AuthService();