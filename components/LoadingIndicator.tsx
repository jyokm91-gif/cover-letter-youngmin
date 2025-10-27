
import React from 'react';

interface LoadingIndicatorProps {
    status: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ status }) => {
    return (
        <div className="flex items-center justify-center space-x-3 my-8">
            <div className="w-9 h-9 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-lg font-medium text-slate-700">{status}</span>
        </div>
    );
};

export default LoadingIndicator;
