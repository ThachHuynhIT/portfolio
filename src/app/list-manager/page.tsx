"use client";

import React, { useState, useCallback } from "react";
import styles from "./list-manager.module.css";

interface Operation {
  command: string;
  listAfter: number[];
  result?: number;
}

export default function ListManagerPage() {
  const [list, setList] = useState<number[]>([]);
  const [input, setInput] = useState<string>("");
  const [history, setHistory] = useState<Operation[]>([
    { command: "Ban đầu", listAfter: [] },
  ]);
  const [error, setError] = useState<string>("");
  const [lastResult, setLastResult] = useState<number | null>(null);

  const findMinInRange = (arr: number[], i: number, j: number): number => {
    // i and j are 1-indexed
    const start = i - 1;
    const end = j - 1;
    let min = arr[start];
    for (let k = start + 1; k <= end; k++) {
      if (arr[k] < min) min = arr[k];
    }
    return min;
  };

  const executeCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      setError("");
      setLastResult(null);

      // Parse command: +i x or ?i j
      const addMatch = trimmed.match(/^\+\s*(\d+)\s+(\d+)$/);
      const queryMatch = trimmed.match(/^\?\s*(\d+)\s+(\d+)$/);

      if (addMatch) {
        const i = parseInt(addMatch[1], 10);
        const x = parseInt(addMatch[2], 10);

        // Validate
        if (i < 0 || i > list.length) {
          setError(
            `Vị trí i phải từ 0 đến ${list.length} (độ dài danh sách hiện tại)`
          );
          return;
        }

        // Insert x after position i (0 means insert at beginning)
        const newList = [...list];
        newList.splice(i, 0, x);

        setList(newList);
        setHistory((prev) => [
          ...prev,
          { command: `+${i} ${x}`, listAfter: newList },
        ]);
        setInput("");
      } else if (queryMatch) {
        const i = parseInt(queryMatch[1], 10);
        const j = parseInt(queryMatch[2], 10);

        // Validate
        if (i < 1 || i > list.length) {
          setError(`Vị trí i phải từ 1 đến ${list.length}`);
          return;
        }
        if (j < i || j > list.length) {
          setError(`Vị trí j phải từ ${i} đến ${list.length}`);
          return;
        }

        const minValue = findMinInRange(list, i, j);
        setLastResult(minValue);
        setHistory((prev) => [
          ...prev,
          { command: `?${i} ${j}`, listAfter: [...list], result: minValue },
        ]);
        setInput("");
      } else {
        setError(
          'Lệnh không hợp lệ. Sử dụng "+i x" để thêm hoặc "?i j" để truy vấn'
        );
      }
    },
    [list]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(input);
    }
  };

  const resetList = () => {
    setList([]);
    setHistory([{ command: "Ban đầu", listAfter: [] }]);
    setInput("");
    setError("");
    setLastResult(null);
  };

  const runExample = () => {
    // Run the example from the image
    const commands = ["+1 5", "+1 3", "+1 4", "?1 2", "+0 2", "?2 4", "+4 1", "?3 5"];
    let currentList: number[] = [];
    const newHistory: Operation[] = [{ command: "Ban đầu", listAfter: [] }];

    for (const cmd of commands) {
      const addMatch = cmd.match(/^\+(\d+)\s+(\d+)$/);
      const queryMatch = cmd.match(/^\?(\d+)\s+(\d+)$/);

      if (addMatch) {
        const i = parseInt(addMatch[1], 10);
        const x = parseInt(addMatch[2], 10);
        const newList = [...currentList];
        if (i <= newList.length) {
          newList.splice(i, 0, x);
        }
        currentList = newList;
        newHistory.push({ command: cmd, listAfter: [...currentList] });
      } else if (queryMatch) {
        const i = parseInt(queryMatch[1], 10);
        const j = parseInt(queryMatch[2], 10);
        const minValue = findMinInRange(currentList, i, j);
        newHistory.push({
          command: cmd,
          listAfter: [...currentList],
          result: minValue,
        });
      }
    }

    setList(currentList);
    setHistory(newHistory);
    setLastResult(1);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>List Manager</h1>
      <p className={styles.description}>
        Quản lý danh sách với thao tác thêm và truy vấn phần tử nhỏ nhất
      </p>

      <div className={styles.instructions}>
        <h3>Hướng dẫn:</h3>
        <ul>
          <li>
            <code>+i x</code> - Bổ sung số nguyên x vào vị trí sau phần tử thứ i
            (i=0 nghĩa là thêm vào đầu)
          </li>
          <li>
            <code>?i j</code> - Đưa ra phần tử nhỏ nhất từ vị trí i đến j (đánh
            số từ 1)
          </li>
        </ul>
      </div>

      <div className={styles.inputSection}>
        <div className={styles.inputRow}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.input}
            placeholder="Nhập lệnh (VD: +1 5 hoặc ?1 3)..."
          />
          <button
            onClick={() => executeCommand(input)}
            className={styles.button}
          >
            Thực hiện
          </button>
          <button onClick={resetList} className={styles.buttonReset}>
            Reset
          </button>
          <button onClick={runExample} className={styles.buttonExample}>
            Chạy ví dụ
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>

      <div className={styles.currentList}>
        <h3>Danh sách hiện tại:</h3>
        <div className={styles.listVisualization}>
          {list.length === 0 ? (
            <span className={styles.empty}>Rỗng</span>
          ) : (
            list.map((num, idx) => (
              <div key={idx} className={styles.listItem}>
                <span className={styles.index}>{idx + 1}</span>
                <span className={styles.value}>{num}</span>
              </div>
            ))
          )}
        </div>
        {list.length > 0 && (
          <p className={styles.listText}>
            [{list.join(", ")}]
          </p>
        )}
      </div>

      {lastResult !== null && (
        <div className={styles.result}>
          <span className={styles.resultLabel}>Kết quả truy vấn:</span>
          <span className={styles.resultValue}>{lastResult}</span>
        </div>
      )}

      <div className={styles.historySection}>
        <h3>Lịch sử thao tác:</h3>
        <div className={styles.historyTable}>
          <table>
            <thead>
              <tr>
                <th>Yêu cầu</th>
                <th>Danh sách</th>
                <th>Đưa ra</th>
              </tr>
            </thead>
            <tbody>
              {history.map((op, idx) => (
                <tr key={idx} className={op.result !== undefined ? styles.queryRow : ""}>
                  <td>{op.command}</td>
                  <td>
                    {op.listAfter.length === 0
                      ? "Rỗng"
                      : op.listAfter.join(", ")}
                  </td>
                  <td>{op.result !== undefined ? op.result : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
