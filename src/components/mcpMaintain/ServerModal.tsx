// ServerModal.tsx - 서버 추가/편집 모달 컴포넌트
import { Modal, Form, Button, Alert } from "react-bootstrap";
import { useState, useRef, useEffect } from "react";
import type { CreateMCPServer, MCPServerConfig } from "../../type";

interface ServerModalProps {
  show: boolean;
  onHide: () => void;
  server: CreateMCPServer;
  onServerChange: (server: CreateMCPServer) => void;
  onSubmit: (serverData?: CreateMCPServer) => void;
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
  server,
  onServerChange,
  onSubmit,
  title = "새 MCP 서버 추가",
  submitLabel = "추가",
}: ServerModalProps) => {
  const [jsonError, setJsonError] = useState<string>("");
  const mcpConfigRef = useRef<HTMLTextAreaElement>(null);

  // 모달이 열릴 때만 서버 데이터를 textarea에 설정
  useEffect(() => {
    if (mcpConfigRef.current && show) {
      const config = parseServerValue(server.value);
      mcpConfigRef.current.value = formatServerValue(config);
    }
  }, [show]); // 모달이 열릴 때만 실행

  // 서버 데이터가 변경될 때 (수정 모드에서 다른 서버 선택 시)
  useEffect(() => {
    if (mcpConfigRef.current && show && server) {
      // 현재 textarea에 포커스가 있으면 덮어쓰지 않음
      if (document.activeElement !== mcpConfigRef.current) {
        const config = parseServerValue(server.value);
        mcpConfigRef.current.value = formatServerValue(config);
      }
    }
  }, [server]); // server가 변경될 때만 실행

  const handleClose = () => {
    onHide();
    // 모달이 닫힐 때만 초기화 (onServerChange 호출하지 않음)
    if (mcpConfigRef.current) {
      mcpConfigRef.current.value = "";
    }
    setJsonError("");
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
      
      if (!parsed.command || typeof parsed.command !== 'string') {
        setJsonError("'command' 필드가 필요합니다.");
        return false;
      }
      
      if (!Array.isArray(parsed.args)) {
        setJsonError("'args' 필드는 배열이어야 합니다.");
        return false;
      }
      
      setJsonError("");
      return true;
    } catch (error) {
      setJsonError(error as string);
      return false;
    }
  };

  const handleSubmit = () => {
    // 서버명 검증
    if (!server.name.trim()) {
      setJsonError("서버명을 입력해주세요.");
      return;
    }

    const jsonValue = (mcpConfigRef.current?.value || "").trim();

    // JSON 검증
    if (!jsonValue) {
      setJsonError("MCP 설정을 입력해주세요.");
      return;
    }

    if (!validateJson(jsonValue)) {
      return;
    }

    try {
      // JSON 파싱하여 구조 검증
      const parsedConfig = JSON.parse(jsonValue) as MCPServerConfig;
      
      // 정규화된 JSON 문자열로 저장 (이스케이프 문제 해결)
      const normalizedValue = JSON.stringify(parsedConfig);
      
      const updatedServer = {
        ...server,
        value: normalizedValue,
      };

      console.log("Submitting server data:", updatedServer);
      console.log("Normalized value:", normalizedValue);

      // 상태 업데이트 후 onSubmit 호출
      onServerChange(updatedServer);
      
      // updatedServer 데이터를 직접 전달하여 onSubmit 호출
      if (typeof onSubmit === 'function') {
        onSubmit(updatedServer);
      }
    } catch (error) {
      console.error("JSON parse error:", error);
      setJsonError("유효하지 않은 JSON 형식입니다.");
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
              value={server.name}
              onChange={(e) =>
                onServerChange({ ...server, name: e.target.value })
              }
              placeholder="Framelink Figma MCP"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>MCP 설정 (JSON)</Form.Label>
            <Form.Control
              as="textarea"
              rows={8}
              ref={mcpConfigRef}
              onBlur={(e) => validateJson(e.target.value)}
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
        <Button variant="secondary" onClick={handleClose}>
          취소
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!!jsonError}>
          {submitLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ServerModal;
