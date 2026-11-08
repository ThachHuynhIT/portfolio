"use client";

import dynamic from "next/dynamic";

// Floating overlay with no SSR value — mounted on every route, so keep it
// out of the initial/shared bundle. `ssr: false` is only allowed inside a
// Client Component (Next 15), hence this wrapper for the root layout.
const GlobalMusicPlayerLazy = dynamic(() => import("./GlobalMusicPlayer"), { ssr: false });

export default GlobalMusicPlayerLazy;
