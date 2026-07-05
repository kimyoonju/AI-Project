import React, { useState } from 'react';
import { Nurse, DutyCode, DUTIES } from '../types';
import { UserPlus, Trash2, Award, CheckSquare, Square, ShieldCheck } from 'lucide-react';

interface NurseManagementProps {
  nurses: Nurse[];
  onAddNurse: (nurse: Omit<Nurse, 'id'>) => void;
  onRemoveNurse: (id: string) => void;
  onToggleDuty: (id: string, duty: DutyCode) => void;
  onUpdateCompetency: (id: string, competency: number) => void;
}

export default function NurseManagement({
  nurses,
  onAddNurse,
  onRemoveNurse,
  onToggleDuty,
  onUpdateCompetency,
}: NurseManagementProps) {
  const [newNurseName, setNewNurseName] = useState('');
  const [newCompetency, setNewCompetency] = useState(3);
  const [newDuties, setNewDuties] = useState<DutyCode[]>(['D', 'E', 'N']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNurseName.trim()) return;

    onAddNurse({
      name: newNurseName.trim(),
      competency: newCompetency,
      allowedDuties: [...newDuties],
    });

    setNewNurseName('');
    setNewCompetency(3);
    setNewDuties(['D', 'E', 'N']);
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
          Add New Nurse Staff
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-natural-muted mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={newNurseName}
              onChange={(e) => setNewNurseName(e.target.value)}
              placeholder="e.g. John Doe, RN"
              className="w-full text-sm border border-natural-border rounded-lg p-2.5 bg-[#fbfbfa] text-natural-main focus:outline-none focus:ring-2 focus:ring-natural-sage/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-natural-muted mb-1">
              Competency Level (1 - 6)
            </label>
            <select
              value={newCompetency}
              onChange={(e) => setNewCompetency(Number(e.target.value))}
              className="w-full text-sm border border-natural-border rounded-lg p-2.5 bg-[#fbfbfa] text-natural-main focus:outline-none focus:ring-2 focus:ring-natural-sage/50 cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <option key={level} value={level}>
                  Level {level} {level >= 5 ? '(Senior / Lead)' : level <= 2 ? '(Junior / Trainee)' : '(Mid-Level)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-natural-muted mb-1">
              Allowed Shifts
            </label>
            <div className="flex gap-3 p-2 border border-natural-border rounded-lg bg-[#fbfbfa]">
              {(['D', 'E', 'N'] as DutyCode[]).map((duty) => (
                <button
                  type="button"
                  key={duty}
                  onClick={() => handleToggleNewDuty(duty)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                    newDuties.includes(duty)
                      ? 'bg-natural-sidebar text-natural-main border border-natural-border/60'
                      : 'text-natural-muted hover:bg-natural-sidebar/50'
                  }`}
                >
                  {duty === 'D' ? 'Day' : duty === 'E' ? 'Evening' : 'Night'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-natural-sage hover:bg-natural-muted text-white font-medium py-2.5 px-4 rounded-lg text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff
          </button>
        </form>
      </div>

      {/* Roster Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-natural-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#f3f1e9] dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-natural-main dark:text-white flex items-center gap-2 font-display italic">
              <ShieldCheck className="w-5 h-5 text-natural-sage" />
              Active Nurse Roster
            </h2>
            <p className="text-xs text-natural-muted mt-1">
              Manage competencies, shift restrictions, and delete staff entries.
            </p>
          </div>
          <span className="text-xs font-medium bg-natural-sidebar text-natural-main px-3 py-1 rounded-full border border-natural-border/30">
            Total Roster Size: {nurses.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fcfcfa] border-b border-natural-border/55">
                <th className="py-3 px-6 text-xs font-semibold text-natural-muted uppercase tracking-wider">Nurse Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-natural-muted uppercase tracking-wider">Competency Level</th>
                <th className="py-3 px-6 text-xs font-semibold text-natural-muted uppercase tracking-wider">Allowed Shift Duties</th>
                <th className="py-3 px-6 text-xs font-semibold text-natural-muted uppercase tracking-wider text-right">Actions</th>
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
                        className="text-xs border border-natural-border rounded bg-white px-2.5 py-1 text-natural-main focus:outline-none focus:ring-1 focus:ring-natural-sage cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6].map((lvl) => (
                          <option key={lvl} value={lvl}>Level {lvl}</option>
                        ))}
                      </select>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Award
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < nurse.competency ? 'text-natural-clay fill-natural-clay' : 'text-[#e0ded6]'
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
                                ? 'bg-[#eeece1] border-natural-border text-natural-main'
                                : 'bg-transparent border-dashed border-natural-border text-natural-muted/50'
                            }`}
                          >
                            {isAllowed ? (
                              <CheckSquare className="w-3.5 h-3.5 text-natural-clay" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-natural-muted/30" />
                            )}
                            {duty === 'D' ? 'Day' : duty === 'E' ? 'Evening' : 'Night'}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onRemoveNurse(nurse.id)}
                      className="text-natural-muted hover:text-natural-alert transition p-1.5 hover:bg-natural-sidebar/40 rounded-lg inline-flex items-center cursor-pointer"
                      title="Remove Staff"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {nurses.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-natural-muted text-sm">
                    No nurses in the roster. Add some staff to get started.
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
