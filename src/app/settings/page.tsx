import ReaderSettings from "@/components/reader/settings";
import { PageHeading } from "@/components/reader/design-ui";
export const metadata = { title: "Pengaturan baca" };
export default function Settings() { return <main className="px-page"><PageHeading title="Pengaturan baca" back="/profile" /><div className="px-content"><ReaderSettings /></div></main>; }
