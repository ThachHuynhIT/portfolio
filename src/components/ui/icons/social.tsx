/**
 * Lazy registry: social platform logos (monochrome — inherit surrounding text color,
 * matching how these were previously hand-drawn inline in Footer.tsx).
 */
import type { ReactNode } from "react";
import { SiGithub, SiX, SiFacebook, SiYoutube, SiInstagram, SiDiscord, SiTelegram } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";
import type { SocialBrandIconName } from "@/lib/icon-names";
import { BrandIconFrame, type BrandIconProps } from "./frames";

const SOCIAL_ICONS: Record<SocialBrandIconName, ReactNode> = {
  github: <SiGithub style={{ width: "100%", height: "100%" }} />,
  linkedin: <FaLinkedin style={{ width: "100%", height: "100%" }} />,
  twitter: <SiX style={{ width: "100%", height: "100%" }} />,
  facebook: <SiFacebook style={{ width: "100%", height: "100%" }} />,
  youtube: <SiYoutube style={{ width: "100%", height: "100%" }} />,
  instagram: <SiInstagram style={{ width: "100%", height: "100%" }} />,
  discord: <SiDiscord style={{ width: "100%", height: "100%" }} />,
  telegram: <SiTelegram style={{ width: "100%", height: "100%" }} />,
};

export default function SocialBrandIcon({ name, size, className }: BrandIconProps<SocialBrandIconName>) {
  return (
    <BrandIconFrame size={size} className={className}>
      {SOCIAL_ICONS[name]}
    </BrandIconFrame>
  );
}
