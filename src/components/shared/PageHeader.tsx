// PageHeader.tsx - 페이지 헤더 컴포넌트
import type { ReactNode } from "react";
import { Form } from "react-bootstrap";
import type { MCPConfigTarget } from "../../type";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  selectedConfig: string;
  availableTargets: MCPConfigTarget[];
  handleTargetChange: (target: string) => void;
}

const PageHeader = ({
  title,
  subtitle,
  selectedConfig,
  availableTargets,
  handleTargetChange,
}: PageHeaderProps) => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 className="mb-0">{title}</h1>
        {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
      </div>
      {
        <div className="d-flex gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <Form.Label htmlFor="target-select" className="mb-0 fw-semibold">
                타겟:
              </Form.Label>
              <Form.Select
                id="target-select"
                value={selectedConfig}
                onChange={(e) => handleTargetChange(e.target.value)}
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
        </div>
      }
    </div>
  );
};

export default PageHeader;
