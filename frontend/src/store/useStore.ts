import { create } from 'zustand';

// Интерфейсы данных
export interface StudentRiskProfile {
  student_id: number;
  full_name: string;
  group_name: string;
  risk_score: number;
  risk_factors: string[];
  recommendation: string;
}

export interface LiveStats {
  timestamp: string;
  active_users: number;
  events_per_minute: number;
  top_course: string;
  alerts: Array<{ type: string, msg: string }>;
}

export interface KpiData {
  total_students: number;
  active_courses: number;
  avg_attendance_rate: number;
  system_health_index: number;
  avg_gpa: number;
}

// Интерфейс Состояния (State)
interface AppState {
  liveStats: LiveStats | null;
  atRiskStudents: StudentRiskProfile[];
  kpi: KpiData | null;

  setLiveStats: (stats: LiveStats) => void;
  fetchAtRiskStudents: () => Promise<void>;
  fetchKpi: () => Promise<void>;
}

// URL твоего бэкенда
const API_URL = 'http://localhost:8000/api';

export const useStore = create<AppState>((set) => ({
    // Начальные значения
    liveStats: null,
    atRiskStudents: [],
    kpi: {
        total_students: 0,
        active_courses: 0,
        avg_attendance_rate: 0,
        system_health_index: 100,
        avg_gpa: 0
    },

    // Действия (Actions)
    setLiveStats: (stats) => set({liveStats: stats}),

    fetchAtRiskStudents: async () => {
        try {
            const response = await fetch(`${API_URL}/analytics/at-risk`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            set({atRiskStudents: data});
        } catch (error) {
            console.error("⚠ Failed to fetch at-risk students (using mock data):", error);
            // Фейковые данные, чтобы интерфейс не был пустым, если бэк упал
            set({
                atRiskStudents: [
                    {
                        student_id: 1,
                        full_name: "Иванов Иван (Mock)",
                        group_name: "КМБО-01",
                        risk_score: 85,
                        risk_factors: ["Прогулы", "Нет активности в LMS"],
                        recommendation: "Вызвать в деканат"
                    }
                ]
            });
        }
    },

    fetchKpi: async () => {
        try {
            const response = await fetch(`${API_URL}/analytics/dashboard-stats`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            set({kpi: data});
        } catch (error) {
            console.error("⚠ API Error:", error);
            set({kpi: null}); // Не врем пользователю!
        }
    },
}))
