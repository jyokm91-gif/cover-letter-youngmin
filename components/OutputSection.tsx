
import React, { useState, useCallback } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import ProofreadingView from './ProofreadingView';
import type { ProofreadingIssue } from '../types';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';

interface OutputSectionProps {
    analysisReport: string;
    finalJasaoseo: string;
    proofreadingResult: ProofreadingIssue[] | null;
    revisionRequest: string;
    setRevisionRequest: React.Dispatch<React.SetStateAction<string>>;
    onRevision: () => void;
    isRevising: boolean;
    isLoading: boolean;
}

type Tab = 'jasaoseo' | 'analysis' | 'proofread';

const OutputSection: React.FC<OutputSectionProps> = ({ 
    analysisReport, 
    finalJasaoseo, 
    proofreadingResult,
    revisionRequest,
    setRevisionRequest,
    onRevision,
    isRevising,
    isLoading
}) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [activeTab, setActiveTab] = useState<Tab>('jasaoseo');

    const handleCopy = useCallback(() => {
        if (!finalJasaoseo) return;

        navigator.clipboard.writeText(finalJasaoseo).then(() => {
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            alert('클립보드 복사에 실패했습니다.');
        });
    }, [finalJasaoseo]);
    
    const getTabClass = (tabName: Tab) => {
        return `px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors focus:outline-none ${
            activeTab === tabName 
            ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
            : 'bg-transparent text-gray-500 hover:bg-slate-100 hover:text-gray-700'
        }`;
    };

    return (
        <div id="outputSection" className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold text-slate-700 mb-5 border-b pb-3">2. AI 생성 결과</h2>
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                    <button onClick={() => setActiveTab('jasaoseo')} className={getTabClass('jasaoseo')}>
                        최종 자기소개서
                    </button>
                    <button onClick={() => setActiveTab('analysis')} className={getTabClass('analysis')}>
                        AI 분석 리포트 (상세 보기)
                    </button>
                    {proofreadingResult && (
                        <button onClick={() => setActiveTab('proofread')} className={getTabClass('proofread')}>
                            맞춤법 검사
                            {proofreadingResult.length > 0 && 
                                <span className="ml-2 inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{proofreadingResult.length}</span>
                            }
                        </button>
                    )}
                </nav>
            </div>
            
            <div className="mt-4">
                {activeTab === 'analysis' && (
                    <div className="border border-slate-200 rounded-lg shadow-sm">
                        <div className="p-3 border-b bg-slate-50 rounded-t-lg">
                             <h3 className="text-base font-semibold text-slate-800">AI 전문가 분석 리포트</h3>
                        </div>
                        <div className="p-4 h-[30rem] overflow-y-auto bg-white rounded-b-lg">
                             {analysisReport ? <MarkdownRenderer content={analysisReport} /> : <p className="text-gray-500">분석 리포트 생성 대기 중...</p>}
                        </div>
                    </div>
                )}
                {activeTab === 'proofread' && proofreadingResult && (
                    <div className="border border-slate-200 rounded-lg shadow-sm">
                        <div className="p-3 border-b bg-slate-50 rounded-t-lg">
                            <h3 className="text-base font-semibold text-slate-800">맞춤법 검사 결과</h3>
                        </div>
                        <div className="p-4 h-[30rem] overflow-y-auto bg-white rounded-b-lg">
                            <ProofreadingView issues={proofreadingResult} />
                        </div>
                    </div>
                )}
                {activeTab === 'jasaoseo' && (
                    <div className="border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center p-3 border-b bg-slate-50 rounded-t-lg">
                            <h3 className="text-base font-semibold text-slate-800">최종 자기소개서</h3>
                             <button 
                                onClick={handleCopy} 
                                className="flex items-center gap-2 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-1 px-3 rounded-md transition-colors disabled:opacity-50"
                                disabled={!finalJasaoseo || copyStatus === 'copied'}
                            >
                                {copyStatus === 'copied' ? <CheckIcon /> : <CopyIcon />}
                                {copyStatus === 'copied' ? '복사 완료!' : '텍스트로 복사'}
                            </button>
                        </div>
                        <div className="p-4 h-[30rem] overflow-y-auto bg-white">
                            {finalJasaoseo ? <MarkdownRenderer content={finalJasaoseo} /> : <p className="text-gray-500">최종 자기소개서 생성 대기 중...</p>}
                        </div>
                        
                        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-lg">
                            <h4 className="text-md font-semibold text-slate-700 mb-2">AI에게 직접 수정 요청하기</h4>
                            <textarea
                                value={revisionRequest}
                                onChange={(e) => setRevisionRequest(e.target.value)}
                                rows={4}
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="예: 1번 문항의 두 번째 문장을 좀 더 전문적인 톤으로 바꿔주세요."
                                disabled={isRevising || isLoading}
                            />
                            <div className="mt-3 text-right">
                                <button
                                    onClick={onRevision}
                                    disabled={isRevising || isLoading || !revisionRequest.trim()}
                                    className="bg-blue-600 text-white font-bold py-2 px-5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isRevising ? '수정 중...' : '수정 요청'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OutputSection;
