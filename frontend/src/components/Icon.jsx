const PATHS = {
  ticket: <><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" /><path d="M14 6v12" strokeDasharray="2 3" /></>,
  queue: <><path d="M4 6h16M4 12h16M4 18h10" /><circle cx="18" cy="18" r="2" /></>,
  bank: <><path d="M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16M12 4l8 4H4l8-4Z" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  shield: <><path d="M12 4l7 3v5c0 4.2-2.8 7-7 8-4.2-1-7-3.8-7-8V7l7-3Z" /><path d="m9.5 12 1.8 1.8 3.2-3.6" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 1.5" /></>,
  check: <path d="m5 12.5 4.2 4.2L19 7" />,
  "check-circle": <><circle cx="12" cy="12" r="8" /><path d="m8.5 12.2 2.4 2.4 4.6-5" /></>,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  "x-circle": <><circle cx="12" cy="12" r="8" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
  "arrow-left": <><path d="M19 12H5" /><path d="m10 7-5 5 5 5" /></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 5v6h-6" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
  logout: <><path d="M14 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" /><path d="M17 8l4 4-4 4M21 12H10" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z" />,
  sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></>,
  globe: <><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.4 2.2 3.5 5 3.5 8s-1.1 5.8-3.5 8c-2.4-2.2-3.5-5-3.5-8S9.6 6.2 12 4Z" /></>,
  wallet: <><rect x="4" y="6" width="16" height="13" rx="2" /><path d="M4 9h16M15 14h2" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" /><path d="M10 20h4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  play: <path d="M8 5.5v13l10-6.5-10-6.5Z" />,
  skip: <><path d="m6 6 8 6-8 6V6Z" /><path d="M18 5v14" /></>,
  chart: <><path d="M4 19V5M4 19h16" /><path d="M8 15v-3M12 15V8M16 15v-5" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.5-2.3 1a7 7 0 0 0-1.9-1.1L14.4 3h-4l-.3 2.8a7 7 0 0 0-1.9 1.1l-2.3-1-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .7.1 1.1l-2 1.5 2 3.5 2.3-1a7 7 0 0 0 1.9 1.1l.3 2.8h4l.3-2.8a7 7 0 0 0 1.9-1.1l2.3 1 2-3.5-2-1.5c.1-.4.1-.7.1-1.1Z" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M17.5 14.2A5.5 5.5 0 0 1 20.5 19" /></>,
  logs: <><path d="M7 4h8l4 4v12H7V4Z" /><path d="M15 4v4h4M10 12h6M10 16h4" /></>,
  transaction: <><path d="M4 8h13l-3-3M20 16H7l3 3" /><path d="M4 8l3 3M20 16l-3-3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  alert: <><path d="M12 4 3 20h18L12 4Z" /><path d="M12 10v4M12 17h.01" /></>,
  info: <><circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 8h.01" /></>,
  copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  download: <><path d="M12 4v10" /><path d="m8 10 4 4 4-4" /><path d="M5 19h14" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  pin: <><path d="M12 21s6-5.3 6-10a6 6 0 0 0-12 0c0 4.7 6 10 6 10Z" /><circle cx="12" cy="11" r="2" /></>,
  phone: <path d="M6 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 6.2 2 2 0 0 1 6 4Z" />,
  home: <><path d="m4 11 8-7 8 7" /><path d="M6 9.5V20h12V9.5" /></>,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  send: <><path d="M4 12 20 4l-6 16-3.2-6.2L4 12Z" /><path d="m10.8 13.8 4-4" /></>,
  filter: <path d="M4 6h16l-6 7v5l-4 2v-7L4 6Z" />,
  eye: <><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V8a4 4 0 0 1 8 0v2" /></>,
};

export default function Icon({ name, size = 20, strokeWidth = 1.75, title, className = "" }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      className={`inline-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {path}
    </svg>
  );
}
