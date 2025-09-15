// MCPMaintainSetting.tsx - MCP 설정 관리 페이지
import { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import type { MCPConfigTarget } from "../type";
import PageHeader from "../components/shared/PageHeader";
import ConfigTargetManagement from "../components/mcpMaintainSetting/ConfigTargetManagement";

const MCPMaintainSetting = () => {
  const [configTargets, setConfigTargets] = useState<MCPConfigTarget[]>([]);

  // 데이터 로드
  const loadData = async () => {
    try {
      if (typeof (window.electronAPI as any).getMCPConfig !== "function") {
        console.warn("MCP Config API not available");
        return;
      }
      
      // ConfigTarget만 직접 로드
      const targets = await (window.electronAPI as any).getMCPConfig() as MCPConfigTarget[];
      setConfigTargets(targets);

      console.log("- Config targets:", targets);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      toast.error("데이터 로드 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Container>
      <PageHeader title="MCP 설정 관리" subtitle="파일 경로 설정"></PageHeader>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* 설정 타겟 관리 */}
      <ConfigTargetManagement targets={configTargets} onRefresh={loadData} />
    </Container>
  );
};

export default MCPMaintainSetting;
