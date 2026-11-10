import { gsap } from "gsap";
import { useEffect, useState } from "react";
import { CrowdCanvas } from "@/components/ui/skiper39";

// Open Peeps crowd sprite (15 × 7 figures), as used by the Skiper UI demo.
const CROWD_SRC =
  "https://cdn.21st.dev/assets/localized/abdb8990a7bef8c2f5af3e45f0a3c969c4b0603fba8be92e81347de4ea4e1ed7.png";

/**
 * The walking crowd at the bottom of the intro screen. It unmounts as soon as the intro closes,
 * which stops its render loop. With reduced motion the crowd stands still.
 */
export default function CrowdIntro() {
  const [live, setLive] = useState(true);

  useEffect(() => {
    const done = () => setLive(false);
    window.addEventListener("aztrals:intro-done", done, { once: true });

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) gsap.globalTimeline.timeScale(0);

    return () => {
      window.removeEventListener("aztrals:intro-done", done);
      if (still) gsap.globalTimeline.timeScale(1);
    };
  }, []);

  if (!live) return null;
  return <CrowdCanvas src={CROWD_SRC} rows={15} cols={7} />;
}
