"use client";
import { UserButton } from "@clerk/nextjs";

export function UserBox({ name, role, clerk }: { name: string; role: string; clerk: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {clerk ? <UserButton /> : <span className="h-7 w-7 rounded-full bg-white/20" />}
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-white">{name}</div>
        <div className="text-[11px] uppercase tracking-wider text-white/45">{role}</div>
      </div>
    </div>
  );
}
