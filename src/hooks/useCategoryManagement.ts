// useCategoryManagement.ts - 카테고리 관리 관련 공통 로직을 위한 커스텀 훅
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import type { CreateMCPCategory, MCPCategory, MCPServer, MCPStore, MCPConfigTarget, MCPServerConfig } from "../type";

// 서버 value 파싱 유틸리티 함수
const parseServerValue = (value: string): MCPServerConfig | null => {
  if (!value || value.trim() === '' || value === '{}') {
    return null;
  }
  
  try {
    // 이미 파싱된 객체인지 확인
    if (typeof value === 'object') {
      return value as MCPServerConfig;
    }
    
    // JSON 문자열 파싱
    const parsed = JSON.parse(value);
    return parsed as MCPServerConfig;
  } catch (error) {
    console.error('Error parsing server value:', error);
    return null;
  }
};

export const useCategoryManagement = (selectedTarget: string) => {
  // 상태 관리
  const [mcpStore, setMcpStore] = useState<MCPStore | null>(null);
  const [allCategories, setAllCategories] = useState<MCPCategory[]>([]);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [configTargets, setConfigTargets] = useState<MCPConfigTarget[]>([]);
  const [currentCategory, setCurrentCategory] = useState<MCPCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 필터링된 카테고리 계산
  const categories = useCallback(() => {
    if (selectedTarget === 'all') {
      return allCategories;
    }
    return allCategories.filter(category => 
      category.target === selectedTarget || category.target === 'all'
    );
  }, [allCategories, selectedTarget])();

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (typeof (window.electronAPI as any).getMCPStore !== 'function') {
        console.warn('MCP Store API not available');
        return;
      }

      const storeData = await (window.electronAPI as any).getMCPStore();
      if (storeData) {
        const activeCategories = Object.values(storeData.categories || {})
          .filter((cat: any) => !cat.delYn) as MCPCategory[];
        const activeServers = Object.values(storeData.servers || {})
          .filter((server: any) => !server.delYn) as MCPServer[];
        const activeConfigTargets = Object.values(storeData.configTargets || {})
          .filter((target: any) => !target.delYn) as MCPConfigTarget[];

        const activeCategoryId = selectedTarget !== 'all' 
          ? storeData.activeCategories?.[selectedTarget]
          : null;
        const currentCategory = activeCategoryId && storeData.categories?.[activeCategoryId] 
          ? storeData.categories[activeCategoryId] 
          : null;

        setMcpStore(storeData);
        setAllCategories(activeCategories);
        setConfigTargets(activeConfigTargets);
        setServers(activeServers);
        setCurrentCategory(currentCategory);
      }
    } catch (error) {
      console.error('Error loading MCP data:', error);
      toast.error('데이터 로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTarget]);

  // 카테고리의 서버들을 조합하는 함수
  const getCategoryServers = useCallback((categoryId: string): MCPServer[] => {
    if (!mcpStore) return [];

    const relations = Object.values(mcpStore.categoryServerRelations || {})
      .filter(
        (rel) => rel.categoryId === categoryId && !rel.delYn && rel.isEnabled
      )
      .sort((a, b) => a.order - b.order);

    return relations
      .map((rel) => mcpStore.servers[rel.serverId])
      .filter((server) => server && !server.delYn);
  }, [mcpStore]);

  // 카테고리 생성
  const createCategory = useCallback(async (newCategory: CreateMCPCategory) => {
    try {
      const result = await (window.electronAPI as any).createMCPCategory(newCategory);
      if (result.success) {
        toast.success("카테고리가 추가되었습니다.");
        await loadData();
        (window.electronAPI as any).updateTrayMenu();
        return { success: true, category: result.category };
      } else {
        toast.error(`카테고리 추가 실패: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("카테고리 추가 중 오류가 발생했습니다.");
      return { success: false, error: "Unknown error" };
    }
  }, [loadData]);

  // 카테고리 삭제 (확인 없이 실행)
  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      const result = await (window.electronAPI as any).deleteMCPCategory(categoryId);
      if (result.success) {
        toast.success("카테고리가 삭제되었습니다.");
        await loadData();
        (window.electronAPI as any).updateTrayMenu();
        return { success: true };
      } else {
        toast.error(`카테고리 삭제 실패: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("카테고리 삭제 중 오류가 발생했습니다.");
      return { success: false, error: "Unknown error" };
    }
  }, [loadData]);

  // 카테고리 전환
  const switchCategory = useCallback(async (categoryId: string) => {
    if (selectedTarget === 'all') {
      toast.error("전체 모드에서는 카테고리를 전환할 수 없습니다.");
      return { success: false, error: "Cannot switch in all mode" };
    }

    const targetCategory = categories.find((c) => c.id === categoryId);
    if (!targetCategory) {
      toast.error("카테고리를 찾을 수 없습니다.");
      return { success: false, error: "Category not found" };
    }

    try {
      const result = await (window.electronAPI as any).setActiveCategory(
        selectedTarget,
        categoryId
      );
      if (!result.success) {
        toast.error(`활성 카테고리 설정 실패: ${result.error}`);
        return { success: false, error: result.error };
      }

      setCurrentCategory(targetCategory);

      const categoryServers = getCategoryServers(categoryId);
      const mcpConfig = {
        mcpServers: {} as Record<string, MCPServerConfig>,
      };

      categoryServers.forEach((server) => {
        const serverConfig = parseServerValue(server.value);
        if (serverConfig) {
          mcpConfig.mcpServers[server.name] = serverConfig;
        } else {
          console.warn(`Failed to parse server config for ${server.name}:`, server.value);
        }
      });

      // 선택된 타겟의 configPath 찾기
      const targetConfig = configTargets.find(target => target.id === selectedTarget);
      const configPath = targetConfig?.configPath || "";
      
      if (!configPath) {
        toast.error(`"${selectedTarget}" 타겟의 설정 파일 경로가 설정되지 않았습니다.`);
        return { success: false, error: "Config path not set" };
      }

      const writeResult = await (window.electronAPI as any).writeMCPConfig(
        configPath,
        mcpConfig
      );

      if (writeResult.success) {
        toast.success(`카테고리 "${targetCategory.name}"으로 전환되었습니다!`);
        console.log("MCP config saved successfully to:", configPath);
        
        // 트레이 메뉴 업데이트
        await (window.electronAPI as any).updateTrayMenu();
        console.log("Tray menu updated after category switch");
        return { success: true };
      } else {
        toast.error(`설정 파일 저장 실패: ${writeResult.error}`);
        return { success: false, error: writeResult.error };
      }
    } catch (error) {
      console.error("Error switching category:", error);
      toast.error("카테고리 전환 중 오류가 발생했습니다.");
      return { success: false, error: "Unknown error" };
    }
  }, [categories, selectedTarget, configTargets, getCategoryServers]);

  // 카테고리에서 서버 제거 (모달용 - 확인없이 실행)
  const removeServerFromCategory = useCallback(async (
    categoryId: string,
    serverId: string
  ) => {
    try {
      const result = await (window.electronAPI as any).removeServerFromCategory(
        categoryId,
        serverId
      );
      if (result.success) {
        // 개별 작업에서는 토스트를 표시하지 않고, 데이터도 리로드하지 않음
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error removing server from category:", error);
      return { success: false, error: "Unknown error" };
    }
  }, []);

  // 카테고리에 서버 추가 (모달용 - 확인없이 실행)
  const addServerToCategory = useCallback(async (
    categoryId: string,
    serverId: string
  ) => {
    try {
      const result = await (window.electronAPI as any).addServerToCategory(
        categoryId,
        serverId,
        0
      );
      if (result.success) {
        // 개별 작업에서는 토스트를 표시하지 않고, 데이터도 리로드하지 않음
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error adding server to category:", error);
      return { success: false, error: "Unknown error" };
    }
  }, []);


  // 초기 로드 및 selectedTarget 변경 시 리로드
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 트레이에서 카테고리 변경 이벤트 수신 (기존 로직 유지)
  useEffect(() => {
    const handleCategoryChange = () => {
      console.log("Tray category changed, refreshing data...");
      loadData();
    };

    // IPC 이벤트 리스너 등록
    if (
      window.electronAPI &&
      (window.electronAPI as any).onTrayCategoryChanged
    ) {
      (window.electronAPI as any).onTrayCategoryChanged(handleCategoryChange);
    }

    return () => {
      if (
        window.electronAPI &&
        (window.electronAPI as any).removeTrayCategoryChangedListener
      ) {
        (window.electronAPI as any).removeTrayCategoryChangedListener(
          handleCategoryChange
        );
      }
    };
  }, [loadData]);

  return {
    // 상태
    mcpStore,
    categories,
    servers,
    configTargets,
    currentCategory,
    isLoading,
    
    // 함수들
    loadData,
    getCategoryServers,
    createCategory,
    deleteCategory,
    switchCategory,
    removeServerFromCategory,
    addServerToCategory,
  };
};
