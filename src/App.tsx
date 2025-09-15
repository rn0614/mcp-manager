// App.tsx - 메인 라우터
import { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import type { PageType } from "./type";
import Navigation from "./components/shared/Navigation";
import MCPMaintain from "./pages/MCPMaintain";
import MCPMaintainSetting from "./pages/MCPMaintainSetting";
import { initializeSampleData } from "./data/sampleData";
import DeleteConfirmModal from "./components/shared/DeleteConfirmModal";

// 개발 환경에서 mockAPI 즉시 로드
if (import.meta.env.DEV) {
  import('./utils/mockElectronAPI');
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('mcp-maintain');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSampleDataModal, setShowSampleDataModal] = useState(false);
  const [isInitializingSampleData, setIsInitializingSampleData] = useState(false);
  const initializationRef = useRef(false);

  // 앱 초기화
  useEffect(() => {
    const initializeApp = async () => {
      // 이미 초기화된 경우 중복 실행 방지
      if (initializationRef.current) {
        console.log('Initialization already completed, skipping...');
        return;
      }
      
      initializationRef.current = true;
      try {
        // 개발 환경에서 mockAPI 상태 확인
        if (import.meta.env.DEV) {
          console.log('Development mode detected');
          console.log('window.electronAPI available:', !!window.electronAPI);
          if (window.electronAPI) {
            console.log('ElectronAPI functions:', Object.keys(window.electronAPI as any));
          }
        }
        // API 사용 가능 여부 확인
        if (typeof (window.electronAPI as any).getMCPStore !== "function") {
          console.warn("MCP Store API not available");
          toast.warning("MCP Store API가 아직 로드되지 않았습니다.");
          return;
        }

        // 스토어 데이터 로드
        const storeData = await (window.electronAPI as any).getMCPStore();
        console.log("App initialized - Loaded store data:", storeData);

        // 스토어가 비어있거나 카테고리가 없으면 샘플 데이터 추가 여부 확인
        const hasCategories =
          storeData?.categories && Object.keys(storeData.categories).length > 0;
        console.log(
          "Has categories:",
          hasCategories,
          "Categories count:",
          storeData?.categories ? Object.keys(storeData.categories).length : 0
        );

        if (!hasCategories) {
          console.log("No categories found, showing sample data modal...");
          setShowSampleDataModal(true);
        } else {
          console.log("Existing data loaded");
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("App 초기화 실패:", error);
        toast.error("앱 초기화 중 오류가 발생했습니다.");
        setIsInitialized(true); // 오류가 있어도 앱은 계속 실행
        initializationRef.current = false; // 오류 시 재시도 가능하도록
      }
    };

    initializeApp();
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 샘플 데이터 초기화 확인
  const handleSampleDataConfirm = async () => {
    try {
      setIsInitializingSampleData(true);
      await initializeSampleData();
      console.log("Sample data loaded successfully");
      toast.success("샘플 데이터가 추가되었습니다.");
      setShowSampleDataModal(false);
    } catch (initError) {
      console.error("Sample data initialization failed:", initError);
      toast.error("샘플 데이터 추가에 실패했습니다. 콘솔을 확인해주세요.");
    } finally {
      setIsInitializingSampleData(false);
    }
  };

  // 샘플 데이터 초기화 취소
  const handleSampleDataCancel = () => {
    console.log("User declined to add sample data");
    toast.info("샘플 데이터 없이 시작합니다. 설정에서 직접 추가할 수 있습니다.");
    setShowSampleDataModal(false);
  };

  const renderPage = () => {
    if (!isInitialized) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5>앱 초기화 중...</h5>
            <p className="text-muted">MCP 데이터를 로드하고 있습니다.</p>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'mcp-maintain':
        return <MCPMaintain />;
      case 'mcp-maintain-setting':
        return <MCPMaintainSetting />;
      default:
        return <MCPMaintain />;
    }
  };

  return (
    <div className="App">
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />
      
      {/* 네비게이션 아래 콘텐츠 영역 */}
      <div style={{ paddingTop: '80px', paddingBottom: '20px' }}>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        {renderPage()}
      </div>

      {/* 샘플 데이터 초기화 확인 모달 */}
      <DeleteConfirmModal
        show={showSampleDataModal}
        onHide={handleSampleDataCancel}
        onConfirm={handleSampleDataConfirm}
        title="샘플 데이터 추가"
        message="MCP 데이터가 없습니다. 샘플 데이터를 추가하시겠습니까?"
        itemDetails="• 개발용 MCP 서버들 (filesystem, supabase, sqlite, github, brave-search)&#10;• 카테고리들 (개발, 일반, 데이터분석, 데이터베이스)&#10;• Claude Desktop, Cursor 설정 타겟"
        isDeleting={isInitializingSampleData}
        variant="warning"
      />
    </div>
  );
}

export default App;
