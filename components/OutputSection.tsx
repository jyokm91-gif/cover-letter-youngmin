import React, { useState, useCallback } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import ProofreadingView from './ProofreadingView';
import type { ProofreadingIssue } from '../types';

interface OutputSectionProps {
    analysisReport: string;
    finalJasaoseo: string;
    proofreadingResult: ProofreadingIssue[] | null;
}

type Tab = 'jasaoseo' | 'analysis' | 'proofread';

const OutputSection: React.FC<OutputSectionProps> = ({ analysisReport, finalJasaoseo, proofreadingResult }) => {
    const [copyMessage, setCopyMessage] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('jasaoseo');

    const handleCopy = useCallback(() => {
        if (!finalJasaoseo) return;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = finalJasaoseo
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<[^>]+>/g, (match) => {
                if (match.match(/<h[1-3]>/)) return '\n\n';
                if (match.match(/<p>/)) return '\n\n';
                if (match.match(/<li>/)) return '\n* ';
                return '';
            });
        const textToCopy = tempDiv.innerText.trim();

        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopyMessage("클립보드에 복사되었습니다!");
            setTimeout(() => setCopyMessage(''), 2000);
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            setCopyMessage("복사에 실패했습니다.");
        });
    }, [finalJasaoseo]);
    
    const renderTabContent = () => {
        switch(activeTab) {
            case 'jasaoseo':
                return (
                    <>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 h-96 overflow-y-auto">
                            {finalJasaoseo ? (
                                <MarkdownRenderer content={finalJasaoseo} />
                            ) : (
                                <p className="text-gray-500">최종 자기소개서 생성 대기 중...</p>
                            )}
                        </div>
                        {finalJasaoseo && (
                             <button onClick={handleCopy} className="mt-4 w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                                최종본 복사하기
                            </button>
                        )}
                        {copyMessage && (
                            <div className="text-center text-green-700 font-medium mt-2">{copyMessage}</div>
                        )}
                    </>
                );
            case 'analysis':
                return (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-[28.5rem] overflow-y-auto">
                        {analysisReport ? (
                            <MarkdownRenderer content={analysisReport} />
                        ) : (
                            <p className="text-gray-500">분석 리포트 생성 대기 중...</p>
                        )}
                    </div>
                );
            case 'proofread':
                return (
                     <div className="bg-green-50 p-4 rounded-lg border border-green-200 h-[28.5rem] overflow-y-auto">
                        {proofreadingResult ? (
                            <ProofreadingView issues={proofreadingResult} />
                        ) : (
                            <p className="text-gray-500">맞춤법 검사 결과 대기 중...</p>
                        )}
                    </div>
                )
        }
    }
    
    const getTabClass = (tabName: Tab) => {
        return `px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === tabName ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-transparent text-gray-500 hover:bg-slate-100'}`;
    };

    return (
        <div id="outputSection" className="bg-white p-6 rounded-2xl shadow-lg">
             <div className="border-b border-slate-200 mb-4">
                <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                    <button onClick={() => setActiveTab('jasaoseo')} className={getTabClass('jasaoseo')}>
                        최종 자기소개서
                    </button>
                    <button onClick={() => setActiveTab('analysis')} className={getTabClass('analysis')}>
                        AI 전문가 분석 리포트
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
            
            {renderTabContent()}
        </div>
    );
};

export default OutputSection;
