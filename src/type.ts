// 페이지 타입 정의
type PageType = 'mcp-maintain' | 'mcp-maintain-setting' ;

// MCP 서버 설정 타입 정의
interface MCPServerConfig {
  command: string;
  args: string[];
  description?: string;
  env?: Record<string, string>;
}

// MCP 관련 타입 정의
interface MCPServer {
  id: string;
  name: string;
  value: string; // JSON string 형태로 MCPServerConfig를 저장
  version: number;
  delYn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MCPCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  target: string; // 동적 타겟 지원을 위해 string으로 변경
  isActive: boolean;
  version: number;
  delYn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryServerRelation {
  id: string;
  categoryId: string;
  serverId: string;
  order: number;
  isEnabled: boolean;
  version: number;
  delYn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ServerKeyRelation {
  id: string;
  serverId: string;
  keyId: string;
  keyName: string; // 서버에서 사용하는 키 이름 (예: SUPABASE_URL)
  version: number;
  delYn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ActiveCategory {
  target: string; // 동적 타겟 지원
  categoryId: string;
  lastActivated: Date;
  version: number;
  delYn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 동적 설정 타겟 정의 (단순화)
interface MCPConfigTarget {
  id: string;
  name: string; // 표시명 (이름)
  configPath: string;  // 설정 파일 경로
  isBuiltIn: boolean;  // 기본 제공 타겟인지 여부
  version: number;
  delYn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 설정 경로는 이제 동적
interface MCPConfigPaths {
  [key: string]: string; // 동적 키 지원
}

// electron-store 데이터 구조
interface MCPStore {
  // 서버 데이터
  servers: Record<string, MCPServer>;
    
  // 카테고리 데이터
  categories: Record<string, MCPCategory>;
  
  // 설정 타겟 데이터
  configTargets: Record<string, MCPConfigTarget>;
  
  // 관계 데이터
  categoryServerRelations: Record<string, CategoryServerRelation>;
  serverKeyRelations: Record<string, ServerKeyRelation>;
  
  // 활성 카테고리 설정 (동적)
  activeCategories: Record<string, string | null>;
  
  // 설정
  configPaths: MCPConfigPaths;
  
  // 선택된 타겟
  selectedTarget?: string;
  
  // 메타데이터
  metadata: {
    version: string;
    lastUpdated: Date;
  };
}

// 유틸리티 타입들
type CreateMCPServer = Omit<MCPServer, 'id' | 'version' | 'delYn' | 'createdAt' | 'updatedAt'>;
type UpdateMCPServer = Partial<Omit<MCPServer, 'id' | 'version' | 'delYn' | 'createdAt' | 'updatedAt'>>;


type CreateMCPCategory = Omit<MCPCategory, 'id' | 'version' | 'delYn' | 'createdAt' | 'updatedAt'>;
type UpdateMCPCategory = Partial<Omit<MCPCategory, 'id' | 'version' | 'delYn' | 'createdAt' | 'updatedAt'>>;


type CreateMCPConfigTarget = Omit<MCPConfigTarget, 'id' | 'version' | 'delYn' | 'createdAt' | 'updatedAt'>;
type UpdateMCPConfigTarget = Partial<Omit<MCPConfigTarget, 'id' | 'version' | 'delYn' | 'createdAt' | 'updatedAt'>>;

type CreateCategoryServerRelation = Omit<CategoryServerRelation, 'id' | 'version' | 'delYn' | 'createdAt' | 'updatedAt'>;

export type { 
  PageType, 
  MCPServerConfig,
  MCPServer, 
  MCPCategory, 
  MCPConfigTarget,
  CategoryServerRelation,
  ServerKeyRelation,
  ActiveCategory,
  MCPConfigPaths,
  MCPStore,
  CreateMCPServer,
  CreateMCPCategory,
  CreateMCPConfigTarget,
  CreateCategoryServerRelation,
  UpdateMCPServer,
  UpdateMCPCategory,
  UpdateMCPConfigTarget
};
