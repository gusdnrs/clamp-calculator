'use client';

import { useState, useEffect } from 'react';

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

    const codeChunks = [];
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
    <main className="flex flex-col items-center justify-center min-h-screen py-12 px-4 relative overflow-x-hidden">
      {/* Dynamic Keyframes injected via generic style block since Tailwind arbitrary animations need keyframes */}
      <style>{`
        @keyframes bounceIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, 50px) scale(0.8); }
          15% { opacity: 1; transform: translate(-50%, 0) scale(1.1); }
          25% { transform: translate(-50%, 0) scale(1); }
          85% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -20px) scale(0.8); }
        }
      `}</style>

      <h1 className="text-4xl font-extrabold mb-2 text-[var(--color-primary)] [text-shadow:2px_2px_0px_var(--color-border-custom)] tracking-tight text-center">
        Tailwind V4 Fluid Gen
      </h1>
      <p className="text-lg text-[var(--color-text-muted)] mb-8 font-semibold text-center">
        ✨ 자유롭게 구성하는 반응형 제너레이터 ✨
      </p>

      <div className="bg-[var(--color-card-bg)] rounded-[var(--radius-xl)] shadow-[var(--shadow-3d)] border-4 border-[var(--color-border-custom)] p-6 md:p-10 w-full max-w-[900px] animate-[bounceIn_0.6s_cubic-bezier(0.68,-0.55,0.265,1.55)_forwards]">
        <div className="text-xl font-extrabold text-[var(--color-primary)] mb-4 flex items-center gap-2 before:content-['✨']">
          기본 설정
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-2 mb-3 w-full">
            <label className="text-sm font-bold text-[var(--color-foreground)]">
              클래스 이름 (Class Name)
            </label>
            <input
              type="text"
              className="w-full box-border py-3 px-4 rounded-[var(--radius-md)] border-2 border-[var(--color-border-custom)] text-base font-semibold text-gray-800 transition-all duration-200 bg-[#fff9fa] focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-card-bg)] focus:ring-4 focus:ring-[rgba(255,143,163,0.2)]"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="text-h1"
            />
          </div>
          <div className="flex flex-col gap-2 mb-3 w-full">
            <label className="text-sm font-bold text-[var(--color-foreground)]">
              기준 폰트 (Base px)
            </label>
            <input
              type="number"
              className="w-full box-border py-3 px-4 rounded-[var(--radius-md)] border-2 border-[var(--color-border-custom)] text-base font-semibold text-gray-800 transition-all duration-200 bg-[#fff9fa] focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-card-bg)] focus:ring-4 focus:ring-[rgba(255,143,163,0.2)]"
              value={baseFont || ''}
              onChange={(e) => setBaseFont(Number(e.target.value))}
              placeholder="16"
            />
          </div>
        </div>

        <div className="h-1 bg-[var(--color-border-custom)] my-8 rounded-sm border-none" />

        <div className="text-xl font-extrabold text-[var(--color-primary)] mb-4 flex items-center gap-2 before:content-['✨']">
          구간 설정 (Breakpoints)
          <span className="text-sm font-semibold text-[var(--color-text-muted)] bg-[var(--color-background)] px-3 py-1 rounded-full ml-auto max-md:hidden">
            가로로 스크롤하여 구간을 추가해 보세요 👉
          </span>
        </div>

        {/* Breakpoints Container */}
        <div className="md:-mx-10 md:px-10 w-full md:w-[calc(100%+5rem)] mx-0 px-0">
          <div className="flex flex-col md:flex-row overflow-x-visible md:overflow-x-auto gap-4 md:gap-6 py-2 md:pb-8 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[var(--color-primary)] scrollbar-track-[var(--color-background)]">
            {bps.map((bp, i) => (
              <div
                key={bp.id}
                className="flex-none w-full md:w-[280px] snap-start bg-[#fff9fa] p-5 md:p-6 rounded-[var(--radius-lg)] border-4 border-dashed border-[var(--color-border-custom)] transition-all duration-200 ease-out hover:md:-translate-y-1 hover:md:scale-[1.02] hover:border-[var(--color-primary-shadow)] hover:shadow-[0_8px_20px_rgba(255,143,163,0.2)] relative flex flex-col justify-start"
              >
                {/* Remove Button if more than 2 */}
                {bps.length > 2 && (
                  <button
                    className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-red-500 text-white border-2 border-white font-bold text-xs cursor-pointer flex items-center justify-center shadow-[var(--shadow-btn-active)] z-10 transition-transform duration-100 hover:scale-110 hover:bg-red-600 active:scale-90"
                    onClick={() => removeNode(bp.id)}
                    title="삭제"
                  >
                    ✕
                  </button>
                )}

                <div className="mb-5">
                  <div className="flex items-center justify-between">
                    <span className="bg-[var(--color-primary)] text-white py-1.5 px-3.5 rounded-full text-xs font-extrabold tracking-wider shadow-[0_2px_0_var(--color-primary-shadow)]">
                      {i === 0 ? 'BASE' : `STEP ${i}`}
                    </span>
                    <span className="text-sm font-bold text-gray-500 bg-white py-1 px-2.5 rounded-md border border-gray-200">
                      {getDeviceLabel(bp.width)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mb-3 w-full">
                  <label className="text-sm font-bold text-[var(--color-foreground)]">
                    프리셋 선택
                  </label>
                  <select
                    className="w-full box-border py-3 px-4 rounded-[var(--radius-md)] border-2 border-[var(--color-border-custom)] text-base font-semibold text-gray-800 transition-all duration-200 bg-[#fff9fa] appearance-none cursor-pointer focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-card-bg)] focus:ring-4 focus:ring-[rgba(255,143,163,0.2)] bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg_xmlns=%27http://www.w3.org/2000/svg%27_viewBox=%270_0_24_24%27_fill=%27none%27_stroke=%27%23ff8fa3%27_stroke-width=%272%27_stroke-linecap=%27round%27_stroke-linejoin=%27round%27%3e%3cpolyline_points=%276_9_12_15_18_9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-[position:right_1rem_center] border-[length:1em] pr-10"
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

                <div className="flex flex-col gap-2 mb-3 w-full">
                  <label className="text-sm font-bold text-[var(--color-foreground)]">
                    뷰포트 넓이 (px)
                  </label>
                  <input
                    type="number"
                    className="w-full box-border py-3 px-4 rounded-[var(--radius-md)] border-2 border-[var(--color-border-custom)] text-base font-semibold text-gray-800 transition-all duration-200 bg-[#fff9fa] focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-card-bg)] focus:ring-4 focus:ring-[rgba(255,143,163,0.2)] disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                    value={bp.width}
                    onChange={(e) =>
                      handleBpChange(
                        bp.id,
                        'width',
                        e.target.value ? Number(e.target.value) : '',
                      )
                    }
                    disabled={bp.name !== 'custom' && bp.name !== 'base'}
                  />
                </div>

                <div className="flex flex-col gap-2 m-0 w-full">
                  <label className="text-sm font-bold text-[var(--color-foreground)]">
                    폰트 크기 (px)
                  </label>
                  <input
                    type="number"
                    className="w-full box-border py-3 px-4 rounded-[var(--radius-md)] border-2 border-[var(--color-border-custom)] text-base font-semibold text-gray-800 transition-all duration-200 bg-[#fff9fa] focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-card-bg)] focus:ring-4 focus:ring-[rgba(255,143,163,0.2)]"
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
            <div
              className="flex-none w-full md:w-[200px] min-h-[120px] md:min-h-[200px] snap-start bg-white/50 border-4 border-dashed border-[var(--color-border-custom)] rounded-[var(--radius-lg)] flex flex-col items-center justify-center cursor-pointer opacity-80 text-[var(--color-primary)] font-extrabold text-lg transition-all duration-200 hover:opacity-100 hover:bg-[#fff9fa] hover:border-[var(--color-primary)] hover:md:-translate-y-1 active:md:translate-y-1"
              onClick={addNode}
            >
              <div className="text-5xl mb-2 leading-none">+</div>
              <div>구간 추가하기</div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-extrabold text-[var(--color-primary)] mb-4 text-center">
            결과값 (Tailwind V4 @utility)
          </h3>
          {cssCodeblock && (
            <pre className="bg-[#282a36] text-[#f8f8f2] p-6 rounded-[var(--radius-lg)] font-mono text-sm leading-relaxed overflow-x-auto border-4 border-[#191a21] shadow-[inset_0_4px_6px_rgba(0,0,0,0.3)] mb-8">
              {cssCodeblock}
            </pre>
          )}
          <button
            className={`w-full p-5 rounded-[var(--radius-lg)] border-2 border-[var(--color-primary-shadow)] bg-[var(--color-primary)] text-white text-xl font-extrabold cursor-pointer transition-all duration-100 shadow-[var(--shadow-btn)] relative top-0 hover:bg-[var(--color-primary-hover)] active:top-1.5 active:shadow-[0_0_0_var(--color-primary-shadow)] ${isCopied ? 'bg-green-500 border-green-700 shadow-[0_6px_0_#388E3C] active:shadow-[0_0_0_#388E3C]' : ''}`}
            onClick={handleCopy}
            title="복사하기"
          >
            {isCopied ? '✨ 복사 완료! ✨' : 'CSS 복사하기 🌈'}
          </button>
        </div>
      </div>

      {isCopied && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white py-4 px-8 rounded-full font-extrabold text-base shadow-[var(--shadow-3d)] border-2 border-white animate-[fadeInOut_2.5s_cubic-bezier(0.68,-0.55,0.265,1.55)_forwards] pointer-events-none z-50">
          클립보드에 안전하게 복사되었어요! 🚀
        </div>
      )}
    </main>
  );
}
