// CategoryList.tsx - 카테고리 리스트 및 기능 컴포넌트
import { useState, useMemo } from "react";
import { Row, Col, Card, Button, Badge, ListGroup } from "react-bootstrap";
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
      <Card.Body>
        <EmptyState
          icon={<Layers size={48} />}
          title="카테고리가 없습니다"
          description="첫 번째 MCP 카테고리를 만들어보세요"
        />
      </Card.Body>
    );
  }

  return (
    <>
      <Card.Body>
        <Row>
          {categories.map((category) => {
            const categoryServers = getCategoryServers(category.id);
            const isActive = currentCategory?.id === category.id;

            return (
              <Col key={category.id} lg={4} md={6} className="mb-4">
                <Card className={`h-100 ${isActive ? "border-primary" : ""}`}>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <IconComponent
                        iconName={category.icon}
                        className="me-2"
                      />
                      <div>
                        <h5 className="mb-0">{category.name}</h5>
                        <small className="text-muted">
                          {category.description}
                        </small>
                        <div className="mt-1">
                          <Badge bg={"secondary"} className="me-1">
                            {category.target}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <Badge bg="success" className="d-flex align-items-center">
                        <Check className="me-1" size={12} />
                        활성
                      </Badge>
                    )}
                  </Card.Header>
                  <Card.Body>
                    <h6 className="text-muted mb-2">
                      MCP 서버 ({categoryServers.length}개)
                    </h6>
                    {categoryServers.length > 0 ? (
                      <ListGroup variant="flush">
                        {categoryServers.map((server) => (
                          <ListGroup.Item
                            key={server.id}
                            className="d-flex justify-content-between align-items-start"
                          >
                            <div className="ms-2 me-auto">
                              <div className="fw-bold">{server.name}</div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <p className="text-muted small">서버가 없습니다</p>
                    )}
                  </Card.Body>
                  <Card.Footer>
                    <div className="d-grid gap-2">
                      <div className="d-flex gap-1">
                        {!isActive && selectedTarget !== "all" && (
                          <Button
                            variant="primary"
                            onClick={(e) => {
                              e.preventDefault();
                              onSwitchCategory(category.id);
                            }}
                            className="d-flex align-items-center justify-content-center flex-fill"
                          >
                            <RotateCcw className="me-1" size={16} />
                            전환
                          </Button>
                        )}
                        <Button
                          variant="outline-secondary"
                          onClick={() => handleManageServers(category.id)}
                          className="d-flex align-items-center justify-content-center flex-fill"
                        >
                          <Settings className="me-1" size={16} />
                          서버 관리
                        </Button>
                      </div>
                      <Button
                        variant="outline-danger"
                        onClick={() => onDeleteCategory(category.id)}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <Trash2 className="me-1" size={16} />
                        삭제
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card.Body>

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
