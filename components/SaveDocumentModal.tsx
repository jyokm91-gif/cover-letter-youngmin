import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveDocument, updateDocument } from '../services/documentService';
import { InputState } from '../types';

interface SaveDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    inputState: InputState;
    finalJasaoseo: string;
    analysisReport: string;
    existingDocId?: string | null;
    existingTitle?: string;
    onSaveSuccess: (docId: string, title: string) => void;
}

const SaveDocumentModal: React.FC<SaveDocumentModalProps> = ({ 
    isOpen, 
    onClose, 
    inputState,
    finalJasaoseo,
    analysisReport,
    existingDocId,
    existingTitle,
    onSaveSuccess
}) => {
    const { user } = useAuth();
    const [title, setTitle] = useState(existingTitle || '');
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setTitle(existingTitle || generateDefaultTitle());
        }
    }, [isOpen, existingTitle]);

    const generateDefaultTitle = () => {
        const jobLabels: { [key: string]: string } = {
            'marketing': '마케팅',
            'it': 'IT/개발',
            'sales_hr': '영업/인사',
            'management': '경영/기획',
        };
        const jobLabel = jobLabels[inputState.jobRole] || inputState.jobRole;
        const date = new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        return `${jobLabel} 자소서 - ${date}`;
    };

    const handleSave = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (!title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        setSaving(true);
        try {
            let docId: string;
            
            if (existingDocId) {
                // 기존 문서 업데이트
                await updateDocument(user.uid, existingDocId, {
                    title: title.trim(),
                    inputState,
                    finalJasaoseo,
                    analysisReport,
                });
                docId = existingDocId;
            } else {
                // 새 문서 저장
                docId = await saveDocument(user.uid, {
                    title: title.trim(),
                    inputState,
                    finalJasaoseo,
                    analysisReport,
                });
            }
            
            onSaveSuccess(docId, title.trim());
            onClose();
        } catch (error) {
            console.error('Error saving document:', error);
            alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {existingDocId ? '문서 업데이트' : '문서 저장'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {existingDocId ? '변경사항을 저장합니다' : '작성한 내용을 저장합니다'}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 제목 입력 */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        문서 제목
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="예: 삼성전자 마케팅 지원서"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                    />
                </div>

                {/* 저장 내용 미리보기 */}
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">저장될 내용</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                        <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            입력한 배경 정보 및 채용 공고
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            자기소개서 문항
                        </li>
                        {finalJasaoseo && (
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                생성된 자기소개서
                            </li>
                        )}
                        {analysisReport && (
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                분석 리포트
                            </li>
                        )}
                    </ul>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !title.trim()}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                저장 중...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                {existingDocId ? '업데이트' : '저장하기'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SaveDocumentModal;
