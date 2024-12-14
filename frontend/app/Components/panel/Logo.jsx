export function Logo({ className = "" }) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <svg 
          viewBox="0 0 24 24" 
          className="w-6 h-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 17h4V5H2v12h3m5 0h4" />
          <path d="M20 17h2v-6l-3-4h-4v10h2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
        <span className="text-xl font-bold text-gray-900">
          Odipar<span className="text-blue-600">Pack</span>
        </span>
      </div>
    );
}