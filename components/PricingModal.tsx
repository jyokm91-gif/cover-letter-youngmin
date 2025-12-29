import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type PlanType = 'premium' | 'points';

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
    const { user, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('premium');

    if (!isOpen) return null;

    const plans = {
        premium: {
            name: '프리미엄 구독',
            price: 29000,
            period: '월',
            description: '무제한 이용',
            features: [
                '무제한 AI 자기소개서 생성',
                '5단계 심층 분석 파이프라인',
                'Gemini 3.0 Pro 심층 분석 모드',
                'PDF/이미지 파일 업로드',
                '맞춤법 자동 검사',
                '우선 고객 지원',
            ],
        },
        points: {
            name: '포인트 충전',
            price: 10000,
            period: '1회 충전',
            description: '10회 이용권',
            features: [
                '10회 자기소개서 생성',
                '유효기간 없음',
                '필요할 때만 충전',
            ],
        },
    };

    const handlePayment = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        setLoading(true);

        try {
            // Toss Payments SDK 로드
            let tossPayments = (window as any).TossPayments;
            if (!tossPayments) {
                const script = document.createElement('script');
                script.src = 'https://js.tosspayments.com/v1/payment';
                document.head.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
                tossPayments = (window as any).TossPayments;
            }

            const clientKey = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'; // 테스트 키
            const payment = tossPayments(clientKey);

            const plan = plans[selectedPlan];
            const orderId = `order_${selectedPlan}_${user.uid}_${Date.now()}`;

            await payment.requestPayment('카드', {
                amount: plan.price,
                orderId: orderId,
                orderName: `CareerFlow AI ${plan.name}`,
                customerName: userProfile?.displayName || userProfile?.email?.split('@')[0] || '고객',
                customerEmail: userProfile?.email,
                successUrl: `${window.location.origin}/app.html?payment=success&plan=${selectedPlan}`,
                failUrl: `${window.location.origin}/app.html?payment=fail`,
                flowMode: 'DEFAULT',
            });

        } catch (error: any) {
            console.error('Payment error:', error);
            if (error.code !== 'USER_CANCEL') {
                alert('결제 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
                {/* 닫기 버튼 */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* 헤더 */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">요금제 선택</h2>
                    <p className="text-slate-500 mt-1">나에게 맞는 플랜을 선택하세요</p>
                </div>

                {/* 현재 상태 표시 */}
                {userProfile && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-6 text-center">
                        <p className="text-sm text-slate-600">
                            현재 상태: {' '}
                            {userProfile.subscriptionStatus === 'premium' ? (
                                <span className="font-semibold text-green-600">프리미엄 구독 중</span>
                            ) : (
                                <span className="font-semibold text-slate-800">무료 플랜</span>
                            )}
                            {userProfile.points > 0 && (
                                <span className="ml-2 text-blue-600">| 포인트 {userProfile.points}회 보유</span>
                            )}
                        </p>
                    </div>
                )}

                {/* 플랜 선택 */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {/* 프리미엄 구독 */}
                    <button
                        onClick={() => setSelectedPlan('premium')}
                        className={`p-5 rounded-xl border-2 transition-all text-left ${
                            selectedPlan === 'premium'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                추천
                            </span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedPlan === 'premium' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                            }`}>
                                {selectedPlan === 'premium' && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">프리미엄 구독</h3>
                        <div className="mt-2">
                            <span className="text-3xl font-bold text-slate-800">₩29,000</span>
                            <span className="text-gray-500">/월</span>
                        </div>
                        <p className="text-green-600 font-medium mt-2">✨ 무제한 이용</p>
                        <ul className="mt-4 space-y-2">
                            {plans.premium.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </button>

                    {/* 포인트 충전 */}
                    <button
                        onClick={() => setSelectedPlan('points')}
                        className={`p-5 rounded-xl border-2 transition-all text-left ${
                            selectedPlan === 'points'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                1회당 ₩1,000
                            </span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedPlan === 'points' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                            }`}>
                                {selectedPlan === 'points' && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">포인트 충전</h3>
                        <div className="mt-2">
                            <span className="text-3xl font-bold text-slate-800">₩10,000</span>
                            <span className="text-gray-500">/10회</span>
                        </div>
                        <p className="text-blue-600 font-medium mt-2">🎫 10회 이용권</p>
                        <ul className="mt-4 space-y-2">
                            {plans.points.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </button>
                </div>

                {/* 무료 플랜 안내 */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🆓</span>
                        <h4 className="font-semibold text-slate-800">무료 플랜</h4>
                    </div>
                    <p className="text-sm text-slate-600">매월 1회 무료 자기소개서 생성 가능 (매월 1일 초기화)</p>
                </div>

                {/* 결제 버튼 */}
                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            결제 준비 중...
                        </>
                    ) : (
                        <>
                            ₩{plans[selectedPlan].price.toLocaleString()} 결제하기
                        </>
                    )}
                </button>

                <p className="text-center text-xs text-gray-500 mt-4">
                    결제 후 즉시 혜택이 적용됩니다. 구독은 언제든 취소 가능합니다.
                </p>
            </div>
        </div>
    );
};

export default PricingModal;
