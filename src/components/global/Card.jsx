export default function Card({ as: Tag = "div", className = "", children, ...props }) {
  return (
    <Tag
      className={`bg-white/80 border border-canopy-800/10 rounded-[1.5rem] shadow-[0_1px_2px_rgba(22,33,26,0.04),0_8px_24px_-16px_rgba(22,49,31,0.35)] ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
