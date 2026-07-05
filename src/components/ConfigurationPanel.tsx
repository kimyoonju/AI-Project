import React, { useState } from 'react';
import { SchedulingConfig, StaffingRequirement } from '../types';
import { Sliders, Save, Calendar, ShieldCheck, HelpCircle } from 'lucide-react';

interface ConfigurationPanelProps {
  config: SchedulingConfig;
  onSaveConfig: (config: SchedulingConfig) => void;
}

export default function ConfigurationPanel({ config, onSaveConfig }: ConfigurationPanelProps) {
  const [weekdaysD, setWeekdaysD] = useState(config.weekdaysRequirement.D);
  const [weekdaysE, setWeekdaysE] = useState(config.weekdaysRequirement.E);
  const [weekdaysN, setWeekdaysN] = useState(config.weekdaysRequirement.N);

  const [weekendsD, setWeekendsD] = useState(config.weekendsRequirement.D);
  const [weekendsE, setWeekendsE] = useState(config.weekendsRequirement.E);
  const [weekendsN, setWeekendsN] = useState(config.weekendsRequirement.N);

  const [maxNights, setMaxNights] = useState(config.maxConsecutiveNights);
  const [postOffs, setPostOffs] = useState(config.postNightOffs);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      weekdaysRequirement: { D: weekdaysD, E: weekdaysE, N: weekdaysN },
      weekendsRequirement: { D: weekendsD, E: weekendsE, N: weekendsN },
      maxConsecutiveNights: maxNights,
      postNightOffs: postOffs,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-natural-border p-6 shadow-sm" id="configuration-panel">
      <div className="border-b border-[#f3f1e9] pb-4 mb-6">
        <h2 className="text-lg font-medium text-natural-main dark:text-white flex items-center gap-2 font-display italic">
          <Sliders className="w-5 h-5 text-natural-clay" />
          Scheduling Rules & Algorithm Configurations
        </h2>
        <p className="text-xs text-natural-muted mt-1">
          Adjust daily requirements and employee rules. The scheduling algorithm immediately adapts to your constraints.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily staffing weekdays */}
          <div className="border border-natural-border/60 rounded-xl p-5 bg-[#fbfbfa] space-y-4">
            <h3 className="text-xs font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-natural-sage" />
              Weekday Staffing Requirements (Mon - Fri)
            </h3>
            <p className="text-[10px] text-natural-muted">Specify how many nurses are required per shift type on weekdays.</p>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-natural-muted mb-1">Day Shift (D)</label>
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
                <label className="block text-[10px] font-semibold text-natural-muted mb-1">Evening (E)</label>
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
                <label className="block text-[10px] font-semibold text-natural-muted mb-1">Night (N)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={weekdaysN}
                  onChange={(e) => setWeekdaysN(Number(e.target.value))}
                  className="w-full text-sm border border-natural-border rounded p-2 bg-white text-natural-main focus:outline-none focus:ring-1 focus:ring-natural-sage/50"
                />
              </div>
            </div>
          </div>

          {/* Daily staffing weekends */}
          <div className="border border-natural-border/60 rounded-xl p-5 bg-[#fbfbfa] space-y-4">
            <h3 className="text-xs font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-natural-clay" />
              Weekend Staffing Requirements (Sat - Sun)
            </h3>
            <p className="text-[10px] text-natural-muted">Specify how many nurses are required per shift type on weekends.</p>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-natural-muted mb-1">Day Shift (D)</label>
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
                <label className="block text-[10px] font-semibold text-natural-muted mb-1">Evening (E)</label>
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
                <label className="block text-[10px] font-semibold text-natural-muted mb-1">Night (N)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={weekendsN}
                  onChange={(e) => setWeekendsN(Number(e.target.value))}
                  className="w-full text-sm border border-natural-border rounded p-2 bg-white text-natural-main focus:outline-none focus:ring-1 focus:ring-natural-sage/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Algorithm parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-natural-border/60 rounded-xl p-5 bg-[#fbfbfa] space-y-4">
            <h3 className="text-xs font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-natural-sage" />
              Consecutive Night Shift Control
            </h3>
            <p className="text-[10px] text-natural-muted">Limit the number of consecutive Night (N) shifts allowed per nurse.</p>
            
            <div>
              <label className="block text-xs font-semibold text-natural-main mb-2">
                Max Consecutive Nights: <span className="font-bold text-natural-clay font-mono">{maxNights}</span>
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
                <span>1 night</span>
                <span>2 nights</span>
                <span>3 nights</span>
                <span>4 nights (Limit)</span>
              </div>
            </div>
          </div>

          <div className="border border-natural-border/60 rounded-xl p-5 bg-[#fbfbfa] space-y-4">
            <h3 className="text-xs font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-natural-clay" />
              Post-Night Off Rest Control
            </h3>
            <p className="text-[10px] text-natural-muted">Determine how many mandatory rest (Off) days a nurse gets after finishing consecutive Nights.</p>

            <div>
              <label className="block text-xs font-semibold text-natural-main mb-2">
                Required rest days after completing Night block:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-natural-main cursor-pointer">
                  <input
                    type="radio"
                    name="postOffs"
                    checked={postOffs === 1}
                    onChange={() => setPostOffs(1)}
                    className="accent-natural-clay"
                  />
                  <span>1 Off Day (Standard)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-natural-main cursor-pointer">
                  <input
                    type="radio"
                    name="postOffs"
                    checked={postOffs === 2}
                    onChange={() => setPostOffs(2)}
                    className="accent-natural-clay"
                  />
                  <span>2 Off Days (Hard Rest)</span>
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
            Apply Settings & Save
          </button>
        </div>
      </form>
    </div>
  );
}
