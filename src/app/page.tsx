"use client";
import React from "react";
import styles from "@/app/page.module.css";
import ChristmasScene from "@/components/chrismas-tree/Index";
import AnimatedHeartScene from "@/components/AnimatedHeart";

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.fullScreenContainer}>
        <AnimatedHeartScene
          position={[0, 0, 0]}
          scale={0.2}
          formDuration={2.5}
          colorChangeDuration={1.5}
          heartbeatSpeed={1.2}
          enableControls={true}
          backgroundColor="#0a0a0a"
        />
      </div>
    </div>
  );
};

export default Home;
