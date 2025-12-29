import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserDocuments, deleteDocument, SavedDocument } from '../services/documentService';

interface MyDocumentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadDocument: (doc: SavedDocument) => void;
}

const MyDocumentsModal: React.FC<MyDocumentsModalProps> = ({ isOpen, onClose, onLoadDocument }) => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<SavedDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && user) {
            loadDocuments();
        }
    }, [isOpen, user]);

    const loadDocuments = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const docs = await getUserDocuments(user.uid);
            setDocuments(docs);
        } catch (error) {
            console.error('Error loading documents:', error);
            alert('문서를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (docId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        
        if (!confirm('정말로 이 문서를 삭제하시겠습니까?')) return;
        
        setDeletingId(docId);
        try {
            await deleteDocument(user.uid, docId);
            setDocuments(docs => docs.filter(d => d.id !== docId));
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('문서 삭제 중 오류가 발생했습니다.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleLoad = (doc: SavedDocument) => {
        onLoadDocument(doc);
        onClose();
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const getJobRoleLabel = (jobRole: string) => {
        const labels: { [key: string]: string } = {
            'marketing': '마케팅',
            'it': 'IT/개발',
            'sales_hr': '영업/인사',
            'management': '경영/기획',
        };
        return labels[jobRole] || jobRole;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* 헤더 */}
                <div className="p-6 border-b flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">내 문서함</h2>
                        <p className="text-sm text-slate-500 mt-1">저장된 자기소개서를 불러오거나 삭제할 수 있습니다</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 문서 목록 */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500">저장된 문서가 없습니다</p>
                            <p className="text-sm text-gray-400 mt-1">자기소개서를 생성한 후 저장해보세요</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    onClick={() => handleLoad(doc)}
                                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-800 truncate group-hover:text-blue-600">
                                                {doc.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                    {getJobRoleLabel(doc.jobRole)}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {formatDate(doc.updatedAt)}
                                                </span>
                                            </div>
                                            {doc.jasaoseoQuestions && (
                                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                                    {doc.jasaoseoQuestions.slice(0, 100)}...
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(doc.id, e)}
                                            disabled={deletingId === doc.id}
                                            className="ml-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            {deletingId === doc.id ? (
                                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                <div className="p-4 border-t bg-slate-50 rounded-b-2xl">
                    <p className="text-xs text-center text-gray-500">
                        문서를 클릭하면 불러옵니다 • 총 {documents.length}개 문서
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MyDocumentsModal;
