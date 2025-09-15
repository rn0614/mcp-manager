// ClaudeControl.tsx - Claude Desktop 전용 제어 컴포넌트
import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Badge, Spinner } from 'react-bootstrap';
import { Play, Square, RotateCcw, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';

interface ClaudeStatus {
  isRunning: boolean;
  pid?: string;
  lastChecked: Date;
}

const ClaudeControl: React.FC = () => {
  const [claudeStatus, setClaudeStatus] = useState<ClaudeStatus>({
    isRunning: false,
    lastChecked: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [claudePath, setClaudePath] = useState('');
  const [showKillModal, setShowKillModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);

  const CLAUDE_PROCESS_NAME = 'claude.exe';

  // Claude 경로 로드
  const loadClaudePath = async () => {
    try {
      const result = await (window.electronAPI as any).loadClaudePath();
      if (result.success) {
        setClaudePath(result.path);
      } else {
        console.error('Failed to load Claude path:', result.error);
        // 기본값 설정
        setClaudePath('C:\\Users\\user\\AppData\\Local\\AnthropicClaude\\claude.exe');
      }
    } catch (error) {
      console.error('Error loading Claude path:', error);
      // 기본값 설정
      setClaudePath('C:\\Users\\user\\AppData\\Local\\AnthropicClaude\\claude.exe');
    }
  };

  // Claude 프로세스 상태 확인
  const checkClaudeStatus = async () => {
    try {
      setIsLoading(true);
      const result = await (window.electronAPI as any).findProcessByName(CLAUDE_PROCESS_NAME);
      
      if (result.success) {
        const isRunning = result.data.includes(CLAUDE_PROCESS_NAME);
        setClaudeStatus({
          isRunning,
          lastChecked: new Date()
        });
      } else {
        setClaudeStatus({
          isRunning: false,
          lastChecked: new Date()
        });
      }
    } catch (error) {
      console.error('Error checking Claude status:', error);
      setClaudeStatus({
        isRunning: false,
        lastChecked: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Claude 실행
  const launchClaude = async () => {
    if (!claudePath) {
      toast.error('Claude 경로가 설정되지 않았습니다. 경로 설정 탭에서 먼저 설정해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await (window.electronAPI as any).launchApplication(claudePath, []);
      
      if (result.success) {
        toast.success(`Claude Desktop이 실행되었습니다. (PID: ${result.pid})`);
        // 잠시 후 상태 확인
        setTimeout(() => {
          checkClaudeStatus();
        }, 2000);
      } else {
        toast.error(`Claude Desktop 실행 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error launching Claude:', error);
      toast.error('Claude Desktop 실행 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Claude 종료
  const killClaude = async () => {
    setShowKillModal(true);
  };

  const handleKillConfirm = async () => {
    try {
      setIsLoading(true);
      const result = await (window.electronAPI as any).killProcessByName(CLAUDE_PROCESS_NAME);
      
      if (result.success) {
        toast.success('Claude Desktop이 종료되었습니다.');
        setClaudeStatus({
          isRunning: false,
          lastChecked: new Date()
        });
        setShowKillModal(false);
      } else {
        toast.error(`Claude Desktop 종료 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error killing Claude:', error);
      toast.error('Claude Desktop 종료 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Claude 재시작
  const restartClaude = async () => {
    setShowRestartModal(true);
  };

  const handleRestartConfirm = async () => {
    if (!claudePath) {
      toast.error('Claude 경로가 설정되지 않았습니다. 경로 설정 탭에서 먼저 설정해주세요.');
      setShowRestartModal(false);
      return;
    }

    try {
      setIsRestarting(true);
      
      // 1. 먼저 종료
      await (window.electronAPI as any).killProcessByName(CLAUDE_PROCESS_NAME);
      
      // 2. 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 3. 재실행
      const result = await (window.electronAPI as any).launchApplication(claudePath, []);
      
      if (result.success) {
        toast.success(`Claude Desktop이 재시작되었습니다. (PID: ${result.pid})`);
        setShowRestartModal(false);
        // 잠시 후 상태 확인
        setTimeout(() => {
          checkClaudeStatus();
        }, 2000);
      } else {
        toast.error(`Claude Desktop 재시작 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error restarting Claude:', error);
      toast.error('Claude Desktop 재시작 중 오류가 발생했습니다.');
    } finally {
      setIsRestarting(false);
    }
  };

  // 초기 상태 확인 및 경로 로드
  useEffect(() => {
    loadClaudePath();
    checkClaudeStatus();
  }, []);

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Claude Desktop 제어</h2>
        <Button 
          variant="outline-primary" 
          onClick={checkClaudeStatus}
          disabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : <RefreshCw size={16} />}
          <span className="ms-1">상태 새로고침</span>
        </Button>
      </div>

      {/* Claude 상태 카드 */}
      <Card className="mb-4">
        <Card.Header>
          <h5>Claude Desktop 상태</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h6 className="mb-1">실행 상태</h6>
              <div className="d-flex align-items-center gap-2">
                <Badge bg={claudeStatus.isRunning ? "success" : "danger"}>
                  {claudeStatus.isRunning ? "실행 중" : "중지됨"}
                </Badge>
                {claudeStatus.pid && (
                  <small className="text-muted">PID: {claudeStatus.pid}</small>
                )}
              </div>
              <small className="text-muted">
                마지막 확인: {claudeStatus.lastChecked.toLocaleTimeString()}
              </small>
            </div>
            
            <div className="text-end">
              <h6 className="mb-1">실행 경로</h6>
              <small className="text-muted font-monospace">
                {claudePath || '경로가 설정되지 않음'}
              </small>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* 제어 버튼들 */}
      <Card>
        <Card.Header>
          <h5>제어 작업</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex gap-3 flex-wrap">
            <Button
              variant="success"
              onClick={launchClaude}
              disabled={isLoading || isRestarting || claudeStatus.isRunning}
              className="d-flex align-items-center"
            >
              <Play size={16} className="me-2" />
              Claude 실행
            </Button>

            <Button
              variant="warning"
              onClick={killClaude}
              disabled={isLoading || isRestarting || !claudeStatus.isRunning}
              className="d-flex align-items-center"
            >
              <Square size={16} className="me-2" />
              Claude 종료
            </Button>

            <Button
              variant="primary"
              onClick={restartClaude}
              disabled={isLoading || isRestarting}
              className="d-flex align-items-center"
            >
              {isRestarting ? (
                <Spinner size="sm" className="me-2" />
              ) : (
                <RotateCcw size={16} className="me-2" />
              )}
              Claude 재시작
            </Button>
          </div>

          {/* 상태별 안내 메시지 */}
          <Alert variant="info" className="mt-3">
            <strong>사용 안내:</strong>
            <ul className="mb-0 mt-2">
              <li>
                <strong>Claude 실행:</strong> Claude Desktop이 실행되지 않은 상태에서만 사용 가능합니다.
              </li>
              <li>
                <strong>Claude 종료:</strong> Claude Desktop이 실행 중일 때만 사용 가능합니다.
              </li>
              <li>
                <strong>Claude 재시작:</strong> 실행 중인 Claude를 종료하고 다시 실행합니다.
              </li>
            </ul>
          </Alert>

          {/* 경로 안내 */}
          <Alert variant="secondary" className="mt-3">
            <strong>참고:</strong> 현재 설정된 Claude Desktop 경로는 <code>{claudePath || '경로가 설정되지 않음'}</code> 입니다.
            <br />
            경로를 변경하려면 "Claude 경로 설정" 탭에서 수정해주세요.
          </Alert>
        </Card.Body>
      </Card>

      {/* Claude 종료 확인 모달 */}
      <DeleteConfirmModal
        show={showKillModal}
        onHide={() => setShowKillModal(false)}
        onConfirm={handleKillConfirm}
        title="Claude Desktop 종료"
        message="Claude Desktop을 종료하시겠습니까?"
        isDeleting={isLoading}
        variant="warning"
      />

      {/* Claude 재시작 확인 모달 */}
      <DeleteConfirmModal
        show={showRestartModal}
        onHide={() => setShowRestartModal(false)}
        onConfirm={handleRestartConfirm}
        title="Claude Desktop 재시작"
        message="Claude Desktop을 재시작하시겠습니까?"
        itemDetails="실행 중인 Claude를 종료하고 다시 실행합니다."
        isDeleting={isRestarting}
        variant="warning"
      />
    </div>
  );
};

export default ClaudeControl;
