import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserProfile {
  clerkId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  emailVerified: boolean;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  totalDataItems: number;
  totalFilesUploaded: number;
  storageUsed: number;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
}

export const useUserSync = () => {
  const { user, isLoaded } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check if user exists in Firebase
        const userDocRef = doc(db, 'users', user.id);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          // User exists, update last login time
          const userData = userDocSnap.data() as UserProfile;
          
          // Update last login time
          await updateDoc(userDocRef, {
            lastLoginAt: Timestamp.now(),
          });

          // Convert Firestore timestamps to Date objects
          const profile: UserProfile = {
            ...userData,
            createdAt: userData.createdAt || new Date(),
            updatedAt: userData.updatedAt || new Date(),
            lastLoginAt: new Date(),
          };

          setUserProfile(profile);
        } else {
          // User doesn't exist, create new user document
          console.log('Creating new user in Firebase:', user.id);
          
          const newUserProfile: UserProfile = {
            clerkId: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            username: user.username || '',
            email: user.primaryEmailAddress?.emailAddress || '',
            emailVerified: user.primaryEmailAddress?.verification?.status === 'verified',
            imageUrl: user.imageUrl || '',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date(),
            totalDataItems: 0,
            totalFilesUploaded: 0,
            storageUsed: 0,
            preferences: {
              theme: 'light',
              notifications: true,
              language: 'en',
            },
          };

          await setDoc(userDocRef, {
            ...newUserProfile,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            lastLoginAt: Timestamp.now(),
          });

          setUserProfile(newUserProfile);
          console.log('New user created in Firebase successfully');
        }

        setError(null);
      } catch (err) {
        console.error('Error syncing user:', err);
        setError(`Failed to sync user data: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [user, isLoaded]);

  const updateUserStats = async (updates: Partial<Pick<UserProfile, 'totalDataItems' | 'totalFilesUploaded' | 'storageUsed'>>) => {
    if (!user || !userProfile) return;

    try {
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      setUserProfile(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    } catch (err) {
      console.error('Error updating user stats:', err);
    }
  };

  const updateUserPreferences = async (preferences: Partial<UserProfile['preferences']>) => {
    if (!user || !userProfile) return;

    try {
      const userDocRef = doc(db, 'users', user.id);
      const updatedPreferences = { ...userProfile.preferences, ...preferences };
      
      await updateDoc(userDocRef, {
        preferences: updatedPreferences,
        updatedAt: Timestamp.now(),
      });

      setUserProfile(prev => prev ? { 
        ...prev, 
        preferences: updatedPreferences, 
        updatedAt: new Date() 
      } : null);
    } catch (err) {
      console.error('Error updating user preferences:', err);
    }
  };

  return {
    userProfile,
    loading,
    error,
    updateUserStats,
    updateUserPreferences,
  };
};

