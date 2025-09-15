// sampleData.ts - 샘플 데이터
import type { 
  CreateMCPCategory, 
  CreateMCPServer, 
  CreateMCPConfigTarget,
  CreateCategoryServerRelation,
  CreateServerKeyRelation 
} from '../type';

// 샘플 ConfigTarget 데이터
export const sampleConfigTargets: CreateMCPConfigTarget[] = [
  {
    name: 'Claude Desktop',
    configPath: 'C:\\Users\\user\\AppData\\Roaming\\Claude\\claude_desktop_config.json',
    isBuiltIn: false
  },
  {
    name: 'Cursor',
    configPath: 'C:\\Users\\user\\.cursor\\mcp.json',
    isBuiltIn: false
  },
];

// 샘플 서버 데이터
export const sampleServers: CreateMCPServer[] = [
  {
    name: 'filesystem',
    value: JSON.stringify({
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\work\\cursor",
        "C:\\work\\mcp"
      ],
      description: "파일시스템 접근을 위한 MCP 서버"
    })
  },
  {
    name: 'supabase',
    value: JSON.stringify({
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-supabase"
      ],
      description: "Supabase 데이터베이스 연동을 위한 MCP 서버"
    })
  },
  {
    name: 'sqlite',
    value: JSON.stringify({
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-sqlite",
        "C:\\work\\data\\database.db"
      ],
      description: "SQLite 데이터베이스 접근을 위한 MCP 서버"
    })
  },
  {
    name: 'github',
    value: JSON.stringify({
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      description: "GitHub API 연동을 위한 MCP 서버"
    })
  },
  {
    name: 'brave-search',
    value: JSON.stringify({
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      description: "Brave Search API를 위한 MCP 서버"
    })
  }
];
// 샘플 카테고리 데이터
export const sampleCategories: CreateMCPCategory[] = [
  {
    name: '개발',
    description: '개발 관련 MCP 서버들',
    icon: 'Code',
    target: 'all',
    isActive: false
  },
  {
    name: '일반',
    description: '일반적인 작업용 MCP 서버들',
    icon: 'Globe',
    target: 'all',
    isActive: true
  },
  {
    name: '데이터분석',
    description: '데이터 분석 및 처리용 MCP 서버들',
    icon: 'BarChart3',
    target: 'claude',
    isActive: false
  },
  {
    name: '데이터베이스',
    description: '데이터베이스 관련 MCP 서버들',
    icon: 'Database',
    target: 'all',
    isActive: false
  }
];

// 카테고리-서버 관계 데이터
export const sampleCategoryServerRelations: Omit<CreateCategoryServerRelation, 'categoryId' | 'serverId'>[] = [
  // 개발 카테고리 (index 0)
  { order: 0, isEnabled: true }, // filesystem (index 0)
  { order: 1, isEnabled: true }, // supabase (index 1)
  { order: 2, isEnabled: true }, // github (index 3)
  
  // 일반 카테고리 (index 1)
  { order: 0, isEnabled: true }, // filesystem (index 0)
  { order: 1, isEnabled: true }, // brave-search (index 4)
  
  // 데이터분석 카테고리 (index 2)
  { order: 0, isEnabled: true }, // sqlite (index 2)
  { order: 1, isEnabled: true }, // supabase (index 1)
  
  // 데이터베이스 카테고리 (index 3)
  { order: 0, isEnabled: true }, // sqlite (index 2)
  { order: 1, isEnabled: true }, // supabase (index 1)
];

// 서버-키 관계 데이터
export const sampleServerKeyRelations: Omit<CreateServerKeyRelation, 'serverId' | 'keyId'>[] = [
  // supabase 서버 (index 1)
  { keyName: 'SUPABASE_URL' }, // SUPABASE_URL 키
  { keyName: 'SUPABASE_ANON_KEY' }, // SUPABASE_ANON_KEY 키
  
  // github 서버 (index 3)
  { keyName: 'GITHUB_TOKEN' }, // GITHUB_TOKEN 키
  
  // brave-search 서버 (index 4)
  { keyName: 'BRAVE_API_KEY' }, // BRAVE_API_KEY 키
];

