interface Props {
  int: number; // Intelligence (Top)
  sta: number; // Stamina (Right)
  soc: number; // Social (Left)
}

export function StatTriangle({ int, sta, soc }: Props) {
  const cx = 100;
  const cy = 110;
  const radius = 80;

  const getPoint = (value: number, angleDeg: number) => {
    const r = (value / 100) * radius;
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad)
    };
  };

  const pInt = getPoint(int, 0);
  const pSta = getPoint(sta, 120);
  const pSoc = getPoint(soc, 240);

  const bgInt = getPoint(100, 0);
  const bgSta = getPoint(100, 120);
  const bgSoc = getPoint(100, 240);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg width="200" height="200" className="filter drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
        <polygon
          points={`${bgInt.x},${bgInt.y} ${bgSta.x},${bgSta.y} ${bgSoc.x},${bgSoc.y}`}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <line x1={cx} y1={cy} x2={bgInt.x} y2={bgInt.y} stroke="rgba(255,255,255,0.1)" />
        <line x1={cx} y1={cy} x2={bgSta.x} y2={bgSta.y} stroke="rgba(255,255,255,0.1)" />
        <line x1={cx} y1={cy} x2={bgSoc.x} y2={bgSoc.y} stroke="rgba(255,255,255,0.1)" />

        <polygon
          points={`${pInt.x},${pInt.y} ${pSta.x},${pSta.y} ${pSoc.x},${pSoc.y}`}
          fill="rgba(6, 182, 212, 0.2)"
          stroke="#06b6d4"
          strokeWidth="2"
        />

        <circle cx={pInt.x} cy={pInt.y} r="3" fill="#f472b6" />
        <circle cx={pSta.x} cy={pSta.y} r="3" fill="#22d3ee" />
        <circle cx={pSoc.x} cy={pSoc.y} r="3" fill="#a855f7" />
      </svg>

      <div className="absolute top-2 text-[10px] font-bold text-pink-400">INT</div>
      <div className="absolute bottom-8 right-8 text-[10px] font-bold text-cyan-400">STA</div>
      <div className="absolute bottom-8 left-8 text-[10px] font-bold text-purple-400">SOC</div>
    </div>
  );
}
