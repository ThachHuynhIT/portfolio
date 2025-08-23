"use client";
import React, { useEffect, useState } from "react";
import "./card-flip-demo.css";

const CardFlipDemo = () => {
  const [opened, setOpened] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [outZIndex, setOutZIndex] = useState(3);
  const [inTopZIndex, setInTopZIndex] = useState(2);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpened(true);
      setIsClosing(false);

      setTimeout(() => {
        setOutZIndex(2);
        setInTopZIndex(3);
      }, 375);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    setOpened(true);
    setIsClosing(false);

    setTimeout(() => {
      setOutZIndex(2);
      setInTopZIndex(3);
    }, 375);
  };

  const handleClose = () => {
    setIsClosing(true);

    setTimeout(() => {
      setOutZIndex(3);
      setInTopZIndex(2);
    }, 375);

    setTimeout(() => {
      setOpened(false);
      setIsClosing(false);
    }, 750);
  };

  return (
    <div className="perspective" style={{ position: "relative", width: 240, height: 170 }}>
      <div
        className={`tile out ${opened && !isClosing ? "openingTop topOpen" : isClosing ? "closingTop" : ""}`}
        style={{ left: 0, zIndex: outZIndex, background: "linear-gradient(to bottom, #ff7e5f, #feb47b)" }}
        onClick={handleOpen}
      >
        To my love
      </div>
      <div
        className={`tile in-top ${opened && !isClosing ? "openingBottom bottomOpen" : isClosing ? "closingBottom" : ""} `}
        style={{
          left: 0,
          zIndex: inTopZIndex,
          background: "linear-gradient(to bottom, #6a11cb, #2575fc)",
        }}
        onClick={handleClose}
      >
        <p style={{ margin: 0, padding: 20 }}>Word inside</p>
      </div>
      <div className="tile in-bottom" style={{ left: 0 }}></div>
    </div>
  );
};

export default CardFlipDemo;
