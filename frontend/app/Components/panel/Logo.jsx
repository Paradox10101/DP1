export function Logo({ className = "" }) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <svg 
          viewBox="0 0 24 24" 
          className="w-6 h-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 4h16v16H4z" />
          <path d="M16 4l-4 4-4-4" />
        </svg>
        <span className="text-xl font-bold text-gray-900">
          Odipar<span className="text-blue-600">Pack</span>
        </span>
      </div>
    );
}