import React from 'react';
import { AppBranding } from '../types';
import { ShieldCheck, X, FileText } from 'lucide-react';

interface TermsModalProps {
  branding: AppBranding;
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ branding, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1E241E] rounded-3xl p-6 sm:p-8 border border-olive-sage/20 shadow-2xl space-y-5 animate-in scale-in duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-olive-sage/15 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: branding.primaryColor || '#556B2F' }}
              className="p-2 rounded-xl text-white shadow-sm"
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-cream">
                {branding.termsTitle || 'Terms & Conditions of Service'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Official User Agreement & System Guidelines for {branding.appName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-cream hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto pr-2 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line flex-1">
          {branding.termsContent}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-olive-sage/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <FileText size={14} />
            <span>Updated by Admin</span>
          </div>
          <button
            onClick={onClose}
            style={{ backgroundColor: branding.primaryColor || '#556B2F' }}
            className="px-5 py-2 text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
