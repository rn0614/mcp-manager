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
  const [editingServer, setEditingServer] = useState<any>(null);
  const [editingServerId, setEditingServerId] = useState<string>('');
  const [newServer, setNewServer] = useState({
    name: '',
    value: '{}'
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingServer, setDeletingServer] = useState<MCPServer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 데이터 로드
  const loadData = async () => {
    try {
      if (typeof (window.electronAPI as any).getMCPServer !== 'function') {
        console.warn('MCP Server API not available');
        return;
      }

      // MCPServer만 직접 로드
      const activeServers = await (window.electronAPI as any).getMCPServer() as MCPServer[];
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

  const handleAddServer = async () => {
    if (!newServer.name) {
      toast.error("서버명을 입력해주세요.");
      return;
    }

    const trimmedValue = newServer.value?.trim() || '';
    if (!trimmedValue || trimmedValue === '{}') {
      toast.error("MCP 설정을 입력해주세요.");
      return;
    }

    try {
      // JSON 유효성 검사
      JSON.parse(trimmedValue);
      
      console.log("Creating server with data:", newServer);
      const result = await (window.electronAPI as any).createMCPServer(newServer);
      
      if (result.success) {
        console.log("Server created successfully:", result.server);
        toast.success("서버가 추가되었습니다.");
        setNewServer({ name: '', value: '{}' });
        setShowAddServer(false);
        await loadData();
      } else {
        console.error("Failed to create server:", result.error);
        toast.error(`서버 생성 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("Error adding server:", error);
      if (error instanceof SyntaxError) {
        toast.error("유효하지 않은 JSON 형식입니다.");
      } else {
        toast.error("서버 추가 중 오류가 발생했습니다.");
      }
    }
  };

  const handleEditServer = (server: MCPServer) => {
    // MCPServer를 CreateMCPServer 형태로 변환
    const serverData = {
      name: server.name,
      value: server.value
    };
    setEditingServer(serverData as any);
    setEditingServerId(server.id);
    setShowEditServer(true);
  };

  const handleUpdateServer = async (serverData?: any) => {
    // serverData가 전달되면 그것을 사용하고, 아니면 editingServer 상태 사용
    const dataToUpdate = serverData || editingServer;
    
    console.log("handleUpdateServer called with:", { editingServerId, dataToUpdate });
    
    if (!editingServerId) {
      toast.error("서버 ID가 없습니다.");
      return;
    }

    if (!dataToUpdate.name) {
      toast.error("서버명을 입력해주세요.");
      return;
    }

    const trimmedUpdateValue = dataToUpdate.value?.trim() || '';
    if (!trimmedUpdateValue || trimmedUpdateValue === '{}') {
      toast.error("MCP 설정을 입력해주세요.");
      return;
    }

    try {
      // JSON 유효성 검사
      JSON.parse(trimmedUpdateValue);
      
      console.log("Updating server:", editingServerId, "with data:", dataToUpdate);
      const result = await (window.electronAPI as any).updateMCPServer(editingServerId, dataToUpdate);
      
      if (result.success) {
        console.log("Server updated successfully:", result.server);
        toast.success("서버가 수정되었습니다.");
        setEditingServer(null);
        setEditingServerId('');
        setShowEditServer(false);
        await loadData();
      } else {
        console.error("Failed to update server:", result.error);
        toast.error(`서버 수정 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating server:", error);
      if (error instanceof SyntaxError) {
        toast.error("유효하지 않은 JSON 형식입니다.");
      } else {
        toast.error("서버 수정 중 오류가 발생했습니다.");
      }
    }
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
      const result = await (window.electronAPI as any).deleteMCPServer(deletingServer.id);
      
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
    setNewServer({ name: '', value: '{}' });
    setShowAddServer(true);
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
        server={newServer}
        onServerChange={setNewServer}
        onSubmit={handleAddServer}
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
          server={editingServer}
          onServerChange={(server) => {
            console.log('ServerModal onServerChange called with:', server);
            setEditingServer(server);
          }}
          onSubmit={handleUpdateServer}
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