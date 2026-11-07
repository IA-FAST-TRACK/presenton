import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isCommunityEnabled } from "@/utils/community";
import CommunityPage from "./components/CommunityPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comunidad | AI Fast Track Presentaciones",
  description: "Explora diseños de presentaciones y prompts de la comunidad.",
};

export default function Page() {
  if (!isCommunityEnabled(process.env.PRESENTON_COMMUNITY_ENABLED)) {
    notFound();
  }

  return <CommunityPage />;
}
