// The home page hero: the season's four pairs as a scroll-driven frame sequence,
// built on the FrameSequenceHero component from components/ui.
import { FrameSequenceHero, type FrameSequenceStep } from "@/components/ui/mac-book-neo-hero";
import { HERO_FRAMES, heroFrame } from "@/lib/hero";

export type SeasonHeroProps = {
  /** "Sal y" */
  titleLead: string;
  /** "Sol", set in the shimmering lens colours */
  titleAccent: string;
  subtitle: string;
  steps: FrameSequenceStep[];
};

export default function SeasonHero({ titleLead, titleAccent, subtitle, steps }: SeasonHeroProps) {
  return (
    <FrameSequenceHero
      className="aztrals-hero"
      frameCount={HERO_FRAMES}
      framePath={heroFrame}
      eagerCount={60}
      scrollHeight="460vh"
      title={
        <>
          <span className="fsh-title-dark">{titleLead}</span>{" "}
          <span className="fsh-title-rainbow">{titleAccent}</span>
        </>
      }
      subtitle={subtitle}
      steps={steps}
    />
  );
}
