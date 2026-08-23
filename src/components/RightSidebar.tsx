import { useState, useEffect } from "react";
import { formatDate, formatTime } from "../utils/helpers";
import { Plus, Clock, FileText, Timer } from "lucide-react";

export default function RightSidebar() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const schedules = [
    {
      id: 1,
      time: "10:00",
      title: "팀 주간 회의",
      person: "회의실 A",
      color: "bg-pink-50 text-pink-600",
    },
    {
      id: 2,
      time: "11:00",
      title: "AA 방송 확인",
      person: "진행중",
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      id: 3,
      time: "14:00",
      title: "입고 현황 점검",
      person: "창고 / ERP 점검",
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: 4,
      time: "16:00",
      title: "보고서 리뷰",
      person: "분무업 보고",
      color: "bg-green-50 text-green-600",
    },
  ];

  const workingTime = {
    total: "03:21:16",
    start: "08:27",
    end: "--:--",
  };

  return (
    <aside className="w-72 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Date & Time */}
        <div>
          <div className="text-sm text-gray-500 mb-1">{formatDate(now)}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {formatTime(now).split(":")[0]}
            </span>
            <span className="text-2xl font-bold text-gray-600">
              {formatTime(now).split(":")[1]}
            </span>
            <span className="text-lg font-medium text-gray-500">
              {now.getHours() < 12 ? "AM" : "PM"}
            </span>
            <span className="text-xl ml-auto">☀️</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">18°C 맑음</p>
        </div>

        {/* Today's Schedule */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">오늘의 일정</h3>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
              +
            </button>
          </div>

          <div className="space-y-2">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`${schedule.color} p-3 rounded-lg`}
              >
                <p className="font-semibold text-sm">{schedule.time}</p>
                <p className="text-sm font-medium">{schedule.title}</p>
                <p className="text-xs mt-1 opacity-75">{schedule.person}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Working Time */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={18} />
            근무 시간
          </h3>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">총근무시간</span>
              <span className="font-semibold text-gray-900">
                {workingTime.total}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">퇴근 시간</span>
              <span className="font-semibold text-gray-900">
                {workingTime.end}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">근무 시간</span>
              <span className="font-semibold text-red-600">03:21:16</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">바로가기</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg border border-blue-200">
              <Plus size={24} className="text-blue-600" />
              <span className="text-xs font-medium text-gray-700">업무 추가</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg border border-purple-200">
              <FileText size={24} className="text-purple-600" />
              <span className="text-xs font-medium text-gray-700">메모</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg border border-green-200">
              <Timer size={24} className="text-green-600" />
              <span className="text-xs font-medium text-gray-700">타이머</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-lg border border-orange-200">
              <Plus size={24} className="text-orange-600" />
              <span className="text-xs font-medium text-gray-700">일정 추가</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
