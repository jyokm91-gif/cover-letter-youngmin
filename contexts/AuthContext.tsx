import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    subscriptionStatus: 'free' | 'active' | 'cancelled' | 'expired';
    subscriptionEndDate: Date | null;
    freeTrialsRemaining: number;
    createdAt: Date;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    canUseService: () => boolean;
    decrementFreeTrial: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const FREE_TRIAL_COUNT = 3; // 무료 체험 횟수

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // 사용자 프로필 가져오기 또는 생성
    const fetchOrCreateUserProfile = async (user: User): Promise<UserProfile> => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                subscriptionStatus: data.subscriptionStatus || 'free',
                subscriptionEndDate: data.subscriptionEndDate?.toDate() || null,
                freeTrialsRemaining: data.freeTrialsRemaining ?? FREE_TRIAL_COUNT,
                createdAt: data.createdAt?.toDate() || new Date(),
            };
        } else {
            // 새 사용자 프로필 생성
            const newProfile: Omit<UserProfile, 'uid'> & { createdAt: any } = {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                subscriptionStatus: 'free',
                subscriptionEndDate: null,
                freeTrialsRemaining: FREE_TRIAL_COUNT,
                createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            return {
                ...newProfile,
                uid: user.uid,
                createdAt: new Date(),
            } as UserProfile;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                const profile = await fetchOrCreateUserProfile(user);
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const logout = async () => {
        await signOut(auth);
    };

    const canUseService = (): boolean => {
        if (!userProfile) return false;
        
        // 활성 구독자
        if (userProfile.subscriptionStatus === 'active') {
            if (userProfile.subscriptionEndDate && userProfile.subscriptionEndDate > new Date()) {
                return true;
            }
        }
        
        // 무료 체험 남음
        if (userProfile.freeTrialsRemaining > 0) {
            return true;
        }
        
        return false;
    };

    const decrementFreeTrial = async () => {
        if (!user || !userProfile) return;
        if (userProfile.subscriptionStatus === 'active') return; // 구독자는 차감 안함
        
        const newCount = Math.max(0, userProfile.freeTrialsRemaining - 1);
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { freeTrialsRemaining: newCount }, { merge: true });
        
        setUserProfile(prev => prev ? { ...prev, freeTrialsRemaining: newCount } : null);
    };

    const value = {
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
        canUseService,
        decrementFreeTrial,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
