import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "💕 Our Love Story",
  description: "A special page for us",
};

export default function CoupleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
