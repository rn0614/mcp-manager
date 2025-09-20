// ActiveCategoryDisplay.tsx - 현재 활성화된 카테고리 표시 컴포넌트
import { useState, useEffect } from "react";
import { Alert, Form } from "react-bootstrap";
import type { MCPCategory, MCPConfigTarget } from "../../type";
import { ICON_MAP } from "../../constants/categoryConstants";

interface ActiveCategoryDisplayProps {
  currentCategory: MCPCategory | null;
  categoryServersCount: number;
  selectedTarget: string;
  onTargetChange: (target: string) => void;
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
  selectedTarget,
  onTargetChange
}: ActiveCategoryDisplayProps) => {
  const [availableTargets, setAvailableTargets] = useState<MCPConfigTarget[]>([]);

  // 설정 타겟 로드
  useEffect(() => {
    const loadTargetData = async () => {
      try {
        const storeData = await window.electronAPI.getMCPStore();

        if (storeData) {
          // 사용 가능한 타겟들 로드
          const targets = Object.values(storeData.configTargets || {})
            .filter((target) => !target.delYn)
            .sort((a, b) => a.name.localeCompare(b.name));
          setAvailableTargets(targets);
        }
      } catch (error) {
        console.error("Error loading target data:", error);
      }
    };

    loadTargetData();
  }, []);

  return (
    <Alert variant="info" className="mb-4">
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          {currentCategory ? (
            <>
              <IconComponent
                iconName={currentCategory.icon}
                className="me-3"
                size={24}
              />
              <div>
                <h5 className="mb-1">활성: {currentCategory.name}</h5>
              </div>
            </>
          ) : (
            <div>
              <h5 className="mb-1">활성: 없음</h5>
            </div>
          )}
        </div>
        
        {/* 타겟 선택 */}
        <div className="d-flex align-items-center gap-2">
          <Form.Label htmlFor="target-select" className="mb-0 fw-semibold">
            타겟:
          </Form.Label>
          <Form.Select
            id="target-select"
            value={selectedTarget}
            onChange={(e) => onTargetChange(e.target.value)}
            style={{ width: "200px" }}
          >
            <option value="all">전체</option>
            {availableTargets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.name}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>
    </Alert>
  );
};

export default ActiveCategoryDisplay;
