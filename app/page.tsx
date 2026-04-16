'use client';

import { useState, useRef, useCallback } from 'react';
import DropZone from '@/components/DropZone';
import ImagePreview from '@/components/ImagePreview';
import Spinner from '@/components/Spinner';

type Status = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export default function Home() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleFileSelected = useCallback((file: File) => {
    // Clean up previous URLs
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    setError(null);
    setOriginalUrl(URL.createObjectURL(file));
    setStatus('idle');
  }, [originalUrl, resultUrl]);

  const handleRemoveBackground = useCallback(async () => {
    if (!originalUrl) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setError(null);
    setResultUrl(null);
    setResultBlob(null);
    setStatus('uploading');

    try {
      // Fetch the original file from the object URL
      const fileRes = await fetch(originalUrl);
      const fileBlob = await fileRes.blob();

      const formData = new FormData();
      formData.append('file', fileBlob, 'image.png');

      setStatus('processing');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/remove-bg`, {
        method: 'POST',
        body: formData,
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        let msg = `Processing failed (${res.status})`;
        try {
          const body = await res.json();
          if (body.detail) msg = body.detail;
        } catch (_) {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultBlob(blob);
      setStatus('done');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request cancelled');
      } else {
        setError(err.message || 'Processing failed. Please try again.');
      }
      setStatus('error');
    }
  }, [originalUrl]);

  const handleReset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setOriginalUrl(null);
    setResultUrl(null);
    setResultBlob(null);
    setError(null);
    setStatus('idle');
  }, [originalUrl, resultUrl]);

  const handleDownload = () => {
    if (!resultBlob) return;
    const a = document.createElement('a');
    a.href = resultUrl!;
    a.download = 'removed-bg.png';
    a.click();
  };

  const isProcessing = status === 'uploading' || status === 'processing';

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Background Remover
        </h1>
        <p className="text-gray-500">Remove image backgrounds instantly</p>
      </div>

      {/* Upload area — hide once image is selected */}
      {!originalUrl && (
        <div className="w-full max-w-lg">
          <DropZone onFileSelected={handleFileSelected} disabled={isProcessing} />
        </div>
      )}

      {/* Preview + actions */}
      {originalUrl && (
        <div className="w-full max-w-4xl">
          {/* Image comparison */}
          <ImagePreview
            originalUrl={originalUrl}
            resultUrl={resultUrl}
            isProcessing={isProcessing}
          />

          {/* Error message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            {!resultUrl && (
              <button
                onClick={handleRemoveBackground}
                disabled={isProcessing}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? <Spinner /> : 'Remove Background'}
              </button>
            )}

            {resultUrl && (
              <>
                <button
                  onClick={handleDownload}
                  className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download PNG
                </button>
                <button
                  onClick={handleReset}
                  className="px-8 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Upload New
                </button>
              </>
            )}

            {!resultUrl && (
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto pt-12 text-sm text-gray-400">
        Supports PNG, JPEG, WebP · Max 10MB
      </footer>
    </main>
  );
}
