import React, { useRef } from 'react';
import type { InputState } from '../types';
import { EXPERIENCE_TEMPLATE } from '../constants';
import InfoIcon from './icons/InfoIcon';

interface InputSectionProps {
    inputState: InputState;
    setInputState: React.Dispatch<React.SetStateAction<InputState>>;
    onGenerate: () => void;
    isLoading: boolean;
}

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
    <div className="group relative flex items-center">
        {children}
        <div className="absolute left-full ml-2 bottom-1/2 transform translate-y-1/2 w-64 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg">
            {text}
        </div>
    </div>
);

const InputSection: React.FC<InputSectionProps> = ({ inputState, setInputState, onGenerate, isLoading }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setInputState(prevState => ({ ...prevState, [name]: checked }));
        } else {
            setInputState(prevState => ({ ...prevState, [name]: value }));
        }
    };

    const addTemplate = () => {
        setInputState(prev => ({
            ...prev,
            userInfo: prev.userInfo ? `${prev.userInfo}\n\n${EXPERIENCE_TEMPLATE}` : EXPERIENCE_TEMPLATE
        }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        e.target.value = '';

        if (file.type !== 'text/plain' && file.type !== 'text/markdown') {
            alert('지원되지 않는 파일 형식입니다. .txt 또는 .md 파일을 업로드해주세요.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setInputState(prev => ({...prev, userInfo: text}));
            alert(`${file.name} 파일의 내용을 성공적으로 불러왔습니다.`);
        };
        reader.onerror = (error) => {
            console.error("File reading error:", error);
            alert("파일을 읽는 중 오류가 발생했습니다.");
        };
        reader.readAsText(file, 'UTF-8');
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-2xl font-semibold text-slate-700 mb-5 border-b pb-3">1. 필수 정보 입력</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="jobRole" className="block text-sm font-medium text-gray-700 mb-1">지원 직무 선택</label>
                        <select id="jobRole" name="jobRole" value={inputState.jobRole} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
                            <option value="">-- 직무를 선택하세요 --</option>
                            <option value="marketing">마케팅/광고/홍보</option>
                            <option value="it">IT/인터넷/데이터</option>
                            <option value="sales_hr">영업/고객서비스/HR</option>
                            <option value="management">경영/기획/사무</option>
                            <option value="other">기타 (범용 로직)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="jobPosting" className="block text-sm font-medium text-gray-700 mb-1">채용 공고 (JD)</label>
                        <textarea id="jobPosting" name="jobPosting" value={inputState.jobPosting} onChange={handleInputChange} rows={10} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="지원할 회사의 채용 공고 내용을 여기에 붙여넣으세요..."></textarea>
                    </div>
                    <div>
                        <label htmlFor="jasaoseoQuestions" className="block text-sm font-medium text-gray-700 mb-1">자기소개서 문항</label>
                        <textarea id="jasaoseoQuestions" name="jasaoseoQuestions" value={inputState.jasaoseoQuestions} onChange={handleInputChange} rows={8} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="예: 1. 지원동기를 서술하시오 (1000자)&#10;2. 본인의 강점과 약점을 서술하시오 (800자)"></textarea>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="userInfo" className="block text-sm font-medium text-gray-700">사용자 배경 정보</label>
                            <div className="flex items-center gap-2">
                                <button onClick={addTemplate} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-2 rounded-md transition-colors">템플릿 추가</button>
                                <button onClick={triggerFileSelect} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-2 rounded-md transition-colors">파일 업로드</button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt,.md" className="hidden" />
                            </div>
                        </div>
                        <textarea id="userInfo" name="userInfo" value={inputState.userInfo} onChange={handleInputChange} rows={18} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="본인의 이력서, 경력기술서, 포트폴리오, 관련 경험, 성과 등을 여기에 붙여넣으세요..."></textarea>
                        <div className="mt-1 p-2 bg-amber-50 text-amber-800 text-xs rounded-md border border-amber-200">
                            <strong>Tip:</strong> 배경 정보가 구체적이고 풍부할수록 AI가 생성하는 자기소개서의 품질이 향상됩니다.
                        </div>
                    </div>
                    <div>
                        <label htmlFor="initialDraft" className="block text-sm font-medium text-gray-700 mb-1">자기소개서 초안 (선택 사항)</label>
                        <textarea id="initialDraft" name="initialDraft" value={inputState.initialDraft} onChange={handleInputChange} rows={6} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="기존에 작성한 초안이 있다면 여기에 붙여넣으세요. AI가 이 내용을 바탕으로 개선합니다."></textarea>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t">
                <h3 className="text-lg font-semibold text-slate-600 mb-3">고급 AI 설정</h3>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" name="useThinkingMode" checked={inputState.useThinkingMode} onChange={handleInputChange} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-gray-700">심층 분석 모드 (Gemini Pro)</span>
                         <Tooltip text="Gemini 2.5 Pro의 'Thinking Mode'를 활성화하여 더 깊이 있는 분석과 정교한 피드백을 받습니다. 복잡한 직무나 높은 수준의 자기소개서가 필요할 때 유용합니다.">
                            <InfoIcon />
                        </Tooltip>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" name="useSearchGrounding" checked={inputState.useSearchGrounding} onChange={handleInputChange} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-gray-700">최신 정보 검색 (Google Search)</span>
                        <Tooltip text="AI 분석 단계에서 Google 검색을 활용하여 회사, 산업, 직무에 대한 최신 정보를 반영합니다. 시의성이 중요한 직무 분석에 정확도를 높입니다.">
                           <InfoIcon />
                        </Tooltip>
                    </label>
                </div>
            </div>
            
            <div className="mt-6 text-center">
                <button onClick={onGenerate} disabled={isLoading} className="w-full md:w-1/2 bg-blue-600 text-white font-bold text-lg py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isLoading ? '생성 중...' : 'AI 자기소개서 생성 시작'}
                </button>
            </div>
        </div>
    );
};

export default InputSection;
