// MCPMaintain.tsx - MCP 관리 메인 페이지 (탭 컨테이너)
import { useState } from "react";
import { Container, Tabs, Tab } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import CategoryManagement from "../components/mcpMaintain/CategoryManagement";
import ServerManagement from "../components/mcpMaintain/ServerManagement";
import ClaudeAndMCPConfig from "../components/mcpMaintain/ClaudeAndMCPConfig";

const MCPMaintain = () => {
  // 페이지 레벨 상태 - 탭 선택만 관리
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <Container>
      {/* 탭 네비게이션 */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || "categories")}
        className="mb-4"
      >
        <Tab eventKey="categories" title="카테고리 관리">
          <CategoryManagement />
        </Tab>

        <Tab eventKey="servers" title="서버 관리">
          <ServerManagement />
        </Tab>

        <Tab eventKey="settings" title="설정">
          <ClaudeAndMCPConfig />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default MCPMaintain;
