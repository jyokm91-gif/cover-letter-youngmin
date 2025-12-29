
import React, { useState, useCallback } from 'react';
import { InputState, JobOption, ProofreadingIssue } from './types';
import { 
    PROMPT_STEP_1_ARCHITECT, 
    PROMPT_STEP_2_WRITER, 
    PROMPT_STEP_3_CRITIC, 
    PROMPT_STEP_4_STRATEGIST, 
    PROMPT_STEP_5_EDITOR 
} from './constants';
import { callGemini, callProofreaderGemini } from './services/geminiService';
import InputSection from './components/InputSection';
import LoadingIndicator from './components/LoadingIndicator';
import OutputSection from './components/OutputSection';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import UserHeader from './components/UserHeader';
import AuthModal from './components/AuthModal';
import PricingModal from './components/PricingModal';

const AppContent: React.FC = () => {
    const { user, userProfile, canUseService, useCredit, getRemainingCredits } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showPricingModal, setShowPricingModal] = useState(false);
    
    const [inputState, setInputState] = useState<InputState>({
        jobRole: '',
        jobPosting: '',
        userInfo: '',
        jasaoseoQuestions: '',
        initialDraft: '',
        uploadedFiles: [],
        useSearchGrounding: false,
        useThinkingMode: true,
    });
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingStatus, setLoadingStatus] = useState<string>('');
    const [analysisReport, setAnalysisReport] = useState<string>('');
    const [finalJasaoseo, setFinalJasaoseo] = useState<string>('');
    const [proofreadingResult, setProofreadingResult] = useState<ProofreadingIssue[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRevising, setIsRevising] = useState<boolean>(false);
    const [revisionRequest, setRevisionRequest] = useState<string>('');

    const handleGeneratePipeline = useCallback(async () => {
        // 로그인 체크
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        
        // 사용 가능 여부 체크
        if (!canUseService()) {
            setShowPricingModal(true);
            return;
        }
        
        const { jobRole, jobPosting, userInfo, jasaoseoQuestions, initialDraft, uploadedFiles, useSearchGrounding, useThinkingMode } = inputState;
        const jobOption = jobRole as JobOption;

        if (!jobRole || !jobPosting || !jasaoseoQuestions || (!userInfo && !uploadedFiles.some(f => f.category === 'userInfo'))) {
            alert("직무 선택, 채용 공고, 사용자 정보(텍스트 또는 파일), 자소서 문항은 필수 입력 항목입니다.");
            return;
        }

        // Combine manual text and file content for User Info
        const userInfoFileContent = uploadedFiles
            .filter(f => f.category === 'userInfo')
            .map(f => `[첨부파일: ${f.name}]\n${f.content}`)
            .join('\n\n');
        const fullUserInfo = `${userInfo}\n\n${userInfoFileContent}`.trim();

        // Combine manual text and file content for Initial Draft
        const draftFileContent = uploadedFiles
            .filter(f => f.category === 'initialDraft')
            .map(f => `[첨부파일: ${f.name}]\n${f.content}`)
            .join('\n\n');
        const fullInitialDraft = `${initialDraft}\n\n${draftFileContent}`.trim();

        // Combine manual text and file content for Job Posting
        const jobPostingFileContent = uploadedFiles
            .filter(f => f.category === 'jobPosting')
            .map(f => `[첨부파일: ${f.name}]\n${f.content}`)
            .join('\n\n');
        const fullJobPosting = `${jobPosting}\n\n${jobPostingFileContent}`.trim();

        setIsLoading(true);
        setError(null);
        setAnalysisReport('');
        setFinalJasaoseo('');
        setProofreadingResult(null);
        
        try {
            // --- 1단계: 구조 설계 (Architect) ---
            setLoadingStatus("1/5단계: AI 설계자가 경험을 분석하여 최적의 논리 구조를 설계 중입니다...");
            const prompt1 = `
[필수 입력 데이터]
[선택된 직무]: ${jobRole}
[사용자 배경 정보]:
${fullUserInfo}

[채용 정보]:
${fullJobPosting}

[문항 정보]:
${jasaoseoQuestions}

${fullInitialDraft ? `[사용자 제공 초안 (참고용)]:\n${fullInitialDraft}` : ''}
`;
            const blueprint = await callGemini(PROMPT_STEP_1_ARCHITECT, prompt1, jobOption, { useSearchGrounding, useThinkingMode });
            
            // --- 2단계: 초안 작성 (Writer) ---
            setLoadingStatus("2/5단계: AI 작가가 설계도를 바탕으로 설득력 있는 초안을 작성 중입니다...");
            const prompt2 = `
[자기소개서 설계도]:
${blueprint}

[선택된 직무]: ${jobRole}

[채용 정보]:
${fullJobPosting}

[문항 정보]:
${jasaoseoQuestions}
`;
            const generatedDraft = await callGemini(PROMPT_STEP_2_WRITER, prompt2, jobOption, { useThinkingMode });

            // --- 3단계: 검증 (Critic) ---
            setLoadingStatus("3/5단계: CTO급 AI 면접관이 초안을 냉정하게 평가 중입니다...");
            const prompt3 = `
[2단계 결과물]:
${generatedDraft}

[선택된 직무]: ${jobRole}

[채용 공고(JD)]:
${fullJobPosting}
`;
            const critiqueReport = await callGemini(PROMPT_STEP_3_CRITIC, prompt3, jobOption, { useThinkingMode });

            // --- 4단계: 전략 수립 (Strategist) ---
            setLoadingStatus("4/5단계: AI 전략가가 합격을 위한 구체적인 수정 전략을 수립 중입니다...");
            const prompt4 = `
[2단계 결과물]:
${generatedDraft}

[3단계 비판 리포트]:
${critiqueReport}

[채용 공고(JD)]:
${fullJobPosting}
`;
            const strategyReport = await callGemini(PROMPT_STEP_4_STRATEGIST, prompt4, jobOption, { useThinkingMode });
            
            // Store analysis report (Critique + Strategy) for the user to see in the tab
            setAnalysisReport(`${critiqueReport}\n\n${strategyReport}`);

            // --- 5단계: 최종 완성 (Editor) ---
            setLoadingStatus("5/5단계: 총괄 에디터가 전략을 반영하여 최종 자소서를 완성하고 팩트를 검증 중입니다...");
            const prompt5 = `
[2단계 결과물]:
${generatedDraft}

[4단계 수정 전략]:
${strategyReport}

[사용자 배경 정보 원본]:
${fullUserInfo}
`;
            const finalResult = await callGemini(PROMPT_STEP_5_EDITOR, prompt5, jobOption, { useThinkingMode });
            setFinalJasaoseo(finalResult);
            
            // 크레딧 차감 (구독자가 아닌 경우에만)
            await useCredit();
            
        } catch (err) {
            console.error("Pipeline error:", err);
            const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
            setError(`오류가 발생했습니다: ${errorMessage}. 잠시 후 다시 시도해주세요.`);
            alert(`오류가 발생했습니다: ${errorMessage}. 콘솔을 확인해주세요.`);
        } finally {
            setIsLoading(false);
            setLoadingStatus('');
        }
    }, [inputState, user, canUseService, useCredit]);

    const handleRevision = useCallback(async () => {
        if (!revisionRequest.trim()) {
            alert("수정 요청사항을 입력해주세요.");
            return;
        }

        setIsRevising(true);
        setError(null);

        try {
            const { jobRole, userInfo, uploadedFiles, useThinkingMode } = inputState;
            const jobOption = jobRole as JobOption;

            // Reconstruct full user info for context
            const userInfoFileContent = uploadedFiles
            .filter(f => f.category === 'userInfo')
            .map(f => `[첨부파일: ${f.name}]\n${f.content}`)
            .join('\n\n');
            const fullUserInfo = `${userInfo}\n\n${userInfoFileContent}`.trim();

            // --- 수정 단계 (Using Editor Persona) ---
            // Treat the user's request as the "Strategy" for the Editor
            const revisionPrompt = `
[2단계 결과물]:
${finalJasaoseo}

[4단계 수정 전략 (사용자 요청사항)]:
${revisionRequest}

[사용자 배경 정보 원본]:
${fullUserInfo}
`;
            
            const revisedJasaoseo = await callGemini(PROMPT_STEP_5_EDITOR, revisionPrompt, jobOption, { useThinkingMode });
            setFinalJasaoseo(revisedJasaoseo);
            
            setRevisionRequest(''); // Clear input after successful revision

        } catch (err) {
            console.error("Revision error:", err);
            const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
            setError(`수정 중 오류가 발생했습니다: ${errorMessage}. 잠시 후 다시 시도해주세요.`);
            alert(`수정 중 오류가 발생했습니다: ${errorMessage}. 콘솔을 확인해주세요.`);
        } finally {
            setIsRevising(false);
        }
    }, [revisionRequest, finalJasaoseo, inputState]);

    return (
        <div className="min-h-screen bg-slate-100">
            {/* 상단 네비게이션 바 */}
            <nav className="bg-white shadow-sm sticky top-0 z-40">
                <div className="container mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
                    <a href="./index.html" className="flex items-center gap-2">
                        <span className="text-xl font-bold text-blue-600">CareerFlow</span>
                        <span className="text-xl font-light text-slate-800">AI</span>
                    </a>
                    <UserHeader onOpenPricing={() => setShowPricingModal(true)} />
                </div>
            </nav>
            
            <div className="container mx-auto max-w-7xl p-4 md:p-8">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800">최종 합격을 위한 AI 자소서 치트키</h1>
                    <p className="text-lg text-slate-600 mt-2">단 5분 만에, 인사 담당자를 사로잡는 자기소개서를 완성하세요.</p>
                    
                    {/* 남은 횟수 표시 */}
                    {userProfile && (() => {
                        const credits = getRemainingCredits();
                        if (credits.type === 'unlimited') {
                            return (
                                <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-full text-sm font-medium border border-green-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    프리미엄 무제한 이용 중
                                </div>
                            );
                        }
                        return (
                            <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-2 rounded-full text-sm font-medium border border-amber-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {credits.type === 'points' 
                                    ? `포인트 ${credits.count}회 남음` 
                                    : `이번 달 무료 ${credits.count}회 남음`}
                                <button 
                                    onClick={() => setShowPricingModal(true)}
                                    className="ml-2 text-blue-600 hover:underline"
                                >
                                    충전하기
                                </button>
                            </div>
                        );
                    })()}
                </header>
                
                <InputSection
                    inputState={inputState}
                    setInputState={setInputState}
                    onGenerate={handleGeneratePipeline}
                    isLoading={isLoading}
                />

                {isLoading && <LoadingIndicator status={loadingStatus} />}
                
                {error && <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg my-4">{error}</div>}

                {!isLoading && (analysisReport || finalJasaoseo) && (
                    <OutputSection 
                        analysisReport={analysisReport} 
                        finalJasaoseo={finalJasaoseo}
                        proofreadingResult={proofreadingResult}
                        revisionRequest={revisionRequest}
                        setRevisionRequest={setRevisionRequest}
                        onRevision={handleRevision}
                        isRevising={isRevising}
                        isLoading={isLoading}
                    />
                )}
            </div>
            
            {/* 모달들 */}
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />
        </div>
    );
};

// AuthProvider로 감싸는 최상위 App 컴포넌트
const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
