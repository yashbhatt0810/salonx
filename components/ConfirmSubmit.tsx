"use client";
import { Trash2 } from "lucide-react";

export function ConfirmSubmit({ children, message = "Are you sure?", className = "btn-danger btn-sm" }: { children: React.ReactNode; message?: string; className?: string }) {
  const iconOnly = children === "✕";
  return (
    <button
      type="submit"
      className={className}
      title={iconOnly ? "Delete" : undefined}
      aria-label={iconOnly ? "Delete" : undefined}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <Trash2 size={14} />
      {!iconOnly && children}
    </button>
  );
}
