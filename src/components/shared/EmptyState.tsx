// EmptyState.tsx - 빈 상태 컴포넌트
import { Button } from 'react-bootstrap';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon, title, description, actionLabel, onAction }: EmptyStateProps) => {
  return (
    <div className="text-center py-5">
      <div className="text-muted mb-3">
        {icon}
      </div>
      <h5>{title}</h5>
      <p className="text-muted mb-3">{description}</p>
      {actionLabel && onAction && (
        <Button
          variant="primary"
          onClick={onAction}
          className="d-flex align-items-center mx-auto"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
