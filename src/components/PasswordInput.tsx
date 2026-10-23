"use client";

import { useState, type ComponentProps } from "react";

type Props = Omit<ComponentProps<"input">, "type">;

/** Password field with a control to show or hide what was typed. */
export function PasswordInput({ className = "", ...rest }: Props) {
  const [show, setShow] = useState(false);
  const extra = className
    .replace(/\bgp-input\b/g, "")
    .replace(/\bmt-1\b/g, "")
    .trim();

  return (
    <div className="relative mt-1">
      <input
        {...rest}
        type={show ? "text" : "password"}
        className={`gp-input pr-11 ${extra}`.trim()}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-white"
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShow((open) => !open)}
      >
        {show ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}

function Eye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.5 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1.1M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-4.1 4.8M6.1 6.2C3.6 7.9 2 12 2 12a18.7 18.7 0 0 0 6.2 5.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
