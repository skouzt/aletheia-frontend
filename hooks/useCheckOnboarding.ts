import { supabase } from '@/utils/supabase';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';

export function useCheckOnboarding() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      console.log('⏳ Waiting for Clerk to load...');
      setIsLoading(true);
      return;
    }

    if (!isSignedIn || !userId) {
      console.log(`❌ Auth state - isSignedIn: ${isSignedIn}, userId: ${userId}`);
      setHasCompletedOnboarding(false);
      setIsLoading(false);
      return;
    }

    console.log('🔍 Querying Supabase for user_id:', userId);

    const checkUserInDatabase = async () => {
      try {
        setIsLoading(true);
        
        // 🔍 DEBUG: First, let's see what the raw query returns
        const { data, error } = await supabase
          .from('user_info')
          .select('*')  // Select all to see the actual data
          .eq('user_id', userId);

        console.log('📦 Supabase raw response:', { 
          query: 'user_info WHERE user_id = ' + userId,
          data, 
          error,
          rowCount: data?.length 
        });

        if (error) {
          console.error('❌ Supabase query error:', error);
          setHasCompletedOnboarding(false);
        } else {
          const completed = data && data.length > 0;
          console.log(`✅ Found ${data?.length} records. Onboarding ${completed ? 'COMPLETE' : 'INCOMPLETE'}`);
          setHasCompletedOnboarding(completed);
        }
      } catch (err) {
        console.error('❌ Unexpected error:', err);
        setHasCompletedOnboarding(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserInDatabase();
  }, [userId, isLoaded, isSignedIn]);

  return { hasCompletedOnboarding, isLoading };
}