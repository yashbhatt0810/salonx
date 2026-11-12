"use client";

export function ConfirmSubmit({ children, message = "Are you sure?", className = "btn-danger btn-sm" }: { children: React.ReactNode; message?: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
