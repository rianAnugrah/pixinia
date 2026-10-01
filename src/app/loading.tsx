import BusyStatus from "@/components/busy-status";

export default function Loading() {
  return <main className="shell page page-loading"><BusyStatus>Memuat halaman…</BusyStatus><div className="loading-skeleton" aria-hidden="true" /><div className="loading-skeleton loading-skeleton-short" aria-hidden="true" /></main>;
}
