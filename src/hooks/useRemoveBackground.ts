import { useState, useRef, useCallback } from 'react';

interface UseRemoveBackgroundReturn {
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  error: string | null;
  resultUrl: string | null;
  process: (file: File) => Promise<void>;
  reset: () => void;
}

export function useRemoveBackground(): UseRemoveBackgroundReturn {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const process = useCallback(async (file: File) => {
    // Clean up previous result
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }
    setResultUrl(null);
    setError(null);
    setStatus('uploading');

    const apiUrl = import.meta.env.VITE_API_URL || '';

    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append('file', file);

      setStatus('processing');

      const res = await fetch(`${apiUrl}/remove-bg`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
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
      setStatus('done');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request cancelled');
      } else {
        setError(err.message || 'Processing failed. Please try again.');
      }
      setStatus('error');
    }
  }, [resultUrl]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }
    setStatus('idle');
    setError(null);
    setResultUrl(null);
  }, [resultUrl]);

  return { status, error, resultUrl, process, reset };
}
