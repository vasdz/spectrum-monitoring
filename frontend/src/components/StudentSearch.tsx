import { useState, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
    id: number;
    full_name: string;
    group_name: string;
}

// Добавили проп onSelect (необязательный)
interface StudentSearchProps {
    onSelect?: (student: SearchResult) => void;
}

export function StudentSearch({ onSelect }: StudentSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.length >= 2) {
                try {
                    const res = await fetch(`http://localhost:8000/api/students/search?q=${query}`);
                    if (res.ok) {
                        const data = await res.json();
                        setResults(data);
                        setIsOpen(true);
                    }
                } catch (e) { console.error(e); }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (student: SearchResult) => {
        if (onSelect) {
            // Режим выбора (для админки)
            onSelect(student);
            setQuery(student.full_name); // Оставляем имя в поле
            setIsOpen(false); // Закрываем список
        } else {
            // Обычный режим (переход)
            setIsOpen(false);
            setQuery('');
            navigate(`/student/${student.id}`);
        }
    };

    return (
        <div className="relative w-full max-w-md group z-50">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-cyan/50 group-focus-within:text-cyan transition-colors" />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl leading-5 bg-black/40 text-white placeholder-gray-500 focus:outline-none focus:bg-black/60 focus:border-cyan/50 transition-all duration-300 sm:text-sm backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                placeholder="SEARCH DATABASE..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
            />

            {/* ВЫПАДАЮЩИЙ СПИСОК */}
            {isOpen && results.length > 0 && (
                <div className="absolute mt-2 w-full rounded-xl bg-[#0a0a12]/95 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    {results.map((student) => (
                        <div
                            key={student.id}
                            onClick={() => handleSelect(student)}
                            className="flex items-center justify-between p-3 hover:bg-cyan/10 cursor-pointer border-b border-white/5 last:border-0 group"
                        >
                            <div>
                                <div className="text-white text-sm font-bold group-hover:text-cyan transition-colors">{student.full_name}</div>
                                <div className="text-[10px] text-gray-500 font-mono">{student.group_name}</div>
                            </div>
                            <ChevronRight size={14} className="text-gray-600 group-hover:text-cyan group-hover:translate-x-1 transition-all" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
