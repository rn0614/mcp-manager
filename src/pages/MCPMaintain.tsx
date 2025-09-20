// MCPMaintain.tsx - MCP 관리 메인 페이지 (탭 컨테이너)
import { useState, useEffect } from "react";
import { Container, Tabs, Tab } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import PageHeader from "../components/shared/PageHeader";
import CategoryManagement from "../components/mcpMaintain/CategoryManagement";
import ServerManagement from "../components/mcpMaintain/ServerManagement";
import ClaudePathSettings from "../components/mcpMaintain/ClaudePathSettings";
import type { MCPConfigTarget } from "../type";
import ConfigTargetManagement from "../components/mcpMaintainSetting/ConfigTargetManagement";

const MCPMaintain = () => {
  // 페이지 레벨 상태 - 탭 선택과 타겟 선택만 관리
  const [activeTab, setActiveTab] = useState("categories");
  const [selectedConfig, setSelectedConfig] = useState<string>("all");
  const [availableTargets, setAvailableTargets] = useState<MCPConfigTarget[]>(
    []
  );

  // 설정 타겟 및 선택된 타겟 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const storeData = await window.electronAPI.getMCPStore();

        if (storeData) {
          // 사용 가능한 타겟들 로드
          const targets = Object.values(storeData.configTargets || {})
            .filter((target) => !target.delYn)
            .sort((a, b) => a.name.localeCompare(b.name));
          setAvailableTargets(targets);

          // 선택된 타겟 로드 (없으면 'all' 기본값)
          if (storeData.selectedTarget) {
            setSelectedConfig(storeData.selectedTarget);
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
      console.error("Error saving selected target:", error);
    }
  };

  return (
    <Container>
      <PageHeader title="MCP 관리" selectedConfig={selectedConfig} availableTargets={availableTargets} handleTargetChange={handleTargetChange} />

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

        <Tab eventKey="claude-path" title="Claude 경로 설정">
          <ClaudePathSettings />
        </Tab>

        <Tab eventKey="claude" title="mcp 설정">
          <ConfigTargetManagement />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default MCPMaintain;
