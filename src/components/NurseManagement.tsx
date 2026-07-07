import React, { useState, useEffect } from 'react';
import { Nurse, DutyCode, DUTIES } from '../types';
import { UserPlus, Trash2, Award, CheckSquare, Square, ShieldCheck } from 'lucide-react';

interface NurseManagementProps {
  nurses: Nurse[];
  onAddNurse: (nurse: Omit<Nurse, 'id'>) => void;
  onRemoveNurse: (id: string) => void;
  onToggleDuty: (id: string, duty: DutyCode) => void;
  onUpdateCompetency: (id: string, competency: number) => void;
  onUpdateOffDays: (id: string, minOff: number, maxOff: number) => void;
  defaultTargetOffDays: number;
}

export default function NurseManagement({
  nurses,
  onAddNurse,
  onRemoveNurse,
  onToggleDuty,
  onUpdateCompetency,
  onUpdateOffDays,
  defaultTargetOffDays,
}: NurseManagementProps) {
  const [newNurseName, setNewNurseName] = useState('');
  const [newCompetency, setNewCompetency] = useState(2);
  const [newDuties, setNewDuties] = useState<DutyCode[]>(['D', 'E', 'N']);
  const [newMinOff, setNewMinOff] = useState<number>(defaultTargetOffDays);
  const [newMaxOff, setNewMaxOff] = useState<number>(defaultTargetOffDays + 2);

  useEffect(() => {
    setNewMinOff(defaultTargetOffDays);
    setNewMaxOff(defaultTargetOffDays + 2);
  }, [defaultTargetOffDays]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNurseName.trim()) return;

    onAddNurse({
      name: newNurseName.trim(),
      competency: newCompetency,
      allowedDuties: [...newDuties],
      minOffDays: newMinOff,
      maxOffDays: newMaxOff,
    });

    setNewNurseName('');
    setNewCompetency(2);
    setNewDuties(['D', 'E', 'N']);
    setNewMinOff(defaultTargetOffDays);
    setNewMaxOff(defaultTargetOffDays + 2);
  };

  const handleToggleNewDuty = (duty: DutyCode) => {
    if (newDuties.includes(duty)) {
      setNewDuties(newDuties.filter((d) => d !== duty));
    } else {
      setNewDuties([...newDuties, duty]);
    }
  };

  return (
    <div className="space-y-6" id="nurse-management-container">
      {/* Add Nurse Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-natural-border p-6 shadow-sm">
        <h2 className="text-lg font-medium text-natural-main dark:text-white flex items-center gap-2 mb-4 font-display italic">
          <UserPlus className="w-5 h-5 text-natural-clay" />
          신규 간호사 추가
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-natural-muted mb-1">
                성명 (직책)
              </label>
              <input
                type="text"
                required
                value={newNurseName}
                onChange={(e) => setNewNurseName(e.target.value)}
                placeholder="예: 김선아 RN"
                className="w-full text-sm border border-natural-border rounded-lg p-2.5 bg-[#fbfbfa] dark:bg-slate-800 text-natural-main dark:text-white focus:outline-none focus:ring-2 focus:ring-natural-sage/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-natural-muted mb-1">
                숙련 등급 (1 - 3)
              </label>
              <select
                value={newCompetency}
                onChange={(e) => setNewCompetency(Number(e.target.value))}
                className="w-full text-sm border border-natural-border rounded-lg p-2.5 bg-[#fbfbfa] dark:bg-slate-800 text-natural-main dark:text-white focus:outline-none focus:ring-2 focus:ring-natural-sage/50 cursor-pointer"
              >
                {[1, 2, 3].map((level) => (
                  <option key={level} value={level}>
                    등급 {level} {level === 3 ? '(시니어 / 차지)' : level === 1 ? '(주니어 / 수습)' : '(일반 미드레벨)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-natural-muted mb-1">
                배정 가능 근무
              </label>
              <div className="flex gap-3 p-2 border border-natural-border rounded-lg bg-[#fbfbfa] dark:bg-slate-800 h-[42px] items-center">
                {(['D', 'E', 'N'] as DutyCode[]).map((duty) => (
                  <button
                    type="button"
                    key={duty}
                    onClick={() => handleToggleNewDuty(duty)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      newDuties.includes(duty)
                        ? 'bg-natural-sidebar dark:bg-slate-700 text-natural-main dark:text-white border border-natural-border/60'
                        : 'text-natural-muted dark:text-slate-400 hover:bg-natural-sidebar/50'
                    }`}
                  >
                    {duty === 'D' ? '낮' : duty === 'E' ? '저녁' : '야간'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-natural-muted mb-1">
                월간 필수 최소 휴무 (Min Off)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="31"
                  required
                  value={newMinOff}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNewMinOff(val);
                    if (newMaxOff < val) {
                      setNewMaxOff(val);
                    }
                  }}
                  className="w-full text-sm border border-natural-border rounded-lg p-2.5 bg-[#fbfbfa] dark:bg-slate-800 text-natural-main dark:text-white focus:outline-none focus:ring-2 focus:ring-natural-sage/50"
                />
                <span className="text-sm font-semibold text-natural-muted">일</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-natural-muted mb-1">
                월간 필수 최대 휴무 (Max Off)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="31"
                  required
                  value={newMaxOff}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNewMaxOff(Math.max(val, newMinOff));
                  }}
                  className="w-full text-sm border border-natural-border rounded-lg p-2.5 bg-[#fbfbfa] dark:bg-slate-800 text-natural-main dark:text-white focus:outline-none focus:ring-2 focus:ring-natural-sage/50"
                />
                <span className="text-sm font-semibold text-natural-muted">일</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-natural-sage hover:bg-natural-muted text-white font-semibold h-[42px] rounded-lg text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              간호사 등록
            </button>
          </div>
        </form>
      </div>

      {/* Roster Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-natural-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#f3f1e9] dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-natural-main dark:text-white flex items-center gap-2 font-display italic">
              <ShieldCheck className="w-5 h-5 text-natural-sage" />
              등록된 간호사 명단
            </h2>
            <p className="text-xs text-natural-muted mt-1">
              각 간호사의 숙련 등급 변경, 근무 조 허용 범위를 실시간으로 조정하거나 명단에서 제외합니다.
            </p>
          </div>
          <span className="text-xs font-medium bg-natural-sidebar dark:bg-slate-800 text-natural-main dark:text-slate-200 px-3 py-1 rounded-full border border-natural-border/30">
            전체 간호사 수: {nurses.length}명
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fcfcfa] dark:bg-slate-800/40 border-b border-natural-border/55">
                <th className="py-3 px-6 text-xs font-semibold text-natural-muted uppercase tracking-wider">간호사 성명</th>
                <th className="py-3 px-6 text-xs font-semibold text-natural-muted uppercase tracking-wider">숙련 등급 (1 - 3)</th>
                <th className="py-3 px-6 text-xs font-semibold text-natural-muted uppercase tracking-wider">배정 가능 근무 유형</th>
                <th className="py-3 px-6 text-xs font-semibold text-natural-muted uppercase tracking-wider">월간 필수 휴무 범위 (Min ~ Max)</th>
                <th className="py-3 px-6 text-xs font-semibold text-natural-muted uppercase tracking-wider text-right">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-natural-border/40">
              {nurses.map((nurse) => (
                <tr key={nurse.id} className="hover:bg-natural-sidebar/20 transition">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-natural-main dark:text-white">{nurse.name}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <select
                        value={nurse.competency}
                        onChange={(e) => onUpdateCompetency(nurse.id, Number(e.target.value))}
                        className="text-xs border border-natural-border rounded bg-white dark:bg-slate-800 px-2.5 py-1 text-natural-main dark:text-white focus:outline-none focus:ring-1 focus:ring-natural-sage cursor-pointer"
                      >
                        {[1, 2, 3].map((lvl) => (
                          <option key={lvl} value={lvl}>등급 {lvl}</option>
                        ))}
                      </select>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Award
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < nurse.competency ? 'text-natural-clay fill-natural-clay' : 'text-[#e0ded6] dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      {(['D', 'E', 'N'] as DutyCode[]).map((duty) => {
                        const isAllowed = nurse.allowedDuties.includes(duty);
                        return (
                          <button
                            key={duty}
                            onClick={() => onToggleDuty(nurse.id, duty)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition cursor-pointer ${
                              isAllowed
                                ? 'bg-[#eeece1] dark:bg-slate-700 border-natural-border text-natural-main dark:text-white'
                                : 'bg-transparent border-dashed border-natural-border text-natural-muted/50 dark:text-slate-500'
                            }`}
                          >
                            {isAllowed ? (
                              <CheckSquare className="w-3.5 h-3.5 text-natural-clay" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-natural-muted/30 dark:text-slate-600" />
                            )}
                            {duty === 'D' ? '낮' : duty === 'E' ? '저녁' : '야간'}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-natural-muted font-medium">최소</span>
                        <input
                          type="number"
                          min="0"
                          max="31"
                          value={nurse.minOffDays !== undefined ? nurse.minOffDays : defaultTargetOffDays}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const currentMax = nurse.maxOffDays !== undefined ? nurse.maxOffDays : defaultTargetOffDays;
                            const newMax = currentMax < val ? val : currentMax;
                            onUpdateOffDays(nurse.id, val, newMax);
                          }}
                          className="w-14 text-center text-xs border border-natural-border rounded bg-white dark:bg-slate-800 px-1 py-1 text-natural-main dark:text-white focus:outline-none focus:ring-1 focus:ring-natural-sage"
                        />
                        <span className="text-xs text-natural-muted">일</span>
                      </div>
                      <span className="text-natural-muted mx-1">~</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-natural-muted font-medium">최대</span>
                        <input
                          type="number"
                          min="0"
                          max="31"
                          value={nurse.maxOffDays !== undefined ? nurse.maxOffDays : defaultTargetOffDays}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const currentMin = nurse.minOffDays !== undefined ? nurse.minOffDays : defaultTargetOffDays;
                            const newMin = val < currentMin ? val : currentMin;
                            onUpdateOffDays(nurse.id, newMin, val);
                          }}
                          className="w-14 text-center text-xs border border-natural-border rounded bg-white dark:bg-slate-800 px-1 py-1 text-natural-main dark:text-white focus:outline-none focus:ring-1 focus:ring-natural-sage"
                        />
                        <span className="text-xs text-natural-muted">일</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onRemoveNurse(nurse.id)}
                      className="text-natural-muted hover:text-natural-alert transition p-1.5 hover:bg-natural-sidebar/40 rounded-lg inline-flex items-center cursor-pointer"
                      title="명단에서 제외"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {nurses.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-natural-muted text-sm">
                    명단에 간호사가 없습니다. 새로운 근무 인원을 추가해 보세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
