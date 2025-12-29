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
    // 구독 관련
    subscriptionStatus: 'free' | 'premium' | 'cancelled' | 'expired';
    subscriptionEndDate: Date | null;
    // 무료 사용자 월간 사용량
    freeMonthlyUsed: number;
    freeMonthlyResetDate: Date | null;
    // 포인트 (충전권)
    points: number;
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
    useCredit: () => Promise<void>;
    getRemainingCredits: () => { type: 'unlimited' | 'free' | 'points'; count: number };
    refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const FREE_MONTHLY_LIMIT = 1; // 무료 월 1회

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // 월간 리셋 체크
    const checkMonthlyReset = (profile: UserProfile): UserProfile => {
        const now = new Date();
        const resetDate = profile.freeMonthlyResetDate;
        
        // 리셋 날짜가 없거나 지났으면 리셋
        if (!resetDate || now >= resetDate) {
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return {
                ...profile,
                freeMonthlyUsed: 0,
                freeMonthlyResetDate: nextMonth,
            };
        }
        return profile;
    };

    // 사용자 프로필 가져오기 또는 생성
    const fetchOrCreateUserProfile = async (user: User): Promise<UserProfile> => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            let profile: UserProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                subscriptionStatus: data.subscriptionStatus || 'free',
                subscriptionEndDate: data.subscriptionEndDate?.toDate() || null,
                freeMonthlyUsed: data.freeMonthlyUsed ?? 0,
                freeMonthlyResetDate: data.freeMonthlyResetDate?.toDate() || null,
                points: data.points ?? 0,
                createdAt: data.createdAt?.toDate() || new Date(),
            };
            
            // 월간 리셋 체크
            const updatedProfile = checkMonthlyReset(profile);
            if (updatedProfile.freeMonthlyUsed !== profile.freeMonthlyUsed) {
                // DB 업데이트
                await setDoc(userRef, {
                    freeMonthlyUsed: updatedProfile.freeMonthlyUsed,
                    freeMonthlyResetDate: updatedProfile.freeMonthlyResetDate,
                }, { merge: true });
            }
            
            return updatedProfile;
        } else {
            // 새 사용자 프로필 생성
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(1);
            
            const newProfileData = {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                subscriptionStatus: 'free',
                subscriptionEndDate: null,
                freeMonthlyUsed: 0,
                freeMonthlyResetDate: nextMonth,
                points: 0,
                createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfileData);
            
            return {
                ...newProfileData,
                uid: user.uid,
                freeMonthlyResetDate: nextMonth,
                createdAt: new Date(),
            } as UserProfile;
        }
    };

    const refreshUserProfile = async () => {
        if (user) {
            const profile = await fetchOrCreateUserProfile(user);
            setUserProfile(profile);
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
        
        // 프리미엄 구독자 (무제한)
        if (userProfile.subscriptionStatus === 'premium') {
            if (userProfile.subscriptionEndDate && userProfile.subscriptionEndDate > new Date()) {
                return true;
            }
        }
        
        // 포인트가 있으면 사용 가능
        if (userProfile.points > 0) {
            return true;
        }
        
        // 무료 사용자 - 월간 한도 체크
        if (userProfile.freeMonthlyUsed < FREE_MONTHLY_LIMIT) {
            return true;
        }
        
        return false;
    };

    const getRemainingCredits = (): { type: 'unlimited' | 'free' | 'points'; count: number } => {
        if (!userProfile) return { type: 'free', count: 0 };
        
        // 프리미엄 구독자
        if (userProfile.subscriptionStatus === 'premium' && 
            userProfile.subscriptionEndDate && 
            userProfile.subscriptionEndDate > new Date()) {
            return { type: 'unlimited', count: -1 };
        }
        
        // 포인트가 있으면
        if (userProfile.points > 0) {
            return { type: 'points', count: userProfile.points };
        }
        
        // 무료 사용자
        return { type: 'free', count: Math.max(0, FREE_MONTHLY_LIMIT - userProfile.freeMonthlyUsed) };
    };

    const useCredit = async () => {
        if (!user || !userProfile) return;
        
        const userRef = doc(db, 'users', user.uid);
        
        // 프리미엄 구독자는 차감 안함
        if (userProfile.subscriptionStatus === 'premium' && 
            userProfile.subscriptionEndDate && 
            userProfile.subscriptionEndDate > new Date()) {
            return;
        }
        
        // 포인트가 있으면 포인트 차감
        if (userProfile.points > 0) {
            const newPoints = userProfile.points - 1;
            await setDoc(userRef, { points: newPoints }, { merge: true });
            setUserProfile(prev => prev ? { ...prev, points: newPoints } : null);
            return;
        }
        
        // 무료 사용자 - 월간 사용량 증가
        const newUsed = userProfile.freeMonthlyUsed + 1;
        await setDoc(userRef, { freeMonthlyUsed: newUsed }, { merge: true });
        setUserProfile(prev => prev ? { ...prev, freeMonthlyUsed: newUsed } : null);
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
        useCredit,
        getRemainingCredits,
        refreshUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
