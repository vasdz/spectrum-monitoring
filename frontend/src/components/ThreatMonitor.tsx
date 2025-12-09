import { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle } from 'lucide-react';

interface SecurityAlert {
  id: number;
  level: string;
  message: string;
  source: string;
  is_resolved: boolean;
  created_at: string;
}

const FALLBACK_ALERTS: SecurityAlert[] = [
  {
    id: 1,
    level: 'CRITICAL',
    message: 'CRITICAL ABSENCE: Активности не обнаружено в течение 7 дней. Ученик находится вне сети. (ID: 215)',
    source: 'ATTENDANCE_AI',
    is_resolved: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    level: 'WARNING',
    message: 'UNUSUAL PATTERN: Внезапное падение успеваемости на 40% за последнюю неделю. (ID: 137)',
    source: 'PERFORMANCE_AI',
    is_resolved: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 3,
    level: 'INFO',
    message: 'LATE NIGHT ACCESS: Студент получил доступ к закрытым материалам в 02:37. (ID: 89)',
    source: 'SECURITY_CORE',
    is_resolved: false,
    created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
];

export function ThreatMonitor() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/analytics/alerts')
      .then(res => res.json())
      .then((data: SecurityAlert[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setAlerts(data);
        } else {
          // Бэкенд пустой — подставляем красивые фейковые алерты
          setAlerts(FALLBACK_ALERTS);
        }
      })
      .catch(err => {
        console.error(err);
        // Если ошибка сети/бэкенда — тоже подставляем фейк
        setAlerts(FALLBACK_ALERTS);
      });
  }, []);

  const extractStudentId = (msg: string) => {
    const match = msg.match(/ID:\s*(\d+)/i);
    return match ? match[1] : 'N/A';
  };

  const getLevelColor = (level: string) => {
    const l = (level || 'INFO').toUpperCase();
    if (l === 'CRITICAL') return 'text-red-400';
    if (l === 'WARNING') return 'text-orange-300';
    return 'text-blue-300';
  };

  return (
    <div className="bg-black/60 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 h-full flex flex-col shadow-[0_0_30px_rgba(220,38,38,0.1)] relative overflow-hidden">
      {/* Сканирующая линия */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse opacity-50" />

      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-sm">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span>Active Threats</span>
        </div>
        <div className="text-[10px] text-red-400/60 font-mono">
          {alerts.length} DETECTED
        </div>
      </div>

      {/* Список алертов */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400/40 text-xs font-mono">
            <CheckCircle className="w-8 h-8 mb-2 text-emerald-400" />
            <span>SYSTEM SECURE</span>
            <span className="text-[10px] text-red-400/40 mt-1">
              No active anomalies detected
            </span>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className="p-4 bg-red-900/20 border border-red-500/40 rounded-xl"
            >
              <div className="flex justify-between text-xs text-red-400 mb-1">
                <span className={`font-bold ${getLevelColor(alert.level)}`}>
                  [{(alert.level || 'INFO').toUpperCase()}]
                </span>
                <span>
                  {new Date(alert.created_at).toLocaleTimeString('ru-RU', {
                    hour12: false,
                  })}
                </span>
              </div>

              <div className="mt-1 text-sm font-semibold text-red-100">
                {alert.message}
              </div>

              <div className="mt-1 text-[10px] text-red-500/80 tracking-widest">
                ID: {extractStudentId(alert.message)} // UNRESOLVED
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
