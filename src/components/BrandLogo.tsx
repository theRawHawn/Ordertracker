import React, { useState, useRef, useEffect } from 'react';
import { Building2, Upload, Image as ImageIcon, X, Check, RefreshCw } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brandConfig';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showUploadOption?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showUploadOption = true,
}) => {
  const [customLogo, setCustomLogo] = useState<string>(() => {
    try {
      return localStorage.getItem('brand_custom_logo_v1') || BRAND_CONFIG.logoUrl || '';
    } catch {
      return BRAND_CONFIG.logoUrl || '';
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasError(false);
  }, [customLogo]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomLogo(result);
        try {
          localStorage.setItem('brand_custom_logo_v1', result);
        } catch (err) {
          console.error('Failed to save logo to localStorage:', err);
        }
        setIsModalOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setCustomLogo(BRAND_CONFIG.logoUrl || '');
    try {
      localStorage.removeItem('brand_custom_logo_v1');
    } catch (err) {
      console.error('Failed to remove custom logo:', err);
    }
    setIsModalOpen(false);
  };

  // Dimensions based on size
  const dimensions = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', rounded: 'rounded-lg' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5', rounded: 'rounded-xl' },
    lg: { container: 'w-14 h-14', icon: 'w-7 h-7', rounded: 'rounded-2xl' },
  }[size];

  const logoSrc = customLogo;

  return (
    <>
      <div className="relative group inline-block">
        {logoSrc && !hasError ? (
          <div
            onClick={() => showUploadOption && setIsModalOpen(true)}
            className={`${dimensions.container} ${dimensions.rounded} bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-1 shadow-md transition-all ${
              showUploadOption ? 'cursor-pointer hover:border-amber-500 hover:ring-2 hover:ring-amber-500/30' : ''
            }`}
            title={showUploadOption ? 'Click to manage/replace Brand Logo' : 'Brand Logo'}
          >
            <img
              src={logoSrc}
              alt="Brand Logo"
              onError={() => setHasError(true)}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          /* Brand Logo Placeholder Box */
          <div
            onClick={() => showUploadOption && setIsModalOpen(true)}
            className={`${dimensions.container} ${dimensions.rounded} bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-600 p-0.5 shadow-md transition-all ${
              showUploadOption ? 'cursor-pointer hover:scale-105' : ''
            }`}
            title="Brand Logo Placeholder • Click to upload custom logo or view instructions"
          >
            <div className={`w-full h-full bg-white ${dimensions.rounded} flex flex-col items-center justify-center relative overflow-hidden transition-colors`}>
              <div className="relative flex items-center justify-center">
                <Building2 className={`${dimensions.icon} text-amber-600`} />
              </div>

              {/* Hover badge for upload hint */}
              {showUploadOption && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-amber-300">
                  <Upload className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal for Brand Logo Upload & Config Guide */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Brand Logo Management</h3>
                <p className="text-xs text-slate-400">Configure logo for deployment or preview</p>
              </div>
            </div>

            {/* Current Logo Preview */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mb-5 text-center">
              <p className="text-xs font-semibold text-slate-300 mb-2">Current Active Logo</p>
              <div className="flex justify-center mb-3">
                {customLogo ? (
                  <div className="w-24 h-24 rounded-xl bg-white border border-slate-300 p-2 flex items-center justify-center shadow-inner">
                    <img src={customLogo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-white border-2 border-dashed border-amber-500/60 p-2 flex flex-col items-center justify-center text-amber-600 shadow-inner">
                    <Building2 className="w-8 h-8 mb-1" />
                    <span className="text-[9px] font-bold tracking-wider uppercase">Placeholder</span>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom Logo</span>
                </button>
                {customLogo && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Code Config Instructions */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
                <Check className="w-3.5 h-3.5" />
                <span>Permanent Deployment Instructions</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                To set a permanent logo file for deployment, add your logo image into the codebase or update <code className="text-amber-300 font-mono bg-slate-900 px-1 py-0.5 rounded">/src/config/brandConfig.ts</code>:
              </p>
              <pre className="p-2 bg-slate-900 rounded border border-slate-800 text-[10px] text-amber-200/90 font-mono overflow-x-auto">
{`export const BRAND_CONFIG = {
  logoUrl: '/logo.png', // or your image URL
};`}
              </pre>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
