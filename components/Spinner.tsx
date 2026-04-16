interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
};

export default function Spinner({ size = 'md', showText = true }: SpinnerProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin`}
      />
      {showText && <span className="text-sm text-gray-500">Processing...</span>}
    </div>
  );
}
