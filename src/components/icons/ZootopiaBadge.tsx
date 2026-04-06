export default function ZootopiaBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2.5l2.2 2.1 3-.5.9 2.9 2.8 1.2-1.2 2.8 1.7 2.5-2.5 1.7-1.2 2.8-2.8-1.2-2.9.9-.5-3L12 21.5l-2.2-2.1-3 .5-.9-2.9-2.8-1.2 1.2-2.8L2.6 10.5 5.1 8.8l1.2-2.8 2.8 1.2 2.9-.9.5-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.1l1.2 2.5 2.8.4-2 1.9.5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-1.9 2.8-.4L12 7.1Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

