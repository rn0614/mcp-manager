// CategoryImport.tsx - MCP 설정 파일 가져오기 컴포넌트
import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Alert,
  Badge,
  ListGroup,
  Row,
  Col,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { 
  Upload, 
  FileText, 
  Server,
  Check,
  AlertTriangle,
} from "lucide-react";
import type { CreateMCPCategory } from "../../type";
import EmptyState from '../shared/EmptyState';

interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface ParsedMCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

interface ImportPreview {
  categoryName: string;
  categoryDescription: string;
  categoryIcon: string;
  categoryTarget: string; // 동적 타겟 지원
  servers: {
    name: string;
    command: string;
    args: string[];
    description: string;
    isExisting: boolean;
    existingServerId?: string;
  }[];
}

interface CategoryImportProps {
  selectedTarget: string; // 동적 타겟 지원
}

const CategoryImport = ({ selectedTarget }: CategoryImportProps) => {
  // 컴포넌트 자체 상태 관리
  const [servers, setServers] = useState<any[]>([]);
  const [availableTargets, setAvailableTargets] = useState<any[]>([]);

  // 로컬 상태
  const [mcpConfigText, setMcpConfigText] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState("");

  // 데이터 로드
  const loadData = async () => {
    try {
      if (typeof (window.electronAPI as any).getMCPStore !== 'function') {
        console.warn('MCP Store API not available');
        return;
      }

      const storeData = await (window.electronAPI as any).getMCPStore();
      if (storeData) {
        const activeServers = Object.values(storeData.servers || {})
          .filter((server: any) => !server.delYn);
        
        const targets = Object.values(storeData.configTargets || {})
          .filter((target: any) => !target.delYn)
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        setServers(activeServers);
        setAvailableTargets(targets);
      }
    } catch (error) {
      console.error('Error loading MCP data:', error);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadData();
  }, []);


  // MCP 설정 파일 파싱
  const parseMCPConfig = (configText: string): ParsedMCPConfig | null => {
    try {
      const parsed = JSON.parse(configText);
      
      // MCP 설정 구조 검증
      if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object') {
        throw new Error('유효하지 않은 MCP 설정 형식입니다. "mcpServers" 필드가 필요합니다.');
      }

      return parsed as ParsedMCPConfig;
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  };

  // 기존 서버 검색
  const findExistingServer = (serverName: string, command: string) => {
    return servers.find(server => 
      server.name === serverName || 
      (server.command === command && !server.delYn)
    );
  };

  // 설정 분석 및 미리보기 생성
  const handleAnalyzeConfig = () => {
    if (!mcpConfigText.trim()) {
      setParseError("MCP 설정을 입력해주세요.");
      return;
    }

    setIsProcessing(true);
    setParseError("");

    try {
      const parsedConfig = parseMCPConfig(mcpConfigText);
      
      if (!parsedConfig) {
        setParseError("유효하지 않은 JSON 형식입니다.");
        setIsProcessing(false);
        return;
      }

      const serverEntries = Object.entries(parsedConfig.mcpServers);
      
      if (serverEntries.length === 0) {
        setParseError("MCP 서버가 없습니다.");
        setIsProcessing(false);
        return;
      }

      // 서버 정보 분석
      const analyzedServers = serverEntries.map(([serverName, serverConfig]) => {
        const existingServer = findExistingServer(serverName, serverConfig.command);
        
        return {
          name: serverName,
          command: serverConfig.command,
          args: serverConfig.args || [],
          description: `Imported from MCP config - ${serverConfig.command}`,
          isExisting: !!existingServer,
          existingServerId: existingServer?.id,
        };
      });

      // 기본 카테고리 정보 생성
      const preview: ImportPreview = {
        categoryName: `Imported Category ${new Date().toLocaleDateString()}`,
        categoryDescription: `${analyzedServers.length}개의 MCP 서버를 포함한 가져온 카테고리`,
        categoryIcon: "Layers",
        categoryTarget: selectedTarget === 'all' ? 'all' : selectedTarget, // 동적 타겟 지원
        servers: analyzedServers,
      };

      setImportPreview(preview);
      console.log('Import preview generated:', preview);
    } catch (error) {
      console.error('Analysis error:', error);
      setParseError("설정 분석 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 카테고리 및 서버 생성
  const handleImportCategory = async () => {
    if (!importPreview) return;

    setIsProcessing(true);
    
    try {
      // 1. 카테고리 생성
      const categoryData: CreateMCPCategory = {
        name: importPreview.categoryName,
        description: importPreview.categoryDescription,
        icon: importPreview.categoryIcon,
        target: importPreview.categoryTarget,
        isActive: false,
      };

      console.log('Creating category:', categoryData);
      const categoryResult = await (window.electronAPI as any).createMCPCategory(categoryData);
      
      if (!categoryResult.success) {
        throw new Error(`카테고리 생성 실패: ${categoryResult.error}`);
      }

      const categoryId = categoryResult.category.id;
      console.log('Category created:', categoryId);

      // 2. 서버 생성 및 카테고리에 추가
      let createdCount = 0;
      let addedCount = 0;

      for (const serverInfo of importPreview.servers) {
        let serverId = serverInfo.existingServerId;

        // 기존 서버가 없으면 새로 생성
        if (!serverInfo.isExisting) {
          const serverData = {
            name: serverInfo.name,
            command: serverInfo.command,
            args: serverInfo.args,
            description: serverInfo.description,
          };

          console.log('Creating server:', serverData);
          const serverResult = await (window.electronAPI as any).createMCPServer(serverData);
          
          if (serverResult.success) {
            serverId = serverResult.server.id;
            createdCount++;
            console.log('Server created:', serverId);
          } else {
            console.error('Failed to create server:', serverResult.error);
            continue;
          }
        }

        // 카테고리에 서버 추가
        if (serverId) {
          const addResult = await (window.electronAPI as any).addServerToCategory(
            categoryId, 
            serverId, 
            addedCount
          );
          
          if (addResult.success) {
            addedCount++;
            console.log('Server added to category:', serverId);
          } else {
            console.error('Failed to add server to category:', addResult.error);
          }
        }
      }

      // 성공 메시지
      toast.success(
        `카테고리가 성공적으로 생성되었습니다! ` +
        `(새 서버 ${createdCount}개, 연결된 서버 ${addedCount}개)`
      );

      // 상태 초기화
      setMcpConfigText("");
      setImportPreview(null);
      setParseError("");
      
      // 데이터 새로고침
      await loadData();
      (window.electronAPI as any).updateTrayMenu();
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`가져오기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* 설정 입력 카드 */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0 d-flex align-items-center">
            <Upload className="me-2" size={20} />
            MCP 설정 가져오기
          </h5>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>MCP 설정 파일 내용</Form.Label>
            <Form.Control
              as="textarea"
              rows={12}
              value={mcpConfigText}
              onChange={(e) => setMcpConfigText(e.target.value)}
              placeholder={`MCP 설정 JSON을 붙여넣어주세요. 예시:
{
  "mcpServers": {
    "server-name": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "server-package"]
    },
    "another-server": {
      "command": "python",
      "args": ["-m", "server.module"],
      "env": {
        "API_KEY": "your-key"
      }
    }
  }
}`}
              className="font-monospace"
              disabled={isProcessing}
            />
            {parseError && (
              <Alert variant="danger" className="mt-2">
                <AlertTriangle size={16} className="me-2" />
                {parseError}
              </Alert>
            )}
          </Form.Group>
          
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={handleAnalyzeConfig}
              disabled={isProcessing || !mcpConfigText.trim()}
            >
              <FileText className="me-1" size={16} />
              {isProcessing ? "분석 중..." : "설정 분석"}
            </Button>
            
            {importPreview && (
              <Button
                variant="success"
                onClick={handleImportCategory}
                disabled={isProcessing}
              >
                <Check className="me-1" size={16} />
                {isProcessing ? "가져오는 중..." : "카테고리 생성"}
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* 미리보기 카드 */}
      {importPreview && (
        <Card>
          <Card.Header>
            <h5 className="mb-0 d-flex align-items-center">
              <Server className="me-2" size={20} />
              가져오기 미리보기
            </h5>
          </Card.Header>
          <Card.Body>
            {/* 카테고리 정보 */}
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>카테고리명</Form.Label>
                  <Form.Control
                    type="text"
                    value={importPreview.categoryName}
                    onChange={(e) => setImportPreview({
                      ...importPreview,
                      categoryName: e.target.value
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>대상</Form.Label>
                  <Form.Select
                    value={importPreview.categoryTarget}
                    onChange={(e) => setImportPreview({
                      ...importPreview,
                      categoryTarget: e.target.value
                    })}
                  >
                    <option value="all">All targets</option>
                    {availableTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label>설명</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={importPreview.categoryDescription}
                onChange={(e) => setImportPreview({
                  ...importPreview,
                  categoryDescription: e.target.value
                })}
              />
            </Form.Group>

            {/* 서버 목록 */}
            <h6 className="mb-3">
              포함될 서버 ({importPreview.servers.length}개)
            </h6>
            
            {importPreview.servers.length > 0 ? (
              <ListGroup variant="flush">
                {importPreview.servers.map((server, index) => (
                  <ListGroup.Item key={index}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold d-flex align-items-center">
                          <Server className="me-2" size={16} />
                          {server.name}
                          {server.isExisting && (
                            <Badge bg="warning" className="ms-2">기존 서버</Badge>
                          )}
                          {!server.isExisting && (
                            <Badge bg="success" className="ms-2">신규 생성</Badge>
                          )}
                        </div>
                        <div className="text-muted small font-monospace mt-1">
                          <strong>명령어:</strong> {server.command}
                        </div>
                        {server.args.length > 0 && (
                          <div className="text-muted small font-monospace">
                            <strong>인수:</strong> {server.args.join(' ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <EmptyState
                icon={<Server size={48} />}
                title="서버가 없습니다"
                description="분석된 서버가 없습니다"
              />
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default CategoryImport;
