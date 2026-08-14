import React from 'react';
import { AppBranding } from '../types';
import { HardDrive, Shield, Lock, Cloud, Key, Cpu, FolderLock } from 'lucide-react';

interface AppLogoProps {
  branding: AppBranding;
  className?: string;
  iconSize?: number;
  showText?: boolean;
  textSize?: string;
  badgeSize?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  branding,
  className = '',
  iconSize = 20,
  showText = true,
  textSize = 'text-base sm:text-lg',
  badgeSize = 'w-9 h-9 sm:w-10 sm:h-10',
}) => {
  const getLogoIcon = () => {
    switch (branding.appLogoIcon) {
      case 'Shield':
        return <Shield size={iconSize} className="fill-white/20 text-white" />;
      case 'Lock':
        return <Lock size={iconSize} className="text-white" />;
      case 'Cloud':
        return <Cloud size={iconSize} className="fill-white/20 text-white" />;
      case 'Key':
        return <Key size={iconSize} className="text-white" />;
      case 'Cpu':
        return <Cpu size={iconSize} className="text-white" />;
      case 'HardDrive':
      default:
        return <HardDrive size={iconSize} className="fill-white/20 text-white" />;
    }
  };

  return (
    <div className={`flex items-center gap-2.5 cursor-pointer select-none ${className}`}>
      {branding.appLogoType === 'image' && branding.appLogoUrl ? (
        <div
          className={`${badgeSize} rounded-xl overflow-hidden flex items-center justify-center border border-olive-sage/20 shadow-sm shrink-0 bg-white dark:bg-slate-900`}
        >
          <img
            src={branding.appLogoUrl}
            alt={branding.appName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image load fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div
          style={{ backgroundColor: branding.primaryColor || '#556B2F' }}
          className={`${badgeSize} rounded-xl flex items-center justify-center text-white shadow-md transition-all shrink-0`}
        >
          {getLogoIcon()}
        </div>
      )}

      {showText && (
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold ${textSize} text-slate-900 dark:text-cream tracking-tight`}>
            {branding.appName || 'VaultX'}
          </span>
        </div>
      )}
    </div>
  );
};
