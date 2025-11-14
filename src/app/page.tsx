"use client";
import React from "react";
import styles from "@/app/page.module.css";
import ChristmasScene from "@/components/xmas-tree/Index";

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.fullScreenContainer}>
        <ChristmasScene encryptedData={""} />
      </div>
    </div>
  );
};

export default Home;
