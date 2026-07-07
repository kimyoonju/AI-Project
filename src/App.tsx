/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Users,
  Sliders,
  CalendarCheck,
  RefreshCw,
  Download,
  Upload,
  Moon,
  Sun,
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
  Import,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { Nurse, DayRequest, SchedulingConfig, DailySchedule, DutyCode } from './types';
import { generateSchedule, validateSchedule, recalculateDayStats } from './utils/schedulingAlgorithm';
import NurseManagement from './components/NurseManagement';
import RequestCalendar from './components/RequestCalendar';
import ScheduleGrid from './components/ScheduleGrid';
import ConfigurationPanel from './components/ConfigurationPanel';

// Default mock data to populate first-time load beautifully
const DEFAULT_NURSES: Nurse[] = [
  { id: 'n1', name: '윤상분 RN', competency: 3, allowedDuties: ['D', 'E', 'N'], minOffDays: 8, maxOffDays: 10 },
  { id: 'n2', name: '백민숙 RN', competency: 3, allowedDuties: ['D', 'E', 'N'], minOffDays: 8, maxOffDays: 10 },
  { id: 'n3', name: '구서진 RN', competency: 3, allowedDuties: ['N'], minOffDays: 8, maxOffDays: 12 }, // Night shift only!
  { id: 'n4', name: '남윤후 RN', competency: 3, allowedDuties: ['D', 'E', 'N'], minOffDays: 8, maxOffDays: 10 },
  { id: 'n5', name: '오성숙 RN', competency: 3, allowedDuties: ['D', 'E', 'N'], minOffDays: 8, maxOffDays: 10 },
];

const DEFAULT_REQUESTS: DayRequest[] = [
  { id: 'req1', nurseId: 'n3', nurseName: '구서진 RN', duty: 'O', day: 5 },
  { id: 'req2', nurseId: 'n1', nurseName: '윤상분 RN', duty: 'O', day: 12 },
  { id: 'req3', nurseId: 'n2', nurseName: '백민숙 RN', duty: 'O', day: 19 },
  { id: 'req4', nurseId: 'n4', nurseName: '남윤후 RN', duty: 'O', day: 2 },
  { id: 'req5', nurseId: 'n5', nurseName: '오성숙 RN', duty: 'D', day: 15 },
];

const DEFAULT_CONFIG: SchedulingConfig = {
  year: 2026,
  month: 6, // July (0-indexed: 6 = July)
  weekdaysRequirement: { D: 1, E: 1, N: 1 }, // Adjusted for 5 nurses
  weekendsRequirement: { D: 1, E: 1, N: 1 },
  maxConsecutiveNights: 3,
  maxConsecutiveWorkDays: 5,
  postNightOffs: 1,
  targetOffDays: 8,
};

