import React from "react";
import Image from "next/image";
import styles from "@/layout/Footer/footer.module.css";

export const LAYOUT_ICON_PREFIX: string = "/icons/";
export interface IConfig {
  label: string;
  icon: string;
  link: string;
  iconDropShadow?: string;
}

const config: IConfig[] = [
  {
    label: "Facebook",
    icon: "fb.png",
    link: "https://www.facebook.com/Thach.Huynh.Blvck/",
    iconDropShadow: "drop-shadow(0 0 2px #3b5998)",
  },
  {
    label: "Instagram",
    icon: "ig.png",
    link: "https://www.instagram.com/blvckrock.t/",
    iconDropShadow: "drop-shadow(0 0 2px #C13584)",
  },
  {
    label: "LinkedIn",
    icon: "linkedin.png",
    link: "https://www.linkedin.com/in/huynh-thach-web-dev/",
    iconDropShadow: "drop-shadow(0 0 2px #0077B5)",
  },
];

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <p>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
        <ul className={styles.socialIcons}>
          {config.map((item: IConfig) => (
            <li key={item.label}>
              <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} style={{ filter: item.iconDropShadow }}>
                <Image src={`${LAYOUT_ICON_PREFIX}${item.icon}`} alt={item.label} width={24} height={24} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
