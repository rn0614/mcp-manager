// CategoryModal.tsx - 카테고리 추가/편집 모달 컴포넌트
import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import type { CreateMCPCategory, MCPConfigTarget } from '../../type';

interface CategoryModalProps {
  show: boolean;
  onHide: () => void;
  category: CreateMCPCategory;
  onCategoryChange: (category: CreateMCPCategory) => void;
  onSubmit: () => void;
  title?: string;
  isSubmitting?: boolean;
}

const CategoryModal = ({
  show,
  onHide,
  category,
  onCategoryChange,
  onSubmit,
  title = "새 카테고리 추가",
  isSubmitting = false
}: CategoryModalProps) => {
  const [availableTargets, setAvailableTargets] = useState<MCPConfigTarget[]>([]);

  // 타겟 목록 로드
  useEffect(() => {
    const loadTargets = async () => {
      try {
        if (typeof (window.electronAPI as any).getMCPStore !== 'function') {
          console.warn('MCP Store API not available');
          return;
        }

        const storeData = await (window.electronAPI as any).getMCPStore();
        if (storeData) {
          const targets = Object.values(storeData.configTargets || {})
            .filter((target: any) => !target.delYn)
            .sort((a: any, b: any) => a.name.localeCompare(b.name)) as MCPConfigTarget[];
          
          setAvailableTargets(targets);
        }
      } catch (error) {
        console.error('Error loading targets:', error);
      }
    };

    if (show) {
      loadTargets();
    }
  }, [show]);

  const handleClose = () => {
    onHide();
    onCategoryChange({ name: '', description: '', icon: 'Layers', target: 'all', isActive: false });
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>카테고리 이름</Form.Label>
            <Form.Control
              type="text"
              value={category.name}
              onChange={(e) => onCategoryChange({...category, name: e.target.value})}
              placeholder="개발, 데이터분석 등"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>아이콘</Form.Label>
            <Form.Select
              value={category.icon}
              onChange={(e) => onCategoryChange({...category, icon: e.target.value})}
            >
              <option value="Code">Code</option>
              <option value="Database">Database</option>
              <option value="Globe">Globe</option>
              <option value="Layers">Layers</option>
              <option value="Settings">Settings</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>대상</Form.Label>
            <Form.Select
              value={category.target}
              onChange={(e) => onCategoryChange({...category, target: e.target.value})}
            >
              <option value="all">All targets</option>
              {availableTargets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>설명</Form.Label>
            <Form.Control
              type="text"
              value={category.description}
              onChange={(e) => onCategoryChange({...category, description: e.target.value})}
              placeholder="카테고리 설명"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          취소
        </Button>
        <Button 
          variant="primary" 
          onClick={onSubmit}
          disabled={isSubmitting || !category.name.trim()}
        >
          추가
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CategoryModal;
