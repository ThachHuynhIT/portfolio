"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "./water-container.module.css";

// Algorithm to calculate trapped water
function calculateTrappedWater(heights: number[]): {
  waterLevel: number[];
  totalWater: number;
} {
  const n = heights.length;
  if (n === 0) return { waterLevel: [], totalWater: 0 };

  const leftMax: number[] = new Array(n).fill(0);
  const rightMax: number[] = new Array(n).fill(0);
  const waterLevel: number[] = new Array(n).fill(0);

  // Calculate left max for each position
  leftMax[0] = heights[0];
  for (let i = 1; i < n; i++) {
    leftMax[i] = Math.max(leftMax[i - 1], heights[i]);
  }

  // Calculate right max for each position
  rightMax[n - 1] = heights[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    rightMax[i] = Math.max(rightMax[i + 1], heights[i]);
  }

  // Calculate water level at each position
  let totalWater = 0;
  for (let i = 0; i < n; i++) {
    waterLevel[i] = Math.min(leftMax[i], rightMax[i]);
    totalWater += waterLevel[i] - heights[i];
  }

  return { waterLevel, totalWater };
}

export default function WaterContainerPage() {
  const [input, setInput] = useState<string>("3,0,2,0,4");
  const [heights, setHeights] = useState<number[]>([3, 0, 2, 0, 4]);
  const [totalWater, setTotalWater] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const parseInput = useCallback((value: string) => {
    setInput(value);
    setError("");

    if (!value.trim()) {
      setHeights([]);
      setTotalWater(0);
      return;
    }

    const parts = value.split(",").map((s) => s.trim());
    const nums: number[] = [];

    for (const part of parts) {
      if (part === "") continue;
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 0) {
        setError("Vui lòng nhập các số tự nhiên (≥0) cách nhau bởi dấu phẩy");
        return;
      }
      nums.push(num);
    }

    setHeights(nums);
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (heights.length === 0) return;

    const { waterLevel, totalWater: water } = calculateTrappedWater(heights);
    setTotalWater(water);

    const maxHeight = Math.max(...heights, ...waterLevel, 1);
    const padding = 40;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;

    const blockWidth = Math.min(60, availableWidth / heights.length);
    const unitHeight = availableHeight / (maxHeight + 1);

    const startX = padding + (availableWidth - blockWidth * heights.length) / 2;
    const baseY = canvas.height - padding;

    // Draw grid lines
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= maxHeight; i++) {
      const y = baseY - i * unitHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw water first (behind blocks)
    ctx.fillStyle = "rgba(66, 165, 245, 0.7)";
    for (let i = 0; i < heights.length; i++) {
      const waterHeight = waterLevel[i] - heights[i];
      if (waterHeight > 0) {
        const x = startX + i * blockWidth;
        const y = baseY - waterLevel[i] * unitHeight;
        const h = waterHeight * unitHeight;
        ctx.fillRect(x, y, blockWidth, h);
      }
    }

    // Draw blocks
    ctx.fillStyle = "#424242";
    ctx.strokeStyle = "#212121";
    ctx.lineWidth = 2;
    for (let i = 0; i < heights.length; i++) {
      if (heights[i] > 0) {
        const x = startX + i * blockWidth;
        const y = baseY - heights[i] * unitHeight;
        const h = heights[i] * unitHeight;
        ctx.fillRect(x, y, blockWidth, h);
        ctx.strokeRect(x, y, blockWidth, h);
      }
    }

    // Draw block outlines for height 0
    ctx.strokeStyle = "#9e9e9e";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    for (let i = 0; i < heights.length; i++) {
      const x = startX + i * blockWidth;
      ctx.strokeRect(x, baseY - unitHeight * 0.1, blockWidth, unitHeight * 0.1);
    }
    ctx.setLineDash([]);

    // Draw index labels
    ctx.fillStyle = "#333";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    for (let i = 0; i < heights.length; i++) {
      const x = startX + i * blockWidth + blockWidth / 2;
      ctx.fillText(i.toString(), x, baseY + 20);
    }

    // Draw height labels on blocks
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Arial";
    for (let i = 0; i < heights.length; i++) {
      if (heights[i] > 0) {
        const x = startX + i * blockWidth + blockWidth / 2;
        const y = baseY - heights[i] * unitHeight + 20;
        ctx.fillText(heights[i].toString(), x, y);
      }
    }
  }, [heights]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = 400;
          drawCanvas();
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawCanvas]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Water Container Visualization</h1>
      <p className={styles.description}>
        Nhập dãy số tự nhiên cách nhau bởi dấu phẩy để tính lượng nước có thể chứa được
      </p>

      <div className={styles.inputSection}>
        <label htmlFor="heights-input" className={styles.label}>
          Nhập dãy số (VD: 3,0,2,0,4):
        </label>
        <input
          id="heights-input"
          type="text"
          value={input}
          onChange={(e) => parseInput(e.target.value)}
          className={styles.input}
          placeholder="Nhập các số cách nhau bởi dấu phẩy..."
        />
        {error && <p className={styles.error}>{error}</p>}
      </div>

      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>

      <div className={styles.result}>
        <div className={styles.resultCard}>
          <span className={styles.resultLabel}>Lượng nước chứa được:</span>
          <span className={styles.resultValue}>{totalWater}</span>
          <span className={styles.resultUnit}>đơn vị³</span>
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendBlock}></div>
          <span>Block (tường)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendWater}></div>
          <span>Nước</span>
        </div>
      </div>

      <div className={styles.explanation}>
        <h3>Giải thích:</h3>
        <ul>
          <li>Vị trí của cột là index của số trong mảng</li>
          <li>Giá trị của số là độ cao của cột (block)</li>
          <li>Các cột tạo thành bức tường, nước được chứa giữa các bức tường</li>
          <li>Mỗi block có thể tích = 1 đơn vị³</li>
        </ul>
      </div>
    </div>
  );
}
