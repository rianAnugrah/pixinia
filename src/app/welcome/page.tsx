import Image from "next/image";
import Link from "next/link";
import assets from "@/components/reader/figma-assets.json";
export const metadata = { title: "Setiap pilihan, cerita baru" };
export default function Welcome() { return <main className="px-welcome"><Image src={assets["2:8422"].imgAtmosphericKingdom} alt="Kerajaan di bawah langit malam" fill priority sizes="100vw" /><div className="px-welcome-veil" /><div className="px-welcome-content"><div className="px-welcome-brand"><span>P</span><h1>PIXINIA</h1><p>CERITA INTERAKTIF</p></div><div className="px-welcome-promise"><h2>Setiap pilihan<br />menciptakan cerita baru.</h2><p>Masuki dunia yang dibentuk oleh janji, rahasia, dan jalan yang kamu pilih.</p></div><div><Link className="px-button" href="/"><Image src={assets["2:8422"].imgArrowRight} alt="" width={17} height={17} />Lanjutkan</Link><p className="px-footnote">Baca, pilih, dan temukan takdirmu sendiri.</p></div></div></main>; }
