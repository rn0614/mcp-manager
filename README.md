## 해결하고자 한 문제
사용하는 MCP가 늘어나면서 MCP를 항상켜놓으면 잘못된 MCP를 사용하거나 일부 상황에서만 쓰는 MCP가 겹치면서 잘못된 사용이 존재함.
수동으로 MCP설정에 추가/삭제하는 것에 대한 부담이 있음.
이를 해결하기 위해서 카테고리를 통해 MCP서버를 효율적으로 관리하는 프로그램을 제작하였음.
특히, 나의 경우는 Blender, n8n, figma 등도 같이 사용하는데 blender를 사용할 땐 claude-desktop에서 blender-desktop만 사용해야하는데 따른 키를 사용하는 문제가 발생하고 있음.

## 핵심 기능
- 설정단 : mcp를 사용하는 ide나 응용프로그램의 mcp를 저장하는 경로 설정(vscode, cursor, claude-desktop 등 )
- 서버단 : 사용하는 mcp서버를 모음
- 카테고리단 : mcp들의 그룹별 카테고리 작성
- SYSTEM TRAY를 통해서 손쉽게 변형가능

## 사용방법
### 0. 프로젝트 다운로드 후 빌드
```bash
npm install
npm run electron-dev
```
실행시 dist-electron에서 MCP Manager.exe 파일생성됨
<img width="679" height="647" alt="image" src="https://github.com/user-attachments/assets/145fa181-9183-4dc6-ab6e-bb50bb2ab7ab" />


### 1. MCP를 사용하는 프로그램에 대한 경로 설정
> 아래는 자주 사용하는 cursor와 claude_desktop 의 설정 json위치를 파일경로로 정의
> 우측 상단 mcp설정 클릭, 이후 새 타겟추가 하고 표시명(영문) 으로 작성
> <img width="479" height="639" alt="image" src="https://github.com/user-attachments/assets/6b0b29ea-44a7-4709-aba1-31c80aa7b061" />


### 2. MCP를 사용하는 프로그램에 대한 경로 설정
### 2-1. 각자 생성
서버 관리에서 서버 추가 하여 개별생성
<img width="479" height="610" alt="image" src="https://github.com/user-attachments/assets/7a897600-8b8b-49c3-82ea-b06baf41a375" />



카테고리 관리에서 신규 카테고리 추가 생성 / 카테고리 추가
생성한 카테고리에서 서버를 추가 생성하기  
<img width="476" height="616" alt="image" src="https://github.com/user-attachments/assets/52857228-1ea6-4490-8b50-e043b715e06a" />




### 시스템 트레이 사용
<img width="407" height="389" alt="화면 캡처 2025-09-20 221450" src="https://github.com/user-attachments/assets/ff3bc66e-adcd-42f3-9fd0-87d3fe8757ba" />





### claude-desktop 자동 재실행
cluade-desktop의 경우 현재 바꿔도 바로 적용이 안된다.
이것을 해결하기 위해 설정 변경시 claude-desktop이 켜져 있으면 claude-desktop이 자동으로 재부팅된다.
![Animation](https://github.com/user-attachments/assets/9912ece5-e7a1-4be3-990e-eac380756e65)


**해결하는 문제:**
- 개발 작업 시 필요한 MCP 도구와 일반 작업용 MCP 도구를 구분하여 사용
- 매번 설정 파일을 열어서 수정하는 번거로움 제거
- 다양한 작업 환경에 맞는 MCP 설정을 미리 준비해두고 필요할 때 즉시 전환



## 📁 프로젝트 구조

```
src/
├── components/           # 재사용 가능한 컴포넌트
│   ├── shared/          # 공통 컴포넌트
│   ├── mcpMaintain/     # MCP 관리 관련 컴포넌트
│   └── mcpMaintainSetting/ # 설정 관련 컴포넌트
├── pages/               # 페이지 컴포넌트
│   ├── MCPMaintain.tsx  # 메인 MCP 관리 페이지
│   └── MCPMaintainSetting.tsx # 설정 페이지
├── data/                # 샘플 데이터
├── type.ts              # TypeScript 타입 정의
└── App.tsx              # 메인 앱 컴포넌트
```

## 🔧 설정

### MCP 설정 파일 경로
- **Claude Desktop**: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- **Cursor**: `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\mcp_config.json` (Windows)

### 데이터 저장 위치
- **Windows**: `%APPDATA%\mcp-manager\config.json`
- **macOS**: `~/Library/Application Support/mcp-manager/config.json`
- **Linux**: `~/.config/mcp-manager/config.json`

## 🚨 주의사항

1. **API 키 보안**: 민감한 API 키는 "비밀" 옵션을 체크하여 마스킹 처리됩니다
2. **설정 파일 백업**: 중요한 MCP 설정은 별도로 백업해두세요
3. **경로 설정**: Claude Desktop과 Cursor의 설정 파일 경로를 정확히 설정해야 합니다


## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

사용라이브러리
    "@types/file-saver": "^2.0.7",
    "@types/fs-extra": "^11.0.4",
    "bootstrap": "^5.3.8",
    "cross-env": "^10.0.0",
    "electron-store": "^10.1.0",
    "file-saver": "^2.0.5",
    "fs-extra": "^11.3.1",
    "lucide-react": "^0.544.0",
    "react": "^19.1.1",
    "react-bootstrap": "^2.10.10",
    "react-dom": "^19.1.1",
    "react-toastify": "^11.0.5",
    "xlsx": "^0.18.5",
    "zustand": "^5.0.8"

## 📞 지원

문제가 발생하거나 기능 요청이 있으시면 GitHub Issues를 통해 알려주세요.


