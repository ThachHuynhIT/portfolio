"use client";
import React from "react";
import styles from "@/app/page.module.css";
import "@css/LoveLetter.css";
import HeartGlowTrails from "@/components/Heart";

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.fullScreenContainer}>
        <HeartGlowTrails
          texts={["I love you", "You're amazing", "Keep shining"]}
          imageUrl="https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=500&h=500&fit=crop&crop=face"
        />
      </div>
    </div>
  );
};

export default Home;
