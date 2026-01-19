import { supabase } from '@/utils/supabase';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';

export function useCheckOnboarding() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      setIsLoading(true);
      return;
    }

    if (!isSignedIn || !userId) {
      setHasCompletedOnboarding(false);
      setIsLoading(false);
      return;
    }

    const checkUserInDatabase = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('user_info')
          .select('*')
          .eq('user_id', userId);

        if (error) {
          setHasCompletedOnboarding(false);
        } else {
          setHasCompletedOnboarding(data && data.length > 0);
        }
      } catch {
        setHasCompletedOnboarding(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserInDatabase();
  }, [userId, isLoaded, isSignedIn]);

  return { hasCompletedOnboarding, isLoading };
}