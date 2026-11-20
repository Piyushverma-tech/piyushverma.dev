import { Contact } from "@/components/home/contact";
import { Hero } from "@/components/home/hero";
import { SelectedWork } from "@/components/home/selected-work";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ path: "/" });

export default function Home() {
  return (
    <>
      <Hero />
      <SelectedWork />
      <Contact />
    </>
  );
}
