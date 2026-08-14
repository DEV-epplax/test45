import React, { useState } from 'react';
import { AppBranding } from '../types';
import { ShieldCheck, FileText } from 'lucide-react';
import { TermsModal } from './TermsModal';

interface FooterProps {
  branding: AppBranding;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ branding, className = '' }) => {
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

  return (
    <>
      <footer className={`mt-12 py-8 border-t border-olive-sage/20 bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 text-xs transition-colors ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {branding.footerText}
            </p>
            {branding.footerSubtext && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {branding.footerSubtext}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setShowTermsModal(true)}
              className="flex items-center gap-1.5 font-bold text-olive-primary dark:text-olive-sage hover:underline cursor-pointer transition-colors"
            >
              <FileText size={13} />
              <span>Terms & Conditions</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>Encrypted System</span>
            </div>
          </div>
        </div>
      </footer>

      <TermsModal
        branding={branding}
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </>
  );
};
