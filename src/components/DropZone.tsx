import { useRef, useState, DragEvent, ChangeEvent } from 'react';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFileSelected, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateAndEmit(file: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('请上传 PNG、JPEG 或 WebP 格式图片');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('图片不能超过 10 MB');
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
    // reset so same file can be re-selected
    e.target.value = '';
  }

  return (
    <div
      className={`dropzone ${dragOver ? 'dragover' : ''} ${disabled ? 'disabled' : ''}`}
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
        style={{ display: 'none' }}
      />
      <div className="dropzone-icon">📤</div>
      <p className="dropzone-title">拖拽图片到此处，或点击上传</p>
      <p className="dropzone-hint">PNG, JPEG, WebP · 最大 10MB</p>
      {error && <p className="dropzone-error">{error}</p>}
    </div>
  );
}