export default function App() {
  // 1. Core States loaded from LocalStorage (with auto-migration for legacy defaults)
  const [nurses, setNurses] = useState<Nurse[]>(() => {
    const saved = localStorage.getItem('nurse_scheduler_nurses');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate legacy defaults
      if (parsed.some((n: Nurse) => n.name.includes('구서진 RN(night)') || n.name.includes('김민준') || n.competency < 3)) {
        localStorage.setItem('nurse_scheduler_nurses', JSON.stringify(DEFAULT_NURSES));
        return DEFAULT_NURSES;
      }
      return parsed;
    }
    return DEFAULT_NURSES;
  });

  const [requests, setRequests] = useState<DayRequest[]>(() => {
    const saved = localStorage.getItem('nurse_scheduler_requests');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate legacy defaults
      if (parsed.some((r: DayRequest) => r.nurseName.includes('구서진 RN(night)') || r.nurseName.includes('이동현') || r.nurseName.includes('김민준'))) {
        localStorage.setItem('nurse_scheduler_requests', JSON.stringify(DEFAULT_REQUESTS));
        return DEFAULT_REQUESTS;
      }
      return parsed;
    }
    return DEFAULT_REQUESTS;
  });

  const [config, setConfig] = useState<SchedulingConfig>(() => {
    const saved = localStorage.getItem('nurse_scheduler_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate legacy defaults
      if (!parsed.maxConsecutiveWorkDays || (parsed.weekdaysRequirement && parsed.weekdaysRequirement.D > 1 && nurses.length <= 5)) {
        const migratedConfig = { ...parsed, weekdaysRequirement: { D: 1, E: 1, N: 1 }, maxConsecutiveWorkDays: 5 };
        localStorage.setItem('nurse_scheduler_config', JSON.stringify(migratedConfig));
        return migratedConfig;
      }
      return parsed;
    }
    return DEFAULT_CONFIG;
  });

  const [activeTab, setActiveTab] = useState<'schedule' | 'requests' | 'nurses' | 'config'>('schedule');
  const [schedule, setSchedule] = useState<DailySchedule[]>([]);
  const [validationAlerts, setValidationAlerts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('nurse_scheduler_nurses', JSON.stringify(nurses));
  }, [nurses]);

  useEffect(() => {
    localStorage.setItem('nurse_scheduler_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('nurse_scheduler_config', JSON.stringify(config));
  }, [config]);

  // Dark Mode side effects
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto-generate schedule when data changes or on initial load
  const handleGenerateSchedule = () => {
    setIsGenerating(true);
    setGenerationError(null);
    // Slight artificial timeout to make the UI transition feel satisfyingly calculations-heavy!
    setTimeout(() => {
      const result = generateSchedule(nurses, requests, config);
      setSchedule(result.days);
      setValidationAlerts(result.validationAlerts);
      
      if (!result.success && result.error) {
        setGenerationError(result.error);
        // Display fallback alert
        alert(`[주의] ${result.error}`);
      }
      
      setIsGenerating(false);
    }, 500);
  };

  useEffect(() => {
    handleGenerateSchedule();
  }, [nurses, requests, config]);

  // 2. State Handlers
  const handleAddNurse = (newNurse: Omit<Nurse, 'id'>) => {
    const id = 'n_' + Date.now();
    setNurses([...nurses, { ...newNurse, id }]);
  };

  const handleRemoveNurse = (id: string) => {
    setNurses(nurses.filter((n) => n.id !== id));
    // Clean up requests associated with this nurse
    setRequests(requests.filter((r) => r.nurseId !== id));
  };

  const handleToggleDuty = (id: string, duty: DutyCode) => {
    setNurses(
      nurses.map((n) => {
        if (n.id === id) {
          const allowed = n.allowedDuties.includes(duty)
            ? n.allowedDuties.filter((d) => d !== duty)
            : [...n.allowedDuties, duty];
          return { ...n, allowedDuties: allowed };
        }
        return n;
      })
    );
  };

  const handleUpdateCompetency = (id: string, competency: number) => {
    setNurses(
      nurses.map((n) => (n.id === id ? { ...n, competency } : n))
    );
  };

  const handleUpdateOffDays = (id: string, minOffDays: number, maxOffDays: number) => {
    setNurses(
      nurses.map((n) => (n.id === id ? { ...n, minOffDays, maxOffDays } : n))
    );
  };

  const handleAddRequest = (newRequest: Omit<DayRequest, 'id'>) => {
    const id = 'req_' + Date.now();
    setRequests([...requests, { ...newRequest, id }]);
  };

  const handleRemoveRequest = (id: string) => {
    setRequests(requests.filter((r) => r.id !== id));
  };

  const handleSaveConfig = (newConfig: SchedulingConfig) => {
    setConfig(newConfig);
    alert('설정이 성공적으로 반영되었습니다! 일정표가 재계산되었습니다.');
  };

  const handleSwapDuties = (sourceNurseId: string, sourceDay: number, targetNurseId: string, targetDay: number) => {
    const updatedSchedule = [...schedule];
    const sourceIdx = sourceDay - 1;
    const targetIdx = targetDay - 1;

    const sourceDuty = updatedSchedule[sourceIdx].assignments[sourceNurseId] || 'O';
    const targetDuty = updatedSchedule[targetIdx].assignments[targetNurseId] || 'O';

    // Swap the duties
    updatedSchedule[sourceIdx] = {
      ...updatedSchedule[sourceIdx],
      assignments: {
        ...updatedSchedule[sourceIdx].assignments,
        [sourceNurseId]: targetDuty,
      }
    };

    updatedSchedule[targetIdx] = {
      ...updatedSchedule[targetIdx],
      assignments: {
        ...updatedSchedule[targetIdx].assignments,
        [targetNurseId]: sourceDuty,
      }
    };

    // Recalculate day stats
    updatedSchedule[sourceIdx] = recalculateDayStats(updatedSchedule[sourceIdx]);
    if (sourceIdx !== targetIdx) {
      updatedSchedule[targetIdx] = recalculateDayStats(updatedSchedule[targetIdx]);
    }

    // Recalculate validation alerts
    const alerts = validateSchedule(updatedSchedule, nurses, config);

    setSchedule(updatedSchedule);
    setValidationAlerts(alerts);
  };

  const handleUpdateDuty = (nurseId: string, day: number, newDuty: DutyCode) => {
    const updatedSchedule = [...schedule];
    const dayIdx = day - 1;

    updatedSchedule[dayIdx] = {
      ...updatedSchedule[dayIdx],
      assignments: {
        ...updatedSchedule[dayIdx].assignments,
        [nurseId]: newDuty,
      }
    };

    // Recalculate day stats
    updatedSchedule[dayIdx] = recalculateDayStats(updatedSchedule[dayIdx]);

    // Recalculate validation alerts
    const alerts = validateSchedule(updatedSchedule, nurses, config);

    setSchedule(updatedSchedule);
    setValidationAlerts(alerts);
  };

  // Nav month handlers
  const handlePrevMonth = () => {
    let newMonth = config.month - 1;
    let newYear = config.year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setConfig({ ...config, month: newMonth, year: newYear });
  };

  const handleNextMonth = () => {
    let newMonth = config.month + 1;
    let newYear = config.year;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setConfig({ ...config, month: newMonth, year: newYear });
  };

  // 3. Export / Import Data Configuration
  const handleExportData = () => {
    const dataStr = JSON.stringify({ nurses, requests, config }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `nurse-scheduler-backup-${config.year}-${config.month + 1}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.nurses && parsed.requests && parsed.config) {
            setNurses(parsed.nurses);
            setRequests(parsed.requests);
            setConfig(parsed.config);
            alert('일정 데이터를 성공적으로 불러왔습니다!');
          } else {
            alert('잘못된 백업 파일입니다. nurses, requests, config 키가 포함되어 있는지 확인해주세요.');
          }
        } catch (err) {
          alert('백업 JSON 파일을 분석하는 데 실패했습니다.');
        }
      };
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('모든 데이터를 기본 설정으로 초기화하시겠습니까? 현재 변경사항은 삭제됩니다.')) {
      setNurses(DEFAULT_NURSES);
      setRequests(DEFAULT_REQUESTS);
      setConfig(DEFAULT_CONFIG);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-natural-bg text-natural-main'}`}>
      
      {/* Header Banner */}
      <header className="border-b border-natural-border bg-white dark:bg-slate-900 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-natural-sage rounded-xl flex items-center justify-center text-white shadow-sm">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-medium tracking-tight text-natural-main dark:text-white font-display italic">
                간호사 근무 일정 관리 시스템
              </h1>
              <span className="text-[10px] bg-natural-sidebar text-natural-muted font-bold px-2 py-0.5 rounded-full border border-natural-border/40 font-mono">
                일정 관리 대시보드 v1.5 • 자연스러운 톤
              </span>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-3">
            
            {/* Import / Export & Reset Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={handleExportData}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-natural-muted hover:text-natural-clay hover:bg-natural-sidebar px-3 py-2 rounded-lg border border-natural-border transition"
                title="현재 일정 백업 JSON 다운로드"
              >
                <Download className="w-3.5 h-3.5" />
                데이터 백업
              </button>
              
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-natural-muted hover:text-natural-clay hover:bg-natural-sidebar px-3 py-2 rounded-lg border border-natural-border transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                데이터 복원
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleResetDefaults}
                className="text-xs font-semibold text-natural-muted/60 hover:text-natural-alert px-3 py-2 rounded-lg border border-transparent transition"
              >
                기본값 초기화
              </button>
            </div>

            {/* Dark Mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg border border-natural-border hover:bg-natural-sidebar text-natural-muted transition cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-natural-clay" />}
            </button>
          </div>

        </div>
      </header>

      {/* Primary Container with Navigation Tab bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-natural-border gap-1 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'schedule'
                ? 'border-natural-sage text-natural-muted'
                : 'border-transparent text-natural-muted/60 hover:text-natural-main'
            }`}
          >
            <CalendarCheck className="w-4.5 h-4.5" />
            근무 일정표
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'requests'
                ? 'border-natural-sage text-natural-muted'
                : 'border-transparent text-natural-muted/60 hover:text-natural-main'
            }`}
          >
            <CalendarIcon className="w-4.5 h-4.5" />
            희망 근무 신청
          </button>

          <button
            onClick={() => setActiveTab('nurses')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'nurses'
                ? 'border-natural-sage text-natural-muted'
                : 'border-transparent text-natural-muted/60 hover:text-natural-main'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            간호사 명단 관리
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'config'
                ? 'border-natural-sage text-natural-muted'
                : 'border-transparent text-natural-muted/60 hover:text-natural-main'
            }`}
          >
            <Sliders className="w-4.5 h-4.5" />
            규칙 및 알고리즘 설정
          </button>
        </div>

        {/* Tab content wrapper with smooth motion transitions */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'schedule' && (
                <div className="space-y-4">
                  {generationError && (
                    <div className="bg-[#fffbeb] dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3 shadow-xs animate-fade-in" id="generation-error-alert">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">일정 생성 품질 불만족 안내</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{generationError}</p>
                      </div>
                      <button 
                        onClick={() => setGenerationError(null)}
                        className="text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 text-xs font-semibold px-2 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 transition shrink-0"
                      >
                        닫기
                      </button>
                    </div>
                  )}
                  <ScheduleGrid
                    nurses={nurses}
                    schedule={schedule}
                    validationAlerts={validationAlerts}
                    onTriggerGenerate={handleGenerateSchedule}
                    isGenerating={isGenerating}
                    targetOffDays={config.targetOffDays}
                    onSwapDuties={handleSwapDuties}
                    onUpdateDuty={handleUpdateDuty}
                  />
                </div>
              )}

              {activeTab === 'requests' && (
                <RequestCalendar
                  year={config.year}
                  month={config.month}
                  nurses={nurses}
                  requests={requests}
                  onAddRequest={handleAddRequest}
                  onRemoveRequest={handleRemoveRequest}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                />
              )}

              {activeTab === 'nurses' && (
                <NurseManagement
                  nurses={nurses}
                  onAddNurse={handleAddNurse}
                  onRemoveNurse={handleRemoveNurse}
                  onToggleDuty={handleToggleDuty}
                  onUpdateCompetency={handleUpdateCompetency}
                  onUpdateOffDays={handleUpdateOffDays}
                  defaultTargetOffDays={config.targetOffDays}
                />
              )}

              {activeTab === 'config' && (
                <ConfigurationPanel
                  config={config}
                  onSaveConfig={handleSaveConfig}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Simple Footer */}
      <footer className="border-t border-natural-border bg-white dark:bg-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center text-xs text-natural-muted gap-4">
          <div>
            &copy; 2026 간호사 일정 관리 어플리케이션. 자연스러운 톤 테마 최적화.
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1 font-mono">
              <Lock className="w-3.5 h-3.5 text-natural-clay" />
              안전한 오프라인 우선 캐시
            </span>
            <span className="font-mono">현재 시간: 2026-07-05</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
