"use client";

import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { IMAGE_PROVIDERS, LLM_PROVIDERS } from "@/utils/providerConstants";
import Wrapper from "@/components/Wrapper";

export default function GenerateHeader() {
  const config = useSelector((state: RootState) => state.userConfig.llm_config);
  const providers = [LLM_PROVIDERS[config.LLM || "openai"], config.DISABLE_IMAGE_GENERATION ? undefined : IMAGE_PROVIDERS[config.IMAGE_PROVIDER || ""]].filter((provider) => Boolean(provider?.icon));

  return (
    <header className="h-[66px] bg-white">
      <Wrapper className="flex h-full items-center justify-between gap-3 px-4 sm:px-10 lg:px-20">
        <Link href="/dashboard" aria-label="AI Fast Track Presentaciones" className="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"><Image src="/logo-with-bg.png" alt="AI Fast Track Presentaciones" width={40} height={40} /></Link>
        <div className="flex h-[42px] items-center gap-2 rounded-xl border border-[#EDEEEF] bg-white px-2 font-syne text-sm text-[#191919] sm:gap-[18px] sm:px-3">
          <Link href="/settings" aria-label="Configure AI providers" className="flex items-center gap-1.5 rounded-full p-1.5 hover:bg-[#F8F8FA] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]">
            <span className="flex items-center" aria-hidden="true">{providers.map((provider, index) => <span key={`${provider!.value}-${index}`} className={`flex h-6 w-6 items-center justify-center overflow-hidden rounded-[3px] border border-[#EDEEEF] bg-white ${index ? "-ml-px rotate-[7deg]" : "-rotate-[6deg]"}`}><Image src={provider!.icon!} alt="" width={16} height={16} className="object-contain" /></span>)}</span>
            <span>{config.LLM === "presenton" ? "Presenton" : "BYOK"}</span>
          </Link>
          <span className="h-5 w-px bg-[#EDEEEF]" aria-hidden="true" />
          <a href="https://aifasttrack.tech" target="_blank" rel="noreferrer" className="rounded-full p-1.5 hover:bg-[#F8F8FA] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]" aria-label="AI Fast Track"><Image src="/aifasttrack-mark.svg" alt="" width={18} height={18} /></a>
        </div>
      </Wrapper>
    </header>
  );
}
