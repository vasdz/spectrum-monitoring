import { useEffect, useRef, useState } from 'react';

interface GraphNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  group: number;
  size: number;
  full_name: string;
  group_name: string;
}

export function SocialGraph() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  const groups = [
    { id: 0, name: 'KB-1', color: '#00f3ff' },
    { id: 1, name: 'KB-2', color: '#bc13fe' },
    { id: 2, name: 'IS-1', color: '#ff00ff' },
    { id: 3, name: 'IS-2', color: '#34d399' },
    { id: 4, name: 'PI-1', color: '#fb923c' },
  ];

  const nodesRef = useRef<GraphNode[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/analytics/social-graph')
      .then(r => r.json())
      .then(setStudents)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!students.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Функция ресайза
    const resize = () => {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = 500; // Фиксированная высота
        }
    };
    window.addEventListener('resize', resize);
    resize();

    // Инициализация узлов (если список пуст)
    if (nodesRef.current.length === 0) {
      students.forEach((s) => {
        let groupIndex = groups.findIndex(g => s.group_name?.toUpperCase().includes(g.name));
        // Если группа не найдена, берем случайный цвет, чтобы не было черных точек
        if (groupIndex === -1) groupIndex = s.id % groups.length;

        nodesRef.current.push({
          id: s.id,
          // Случайная позиция по ВСЕМУ холсту с отступом от краев
          x: Math.random() * (canvas.width - 20) + 10,
          y: Math.random() * (canvas.height - 20) + 10,
          // Случайная скорость
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          group: groupIndex,
          size: 3,
          full_name: s.full_name,
          group_name: s.group_name,
        });
      });
    }

    const colors = groups.map(g => g.color);
    let animationId: number;

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Обновление физики
        nodesRef.current.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;

            // Отталкивание от стен (с небольшим запасом)
            if (node.x <= 5 || node.x >= canvas.width - 5) node.vx *= -1;
            if (node.y <= 5 || node.y >= canvas.height - 5) node.vy *= -1;
        });

        // 2. Рисуем связи (линии)
        ctx.lineWidth = 0.5;
        for (let i = 0; i < nodesRef.current.length; i++) {
            for (let j = i + 1; j < nodesRef.current.length; j++) {
                const nodeA = nodesRef.current[i];
                const nodeB = nodesRef.current[j];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                // Рисуем линию, если точки рядом и из одной группы (или можно убрать проверку группы для красоты)
                if (dist < 100 && nodeA.group === nodeB.group) {
                    ctx.strokeStyle = colors[nodeA.group];
                    ctx.globalAlpha = 1 - dist / 100; // Чем дальше, тем прозрачнее
                    ctx.beginPath();
                    ctx.moveTo(nodeA.x, nodeA.y);
                    ctx.lineTo(nodeB.x, nodeB.y);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;

        // 3. Рисуем узлы (точки)
        nodesRef.current.forEach(node => {
            ctx.fillStyle = colors[node.group];
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
            ctx.fill();

            // Легкое свечение
            ctx.shadowBlur = 8;
            ctx.shadowColor = colors[node.group];
        });
        ctx.shadowBlur = 0;

        animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationId);
    };
  }, [students]);

  // Обработка наведения мыши
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hovered = nodesRef.current.find(node =>
        Math.sqrt((node.x - x)**2 + (node.y - y)**2) < 15
    );
    setHoveredNode(hovered || null);
  };

  return (
    <div className="relative h-full w-full bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        {/* Заголовок */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/90">
                <div className="w-2 h-2 bg-cyan rounded-full animate-pulse"></div>
                Neural Social Graph
            </div>
        </div>

        {/* Легенда */}
        <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col gap-2">
            <div className="text-[9px] text-gray-400 uppercase tracking-widest border-b border-white/10 pb-1 mb-1">
                Study Groups
            </div>
            {groups.map(g => (
                <div key={g.id} className="flex items-center gap-2 text-[10px] text-gray-300 font-mono">
                    <div className="w-2 h-2 rounded-full" style={{ background: g.color, boxShadow: `0 0 5px ${g.color}` }}></div>
                    {g.name}
                </div>
            ))}
        </div>

        {/* Тултип */}
        {hoveredNode && (
            <div
                className="absolute z-20 bg-black/90 border border-white/20 backdrop-blur-xl px-3 py-2 rounded-lg pointer-events-none shadow-xl"
                style={{ left: hoveredNode.x + 10, top: hoveredNode.y - 10 }}
            >
                <div className="text-xs font-bold text-white">{hoveredNode.full_name}</div>
                <div className="text-[10px]" style={{ color: groups[hoveredNode.group]?.color }}>
                    {hoveredNode.group_name}
                </div>
            </div>
        )}

        <canvas
            ref={canvasRef}
            className="w-full h-full block"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredNode(null)}
        />
    </div>
  );
}

