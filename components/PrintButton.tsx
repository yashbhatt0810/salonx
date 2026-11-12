"use client";
import { Printer } from "lucide-react";
export function PrintButton() {
  return <button className="btn-ghost" onClick={() => window.print()}><Printer size={15} /> Print</button>;
}
