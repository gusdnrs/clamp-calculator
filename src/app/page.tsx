'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [baseFont, setBaseFont] = useState<number>(16);
  const [minWidth, setMinWidth] = useState<number>(320);
  const [minFont, setMinFont] = useState<number>(32);
  const [maxWidth, setMaxWidth] = useState<number>(640);
  const [maxFont, setMaxFont] = useState<number>(42);

  const [clampString, setClampString] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!baseFont || !minWidth || !minFont || !maxWidth || !maxFont) return;
    if (minWidth === maxWidth) return; // Prevent division by zero

    const minRem = minFont / baseFont;
    const maxRem = maxFont / baseFont;

    const slope = ((maxFont - minFont) / (maxWidth - minWidth)) * 100;
    const intersectPx = minFont - (slope / 100) * minWidth;
    const intersectRem = intersectPx / baseFont;

    const formatNum = (num: number) => parseFloat(num.toFixed(4));

    const slopeStr = formatNum(slope);
    const sign = intersectRem >= 0 ? '+' : '-';
    const intersectStr = Math.abs(formatNum(intersectRem));

    // Handle string format based on intercept
    let fluidPart = `${slopeStr}vw`;
    if (intersectStr !== 0) {
      fluidPart += ` ${sign} ${intersectStr}rem`;
    }

    const calculatedStr = `clamp(${formatNum(minRem)}rem, ${fluidPart}, ${formatNum(maxRem)}rem)`;
    setClampString(calculatedStr);
  }, [baseFont, minWidth, minFont, maxWidth, maxFont]);

  const handleCopy = async () => {
    if (!clampString) return;
    try {
      await navigator.clipboard.writeText(clampString);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Clamp Calculator</h1>
      <p className={styles.subtitle}>✨ 몽글몽글 3D 타이포그래피 계산기 ✨</p>

      <div className={styles.card}>
        <div className={styles.formGroup}>
          <label className={styles.label}>기준 폰트 (px)</label>
          <input
            type="number"
            className={styles.input}
            value={baseFont || ''}
            onChange={(e) => setBaseFont(Number(e.target.value))}
            placeholder="예: 16"
          />
        </div>

        <div className={styles.divider} />

        <div className={styles.grid}>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>최소 구간</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>넓이 (px)</label>
              <input
                type="number"
                className={styles.input}
                value={minWidth || ''}
                onChange={(e) => setMinWidth(Number(e.target.value))}
                placeholder="예: 320"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>폰트 크기 (px)</label>
              <input
                type="number"
                className={styles.input}
                value={minFont || ''}
                onChange={(e) => setMinFont(Number(e.target.value))}
                placeholder="예: 32"
              />
            </div>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>최대 구간</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>넓이 (px)</label>
              <input
                type="number"
                className={styles.input}
                value={maxWidth || ''}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                placeholder="예: 640"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>폰트 크기 (px)</label>
              <input
                type="number"
                className={styles.input}
                value={maxFont || ''}
                onChange={(e) => setMaxFont(Number(e.target.value))}
                placeholder="예: 42"
              />
            </div>
          </div>
        </div>

        <div className={styles.resultSection}>
          <h3 className={styles.resultLabel}>결과값 (클릭하여 복사)</h3>
          <button
            className={`${styles.resultButton} ${isCopied ? styles.copied : ''}`}
            onClick={handleCopy}
            title="복사하기"
          >
            {clampString || '값을 입력해주세요'}
          </button>
        </div>
      </div>

      {isCopied && (
        <div className={styles.toast}>클립보드에 안전하게 복사되었어요! 🚀</div>
      )}
    </main>
  );
}
