import React from "react";

import UploadPage from "./components/UploadPage";
import GenerateHeader from "./components/GenerateHeader";
import { Metadata } from "next";
import { normalizePresentationGenerationMode } from "@/utils/presentationGenerationMode";
import { isCommunityEnabled } from "@/utils/community";

export const metadata: Metadata = {
  // Description, Open Graph and Twitter metadata are inherited from the
  // root layout (AI Fast Track branding).
  title: "AI Fast Track Presentaciones",
};

const page = () => {
  const presentationGenerationMode = normalizePresentationGenerationMode(
    process.env.PRESENTATION_GENERATION_MODE,
  );

  return (
    <div className="relative flex min-h-dvh flex-col">
      <GenerateHeader />
      <main className="flex flex-1 flex-col pb-10 pt-[46px]">
        <div className="motion-enter mb-7 flex flex-col items-center justify-center gap-1.5 px-4 text-center">
          <h1 className="font-syne text-[36px] font-medium leading-normal tracking-[-0.58px] text-[#101323] sm:text-[48px] lg:text-[58px] lg:leading-[70px]">
            Turn Ideas into Slides
          </h1>
          <p className="max-w-[609px] font-syne text-base leading-[1.4] tracking-[0.2px] text-[#101323CC] sm:text-xl">Turn prompts or documents into presentations with AI</p>
        </div>

        <UploadPage
          communityEnabled={isCommunityEnabled(process.env.PRESENTON_COMMUNITY_ENABLED)}
          presentationGenerationMode={presentationGenerationMode}
        />
      </main>
    </div>
  );
};

export default page;
