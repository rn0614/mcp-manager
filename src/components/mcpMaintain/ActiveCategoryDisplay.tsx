// ActiveCategoryDisplay.tsx - 현재 활성화된 카테고리 표시 컴포넌트
import { Alert } from "react-bootstrap";
import type { MCPCategory } from "../../type";
import { ICON_MAP } from "../../constants/categoryConstants";

interface ActiveCategoryDisplayProps {
  currentCategory: MCPCategory | null;
  categoryServersCount: number;
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

const ActiveCategoryDisplay = ({ 
  currentCategory, 
  categoryServersCount 
}: ActiveCategoryDisplayProps) => {
  if (!currentCategory) {
    return null;
  }

  return (
    <Alert variant="info" className="mb-4">
      <div className="d-flex align-items-center">
        <IconComponent
          iconName={currentCategory.icon}
          className="me-3"
          size={24}
        />
        <div>
          <h5 className="mb-1">현재 활성: {currentCategory.name}</h5>
          <p className="mb-1">{currentCategory.description}</p>
          <small className="text-muted">
            {categoryServersCount}개의 MCP 서버가 설정되어 있습니다
          </small>
        </div>
      </div>
    </Alert>
  );
};

export default ActiveCategoryDisplay;
