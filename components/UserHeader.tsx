import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface UserHeaderProps {
    onOpenPricing: () => void;
}

const UserHeader: React.FC<UserHeaderProps> = ({ onOpenPricing }) => {
    const { user, userProfile, logout, loading } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
        );
    }

    if (!user || !userProfile) {
        return (
            <>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAuthModal(true)}
                        className="text-slate-600 hover:text-slate-800 font-medium"
                    >
                        로그인
                    </button>
                    <button
                        onClick={() => setShowAuthModal(true)}
                        className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        무료로 시작하기
                    </button>
                </div>
                <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            </>
        );
    }

    const getSubscriptionBadge = () => {
        if (userProfile.subscriptionStatus === 'active') {
            return (
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                    Pro 구독 중
                </span>
            );
        }
        return (
            <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">
                무료 {userProfile.freeTrialsRemaining}회 남음
            </span>
        );
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 hover:bg-slate-100 rounded-lg p-2 transition-colors"
            >
                {/* 프로필 이미지 */}
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {userProfile.photoURL ? (
                        <img src={userProfile.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        userProfile.email?.charAt(0).toUpperCase() || 'U'
                    )}
                </div>
                {/* 이름 및 구독 상태 */}
                <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-slate-800">
                        {userProfile.displayName || userProfile.email?.split('@')[0]}
                    </p>
                    {getSubscriptionBadge()}
                </div>
                {/* 드롭다운 화살표 */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* 드롭다운 메뉴 */}
            {showDropdown && (
                <>
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                        {/* 사용자 정보 */}
                        <div className="p-4 border-b bg-slate-50">
                            <p className="font-medium text-slate-800">{userProfile.email}</p>
                            <div className="mt-2">
                                {getSubscriptionBadge()}
                            </div>
                        </div>

                        {/* 메뉴 항목 */}
                        <div className="py-2">
                            {userProfile.subscriptionStatus !== 'active' && (
                                <button
                                    onClick={() => {
                                        setShowDropdown(false);
                                        onOpenPricing();
                                    }}
                                    className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 font-medium flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                    Pro로 업그레이드
                                </button>
                            )}
                            <button
                                onClick={async () => {
                                    await logout();
                                    setShowDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                로그아웃
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserHeader;
