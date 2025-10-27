import React, { useState, useCallback } from 'react';
import { InputState, JobOption, ProofreadingIssue } from './types';
import { JOB_LOGICS, GEM1_SYSTEM_PROMPT, GEM2_SYSTEM_PROMPT, GEM3_SYSTEM_PROMPT } from './constants';
import { callGemini, callProofreaderGemini } from './services/geminiService';
import InputSection from './components/InputSection';
import LoadingIndicator from './components/LoadingIndicator';
import OutputSection from './components/OutputSection';

const App: React.FC = () => {
    const [inputState, setInputState] = useState<InputState>({
        jobRole: '',
        jobPosting: '',
        userInfo: '',
        jasaoseoQuestions: '',
        initialDraft: '',
        useSearchGrounding: false,
        useThinkingMode: true,
    });
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingStatus, setLoadingStatus] = useState<string>('');
    const [analysisReport, setAnalysisReport] = useState<string>('');
    const [finalJasaoseo, setFinalJasaoseo] = useState<string>('');
    const [proofreadingResult, setProofreadingResult] = useState<ProofreadingIssue[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGeneratePipeline = useCallback(async () => {
        const { jobRole, jobPosting, userInfo, jasaoseoQuestions, initialDraft, useSearchGrounding, useThinkingMode } = inputState;

        if (!jobRole || !jobPosting || !userInfo || !jasaoseoQuestions) {
            alert("직무 선택, 채용 공고, 사용자 정보, 자소서 문항은 필수 입력 항목입니다.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisReport('');
        setFinalJasaoseo('');
        setProofreadingResult(null);
        
        try {
            const selectedLogic = JOB_LOGICS[jobRole as JobOption];

            // --- 1단계: 초안 생성 (Gem 1 - Flash) ---
            setLoadingStatus("AI가 자기소개서를 작성 중입니다... (1/4 단계)");
            const prompt1 = initialDraft
                ? `## [필수 입력 데이터]\n[직무별 AI 자소서 첨삭 로직]:\n${selectedLogic}\n\n[사용자 배경 정보]:\n${userInfo}\n\n[채용 정보]:\n${jobPosting}\n\n[문항 정보]:\n${jasaoseoQuestions}\n\n[사용자 제공 초안]:\n${initialDraft}\n\n## [1차 임무: 생성]\n당신의 임무(워크플로우 A)를 수행하십시오. 위 데이터를 기반으로 하되, 특히 [사용자 제공 초안]을 바탕으로 이를 *개선하고 발전시킨* 자기소개서를 생성하십시오.`
                : `## [필수 입력 데이터]\n[직무별 AI 자소서 첨삭 로직]:\n${selectedLogic}\n\n[사용자 배경 정보]:\n${userInfo}\n\n[채용 정보]:\n${jobPosting}\n\n[문항 정보]:\n${jasaoseoQuestions}\n\n## [1차 임무: 생성]\n당신의 임무(워크플로우 A)를 수행하십시오. 위 데이터를 기반으로 새로운 자기소개서를 생성하십시오.`;
            
            const generatedDraft = await callGemini(GEM1_SYSTEM_PROMPT, prompt1);
            
            // --- 2단계: 분석 (Gem 2 - Pro w/ Thinking) ---
            setLoadingStatus("AI 전문가가 초안을 분석 중입니다... (2/4 단계)");
            const prompt2 = `## [필수 입력 데이터]\n[평가 대상 자기소개서]:\n${generatedDraft}\n\n[채용 공고(JD)]:\n${jobPosting}\n\n[지원자 배경 정보]:\n${userInfo}\n\n## [임무]\n당신의 역할(최고 인재 책임자)을 수행하십시오. 위 데이터를 바탕으로 [평가 대상 자기소개서]를 냉철하게 분석하고, [자기소개서 수정 제안 보고서]를 [5. 출력 형식]에 맞춰 정확하게 생성하십시오.`;
            
            const report = await callGemini(GEM2_SYSTEM_PROMPT, prompt2, { useSearchGrounding, useThinkingMode });
            setAnalysisReport(report);

            // --- 3단계: 수정본 생성 (Gem 1 - Flash) ---
            setLoadingStatus("AI가 분석 리포트를 반영하여 수정 중입니다... (3/4 단계)");
            const prompt3 = `## [필수 입력 데이터]\n[직무별 AI 자소서 첨삭 로직]:\n${selectedLogic}\n\n[사용자 배경 정보]:\n${userInfo}\n\n[채용 정보]:\n${jobPosting}\n\n[문항 정보]:\n${jasaoseoQuestions}\n\n[초안 자기소개서]:\n${generatedDraft}\n\n[전문가 수정 제안]:\n${report}\n\n## [2차 임무: 수정]\n당신의 임무(워크플로우 B)를 수행하십시오. 당신이 작성했던 [초안 자기소개서]와 방금 받은 [전문가 수정 제안]을 확인했습니다.\n[전문가 수정 제안]에 담긴 **모든 피드백과 지적 사항을 100% 수용하고 완벽하게 반영**하여, [초안 자기소개서]를 전면적으로 *수정한* 최종 자기소개서를 생성하십시오.\n최종본만 [5. 출력 형식]에 맞춰 마크다운으로 깔끔하게 출력합니다.`;

            const finalResult = await callGemini(GEM1_SYSTEM_PROMPT, prompt3);
            setFinalJasaoseo(finalResult);
            
            // --- 4단계: 맞춤법 검사 (Gem 3 - Flash Lite) ---
            setLoadingStatus("AI가 맞춤법 및 문법을 검사 중입니다... (4/4 단계)");
            const proofread = await callProofreaderGemini(GEM3_SYSTEM_PROMPT, finalResult);
            setProofreadingResult(proofread);

        } catch (err) {
            console.error("Pipeline error:", err);
            const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
            setError(`오류가 발생했습니다: ${errorMessage}. 잠시 후 다시 시도해주세요.`);
            alert(`오류가 발생했습니다: ${errorMessage}. 콘솔을 확인해주세요.`);
        } finally {
            setIsLoading(false);
            setLoadingStatus('');
        }
    }, [inputState]);

    return (
        <div className="container mx-auto max-w-7xl p-4 md:p-8">
            <header className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">AI 자기소개서 생성 & 첨삭 파이프라인</h1>
                <p className="text-lg text-slate-600 mt-2">두 개의 AI Gem이 협력하여 최고의 자기소개서를 완성합니다.</p>
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
                />
            )}
        </div>
    );
};

export default App;
