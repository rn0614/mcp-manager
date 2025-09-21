// ClaudePathSettings.tsx - Claude 경로 설정 컴포넌트
import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Alert, InputGroup, Modal } from 'react-bootstrap';
import { FolderOpen, Check, X, Save, HelpCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const ClaudePathSettings: React.FC = () => {
  const [claudePath, setClaudePath] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Claude 경로 로드
  const loadClaudePath = async () => {
    try {
      setIsLoading(true);
      const result = await window.electronAPI.loadClaudePath();
      
      if (result.success) {
        setClaudePath(result.path || '');
        // 경로가 로드되면 자동으로 검증
        if (result.path) {
          validatePath(result.path);
        }
      } else {
        toast.error(`Claude 경로 로드 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error loading Claude path:', error);
      toast.error('Claude 경로 로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Claude 경로 검증
  const validatePath = async (path: string) => {
    if (!path.trim()) {
      setIsValid(null);
      return;
    }

    try {
      setIsValidating(true);
      const result = await window.electronAPI.validateClaudePath(path);
      
      if (result.success) {
        setIsValid(result.exists || false);
        if (!result.exists) {
          toast.warning('지정된 경로에 파일이 존재하지 않습니다.');
        }
      } else {
        setIsValid(false);
        toast.error(`경로 검증 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error validating Claude path:', error);
      setIsValid(false);
      toast.error('경로 검증 중 오류가 발생했습니다.');
    } finally {
      setIsValidating(false);
    }
  };

  // Claude 경로 저장
  const saveClaudePath = async () => {
    if (!claudePath.trim()) {
      toast.error('Claude 경로를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await window.electronAPI.saveClaudePath(claudePath);
      
      if (result.success) {
        toast.success('Claude 경로가 저장되었습니다.');
        // 저장 후 다시 검증
        validatePath(claudePath);
      } else {
        toast.error(`Claude 경로 저장 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving Claude path:', error);
      toast.error('Claude 경로 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 파일 선택 대화상자 열기
  const selectClaudePath = async () => {
    try {
      const result = await window.electronAPI.selectFile();
      if (result) {
        setClaudePath(result);
        // 선택된 경로 자동 검증
        validatePath(result);
      }
    } catch (error) {
      console.error('Error selecting Claude path:', error);
      toast.error('파일 선택 중 오류가 발생했습니다.');
    }
  };

  // 경로 변경 시 자동 검증 (디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (claudePath.trim()) {
        validatePath(claudePath);
      } else {
        setIsValid(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [claudePath]);

  // 초기 로드
  useEffect(() => {
    loadClaudePath();
  }, []);

  return (
    <div>      {/* Claude 경로 설정 카드 */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Claude Desktop 실행 파일 경로</h5>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowHelpModal(true)}
            className="d-flex align-items-center"
            title="사용 안내"
          >
            <HelpCircle size={16} className="me-1" />
            도움말
          </Button>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Claude Desktop 실행 파일 경로</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                value={claudePath}
                onChange={(e) => setClaudePath(e.target.value)}
                placeholder="C:\Users\user\AppData\Local\AnthropicClaude\claude.exe"
                className="font-monospace"
              />
              <Button 
                variant="outline-secondary" 
                onClick={selectClaudePath}
                disabled={isLoading}
              >
                <FolderOpen size={16} />
              </Button>
            </InputGroup>
            
            {/* 경로 검증 상태 표시 */}
            {claudePath && (
              <div className="mt-2 d-flex align-items-center gap-2">
                {isValidating ? (
                  <div className="d-flex align-items-center gap-1">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">검증 중...</span>
                    </div>
                    <small className="text-muted">검증 중...</small>
                  </div>
                ) : isValid !== null ? (
                  <div className="d-flex align-items-center gap-1">
                    {isValid ? (
                      <>
                        <Check size={16} className="text-success" />
                        <small className="text-success">유효한 경로입니다</small>
                      </>
                    ) : (
                      <>
                        <X size={16} className="text-danger" />
                        <small className="text-danger">파일이 존재하지 않습니다</small>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </Form.Group>

          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={saveClaudePath}
              disabled={isLoading || !claudePath.trim()}
              className="d-flex align-items-center"
            >
              {isLoading ? (
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">저장 중...</span>
                </div>
              ) : (
                <Save size={16} className="me-2" />
              )}
              경로 저장
            </Button>

            <Button
              variant="outline-secondary"
              onClick={() => validatePath(claudePath)}
              disabled={!claudePath.trim() || isValidating}
              className="d-flex align-items-center"
            >
              <Check size={16} className="me-2" />
              경로 검증
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* 도움말 모달 */}
      <Modal show={showHelpModal} onHide={() => setShowHelpModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center">
              <HelpCircle size={20} className="me-2" />
              Claude Desktop 경로 설정 안내
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Claude Desktop 경로 설정 안내:</strong>
            <ul className="mb-0 mt-2">
              <li>
                <strong>기본 경로:</strong> <code>C:\Users\user\AppData\Local\AnthropicClaude\claude.exe</code>
              </li>
              <li>
                <strong>경로 확인:</strong> Windows 탐색기에서 Claude Desktop 설치 폴더를 찾아 <code>claude.exe</code> 파일의 전체 경로를 복사하세요.
              </li>
              <li>
                <strong>파일 선택:</strong> 폴더 아이콘을 클릭하여 파일 선택 대화상자에서 직접 선택할 수 있습니다.
              </li>
              <li>
                <strong>자동 검증:</strong> 경로를 입력하면 자동으로 파일 존재 여부를 확인합니다.
              </li>
            </ul>
          </Alert>

          <Alert variant="warning">
            <strong>주의사항:</strong>
            <ul className="mb-0 mt-2">
              <li>Claude Desktop이 설치되어 있지 않다면 먼저 설치해주세요.</li>
              <li>경로에 한글이나 특수문자가 포함되어 있으면 문제가 발생할 수 있습니다.</li>
              <li>경로를 변경한 후에는 Claude 제어 기능에서 새로운 경로가 적용됩니다.</li>
            </ul>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHelpModal(false)}>
            닫기
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClaudePathSettings;
