import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
    const { user, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

    if (!isOpen) return null;

    const plans = {
        monthly: {
            price: 9900,
            period: '월',
            description: '매월 자동 결제',
        },
        yearly: {
            price: 79000,
            period: '년',
            description: '연 79,000원 (월 6,583원)',
            discount: '33% 할인',
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
            const tossPayments = (window as any).TossPayments;
            if (!tossPayments) {
                // SDK 동적 로드
                const script = document.createElement('script');
                script.src = 'https://js.tosspayments.com/v1/payment';
                document.head.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }

            const clientKey = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'; // 테스트 키 (실제 키로 교체 필요)
            const payment = (window as any).TossPayments(clientKey);

            const plan = plans[selectedPlan];
            const orderId = `order_${user.uid}_${Date.now()}`;

            await payment.requestPayment('카드', {
                amount: plan.price,
                orderId: orderId,
                orderName: `CareerFlow AI Pro (${selectedPlan === 'monthly' ? '월간' : '연간'})`,
                customerName: userProfile?.displayName || userProfile?.email?.split('@')[0] || '고객',
                customerEmail: userProfile?.email,
                successUrl: `${window.location.origin}/payment/success`,
                failUrl: `${window.location.origin}/payment/fail`,
                // 정기결제용 설정
                flowMode: 'DEFAULT',
                easyPay: '토스페이',
            });

        } catch (error: any) {
            console.error('Payment error:', error);
            if (error.code === 'USER_CANCEL') {
                // 사용자가 결제를 취소한 경우
            } else {
                alert('결제 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
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
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Pro로 업그레이드</h2>
                    <p className="text-slate-500 mt-1">무제한으로 AI 자소서를 생성하세요</p>
                </div>

                {/* 혜택 목록 */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-slate-800 mb-3">Pro 혜택</h3>
                    <ul className="space-y-2">
                        {[
                            '무제한 AI 자기소개서 생성',
                            '5단계 심층 분석 파이프라인',
                            'Gemini 3.0 Pro 심층 분석 모드',
                            'PDF/이미지 파일 업로드',
                            '맞춤법 자동 검사',
                            '우선 고객 지원',
                        ].map((benefit, i) => (
                            <li key={i} className="flex items-center gap-2 text-slate-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {benefit}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 플랜 선택 */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* 월간 */}
                    <button
                        onClick={() => setSelectedPlan('monthly')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                            selectedPlan === 'monthly'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <p className="text-sm text-gray-500">월간</p>
                        <p className="text-2xl font-bold text-slate-800">₩9,900</p>
                        <p className="text-xs text-gray-500">매월 결제</p>
                    </button>

                    {/* 연간 */}
                    <button
                        onClick={() => setSelectedPlan('yearly')}
                        className={`p-4 rounded-xl border-2 transition-all relative ${
                            selectedPlan === 'yearly'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            33% 할인
                        </span>
                        <p className="text-sm text-gray-500">연간</p>
                        <p className="text-2xl font-bold text-slate-800">₩79,000</p>
                        <p className="text-xs text-gray-500">월 ₩6,583</p>
                    </button>
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

                {/* 안내 문구 */}
                <p className="text-center text-xs text-gray-500 mt-4">
                    결제 후 즉시 Pro 혜택이 적용됩니다.<br />
                    언제든지 구독을 취소할 수 있습니다.
                </p>
            </div>
        </div>
    );
};

export default PricingModal;
