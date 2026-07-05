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
  FileSpreadsheet
} from 'lucide-react';
import { Nurse, DayRequest, SchedulingConfig, DailySchedule, DutyCode } from './types';
import { generateSchedule } from './utils/schedulingAlgorithm';
import NurseManagement from './components/NurseManagement';
import RequestCalendar from './components/RequestCalendar';
import ScheduleGrid from './components/ScheduleGrid';
import ConfigurationPanel from './components/ConfigurationPanel';

// Default mock data to populate first-time load beautifully
const DEFAULT_NURSES: Nurse[] = [
  { id: 'n1', name: 'John Smith, RN', competency: 5, allowedDuties: ['D', 'E', 'N'] },
  { id: 'n2', name: 'Mary Cooper, RN', competency: 6, allowedDuties: ['D', 'E', 'N'] },
  { id: 'n3', name: 'David Lee, RN', competency: 4, allowedDuties: ['D', 'E'] }, // Day/Evening only!
  { id: 'n4', name: 'Sarah Jenkins, LPN', competency: 5, allowedDuties: ['N'] }, // Night shift only!
  { id: 'n5', name: 'Robert Chen, RN', competency: 3, allowedDuties: ['D', 'E', 'N'] },
  { id: 'n6', name: 'Emily Davis, LPN', competency: 4, allowedDuties: ['D', 'E', 'N'] },
  { id: 'n7', name: 'James Taylor, RN', competency: 2, allowedDuties: ['D', 'E'] },
];

const DEFAULT_REQUESTS: DayRequest[] = [
  { id: 'req1', nurseId: 'n3', nurseName: 'David Lee, RN', duty: 'O', day: 5 },
  { id: 'req2', nurseId: 'n1', nurseName: 'John Smith, RN', duty: 'O', day: 12 },
  { id: 'req3', nurseId: 'n2', nurseName: 'Mary Cooper, RN', duty: 'O', day: 19 },
  { id: 'req4', nurseId: 'n4', nurseName: 'Sarah Jenkins, LPN', duty: 'O', day: 2 },
  { id: 'req5', nurseId: 'n6', nurseName: 'Emily Davis, LPN', duty: 'D', day: 15 },
];

const DEFAULT_CONFIG: SchedulingConfig = {
  year: 2026,
  month: 6, // July (0-indexed: 6 = July)
  weekdaysRequirement: { D: 2, E: 1, N: 1 },
  weekendsRequirement: { D: 1, E: 1, N: 1 },
  maxConsecutiveNights: 3,
  postNightOffs: 1,
};

export default function App() {
  // 1. Core States loaded from LocalStorage
  const [nurses, setNurses] = useState<Nurse[]>(() => {
    const saved = localStorage.getItem('nurse_scheduler_nurses');
    return saved ? JSON.parse(saved) : DEFAULT_NURSES;
  });

  const [requests, setRequests] = useState<DayRequest[]>(() => {
    const saved = localStorage.getItem('nurse_scheduler_requests');
    return saved ? JSON.parse(saved) : DEFAULT_REQUESTS;
  });

  const [config, setConfig] = useState<SchedulingConfig>(() => {
    const saved = localStorage.getItem('nurse_scheduler_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [activeTab, setActiveTab] = useState<'schedule' | 'requests' | 'nurses' | 'config'>('schedule');
  const [schedule, setSchedule] = useState<DailySchedule[]>([]);
  const [validationAlerts, setValidationAlerts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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
    // Slight artificial timeout to make the UI transition feel satisfyingly calculations-heavy!
    setTimeout(() => {
      const result = generateSchedule(nurses, requests, config);
      setSchedule(result.days);
      setValidationAlerts(result.validationAlerts);
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

  const handleAddRequest = (newRequest: Omit<DayRequest, 'id'>) => {
    const id = 'req_' + Date.now();
    setRequests([...requests, { ...newRequest, id }]);
  };

  const handleRemoveRequest = (id: string) => {
    setRequests(requests.filter((r) => r.id !== id));
  };

  const handleSaveConfig = (newConfig: SchedulingConfig) => {
    setConfig(newConfig);
    alert('Configuration settings updated successfully! Schedule has been recalculated.');
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
            alert('Schedule data imported successfully!');
          } else {
            alert('Invalid backup file. Ensure it contains nurses, requests, and config keys.');
          }
        } catch (err) {
          alert('Failed to parse backup JSON file.');
        }
      };
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset all data back to the default roster and settings? This will clear current changes.')) {
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
                Nurse Scheduling System
              </h1>
              <span className="text-[10px] bg-natural-sidebar text-natural-muted font-bold px-2 py-0.5 rounded-full border border-natural-border/40">
                SaaS Dashboard v1.4 • Natural Tones
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
                title="Download current scheduler backup JSON"
              >
                <Download className="w-3.5 h-3.5" />
                Backup Data
              </button>
              
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-natural-muted hover:text-natural-clay hover:bg-natural-sidebar px-3 py-2 rounded-lg border border-natural-border transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Restore
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
                Reset Defaults
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
            Schedule Matrix
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
            Interactive Requests Calendar
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
            Staff Nurse Roster
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
            Algorithm Parameters
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
                <ScheduleGrid
                  nurses={nurses}
                  schedule={schedule}
                  validationAlerts={validationAlerts}
                  onTriggerGenerate={handleGenerateSchedule}
                  isGenerating={isGenerating}
                />
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
            &copy; 2026 Nurse Scheduling Application. Optimized with Natural Tones Theme.
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-natural-clay" />
              Secure Offline-First Cache
            </span>
            <span>Local Time: 2026-07-05</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
