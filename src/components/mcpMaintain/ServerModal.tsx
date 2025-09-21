// ServerModal.tsx - 서버 추가/편집 모달 컴포넌트
import { Modal, Form, Button, Alert } from "react-bootstrap";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import type { CreateMCPServer, MCPServerConfig, MCPServer } from "../../type";

interface ServerModalProps {
  show: boolean;
  onHide: () => void;
  // 편집 모드일 때만 전달
  editingServer?: MCPServer;
  editingServerId?: string;
  // 성공 콜백
  onSuccess: () => void;
  title?: string;
  submitLabel?: string;
  // 카테고리 선택 관련 props (선택사항)
  showCategorySelect?: boolean;
  selectedCategory?: string;
  categories?: any[];
}

// JSON 파싱 유틸리티 함수들
const parseServerValue = (value: string): MCPServerConfig | null => {
  const trimmedValue = value?.trim() || '';
  if (!trimmedValue || trimmedValue === '{}') {
    return null;
  }
  
  try {
    // 이미 파싱된 객체인지 확인
    if (typeof value === 'object') {
      return value as MCPServerConfig;
    }
    
    // JSON 문자열 파싱
    const parsed = JSON.parse(trimmedValue);
    return parsed as MCPServerConfig;
  } catch (error) {
    console.error('Error parsing server value:', error);
    return null;
  }
};

const formatServerValue = (config: MCPServerConfig | null): string => {
  if (!config) {
    return '';
  }
  
  try {
    return JSON.stringify(config, null, 2);
  } catch (error) {
    console.error('Error formatting server value:', error);
    return '';
  }
};

const ServerModal = ({
  show,
  onHide,
  editingServer,
  editingServerId,
  onSuccess,
  title = "새 MCP 서버 추가",
  submitLabel = "추가",
}: ServerModalProps) => {
  const [jsonError, setJsonError] = useState<string>("");
  const [mcpConfigValue, setMcpConfigValue] = useState<string>("");
  const [serverName, setServerName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 편집 모드인지 확인
  const isEditMode = !!editingServer;

  // 모달이 열릴 때 서버 데이터를 상태에 설정
  useEffect(() => {
    if (show) {
      if (isEditMode && editingServer) {
        // 편집 모드: 기존 서버 데이터 로드
        setServerName(editingServer.name);
        const config = parseServerValue(editingServer.value);
        const formattedValue = formatServerValue(config);
        setMcpConfigValue(formattedValue);
      } else {
        // 추가 모드: 초기값 설정
        setServerName("");
        setMcpConfigValue("");
      }
      setJsonError("");
    }
  }, [show, isEditMode, editingServer]); // 모달이 열릴 때와 편집 서버가 변경될 때 실행

  const handleClose = () => {
    onHide();
    // 모달이 닫힐 때 초기화
    setMcpConfigValue("");
    setServerName("");
    setJsonError("");
    setIsSubmitting(false);
  };

  const validateJson = (value: string): boolean => {
    try {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        setJsonError("");
        return true;
      }
      
      const parsed = JSON.parse(trimmedValue);
      
      // MCPServerConfig 구조 검증
      if (typeof parsed !== 'object' || parsed === null) {
        setJsonError("JSON은 객체 형태여야 합니다.");
        return false;
      }
      
      
      setJsonError("");
      return true;
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : String(error));
      return false;
    }
  };

  const handleSubmit = async () => {
    // 에러 메시지 초기화
    setJsonError("");

    // 서버명 검증
    if (!serverName.trim()) {
      setJsonError("서버명을 입력해주세요.");
      return;
    }

    const jsonValue = mcpConfigValue.trim();

    // JSON 검증
    if (!jsonValue) {
      setJsonError("MCP 설정을 입력해주세요.");
      return;
    }

    // JSON 형식 및 구조 검증
    if (!validateJson(jsonValue)) {
      return; // 검증 실패 시 여기서 중단, 모달은 열린 상태 유지
    }

    try {
      setIsSubmitting(true);

      // JSON 파싱하여 구조 검증
      const parsedConfig = JSON.parse(jsonValue) as MCPServerConfig;
      
      // 정규화된 JSON 문자열로 저장 (이스케이프 문제 해결)
      const normalizedValue = JSON.stringify(parsedConfig);
      
      const serverData: CreateMCPServer = {
        name: serverName.trim(),
        value: normalizedValue,
      };

      console.log("Submitting server data:", serverData);

      if (isEditMode) {
        // 편집 모드
        if (!editingServerId) {
          toast.error("서버 ID가 없습니다.");
          return;
        }

        console.log("Updating server:", editingServerId, "with data:", serverData);
        const result = await window.electronAPI.updateMCPServer(editingServerId, serverData as MCPServer);
        
        if (result.success) {
          console.log("Server updated successfully:", result.server);
          toast.success("서버가 수정되었습니다.");
          onSuccess();
          handleClose();
        } else {
          console.error("Failed to update server:", result.error);
          toast.error(`서버 수정 실패: ${result.error}`);
        }
      } else {
        // 추가 모드
        console.log("Creating server with data:", serverData);
        const result = await window.electronAPI.createMCPServer(serverData as MCPServer);
        
        if (result.success) {
          console.log("Server created successfully:", result.server);
          toast.success("서버가 추가되었습니다.");
          onSuccess();
          handleClose();
        } else {
          console.error("Failed to create server:", result.error);
          toast.error(`서버 생성 실패: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("Error submitting server:", error);
      if (error instanceof SyntaxError) {
        toast.error("유효하지 않은 JSON 형식입니다.");
      } else {
        toast.error(isEditMode ? "서버 수정 중 오류가 발생했습니다." : "서버 추가 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>서버명</Form.Label>
            <Form.Control
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="Framelink Figma MCP"
              disabled={isSubmitting}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>MCP 설정 (JSON)</Form.Label>
            <Form.Control
              as="textarea"
              rows={8}
              value={mcpConfigValue}
              onChange={(e) => setMcpConfigValue(e.target.value)}
              placeholder={`{
  "command": "cmd",
  "args": [
    "/c",
    "npx",
    "-y",
    "figma-developer-mcp",
    "--figma-api-key=MY-key",
    "--stdio"
  ]
}`}
              className="font-monospace"
              disabled={isSubmitting}
            />
            {jsonError && (
              <Alert variant="danger" className="mt-2">
                {jsonError}
              </Alert>
            )}
          </Form.Group>

          <Alert variant="info" className="mt-3">
            <strong>예시:</strong>
            <br />
            서버명: "Framelink Figma MCP"
            <br />
            MCP 설정: JSON 형태로 command와 args를 입력하세요.
          </Alert>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
          취소
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "처리 중..." : submitLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ServerModal;
