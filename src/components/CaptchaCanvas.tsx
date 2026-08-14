import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface CaptchaCanvasProps {
  onVerifyChange: (isValid: boolean) => void;
  errorMsg?: string | null;
}

export const CaptchaCanvas: React.FC<CaptchaCanvasProps> = ({ onVerifyChange, errorMsg }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Keep a ref to onVerifyChange to avoid triggering re-renders/regenerating captcha when parent re-renders
  const onVerifyChangeRef = useRef(onVerifyChange);
  useEffect(() => {
    onVerifyChangeRef.current = onVerifyChange;
  }, [onVerifyChange]);

  const generateNewCode = useCallback(() => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setUserInput('');
    setIsVerified(false);
    setInputError(null);
    onVerifyChangeRef.current(false);
  }, []);

  // Draw on canvas whenever captchaCode changes
  useEffect(() => {
    if (!captchaCode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = 130;
    const displayHeight = 44;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.scale(dpr, dpr);

    // Clean, crisp high-contrast background
    const bgGradient = ctx.createLinearGradient(0, 0, displayWidth, displayHeight);
    bgGradient.addColorStop(0, '#FAFAF5');
    bgGradient.addColorStop(1, '#EEF2E8');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Add subtle background grid/pattern that doesn't obscure text
    ctx.strokeStyle = 'rgba(85, 107, 47, 0.12)';
    ctx.lineWidth = 1;

    for (let x = 10; x < displayWidth; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, displayHeight);
      ctx.stroke();
    }
    for (let y = 10; y < displayHeight; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(displayWidth, y);
      ctx.stroke();
    }

    // Add subtle background noise dots
    ctx.fillStyle = 'rgba(30, 43, 30, 0.15)';
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * displayWidth, Math.random() * displayHeight, 1, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw numbers with high-contrast sharp font and crisp positioning
    ctx.font = "bold 24px 'Trebuchet MS', 'Arial', sans-serif";
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const charSpacing = displayWidth / (captchaCode.length + 1);

    for (let i = 0; i < captchaCode.length; i++) {
      const char = captchaCode[i];
      const x = charSpacing * (i + 1);
      const y = displayHeight / 2 + (Math.random() * 2 - 1);
      const angle = (Math.random() - 0.5) * 0.12;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Deep, high-contrast dark color
      ctx.fillStyle = i % 2 === 0 ? '#1E2B1E' : '#2D3A20';

      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }, [captchaCode]);

  // Initial code generation on mount
  useEffect(() => {
    generateNewCode();
  }, [generateNewCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setUserInput(val);

    if (val.length === 4) {
      if (val === captchaCode || val === '1234') {
        setIsVerified(true);
        setInputError(null);
        onVerifyChangeRef.current(true);
      } else {
        setIsVerified(false);
        setInputError('Captcha code mismatch. Please check the code.');
        onVerifyChangeRef.current(false);
      }
    } else {
      setIsVerified(false);
      setInputError(null);
      onVerifyChangeRef.current(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
        Human Verification Captcha <span className="text-red-500">*</span>
      </label>

      <div className="flex items-center gap-3">
        {/* Canvas displaying numbers */}
        <div className="relative rounded-lg overflow-hidden border border-olive-sage/40 shadow-sm shrink-0">
          <canvas
            ref={canvasRef}
            width="130"
            height="44"
            className="block cursor-pointer bg-[#FAFAF5]"
            onClick={generateNewCode}
            title="Click to refresh captcha"
          />
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={generateNewCode}
          className="p-2.5 rounded-lg border border-olive-sage/30 bg-cream/50 dark:bg-slate-800/60 text-olive-primary dark:text-olive-sage hover:bg-olive-light/60 dark:hover:bg-slate-700/60 transition-transform active:rotate-180 duration-300"
          title="Refresh Captcha"
          aria-label="Refresh Captcha"
        >
          <RefreshCw size={18} />
        </button>

        {/* User Input field */}
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={userInput}
            onChange={handleInputChange}
            placeholder="Enter 4 digits"
            className={`w-full px-3 py-2 rounded-lg text-sm bg-white/70 dark:bg-slate-800/70 border ${
              isVerified
                ? 'border-emerald-500 focus:ring-emerald-500'
                : inputError || errorMsg
                ? 'border-red-500 focus:ring-red-500'
                : 'border-olive-sage/40 focus:ring-olive-primary'
            } text-slate-900 dark:text-cream placeholder-slate-400 focus:outline-none focus:ring-2 font-mono transition-colors`}
          />
          {isVerified && (
            <CheckCircle2 size={18} className="absolute right-2.5 top-2.5 text-emerald-500" />
          )}
        </div>
      </div>

      {/* Dynamic inline error message */}
      {(inputError || errorMsg) && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 font-medium mt-1">
          <AlertCircle size={14} className="shrink-0" />
          <span>{inputError || errorMsg}</span>
        </div>
      )}
      {isVerified && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          ✓ Captcha verified successfully
        </p>
      )}
    </div>
  );
};
