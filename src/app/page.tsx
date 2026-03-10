'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

// Interface for breakpoint data
interface Breakpoint {
  id: string; // Unique ID
  name: string; // "base", "sm", "md", "custom"
  width: number | '';
  font: number | '';
}

// Preset tailwind breakpoints
const PRESETS = [
  { label: 'base (320px)', name: 'base', width: 320 },
  { label: 'sm (640px)', name: 'sm', width: 640 },
  { label: 'md (768px)', name: 'md', width: 768 },
  { label: 'lg (1024px)', name: 'lg', width: 1024 },
  { label: 'xl (1280px)', name: 'xl', width: 1280 },
  { label: '2xl (1536px)', name: '2xl', width: 1536 },
  { label: '직접 입력', name: 'custom', width: '' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function Home() {
  const [baseFont, setBaseFont] = useState<number>(16);
  const [className, setClassName] = useState<string>('text-h1');

  // Initial state: 3 nodes (2 intervals: base~sm, sm~md) as requested
  const [bps, setBps] = useState<Breakpoint[]>([
    { id: generateId(), name: 'base', width: 320, font: 32 },
    { id: generateId(), name: 'sm', width: 640, font: 42 },
    { id: generateId(), name: 'md', width: 768, font: 50 },
  ]);

  const [cssCodeblock, setCssCodeblock] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Get device icon and label
  const getDeviceLabel = (width: number | '') => {
    if (width === '') return '미설정';
    if (width < 640) return '모바일';
    if (width < 1024) return '태블릿';
    if (width < 1280) return '노트북';
    return '데스크탑';
  };

  // Helper function to calculate a single clamp string between two points
  const getClampString = (
    w1: number,
    f1: number,
    w2: number,
    f2: number,
    baseNz: number,
  ) => {
    const minRem = f1 / baseNz;
    const maxRem = f2 / baseNz;

    // Prevent division by zero if widths are the same
    if (w2 === w1)
      return `clamp(${minRem.toFixed(4)}rem, 0vw, ${maxRem.toFixed(4)}rem)`;

    const slope = ((f2 - f1) / (w2 - w1)) * 100;
    const intersectPx = f1 - (slope / 100) * w1;
    const intersectRem = intersectPx / baseNz;

    const formatNum = (num: number) => parseFloat(num.toFixed(4));
    const slopeStr = formatNum(slope);
    const sign = intersectRem >= 0 ? '+' : '-';
    const intersectStr = Math.abs(formatNum(intersectRem));

    let fluidPart = `${slopeStr}vw`;
    if (intersectStr !== 0) {
      fluidPart += ` ${sign} ${intersectStr}rem`;
    }

    return `clamp(${formatNum(minRem)}rem, ${fluidPart}, ${formatNum(maxRem)}rem)`;
  };

  useEffect(() => {
    if (!baseFont || !className || bps.length < 2) {
      setCssCodeblock(
        '/* 클래스 이름, 기준 폰트, 그리고 최소 2개 이상의 브레이크포인트가 필요합니다. */',
      );
      return;
    }

    // Ensure all widths and fonts are valid numbers before generating
    const validBps = bps.filter(
      (bp) => typeof bp.width === 'number' && typeof bp.font === 'number',
    ) as { id: string; name: string; width: number; font: number }[];

    if (validBps.length < 2) {
      setCssCodeblock('/* 유효한 넓이와 폰트 크기를 입력해주세요. */');
      return;
    }

    // Sort valid breakpoints by width just in case
    const sorted = [...validBps].sort((a, b) => a.width - b.width);

    let codeChunks = [];
    codeChunks.push(`/* ${className.toUpperCase()}: 섹션 유틸리티 */`);
    codeChunks.push(`@utility ${className} {`);

    // Base Interval (index 0 -> 1)
    codeChunks.push(
      `  /* 1. 기본 ~ ${sorted[1].name === 'custom' ? sorted[1].width + 'px' : sorted[1].name} 구간 (0px ~ ${sorted[1].width - 1}px) */`,
    );
    codeChunks.push(
      `  font-size: ${getClampString(sorted[0].width, sorted[0].font, sorted[1].width, sorted[1].font, baseFont)}; /* ${sorted[0].font}px ~ ${sorted[1].font}px */`,
    );

    // Intermediate Intervals
    for (let i = 1; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const currentName =
        current.name === 'custom' ? `${current.width}px` : current.name;
      const nextName = next.name === 'custom' ? `${next.width}px` : next.name;

      codeChunks.push(
        `\n  /* ${i + 1}. ${currentName} ~ ${nextName} 구간 (${current.width}px ~ ${next.width - 1}px) */`,
      );

      // We use min-[{width}px] if custom, else the standard tailwind variant name
      const variantSyntax =
        current.name === 'custom' || current.name === 'base'
          ? `min-[${current.width}px]`
          : current.name;

      codeChunks.push(`  @variant ${variantSyntax} {`);
      codeChunks.push(
        `    font-size: ${getClampString(current.width, current.font, next.width, next.font, baseFont)}; /* ${current.font}px ~ ${next.font}px */`,
      );
      codeChunks.push(`  }`);
    }

    // Final Node Fixed Value
    const last = sorted[sorted.length - 1];
    const lastName = last.name === 'custom' ? `${last.width}px` : last.name;
    const lastVariant =
      last.name === 'custom' || last.name === 'base'
        ? `min-[${last.width}px]`
        : last.name;

    codeChunks.push(
      `\n  /* ${sorted.length}. ${lastName} ~ 구간 (${last.width}px 이상): 고해상도 고정값 */`,
    );
    codeChunks.push(`  @variant ${lastVariant} {`);
    codeChunks.push(
      `    font-size: ${parseFloat((last.font / baseFont).toFixed(4))}rem; /* ${last.font}px 고정 */`,
    );
    codeChunks.push(`  }`);

    codeChunks.push(`}`);

    setCssCodeblock(codeChunks.join('\n'));
  }, [baseFont, className, bps]);

  const handleBpChange = (
    id: string,
    field: 'name' | 'width' | 'font',
    value: string | number,
  ) => {
    setBps((prev) =>
      prev.map((bp) => {
        if (bp.id !== id) return bp;

        const newBp = { ...bp, [field]: value };

        // Auto-update width if a preset name is selected
        if (field === 'name' && value !== 'custom') {
          const preset = PRESETS.find((p) => p.name === value);
          if (preset && typeof preset.width === 'number') {
            newBp.width = preset.width;
          }
        }
        return newBp;
      }),
    );
  };

  const addNode = () => {
    // Attempt to guess the next logical breakpoint to add
    const lastBp = bps[bps.length - 1];
    let newName = 'custom';
    let newWidth: number | '' = '';

    if (lastBp) {
      if (lastBp.name === 'sm') {
        newName = 'md';
        newWidth = 768;
      } else if (lastBp.name === 'md') {
        newName = 'lg';
        newWidth = 1024;
      } else if (lastBp.name === 'lg') {
        newName = 'xl';
        newWidth = 1280;
      } else if (lastBp.name === 'xl') {
        newName = '2xl';
        newWidth = 1536;
      }
    }

    setBps((prev) => [
      ...prev,
      {
        id: generateId(),
        name: newName,
        width: newWidth,
        font: typeof lastBp.font === 'number' ? lastBp.font + 8 : '',
      },
    ]);
  };

  const removeNode = (id: string) => {
    if (bps.length <= 2) {
      alert('최소 2개의 구간이 필요합니다.');
      return;
    }
    setBps((prev) => prev.filter((bp) => bp.id !== id));
  };

  const handleCopy = async () => {
    if (!cssCodeblock) return;
    try {
      await navigator.clipboard.writeText(cssCodeblock);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Tailwind V4 Fluid Gen</h1>
      <p className={styles.subtitle}>
        ✨ 자유롭게 구성하는 반응형 제너레이터 ✨
      </p>

      <div className={styles.card}>
        <div className={styles.sectionTitle}>기본 설정</div>
        <div className={styles.grid2}>
          <div className={styles.formGroup}>
            <label className={styles.label}>클래스 이름 (Class Name)</label>
            <input
              type="text"
              className={styles.input}
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="text-h1"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>기준 폰트 (Base px)</label>
            <input
              type="number"
              className={styles.input}
              value={baseFont || ''}
              onChange={(e) => setBaseFont(Number(e.target.value))}
              placeholder="16"
            />
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.sectionTitle}>
          구간 설정 (Breakpoints)
          <span className={styles.hint}>
            가로로 스크롤하여 구간을 추가해 보세요 👉
          </span>
        </div>

        {/* Horizontal Container */}
        <div className={styles.bpListContainer}>
          <div className={styles.bpScroller}>
            {bps.map((bp, i) => (
              <div key={bp.id} className={styles.bpCard}>
                {/* Remove Button if more than 2 */}
                {bps.length > 2 && (
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeNode(bp.id)}
                    title="삭제"
                  >
                    ✕
                  </button>
                )}

                <div className={styles.bpHeader}>
                  <div className={styles.bpBadgeRow}>
                    <span className={styles.bpBadge}>
                      {i === 0 ? 'BASE' : `STEP ${i}`}
                    </span>
                    <span className={styles.deviceLabel}>
                      {getDeviceLabel(bp.width)}
                    </span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>프리셋 선택</label>
                  <select
                    className={styles.select}
                    value={bp.name}
                    onChange={(e) =>
                      handleBpChange(bp.id, 'name', e.target.value)
                    }
                  >
                    {PRESETS.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>뷰포트 넓이 (px)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={bp.width}
                    onChange={(e) =>
                      handleBpChange(
                        bp.id,
                        'width',
                        e.target.value ? Number(e.target.value) : '',
                      )
                    }
                    disabled={bp.name !== 'custom' && bp.name !== 'base'} // Base 320px is sometimes tweaked, but preset tailwinds lock width.
                  />
                </div>

                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.label}>폰트 크기 (px)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={bp.font}
                    onChange={(e) =>
                      handleBpChange(
                        bp.id,
                        'font',
                        e.target.value ? Number(e.target.value) : '',
                      )
                    }
                  />
                </div>
              </div>
            ))}

            {/* Add Node Button Block */}
            <div className={styles.addNodeCard} onClick={addNode}>
              <div className={styles.addIcon}>+</div>
              <div>구간 추가하기</div>
            </div>
          </div>
        </div>

        <div className={styles.resultSection}>
          <h3 className={styles.resultLabel}>결과값 (Tailwind V4 @utility)</h3>
          {cssCodeblock && (
            <pre className={styles.resultCodeBlock}>{cssCodeblock}</pre>
          )}
          <button
            className={`${styles.resultButton} ${isCopied ? styles.copied : ''}`}
            onClick={handleCopy}
            title="복사하기"
          >
            {isCopied ? '✨ 복사 완료! ✨' : 'CSS 복사하기 🌈'}
          </button>
        </div>
      </div>

      {isCopied && (
        <div className={styles.toast}>클립보드에 안전하게 복사되었어요! 🚀</div>
      )}
    </main>
  );
}
