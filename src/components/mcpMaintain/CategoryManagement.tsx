// CategoryManagement.tsx - 카테고리 관리 메인 컴포넌트 (리팩토링됨)
import { Card } from "react-bootstrap";
import { useCategoryManagement } from "../../hooks/useCategoryManagement";
import ActiveCategoryDisplay from './ActiveCategoryDisplay';
import CategoryCreator from './CategoryCreator';
import CategoryList from './CategoryList';

interface CategoryManagementProps {
  selectedTarget: string;
}

const CategoryManagement = ({ selectedTarget }: CategoryManagementProps) => {
  // 커스텀 훅에서 모든 로직과 상태를 가져옴
  const {
    categories,
    servers,
    currentCategory,
    isLoading,
    loadData,
    getCategoryServers,
    createCategory,
    deleteCategory,
    switchCategory,
    removeServerFromCategory,
    addServerToCategory,
  } = useCategoryManagement(selectedTarget);

  // 서버 변경사항을 한 번에 저장하는 함수 (모달 닫기 콜백 포함)
  const handleSaveServerChanges = async (categoryId: string, serverIds: string[], onCloseModal: () => void) => {
    try {
      // 현재 카테고리의 서버 목록
      const currentServerIds = getCategoryServers(categoryId).map(server => server.id);
      
      // 제거할 서버들
      const serversToRemove = currentServerIds.filter(id => !serverIds.includes(id));
      
      // 추가할 서버들
      const serversToAdd = serverIds.filter(id => !currentServerIds.includes(id));

      // 제거 작업
      for (const serverId of serversToRemove) {
        const result = await removeServerFromCategory(categoryId, serverId);
        if (!result.success) {
          return { success: false, error: `서버 제거 실패: ${result.error}` };
        }
      }

      // 추가 작업
      for (const serverId of serversToAdd) {
        const result = await addServerToCategory(categoryId, serverId);
        if (!result.success) {
          return { success: false, error: `서버 추가 실패: ${result.error}` };
        }
      }

      // 모든 변경사항이 성공한 후 데이터 리로드
      await loadData();
      
      // 트레이 메뉴 업데이트
      if (window.electronAPI && (window.electronAPI as any).updateTrayMenu) {
        (window.electronAPI as any).updateTrayMenu();
      }

      // 저장 성공 후 모달 닫기
      onCloseModal();

      return { success: true };
    } catch (error) {
      console.error('Error saving server changes:', error);
      return { success: false, error: '서버 변경사항 저장 중 오류가 발생했습니다.' };
    }
  };


  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 1. 현재 활성 카테고리 표시 */}
      <ActiveCategoryDisplay
        currentCategory={currentCategory}
        categoryServersCount={currentCategory ? getCategoryServers(currentCategory.id).length : 0}
      />

      {/* 2. 카테고리 신규등록 버튼과 모달 */}
      <CategoryCreator onCreateCategory={createCategory} />

      {/* 3. 카테고리 리스트 및 기능 */}
      <Card>
        <CategoryList
          categories={categories}
          servers={servers}
          currentCategory={currentCategory}
          selectedTarget={selectedTarget}
          getCategoryServers={getCategoryServers}
          onSwitchCategory={switchCategory}
          onDeleteCategory={deleteCategory}
          onSaveServerChanges={handleSaveServerChanges}
        />
      </Card>
    </div>
  );
};

export default CategoryManagement;