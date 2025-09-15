/// <reference types="vite/client" />

// types.ts에서 타입 import
import type { AppSettings } from './type';


// Electron API 타입 정의
declare global {
  interface Window {
    electronAPI: {
      // 파일 시스템 관련 API
      selectFolder: () => Promise<string | null>;
      
      // 설정 저장/로드 API - 타입 안전하게 정의
      saveSettings: (settings: AppSettings) => Promise<boolean>;
      loadSettings: () => Promise<AppSettings>;
      
      // MCP 설정 파일 API
      readMCPConfig: (filePath: string) => Promise<any>;
      writeMCPConfig: (filePath: string, config: any) => Promise<{ success: boolean; error?: string }>;
      
      // MCP Store API
      getMCPStore: () => Promise<any>;
      saveMCPStore: (store: any) => Promise<{ success: boolean; error?: string }>;
      resetMCPStore: () => Promise<{ success: boolean; error?: string }>;
      createMCPCategory: (categoryData: any) => Promise<{ success: boolean; category?: any; error?: string }>;
      updateMCPCategory: (categoryId: string, updates: any) => Promise<{ success: boolean; category?: any; error?: string }>;
      deleteMCPCategory: (categoryId: string) => Promise<{ success: boolean; error?: string }>;
      createMCPServer: (serverData: any) => Promise<{ success: boolean; server?: any; error?: string }>;
      updateMCPServer: (serverId: string, updates: any) => Promise<{ success: boolean; server?: any; error?: string }>;
      deleteMCPServer: (serverId: string) => Promise<{ success: boolean; error?: string }>;
      createMCPKey: (keyData: any) => Promise<{ success: boolean; key?: any; error?: string }>;
      updateMCPKey: (keyId: string, updates: any) => Promise<{ success: boolean; key?: any; error?: string }>;
      deleteMCPKey: (keyId: string) => Promise<{ success: boolean; error?: string }>;
      setActiveCategory: (target: string, categoryId: string | null) => Promise<{ success: boolean; error?: string }>;
      setSelectedTarget: (target: string) => Promise<{ success: boolean; error?: string }>;
      addServerToCategory: (categoryId: string, serverId: string, order?: number) => Promise<{ success: boolean; error?: string }>;
      removeServerFromCategory: (categoryId: string, serverId: string) => Promise<{ success: boolean; error?: string }>;
      addKeyToServer: (serverId: string, keyId: string, keyName: string) => Promise<{ success: boolean; error?: string }>;
      
      // ConfigTarget 관련 API
      createMCPConfigTarget: (targetData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
      updateMCPConfigTarget: (targetId: string, updates: any) => Promise<{ success: boolean; data?: any; error?: string }>;
      deleteMCPConfigTarget: (targetId: string) => Promise<{ success: boolean; error?: string }>;
      
      // 트레이 API
      updateTrayMenu: () => Promise<void>;
      
      // IPC 이벤트 리스너
      onTrayCategoryChanged: (callback: () => void) => void;
      removeTrayCategoryChangedListener: (callback: () => void) => void;
      
      // Store 변경 이벤트 리스너
      onStoreChanged: (callback: (event: any, data: any) => void) => void;
      removeStoreChangedListener: (callback: (event: any, data: any) => void) => void;
      
    };
  }
}

export {};