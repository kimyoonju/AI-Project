import React, { useState } from 'react';
import { Nurse, DailySchedule, DutyCode, DUTIES } from '../types';
import { AlertCircle, AlertTriangle, CheckCircle2, UserCheck, RefreshCw, Layers, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ScheduleGridProps {
  nurses: Nurse[];
  schedule: DailySchedule[];
  validationAlerts: string[];
  onTriggerGenerate: () => void;
  isGenerating: boolean;
  targetOffDays: number;
  onSwapDuties: (sourceNurseId: string, sourceDay: number, targetNurseId: string, targetDay: number) => void;
  onUpdateDuty: (nurseId: string, day: number, newDuty: DutyCode) => void;
}

export default function ScheduleGrid({
  nurses,
  schedule,
  validationAlerts,
  onTriggerGenerate,
  isGenerating,
  targetOffDays,
  onSwapDuties,
  onUpdateDuty,
}: ScheduleGridProps) {
  // Guard clause if no schedule generated yet
  if (!schedule || schedule.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-natural-border p-12 text-center shadow-sm space-y-4" id="empty-schedule-grid">
        <AlertCircle className="w-16 h-16 text-natural-clay mx-auto animate-pulse" />
        <div>
          <h3 className="text-lg font-medium text-natural-main dark:text-white font-display italic">활성화된 근무 일정이 없습니다</h3>
          <p className="text-sm text-natural-muted mt-1 max-w-md mx-auto">
            아래 단추를 눌러 현재 희망 신청과 근무 규칙에 부합하는 한 달간의 간호사 근무 일정표를 자동으로 생성하세요.
          </p>
        </div>
        <button
          onClick={onTriggerGenerate}
          className="bg-natural-sage hover:bg-natural-muted text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition shadow-xs inline-flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          근무 일정 자동 생성하기
        </button>
      </div>
    );
  }

  // Drag and drop states for manual 1:1 duty swap
  const [draggedCell, setDraggedCell] = useState<{ nurseId: string; day: number } | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ nurseId: string; day: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ nurseId: string; day: number } | null>(null);

  const handleDragStart = (e: React.DragEvent, nurseId: string, day: number) => {
    setDraggedCell({ nurseId, day });
    e.dataTransfer.setData('text/plain', JSON.stringify({ nurseId, day }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, nurseId: string, day: number) => {
    e.preventDefault();
    if (dragOverCell?.nurseId !== nurseId || dragOverCell?.day !== day) {
      setDragOverCell({ nurseId, day });
    }
  };

  const handleDragEnd = () => {
    setDraggedCell(null);
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetNurseId: string, targetDay: number) => {
    e.preventDefault();
    setDragOverCell(null);
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const { nurseId: sourceNurseId, day: sourceDay } = JSON.parse(dataStr);
      
      if (sourceNurseId === targetNurseId && sourceDay === targetDay) return;
      
      onSwapDuties(sourceNurseId, sourceDay, targetNurseId, targetDay);
    } catch (err) {
      console.error('Failed to swap duties via drag and drop', err);
    } finally {
      setDraggedCell(null);
    }
  };

  // Calculate stats per nurse
  const getNurseStats = (nurseId: string) => {
    const stats = { D: 0, E: 0, N: 0, O: 0, W: 0 };
    schedule.forEach((daySchedule) => {
      const duty = daySchedule.assignments[nurseId] || 'O';
      stats[duty]++;
    });
    return stats;
  };

  const handleExportExcel = () => {
    if (!schedule || schedule.length === 0) return;

    // Get current year and month from schedule data
    const dateStr = schedule[0]?.dateStr || 'schedule';
    const monthMatch = dateStr.match(/-(\d{2})-/);
    const monthNum = monthMatch ? parseInt(monthMatch[1], 10) : new Date().getMonth() + 1;
    const monthTitle = `${monthNum}월`;

    // 1. Create headers (two rows: Row 1 has Month at A1 and day numbers starting at B1, Row 2 has '간호사명' at A2 and weekdays starting at B2)
    const headerRow1 = [
      monthTitle,
      ...schedule.map((daySchedule) => daySchedule.day),
      'D(낮)',
      'E(저녁)',
      'N(야간)',
      'O(휴무)',
      'W(더블)'
    ];

    const headerRow2 = [
      '간호사명',
      ...schedule.map((daySchedule) => daySchedule.dayOfWeek),
      '',
      '',
      '',
      '',
      ''
    ];

    // 2. Generate rows
    const rows = nurses.map((nurse) => {
      const stats = getNurseStats(nurse.id);
      const rowData: (string | number)[] = [
        nurse.name,
      ];

      schedule.forEach((daySchedule) => {
        const duty = daySchedule.assignments[nurse.id] || 'O';
        rowData.push(duty === 'W' ? 'W' : duty);
      });

      rowData.push(stats.D, stats.E, stats.N, stats.O, stats.W);
      return rowData;
    });

    // 3. Create worksheet and workbook
    const wsData = [headerRow1, headerRow2, ...rows];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths adjustment
    const colWidths = [
      { wch: 15 }, // Name
      ...schedule.map(() => ({ wch: 6 })), // Days
      { wch: 8 },  // D
      { wch: 8 },  // E
      { wch: 8 },  // N
      { wch: 8 },  // O
      { wch: 8 }   // W
    ];
    ws['!cols'] = colWidths;

    const sheetName = `${dateStr.substring(0, 7)} 근무표`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 4. Download file
    const filename = `근무일정표_${dateStr.substring(0, 7)}.xlsx`;
    XLSX.writeFile(wb, filename);
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
            <div className="text-xs font-semibold text-natural-muted uppercase tracking-wider">일정 충족률</div>
            <div className="text-2xl font-bold text-natural-main dark:text-white mt-1">
              {((schedule.length - totalShortages) / schedule.length * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-natural-muted mt-1">모든 근무조 최소 인원 충족 비율</div>
          </div>
          <div className="p-3 bg-natural-sidebar rounded-lg text-natural-muted">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-natural-border p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-natural-muted uppercase tracking-wider">더블 근무 발생 (D/E)</div>
            <div className="text-2xl font-bold text-natural-main dark:text-white mt-1">
              {totalDoubleShifts}회
            </div>
            <div className="text-[10px] text-natural-muted mt-1">부족 인원 충족을 위한 더블 배정</div>
          </div>
          <div className="p-3 bg-[#fdf9f0] border border-[#f5e9d9] rounded-lg text-[#cb997e]">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-natural-border p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-natural-muted uppercase tracking-wider">검증 상태</div>
            <div className="text-2xl font-bold text-natural-main dark:text-white mt-1">
              {validationAlerts.filter(a => a.includes('[금지]') || a.includes('[제한초과]')).length === 0 ? '이상 없음' : '규칙 검토 필요'}
            </div>
            <div className="text-[10px] text-natural-muted mt-1">근무 규칙 엔진 실시간 검증 결과</div>
          </div>
          <div className={`p-3 rounded-lg border ${
            validationAlerts.filter(a => a.includes('[금지]') || a.includes('[제한초과]')).length === 0
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
              <span>{isGenerating ? '계산 중...' : '근무 일정 자동 생성'}</span>
            </div>
            <span className="text-[10px] font-normal opacity-85 text-center">제약조건 만족 및 최적화 엔진 구동</span>
          </button>
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-natural-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-natural-border flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#faf9f5] gap-4">
          <div>
            <h3 className="font-semibold text-natural-main text-sm font-display italic">월간 근무 일정표 (매트릭스)</h3>
            <p className="text-xs text-natural-muted">가로축: 일자, 세로축: 간호사. 범례: D: 낮(Day), E: 저녁(Evening), N: 야간(Night), W: 더블 근무(D/E), O: 오프(Off)</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-1 flex items-center gap-1">
              <span>👉 <strong>수동 편집 & 1:1 교환 팁:</strong> 근무 아이콘을 클릭하여 원하는 근무로 즉시 변경하거나, 드래그하여 다른 칸과 맞교환(Swap)할 수 있습니다. 수동 조정 시 월간 집계와 실시간 규칙 검증이 즉시 재계산됩니다.</span>
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            className="bg-natural-sage hover:bg-natural-muted text-white font-semibold py-2 px-4 rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            엑셀 파일 다운로드 (.xlsx)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
            <thead>
              {/* Day numbers */}
              <tr className="bg-[#fcfcfa] border-b border-natural-border/60">
                <th className="sticky left-0 bg-[#fcfcfa] z-20 w-[160px] py-3 px-4 text-xs font-semibold text-natural-muted uppercase tracking-wider border-r border-natural-border/50">
                  간호사명
                </th>
                {schedule.map((daySchedule) => {
                  const isSaturday = daySchedule.dayOfWeek === '토';
                  const isSunday = daySchedule.dayOfWeek === '일';
                  const dateColorClass = isSaturday
                    ? 'text-blue-600 dark:text-blue-400'
                    : isSunday
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-natural-main dark:text-slate-100';

                  const dayOfWeekColorClass = isSaturday
                    ? 'text-blue-500/80 dark:text-blue-400/80'
                    : isSunday
                    ? 'text-red-500/80 dark:text-red-400/80'
                    : 'text-natural-muted dark:text-slate-400';

                  return (
                    <th
                      key={daySchedule.day}
                      className={`py-2 text-center text-xs font-bold border-r border-natural-border/50 w-[35px] ${
                        daySchedule.isWeekend ? 'bg-[#eeece1]/30' : ''
                      }`}
                    >
                      <div className={`text-[9px] font-bold uppercase ${dayOfWeekColorClass}`}>
                        {daySchedule.dayOfWeek}
                      </div>
                      <div className={`text-xs font-extrabold ${dateColorClass}`}>
                        {daySchedule.day}
                      </div>
                    </th>
                  );
                })}
                <th className="py-2 text-center text-xs font-semibold text-natural-muted uppercase w-[190px] pl-2 border-l border-natural-border/50">
                  월간 근무 집계 (D/E/N/O/더블)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-natural-border/40">
              {nurses.map((nurse) => {
                const stats = getNurseStats(nurse.id);
                const minOff = nurse.minOffDays !== undefined ? nurse.minOffDays : 8;
                const maxOff = nurse.maxOffDays !== undefined ? nurse.maxOffDays : 10;
                const hasOffViolation = stats.O < minOff || stats.O > maxOff;

                return (
                  <tr key={nurse.id} className="hover:bg-natural-sidebar/20 transition">
                    {/* Nurse Row Header Sticky */}
                    <td className="sticky left-0 bg-white dark:bg-slate-900 z-10 py-3 px-4 font-semibold text-natural-main border-r border-natural-border/50 truncate text-xs shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                      <div className="dark:text-white">{nurse.name}</div>
                      <div className="text-[10px] text-natural-muted font-normal mt-0.5">숙련도 {nurse.competency}등급</div>
                    </td>

                    {/* Schedule Cells */}
                    {schedule.map((daySchedule) => {
                      const duty = daySchedule.assignments[nurse.id] || 'O';
                      const dutyMeta = DUTIES[duty];
                      const isDragged = draggedCell?.nurseId === nurse.id && draggedCell?.day === daySchedule.day;
                      const isDragOver = dragOverCell?.nurseId === nurse.id && dragOverCell?.day === daySchedule.day;
                      const isEditing = editingCell?.nurseId === nurse.id && editingCell?.day === daySchedule.day;

                      return (
                        <td
                          key={daySchedule.day}
                          className={`p-1 border-r border-natural-border/40 text-center w-[35px] relative group transition-all duration-150 ${
                            daySchedule.isWeekend ? 'bg-[#eeece1]/10' : ''
                          } ${isDragOver ? 'bg-amber-100/50 dark:bg-amber-950/30 ring-2 ring-dashed ring-amber-500 rounded-sm' : ''} ${
                            isEditing ? 'z-50' : ''
                          }`}
                          onDragOver={(e) => handleDragOver(e, nurse.id, daySchedule.day)}
                          onDrop={(e) => handleDrop(e, nurse.id, daySchedule.day)}
                        >
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, nurse.id, daySchedule.day)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCell(isEditing ? null : { nurseId: nurse.id, day: daySchedule.day });
                            }}
                            className={`w-7 h-7 mx-auto rounded-md border flex items-center justify-center text-xs font-extrabold shadow-2xs transition-all hover:scale-110 select-none cursor-pointer hover:ring-2 hover:ring-amber-400 dark:hover:ring-amber-500 ${
                              isDragged ? 'opacity-30 scale-90 border-dashed border-natural-muted' : ''
                            } ${isDragOver ? 'scale-110 rotate-2' : ''} ${dutyMeta.color} ${dutyMeta.textColor}`}
                            title={`${nurse.name} - ${daySchedule.day}일 (${daySchedule.dayOfWeek}요일): ${dutyMeta.name} (클릭하여 근무 변경 / 드래그하여 맞교환 가능)`}
                          >
                            {duty === 'W' ? 'W' : duty}
                          </div>

                          {isEditing && (
                            <>
                              <div
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCell(null);
                                }}
                              />
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 w-32 flex flex-col divide-y divide-slate-100 dark:divide-slate-700 text-left animate-in fade-in slide-in-from-top-1 duration-100">
                                <div className="px-2 py-1 text-[10px] text-slate-400 dark:text-slate-500 font-bold select-none text-center">
                                  근무 변경 ({daySchedule.day}일)
                                </div>
                                <div className="py-1">
                                  {(['D', 'E', 'N', 'W', 'O'] as DutyCode[]).map((dCode) => {
                                    const meta = DUTIES[dCode];
                                    const isSelected = duty === dCode;
                                    return (
                                      <button
                                        key={dCode}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onUpdateDuty(nurse.id, daySchedule.day, dCode);
                                          setEditingCell(null);
                                        }}
                                        className={`w-full px-2 py-1.5 text-xs font-bold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left ${
                                          isSelected
                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                            : 'text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-extrabold shadow-2xs border ${meta.color} ${meta.textColor}`}>
                                          {dCode}
                                        </span>
                                        <span className="truncate">{meta.name.replace(' 근무', '')}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </td>
                      );
                    })}

                    {/* Stats per Nurse */}
                    <td className="py-2 px-3 text-center w-[190px] border-l border-natural-border/40">
                      <div className="flex justify-center gap-1 text-[10px] font-mono">
                        <span className="bg-white dark:bg-slate-800 text-natural-main dark:text-slate-200 border border-natural-border/60 px-1.5 py-0.5 rounded font-bold" title="낮 근무">
                          D:{stats.D}
                        </span>
                        <span className="bg-[#f0e6d2] dark:bg-amber-950/40 text-[#8d6e63] dark:text-amber-200 px-1.5 py-0.5 rounded font-bold" title="저녁 근무">
                          E:{stats.E}
                        </span>
                        <span className="bg-[#dbe1e3] dark:bg-slate-800 text-[#37474f] dark:text-slate-300 px-1.5 py-0.5 rounded font-bold" title="야간 근무">
                          N:{stats.N}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-bold border ${
                          hasOffViolation 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-transparent border-dashed border-natural-border/80 text-natural-muted/70'
                        }`} title={`월간 총 휴무 (목표 범위: ${minOff}~${maxOff}일)`}>
                          O:{stats.O}
                        </span>
                        {stats.W > 0 && (
                          <span className="bg-amber-100 border border-amber-300 text-amber-800 px-1.5 py-0.5 rounded font-bold animate-pulse" title="D/E 더블 근무 배정">
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
                <td className="sticky left-0 bg-[#fcfcfa] z-10 py-3 px-4 border-r border-natural-border/50 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] text-natural-muted">
                  근무 요구 인원 충족도
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
                      <div className="flex flex-col gap-0.5 items-center justify-center text-[9px] font-mono">
                        <span className={daySchedule.actualCounts.D + daySchedule.actualCounts.W >= daySchedule.requiredCounts.D ? 'text-[#6b705c]' : 'text-natural-alert font-extrabold'}>
                          D:{daySchedule.actualCounts.D + daySchedule.actualCounts.W}/{daySchedule.requiredCounts.D}
                        </span>
                        <span className={daySchedule.actualCounts.E + daySchedule.actualCounts.W >= daySchedule.requiredCounts.E ? 'text-[#6b705c]' : 'text-natural-alert font-extrabold'}>
                          E:{daySchedule.actualCounts.E + daySchedule.actualCounts.W}/{daySchedule.requiredCounts.E}
                        </span>
                        <span className={daySchedule.actualCounts.N + daySchedule.actualCounts.W >= daySchedule.requiredCounts.N ? 'text-[#6b705c]' : 'text-natural-alert font-extrabold'}>
                          N:{daySchedule.actualCounts.N + daySchedule.actualCounts.W}/{daySchedule.requiredCounts.N}
                        </span>
                      </div>
                    </td>
                  );
                })}
                <td className="py-2 text-center text-[10px] text-natural-muted font-medium border-l border-natural-border/40">
                  전체 근무 채움 요약
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
          근무 조율 제약 조건 검증 로그 및 일정 상태 경고
        </h3>

        {validationAlerts.length > 0 ? (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
            {validationAlerts.map((alert, idx) => {
              const isCritical = alert.includes('[금지]') || alert.includes('[심각]');
              const isAdvisory = alert.includes('[권고]');
              const isDouble = alert.includes('더블 근무');

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg flex gap-3 text-xs border ${
                    isCritical
                      ? 'bg-rose-50/50 border-rose-200 text-rose-800'
                      : isAdvisory
                      ? 'bg-amber-50/40 border-amber-200 text-amber-800'
                      : 'bg-natural-sidebar/40 border-natural-border text-natural-muted'
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isCritical ? 'text-rose-600' : isAdvisory ? 'text-amber-600' : 'text-natural-muted'}`} />
                  <div>
                    <span className="font-extrabold">{isCritical ? '[실시간 규정 위반] ' : isAdvisory ? '[근무 조건 권고] ' : '[참고 사항] '}</span>
                    {alert}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-natural-sidebar dark:bg-slate-800 border border-natural-border rounded-lg text-natural-main flex items-center gap-3 text-xs">
            <CheckCircle2 className="w-4 h-4 text-natural-sage" />
            <div>
              <span className="font-semibold text-natural-muted dark:text-slate-200">모든 근무 규정 제약 조건 완벽 충족!</span> 
              <p className="text-[11px] text-natural-muted mt-0.5">현재 활성화된 월간 근무 일정표는 병원의 금지 규칙(E-O-D, N-O-D, 야근 바로 다음날 근무 금지) 및 최대 연속 야간 근무 횟수, 연속 더블 근무 제한, 월간 개인 휴무 일수 등의 필수 요건을 모두 조율하여 안전하게 구성되었습니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