// 초기화 함수
export const initializeSampleData = async () => {

  const results = {
    configTargets: [] as string[],
    categories: [] as string[],
    servers: [] as string[],
    keys: [] as string[],
    categoryServerRelations: [] as string[],
    serverKeyRelations: [] as string[]
  };

  try {
    console.log('Starting sample data initialization...');

    // API 사용 가능 여부 확인
    if (typeof (window as any).electronAPI?.createMCPServer !== 'function') {
      throw new Error('MCP Store API not available');
    }


    // 1. ConfigTarget 생성
    console.log('Creating config targets...');
    for (const targetData of sampleConfigTargets) {
      try {
        const result = await (window as any).electronAPI.createMCPConfigTarget(targetData);
        if (result.success) {
          results.configTargets.push(result.target.id);
          console.log(`Created config target: ${targetData.name}`);
        } else {
          console.error(`Failed to create config target ${targetData.name}:`, result.error);
        }
      } catch (error) {
        console.error(`Error creating config target ${targetData.name}:`, error);
      }
    }

    // 2. 서버 생성
    console.log('Creating servers...');
    for (const serverData of sampleServers) {
      try {
        const result = await (window as any).electronAPI.createMCPServer(serverData);
        if (result.success) {
          results.servers.push(result.server.id);
          console.log(`Created server: ${serverData.name}`);
        } else {
          console.error(`Failed to create server ${serverData.name}:`, result.error);
        }
      } catch (error) {
        console.error(`Error creating server ${serverData.name}:`, error);
      }
    }

    // 3. 카테고리 생성
    console.log('Creating categories...');
    for (let i = 0; i < sampleCategories.length; i++) {
      const categoryData = { ...sampleCategories[i] };
      
      // target이 'claude'인 경우 실제 ConfigTarget ID로 교체
      if (categoryData.target === 'claude' && results.configTargets.length >= 1) {
        categoryData.target = results.configTargets[0]; // Claude Desktop ConfigTarget ID
      }
      
      try {
        const result = await (window as any).electronAPI.createMCPCategory(categoryData);
        if (result.success) {
          results.categories.push(result.category.id);
          console.log(`Created category: ${categoryData.name}`);
        } else {
          console.error(`Failed to create category ${categoryData.name}:`, result.error);
        }
      } catch (error) {
        console.error(`Error creating category ${categoryData.name}:`, error);
      }
    }

    // 4. 카테고리-서버 관계 생성
    console.log('Creating category-server relations...');
    const categoryServerPairs = [
      [0, 0], [0, 1], [0, 3], // 개발: filesystem, supabase, github
      [1, 0], [1, 4],         // 일반: filesystem, brave-search
      [2, 2], [2, 1],         // 데이터분석: sqlite, supabase
      [3, 2], [3, 1]          // 데이터베이스: sqlite, supabase
    ];

    for (let i = 0; i < categoryServerPairs.length; i++) {
      const [categoryIndex, serverIndex] = categoryServerPairs[i];
      const categoryId = results.categories[categoryIndex];
      const serverId = results.servers[serverIndex];
      const relationData = sampleCategoryServerRelations[i];

      if (categoryId && serverId) {
        try {
          const result = await (window as any).electronAPI.addServerToCategory(
            categoryId, 
            serverId, 
            relationData.order
          );
          if (result.success) {
            results.categoryServerRelations.push(`${categoryId}-${serverId}`);
            console.log(`Added server ${serverIndex} to category ${categoryIndex}`);
          } else {
            console.error(`Failed to add server to category:`, result.error);
          }
        } catch (error) {
          console.error(`Error adding server to category:`, error);
        }
      } else {
        console.warn(`Missing category or server for relation ${i}: categoryId=${categoryId}, serverId=${serverId}`);
      }
    }

    console.log('Sample data initialization completed:', results);
    return results;
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
};
