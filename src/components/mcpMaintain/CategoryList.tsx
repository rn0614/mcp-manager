// CategoryList.tsx - 카테고리 리스트 및 기능 컴포넌트
import { useState, useMemo } from "react";
import { ListGroup, Button, Badge } from "react-bootstrap";
import { Settings, Trash2, RotateCcw, Check, Layers } from "lucide-react";
import type { MCPCategory, MCPServer } from "../../type";
import { ICON_MAP } from "../../constants/categoryConstants";
import ServerManageModal from "./ServerManageModal";
import EmptyState from "../shared/EmptyState";

interface CategoryListProps {
  categories: MCPCategory[];
  servers: MCPServer[];
  currentCategory: MCPCategory | null;
  selectedTarget: string;
  getCategoryServers: (categoryId: string) => MCPServer[];
  onSwitchCategory: (
    categoryId: string
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteCategory: (
    categoryId: string
  ) => Promise<{ success: boolean; error?: string }>;
  onSaveServerChanges: (categoryId: string, serverIds: string[], onCloseModal: () => void) => Promise<{ success: boolean; error?: string }>;
}

const IconComponent = ({
  iconName,
  className = "w-5 h-5",
  size,
}: {
  iconName: string;
  className?: string;
  size?: number;
}) => {
  const Icon = ICON_MAP[iconName as keyof typeof ICON_MAP] || ICON_MAP.Layers;
  return <Icon className={className} size={size} />;
};

const CategoryList = ({
  categories,
  servers,
  currentCategory,
  selectedTarget,
  getCategoryServers,
  onSwitchCategory,
  onDeleteCategory,
  onSaveServerChanges,
}: CategoryListProps) => {
  // 모달 상태 관리
  const [showManageServers, setShowManageServers] = useState(false);
  const [selectedCategoryForManagement, setSelectedCategoryForManagement] = useState("");

  // 서버 관리 모달 핸들러들
  const handleManageServers = (categoryId: string) => {
    setSelectedCategoryForManagement(categoryId);
    setShowManageServers(true);
  };

  const handleCloseManageServers = () => {
    setShowManageServers(false);
    setSelectedCategoryForManagement("");
  };

  // 모달에서 사용할 카테고리 서버 목록을 메모이제이션
  const modalCategoryServers = useMemo(() => {
    if (!selectedCategoryForManagement) return [];
    return getCategoryServers(selectedCategoryForManagement);
  }, [selectedCategoryForManagement, getCategoryServers]);

  if (categories.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<Layers size={48} />}
          title="카테고리가 없습니다"
          description="첫 번째 MCP 카테고리를 만들어보세요"
        />
      </div>
    );
  }

  return (
    <>
      <ListGroup variant="flush">
        {categories.map((category) => {
          const categoryServers = getCategoryServers(category.id);
          const isActive = currentCategory?.id === category.id;

          return (
            <ListGroup.Item
              key={category.id}
              className={`py-3 ${isActive ? "bg-light border-start border-primary border-3" : ""}`}
            >
              <div className="d-flex justify-content-between align-items-center">
                {/* 왼쪽: 카테고리 정보 */}
                <div className="d-flex align-items-center flex-grow-1">
                  <IconComponent
                    iconName={category.icon}
                    className="me-3"
                    size={24}
                  />
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-1">
                      <h6 className="mb-0 me-2 text-truncate" style={{ maxWidth: '200px' }}>
                        {category.name}
                      </h6>
                      {isActive && (
                        <Badge bg="success" className="d-flex align-items-center">
                          <Check className="me-1" size={12} />
                          <span className="d-none d-md-inline">활성</span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted mb-0 small text-truncate" style={{ maxWidth: '300px' }}>
                      {category.description}
                    </p>
                    <small className="text-muted">
                      {categoryServers.length}개의 MCP 서버 설정됨
                    </small>
                  </div>
                </div>

                {/* 오른쪽: 액션 버튼들 */}
                <div className="d-flex gap-1">
                  {!isActive && selectedTarget !== "all" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        onSwitchCategory(category.id);
                      }}
                      className="d-flex align-items-center"
                      title="카테고리 전환"
                    >
                      <RotateCcw size={14} />
                      <span className="d-none d-lg-inline ms-1">전환</span>
                    </Button>
                  )}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleManageServers(category.id)}
                    className="d-flex align-items-center"
                    title="서버 관리"
                  >
                    <Settings size={14} />
                    <span className="d-none d-lg-inline ms-1">서버 관리</span>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDeleteCategory(category.id)}
                    className="d-flex align-items-center"
                    title="카테고리 삭제"
                  >
                    <Trash2 size={14} />
                    <span className="d-none d-lg-inline ms-1">삭제</span>
                  </Button>
                </div>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>

      <ServerManageModal
        show={showManageServers}
        onHide={handleCloseManageServers}
        selectedCategory={selectedCategoryForManagement}
        categories={categories}
        servers={servers}
        categoryServers={modalCategoryServers}
        onSaveChanges={(categoryId, serverIds) => 
          onSaveServerChanges(categoryId, serverIds, handleCloseManageServers)
        }
      />
    </>
  );
};

export default CategoryList;
