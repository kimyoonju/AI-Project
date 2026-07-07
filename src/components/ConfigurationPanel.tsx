import React, { useState } from 'react';
import { SchedulingConfig } from '../types';
import { Sliders, Save, Calendar, ShieldCheck, HelpCircle, Coffee } from 'lucide-react';

interface ConfigurationPanelProps {
  config: SchedulingConfig;
  onSaveConfig: (config: SchedulingConfig) => void;
}

export default function ConfigurationPanel({ config, onSaveConfig }: ConfigurationPanelProps) {
  const [weekdaysD, setWeekdaysD] = useState(config.weekdaysRequirement.D);
  const [weekdaysE, setWeekdaysE] = useState(config.weekdaysRequirement.E);
  const weekdaysN = 1; // Fixed to 1 as per user request

  const [weekendsD, setWeekendsD] = useState(config.weekendsRequirement.D);
  const [weekendsE, setWeekendsE] = useState(config.weekendsRequirement.E);
  const weekendsN = 1; // Fixed to 1 as per user request

  const [maxNights, setMaxNights] = useState(config.maxConsecutiveNights);
  const [maxWorkDays, setMaxWorkDays] = useState(config.maxConsecutiveWorkDays || 5);
  const [postOffs, setPostOffs] = useState(config.postNightOffs);
  const [targetOffDays, setTargetOffDays] = useState(config.targetOffDays || 8);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      weekdaysRequirement: { D: weekdaysD, E: weekdaysE, N: 1 },
      weekendsRequirement: { D: weekendsD, E: weekendsE, N: 1 },
      maxConsecutiveNights: maxNights,
      maxConsecutiveWorkDays: maxWorkDays,
      postNightOffs: postOffs,
      targetOffDays: targetOffDays,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-natural-border p-6 shadow-sm" id="configuration-panel">
      <div className="border-b border-[#f3f1e9] pb-4 mb-6">
        <h2 className="text-lg font-medium text-natural-main dark:text-white flex items-center gap-2 font-display italic">
          <Sliders className="w-5 h-5 text-natural-clay" />
          근무 일정 규칙 및 알고리즘 설정
        </h2>
        <p className="text-xs text-natural-muted mt-1">
          일일 필요한 근무 인원 및 조율 규칙을 변경합니다. 변경 후 하단의 적용 단추를 누르면 새로운 규칙이 즉시 계산에 적용됩니다.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily staffing weekdays */}
          <div className="border border-natural-border/60 rounded-xl p-5 bg-[#fbfbfa] space-y-4">
            <h3 className="text-xs font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-natural-sage" />
              평일 필요 근무 인원 (월 - 금)
            </h3>
            <p className="text-[10px] text-natural-muted">평일 각 근무 유형별로 필요한 최소 간호사 수입니다.</p>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-natural-muted mb-1">낮 근무 (D)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={weekdaysD}
                  onChange={(e) => setWeekdaysD(Number(e.target.value))}
                  className="w-full text-sm border border-natural-border rounded p-2 bg-white text-natural-main focus:outline-none focus:ring-1 focus:ring-natural-sage/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-natural-muted mb-1">저녁 근무 (E)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={weekdaysE}
                  onChange={(e) => setWeekdaysE(Number(e.target.value))}
                  className="w-full text-sm border border-natural-border rounded p-2 bg-white text-natural-main focus:outline-none focus:ring-1 focus:ring-natural-sage/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-natural-muted mb-1">야간 근무 (N)</label>
                <input
                  type="number"
                  disabled
                  value={1}
                  className="w-full text-sm border border-natural-border rounded p-2 bg-gray-100 dark:bg-slate-800 text-natural-muted cursor-not-allowed"
                />
                <span className="text-[9px] text-natural-muted/80 mt-0.5 block">1명으로 고정됨</span>
              </div>
            </div>
          </div>

          {/* Daily staffing weekends */}
          <div className="border border-natural-border/60 rounded-xl p-5 bg-[#fbfbfa] space-y-4">
            <h3 className="text-xs font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-natural-clay" />
              주말 필요 근무 인원 (토 - 일)
            </h3>
            <p className="text-[10px] text-natural-muted">주말 각 근무 유형별로 필요한 최소 간호사 수입니다.</p>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-natural-muted mb-1">낮 근무 (D)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={weekendsD}
                  onChange={(e) => setWeekendsD(Number(e.target.value))}
                  className="w-full text-sm border border-natural-border rounded p-2 bg-white text-natural-main focus:outline-none focus:ring-1 focus:ring-natural-sage/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-natural-muted mb-1">저녁 근무 (E)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={weekendsE}
                  onChange={(e) => setWeekendsE(Number(e.target.value))}
                  className="w-full text-sm border border-natural-border rounded p-2 bg-white text-natural-main focus:outline-none focus:ring-1 focus:ring-natural-sage/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-natural-muted mb-1">야간 근무 (N)</label>
                <input
                  type="number"
                  disabled
                  value={1}
                  className="w-full text-sm border border-natural-border rounded p-2 bg-gray-100 dark:bg-slate-800 text-natural-muted cursor-not-allowed"
                />
                <span className="text-[9px] text-natural-muted/80 mt-0.5 block">1명으로 고정됨</span>
              </div>
            </div>
          </div>
        </div>

        {/* Algorithm parameters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-6">
          <div className="border border-natural-border/60 rounded-xl p-5 bg-[#fbfbfa] space-y-4">
            <h3 className="text-xs font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-natural-sage" />
              연속 야간 근무 제한
            </h3>
            <p className="text-[10px] text-natural-muted">한 간호사가 연속으로 수행 가능한 야간 근무(N) 일수를 최대치로 제한합니다.</p>
            
            <div>
              <label className="block text-xs font-semibold text-natural-main mb-2">
                최대 연속 야간 일수: <span className="font-bold text-natural-clay font-mono">{maxNights}일</span>
              </label>
              <input
                type="range"
                min={1}
                max={4}
                step={1}
                value={maxNights}
                onChange={(e) => setMaxNights(Number(e.target.value))}
                className="w-full accent-natural-clay cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-natural-muted mt-1 font-mono">
                <span>1일</span>
                <span>2일</span>
                <span>3일</span>
                <span>4일 (최대)</span>
              </div>
            </div>
          </div>

          <div className="border border-natural-border/60 rounded-xl p-5 bg-[#fbfbfa] space-y-4">
            <h3 className="text-xs font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-natural-clay" />
              최대 연속 근무 제한 (더블 포함)
            </h3>
            <p className="text-[10px] text-natural-muted">휴무(Off) 없이 연속으로 근무(D, E, N, W)할 수 있는 최대 일수를 제한합니다.</p>
            
            <div>
              <label className="block text-xs font-semibold text-natural-main mb-2">
                최대 연속 근무 일수: <span className="font-bold text-natural-clay font-mono">{maxWorkDays}일</span>
              </label>
              <input
                type="range"
                min={3}
                max={10}
                step={1}
                value={maxWorkDays}
                onChange={(e) => setMaxWorkDays(Number(e.target.value))}
                className="w-full accent-natural-clay cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-natural-muted mt-1 font-mono">
                <span>3일</span>
                <span>5일 (기본)</span>
                <span>8일</span>
                <span>10일 (최대)</span>
              </div>
            </div>
          </div>

          <div className="border border-natural-border/60 rounded-xl p-5 bg-[#fbfbfa] space-y-4">
            <h3 className="text-xs font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-natural-clay" />
              야간 휴무(Off) 보장
            </h3>
            <p className="text-[10px] text-natural-muted">연속 야간 근무를 마친 간호사에게 제공할 필수 휴무(Off) 일수를 설정합니다.</p>

            <div>
              <label className="block text-xs font-semibold text-natural-main mb-2">
                야간 근무 종료 후 보장할 휴무 일수:
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs text-natural-main cursor-pointer">
                  <input
                    type="radio"
                    name="postOffs"
                    checked={postOffs === 1}
                    onChange={() => setPostOffs(1)}
                    className="accent-natural-clay"
                  />
                  <span>1일 휴무 보장 (기본)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-natural-main cursor-pointer">
                  <input
                    type="radio"
                    name="postOffs"
                    checked={postOffs === 2}
                    onChange={() => setPostOffs(2)}
                    className="accent-natural-clay"
                  />
                  <span>2일 휴무 보장 (강력한 휴식)</span>
                </label>
              </div>
            </div>
          </div>


        </div>

        {/* Submit button */}
        <div className="flex justify-end pt-2 border-t border-natural-border/40">
          <button
            type="submit"
            className="bg-natural-sage hover:bg-natural-muted text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            설정 저장 및 적용
          </button>
        </div>
      </form>
    </div>
  );
}
