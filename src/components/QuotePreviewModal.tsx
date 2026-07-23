import React from 'react';
import { X, ExternalLink, FileText, Download } from 'lucide-react';
import { getDriveEmbedUrl } from '../utils/helpers';

interface QuotePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteUrl: string;
  vendorName: string;
}

export const QuotePreviewModal: React.FC<QuotePreviewModalProps> = ({
  isOpen,
  onClose,
  quoteUrl,
  vendorName,
}) => {
  if (!isOpen) return null;

  const embedUrl = getDriveEmbedUrl(quoteUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Vendor PDF Quote</h3>
              <p className="text-xs text-slate-400">{vendorName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {quoteUrl && (
              <a
                href={quoteUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>Open in Drive</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer / Iframe */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center">
          {quoteUrl ? (
            <iframe
              src={embedUrl}
              title={`Quote - ${vendorName}`}
              className="w-full h-full border-none"
              allow="autoplay"
            />
          ) : (
            <div className="text-center p-8 max-w-md">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium">
                No Google Drive Quote Link Attached
              </p>
              <p className="text-xs text-slate-500 mt-1">
                You can attach a Google Drive share link in the edit order modal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
