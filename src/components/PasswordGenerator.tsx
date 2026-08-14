import React, { useState } from 'react';
import { KeyRound, Copy, Check, ShieldCheck } from 'lucide-react';
import { generateStrongPassword } from '../utils/formatters';

interface PasswordGeneratorProps {
  onSelectPassword: (pwd: string) => void;
  showToast: (msg: string) => void;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onSelectPassword, showToast }) => {
  const [generatedPwd, setGeneratedPwd] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerate = () => {
    const newPwd = generateStrongPassword();
    setGeneratedPwd(newPwd);
    onSelectPassword(newPwd);

    // Auto copy to clipboard
    try {
      navigator.clipboard.writeText(newPwd);
      setCopied(true);
      showToast('Generated strong password copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Generated password ready! (Copy manually if required)');
    }
  };

  return (
    <div className="p-3.5 rounded-xl border border-olive-sage/30 bg-olive-light/40 dark:bg-slate-800/40 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-olive-dark dark:text-olive-sage uppercase tracking-wider">
          <KeyRound size={15} className="text-olive-primary dark:text-olive-sage" />
          <span>Strong Password Tool</span>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          className="px-3 py-1 text-xs font-medium rounded-lg bg-olive-primary hover:bg-olive-dark text-white shadow-sm transition-all flex items-center gap-1.5"
        >
          <ShieldCheck size={14} />
          <span>Generate 12-Char Password</span>
        </button>
      </div>

      {generatedPwd && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-olive-sage/30">
          <span className="font-mono text-sm tracking-wider font-semibold text-slate-800 dark:text-cream select-all">
            {generatedPwd}
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(generatedPwd);
              setCopied(true);
              showToast('Password copied to clipboard!');
              setTimeout(() => setCopied(false), 2500);
            }}
            className="p-1.5 text-xs text-olive-primary dark:text-olive-sage hover:bg-olive-light dark:hover:bg-slate-800 rounded flex items-center gap-1 transition-colors"
            title="Copy password"
          >
            {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            <span className="text-xs font-medium">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
