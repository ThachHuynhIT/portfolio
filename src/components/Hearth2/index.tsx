import React, { useEffect } from "react";
import HeartRods from "./HeartRods";
import TextOverlay from "./TextOverlay";

const wrapStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100vh",
  background: "#000",
  // overflow: "hidden",
};

export type Hearth2Props = {
  texts?: string[];
  color?: string;
  fontSize?: number;
};

export default function Hearth2({
  texts = ["chúc mừng năm mới chúc mừng năm mới", "song hỉ lâm môn chúc mừng năm ", "anh yêu em", "anh nhớ em nhiều"],
}: Hearth2Props) {
  const [isShowText, setIsShowText] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShowText(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={wrapStyle}>
      <HeartRods />
      {isShowText && <TextOverlay texts={texts} />}
    </div>
  );
}
