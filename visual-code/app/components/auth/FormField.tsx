"use client";

import { useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  icon: Icon,
  hint,
  disabled = false,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  icon?: LucideIcon;
  hint?: string;
  disabled?: boolean;
}) {
  const passwordField = type === "password";
  const [showPassword, setShowPassword] = useState(false);
  const inputType = passwordField && showPassword ? "text" : type;

  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">
        {label}
        {required && <span className="ml-1 text-blue-600">*</span>}
      </span>
      <span className="relative mt-2 block">
        {Icon && (
          <Icon
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}
        <input
          name={name}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          className={`min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
            Icon ? "pl-11" : ""
          } ${passwordField ? "pr-12" : ""}`}
        />
        {passwordField && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            aria-label={showPassword ? "Nascondi password" : "Mostra password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </span>
      {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
