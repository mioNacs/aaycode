export function AyyCodeLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="#0d9488" />
      
      {/* Code brackets */}
      <path
        d="M 28 35 L 20 50 L 28 65"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 72 35 L 80 50 L 72 65"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Forward slash */}
      <path
        d="M 58 30 L 42 70"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Accent dot - representing activity/contribution */}
      <circle cx="50" cy="15" r="4" fill="#fbbf24" />
    </svg>
  );
}
