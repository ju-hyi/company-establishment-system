import { useState } from "react";
import { LogOut, Home, Calendar, BarChart3, CheckSquare, Menu, ChevronDown } from "lucide-react";

interface HeaderProps {
  name: string;
  email: string;
  level: number;
  onSignOut: () => void;
}

export default function Header({ name, email, level, onSignOut }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-rose-300 to-pink-400 rounded-lg flex items-center justify-center text-lg">
            🏢
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">MY LIFE OFFICE</h1>
            <p className="text-xs text-gray-500">Work · Study · Life</p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-medium text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-2 transition">
            <Home size={18} />
            라이프 오피스
          </button>
          <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition">
            <CheckSquare size={18} />
            오늘 할일
          </button>
          <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition">
            <Calendar size={18} />
            캘린더
          </button>
          <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition">
            <BarChart3 size={18} />
            기록/통계
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition">
            <Menu size={24} className="text-gray-700" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
            >
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <p className="text-xs text-gray-500">Lv.{level}</p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {name.charAt(0)}
              </div>
              <ChevronDown size={16} className={`text-gray-600 transition ${showMenu ? "rotate-180" : ""}`} />
            </button>

            {showMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden w-56">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-500 mt-1">{email}</p>
                </div>
                <button
                  onClick={onSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                >
                  <LogOut size={16} />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
