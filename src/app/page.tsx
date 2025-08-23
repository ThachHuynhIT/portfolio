"use client";
import React from "react";
import styles from "@/app/page.module.css";
import "@css/LoveLetter.css";
import HeartGlowTrails from "@/components/Hearth2";

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.fullScreenContainer}>
        <HeartGlowTrails />
      </div>
    </div>
  );
};

export default Home;
