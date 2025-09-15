// DeleteConfirmModal.tsx - 공통 삭제 확인 모달 컴포넌트
import { Modal, Button, Alert } from 'react-bootstrap';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  itemDetails?: string;
  isDeleting?: boolean;
  variant?: 'danger' | 'warning';
}

const DeleteConfirmModal = ({
  show,
  onHide,
  onConfirm,
  title,
  message,
  itemName,
  itemDetails,
  isDeleting = false,
  variant = 'danger'
}: DeleteConfirmModalProps) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <Trash2 className="me-2" size={20} />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant={variant} className="mb-3">
          <strong>주의:</strong> 이 작업은 되돌릴 수 없습니다.
        </Alert>
        <p>
          {message}
          {itemName && <strong> "{itemName}"</strong>}
        </p>
        {itemDetails && (
          <p className="text-muted mb-0">
            <small>{itemDetails}</small>
          </p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isDeleting}>
          취소
        </Button>
        <Button 
          variant={variant} 
          onClick={onConfirm}
          disabled={isDeleting}
          className="d-flex align-items-center"
        >
          <Trash2 className="me-1" size={16} />
          {isDeleting ? '삭제 중...' : '삭제'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmModal;
