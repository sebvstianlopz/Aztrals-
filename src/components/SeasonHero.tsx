// The home page hero: the season's four pairs as a scroll-driven frame sequence,
// built on the FrameSequenceHero component from components/ui.
import { FrameSequenceHero, type FrameSequenceStep } from "@/components/ui/mac-book-neo-hero";
import { HERO_FRAMES, PHONE_QUERY, heroFrame } from "@/lib/hero";

export type SeasonHeroProps = {
  /** "Sal y" */
  titleLead: string;
  /** "Sol", set in the shimmering lens colours */
  titleAccent: string;
  subtitle: string;
  steps: FrameSequenceStep[];
};

// Decided once in the browser: phones load the 800×600 frames, larger screens the 1200×900 ones.
// (The server-rendered first frame is full size; the component switches to the phone set as soon
// as it draws.)
const phone = typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches;
const framePath = (i: number) => heroFrame(i, phone);

export default function SeasonHero({ titleLead, titleAccent, subtitle, steps }: SeasonHeroProps) {
  return (
    <FrameSequenceHero
      className="aztrals-hero"
      frameCount={HERO_FRAMES}
      framePath={framePath}
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
