import React from 'react';

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


interface NotificationProps {
  message: string;
  onClose: () => void;
  onAction?: () => void;
  actionText?: string;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose, onAction, actionText }) => {
  return (
    <div 
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md animate-fade-in-down"
        role="alert"
        aria-live="assertive"
    >
      <div className="bg-green-500/10 backdrop-blur-lg border border-green-500/30 text-white p-4 rounded-xl shadow-lg flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-3">
            <CheckCircleIcon className="w-7 h-7 text-green-400 flex-shrink-0" />
            <p className="font-semibold">{message}</p>
        </div>
        <div className="flex items-center space-x-2">
            {onAction && actionText && (
                <button
                    onClick={onAction}
                    className="px-3 py-1 text-sm font-bold bg-green-500 text-slate-900 rounded-md hover:bg-green-400 transition-colors"
                >
                    {actionText}
                </button>
            )}
             <button
                onClick={onClose}
                aria-label="Close notification"
                className="p-1 text-green-300 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
                <CloseIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;