// mcpStore.ts - MCP 데이터 관리 유틸리티
import type { 
  MCPStore, 
  MCPServer, 
  MCPCategory, 
  MCPConfigTarget,
  CategoryServerRelation,
  ServerKeyRelation,
  CreateMCPServer,
  CreateMCPCategory,
  CreateMCPConfigTarget,
  CreateCategoryServerRelation,
  CreateServerKeyRelation,
  UpdateMCPServer,
  UpdateMCPCategory,
  UpdateMCPConfigTarget
} from '../type';

// ID 생성 유틸리티
export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// 공통 필드 생성
const createCommonFields = () => ({
  id: generateId(),
  version: 1,
  delYn: false,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 서버 생성
export const createServer = (data: CreateMCPServer): MCPServer => ({
  ...data,
  ...createCommonFields()
});

// 카테고리 생성
export const createCategory = (data: CreateMCPCategory): MCPCategory => ({
  ...data,
  ...createCommonFields()
});

// ConfigTarget 생성
export const createConfigTarget = (data: CreateMCPConfigTarget): MCPConfigTarget => ({
  ...data,
  ...createCommonFields()
});

// 기본 ConfigTarget들 생성 (고정 ID 사용)
const createDefaultConfigTargets = () => {
  const claudeTarget = {
    id: 'claude',  // 고정 ID
    name: 'clauede',
    configPath: '%APPDATA%\\Claude\\claude_desktop_config.json',
    isBuiltIn: true,
    version: 1,
    delYn: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const cursorTarget = {
    id: 'cursor',  // 고정 ID
    name: 'cursor',
    configPath: '%APPDATA%\\Cursor\\config.json',
    isBuiltIn: true,
    version: 1,
    delYn: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return {
    [claudeTarget.id]: claudeTarget,
    [cursorTarget.id]: cursorTarget
  };
};

// 기본 스토어 구조
export const createDefaultStore = (): MCPStore => ({
  servers: {},
  categories: {},
  configTargets: createDefaultConfigTargets(),
  categoryServerRelations: {},
  serverKeyRelations: {},
  activeCategories: {},
  configPaths: {},
  metadata: {
    version: '1.0.0',
    lastUpdated: new Date()
  }
});

// 카테고리-서버 관계 생성
export const createCategoryServerRelation = (data: CreateCategoryServerRelation): CategoryServerRelation => ({
  ...data,
  ...createCommonFields()
});

// 서버-키 관계 생성
export const createServerKeyRelation = (data: CreateServerKeyRelation): ServerKeyRelation => ({
  ...data,
  ...createCommonFields()
});

// 서버 업데이트
export const updateServer = (server: MCPServer, updates: UpdateMCPServer): MCPServer => ({
  ...server,
  ...updates,
  version: server.version + 1,
  updatedAt: new Date()
});

// 카테고리 업데이트
export const updateCategory = (category: MCPCategory, updates: UpdateMCPCategory): MCPCategory => ({
  ...category,
  ...updates,
  version: category.version + 1,
  updatedAt: new Date()
});

// ConfigTarget 업데이트
export const updateConfigTarget = (target: MCPConfigTarget, updates: UpdateMCPConfigTarget): MCPConfigTarget => ({
  ...target,
  ...updates,
  version: target.version + 1,
  updatedAt: new Date()
});

// Soft 삭제
export const softDeleteServer = (server: MCPServer): MCPServer => ({
  ...server,
  delYn: true,
  version: server.version + 1,
  updatedAt: new Date()
});


export const softDeleteCategory = (category: MCPCategory): MCPCategory => ({
  ...category,
  delYn: true,
  version: category.version + 1,
  updatedAt: new Date()
});

export const softDeleteConfigTarget = (target: MCPConfigTarget): MCPConfigTarget => ({
  ...target,
  delYn: true,
  version: target.version + 1,
  updatedAt: new Date()
});

// 활성 카테고리 설정 (동적 타겟 지원)
export const setActiveCategory = (store: MCPStore, target: string, categoryId: string | null): MCPStore => {
  return {
    ...store,
    activeCategories: {
      ...store.activeCategories,
      [target]: categoryId
    },
    metadata: {
      ...store.metadata,
      lastUpdated: new Date()
    }
  };
};

// 카테고리에 서버 추가
export const addServerToCategory = (
  store: MCPStore, 
  categoryId: string, 
  serverId: string, 
  order: number = 0
): MCPStore => {
  const relationId = generateId();
  const relation = createCategoryServerRelation({
    categoryId,
    serverId,
    order,
    isEnabled: true
  });

  return {
    ...store,
    categoryServerRelations: {
      ...store.categoryServerRelations,
      [relationId]: relation
    },
    metadata: {
      ...store.metadata,
      lastUpdated: new Date()
    }
  };
};

// 서버에 키 연결
export const addKeyToServer = (
  store: MCPStore,
  serverId: string,
  keyId: string,
  keyName: string
): MCPStore => {
  const relationId = generateId();
  const relation = createServerKeyRelation({
    serverId,
    keyId,
    keyName
  });

  return {
    ...store,
    serverKeyRelations: {
      ...store.serverKeyRelations,
      [relationId]: relation
    },
    metadata: {
      ...store.metadata,
      lastUpdated: new Date()
    }
  };
};

// 활성 카테고리 가져오기 (동적 타겟 지원)
export const getActiveCategory = (store: MCPStore, target: string): MCPCategory | null => {
  const categoryId = store.activeCategories[target];
  if (!categoryId) return null;
  
  const category = store.categories[categoryId];
  return category && !category.delYn ? category : null;
};

// 카테고리의 서버들 가져오기
export const getCategoryServers = (store: MCPStore, categoryId: string): MCPServer[] => {
  const relations = Object.values(store.categoryServerRelations)
    .filter(rel => rel.categoryId === categoryId && !rel.delYn && rel.isEnabled)
    .sort((a, b) => a.order - b.order);

  return relations
    .map(rel => store.servers[rel.serverId])
    .filter(server => server && !server.delYn);
};

// 삭제되지 않은 모든 항목들 가져오기
export const getActiveServers = (store: MCPStore): MCPServer[] => {
  return Object.values(store.servers).filter(server => !server.delYn);
};


export const getActiveCategories = (store: MCPStore): MCPCategory[] => {
  return Object.values(store.categories).filter(category => !category.delYn);
};

// 삭제되지 않은 모든 ConfigTarget들 가져오기
export const getActiveConfigTargets = (store: MCPStore): MCPConfigTarget[] => {
  return Object.values(store.configTargets).filter(target => !target.delYn);
};

// ConfigTarget 스토어 작업들
export const addConfigTargetToStore = (store: MCPStore, target: MCPConfigTarget): MCPStore => {
  return {
    ...store,
    configTargets: {
      ...store.configTargets,
      [target.id]: target
    },
    metadata: {
      ...store.metadata,
      lastUpdated: new Date()
    }
  };
};

export const updateConfigTargetInStore = (store: MCPStore, targetId: string, updates: UpdateMCPConfigTarget): MCPStore => {
  const target = store.configTargets[targetId];
  if (!target) return store;

  const updatedTarget = updateConfigTarget(target, updates);
  
  return {
    ...store,
    configTargets: {
      ...store.configTargets,
      [targetId]: updatedTarget
    },
    metadata: {
      ...store.metadata,
      lastUpdated: new Date()
    }
  };
};

export const deleteConfigTargetFromStore = (store: MCPStore, targetId: string): MCPStore => {
  const target = store.configTargets[targetId];
  if (!target) return store;

  const deletedTarget = softDeleteConfigTarget(target);
  
  return {
    ...store,
    configTargets: {
      ...store.configTargets,
      [targetId]: deletedTarget
    },
    metadata: {
      ...store.metadata,
      lastUpdated: new Date()
    }
  };
};
