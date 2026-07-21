type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  className?: string;
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const styles = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200",
    secondary:
      "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex
        items-center
        justify-center
        rounded-2xl
        px-6
        py-4
        font-medium
        transition-all
        duration-200
        ${styles[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}