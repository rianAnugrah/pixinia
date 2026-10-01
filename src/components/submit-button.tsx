"use client";

import { useFormStatus } from "react-dom";
import BusyStatus from "@/components/busy-status";

export default function SubmitButton({ children, pendingLabel, className = "primary-button" }: { children: React.ReactNode; pendingLabel: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} type="submit" disabled={pending} aria-busy={pending}>
    {pending ? <BusyStatus>{pendingLabel}</BusyStatus> : children}
  </button>;
}
