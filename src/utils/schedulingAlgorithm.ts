import { Nurse, DayRequest, SchedulingConfig, DailySchedule, DutyCode, StaffingRequirement } from '../types';

// Helper to get number of days in a month
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to check if a date is weekend
export function isWeekendDay(year: number, month: number, day: number): boolean {
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  return dayOfWeek === 0 || dayOfWeek === 6;
}

// Helper to get day of week string
export function getDayOfWeekStr(year: number, month: number, day: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(year, month, day).getDay()];
}

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateSchedule(
  nurses: Nurse[],
  requests: DayRequest[],
  config: SchedulingConfig
): { days: DailySchedule[]; validationAlerts: string[] } {
  const { year, month, weekdaysRequirement, weekendsRequirement, maxConsecutiveNights, postNightOffs } = config;
  const numDays = getDaysInMonth(year, month);
  const alerts: string[] = [];

  // Initialize history tracker: nurseId -> array of assignments (1-indexed for day)
  const history: Record<string, Record<number, DutyCode>> = {};
  nurses.forEach((n) => {
    history[n.id] = {};
  });

  // Daily schedules list
  const dailySchedules: DailySchedule[] = [];

  // Iterate day by day from 1 to numDays
  for (let d = 1; d <= numDays; d++) {
    const isWeekend = isWeekendDay(year, month, d);
    const dayOfWeek = getDayOfWeekStr(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // Get requirement for today
    const req = isWeekend ? weekendsRequirement : weekdaysRequirement;

    // Filter requests for today
    const dailyRequests = requests.filter((r) => r.day === d);

    // Initial assignments for today
    const assignments: Record<string, DutyCode> = {};
    const assignedNurses = new Set<string>();

    // 1. First, apply user requests from the interactive calendar
    dailyRequests.forEach((reqItem) => {
      // Find the nurse in current nurses list (might have been removed)
      const nurseExists = nurses.some((n) => n.id === reqItem.nurseId);
      if (nurseExists) {
        assignments[reqItem.nurseId] = reqItem.duty;
        assignedNurses.add(reqItem.nurseId);
      }
    });

    // Helper to check eligibility for an active shift
    const checkEligibility = (nurse: Nurse, shift: DutyCode): { eligible: boolean; reason?: string } => {
      // 1. Already assigned?
      if (assignedNurses.has(nurse.id)) {
        return { eligible: false, reason: 'Already assigned (Request / Scheduled)' };
      }

      // 2. Allowed duty check
      if (!nurse.allowedDuties.includes(shift)) {
        return { eligible: false, reason: `Duty "${shift}" is not in allowed duties` };
      }

      // 3. Yesterday checks (Day d-1)
      const yesterdayShift = history[nurse.id][d - 1];
      if (yesterdayShift) {
        // N-D and N-E are completely banned
        if (yesterdayShift === 'N') {
          if (shift === 'D' || shift === 'E') {
            return { eligible: false, reason: `Cannot work ${shift} directly after Night shift (N-D, N-E banned)` };
          }
        }
      }

      // 4. Forbidden patterns of length 3: E-O-D and N-O-D are banned
      if (shift === 'D') {
        const yesterday = history[nurse.id][d - 1];
        const dayBeforeYesterday = history[nurse.id][d - 2];
        if (yesterday === 'O') {
          if (dayBeforeYesterday === 'E') {
            return { eligible: false, reason: 'Forbidden pattern E-O-D detected' };
          }
          if (dayBeforeYesterday === 'N') {
            return { eligible: false, reason: 'Forbidden pattern N-O-D detected' };
          }
        }
      }

      // 5. Max consecutive night shifts control
      if (shift === 'N') {
        let consecutiveNights = 0;
        for (let k = d - 1; k >= 1; k--) {
          if (history[nurse.id][k] === 'N') {
            consecutiveNights++;
          } else {
            break;
          }
        }
        if (consecutiveNights >= maxConsecutiveNights) {
          return { eligible: false, reason: `Exceeds max consecutive night shifts (${maxConsecutiveNights})` };
        }
      }

      // 6. Post-Night Off Control:
      // If a nurse completed consecutive Night shifts (meaning they did a block of nights and transitioned),
      // they must get postNightOffs (1 or 2) off days immediately after.
      // To find the last night shift block:
      let lastNightDay = -1;
      for (let k = d - 1; k >= 1; k--) {
        if (history[nurse.id][k] === 'N') {
          lastNightDay = k;
          break;
        }
      }

      if (lastNightDay !== -1) {
        // Find if they worked N after lastNightDay (no, since it's the most recent)
        // Let's see if they have completed the rest period starting from lastNightDay + 1.
        // The rest period should have length `postNightOffs`.
        // If the current day is within this rest period, they MUST be Off.
        // Let's verify how many days of Off they have had since their last Night shift.
        let offDaysCount = 0;
        let isResting = true;
        for (let k = lastNightDay + 1; k < d; k++) {
          if (history[nurse.id][k] === 'O') {
            offDaysCount++;
          } else if (history[nurse.id][k] === 'N') {
            // They worked N, reset (but lastNightDay is most recent, so this shouldn't happen)
          } else {
            // Worked something else (D, E, W), so rest was interrupted
            isResting = false;
            break;
          }
        }

        if (isResting && offDaysCount < postNightOffs) {
          // They are still in their mandatory post-night off rest period!
          return { eligible: false, reason: `Mandatory post-night off rest period (${offDaysCount}/${postNightOffs} days completed)` };
        }
      }

      return { eligible: true };
    };

    // Calculate current counts from pre-assignments (requests)
    const currentCounts = { D: 0, E: 0, N: 0, O: 0, W: 0 };
    Object.keys(assignments).forEach((nurseId) => {
      const code = assignments[nurseId];
      currentCounts[code]++;
    });

    // Remainder requirements
    let remD = Math.max(0, req.D - currentCounts.D);
    let remE = Math.max(0, req.E - currentCounts.E);
    let remN = Math.max(0, req.N - currentCounts.N);

    // List of active shifts to schedule
    const shiftsToSchedule: { code: DutyCode; remaining: number }[] = [
      { code: 'N', remaining: remN }, // Schedule Night first as it is highly constrained
      { code: 'E', remaining: remE },
      { code: 'D', remaining: remD },
    ];

    // Track original assignment (before W upgrades)
    const initialDayAssignments = { ...assignments };

    // Schedule each shift
    shiftsToSchedule.forEach((shiftObj) => {
      let remaining = shiftObj.remaining;
      const shift = shiftObj.code;

      // Find eligible nurses
      let eligibleNurses = nurses.filter((n) => checkEligibility(n, shift).eligible);
      // Shuffle them to ensure randomized schedule every time "Regenerate" is run
      eligibleNurses = shuffleArray(eligibleNurses);

      while (remaining > 0 && eligibleNurses.length > 0) {
        const selectedNurse = eligibleNurses.pop()!;
        assignments[selectedNurse.id] = shift;
        assignedNurses.add(selectedNurse.id);
        remaining--;
      }

      // If we still have remaining, we have a deficit! Let's flag this and we will apply Double Shift fallback
      shiftObj.remaining = remaining;
    });

    // 2. Double Shift Fallback Logic (Crucial)
    // If there is still a remaining deficit in Day, Evening, or Night shifts:
    let doubleShiftAssignedToday = false;

    shiftsToSchedule.forEach((shiftObj) => {
      let remaining = shiftObj.remaining;
      const shift = shiftObj.code;

      if (remaining > 0) {
        // We need to find a nurse to upgrade to Double Shift "W" to cover the gap.
        // A single nurse cannot have two consecutive Double Shifts (W-W is completely banned).
        // Forbidden patterns must still be respected.
        // Who is eligible for "W" fallback today?
        // Let's look for:
        // A) Nurses who are already assigned to an active shift today (D, E, N) and can do a double shift
        // B) Nurses who are currently unassigned (Off) but are allowed to work and can do W
        // They must NOT have worked W yesterday (d-1), and must be eligible for this deficit shift.
        
        // Find candidate nurses
        let candidates = nurses.filter((nurse) => {
          // 1. Cannot have requested Off 'O' today
          const requestToday = dailyRequests.find((r) => r.nurseId === nurse.id);
          if (requestToday && requestToday.duty === 'O') {
            return false;
          }

          // 2. W-W is completely banned (cannot work W if yesterday was W)
          const yesterdayShift = history[nurse.id][d - 1];
          if (yesterdayShift === 'W') {
            return false;
          }

          // 3. Must be eligible for this deficit shift
          // To be eligible, we temporarily bypass the "Already assigned" check to see if they satisfy other constraints
          const prevAssigned = assignedNurses.has(nurse.id);
          if (prevAssigned) {
            assignedNurses.delete(nurse.id); // temporarily remove to check eligibility
          }
          const eligibility = checkEligibility(nurse, shift);
          if (prevAssigned) {
            assignedNurses.add(nurse.id); // restore
          }

          if (!eligibility.eligible) {
            return false;
          }

          // 4. Must be allowed to work this shift according to their preferences
          if (!nurse.allowedDuties.includes(shift)) {
            return false;
          }

          return true;
        });

        // Sort candidates:
        // Prioritize nurses who are ALREADY working another shift today (they can upgrade to a Double Shift W),
        // or prioritize higher competency nurses, etc. Let's shuffle them to keep it randomized.
        candidates = shuffleArray(candidates);

        while (remaining > 0 && candidates.length > 0) {
          const candidate = candidates.pop()!;
          const currentAssignment = assignments[candidate.id];

          // Set assignment to Double Shift W
          assignments[candidate.id] = 'W';
          assignedNurses.add(candidate.id);
          doubleShiftAssignedToday = true;
          remaining--;

          // Create an alert to notify that a Double Shift was assigned
          alerts.push(
            `Day ${d}: ${candidate.name} assigned a Double Shift (W) to cover missing ${shift} shift.`
          );
        }

        // If we still can't cover it:
        if (remaining > 0) {
          alerts.push(
            `Day ${d}: CRITICAL STAFFING SHORTAGE! Unable to cover ${remaining} required ${shift} shift(s).`
          );
        }
      }
    });

    // 3. Assign remaining unassigned nurses to Off (O)
    nurses.forEach((nurse) => {
      if (!assignedNurses.has(nurse.id)) {
        assignments[nurse.id] = 'O';
      }
    });

    // Save assignments to history
    nurses.forEach((nurse) => {
      history[nurse.id][d] = assignments[nurse.id];
    });

    // Recalculate actual counts for this day
    const actualCounts = { D: 0, E: 0, N: 0, O: 0, W: 0 };
    Object.keys(assignments).forEach((nurseId) => {
      const code = assignments[nurseId];
      actualCounts[code]++;
    });

    // Determine if staffing requirements are met
    // A Double Shift 'W' covers multiple gaps. For calculation of whether requirements are met,
    // let's count W as helping to fulfill the active requirements.
    // If a nurse is assigned W, it can count towards both the original assigned shift or the deficit shift.
    // Let's assume any 'W' assignment helps fulfill the requirements.
    // Specifically:
    // Net Scheduled Day = counts of D + counts of W (if they were upgraded to cover a Day shift deficit)
    // To be precise, let's say the requirement is met if the sum of actual shifts + double shifts covers the requirement.
    // Let's calculate:
    const activeStaff = Object.values(assignments).filter(c => c !== 'O');
    const requirementsMet = {
      D: actualCounts.D + actualCounts.W >= req.D,
      E: actualCounts.E + actualCounts.W >= req.E,
      N: actualCounts.N + actualCounts.W >= req.N,
    };

    dailySchedules.push({
      day: d,
      dateStr,
      dayOfWeek,
      isWeekend,
      assignments,
      requirementsMet,
      requiredCounts: req,
      actualCounts,
      doubleShiftAssigned: doubleShiftAssignedToday,
    });
  }

  // Final Validation Alert Checks
  // Let's check for any rule violations in the generated schedule to warn the manager!
  nurses.forEach((nurse) => {
    for (let d = 1; d <= numDays; d++) {
      const shift = history[nurse.id][d];
      
      // 1. W-W check
      if (shift === 'W' && history[nurse.id][d - 1] === 'W') {
        alerts.push(`Day ${d}: ${nurse.name} has consecutive Double Shifts (W-W), which is strictly banned!`);
      }

      // 2. N-D or N-E check
      if (history[nurse.id][d - 1] === 'N') {
        if (shift === 'D' || shift === 'E') {
          alerts.push(`Day ${d}: ${nurse.name} is assigned ${shift} immediately after a Night shift, which is banned!`);
        }
      }

      // 3. E-O-D and N-O-D check
      if (shift === 'D' && history[nurse.id][d - 1] === 'O') {
        if (history[nurse.id][d - 2] === 'E') {
          alerts.push(`Day ${d}: Forbidden pattern E-O-D detected for ${nurse.name}.`);
        }
        if (history[nurse.id][d - 2] === 'N') {
          alerts.push(`Day ${d}: Forbidden pattern N-O-D detected for ${nurse.name}.`);
        }
      }

      // 4. Max consecutive night shifts check
      if (shift === 'N') {
        let consecutiveNights = 1;
        for (let k = d - 1; k >= 1; k--) {
          if (history[nurse.id][k] === 'N') {
            consecutiveNights++;
          } else {
            break;
          }
        }
        if (consecutiveNights > maxConsecutiveNights) {
          alerts.push(`Day ${d}: ${nurse.name} has exceeded ${maxConsecutiveNights} consecutive Night shifts (actual: ${consecutiveNights}).`);
        }
      }
    }
  });

  return {
    days: dailySchedules,
    validationAlerts: Array.from(new Set(alerts)), // Deduplicate alerts
  };
}
