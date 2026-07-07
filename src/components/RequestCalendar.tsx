import React, { useState } from 'react';
import { Nurse, DayRequest, DutyCode, DUTIES } from '../types';
import { Calendar as CalendarIcon, Plus, X, ArrowLeft, ArrowRight, ClipboardList } from 'lucide-react';
import { getDaysInMonth } from '../utils/schedulingAlgorithm';

interface RequestCalendarProps {
  year: number;
  month: number;
  nurses: Nurse[];
  requests: DayRequest[];
  onAddRequest: (request: Omit<DayRequest, 'id'>) => void;
  onRemoveRequest: (id: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function RequestCalendar({
  year,
  month,
  nurses,
  requests,
  onAddRequest,
  onRemoveRequest,
  onPrevMonth,
  onNextMonth,
}: RequestCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedNurseId, setSelectedNurseId] = useState<string>('');
  const [selectedDuty, setSelectedDuty] = useState<DutyCode>('O');

  // Month Names (Korean)
  const MONTH_NAMES = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const totalDays = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Generate blank cells for start padding
  const paddingCells = Array.from({ length: firstDayOfWeek });
  const dayCells = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Filter requests for a specific day
  const getRequestsForDay = (day: number) => {
    return requests.filter((r) => r.day === day);
  };

  const handleAddRequestClick = () => {
    if (!selectedDay || !selectedNurseId) return;

    const nurse = nurses.find((n) => n.id === selectedNurseId);
    if (!nurse) return;

    // Check if request already exists for this nurse on this day
    const exists = requests.some((r) => r.day === selectedDay && r.nurseId === selectedNurseId);
    if (exists) {
      alert(`${nurse.name} 간호사는 이미 ${selectedDay}일에 희망 근무(또는 휴무)가 신청되어 있습니다. 변경하려면 기존 신청을 먼저 삭제해 주세요.`);
      return;
    }

    onAddRequest({
      nurseId: selectedNurseId,
      nurseName: nurse.name,
      duty: selectedDuty,
      day: selectedDay,
    });

    setSelectedNurseId('');
    setSelectedDuty('O');
  };

  const currentDayRequests = selectedDay ? getRequestsForDay(selectedDay) : [];

  return (
    <div className="space-y-6" id="request-calendar-container">
      {/* Calendar Header with navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-natural-border p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-natural-sidebar rounded-xl text-natural-clay">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-natural-main dark:text-white font-display italic">
              {year}년 {MONTH_NAMES[month]}
            </h2>
            <p className="text-xs text-natural-muted mt-1">
              일별 달력 칸을 눌러 특정 오프(휴무) 지정이나 희망 근무 타입 등 희망 근무 신청을 사전 배정하세요.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="p-2 border border-natural-border rounded-lg hover:bg-natural-sidebar text-natural-muted transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-natural-main px-3 font-mono">
            {MONTH_NAMES[month]}
          </span>
          <button
            onClick={onNextMonth}
            className="p-2 border border-natural-border rounded-lg hover:bg-natural-sidebar text-natural-muted transition cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-natural-border p-6 shadow-sm">
          <div className="grid grid-cols-7 text-center gap-2 mb-4">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, index) => {
              const dayColorClass = index === 0
                ? 'text-red-500 font-extrabold'
                : index === 6
                ? 'text-blue-500 font-extrabold'
                : 'text-natural-muted';

              return (
                <div key={d} className={`text-xs font-bold uppercase tracking-wider py-1 ${dayColorClass}`}>
                  {d}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Start padding empty cells */}
            {paddingCells.map((_, i) => (
              <div
                key={`pad-${i}`}
                className="aspect-square bg-[#faf9f5] dark:bg-slate-950/20 rounded-lg border border-transparent"
              />
            ))}

            {/* Day cells */}
            {dayCells.map((day) => {
              const dayRequests = getRequestsForDay(day);
              const isSelected = selectedDay === day;
              
              // Calculate day of week index (0=Sunday, 6=Saturday)
              const dateObj = new Date(year, month, day);
              const dayOfWeekIdx = dateObj.getDay();
              const isSunday = dayOfWeekIdx === 0;
              const isSaturday = dayOfWeekIdx === 6;

              const dateNumberColorClass = isSelected
                ? 'text-natural-clay font-bold'
                : isSunday
                ? 'text-red-600 dark:text-red-400 font-extrabold'
                : isSaturday
                ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                : 'text-natural-main dark:text-white';

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square p-2 rounded-lg border text-left flex flex-col justify-between transition group cursor-pointer relative ${
                    isSelected
                      ? 'border-natural-clay bg-[#fcfbfa] dark:bg-slate-850 ring-2 ring-natural-clay/20'
                      : 'border-[#f2f1ea] dark:border-slate-800 hover:border-natural-sage hover:bg-[#faf9f5] bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-xs ${dateNumberColorClass}`}>
                      {day}
                    </span>
                    {dayRequests.length > 0 && (
                      <span className="text-[10px] bg-natural-sidebar dark:bg-slate-800 text-natural-main dark:text-slate-200 font-bold px-1.5 py-0.5 rounded-full border border-natural-border/30">
                        {dayRequests.length}
                      </span>
                    )}
                  </div>

                  {/* Badges container */}
                  <div className="mt-1 space-y-1 overflow-hidden flex-1 flex flex-col justify-end w-full">
                    {dayRequests.slice(0, 2).map((req) => {
                      const dutyMeta = DUTIES[req.duty];
                      return (
                        <div
                          key={req.id}
                          className={`text-[9px] px-1 py-0.5 rounded border flex justify-between items-center truncate ${dutyMeta.color} ${dutyMeta.textColor}`}
                        >
                          <span className="truncate font-medium">{req.nurseName.split(' ')[0]}: {req.duty === 'W' ? 'W' : req.duty}</span>
                        </div>
                      );
                    })}
                    {dayRequests.length > 2 && (
                      <div className="text-[8px] text-center text-natural-muted font-semibold">
                        외 {dayRequests.length - 2}명 더 있음
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Request Details Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-natural-border p-6 shadow-sm h-fit">
          {selectedDay ? (
            <div className="space-y-4">
              <div className="border-b border-[#f3f1e9] pb-3 flex justify-between items-center">
                <h3 className="font-semibold text-natural-main dark:text-white flex items-center gap-1.5 text-base font-display italic">
                  <ClipboardList className="w-5 h-5 text-natural-clay" />
                  {selectedDay}일 희망 근무 신청 목록
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-natural-muted/60 hover:text-natural-main transition text-xs font-semibold cursor-pointer"
                >
                  지우기
                </button>
              </div>

              {/* Add request form */}
              <div className="bg-[#fbfbfa] dark:bg-slate-800/40 p-4 rounded-xl space-y-3 border border-natural-border/40">
                <h4 className="text-xs font-bold text-natural-muted uppercase tracking-wider">
                  희망 근무 신청 추가
                </h4>

                <div>
                  <label className="block text-[10px] font-semibold text-natural-muted mb-1">
                    대상 간호사 선택
                  </label>
                  <select
                    value={selectedNurseId}
                    onChange={(e) => setSelectedNurseId(e.target.value)}
                    className="w-full text-xs border border-natural-border rounded bg-white dark:bg-slate-800 p-2 text-natural-main dark:text-white focus:outline-none focus:ring-1 focus:ring-natural-sage cursor-pointer"
                  >
                    <option value="">-- 간호사 선택 --</option>
                    {nurses.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} (숙련 {n.competency}등급)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-natural-muted mb-1">
                    지정 근무 유형
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(DUTIES) as DutyCode[]).map((code) => {
                      const meta = DUTIES[code];
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setSelectedDuty(code)}
                          className={`text-xs p-1.5 rounded border transition flex items-center justify-center gap-1 font-semibold cursor-pointer ${
                            selectedDuty === code
                              ? `${meta.color} ${meta.textColor} ring-1 ring-[#e07a5f]`
                              : 'bg-white dark:bg-slate-850 border-natural-border text-natural-muted hover:bg-[#faf9f5]'
                          }`}
                        >
                          <span className="font-bold text-[10px]">{code === 'W' ? 'W' : code}</span>
                          <span className="text-[9px] font-normal">{meta.name.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddRequestClick}
                  disabled={!selectedNurseId}
                  className="w-full bg-natural-sage hover:bg-natural-muted disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 px-3 rounded-lg transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  신청 등록하기
                </button>
              </div>

              {/* Active requests on this day */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-natural-muted uppercase tracking-wider">
                  지정된 근무 신청 ({currentDayRequests.length}건)
                </h4>
                <div className="divide-y divide-natural-border/30 max-h-[220px] overflow-y-auto pr-1">
                  {currentDayRequests.map((req) => {
                    const meta = DUTIES[req.duty];
                    return (
                      <div key={req.id} className="py-2 flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.color} ${meta.textColor}`}>
                            {req.duty}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-natural-main dark:text-white">{req.nurseName}</div>
                            <div className="text-[10px] text-natural-muted">{meta.name}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveRequest(req.id)}
                          className="text-natural-muted/60 hover:text-natural-alert transition p-1 hover:bg-[#faf9f5] rounded cursor-pointer"
                          title="신청 제거"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  {currentDayRequests.length === 0 && (
                    <div className="text-xs text-natural-muted text-center py-4 bg-[#faf9f5] dark:bg-slate-800 rounded-lg">
                      이날 신청된 희망 근무가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-natural-muted space-y-3">
              <CalendarIcon className="w-12 h-12 text-[#e0ded6] mx-auto" />
              <div>
                <p className="font-semibold text-natural-main dark:text-slate-300 text-sm">선택된 날짜 없음</p>
                <p className="text-xs text-natural-muted max-w-[200px] mx-auto mt-1">
                  달력의 임의의 날짜 칸을 선택하여 간호사별 휴무나 특정 근무 지정을 설정하세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
