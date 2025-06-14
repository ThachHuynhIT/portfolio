import React from "react";
import styles from "@/app/page.module.css";
import Countdown3D from "@/components/MessageDots";

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <Countdown3D messages={["Yêu em.", "Anh hạnh phúc khi có em.", "Anh nhớ em nhiều lắm.", "Anh yêu em rất nhiều."]} />
    </div>
  );
};

export default Home;
