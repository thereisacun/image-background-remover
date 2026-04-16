import Image from 'next/image';
import Spinner from './Spinner';

interface ImagePreviewProps {
  originalUrl: string;
  resultUrl: string | null;
  isProcessing: boolean;
}

export default function ImagePreview({ originalUrl, resultUrl, isProcessing }: ImagePreviewProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
      {/* Original */}
      <div className="flex-1 w-full">
        <p className="text-center text-sm font-medium text-gray-500 mb-2">Original</p>
        <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={originalUrl}
            alt="Original"
            className="max-w-full max-h-72 object-contain"
          />
        </div>
      </div>

      {/* Arrow / processing indicator */}
      <div className="flex items-center justify-center">
        {isProcessing ? (
          <Spinner size="lg" />
        ) : resultUrl ? (
          <span className="text-3xl text-green-500">✓</span>
        ) : (
          <span className="text-3xl text-gray-300">→</span>
        )}
      </div>

      {/* Result */}
      <div className="flex-1 w-full">
        <p className="text-center text-sm font-medium text-gray-500 mb-2">Result</p>
        <div className="relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNCIvPjxwYXRoIGQ9Ik0wIDBoNTB2NTBIN0wwIDY1eiIgZmlsbD0iI2FhYSIvPjxwYXRoIGQ9Ik01MCAwaDUwdjU1SDdMNSA2NXoiIGZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] bg-[length:20px_20px] rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-gray-200">
          {resultUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resultUrl}
              alt="Result"
              className="max-w-full max-h-72 object-contain"
            />
          ) : isProcessing ? (
            <p className="text-sm text-gray-400">Processing...</p>
          ) : (
            <p className="text-sm text-gray-400">Result will appear here</p>
          )}
        </div>
      </div>
    </div>
  );
}
