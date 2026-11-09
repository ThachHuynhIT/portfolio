"use client";

import { useEffect } from "react";

/**
 * Staggered scroll reveal for `.portfolio-reveal` elements (homepage sections
 * below the hero and every non-home page).
 *
 * CSS hides unrevealed elements only when scripting is enabled (and motion is
 * allowed), so content still renders without JS. This observer marks each
 * element `data-revealed` as it enters the viewport. Elements that enter in
 * the same batch get increasing `--reveal-i`, so a row of cards appears one
 * after another, whatever their position in the list. New elements (route
 * changes, filtering) are picked up through a MutationObserver.
 */
export default function RevealObserver() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        const entering = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement)
          .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
        entering.forEach((element, index) => {
          element.style.setProperty("--reveal-i", String(index));
          element.dataset.revealed = "";
          io.unobserve(element);
        });
      },
      // threshold 0: any part crossing the 88% line counts, so elements taller
      // than the viewport (long articles) still reveal.
      { rootMargin: "0px 0px -12% 0px", threshold: 0 }
    );

    // Tells the CSS failsafe that reveals are handled here (it only fires
    // when this never ran, e.g. a failed hydration).
    document.documentElement.dataset.revealReady = "";

    const observeWithin = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(".portfolio-reveal:not([data-revealed])").forEach((element) => io.observe(element));
    };
    observeWithin(document);

    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(".portfolio-reveal:not([data-revealed])")) io.observe(node);
          observeWithin(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return null;
}
