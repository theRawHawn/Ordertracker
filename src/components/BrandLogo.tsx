import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brandConfig';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showUploadOption?: boolean;
  showTextButton?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md' }) => {
  const [hasError, setHasError] = useState(false);

  // Dimensions based on size
  const dimensions = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', rounded: 'rounded-lg' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5', rounded: 'rounded-xl' },
    lg: { container: 'w-14 h-14', icon: 'w-7 h-7', rounded: 'rounded-2xl' },
  }[size];

  const logoSrc = BRAND_CONFIG.logoUrl || '/sapien-logo.png';

  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-block">
        {logoSrc && !hasError ? (
          <div
            className={`${dimensions.container} ${dimensions.rounded} bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-1 shadow-md`}
            title="Brand Logo"
          >
            <img
              src={logoSrc}
              alt="Brand Logo"
              onError={() => setHasError(true)}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div
            className={`${dimensions.container} ${dimensions.rounded} bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-600 p-0.5 shadow-md`}
            title="Brand Logo"
          >
            <div className={`w-full h-full bg-slate-900 ${dimensions.rounded} flex flex-col items-center justify-center relative overflow-hidden`}>
              <Building2 className={`${dimensions.icon} text-amber-400`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
