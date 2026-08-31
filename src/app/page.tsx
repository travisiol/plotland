import { Hero } from "@/components/Hero";
import { EconomyFlow } from "@/components/EconomyFlow";
import { Atlas } from "@/components/Atlas";
import { HowItWorks } from "@/components/HowItWorks";
import { Ledger } from "@/components/Ledger";
import { Faq } from "@/components/Faq";

/*
 * Order is the argument: say what a plot is, show the chain in five beats,
 * then hand over the map. Everything after that is elaboration for anyone
 * who wants it.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <EconomyFlow />
      <Atlas />
      <HowItWorks />
      <Ledger />
      <Faq />
    </>
  );
}
