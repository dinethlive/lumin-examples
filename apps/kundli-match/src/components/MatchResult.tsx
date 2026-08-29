import { AgreementMeter } from "./AgreementMeter";
import { ConfidencePills } from "./ConfidencePills";
import { SystemsPanel } from "./SystemsPanel";
import { DoshaCard } from "./DoshaCard";
import { PartnerProfileCard } from "./PartnerProfileCard";
import { DisagreementDrawer } from "./DisagreementDrawer";
import { DisclaimerNote } from "./DisclaimerNote";
import type { MatchResponse } from "@/lib/types";

export function MatchResult({ data }: { data: MatchResponse }) {
  return (
    <div className="space-y-5">
      <AgreementMeter headline={data.headline} />
      <ConfidencePills confidence={data.confidence} />
      <SystemsPanel systems={data.systems} />
      <DoshaCard doshas={data.doshas} />
      <PartnerProfileCard partnerProfile={data.partnerProfile} />
      <DisagreementDrawer disagreements={data.disagreements} />
      <DisclaimerNote text={data.disclaimer} />
    </div>
  );
}
