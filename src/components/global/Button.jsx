const variants = {
  primary:
    "bg-canopy-700 text-sand-50 hover:bg-canopy-600 active:bg-canopy-800 disabled:bg-canopy-200 disabled:text-canopy-500",
  ochre:
    "bg-ochre-500 text-canopy-950 hover:bg-ochre-600 active:brightness-95 disabled:opacity-50",
  ghost:
    "bg-transparent text-canopy-700 border border-canopy-700/25 hover:bg-canopy-100 disabled:opacity-40",
  subtle:
    "bg-sand-100 text-ink-900 hover:bg-sand-200 disabled:opacity-40",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const sizes = {
    sm: "text-sm px-3 py-1.5 rounded-xl gap-1.5",
    md: "text-[0.95rem] px-4 py-2.5 rounded-2xl gap-2",
    lg: "text-base px-6 py-3.5 rounded-[1.5rem] gap-2",
  };

  return (
    <Tag
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
