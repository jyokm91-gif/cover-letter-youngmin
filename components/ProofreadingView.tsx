import React from 'react';
import type { ProofreadingIssue } from '../types';

interface ProofreadingViewProps {
    issues: ProofreadingIssue[];
}

const ProofreadingView: React.FC<ProofreadingViewProps> = ({ issues }) => {
    if (issues.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-slate-800">완벽합니다!</h3>
                <p className="text-slate-600 mt-1">AI가 맞춤법 및 문법 오류를 발견하지 못했습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {issues.map((issue, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                    <div className="mb-2">
                        <span className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded-full">원본</span>
                        <p className="mt-1 text-slate-600 line-through decoration-red-500">{issue.original}</p>
                    </div>
                    <div className="mb-3">
                        <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">수정 제안</span>
                        <p className="mt-1 text-slate-800 font-medium">{issue.corrected}</p>
                    </div>
                    <div className="text-right">
                         <span className="text-sm font-semibold text-slate-500">{issue.reason}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProofreadingView;
