// ServerManageModal.tsx - 서버 관리 모달 컴포넌트
import { useState, useEffect } from 'react';
import { Modal, Button, ListGroup, Alert } from 'react-bootstrap';
import { Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import type { MCPCategory, MCPServer } from '../../type';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';

interface ServerManageModalProps {
  show: boolean;
  onHide: () => void;
  selectedCategory: string;
  categories: MCPCategory[];
  servers: MCPServer[];
  categoryServers: MCPServer[];
  onSaveChanges: (categoryId: string, serverIds: string[]) => Promise<{ success: boolean; error?: string }>;
}

const ServerManageModal = ({
  show,
  onHide,
  selectedCategory,
  categories,
  servers,
  categoryServers,
  onSaveChanges,
}: ServerManageModalProps) => {
  // 로컬 상태로 현재 카테고리의 서버 목록 관리
  const [localCategoryServerIds, setLocalCategoryServerIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const currentCategory = categories.find((c) => c.id === selectedCategory);

  // 모달이 열릴 때 초기 서버 목록 설정
  useEffect(() => {
    if (show && categoryServers) {
      const initialServerIds = categoryServers.map(server => server.id);
      setLocalCategoryServerIds(initialServerIds);
      setHasChanges(false);
    }
  }, [show, categoryServers]);

  // 현재 로컬 상태의 서버들
  const currentLocalServers = localCategoryServerIds
    .map(serverId => servers.find(server => server.id === serverId))
    .filter(Boolean) as MCPServer[];

  // 추가 가능한 서버들
  const availableServers = servers.filter(
    (server) => !localCategoryServerIds.includes(server.id)
  );

  // 서버 추가
  const handleAddServer = (serverId: string) => {
    setLocalCategoryServerIds(prev => [...prev, serverId]);
    setHasChanges(true);
  };

  // 서버 제거
  const handleRemoveServer = (serverId: string) => {
    setLocalCategoryServerIds(prev => prev.filter(id => id !== serverId));
    setHasChanges(true);
  };

  // 변경사항 저장
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const result = await onSaveChanges(selectedCategory, localCategoryServerIds);
      if (result.success) {
        toast.success('서버 설정이 저장되었습니다.');
        setHasChanges(false);
      } else {
        toast.error(`저장 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 변경사항 초기화
  const handleResetChanges = () => {
    const initialServerIds = categoryServers.map(server => server.id);
    setLocalCategoryServerIds(initialServerIds);
    setHasChanges(false);
  };

  // 모달 닫기
  const handleClose = () => {
    if (hasChanges) {
      setShowCloseModal(true);
    } else {
      onHide();
    }
  };

  const handleCloseConfirm = () => {
    onHide();
    // 다음 열기를 위해 상태 초기화
    setTimeout(() => {
      const initialServerIds = categoryServers.map(server => server.id);
      setLocalCategoryServerIds(initialServerIds);
      setHasChanges(false);
    }, 300);
    setShowCloseModal(false);
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>서버 관리 - {currentCategory?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {hasChanges && (
          <Alert variant="info" className="mb-3">
            <div className="d-flex align-items-center justify-content-between">
              <span>변경사항이 있습니다. 저장하거나 취소하세요.</span>
              <Button
                variant="outline-info"
                size="sm"
                onClick={handleResetChanges}
                className="d-flex align-items-center"
              >
                <RotateCcw className="me-1" size={14} />
                취소
              </Button>
            </div>
          </Alert>
        )}
        
        {selectedCategory && (
          <div>
            {/* 현재 카테고리의 서버들 */}
            <div className="mb-4">
              <h6 className="text-muted mb-2">현재 서버들 ({currentLocalServers.length}개)</h6>
              {currentLocalServers.length > 0 ? (
                <ListGroup variant="flush">
                  {currentLocalServers.map((server) => (
                    <ListGroup.Item
                      key={server.id}
                      className="d-flex justify-content-between align-items-start"
                    >
                      <div className="ms-2 me-auto">
                        <div className="fw-bold">{server.name}</div>
                        <div className="text-muted small font-monospace">
                          {server.value}
                        </div>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveServer(server.id)}
                        disabled={isSaving}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted small">서버가 없습니다</p>
              )}
            </div>

            {/* 추가할 수 있는 서버들 */}
            <div>
              <h6 className="text-muted mb-2">추가할 수 있는 서버들 ({availableServers.length}개)</h6>
              {availableServers.length > 0 ? (
                <ListGroup variant="flush">
                  {availableServers.map((server) => (
                    <ListGroup.Item
                      key={server.id}
                      className="d-flex justify-content-between align-items-start"
                    >
                      <div className="ms-2 me-auto">
                        <div className="fw-bold">{server.name}</div>
                        <div className="text-muted small font-monospace">
                          {server.value}
                        </div>
                      </div>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleAddServer(server.id)}
                        disabled={isSaving}
                      >
                        <Plus size={12} />
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted small">
                  추가할 수 있는 서버가 없습니다
                </p>
              )}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            닫기
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveChanges}
            disabled={!hasChanges || isSaving}
            className="d-flex align-items-center"
          >
            <Save className="me-1" size={16} />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </Modal.Footer>

      {/* 닫기 확인 모달 */}
      <DeleteConfirmModal
        show={showCloseModal}
        onHide={() => setShowCloseModal(false)}
        onConfirm={handleCloseConfirm}
        title="변경사항 확인"
        message="저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?"
        variant="warning"
      />
    </Modal>
  );
};

export default ServerManageModal;
