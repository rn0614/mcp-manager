// mockElectronAPI.ts - ElectronAPI 모의 구현 (개발/테스트용)
import type { 
  MCPStore, 
  CreateMCPConfigTarget, 
  UpdateMCPConfigTarget,
} from '../type';
import { 
  createDefaultStore,
  createConfigTarget,
  addConfigTargetToStore,
  updateConfigTargetInStore,
  deleteConfigTargetFromStore,
} from './mcpStore';

// 메모리 내 스토어 (개발용)
let mockStore: MCPStore = createDefaultStore();

// 지연 시뮬레이션
const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

export const mockElectronAPI = {
  // 스토어 관련
  getMCPStore: async () => {
    await delay();
    return mockStore;
  },

  saveMCPStore: async (store: MCPStore) => {
    await delay();
    mockStore = store;
    return { success: true };
  },

  resetMCPStore: async () => {
    await delay();
    mockStore = createDefaultStore();
    return { success: true };
  },

  setSelectedTarget: async (target: string) => {
    await delay();
    mockStore = {
      ...mockStore,
      selectedTarget: target
    };
    return { success: true };
  },

  // ConfigTarget 관련
  createMCPConfigTarget: async (data: CreateMCPConfigTarget) => {
    await delay();
    try {
      const newTarget = createConfigTarget(data);
      mockStore = addConfigTargetToStore(mockStore, newTarget);
      return { success: true, data: newTarget };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  updateMCPConfigTarget: async (targetId: string, updates: UpdateMCPConfigTarget) => {
    await delay();
    try {
      const target = mockStore.configTargets[targetId];
      if (!target) {
        return { success: false, error: 'Target not found' };
      }
      
      if (target.isBuiltIn) {
        return { success: false, error: 'Cannot modify built-in targets' };
      }

      mockStore = updateConfigTargetInStore(mockStore, targetId, updates);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  deleteMCPConfigTarget: async (targetId: string) => {
    await delay();
    try {
      const target = mockStore.configTargets[targetId];
      if (!target) {
        return { success: false, error: 'Target not found' };
      }
      
      if (target.isBuiltIn) {
        return { success: false, error: 'Cannot delete built-in targets' };
      }

      mockStore = deleteConfigTargetFromStore(mockStore, targetId);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // 파일 관련
  getMCPConfig: async (path: string) => {
    await delay();
    console.log(`Mock: Reading config from ${path}`);
    // 임시로 성공 응답
    return { mcpServers: {} };
  },

  writeMCPConfig: async (path: string, config: any) => {
    await delay();
    console.log(`Mock: Writing config to ${path}:`, config);
    return { success: true };
  },

  selectFolder: async () => {
    await delay();
    // 임시로 고정 경로 반환
    return 'C:\\Users\\TestUser\\AppData\\Roaming';
  },

  // 카테고리 관련 (기존 함수들 유지)
  createMCPCategory: async () => {
    await delay();
    return { success: true };
  },

  setActiveCategory: async (target: string, categoryId: string) => {
    await delay();
    mockStore.activeCategories[target] = categoryId;
    return { success: true };
  },

  deleteMCPCategory: async () => {
    await delay();
    return { success: true };
  },

  addServerToCategory: async () => {
    await delay();
    return { success: true };
  },

  removeServerFromCategory: async () => {
    await delay();
    return { success: true };
  },

  updateTrayMenu: async () => {
    await delay();
    console.log('Mock: Tray menu updated');
  },

  // 트레이 이벤트 리스너 (더미)
  onTrayCategoryChanged: () => {
    console.log('Mock: onTrayCategoryChanged listener registered');
  },

  removeTrayCategoryChangedListener: () => {
    console.log('Mock: onTrayCategoryChanged listener removed');
  }
};

// 브라우저 환경에서만 mock API 설정 (Electron이 아닌 경우)
if (import.meta.env.DEV && typeof window !== 'undefined' && !window.navigator?.userAgent?.includes('Electron')) {
  // window 객체가 준비될 때까지 대기
  const setupMockAPI = () => {
    if (typeof window !== 'undefined') {
      // electronAPI가 없으면 mock API 설정
      if (!window .electronAPI) {
        try {
          window.electronAPI = mockElectronAPI as any;
          console.log('Mock ElectronAPI loaded for browser development');
          console.log('Available API functions:', Object.keys(mockElectronAPI));
        } catch (error) {
          console.warn('Failed to set mock ElectronAPI:', error);
        }
      } else {
        console.log('Using existing electronAPI from preload.js');
        console.log('Available API functions:', Object.keys(window.electronAPI));
      }
    } else {
      // DOM이 로드되지 않았다면 잠시 대기 후 재시도
      setTimeout(setupMockAPI, 10);
    }
  };
  
  setupMockAPI();
} else if (import.meta.env.DEV) {
  console.log('Running in Electron environment - using preload.js API');
}
