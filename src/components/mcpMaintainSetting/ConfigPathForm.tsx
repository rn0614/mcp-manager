// ConfigPathForm.tsx - 설정 파일 경로 폼 컴포넌트
import { Row, Col, Form, Button } from 'react-bootstrap';
import { FolderOpen } from 'lucide-react';
import type { MCPConfigTarget } from '../../type';

interface ConfigPathFormProps {
  configTargets: MCPConfigTarget[];
  onPathChange: (targetId: string, newPath: string) => void;
  onTest: (targetId: string) => void;
}

const ConfigPathForm = ({ configTargets, onPathChange, onTest }: ConfigPathFormProps) => {
  // JSON 파일 선택 다이얼로그 열기
  const handleSelectFile = async (target: MCPConfigTarget) => {
    try {
      const filePath = await window.electronAPI.selectFile();
      if (filePath) {
        onPathChange(target.id, filePath);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  return (
    <>
      <Row>
        {configTargets.map((target, index) => (
          <Col md={6} key={target.id} className={index % 2 === 0 ? '' : 'mb-3'}>
            <Form.Group className="mb-3">
              <Form.Label>{target.name}</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  value={target.configPath || ''}
                  onChange={(e) => onPathChange(target.id, e.target.value)}
                  placeholder={`${target.name} 설정 파일 경로`}
                />
                <Button
                  variant="outline-primary"
                  onClick={() => handleSelectFile(target)}
                  size="sm"
                  title="JSON 파일 선택"
                >
                  <FolderOpen size={14} />
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => onTest(target.id)}
                  size="sm"
                >
                  테스트
                </Button>
              </div>
            </Form.Group>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default ConfigPathForm;
