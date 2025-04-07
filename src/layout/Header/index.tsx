"use client";
import React, { useEffect } from "react";
import styles from "@/layout/Header/header.module.css";

export interface INavConfig {
  label: string;
  link: string;
}

export const navConfig: INavConfig[] = [
  { label: "Home", link: "#home" },
  { label: "About", link: "#about" },
  { label: "Projects", link: "#projects" },
  { label: "Contact", link: "#contact" },
];

export const HEADER_LOGO_STRING: string = "ThachHuynh";

const Header: React.FC = () => {
  const [locationHash, setLocationHash] = React.useState<string>("#home");

  useEffect(() => {
    const handleHashChange = () => {
      const newHash = window.location.hash;
      if (newHash) {
        setLocationHash(newHash);
      } else {
        setLocationHash("#home");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logoContainer}>
          <div className={styles.textLogo}>{HEADER_LOGO_STRING}</div>
        </div>
        <nav className={styles.nav}>
          {navConfig!.map((item: INavConfig) => (
            <a key={item.label} href={item.link} className={`${styles.link} ${locationHash === item.link ? styles.active : ""}`}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
