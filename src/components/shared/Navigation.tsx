// Navigation.tsx - 메인 네비게이션 컴포넌트
import { Nav, Navbar, Container } from "react-bootstrap";
import type { PageType } from "../../type";

interface NavigationProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const pages = [
    { id: 'mcp-maintain' as PageType, label: 'MCP 관리', icon: '🔧' },
    { id: 'mcp-maintain-setting' as PageType, label: 'MCP 설정', icon: '⚙️' },
  ];

  const handlePageChange = (pageId: PageType) => {
    onPageChange(pageId);
  };

  return (
    <Navbar 
      bg="light" 
      fixed="top"
      className="shadow-sm"
      style={{ zIndex: 1000 }}
    >
      <Container>
        <Navbar.Brand href="#" className="fw-bold">
          MCP 관리 도구
        </Navbar.Brand>
        <Nav className="ms-auto">
          {pages.map((page) => (
            <Nav.Link
              key={page.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(page.id);
              }}
              className={`d-flex align-items-center ${
                currentPage === page.id ? 'active fw-bold' : ''
              }`}
              style={{ marginLeft: '1rem' }}
            >
              <span style={{ marginRight: '0.5rem' }}>{page.icon}</span>
              {page.label}
            </Nav.Link>
          ))}
        </Nav>
      </Container>
    </Navbar>
  );
}

export default Navigation;
