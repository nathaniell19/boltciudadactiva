import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type DemoModeType = 'worker' | 'company' | null;

interface DemoContextType {
  demoMode: DemoModeType;
  setDemoMode: (mode: DemoModeType) => void;
  isDemo: boolean;
  showDemoAlert: () => void;
  hideDemoAlert: () => void;
  isDemoAlertVisible: boolean;
  exitDemoMode: () => void;
  getDemoRole: () => 'worker' | 'company' | null;
  isDevMode: boolean;
  devMode: 'dev-worker' | 'dev-company' | null;
  setDevMode: (mode: 'dev-worker' | 'dev-company') => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoModeState] = useState<DemoModeType>(null);
  const [devMode, setDevModeState] = useState<'dev-worker' | 'dev-company' | null>(null);
  const [isDemoAlertVisible, setIsDemoAlertVisible] = useState(false);

  const setDemoMode = useCallback((mode: DemoModeType) => {
    setDemoModeState(mode);
  }, []);

  const setDevMode = useCallback((mode: 'dev-worker' | 'dev-company') => {
    setDevModeState(mode);
    setDemoModeState(null);
  }, []);

  const showDemoAlert = useCallback(() => {
    // Don't show alert in dev mode
    if (devMode) return;
    setIsDemoAlertVisible(true);
  }, [devMode]);

  const hideDemoAlert = useCallback(() => {
    setIsDemoAlertVisible(false);
  }, []);

  const exitDemoMode = useCallback(() => {
    setDemoModeState(null);
    setDevModeState(null);
    setIsDemoAlertVisible(false);
  }, []);

  const getDemoRole = useCallback(() => {
    if (devMode === 'dev-worker' || demoMode === 'worker') return 'worker';
    if (devMode === 'dev-company' || demoMode === 'company') return 'company';
    return null;
  }, [demoMode, devMode]);

  const value: DemoContextType = {
    demoMode,
    setDemoMode,
    isDemo: demoMode !== null,
    showDemoAlert,
    hideDemoAlert,
    isDemoAlertVisible,
    exitDemoMode,
    getDemoRole,
    isDevMode: devMode !== null,
    devMode,
    setDevMode,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
