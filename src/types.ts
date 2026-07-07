export type DutyCode = 'D' | 'E' | 'N' | 'O' | 'W';

export interface DutyInfo {
  code: DutyCode;
  name: string;
  color: string; // Tailwind class
  textColor: string; // Tailwind text color class
}

export const DUTIES: Record<DutyCode, DutyInfo> = {
  D: { code: 'D', name: '낮 근무 (D)', color: 'bg-white border-natural-border', textColor: 'text-natural-main' },
  E: { code: 'E', name: '저녁 근무 (E)', color: 'bg-[#f0e6d2] border-[#e5d9c2]', textColor: 'text-[#8d6e63]' },
  N: { code: 'N', name: '야간 근무 (N)', color: 'bg-[#dbe1e3] border-[#ccd4d6]', textColor: 'text-[#37474f]' },
  O: { code: 'O', name: '휴무 (O)', color: 'bg-transparent border-dashed border-natural-border/60', textColor: 'text-natural-muted/70' },
  W: { code: 'W', name: '더블 근무 (D/E)', color: 'bg-natural-alert border-transparent shadow-[0_0_10px_rgba(224,122,95,0.3)] animate-pulse', textColor: 'text-white font-bold' },
};

export interface Nurse {
  id: string;
  name: string;
  competency: number; // 1 to 3
  allowedDuties: DutyCode[]; // Toggles which shifts this nurse can perform
  minOffDays?: number; // Minimum off days per month
  maxOffDays?: number; // Maximum off days per month
}

export interface DayRequest {
  id: string;
  nurseId: string;
  nurseName: string;
  duty: DutyCode;
  day: number; // 1 to 31 depending on month
}

export interface StaffingRequirement {
  D: number; // Day requirements
  E: number; // Evening requirements
  N: number; // Night requirements
}

export interface SchedulingConfig {
  year: number;
  month: number; // 0-indexed (0 = January)
  weekdaysRequirement: StaffingRequirement;
  weekendsRequirement: StaffingRequirement;
  maxConsecutiveNights: number; // 1 to 4
  maxConsecutiveWorkDays: number; // Max consecutive days working (including double shifts)
  postNightOffs: number; // 1 or 2
  targetOffDays: number; // Target off days per nurse per month
}

export interface DailySchedule {
  day: number;
  dateStr: string;
  dayOfWeek: string; // "Mon", "Tue", etc.
  isWeekend: boolean;
  assignments: Record<string, DutyCode>; // nurseId -> DutyCode
  requirementsMet: {
    D: boolean;
    E: boolean;
    N: boolean;
  };
  requiredCounts: StaffingRequirement;
  actualCounts: Record<DutyCode, number>;
  doubleShiftAssigned: boolean;
}

export interface ScheduleResult {
  days: DailySchedule[];
  validationAlerts: string[];
}
