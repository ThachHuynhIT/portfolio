import { GamesShell } from "@/components/games/GamesShell";

export default function GamesHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="game-shell relative z-10 min-h-[100dvh] bg-[radial-gradient(ellipse_at_top,#1e1633_0%,#0a0810_70%)] text-white">
      <GamesShell>{children}</GamesShell>
    </div>
  );
}
