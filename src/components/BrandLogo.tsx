import React, { useState, useRef, useEffect } from 'react';
import { Building2, Upload, Image as ImageIcon, X, Check, RefreshCw } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brandConfig';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showUploadOption?: boolean;
  showTextButton?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showUploadOption = true,
  showTextButton = false,
}) => {
  const [customLogo, setCustomLogo] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('brand_custom_logo_v1');
      if (stored) return stored;
    } catch {
      // fallback
    }
    return BRAND_CONFIG.logoUrl || '/logo.png';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [urlInput, setUrlInput] = useState('');
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

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setCustomLogo(urlInput.trim());
    try {
      localStorage.setItem('brand_custom_logo_v1', urlInput.trim());
    } catch (err) {
      console.error('Failed to save logo to localStorage:', err);
    }
    setUrlInput('');
    setIsModalOpen(false);
  };

  const handleResetLogo = () => {
    setCustomLogo(BRAND_CONFIG.logoUrl || '/logo.png');
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
      <div className="flex items-center gap-2">
        <div className="relative group inline-block">
          {logoSrc && !hasError ? (
            <div
              onClick={() => showUploadOption && setIsModalOpen(true)}
              className={`${dimensions.container} ${dimensions.rounded} bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-1 shadow-md transition-all ${
                showUploadOption ? 'cursor-pointer hover:border-amber-500 hover:ring-2 hover:ring-amber-500/30' : ''
              }`}
              title={showUploadOption ? 'Click to upload or manage Brand Logo' : 'Brand Logo'}
            >
              <img
                src={logoSrc}
                alt="Brand Logo"
                onError={() => setHasError(true)}
                className="w-full h-full object-contain"
              />
              {showUploadOption && (
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-amber-300 rounded-xl">
                  <Upload className="w-4 h-4" />
                </div>
              )}
            </div>
          ) : (
            /* Brand Logo Placeholder Box */
            <div
              onClick={() => showUploadOption && setIsModalOpen(true)}
              className={`${dimensions.container} ${dimensions.rounded} bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-600 p-0.5 shadow-md transition-all ${
                showUploadOption ? 'cursor-pointer hover:scale-105' : ''
              }`}
              title="Brand Logo • Click to upload custom logo"
            >
              <div className={`w-full h-full bg-slate-900 ${dimensions.rounded} flex flex-col items-center justify-center relative overflow-hidden transition-colors`}>
                <div className="relative flex items-center justify-center">
                  <Building2 className={`${dimensions.icon} text-amber-400`} />
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

        {/* Optional text button next to logo */}
        {showTextButton && showUploadOption && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Upload or change brand logo image"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Upload Logo</span>
          </button>
        )}
      </div>

      {/* Modal for Brand Logo Upload & Config Guide */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
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
                <h3 className="font-bold text-white text-base">Upload & Manage Brand Logo</h3>
                <p className="text-xs text-slate-400">Choose an image file from your computer or paste an image URL</p>
              </div>
            </div>

            {/* Current Logo Preview */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mb-4 text-center">
              <p className="text-xs font-semibold text-slate-300 mb-2">Logo Preview</p>
              <div className="flex justify-center mb-3">
                {customLogo && !hasError ? (
                  <div className="w-28 h-28 rounded-xl bg-white border border-slate-300 p-2 flex items-center justify-center shadow-inner">
                    <img src={customLogo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-xl bg-slate-900 border-2 border-dashed border-amber-500/60 p-2 flex flex-col items-center justify-center text-amber-400 shadow-inner">
                    <Building2 className="w-8 h-8 mb-1" />
                    <span className="text-[9px] font-bold tracking-wider uppercase text-amber-400">No Logo Loaded</span>
                  </div>
                )}
              </div>

              {/* Upload File Input */}
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
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Image File...</span>
                </button>
                {customLogo && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* URL Input Option */}
            <form onSubmit={handleApplyUrl} className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Or enter image URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={!urlInput.trim()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </form>

            {/* Permanent repo guide */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1 text-amber-300 font-semibold text-[11px]">
                <Check className="w-3.5 h-3.5" />
                <span>Repository Path Info</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Image is saved locally in browser storage. You can also save a logo file as <code className="text-amber-300 font-mono">/public/logo.png</code> in the repository.
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
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
