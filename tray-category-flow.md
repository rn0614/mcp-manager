# 시스템 트레이 카테고리 변경 흐름도

## Mermaid.js 다이어그램

```mermaid
sequenceDiagram
    participant User as 사용자
    participant Tray as 시스템 트레이
    participant Main as Main Process
    participant Store as Electron Store
    participant Config as MCP Config File
    participant Renderer as Renderer Process
    participant Hook as useCategoryManagement Hook
    participant Component as CategoryManagement Component

    Note over User, Component: 시스템 트레이에서 카테고리 항목 변경 시 발생하는 코드 흐름

    User->>Tray: 트레이 메뉴에서 카테고리 선택
    Tray->>Main: click: () => switchToCategory(categoryId, target.id)
    
    Note over Main: switchToCategory 함수 실행
    Main->>Store: store.get('mcpStore')
    Store-->>Main: 현재 스토어 데이터 반환
    
    Main->>Store: storeData.activeCategories[target] = categoryId
    Main->>Store: store.set('mcpStore', storeData)
    Store-->>Main: 스토어 업데이트 완료
    
    Note over Main: MCP 설정 파일 업데이트
    Main->>Main: updateMCPConfig(categoryId, target)
    Main->>Store: store.get('mcpStore')
    Store-->>Main: 카테고리 및 서버 정보 반환
    
    Main->>Main: 카테고리 서버 관계 조회<br/>categoryServerRelations 필터링
    Main->>Main: MCP 설정 파일 구조 생성<br/>(mcpServers 객체)
    Main->>Config: fs.writeFile(configPath, JSON.stringify(mcpConfig))
    Config-->>Main: 설정 파일 저장 완료
    
    Main->>Renderer: mainWindow.webContents.send('tray:categoryChanged')
    
    Note over Renderer: 렌더러 프로세스에서 이벤트 수신
    Renderer->>Hook: onTrayCategoryChanged 이벤트 리스너
    Hook->>Hook: handleCategoryChange() 실행
    Hook->>Hook: loadData() 호출
    Hook->>Main: window.electronAPI.getMCPStore()
    Main-->>Hook: 최신 스토어 데이터 반환
    Hook->>Hook: 상태 업데이트 (mcpStore, categories, currentCategory)
    
    Note over Component: UI 컴포넌트 업데이트
    Hook-->>Component: 상태 변경으로 인한 리렌더링
    Component->>Component: 새로운 카테고리 정보 표시
    
    Note over Main: 트레이 메뉴 업데이트 (선택적)
    Main->>Main: updateTrayMenu() 호출
    Main->>Store: store.get('mcpStore')
    Store-->>Main: 최신 카테고리 정보 반환
    Main->>Main: 메뉴 아이템 재구성
    Main->>Tray: tray.setContextMenu(contextMenu)
    Tray-->>User: 업데이트된 트레이 메뉴 표시
```

## 주요 함수 및 역할

### 1. Main Process (main.js)

#### `switchToCategory(categoryId, target)`
- **역할**: 트레이에서 카테고리 변경 시 호출되는 핵심 함수
- **처리 과정**:
  1. 스토어에서 현재 데이터 조회
  2. 활성 카테고리 업데이트
  3. MCP 설정 파일 업데이트
  4. 렌더러에 변경 알림

#### `updateMCPConfig(categoryId, target)`
- **역할**: 실제 MCP 설정 파일을 업데이트
- **처리 과정**:
  1. 카테고리 정보 조회
  2. 카테고리-서버 관계 조회
  3. 서버 설정 및 키 정보 조합
  4. JSON 파일로 저장

#### `updateTrayMenu()`
- **역할**: 트레이 메뉴를 최신 상태로 업데이트
- **처리 과정**:
  1. 스토어에서 카테고리 및 타겟 정보 조회
  2. 각 타겟별 카테고리 메뉴 생성
  3. 라디오 버튼으로 활성 카테고리 표시

### 2. Renderer Process

#### `useCategoryManagement` Hook
- **역할**: 카테고리 관리 상태 및 로직 제공
- **주요 기능**:
  - 트레이 카테고리 변경 이벤트 수신
  - 데이터 리로드 및 상태 업데이트
  - UI 컴포넌트에 상태 제공

#### `CategoryManagement` Component
- **역할**: 카테고리 관리 UI 제공
- **주요 기능**:
  - 서버 변경사항 저장 시 트레이 메뉴 업데이트
  - 모달 닫기 콜백 처리

### 3. 데이터 흐름

1. **사용자 액션**: 트레이 메뉴에서 카테고리 선택
2. **메인 프로세스**: 스토어 업데이트 및 설정 파일 저장
3. **이벤트 전파**: 렌더러 프로세스에 변경 알림
4. **상태 동기화**: Hook에서 데이터 리로드
5. **UI 업데이트**: 컴포넌트 리렌더링
6. **트레이 업데이트**: 메뉴 상태 동기화

### 4. 핵심 데이터 구조

- **MCPStore**: 전체 애플리케이션 상태
- **activeCategories**: 각 타겟별 활성 카테고리
- **categoryServerRelations**: 카테고리-서버 관계
- **serverKeyRelations**: 서버-키 관계
- **MCP Config**: 실제 Claude/Cursor 설정 파일

