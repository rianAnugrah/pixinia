export default function BusyStatus({ children }: { children: React.ReactNode }) {
  return <span className="busy-status" role="status" aria-live="polite"><span className="busy-spinner" aria-hidden="true" />{children}</span>;
}
