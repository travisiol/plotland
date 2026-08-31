import { Atlas } from "@/components/Atlas";
import { Ledger } from "@/components/Ledger";
import { HowItWorks } from "@/components/HowItWorks";
import { Faq } from "@/components/Faq";
import { Masthead } from "@/components/Masthead";

export default function Home() {
  return (
    <>
      <Masthead />
      <Atlas />
      <HowItWorks />
      <Ledger />
      <Faq />
    </>
  );
}
