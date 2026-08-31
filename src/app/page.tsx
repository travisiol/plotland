import { Atlas } from "@/components/Atlas";
import { HowItWorks } from "@/components/HowItWorks";
import { Ledger } from "@/components/Ledger";
import { Faq } from "@/components/Faq";

/*
 * The map screen carries the pitch and the product together, so it opens
 * the page on its own. Everything after it is elaboration for anyone who
 * wants the mechanic spelled out.
 */
export default function Home() {
  return (
    <>
      <Atlas />
      <HowItWorks />
      <Ledger />
      <Faq />
    </>
  );
}
