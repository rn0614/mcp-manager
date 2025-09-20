// ConfigTargetManagement.tsx - 설정 타겟 관리 컴포넌트
import { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Table,
  Badge,
  Modal,
  Form,
} from 'react-bootstrap';
import { Plus, Edit, Trash2, Settings, FolderOpen } from 'lucide-react';
import { toast } from 'react-toastify';
import type { MCPConfigTarget, CreateMCPConfigTarget } from '../../type';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';

const ConfigTargetManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<MCPConfigTarget | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<MCPConfigTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [targets, setTargets] = useState<MCPConfigTarget[]>([]);

  // 데이터 로드
  const loadData = async () => {
    try {
      if (typeof (window.electronAPI as any).getMCPConfig !== "function") {
        console.warn("MCP Config API not available");
        return;
      }
      
      // ConfigTarget만 직접 로드
      const targets = await (window.electronAPI as any).getMCPConfig() as MCPConfigTarget[];
      setTargets(targets);

      console.log("- Config targets:", targets);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      toast.error("데이터 로드 중 오류가 발생했습니다.");
    }
  };
  const [formData, setFormData] = useState<CreateMCPConfigTarget>({
    name: '',
    configPath: '',
    isBuiltIn: false,
  });

  const handleOpenModal = (target?: MCPConfigTarget) => {
    if (target) {
      setEditingTarget(target);
      setFormData({
        name: target.name,
        configPath: target.configPath,
        isBuiltIn: target.isBuiltIn,
      });
    } else {
      setEditingTarget(null);
      setFormData({
        name: '',
        configPath: '',
        isBuiltIn: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTarget(null);
    setFormData({
      name: '',
      configPath: '',
      isBuiltIn: false,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.configPath.trim()) {
      toast.error('표시명과 설정 경로는 필수입니다.');
      return;
    }

    // API 함수 존재 여부 확인
    if (!window.electronAPI) {
      toast.error('ElectronAPI가 로드되지 않았습니다.');
      console.error('window.electronAPI is not available');
      return;
    }

    const electronAPI = window.electronAPI as any;
    if (editingTarget && typeof electronAPI.updateMCPConfigTarget !== 'function') {
      toast.error('updateMCPConfigTarget 함수를 찾을 수 없습니다.');
      console.error('updateMCPConfigTarget function not found');
      return;
    }

    if (!editingTarget && typeof electronAPI.createMCPConfigTarget !== 'function') {
      toast.error('createMCPConfigTarget 함수를 찾을 수 없습니다.');
      console.error('createMCPConfigTarget function not found');
      console.log('Available functions:', Object.keys(electronAPI));
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (editingTarget) {
        // 수정
        result = await electronAPI.updateMCPConfigTarget(
          editingTarget.id,
          formData
        );
      } else {
        // 생성
        result = await electronAPI.createMCPConfigTarget(formData);
      }

      if (result.success) {
        toast.success(
          editingTarget ? '설정 타겟이 수정되었습니다.' : '설정 타겟이 추가되었습니다.'
        );
        handleCloseModal();
        loadData();
      } else {
        toast.error(`작업 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving target:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectFile = async () => {
    try {
      const filePath = await (window.electronAPI as any).selectFile();
      if (filePath) {
        setFormData({ ...formData, configPath: filePath });
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      toast.error('파일 선택 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteClick = (target: MCPConfigTarget) => {
    if (target.isBuiltIn) {
      toast.error('기본 제공 타겟은 삭제할 수 없습니다.');
      return;
    }
    setDeletingTarget(target);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTarget) return;

    // API 함수 존재 여부 확인
    if (!window.electronAPI) {
      toast.error('ElectronAPI가 로드되지 않았습니다.');
      return;
    }

    const electronAPI = window.electronAPI as any;
    if (typeof electronAPI.deleteMCPConfigTarget !== 'function') {
      toast.error('deleteMCPConfigTarget 함수를 찾을 수 없습니다.');
      console.error('deleteMCPConfigTarget function not found');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await electronAPI.deleteMCPConfigTarget(deletingTarget.id);
      if (result.success) {
        toast.success('설정 타겟이 삭제되었습니다.');
        loadData();
        setShowDeleteModal(false);
        setDeletingTarget(null);
      } else {
        toast.error(`삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting target:', error);
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingTarget(null);
  };
  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 d-flex align-items-center">
            <Settings className="me-2" size={20} />
            설정 타겟 관리
          </h5>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenModal()}
            className="d-flex align-items-center"
          >
            <Plus className="me-1" size={16} />
            새 타겟 추가
          </Button>
        </Card.Header>
        <Card.Body>
          {targets.length > 0 ? (
            <Table responsive striped>
              <thead>
                <tr>
                  <th>표시명 (이름)</th>
                  <th style={{ width: '150px' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((target) => (
                  <tr key={target.id}>
                    <td>
                      <strong>{target.name}</strong>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenModal(target)}
                          disabled={target.isBuiltIn}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(target)}
                          disabled={target.isBuiltIn}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted">
              설정된 타겟이 없습니다.
            </div>
          )}
        </Card.Body>
      </Card>

      {/* 타겟 추가/수정 모달 */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingTarget ? '설정 타겟 수정' : '새 설정 타겟 추가'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>표시명 (이름) *</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: VSCode, IntelliJ 등"
                disabled={editingTarget?.isBuiltIn}
              />
              <Form.Text className="text-muted">
                사용자에게 표시될 애플리케이션 이름
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>설정 파일 경로 *</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  value={formData.configPath}
                  onChange={(e) => setFormData({ ...formData, configPath: e.target.value })}
                  placeholder="예: %APPDATA%\MyApp\config.json"
                  disabled={editingTarget?.isBuiltIn}
                />
                <Button
                  variant="outline-primary"
                  onClick={handleSelectFile}
                  size="sm"
                  title="JSON 파일 선택"
                  disabled={editingTarget?.isBuiltIn}
                >
                  <FolderOpen size={14} />
                </Button>
              </div>
              <Form.Text className="text-muted">
                MCP 설정이 저장될 JSON 파일의 경로입니다. %APPDATA% 환경변수를 사용할 수 있습니다.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim() || !formData.configPath.trim()}
          >
            {isSubmitting
              ? (editingTarget ? '수정 중...' : '추가 중...')
              : (editingTarget ? '수정' : '추가')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="타겟 삭제 확인"
        message="타겟을 삭제하시겠습니까?"
        itemName={deletingTarget?.name}
        itemDetails={`설정 파일 경로: ${deletingTarget?.configPath}`}
        isDeleting={isDeleting}
        variant="danger"
      />
    </>
  );
};

export default ConfigTargetManagement;
