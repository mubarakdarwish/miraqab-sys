
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "نعم، حذف",
  cancelText = "إلغاء",
  isDestructive = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 relative animate-scale-in">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border ${isDestructive ? 'bg-red-50 text-red-500 border-red-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>
            <i className={`fas ${isDestructive ? 'fa-trash-alt' : 'fa-info-circle'} text-3xl`}></i>
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 font-bold leading-relaxed px-4">{message}</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl text-sm font-black text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 py-4 rounded-2xl text-sm font-black text-white shadow-xl transition-all active:scale-95 ${
              isDestructive ? 'bg-[#c8102e] hover:bg-[#a60a22] shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
