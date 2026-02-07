"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import styles from "./word-analyzer.module.css";

interface AnalysisResult {
  totalUniqueWords: number;
  top3Words: { word: string; count: number }[];
}

export default function WordAnalyzerPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileContent, setFileContent] = useState<string>("");
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Create Web Worker
    const workerCode = `
      self.onmessage = function(e) {
        const text = e.data;
        
        // Validate: only alphabet, dots, commas, spaces allowed
        const validPattern = /^[a-zA-Z.,\\s]*$/;
        if (!validPattern.test(text)) {
          self.postMessage({ error: "File chứa ký tự không hợp lệ. Chỉ cho phép chữ cái, dấu chấm, dấu phẩy và khoảng trắng." });
          return;
        }
        
        // Remove punctuation and convert to lowercase
        const cleanedText = text.replace(/[.,]/g, " ").toLowerCase();
        
        // Split into words and filter empty strings
        const words = cleanedText.split(/\\s+/).filter(word => word.length > 0);
        
        if (words.length === 0) {
          self.postMessage({ error: "File không chứa từ nào." });
          return;
        }
        
        // Count word frequency
        const wordCount = {};
        for (const word of words) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
        
        const uniqueWords = Object.keys(wordCount);
        
        if (uniqueWords.length < 3) {
          self.postMessage({ error: "File cần có ít nhất 3 từ khác nhau." });
          return;
        }
        
        // Sort by count descending
        const sortedWords = uniqueWords
          .map(word => ({ word, count: wordCount[word] }))
          .sort((a, b) => b.count - a.count);
        
        const top3 = sortedWords.slice(0, 3);
        
        self.postMessage({
          result: {
            totalUniqueWords: uniqueWords.length,
            top3Words: top3
          }
        });
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (e) => {
      setIsProcessing(false);
      if (e.data.error) {
        setError(e.data.error);
        setResult(null);
      } else {
        setResult(e.data.result);
        setError("");
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  const processFile = useCallback((file: File) => {
    setError("");
    setResult(null);
    setFileContent("");

    // Check file extension
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Chỉ chấp nhận file có đuôi .txt");
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text);
      
      if (workerRef.current) {
        workerRef.current.postMessage(text);
      }
    };
    reader.onerror = () => {
      setError("Không thể đọc file");
      setIsProcessing(false);
    };
    reader.readAsText(file);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const resetAnalysis = () => {
    setResult(null);
    setError("");
    setFileName("");
    setFileContent("");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Word Analyzer</h1>
      <p className={styles.description}>
        Kéo thả file văn bản (.txt) để phân tích tần suất từ
      </p>

      <div className={styles.rules}>
        <h3>Quy tắc file văn bản:</h3>
        <ul>
          <li>Chỉ chứa chữ cái (a-z, A-Z)</li>
          <li>Các ký tự đặc biệt cho phép: dấu chấm (.), dấu phẩy (,), khoảng trắng</li>
          <li>Không chứa số</li>
          <li>Cần có ít nhất 3 từ khác nhau</li>
        </ul>
      </div>

      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className={styles.dropContent}>
          <svg
            className={styles.uploadIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className={styles.dropText}>
            Kéo thả file .txt vào đây
          </p>
          <p className={styles.dropSubtext}>hoặc</p>
          <label className={styles.fileLabel}>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileInput}
              className={styles.fileInput}
            />
            Chọn file
          </label>
        </div>
      </div>

      {isProcessing && (
        <div className={styles.processing}>
          <div className={styles.spinner}></div>
          <span>Đang xử lý với Web Worker...</span>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles.errorIcon}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className={styles.resultSection}>
          <div className={styles.fileName}>
            <svg viewBox="0 0 24 24" fill="currentColor" className={styles.fileIcon}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
              <polyline points="14 2 14 8 20 8" stroke="currentColor" fill="none" strokeWidth="2" />
            </svg>
            <span>{fileName}</span>
            <button onClick={resetAnalysis} className={styles.resetButton}>
              Phân tích file khác
            </button>
          </div>

          {fileContent && (
            <div className={styles.filePreview}>
              <h4>Nội dung file:</h4>
              <pre>{fileContent}</pre>
            </div>
          )}

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Tổng số từ khác nhau</span>
              <span className={styles.statValue}>{result.totalUniqueWords}</span>
            </div>
          </div>

          <div className={styles.top3Section}>
            <h3>Top 3 từ xuất hiện nhiều nhất:</h3>
            <div className={styles.top3Grid}>
              {result.top3Words.map((item, index) => (
                <div
                  key={item.word}
                  className={`${styles.top3Card} ${styles[`rank${index + 1}`]}`}
                >
                  <div className={styles.rank}>#{index + 1}</div>
                  <div className={styles.word}>{item.word}</div>
                  <div className={styles.count}>
                    <span className={styles.countNumber}>{item.count}</span>
                    <span className={styles.countLabel}>lần</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
