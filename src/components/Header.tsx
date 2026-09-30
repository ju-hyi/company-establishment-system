import { useState } from "react";
import {
  BarChart3,
  Calendar,
  CheckSquare,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import type { PageId } from "./ui";

interface HeaderProps {
  name: string;
  username: string;
  level: number;
  page: PageId;
  onNavigate: (page: PageId) => void;
  onSignOut: () => void;
  /** 꾸미기에서 고른 대표 이미지 · 포인트 색 */
  avatarSrc?: string;
  avatarColor?: string;
}

export const NAV_ITEMS: { id: PageId; label: string; icon: typeof Home }[] = [
  { id: "office", label: "라이브 오피스", icon: Home },
  { id: "tasks", label: "오늘 할 일", icon: CheckSquare },
  { id: "calendar", label: "캘린더", icon: Calendar },
  { id: "stats", label: "기록/통계", icon: BarChart3 },
  { id: "settings", label: "설정", icon: Settings },
];

export default function Header({
  name,
  username,
  level,
  page,
  onNavigate,
  onSignOut,
  avatarSrc,
  avatarColor = "#fb7185",
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [showNav, setShowNav] = useState(false);

  const go = (id: PageId) => {
    onNavigate(id);
    setShowNav(false);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#f0e8e2] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-5">
        <button onClick={() => go("office")} className="flex shrink-0 items-center gap-2.5 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-200 to-pink-300 text-lg">
            🏢
          </div>
          <div>
            <h1 className="text-[17px] font-extrabold leading-tight tracking-tight text-gray-900">
              MY LIFE OFFICE
            </h1>
            <p className="text-[11px] text-gray-400">Work · Study · Life</p>
          </div>
        </button>

        <nav className="hidden items-center gap-1.5 lg:flex">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = page === id;
            return (
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-rose-50 text-rose-500 ring-1 ring-rose-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-gray-50"
            >
              {avatarSrc && !avatarFailed ? (
                // 증명사진처럼 머리 전체 + 어깨가 원 안에 들어오게 (귀·모자도 잘리지 않음) — 원본 480px 를 줄여 써서 깨지지 않는다
                <span
                  className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#fdf6f3]"
                  style={{ boxShadow: `0 0 0 2px #fff, 0 0 0 3.5px ${avatarColor}` }}
                >
                  <img
                    src={avatarSrc}
                    alt={`${name} 프로필`}
                    width={36}
                    height={36}
                    draggable={false}
                    onError={() => setAvatarFailed(true)}
                    className="absolute inset-0 h-full w-full object-contain"
                    style={{
                      objectPosition: "50% 100%",
                      transform: "translateY(2%) scale(0.86)",
                      transformOrigin: "50% 100%",
                    }}
                  />
                </span>
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: avatarColor }}
                >
                  {name.charAt(0)}
                </div>
              )}
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight text-gray-900">{name}</p>
                <p className="mt-0.5 inline-block rounded-md bg-rose-50 px-1.5 text-[10px] font-bold text-rose-400">
                  Lv.{level}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition ${showMenu ? "rotate-180" : ""}`}
              />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  <p className="mt-1 text-xs text-gray-500">@{username}</p>
                </div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    go("settings");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <Settings size={16} />
                  설정
                </button>
                <button
                  onClick={onSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={16} />
                  로그아웃
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowNav(!showNav)}
            className="rounded-lg p-2 transition hover:bg-gray-100 lg:hidden"
            aria-label="메뉴"
          >
            {showNav ? <X size={22} className="text-gray-700" /> : <Menu size={22} className="text-gray-700" />}
          </button>
        </div>
      </div>

      {showNav && (
        <nav className="grid grid-cols-2 gap-1.5 border-t border-[#f0e8e2] bg-white px-4 py-3 sm:grid-cols-5 lg:hidden">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                page === id ? "bg-rose-50 text-rose-500" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
