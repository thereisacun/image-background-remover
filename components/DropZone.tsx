import { useRef, useState, DragEvent, ChangeEvent } from 'react';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export default function DropZone({ onFileSelected, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateAndEmit(file: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload PNG, JPEG, or WebP images');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Image must be under 10 MB');
      return;
    }
    onFileSelected(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) validateAndEmit(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndEmit(file);
    e.target.value = '';
  }

  return (
    <div
      className={`
        border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
        ${dragOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-white hover:border-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleChange}
        className="hidden"
      />

      <div className="text-5xl mb-4">📤</div>
      <p className="text-lg font-medium text-gray-700 mb-1">
        Drop your image here, or click to upload
      </p>
      <p className="text-sm text-gray-400">
        PNG, JPEG, WebP · Max 10MB
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
