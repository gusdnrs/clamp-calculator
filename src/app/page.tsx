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
    <main className="flex flex-col items-center justify-center min-h-screen py-16 px-4 relative overflow-x-hidden bg-[var(--color-background)]">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--color-primary)] rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[var(--color-secondary)] rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none animate-[pulse_10s_ease-in-out_infinite]" />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

      {/* Header */}
      <div className="w-full max-w-[960px] mb-12 text-center animate-[fadeInUp_0.6s_ease-out_forwards] z-10">
        <h1 className="text-5xl font-extrabold mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-indigo-400 to-[var(--color-secondary)] drop-shadow-[0_0_15px_rgba(0,240,255,0.3)] block pb-2">
          Fluid Typography Gen
        </h1>
        <p className="text-lg text-[var(--color-text-muted)] font-medium max-w-2xl mx-auto">
          Create perfectly scalable, responsive typography for{' '}
          <span className="text-white font-semibold">Tailwind V4</span> using
          precision math.
        </p>
      </div>

      <div className="bg-[var(--color-card-bg)] backdrop-blur-2xl rounded-[var(--radius-xl)] border border-[var(--color-border-custom)] p-6 md:p-10 w-full max-w-[960px] animate-[fadeInUp_0.8s_ease-out_forwards] shadow-2xl relative z-10">
        {/* Base Settings */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-[var(--shadow-glow)]">
            1
          </div>
          <h2 className="text-xl font-bold text-[var(--color-foreground)] tracking-wide">
            Base Configuration
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <div className="flex flex-col gap-2 w-full group">
            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 group-focus-within:text-[var(--color-primary)] transition-colors">
              Class Name
            </label>
            <input
              type="text"
              className="w-full box-border py-4 px-5 rounded-[var(--radius-lg)] bg-[var(--color-input-bg)] border border-[var(--color-border-custom)] text-base font-semibold text-white transition-all duration-300 focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] placeholder:text-zinc-600 backdrop-blur-md"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. text-fluid-h1"
            />
          </div>
          <div className="flex flex-col gap-2 w-full group">
            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 group-focus-within:text-[var(--color-primary)] transition-colors">
              Base Font Size (px)
            </label>
            <input
              type="number"
              className="w-full box-border py-4 px-5 rounded-[var(--radius-lg)] bg-[var(--color-input-bg)] border border-[var(--color-border-custom)] text-base font-semibold text-white transition-all duration-300 focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] placeholder:text-zinc-600 backdrop-blur-md"
              value={baseFont || ''}
              onChange={(e) => setBaseFont(Number(e.target.value))}
              placeholder="16"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border-hover)] to-transparent my-10" />

        {/* Breakpoints */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-secondary)] to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_20px_rgba(255,0,85,0.3)]">
              2
            </div>
            <h2 className="text-xl font-bold text-[var(--color-foreground)] tracking-wide">
              Breakpoints Strategy
            </h2>
          </div>
          <span className="text-xs font-medium text-[var(--color-primary)] bg-[rgba(0,240,255,0.1)] px-3 py-1.5 rounded-full border border-[rgba(0,240,255,0.2)] hidden md:block">
            Scroll horizontally to add more
          </span>
        </div>

        <div className="w-full md:-mx-4 md:px-4">
          <div className="flex flex-col md:flex-row overflow-x-visible md:overflow-x-auto gap-5 py-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[var(--color-border-hover)] scrollbar-track-transparent">
            {bps.map((bp, i) => (
              <div
                key={bp.id}
                className="flex-none w-full md:w-[280px] snap-center bg-[var(--color-input-bg)] backdrop-blur-md p-6 rounded-[var(--radius-lg)] border border-[var(--color-border-custom)] transition-all duration-300 hover:border-[var(--color-primary)] hover:bg-[rgba(255,255,255,0.05)] hover:shadow-[0_10px_30px_-10px_rgba(0,240,255,0.15)] relative flex flex-col group"
              >
                {bps.length > 2 && (
                  <button
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500 font-bold text-sm cursor-pointer flex items-center justify-center transition-all duration-200 z-10 opacity-0 group-hover:opacity-100 disabled:opacity-0"
                    onClick={() => removeNode(bp.id)}
                    title="Remove Breakpoint"
                  >
                    ✕
                  </button>
                )}

                <div className="mb-6 flex justify-between items-center">
                  <span
                    className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border ${i === 0 ? 'bg-[var(--color-primary)] text-black border-[var(--color-primary)] shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'bg-transparent text-[var(--color-primary)] border-[var(--color-primary)]'}`}
                  >
                    {i === 0 ? 'BASE' : `STEP ${i}`}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] bg-black/40 px-2 py-1 rounded">
                    {getDeviceLabel(bp.width)}
                  </span>
                </div>

                <div className="flex flex-col gap-2 mb-5 w-full">
                  <label className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Preset
                  </label>
                  <div className="relative">
                    <select
                      className="w-full box-border py-3 px-4 rounded-[var(--radius-md)] bg-black/40 border border-[var(--color-border-custom)] text-sm font-semibold text-white transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:border-[var(--color-primary)]"
                      value={bp.name}
                      onChange={(e) =>
                        handleBpChange(bp.id, 'name', e.target.value)
                      }
                    >
                      {PRESETS.map((p) => (
                        <option
                          key={p.name}
                          value={p.name}
                          className="bg-zinc-900"
                        >
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-primary)]">
                      ▼
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mb-5 w-full">
                  <label className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Viewport Width (px)
                  </label>
                  <input
                    type="number"
                    className="w-full box-border py-3 px-4 rounded-[var(--radius-md)] bg-black/40 border border-[var(--color-border-custom)] text-sm font-semibold text-white transition-all duration-200 focus:outline-none focus:border-[var(--color-primary)] disabled:bg-zinc-900/50 disabled:text-zinc-600 disabled:cursor-not-allowed"
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

                <div className="flex flex-col gap-2 m-0 w-full mt-auto">
                  <label className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
                    Target Font Size (px)
                  </label>
                  <input
                    type="number"
                    className="w-full box-border py-3 px-4 rounded-[var(--radius-md)] bg-black/60 border border-[var(--color-primary)]/30 text-base font-bold text-white transition-all duration-200 focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_15px_rgba(0,240,255,0.15)] focus:bg-[rgba(0,240,255,0.05)]"
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
              className="flex-none w-full md:w-[220px] min-h-[140px] md:min-h-full snap-center border-2 border-dashed border-[var(--color-border-hover)] bg-[var(--color-input-bg)] backdrop-blur-sm rounded-[var(--radius-lg)] flex flex-col items-center justify-center cursor-pointer text-[var(--color-text-muted)] transition-all duration-300 hover:bg-[rgba(255,255,255,0.05)] hover:text-white hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98] group"
              onClick={addNode}
            >
              <div className="text-4xl font-light mb-2 transition-transform group-hover:scale-125 group-hover:rotate-90 duration-300">
                +
              </div>
              <div className="text-sm font-semibold tracking-wide uppercase">
                Add Breakpoint
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border-hover)] to-transparent my-10" />

        {/* Output */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              3
            </div>
            <div className="flex justify-between items-end w-full">
              <h2 className="text-xl font-bold text-[var(--color-foreground)] tracking-wide">
                Generated Output
              </h2>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--color-text-muted)] border border-[var(--color-border-custom)] px-2 py-1 rounded bg-black/40">
                Tailwind V4 @utility
              </span>
            </div>
          </div>

          <div className="relative group mb-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-[var(--radius-lg)] opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
            {cssCodeblock ? (
              <pre className="relative bg-[#050505] text-emerald-300 p-6 rounded-[var(--radius-lg)] font-mono text-sm leading-relaxed overflow-x-auto border border-zinc-800 shadow-inner max-h-[400px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {cssCodeblock}
              </pre>
            ) : (
              <div className="relative bg-[#050505] p-6 rounded-[var(--radius-lg)] border border-zinc-800 flex items-center justify-center min-h-[150px] text-zinc-600 font-mono text-sm">
                Awaiting configuration...
              </div>
            )}
          </div>

          <button
            className={`relative w-full py-5 rounded-[var(--radius-md)] text-white text-lg font-bold uppercase tracking-widest cursor-pointer transition-all duration-300 overflow-hidden group ${isCopied ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'bg-zinc-800 hover:bg-zinc-700'} border border-zinc-700 hover:border-zinc-500 active:scale-[0.98]`}
            onClick={handleCopy}
            title="Copy CSS"
          >
            {/* Glow effect on hover */}
            {!isCopied && (
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent group-hover:left-[200%] transition-all duration-1000 ease-in-out skew-x-[-20deg]" />
            )}

            <span className="relative z-10 flex items-center justify-center gap-2">
              {isCopied ? '✓ COPIED TO CLIPBOARD' : 'COPY CSS TO CLIPBOARD'}
            </span>
          </button>
        </div>
      </div>

      {isCopied && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[var(--color-card-bg)] backdrop-blur-xl border border-[var(--color-border-custom)] text-white py-3.5 px-6 rounded-full font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,240,255,0.2)] animate-[fadeInOut_2.5s_ease-in-out_forwards] pointer-events-none z-50">
          CSS copied to clipboard!
        </div>
      )}
    </main>
  );
}
