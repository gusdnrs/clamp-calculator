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
    <main className="flex flex-col items-center justify-center min-h-screen py-20 px-4 relative overflow-x-hidden bg-[var(--color-toss-bg)]">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <header className="w-full max-w-[960px] mb-20 text-center animate-[fadeInUp_0.4s_ease-out_forwards] z-10 flex flex-col items-center gap-5 mt-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--color-toss-text-title)]">
          Clamp CSS 생성기
        </h1>
        <p className="text-center text-lg md:text-xl text-[var(--color-toss-text-subtitle)] font-medium max-w-2xl mx-auto leading-relaxed">
          <span className="font-bold text-[var(--color-toss-blue)]">
            Tailwind V4
          </span>{' '}
          전용 반응형 폰트 사이즈(Clamp) CSS를 정밀하고 쉽게 생성하세요.
        </p>
      </header>

      <div className="bg-[var(--color-toss-surface)] rounded-[var(--radius-xl)] p-8 md:p-12 w-full max-w-[960px] animate-[fadeInUp_0.6s_ease-out_forwards] shadow-[var(--shadow-toss-card)] relative z-10 flex flex-col gap-16 border border-[var(--color-toss-border)]">
        {/* Step 1: Base Configuration */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-9 h-9 rounded-full bg-[var(--color-toss-blue)] flex items-center justify-center text-white font-bold text-lg">
              1
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-toss-text-title)] tracking-tight">
              기본 설정
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3 w-full group">
              <label className="text-sm font-bold text-[var(--color-toss-text-subtitle)] transition-colors group-focus-within:text-[var(--color-toss-blue)]">
                클래스 이름
              </label>
              <input
                type="text"
                className="w-full box-border py-4 px-5 rounded-[var(--radius-md)] bg-[var(--color-toss-input)] border border-transparent text-lg font-bold text-[var(--color-toss-text-title)] transition-all duration-200 focus:outline-none focus:bg-white focus:border-[var(--color-toss-blue)] focus:ring-4 focus:ring-[var(--color-toss-blue)]/10 placeholder:text-[var(--color-toss-text-muted)] placeholder:font-medium"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="예: text-fluid-h1"
              />
            </div>
            <div className="flex flex-col gap-3 w-full group">
              <label className="text-sm font-bold text-[var(--color-toss-text-subtitle)] transition-colors group-focus-within:text-[var(--color-toss-blue)]">
                기준 폰트 크기 (px)
              </label>
              <input
                type="number"
                className="w-full box-border py-4 px-5 rounded-[var(--radius-md)] bg-[var(--color-toss-input)] border border-transparent text-lg font-bold text-[var(--color-toss-text-title)] transition-all duration-200 focus:outline-none focus:bg-white focus:border-[var(--color-toss-blue)] focus:ring-4 focus:ring-[var(--color-toss-blue)]/10 placeholder:text-[var(--color-toss-text-muted)] placeholder:font-medium"
                value={baseFont || ''}
                onChange={(e) => setBaseFont(Number(e.target.value))}
                placeholder="기본 16"
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-[var(--color-toss-border)]" />

        {/* Step 2: Breakpoints Strategy */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-[var(--color-toss-blue)] flex items-center justify-center text-white font-bold text-lg">
                2
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-toss-text-title)] tracking-tight">
                기기별 맞춤 구간 (Breakpoints)
              </h2>
            </div>
            <span className="text-sm font-semibold text-[var(--color-toss-text-subtitle)] bg-[var(--color-toss-input)] px-4 py-2 rounded-full hidden md:block">
              가로로 스크롤하여 추가 구간 확인 👉
            </span>
          </div>

          <div className="w-full md:-mx-6 md:px-6">
            <div className="flex flex-col md:flex-row overflow-x-visible md:overflow-x-auto gap-6 py-4 pb-8 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[var(--color-toss-border-hover)] scrollbar-track-transparent">
              {bps.map((bp, i) => (
                <div
                  key={bp.id}
                  className="flex-none w-full md:w-[320px] snap-center bg-[var(--color-toss-input)] p-8 rounded-[var(--radius-lg)] border border-transparent transition-all duration-300 hover:border-[var(--color-toss-border-hover)] hover:bg-white hover:shadow-[var(--shadow-toss-card)] relative flex flex-col group gap-6"
                >
                  {bps.length > 2 && (
                    <button
                      className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-[var(--color-toss-text-muted)] border border-[var(--color-toss-border)] hover:bg-red-50 hover:text-red-500 hover:border-red-200 font-bold text-sm cursor-pointer flex items-center justify-center transition-all duration-200 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-0 shadow-sm"
                      onClick={() => removeNode(bp.id)}
                      title="구간 삭제"
                    >
                      ✕
                    </button>
                  )}

                  <div className="flex justify-between items-center">
                    <span
                      className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-widest uppercase border ${i === 0 ? 'bg-[var(--color-toss-blue)] text-white border-transparent' : 'bg-white text-[var(--color-toss-blue)] border-[var(--color-toss-blue)]'}`}
                    >
                      {i === 0 ? '기본 (BASE)' : `단계 ${i}`}
                    </span>
                    <span className="text-sm font-bold text-[var(--color-toss-text-subtitle)] bg-white px-3 py-1.5 rounded-md border border-[var(--color-toss-border)] shadow-sm">
                      {getDeviceLabel(bp.width)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 w-full">
                    <label className="text-sm font-bold text-[var(--color-toss-text-subtitle)] transition-colors group-focus-within:text-[var(--color-toss-blue)]">
                      프리셋 선택
                    </label>
                    <div className="relative">
                      <select
                        className="w-full box-border py-4 px-4 rounded-[var(--radius-md)] bg-white border border-[var(--color-toss-border)] text-base font-bold text-[var(--color-toss-text-title)] transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:border-[var(--color-toss-blue)] focus:ring-4 focus:ring-[var(--color-toss-blue)]/10"
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
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-toss-text-muted)] font-bold">
                        ▼
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full group">
                    <label className="text-sm font-bold text-[var(--color-toss-text-subtitle)] transition-colors group-focus-within:text-[var(--color-toss-blue)]">
                      가로 해상도 (Viewport 넓이, px)
                    </label>
                    <input
                      type="number"
                      className="w-full box-border py-4 px-5 rounded-[var(--radius-md)] bg-white border border-[var(--color-toss-border)] text-base font-bold text-[var(--color-toss-text-title)] transition-all duration-200 focus:outline-none focus:border-[var(--color-toss-blue)] focus:ring-4 focus:ring-[var(--color-toss-blue)]/10 disabled:bg-[var(--color-toss-surface)] disabled:text-[var(--color-toss-text-muted)] disabled:cursor-not-allowed"
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

                  <div className="flex flex-col gap-3 m-0 w-full mt-auto group">
                    <label className="text-sm font-bold text-[var(--color-toss-blue)] transition-colors">
                      이 구간에서의 목표 폰트 크기 (px)
                    </label>
                    <input
                      type="number"
                      className="w-full box-border py-4 px-5 rounded-[var(--radius-md)] bg-[var(--color-toss-blue)]/5 border border-[var(--color-toss-blue)]/30 text-xl font-extrabold text-[var(--color-toss-blue)] transition-all duration-200 focus:outline-none focus:border-[var(--color-toss-blue)] focus:bg-white focus:ring-4 focus:ring-[var(--color-toss-blue)]/20"
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

              <div
                className="flex-none w-full md:w-[240px] min-h-[160px] md:min-h-full snap-center border-2 border-dashed border-[var(--color-toss-border)] bg-[var(--color-toss-surface)] rounded-[var(--radius-lg)] flex flex-col items-center justify-center cursor-pointer text-[var(--color-toss-text-muted)] transition-all duration-300 hover:bg-[var(--color-toss-input)] hover:text-[var(--color-toss-blue)] hover:border-[var(--color-toss-blue)] active:scale-[0.98] group"
                onClick={addNode}
              >
                <div className="text-5xl font-light mb-4 transition-transform group-hover:scale-125 group-hover:rotate-90 duration-300">
                  +
                </div>
                <div className="text-base font-bold tracking-wide">
                  새로운 구간 추가
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-[var(--color-toss-border)]" />

        {/* Step 3: Output */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-9 h-9 rounded-full bg-[var(--color-toss-blue)] flex items-center justify-center text-white font-bold text-lg">
              3
            </div>
            <div className="flex justify-between items-end w-full">
              <h2 className="text-2xl font-bold text-[var(--color-toss-text-title)] tracking-tight">
                완성된 CSS 코드 (@utility)
              </h2>
              <span className="text-xs font-bold tracking-wider uppercase text-[var(--color-toss-blue)] border border-[var(--color-toss-blue)]/20 bg-[var(--color-toss-blue)]/5 px-3 py-1.5 rounded hidden sm:block">
                Tailwind V4 호환
              </span>
            </div>
          </div>

          <div className="mb-8">
            {cssCodeblock ? (
              <pre className="bg-[#191F28] text-gray-200 p-8 rounded-[var(--radius-lg)] font-mono text-sm md:text-base leading-relaxed overflow-x-auto shadow-inner max-h-[500px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {cssCodeblock}
              </pre>
            ) : (
              <div className="bg-[var(--color-toss-surface)] p-8 rounded-[var(--radius-lg)] border border-[var(--color-toss-border)] flex items-center justify-center min-h-[200px] text-[var(--color-toss-text-muted)] font-mono text-base font-medium">
                위 설정 옵션들을 입력하면 이곳에 CSS 코드가 자동 생성됩니다.
              </div>
            )}
          </div>

          <button
            className={`w-full py-5 rounded-[var(--radius-md)] text-white text-lg font-bold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
              isCopied
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-[var(--color-toss-blue)] hover:bg-[var(--color-toss-blue-hover)] active:bg-[var(--color-toss-blue-active)]'
            }`}
            onClick={handleCopy}
            title="클립보드에 복사하기"
          >
            {isCopied ? '✓ 클립보드에 복사되었습니다' : '완성된 CSS 복사하기'}
          </button>
        </section>
      </div>

      {isCopied && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white py-4 px-8 rounded-full font-bold text-base shadow-lg animate-[fadeInUp_0.3s_ease-out_forwards] z-50">
          CSS 코드가 복사되었습니다
        </div>
      )}
    </main>
  );
}
