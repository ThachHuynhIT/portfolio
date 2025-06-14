"use client";
import React, { useState } from "react";
import styles from "./slider.module.css";
// import Image from "next/image";

const HeroSlider = () => {
  const slides = [
    {
      id: 1,
      title: "Welcome to My Portfolio",
      description: "Explore my work and projects.",
      image: "/images/slider1.jpg",
    },
    {
      id: 2,
      title: "Creative Solutions",
      description: "Innovative designs and ideas.",
      image: "/images/slider2.jpg",
    },
    {
      id: 3,
      title: "Let's Collaborate",
      description: "Reach out to work together.",
      image: "/images/slider3.jpg",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className={styles.sliderContainer}>
      <div className={styles.slides}>
        {slides.map((slide, index) => (
          <div key={slide.id} className={`${styles.slide} ${index === currentSlide ? styles.active : ""}`}>
            <img className={styles.image} src={slide.image} alt={slide.title} />
            <div className={styles.content}>
              <h2>{slide.title}</h2>
              <p>{slide.description}</p>
            </div>
          </div>
        ))}
      </div>
      <button className={styles.prevButton} onClick={prevSlide}>
        &#10094;
      </button>
      <button className={styles.nextButton} onClick={nextSlide}>
        &#10095;
      </button>
    </div>
  );
};

export default HeroSlider;
