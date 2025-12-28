
export type JobOption = 'marketing' | 'it' | 'sales_hr' | 'management' | 'other';

export interface UploadedFile {
    id: string;
    name: string;
    content: string;
    category: 'userInfo' | 'initialDraft';
}

export interface InputState {
    jobRole: string;
    jobPosting: string;
    userInfo: string;
    jasaoseoQuestions: string;
    initialDraft: string;
    uploadedFiles: UploadedFile[];
    useSearchGrounding: boolean;
    useThinkingMode: boolean;
}

export interface ProofreadingIssue {
    original: string;
    corrected: string;
    reason: string;
}

export type ProofreadingResult = ProofreadingIssue[];
