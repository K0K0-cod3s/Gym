import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';

declare global {
  var __initial_auth_token: string | undefined;
}

export const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we have a stored user ID in localStorage
        const storedUserId = localStorage.getItem('fitness_tracker_user_id');
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            console.log('✅ User authenticated:', user.uid);
            setUserId(user.uid);
            // Store user ID in localStorage for persistence
            localStorage.setItem('fitness_tracker_user_id', user.uid);
          } else {
            console.log('❌ No user found, signing in anonymously...');
            
            try {
              if (typeof globalThis.__initial_auth_token !== 'undefined' && globalThis.__initial_auth_token) {
                console.log('🔑 Using custom token...');
                const result = await signInWithCustomToken(auth, globalThis.__initial_auth_token);
                console.log('✅ Custom token sign-in successful:', result.user.uid);
              } else {
                console.log('👤 Signing in anonymously...');
                const result = await signInAnonymously(auth);
                console.log('✅ Anonymous sign-in successful:', result.user.uid);
                localStorage.setItem('fitness_tracker_user_id', result.user.uid);
              }
            } catch (authError) {
              console.error('❌ Authentication failed:', authError);
              // Fallback: use stored user ID if available
              if (storedUserId) {
                console.log('🔄 Using stored user ID as fallback:', storedUserId);
                setUserId(storedUserId);
              }
            }
          }
          setIsAuthReady(true);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("❌ Authentication Error:", error);
        
        // Fallback: use stored user ID if available
        const storedUserId = localStorage.getItem('fitness_tracker_user_id');
        if (storedUserId) {
          console.log('🔄 Using stored user ID as fallback:', storedUserId);
          setUserId(storedUserId);
        }
        
        setIsAuthReady(true);
      }
    };
    
    initAuth();
  }, []);

  const getUserId = () => {
    // Priority: current auth user > state user > localStorage > fallback
    const currentUserId = auth.currentUser?.uid || 
                         userId || 
                         localStorage.getItem('fitness_tracker_user_id') || 
                         'anonymous_user';
    
    console.log('🆔 Getting user ID:', currentUserId);
    return currentUserId;
  };

  // Debug function to check data persistence
  const checkDataPersistence = () => {
    console.log('🔍 Data Persistence Check:');
    console.log('- Current Auth User:', auth.currentUser?.uid);
    console.log('- State User ID:', userId);
    console.log('- Stored User ID:', localStorage.getItem('fitness_tracker_user_id'));
    console.log('- Firebase Auth Ready:', isAuthReady);
  };

  return { userId, isAuthReady, getUserId, checkDataPersistence };
};