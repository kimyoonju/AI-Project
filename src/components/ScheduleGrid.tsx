import React from 'react';
import { Nurse, DailySchedule, DutyCode, DUTIES } from '../types';
import { AlertCircle, AlertTriangle, CheckCircle2, UserCheck, RefreshCw, Layers } from 'lucide-react';

interface ScheduleGridProps {
  nurses: Nurse[];
  schedule: DailySchedule[];
  validationAlerts: string[];
  onTriggerGenerate: () => void;
  isGenerating: boolean;
}

export default function ScheduleGrid({
  nurses,
  schedule,
  validationAlerts,
  onTriggerGenerate,
  isGenerating,
}: ScheduleGridProps) {
  // Guard clause if no schedule generated yet
  if (!schedule || schedule.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-natural-border p-12 text-center shadow-sm space-y-4" id="empty-schedule-grid">
        <AlertCircle className="w-16 h-16 text-natural-clay mx-auto animate-pulse" />
        <div>
          <h3 className="text-lg font-medium text-natural-main dark:text-white font-display italic">No Schedule Active</h3>
          <p className="text-sm text-natural-muted mt-1 max-w-md mx-auto">
            Click the button below to generate a fresh, rule-abiding monthly schedule based on current requests and rules.
          </p>
        </div>
        <button
          onClick={onTriggerGenerate}
          className="bg-natural-sage hover:bg-natural-muted text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition shadow-xs inline-flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Auto-Generate Schedule
        </button>
      </div>
    );
  }

  // Calculate stats per nurse
  const getNurseStats = (nurseId: string) => {
    const stats = { D: 0, E: 0, N: 0, O: 0, W: 0 };
    schedule.forEach((daySchedule) => {
      const duty = daySchedule.assignments[nurseId] || 'O';
      stats[duty]++;
    });
    return stats;
  };

  // Check if any requirements are unmet across the month
  const totalDoubleShifts = schedule.reduce((sum, s) => sum + (s.actualCounts.W || 0), 0);
  const totalShortages = schedule.filter(s => !s.requirementsMet.D || !s.requirementsMet.E || !s.requirementsMet.N).length;

  return (
    <div className="space-y-6" id="schedule-grid-container">
      {/* Overview Cards & Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-natural-border p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-natural-muted uppercase tracking-wider">Schedule Coverage</div>
            <div className="text-2xl font-bold text-natural-main dark:text-white mt-1">
              {((schedule.length - totalShortages) / schedule.length * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-natural-muted mt-1">Percentage of fully-staffed days</div>
          </div>
          <div className="p-3 bg-natural-sidebar rounded-lg text-natural-muted">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-natural-border p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-natural-muted uppercase tracking-wider">Double Shifts (W)</div>
            <div className="text-2xl font-bold text-natural-main dark:text-white mt-1">
              {totalDoubleShifts}
            </div>
            <div className="text-[10px] text-natural-muted mt-1">Fallback coverage assigned</div>
          </div>
          <div className="p-3 bg-[#fdf9f0] border border-[#f5e9d9] rounded-lg text-[#cb997e]">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-natural-border p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-natural-muted uppercase tracking-wider">Validation Status</div>
            <div className="text-2xl font-bold text-natural-main dark:text-white mt-1">
              {validationAlerts.filter(a => a.includes('CRITICAL') || a.includes('banned')).length === 0 ? 'Compliant' : 'Alerts Active'}
            </div>
            <div className="text-[10px] text-natural-muted mt-1">Rule engine health score</div>
          </div>
          <div className={`p-3 rounded-lg border ${
            validationAlerts.filter(a => a.includes('CRITICAL') || a.includes('banned')).length === 0
              ? 'bg-natural-sidebar border-natural-border/40 text-natural-muted'
              : 'bg-natural-sidebar border-natural-border/40 text-natural-clay'
          }`}>
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={onTriggerGenerate}
            disabled={isGenerating}
            className="w-full h-full bg-natural-sage hover:bg-natural-muted disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl text-sm transition shadow-xs flex flex-col justify-center items-center gap-1 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Recalculating...' : 'Auto-Generate'}</span>
            </div>
            <span className="text-[10px] font-normal opacity-85">Randomly seeded constraint satisfaction</span>
          </button>
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-natural-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-natural-border flex justify-between items-center bg-[#faf9f5]">
          <div>
            <h3 className="font-semibold text-natural-main text-sm font-display italic">Monthly Schedule Matrix</h3>
            <p className="text-xs text-natural-muted">X-axis: Days of Month, Y-axis: Nurses. Key: D: Day, E: Evening, N: Night, W: Double, O: Off</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
            <thead>
              {/* Day numbers */}
              <tr className="bg-[#fcfcfa] border-b border-natural-border/60">
                <th className="sticky left-0 bg-[#fcfcfa] z-20 w-[160px] py-3 px-4 text-xs font-semibold text-natural-muted uppercase tracking-wider border-r border-natural-border/50">
                  Staff Member
                </th>
                {schedule.map((daySchedule) => (
                  <th
                    key={daySchedule.day}
                    className={`py-2 text-center text-xs font-bold border-r border-natural-border/50 w-[35px] ${
                      daySchedule.isWeekend ? 'bg-[#eeece1]/30' : ''
                    }`}
                  >
                    <div className="text-[9px] font-semibold text-natural-muted uppercase">{daySchedule.dayOfWeek.substring(0, 2)}</div>
                    <div className="text-natural-main">{daySchedule.day}</div>
                  </th>
                ))}
                <th className="py-2 text-center text-xs font-semibold text-natural-muted uppercase w-[180px] pl-2">
                  Total Metrics (D/E/N/O/W)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-natural-border/40">
              {nurses.map((nurse) => {
                const stats = getNurseStats(nurse.id);

                return (
                  <tr key={nurse.id} className="hover:bg-natural-sidebar/20 transition">
                    {/* Nurse Row Header Sticky */}
                    <td className="sticky left-0 bg-white z-10 py-3 px-4 font-semibold text-natural-main border-r border-natural-border/50 truncate text-xs shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                      <div>{nurse.name}</div>
                      <div className="text-[10px] text-natural-muted font-normal mt-0.5">Lvl {nurse.competency} Nurse</div>
                    </td>

                    {/* Schedule Cells */}
                    {schedule.map((daySchedule) => {
                      const duty = daySchedule.assignments[nurse.id] || 'O';
                      const dutyMeta = DUTIES[duty];

                      return (
                        <td
                          key={daySchedule.day}
                          className={`p-1 border-r border-natural-border/40 text-center w-[35px] relative group ${
                            daySchedule.isWeekend ? 'bg-[#eeece1]/10' : ''
                          }`}
                        >
                          <div
                            className={`w-7 h-7 mx-auto rounded-md border flex items-center justify-center text-xs font-bold shadow-2xs transition-all hover:scale-105 select-none ${dutyMeta.color} ${dutyMeta.textColor}`}
                            title={`${nurse.name} - Day ${daySchedule.day} (${daySchedule.dayOfWeek}): ${dutyMeta.name}`}
                          >
                            {duty}
                          </div>
                        </td>
                      );
                    })}

                    {/* Stats per Nurse */}
                    <td className="py-2 px-3 text-center w-[180px]">
                      <div className="flex justify-center gap-1 text-[10px]">
                        <span className="bg-white text-natural-main border border-natural-border/60 px-1.5 py-0.5 rounded font-bold" title="Day Shifts">
                          D:{stats.D}
                        </span>
                        <span className="bg-[#f0e6d2] text-[#8d6e63] px-1.5 py-0.5 rounded font-bold" title="Evening Shifts">
                          E:{stats.E}
                        </span>
                        <span className="bg-[#dbe1e3] text-[#37474f] px-1.5 py-0.5 rounded font-bold" title="Night Shifts">
                          N:{stats.N}
                        </span>
                        <span className="bg-transparent border border-dashed border-natural-border/80 text-natural-muted/70 px-1.5 py-0.5 rounded font-bold" title="Off Days">
                          O:{stats.O}
                        </span>
                        {stats.W > 0 && (
                          <span className="bg-natural-alert text-white px-1.5 py-0.5 rounded font-bold animate-pulse" title="Double Shifts Assigned">
                            W:{stats.W}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Requirement Coverage Summary Row */}
              <tr className="bg-[#fcfcfa] border-t border-natural-border font-bold text-xs text-natural-main">
                <td className="sticky left-0 bg-[#fcfcfa] z-10 py-3 px-4 border-r border-natural-border/50 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                  Required Cover
                </td>
                {schedule.map((daySchedule) => {
                  const hasShortage = !daySchedule.requirementsMet.D || !daySchedule.requirementsMet.E || !daySchedule.requirementsMet.N;
                  const hasDoubleShift = daySchedule.doubleShiftAssigned;

                  return (
                    <td
                      key={daySchedule.day}
                      className={`py-1 text-center border-r border-natural-border/40 ${
                        hasShortage
                          ? 'bg-rose-50/40'
                          : hasDoubleShift
                          ? 'bg-[#fdf9f0]'
                          : 'bg-natural-sidebar/10'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 items-center justify-center text-[9px]">
                        <span className={daySchedule.actualCounts.D + daySchedule.actualCounts.W >= daySchedule.requiredCounts.D ? 'text-[#6b705c]' : 'text-natural-alert font-bold'}>
                          D:{daySchedule.actualCounts.D + daySchedule.actualCounts.W}/{daySchedule.requiredCounts.D}
                        </span>
                        <span className={daySchedule.actualCounts.E + daySchedule.actualCounts.W >= daySchedule.requiredCounts.E ? 'text-[#6b705c]' : 'text-natural-alert font-bold'}>
                          E:{daySchedule.actualCounts.E + daySchedule.actualCounts.W}/{daySchedule.requiredCounts.E}
                        </span>
                        <span className={daySchedule.actualCounts.N + daySchedule.actualCounts.W >= daySchedule.requiredCounts.N ? 'text-[#6b705c]' : 'text-natural-alert font-bold'}>
                          N:{daySchedule.actualCounts.N + daySchedule.actualCounts.W}/{daySchedule.requiredCounts.N}
                        </span>
                      </div>
                    </td>
                  );
                })}
                <td className="py-2 text-center text-[10px] text-natural-muted font-medium">
                  Sum of filled slots
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Alerts Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-natural-border p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-natural-main flex items-center gap-2 mb-4 font-display italic">
          <AlertTriangle className="w-5 h-5 text-natural-clay" />
          Rule Validation Logs & Coverage Insights
        </h3>

        {validationAlerts.length > 0 ? (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
            {validationAlerts.map((alert, idx) => {
              const isCritical = alert.includes('CRITICAL') || alert.includes('strictly banned') || alert.includes('consecutive Double Shifts');
              const isDouble = alert.includes('Double Shift');

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg flex gap-3 text-xs border ${
                    isCritical
                      ? 'bg-rose-50/50 border-rose-200 text-rose-800'
                      : isDouble
                      ? 'bg-[#fdf9f0] border-[#ecdac2] text-[#8c5a36]'
                      : 'bg-natural-sidebar/40 border-natural-border text-natural-muted'
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isCritical ? 'text-rose-600' : isDouble ? 'text-natural-clay' : 'text-natural-muted'}`} />
                  <div>
                    <span className="font-semibold">{isCritical ? '[CRITICAL RULE] ' : isDouble ? '[COVERAGE FALLBACK] ' : '[ADVISORY] '}</span>
                    {alert}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-natural-sidebar border border-natural-border rounded-lg text-natural-main flex items-center gap-3 text-xs">
            <CheckCircle2 className="w-4 h-4 text-natural-sage" />
            <div>
              <span className="font-semibold">All constraints validated!</span> The active monthly schedule fully respects all forbidden patterns (E-O-D, N-O-D, N-D, N-E banned, consecutive double shifts, night rest days, allowed duties).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
