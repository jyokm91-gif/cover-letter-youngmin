
import React, { useRef, useState, useEffect } from 'react';
import type { InputState, UploadedFile } from '../types';
import { EXPERIENCE_TEMPLATE, JOB_POSTING_TEMPLATE } from '../constants';
import InfoIcon from './icons/InfoIcon';
import * as pdfjsLib from 'pdfjs-dist';
import { extractTextFromImage } from '../services/geminiService';

// Set the worker source dynamically based on the installed pdfjs-dist version
const pdfjsVersion = pdfjsLib.version;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`;

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

const FileList: React.FC<{ files: UploadedFile[]; onRemove: (id: string) => void }> = ({ files, onRemove }) => {
    if (files.length === 0) return null;
    return (
        <div className="mt-2 flex flex-wrap gap-2">
            {files.map(file => (
                <div key={file.id} className="flex items-center gap-2 bg-slate-100 text-slate-700 text-sm px-3 py-1.5 rounded-full border border-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button onClick={() => onRemove(file.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
};

const InputSection: React.FC<InputSectionProps> = ({ inputState, setInputState, onGenerate, isLoading }) => {
    const userInfoFileInputRef = useRef<HTMLInputElement>(null);
    const draftFileInputRef = useRef<HTMLInputElement>(null);
    const jobPostingFileInputRef = useRef<HTMLInputElement>(null);
    const jobPostingImageInputRef = useRef<HTMLInputElement>(null);
    const [isExtractingText, setIsExtractingText] = useState(false);
    const [isUploadingJobPosting, setIsUploadingJobPosting] = useState(false);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setInputState(prevState => ({ ...prevState, [name]: checked }));
        } else {
            setInputState(prevState => ({ ...prevState, [name]: value }));
        }
    };

    const addExperienceTemplate = () => {
        setInputState(prev => ({
            ...prev,
            userInfo: prev.userInfo ? `${prev.userInfo}\n\n${EXPERIENCE_TEMPLATE}` : EXPERIENCE_TEMPLATE
        }));
    };

    const addJobPostingTemplate = () => {
        setInputState(prev => ({
            ...prev,
            jobPosting: prev.jobPosting ? `${prev.jobPosting}\n\n${JOB_POSTING_TEMPLATE}` : JOB_POSTING_TEMPLATE
        }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: 'userInfo' | 'initialDraft' | 'jobPosting') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        if (category === 'jobPosting') {
            setIsUploadingJobPosting(true);
        }
        
        // Count existing files in this category
        const existingCount = inputState.uploadedFiles.filter(f => f.category === category).length;
        if (existingCount + files.length > 5) {
            alert('각 항목당 최대 5개의 파일만 업로드할 수 있습니다.');
            e.target.value = ''; // Reset file input
            return;
        }

        const fileReadPromises: Promise<UploadedFile>[] = [];

        Array.from(files).forEach((file: File) => {
            if (file.type === 'application/pdf') {
                const promise = new Promise<UploadedFile>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const arrayBuffer = event.target?.result as ArrayBuffer;
                            if (!arrayBuffer) {
                                return reject(`파일(${file.name})을 읽을 수 없습니다.`);
                            }
                            const pdf = await pdfjsLib.getDocument({ 
                                data: new Uint8Array(arrayBuffer),
                                useWorkerFetch: false,
                                isEvalSupported: false,
                                useSystemFonts: true
                            }).promise;
                            let pdfText = '';
                            for (let i = 1; i <= pdf.numPages; i++) {
                                const page = await pdf.getPage(i);
                                const textContent = await page.getTextContent();
                                pdfText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
                            }
                            resolve({
                                id: Math.random().toString(36).substr(2, 9),
                                name: file.name,
                                content: pdfText,
                                category
                            });
                        } catch (error) {
                            console.error(`Error parsing PDF ${file.name}:`, error);
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            reject(`PDF 파일(${file.name}) 처리 중 오류 발생: ${errorMessage}`);
                        }
                    };
                    reader.onerror = () => reject(`파일(${file.name}) 읽기 오류`);
                    reader.readAsArrayBuffer(file);
                });
                fileReadPromises.push(promise);
            } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
                const promise = new Promise<UploadedFile>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                       const textContent = event.target?.result as string;
                       resolve({
                           id: Math.random().toString(36).substr(2, 9),
                           name: file.name,
                           content: textContent,
                           category
                       });
                    };
                    reader.onerror = () => reject(`파일(${file.name}) 읽기 오류`);
                    reader.readAsText(file, 'UTF-8');
                });
                fileReadPromises.push(promise);
            } else {
                 alert(`지원되지 않는 파일 형식입니다: ${file.name}. .txt, .md, .pdf 파일만 업로드해주세요.`);
            }
        });

        try {
            const newFiles = await Promise.all(fileReadPromises);
            setInputState(prev => ({
                ...prev,
                uploadedFiles: [...prev.uploadedFiles, ...newFiles]
            }));
        } catch (error) {
            alert(String(error));
        } finally {
            if (e.target) {
                e.target.value = ''; // Reset file input
            }
            setIsUploadingJobPosting(false);
        }
    };

    const handleRemoveFile = (id: string) => {
        setInputState(prev => ({
            ...prev,
            uploadedFiles: prev.uploadedFiles.filter(f => f.id !== id)
        }));
    };

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const base64String = dataUrl.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
    
        if (files.length > 5) {
            alert('최대 5개의 이미지만 업로드할 수 있습니다.');
            e.target.value = '';
            return;
        }
        
        setIsExtractingText(true);
    
        const imageReadPromises: Promise<string>[] = [];
    
        Array.from(files).forEach((file: File) => {
            const promise = (async () => {
                try {
                    const base64Data = await blobToBase64(file);
                    const extractedText = await extractTextFromImage(base64Data, file.type);
                    return `--- START OF IMAGE TEXT: ${file.name} ---\n\n${extractedText}\n--- END OF IMAGE TEXT: ${file.name} ---`;
                } catch (error) {
                    console.error(`Error processing image ${file.name}:`, error);
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    throw new Error(`이미지 파일(${file.name}) 처리 중 오류 발생: ${errorMessage}`);
                }
            })();
            imageReadPromises.push(promise);
        });
    
        try {
            const texts = await Promise.all(imageReadPromises);
            const combinedText = texts.join('\n\n');
            setInputState(prev => ({
                ...prev,
                jobPosting: prev.jobPosting ? `${prev.jobPosting}\n\n${combinedText}` : combinedText
            }));
            alert(`${files.length}개 이미지의 텍스트를 성공적으로 추출했습니다.`);
        } catch (error) {
            alert(String(error));
        } finally {
            setIsExtractingText(false);
            if (e.target) {
                e.target.value = '';
            }
        }
    };

    const triggerUserInfoFileSelect = () => userInfoFileInputRef.current?.click();
    const triggerDraftFileSelect = () => draftFileInputRef.current?.click();
    const triggerJobPostingFileSelect = () => jobPostingFileInputRef.current?.click();
    const triggerJobPostingImageSelect = () => jobPostingImageInputRef.current?.click();

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
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="jobPosting" className="block text-sm font-medium text-gray-700">채용 공고 (JD)</label>
                            <div className="flex items-center gap-2">
                                <button onClick={addJobPostingTemplate} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-2 rounded-md transition-colors">템플릿 추가</button>
                                <button onClick={triggerJobPostingFileSelect} disabled={isUploadingJobPosting} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-1">
                                    {isUploadingJobPosting && (
                                        <svg className="animate-spin h-3 w-3 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    {isUploadingJobPosting ? '업로드 중...' : '파일 업로드'}
                                </button>
                                <input type="file" ref={jobPostingFileInputRef} onChange={(e) => handleFileUpload(e, 'jobPosting')} accept=".txt,.md,.pdf" className="hidden" multiple />
                                <button onClick={triggerJobPostingImageSelect} disabled={isExtractingText} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-1">
                                    {isExtractingText && (
                                        <svg className="animate-spin h-3 w-3 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    {isExtractingText ? '추출 중...' : '이미지 업로드'}
                                </button>
                                <input type="file" ref={jobPostingImageInputRef} onChange={handleImageUpload} accept="image/png,image/jpeg,image/webp" className="hidden" multiple />
                            </div>
                        </div>
                        <textarea id="jobPosting" name="jobPosting" value={inputState.jobPosting} onChange={handleInputChange} rows={8} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="지원할 회사의 채용 공고 내용을 여기에 붙여넣거나 파일을 업로드하세요..."></textarea>
                        
                        {/* Display uploaded files for Job Posting */}
                        <FileList files={inputState.uploadedFiles.filter(f => f.category === 'jobPosting')} onRemove={handleRemoveFile} />
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
                                <button onClick={addExperienceTemplate} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-2 rounded-md transition-colors">템플릿 추가</button>
                                <button onClick={triggerUserInfoFileSelect} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-2 rounded-md transition-colors">파일 업로드 (최대 5개)</button>
                                <input type="file" ref={userInfoFileInputRef} onChange={(e) => handleFileUpload(e, 'userInfo')} accept=".txt,.md,.pdf" className="hidden" multiple />
                            </div>
                        </div>
                        <textarea id="userInfo" name="userInfo" value={inputState.userInfo} onChange={handleInputChange} rows={18} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="본인의 이력서, 경력기술서, 포트폴리오, 관련 경험, 성과 등을 여기에 붙여넣거나 파일을 업로드하세요."></textarea>
                        
                        {/* Display uploaded files for User Info */}
                        <FileList files={inputState.uploadedFiles.filter(f => f.category === 'userInfo')} onRemove={handleRemoveFile} />
                        
                        <div className="mt-1 p-2 bg-amber-50 text-amber-800 text-xs rounded-md border border-amber-200">
                            <strong>Tip:</strong> 배경 정보가 구체적이고 풍부할수록 AI가 생성하는 자기소개서의 품질이 향상됩니다.
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="initialDraft" className="block text-sm font-medium text-gray-700">자기소개서 초안 (선택 사항)</label>
                             <button onClick={triggerDraftFileSelect} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-2 rounded-md transition-colors">이전 지원서 업로드</button>
                             <input type="file" ref={draftFileInputRef} onChange={(e) => handleFileUpload(e, 'initialDraft')} accept=".txt,.md,.pdf" className="hidden" multiple />
                        </div>
                        <textarea id="initialDraft" name="initialDraft" value={inputState.initialDraft} onChange={handleInputChange} rows={6} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="기존에 작성한 초안을 붙여넣거나, 다른 곳에 지원했던 이력서/자소서 파일을 업로드하세요."></textarea>
                        
                        {/* Display uploaded files for Initial Draft */}
                        <FileList files={inputState.uploadedFiles.filter(f => f.category === 'initialDraft')} onRemove={handleRemoveFile} />

                         <div className="mt-1 p-2 bg-blue-50 text-blue-800 text-xs rounded-md border border-blue-200">
                            <strong>Tip:</strong> 다른 지원서라도 업로드하면 AI가 사용자의 경험과 글쓰기 스타일을 파악하여 더 개인화된 결과물을 만듭니다.
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t">
                <h3 className="text-lg font-semibold text-slate-600 mb-3">고급 AI 설정</h3>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" name="useThinkingMode" checked={inputState.useThinkingMode} onChange={handleInputChange} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-gray-700">심층 분석 모드 (Gemini 3.0 Pro)</span>
                         <Tooltip text="Gemini 3.0 Pro의 'Thinking Mode'를 활성화하여 더 깊이 있는 분석과 정교한 피드백을 받습니다. 복잡한 직무나 높은 수준의 자기소개서가 필요할 때 유용합니다.">
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
