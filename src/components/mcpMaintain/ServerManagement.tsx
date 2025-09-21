// ServerManagement.tsx - 서버 관리 컴포넌트
import { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  ListGroup, 
  Badge
} from 'react-bootstrap';
import { 
  Plus, 
  Trash2, 
  Edit,
  Server
} from 'lucide-react';
import { toast } from 'react-toastify';
import type { MCPServer } from '../../type';
import ServerModal from './ServerModal';
import EmptyState from '../shared/EmptyState';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';

// 컴포넌트 자체 상태 관리
const ServerManagement = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [showAddServer, setShowAddServer] = useState(false);
  const [showEditServer, setShowEditServer] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null);
  const [editingServerId, setEditingServerId] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingServer, setDeletingServer] = useState<MCPServer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 데이터 로드
  const loadData = async () => {
    try {
      // MCPServer만 직접 로드
      const activeServers = await window.electronAPI.getMCPServer();
      console.log('getMCPServer',activeServers);
      setServers(activeServers);
    } catch (error) {
      console.error('Error loading MCP servers:', error);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadData();
  }, []);


  const handleEditServer = (server: MCPServer) => {
    setEditingServer(server);
    setEditingServerId(server.id);
    setShowEditServer(true);
  };


  const handleDeleteServer = async (server: MCPServer) => {
    if (!server.id) {
      toast.error("서버 ID가 없습니다.");
      return;
    }
    setDeletingServer(server);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingServer?.id) return;

    try {
      setIsDeleting(true);
      console.log("Deleting server:", deletingServer.id);
      const result = await window.electronAPI.deleteMCPServer(deletingServer.id);
      
      if (result.success) {
        console.log("Server deleted successfully");
        toast.success("서버가 삭제되었습니다.");
        await loadData();
        setShowDeleteModal(false);
        setDeletingServer(null);
      } else {
        console.error("Failed to delete server:", result.error);
        toast.error(`서버 삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting server:", error);
      toast.error("서버 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const openServerModal = () => {
    setShowAddServer(true);
  };

  const handleModalSuccess = async () => {
    await loadData();
  };

  return (
    <div>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 d-flex align-items-center">
            <Server className="me-2" size={20} />
            MCP 서버 관리
          </h5>
          <div className="d-flex gap-2">
            <Badge bg="info">{servers.length}개</Badge>
            <Button
              variant="primary"
              size="sm"
                onClick={openServerModal}
            >
              <Plus className="me-1" size={16} />
              서버 추가
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {servers.length > 0 ? (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <ListGroup variant="flush">
                {servers.map((server) => (
                  <ListGroup.Item
                    key={server.id}
                    className="d-flex justify-content-between align-items-start"
                  >
                    <div className="ms-2 me-auto">
                      <div className="fw-bold d-flex align-items-center">
                        {server.name}
                        {server.delYn && (
                          <Badge bg="secondary" className="ms-2">삭제됨</Badge>
                        )}
                      </div>
                      <small className="text-muted">
                        {(() => {
                          try {
                            const parsed = JSON.parse(server.value || '{}');
                            return parsed.description || '';
                          } catch (error) {
                            return '';
                          }
                        })()}
                      </small>
                      <div className="text-muted small mt-1">
                        <strong>버전:</strong> {server.version} | 
                        <strong> 생성일:</strong> {new Date(server.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEditServer(server)}
                        disabled={server.delYn}
                      >
                        <Edit size={12} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteServer(server)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          ) : (
            <EmptyState
              icon={<Server size={48} />}
              title="서버가 없습니다"
              description="첫 번째 MCP 서버를 추가해보세요"
              actionLabel="서버 추가"
              onAction={openServerModal}
            />
          )}
        </Card.Body>
      </Card>

      {/* 서버 추가 모달 */}
      <ServerModal
        show={showAddServer}
        onHide={() => setShowAddServer(false)}
        onSuccess={handleModalSuccess}
        title="새 MCP 서버 추가"
        submitLabel="추가"
      />

      {/* 서버 편집 모달 */}
      {editingServer && (
        <ServerModal
          show={showEditServer}
          onHide={() => {
            setShowEditServer(false);
            setEditingServer(null);
            setEditingServerId('');
          }}
          editingServer={editingServer}
          editingServerId={editingServerId}
          onSuccess={handleModalSuccess}
          title="서버 편집"
          submitLabel="수정"
        />
      )}

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeletingServer(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="서버 삭제 확인"
        message="이 서버를 삭제하시겠습니까?"
        itemName={deletingServer?.name}
        itemDetails={deletingServer ? `설정: ${deletingServer.value}` : undefined}
        isDeleting={isDeleting}
        variant="danger"
      />
    </div>
  );
};

export default ServerManagement;