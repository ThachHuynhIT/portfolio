import React from "react";
import styles from "@/app/page.module.css";

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1>Welcome to My Portfolio</h1>
      <p>This is the home page of my portfolio website.</p>
      <a href="#about" style={{ textDecoration: "none", color: "blue" }}>
        Learn more about me
      </a>
    </div>
  );
};

export default Home;
