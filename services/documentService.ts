import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    getDoc,
    query, 
    orderBy, 
    serverTimestamp,
    Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { InputState } from '../types';

export interface SavedDocument {
    id: string;
    title: string;
    jobRole: string;
    jobPosting: string;
    userInfo: string;
    jasaoseoQuestions: string;
    initialDraft: string;
    finalJasaoseo: string;
    analysisReport: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SaveDocumentData {
    title: string;
    inputState: InputState;
    finalJasaoseo: string;
    analysisReport: string;
}

// 문서 저장
export const saveDocument = async (
    userId: string, 
    data: SaveDocumentData
): Promise<string> => {
    const docRef = await addDoc(collection(db, 'users', userId, 'documents'), {
        title: data.title,
        jobRole: data.inputState.jobRole,
        jobPosting: data.inputState.jobPosting,
        userInfo: data.inputState.userInfo,
        jasaoseoQuestions: data.inputState.jasaoseoQuestions,
        initialDraft: data.inputState.initialDraft,
        finalJasaoseo: data.finalJasaoseo,
        analysisReport: data.analysisReport,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
};

// 문서 업데이트
export const updateDocument = async (
    userId: string,
    documentId: string,
    data: Partial<SaveDocumentData>
): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'documents', documentId);
    const updateData: any = {
        updatedAt: serverTimestamp(),
    };
    
    if (data.title) updateData.title = data.title;
    if (data.inputState) {
        updateData.jobRole = data.inputState.jobRole;
        updateData.jobPosting = data.inputState.jobPosting;
        updateData.userInfo = data.inputState.userInfo;
        updateData.jasaoseoQuestions = data.inputState.jasaoseoQuestions;
        updateData.initialDraft = data.inputState.initialDraft;
    }
    if (data.finalJasaoseo) updateData.finalJasaoseo = data.finalJasaoseo;
    if (data.analysisReport) updateData.analysisReport = data.analysisReport;
    
    await updateDoc(docRef, updateData);
};

// 문서 삭제
export const deleteDocument = async (
    userId: string,
    documentId: string
): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'documents', documentId);
    await deleteDoc(docRef);
};

// 사용자의 모든 문서 가져오기
export const getUserDocuments = async (userId: string): Promise<SavedDocument[]> => {
    const q = query(
        collection(db, 'users', userId, 'documents'),
        orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const documents: SavedDocument[] = [];
    
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
            id: doc.id,
            title: data.title || '제목 없음',
            jobRole: data.jobRole || '',
            jobPosting: data.jobPosting || '',
            userInfo: data.userInfo || '',
            jasaoseoQuestions: data.jasaoseoQuestions || '',
            initialDraft: data.initialDraft || '',
            finalJasaoseo: data.finalJasaoseo || '',
            analysisReport: data.analysisReport || '',
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
        });
    });
    
    return documents;
};

// 단일 문서 가져오기
export const getDocument = async (
    userId: string,
    documentId: string
): Promise<SavedDocument | null> => {
    const docRef = doc(db, 'users', userId, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
        id: docSnap.id,
        title: data.title || '제목 없음',
        jobRole: data.jobRole || '',
        jobPosting: data.jobPosting || '',
        userInfo: data.userInfo || '',
        jasaoseoQuestions: data.jasaoseoQuestions || '',
        initialDraft: data.initialDraft || '',
        finalJasaoseo: data.finalJasaoseo || '',
        analysisReport: data.analysisReport || '',
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
};
