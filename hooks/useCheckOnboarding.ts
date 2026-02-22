import { supabase } from '@/utils/supabase';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const CACHE_KEY = (userId:String) => 'onboarding_Status_${userId}';

export function useCheckOnboarding(){
  const {userId, isLoaded, isSignedIn} = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if(!isLoaded){
      return;
    }

    if(!isSignedIn || !userId) {
      setHasCompletedOnboarding(false)
      setIsLoading(false)
      return;
    }

    const checkUser = async () =>{
      try{
        setIsLoading(true);

        const cached = await AsyncStorage.getItem(CACHE_KEY(userId));
        if (cached !== null){
          setHasCompletedOnboarding(JSON.parse(cached));
          setIsLoading(false);
          return;
        }
        const {data,error} = await supabase
        .from('user_info')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .single();

        const completed = !error && !!data;
        setHasCompletedOnboarding(completed);

        await AsyncStorage.setItem(
          CACHE_KEY(userId),
          JSON.stringify(completed)
        );

        
      }
      catch(err){
        setHasCompletedOnboarding(false)
      }
      finally{
        setIsLoading(false);
      }
    }
    checkUser();
  },[userId, isLoaded, isSignedIn]);
  return {hasCompletedOnboarding, isLoading}
}