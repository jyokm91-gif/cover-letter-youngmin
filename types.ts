export type JobOption = 'marketing' | 'it' | 'sales_hr' | 'management' | 'other';

export interface InputState {
    jobRole: string;
    jobPosting: string;
    userInfo: string;
    jasaoseoQuestions: string;
    initialDraft: string;
    useSearchGrounding: boolean;
    useThinkingMode: boolean;
}

export interface ProofreadingIssue {
    original: string;
    corrected: string;
    reason: string;
}

export type ProofreadingResult = ProofreadingIssue[];
