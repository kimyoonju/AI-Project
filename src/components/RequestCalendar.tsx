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

  // Month Names
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
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
      alert(`${nurse.name} already has a request assigned for day ${selectedDay}. Please remove it first.`);
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
              {MONTH_NAMES[month]} {year}
            </h2>
            <p className="text-xs text-natural-muted mt-1">
              Click any cell to pre-assign requests (e.g. scheduling specific off days or shift preferences).
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
            {MONTH_NAMES[month].substring(0, 3).toUpperCase()}
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
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-xs font-semibold text-natural-muted uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
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

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square p-2 rounded-lg border text-left flex flex-col justify-between transition group cursor-pointer relative ${
                    isSelected
                      ? 'border-natural-clay bg-[#fcfbfa] ring-2 ring-natural-clay/20'
                      : 'border-[#f2f1ea] hover:border-natural-sage hover:bg-[#faf9f5] bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-sm font-semibold ${
                      isSelected ? 'text-natural-clay' : 'text-natural-main'
                    }`}>
                      {day}
                    </span>
                    {dayRequests.length > 0 && (
                      <span className="text-[10px] bg-natural-sidebar text-natural-main font-bold px-1.5 py-0.5 rounded-full border border-natural-border/30">
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
                          className={`text-[9px] px-1.5 py-0.5 rounded border flex justify-between items-center truncate ${dutyMeta.color} ${dutyMeta.textColor}`}
                        >
                          <span className="truncate font-medium">{req.nurseName.split(' ')[0]}: {req.duty}</span>
                        </div>
                      );
                    })}
                    {dayRequests.length > 2 && (
                      <div className="text-[8px] text-center text-natural-muted font-semibold">
                        + {dayRequests.length - 2} more
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
                <h3 className="font-semibold text-natural-main flex items-center gap-1.5 text-base font-display italic">
                  <ClipboardList className="w-5 h-5 text-natural-clay" />
                  Day {selectedDay} Requests
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-natural-muted/60 hover:text-natural-main transition text-xs font-semibold cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {/* Add request form */}
              <div className="bg-[#fbfbfa] p-4 rounded-xl space-y-3 border border-natural-border/40">
                <h4 className="text-xs font-bold text-natural-muted uppercase tracking-wider">
                  Assign Daily Request
                </h4>

                <div>
                  <label className="block text-[10px] font-semibold text-natural-muted mb-1">
                    Select Staff Nurse
                  </label>
                  <select
                    value={selectedNurseId}
                    onChange={(e) => setSelectedNurseId(e.target.value)}
                    className="w-full text-xs border border-natural-border rounded bg-white p-2 text-natural-main focus:outline-none focus:ring-1 focus:ring-natural-sage cursor-pointer"
                  >
                    <option value="">-- Choose Nurse --</option>
                    {nurses.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} (Lvl {n.competency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-natural-muted mb-1">
                    Assigned Duty Shift
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
                              : 'bg-white border-natural-border text-natural-muted hover:bg-[#faf9f5]'
                          }`}
                        >
                          <span className="font-bold text-[10px]">{code}</span>
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
                  Add Request Badge
                </button>
              </div>

              {/* Active requests on this day */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-natural-muted uppercase tracking-wider">
                  Assigned Requests ({currentDayRequests.length})
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
                            <div className="text-xs font-bold text-natural-main">{req.nurseName}</div>
                            <div className="text-[10px] text-natural-muted">{meta.name}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveRequest(req.id)}
                          className="text-natural-muted/60 hover:text-natural-alert transition p-1 hover:bg-[#faf9f5] rounded cursor-pointer"
                          title="Remove Request"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  {currentDayRequests.length === 0 && (
                    <div className="text-xs text-natural-muted text-center py-4 bg-[#faf9f5] rounded-lg">
                      No requests assigned for this day.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-natural-muted space-y-3">
              <CalendarIcon className="w-12 h-12 text-[#e0ded6] mx-auto" />
              <div>
                <p className="font-semibold text-natural-main text-sm">No Day Selected</p>
                <p className="text-xs text-natural-muted max-w-[200px] mx-auto mt-1">
                  Click on any cell in the calendar to assign and manage requests.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
