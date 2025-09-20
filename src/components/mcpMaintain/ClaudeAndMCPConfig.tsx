// ClaudeAndMCPConfig.tsx - Claude 경로 설정과 MCP 설정 통합 컴포넌트
import ClaudePathSettings from "./ClaudePathSettings";
import ConfigTargetManagement from "../mcpMaintainSetting/ConfigTargetManagement";

const ClaudeAndMCPConfig = () => {
  return (
    <div>
      {/* MCP 설정 타겟 - 위쪽 */}
      <ConfigTargetManagement />
      
      {/* Claude 경로 설정 - 아래쪽 */}
      <ClaudePathSettings />
    </div>
  );
};

export default ClaudeAndMCPConfig;
