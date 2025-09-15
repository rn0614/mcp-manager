// MCPMaintain.tsx - MCP 관리 메인 페이지 (탭 컨테이너)
import { useState, useEffect } from "react";
import { Container, Form, Tabs, Tab } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import PageHeader from "../components/shared/PageHeader";
import CategoryManagement from '../components/mcpMaintain/CategoryManagement';
import ServerManagement from '../components/mcpMaintain/ServerManagement';
import CategoryImport from '../components/mcpMaintain/CategoryImport';
import ClaudeControl from '../components/mcpMaintain/ClaudeControl';
import ClaudePathSettings from '../components/mcpMaintain/ClaudePathSettings';
import type { MCPConfigTarget, MCPStore } from "../type";

const MCPMaintain = () => {
  // 페이지 레벨 상태 - 탭 선택과 타겟 선택만 관리
  const [activeTab, setActiveTab] = useState("categories");
  const [selectedConfig, setSelectedConfig] = useState<string>('all');
  const [availableTargets, setAvailableTargets] = useState<MCPConfigTarget[]>([]);

  // 설정 타겟 및 선택된 타겟 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        if (typeof (window.electronAPI as any).getMCPStore === "function") {
          const storeData: MCPStore = await (window.electronAPI as any).getMCPStore();
          
          if (storeData) {
            // 사용 가능한 타겟들 로드
            const targets = Object.values(storeData.configTargets || {})
              .filter(target => !target.delYn)
              .sort((a, b) => a.name.localeCompare(b.name));
            setAvailableTargets(targets);
            
            // 선택된 타겟 로드 (없으면 'all' 기본값)
            if (storeData.selectedTarget) {
              setSelectedConfig(storeData.selectedTarget);
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  // 타겟 변경 핸들러
  const handleTargetChange = async (newTarget: string) => {
    setSelectedConfig(newTarget);
    
    // 백엔드에 저장
    try {
      if (window.electronAPI && (window.electronAPI as any).setSelectedTarget) {
        await (window.electronAPI as any).setSelectedTarget(newTarget);
      }
    } catch (error) {
      console.error('Error saving selected target:', error);
    }
  };

  return (
    <Container>
      <PageHeader 
        title="MCP 관리" 
      >
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <Form.Label htmlFor="target-select" className="mb-0 fw-semibold">
              타겟:
            </Form.Label>
            <Form.Select
              id="target-select"
              value={selectedConfig}
              onChange={(e) => handleTargetChange(e.target.value)}
              style={{ width: '200px' }}
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
      </PageHeader>

      {/* 탭 네비게이션 */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || "categories")}
        className="mb-4"
      >
        <Tab eventKey="categories" title="카테고리 관리">
          <CategoryManagement selectedTarget={selectedConfig} />
        </Tab>

        <Tab eventKey="servers" title="서버 관리">
          <ServerManagement />
        </Tab>

        <Tab eventKey="import" title="카테고리 가져오기">
          <CategoryImport selectedTarget={selectedConfig === 'all' ? 'claude' : (selectedConfig as 'claude' | 'cursor')} />
        </Tab>

        <Tab eventKey="claude-path" title="Claude 경로 설정">
          <ClaudePathSettings />
        </Tab>

        <Tab eventKey="claude" title="Claude 제어">
          <ClaudeControl />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default MCPMaintain;