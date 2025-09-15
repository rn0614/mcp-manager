// PageHeader.tsx - 페이지 헤더 컴포넌트
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

const PageHeader = ({ title, subtitle, children }: PageHeaderProps) => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 className="mb-0">{title}</h1>
        {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
      </div>
      {children && (
        <div className="d-flex gap-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
