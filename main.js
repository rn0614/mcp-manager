import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import Store from 'electron-store';
import { spawn, exec, execFile } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';
const execAsync = promisify(exec);


// 1) 포터블 데이터 폴더 지정 (실행 파일 옆 ./data)
const baseDir =
  process.env.PORTABLE_EXECUTABLE_DIR      // electron-builder portable가 설정해줌
  || path.dirname(process.execPath);       // exe가 있는 폴더
const dataDir = path.join(baseDir, 'data');
fs.ensureDirSync(dataDir);

app.setPath('userData', dataDir);        // <-- Store가 이 경로를 사용하게 됨

// 트레이 관련 변수
let tray = null;
let mainWindow = null;

// 앱 종료 상태 플래그
app.isQuiting = false;

let store;    // 인스턴스

// promisify exec 함수

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 800,
    icon: path.join(__dirname, 'public/favicon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  // 창 닫기 이벤트 처리 - 트레이로 숨기기
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      
      // 트레이 알림 표시 (선택사항)
      if (tray) {
        tray.displayBalloon({
          iconType: 'info',
          title: 'MCP 관리 도구',
          content: '앱이 시스템 트레이로 최소화되었습니다.'
        });
      }
    }
  });

  // Content Security Policy 설정
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:*;"
        ]
      }
    });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, 'dist/index.html');
    console.log('Loading production file:', indexPath);
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err);
      // 폴백: 상대 경로로 시도
      const fallbackPath = path.join(__dirname, '..', 'dist', 'index.html');
      console.log('Trying fallback path:', fallbackPath);
      mainWindow.loadFile(fallbackPath);
    });
  }

  // 트레이 생성
  createTray();
}

// ==================== DIALOG 관련 핸들러 ====================
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:selectFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result.canceled ? null : result.filePaths[0];
});


// ==================== SETTINGS 관련 핸들러 ====================
ipcMain.handle('settings:save', async (event, settings) => {
  try {
    store.set('userSettings', settings);
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
});

ipcMain.handle('settings:load', async () => {
  try {
    return store.get('userSettings', {
      selectedFolder: '',
      cellRules: [],
      lastUsedFiles: []
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    throw error;
  }
});


// ==================== MCP CONFIG 파일 관련 핸들러 ====================
ipcMain.handle('mcp:readConfig', async (event, filePath) => {
  try {
    const expandedPath = filePath.replace(/%APPDATA%/g, process.env.APPDATA || '');
    const configData = await fs.readFile(expandedPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error reading MCP config:', error);
    return null;
  }
});

ipcMain.handle('mcp:writeConfig', async (event, filePath, config) => {
  try {
    const expandedPath = filePath.replace(/%APPDATA%/g, process.env.APPDATA || '');
    
    // 디렉토리가 존재하지 않으면 생성
    const dir = path.dirname(expandedPath);
    await fs.ensureDir(dir);
    
    // 설정 파일 저장
    await fs.writeFile(expandedPath, JSON.stringify(config, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error writing MCP config:', error);
    return { success: false, error: error.message };
  }
});

// ==================== MCP STORE 관련 핸들러 ====================
// Store 변경 이벤트 전송 함수
function notifyStoreChange(changeType, data = null) {
  if (mainWindow) {
    mainWindow.webContents.send('mcp:storeChanged', {
      type: changeType,
      data: data,
      timestamp: new Date()
    });
  }
}

// ConfigTarget만 가져오는 전용 핸들러
ipcMain.handle('mcp:getMCPConfig', async () => {
  try {
    const storeData = store.get('mcpStore');
        
    const configTargets = storeData?.configTargets || {};
    
    // 삭제되지 않은 ConfigTarget만 반환
    return Object.values(configTargets).filter(target => !target.delYn);
  } catch (error) {
    console.error('Error getting MCP config:', error);
    return [];
  }
});

// MCPServer만 가져오는 전용 핸들러
ipcMain.handle('mcp:getMCPServer', async () => {
  try {
    const storeData = store.get('mcpStore');
    const servers = storeData?.servers || {};
    
    // 삭제되지 않은 MCPServer만 반환 (value 그대로)
    return Object.values(servers)
      .filter(server => !server.delYn);
  } catch (error) {
    console.error('Error getting MCP servers:', error);
    return [];
  }
});

ipcMain.handle('mcp:getMCPStore', async () => {
  try {
    const storeData = store.get('mcpStore');
    
    return storeData || {
      servers: {},
      keys: {},
      categories: {},
      configTargets: {},
      categoryServerRelations: {},
      serverKeyRelations: {},
      activeCategories: {},
      configPaths: {},
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date()
      }
    };
  } catch (error) {
    console.error('Error getting MCP store:', error);
    return null;
  }
});

ipcMain.handle('mcp:saveMCPStore', async (event, storeData) => {
  try {
    store.set('mcpStore', storeData);
    notifyStoreChange('storeUpdated', storeData);
    return { success: true };
  } catch (error) {
    console.error('Error saving MCP store:', error);
    return { success: false, error: error.message };
  }
});

// 스토어 초기화/리셋
ipcMain.handle('mcp:resetMCPStore', async () => {
  try {
    // 스토어 완전 삭제
    store.delete('mcpStore');
    
    // 트레이 메뉴 업데이트
    await updateTrayMenu();
    
    // 이벤트 전송
    notifyStoreChange('storeReset');
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting MCP store:', error);
    return { success: false, error: error.message };
  }
});

// ==================== CATEGORY 관련 핸들러 ====================
ipcMain.handle('mcp:createMCPCategory', async (event, categoryData) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    const newCategory = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...categoryData,
      version: 1,
      delYn: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    storeData.categories = storeData.categories || {};
    storeData.categories[newCategory.id] = newCategory;
    store.set('mcpStore', storeData);
    
    // 이벤트 전송
    notifyStoreChange('categoryCreated', newCategory);
    
    return { success: true, category: newCategory };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp:updateMCPCategory', async (event, categoryId, updates) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    if (!storeData.categories || !storeData.categories[categoryId]) {
      return { success: false, error: 'Category not found' };
    }
    
    const category = storeData.categories[categoryId];
    storeData.categories[categoryId] = {
      ...category,
      ...updates,
      version: category.version + 1,
      updatedAt: new Date()
    };
    
    store.set('mcpStore', storeData);
    
    // 이벤트 전송
    notifyStoreChange('categoryUpdated', storeData.categories[categoryId]);
    
    return { success: true, category: storeData.categories[categoryId] };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp:deleteMCPCategory', async (event, categoryId) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    if (!storeData.categories || !storeData.categories[categoryId]) {
      return { success: false, error: 'Category not found' };
    }
    
    const category = storeData.categories[categoryId];
    storeData.categories[categoryId] = {
      ...category,
      delYn: true,
      version: category.version + 1,
      updatedAt: new Date()
    };
    
    store.set('mcpStore', storeData);
    
    // 이벤트 전송
    notifyStoreChange('categoryDeleted', { id: categoryId });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: error.message };
  }
});

// ==================== SERVER 관련 핸들러 ====================
ipcMain.handle('mcp:createMCPServer', async (event, serverData) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    
    console.log('createMCPServer',serverData);
    
    const newServer = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: serverData.name,
      value: serverData.value,
      version: 1,
      delYn: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    storeData.servers = storeData.servers || {};
    storeData.servers[newServer.id] = newServer;
    store.set('mcpStore', storeData);
    
    // 이벤트 전송
    notifyStoreChange('serverCreated', newServer);
    
    return { success: true, server: newServer };
  } catch (error) {
    console.error('Error creating server:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp:updateMCPServer', async (event, serverId, updates) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    if (!storeData.servers || !storeData.servers[serverId]) {
      return { success: false, error: 'Server not found' };
    }
    
    const server = storeData.servers[serverId];
    
    // updates에서 value가 직접 전달된 경우 그대로 사용
    let value = updates.value;
    
    // value가 없고 개별 필드가 있는 경우에만 조합
    if (!value && (updates.command || updates.args || updates.description)) {
      value = JSON.stringify({
        command: updates.command || '',
        args: updates.args || [],
        description: updates.description || ''
      });
    }
    
    storeData.servers[serverId] = {
      ...server,
      name: updates.name || server.name,
      value: value || server.value,
      version: server.version + 1,
      updatedAt: new Date()
    };
    
    store.set('mcpStore', storeData);
    
    // 이벤트 전송
    notifyStoreChange('serverUpdated', storeData.servers[serverId]);
    
    return { success: true, server: storeData.servers[serverId] };
  } catch (error) {
    console.error('Error updating server:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp:deleteMCPServer', async (event, serverId) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    if (!storeData.servers || !storeData.servers[serverId]) {
      return { success: false, error: 'Server not found' };
    }
    
    const server = storeData.servers[serverId];
    storeData.servers[serverId] = {
      ...server,
      delYn: true,
      version: server.version + 1,
      updatedAt: new Date()
    };
    
    store.set('mcpStore', storeData);
    
    // 이벤트 전송
    notifyStoreChange('serverDeleted', { id: serverId });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting server:', error);
    return { success: false, error: error.message };
  }
});


// ==================== CATEGORY-SERVER 관계 핸들러 ====================
// 활성 카테고리 설정 (동적 타겟 지원)
ipcMain.handle('mcp:setActiveCategory', async (event, target, categoryId) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    storeData.activeCategories = storeData.activeCategories || {};
    storeData.activeCategories[target] = categoryId;
    storeData.metadata = storeData.metadata || { version: '1.0.0', lastUpdated: new Date() };
    storeData.metadata.lastUpdated = new Date();
    
    store.set('mcpStore', storeData);
    
    // claude-desktop 타겟인 경우 Claude 재시작 (실행 중일 때만)
    const targetConfig = storeData.configTargets?.[target];
    if (targetConfig && targetConfig.name === 'claude-desktop') {
      console.log('Claude Desktop 타겟 감지, Claude 상태 확인 중...');
      try {
        // 1. 먼저 Claude가 실행 중인지 확인
        const execAsync = promisify(exec);
        let isClaudeRunning = false;
        
        try {
          let command;
          if (process.platform === 'win32') {
            command = `tasklist /fi "imagename eq claude.exe" /fo csv | find /c "claude.exe"`;
          } else {
            command = `pgrep -f "claude.exe" | wc -l`;
          }
          
          const { stdout } = await execAsync(command);
          const processCount = parseInt(stdout.trim());
          isClaudeRunning = processCount > 0;
          
          console.log('Claude 실행 상태:', isClaudeRunning ? '실행 중' : '중지됨');
        } catch (error) {
          console.warn('Claude 상태 확인 실패:', error.message);
          isClaudeRunning = false;
        }
        
        // 2. Claude가 실행 중일 때만 재시작
        if (isClaudeRunning) {
          console.log('Claude Desktop이 실행 중이므로 재시작합니다...');
          
          // Claude 경로 로드 (ClaudeControl에서 설정한 경로 사용)
          const claudePath = store.get('claudePath', 'C:\\Users\\user\\AppData\\Local\\AnthropicClaude\\claude.exe');
          
          // 3. 프로세스 종료
          try {
            let killCommand;
            if (process.platform === 'win32') {
              killCommand = `taskkill /im "claude.exe" /f`;
            } else {
              killCommand = `pkill -f "claude.exe"`;
            }
            
            await execAsync(killCommand);
            console.log('Claude 프로세스 종료 완료');
          } catch (error) {
            console.warn('Claude 프로세스 종료 실패:', error.message);
          }
          
          // 4. 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // 5. Claude 재시작
          const claudeProcess = spawn(claudePath, [], {
            detached: true,
            stdio: 'ignore'
          });
          
          claudeProcess.unref();
          console.log('Claude Desktop 재시작 완료, PID:', claudeProcess.pid);
        } else {
          console.log('Claude Desktop이 실행 중이 아니므로 재시작하지 않습니다.');
        }
        
      } catch (restartError) {
        console.error('Claude 재시작 중 오류:', restartError);
        // 재시작 실패해도 카테고리 설정은 성공으로 처리
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error setting active category:', error);
    return { success: false, error: error.message };
  }
});

// 선택된 타겟 설정
ipcMain.handle('mcp:setSelectedTarget', async (event, target) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    storeData.selectedTarget = target;
    storeData.metadata = storeData.metadata || { version: '1.0.0', lastUpdated: new Date() };
    storeData.metadata.lastUpdated = new Date();
    
    store.set('mcpStore', storeData);
    
    // 트레이 메뉴 업데이트
    await updateTrayMenu();
    
    return { success: true };
  } catch (error) {
    console.error('Error setting selected target:', error);
    return { success: false, error: error.message };
  }
});

// 카테고리에 서버 추가
ipcMain.handle('mcp:addServerToCategory', async (event, categoryId, serverId, order = 0) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    const relationId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    storeData.categoryServerRelations = storeData.categoryServerRelations || {};
    storeData.categoryServerRelations[relationId] = {
      id: relationId,
      categoryId,
      serverId,
      order,
      isEnabled: true,
      version: 1,
      delYn: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    store.set('mcpStore', storeData);
    return { success: true };
  } catch (error) {
    console.error('Error adding server to category:', error);
    return { success: false, error: error.message };
  }
});

// 카테고리에서 서버 제거
ipcMain.handle('mcp:removeServerFromCategory', async (event, categoryId, serverId) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    if (!storeData.categoryServerRelations) {
      return { success: false, error: 'No relations found' };
    }
    
    const relation = Object.values(storeData.categoryServerRelations)
      .find(rel => rel.categoryId === categoryId && rel.serverId === serverId && !rel.delYn);
    
    if (!relation) {
      return { success: false, error: 'Relation not found' };
    }
    
    storeData.categoryServerRelations[relation.id] = {
      ...relation,
      delYn: true,
      version: relation.version + 1,
      updatedAt: new Date()
    };
    
    store.set('mcpStore', storeData);
    return { success: true };
  } catch (error) {
    console.error('Error removing server from category:', error);
    return { success: false, error: error.message };
  }
});

// 서버에 키 추가
ipcMain.handle('mcp:addKeyToServer', async (event, serverId, keyId, keyName) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    const relationId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    storeData.serverKeyRelations = storeData.serverKeyRelations || {};
    storeData.serverKeyRelations[relationId] = {
      id: relationId,
      serverId,
      keyId,
      keyName,
      version: 1,
      delYn: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    store.set('mcpStore', storeData);
    return { success: true };
  } catch (error) {
    console.error('Error adding key to server:', error);
    return { success: false, error: error.message };
  }
});

// ==================== CLAUDE PATH 관련 핸들러 ====================
// Claude 경로 저장
ipcMain.handle('claude:savePath', async (event, claudePath) => {
  try {
    store.set('claudePath', claudePath);
    return { success: true };
  } catch (error) {
    console.error('Error saving Claude path:', error);
    return { success: false, error: error.message };
  }
});

// Claude 경로 로드
ipcMain.handle('claude:loadPath', async () => {
  try {
    const claudePath = store.get('claudePath', 'C:\\Users\\user\\AppData\\Local\\AnthropicClaude\\claude.exe');
    return { success: true, path: claudePath };
  } catch (error) {
    console.error('Error loading Claude path:', error);
    return { success: false, error: error.message };
  }
});

// Claude 경로 검증
ipcMain.handle('claude:validatePath', async (event, claudePath) => {
  try {
    const exists = await fs.pathExists(claudePath);
    return { success: true, exists };
  } catch (error) {
    console.error('Error validating Claude path:', error);
    return { success: false, error: error.message };
  }
});

// ==================== CONFIGTARGET 관련 핸들러 ====================
ipcMain.handle('mcp:createMCPConfigTarget', async (event, targetData) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    const newTarget = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...targetData,
      version: 1,
      delYn: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    storeData.configTargets = storeData.configTargets || {};
    storeData.configTargets[newTarget.id] = newTarget;
    store.set('mcpStore', storeData);
    
    return { success: true, data: newTarget };
  } catch (error) {
    console.error('Error creating config target:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp:updateMCPConfigTarget', async (event, targetId, updates) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    if (!storeData.configTargets || !storeData.configTargets[targetId]) {
      return { success: false, error: 'Config target not found' };
    }
    
    const target = storeData.configTargets[targetId];
    if (target.isBuiltIn) {
      return { success: false, error: 'Cannot modify built-in targets' };
    }
    
    storeData.configTargets[targetId] = {
      ...target,
      ...updates,
      version: target.version + 1,
      updatedAt: new Date()
    };
    
    store.set('mcpStore', storeData);
    return { success: true, data: storeData.configTargets[targetId] };
  } catch (error) {
    console.error('Error updating config target:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp:deleteMCPConfigTarget', async (event, targetId) => {
  try {
    const storeData = await store.get('mcpStore') || {};
    if (!storeData.configTargets || !storeData.configTargets[targetId]) {
      return { success: false, error: 'Config target not found' };
    }
    
    const target = storeData.configTargets[targetId];
    if (target.isBuiltIn) {
      return { success: false, error: 'Cannot delete built-in targets' };
    }
    
    storeData.configTargets[targetId] = {
      ...target,
      delYn: true,
      version: target.version + 1,
      updatedAt: new Date()
    };
    
    store.set('mcpStore', storeData);
    return { success: true };
  } catch (error) {
    console.error('Error deleting config target:', error);
    return { success: false, error: error.message };
  }
});

// ==================== TRAY 관련 핸들러 ====================
// 트레이 메뉴 업데이트 IPC 핸들러
ipcMain.handle('tray:updateMenu', async () => {
  await updateTrayMenu();
});

// 트레이에서 카테고리 변경 시 렌더러에 알림
ipcMain.handle('tray:notifyCategoryChange', async () => {
  if (mainWindow) {
    mainWindow.webContents.send('tray:categoryChanged');
  }
});

// ==================== WINDOW 관련 핸들러 ====================
// 창 보이기
ipcMain.handle('window:show', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// 창 숨기기
ipcMain.handle('window:hide', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

// 트레이로 최소화
ipcMain.handle('window:minimizeToTray', () => {
  if (mainWindow) {
    mainWindow.hide();
    if (tray) {
      tray.displayBalloon({
        iconType: 'info',
        title: 'MCP 관리 도구',
        content: '앱이 시스템 트레이로 최소화되었습니다.'
      });
    }
  }
});

// ==================== APPLICATION CONTROL 관련 핸들러 ====================
// 프로세스 목록 조회
ipcMain.handle('app:getProcessList', async () => {
  try {
    let command;
    if (process.platform === 'win32') {
      command = 'tasklist /fo csv';
    } else {
      command = 'ps aux';
    }
    
    const { stdout } = await execAsync(command);
    return { success: true, data: stdout };
  } catch (error) {
    console.error('Error getting process list:', error);
    return { success: false, error: error.message };
  }
});

// 프로세스 이름으로 프로세스 찾기
ipcMain.handle('app:findProcessByName', async (event, processName) => {
  try {
    let command;
    if (process.platform === 'win32') {
      command = `tasklist /fi "imagename eq ${processName}" /fo csv`;
    } else {
      command = `ps aux | grep "${processName}" | grep -v grep`;
    }
    
    const { stdout } = await execAsync(command);
    return { success: true, data: stdout };
  } catch (error) {
    console.error('Error finding process:', error);
    return { success: false, error: error.message };
  }
});

// 프로세스 종료 (PID로)
ipcMain.handle('app:killProcessByPid', async (event, pid) => {
  try {
    let command;
    if (process.platform === 'win32') {
      command = `taskkill /pid ${pid} /f`;
    } else {
      command = `kill -9 ${pid}`;
    }
    
    const { stdout } = await execAsync(command);
    return { success: true, data: stdout };
  } catch (error) {
    console.error('Error killing process:', error);
    return { success: false, error: error.message };
  }
});

// 프로세스 종료 (이름으로)
ipcMain.handle('app:killProcessByName', async (event, processName) => {
  try {
    let command;
    if (process.platform === 'win32') {
      command = `taskkill /im "${processName}" /f`;
    } else {
      command = `pkill -f "${processName}"`;
    }
    
    const { stdout } = await execAsync(command);
    return { success: true, data: stdout };
  } catch (error) {
    console.error('Error killing process by name:', error);
    return { success: false, error: error.message };
  }
});

// 애플리케이션 실행
ipcMain.handle('app:launchApplication', async (event, appPath, args = []) => {
  try {
    return new Promise((resolve) => {
      const child = spawn(appPath, args, {
        detached: true,
        stdio: 'ignore'
      });
      
      child.unref();
      
      child.on('error', (error) => {
        console.error('Error launching application:', error);
        resolve({ success: false, error: error.message });
      });
      
      child.on('spawn', () => {
        console.log(`Application launched with PID: ${child.pid}`);
        resolve({ success: true, pid: child.pid });
      });
    });
  } catch (error) {
    console.error('Error launching application:', error);
    return { success: false, error: error.message };
  }
});

// 애플리케이션 재시작 (종료 후 실행)
ipcMain.handle('app:restartApplication', async (event, processName, appPath, args = []) => {
  try {
    // 1. 먼저 프로세스 종료
    let killResult;
    try {
      let command;
      if (process.platform === 'win32') {
        command = `taskkill /im "${processName}" /f`;
      } else {
        command = `pkill -f "${processName}"`;
      }
      
      const { stdout } = await execAsync(command);
      killResult = { success: true, data: stdout };
    } catch (error) {
      killResult = { success: false, error: error.message };
    }
    
    if (!killResult.success) {
      console.warn('Failed to kill process, but continuing with launch:', killResult.error);
    }
    
    // 2. 잠시 대기 (프로세스가 완전히 종료될 시간)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. 애플리케이션 실행
    const launchResult = await ipcMain.handle('app:launchApplication', event, appPath, args);
    
    return launchResult;
  } catch (error) {
    console.error('Error restarting application:', error);
    return { success: false, error: error.message };
  }
});


// ==================== TRAY 관련 함수 ====================
// 트레이 생성 함수
function createTray() {
  // 트레이 아이콘 경로 설정
  let iconPath;
  
  if (isDev) {
    // 개발 환경: public/tray.ico 사용
    iconPath = path.resolve(__dirname, 'public', 'tray.ico');
  } else {
    // 프로덕션 환경: public/tray.ico 사용
    iconPath = path.resolve(__dirname, 'public', 'tray.ico');
  }
  
  // 아이콘 파일이 없으면 기본 아이콘 생성
  let trayIcon;
  try {
    console.log('=== TRAY ICON DEBUG ===');
    console.log('Looking for tray icon at:', iconPath);
    console.log('__dirname:', __dirname);
    console.log('isDev:', isDev);
    console.log('File exists:', fs.existsSync(iconPath));
    console.log('========================');
    
    if (fs.existsSync(iconPath)) {
      console.log('Using tray icon from:', iconPath);
      trayIcon = nativeImage.createFromPath(iconPath);
    } else {
      console.log('Tray icon not found at:', iconPath);
      // 기본 아이콘 생성 (16x16 픽셀)
      const iconBuffer = Buffer.from(`
        <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
          <rect width="16" height="16" fill="#2563eb" rx="2"/>
          <text x="8" y="12" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="white" text-anchor="middle">M</text>
        </svg>
      `);
      trayIcon = nativeImage.createFromBuffer(iconBuffer);
    }
  } catch (error) {
    console.error('Error creating tray icon:', error);
    // 기본 아이콘 사용
    trayIcon = nativeImage.createFromBuffer(Buffer.from(`
      <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" fill="#2563eb" rx="2"/>
        <text x="8" y="12" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="white" text-anchor="middle">M</text>
      </svg>
    `));
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('MCP 관리 도구');

  // 트레이 더블클릭 이벤트 - 창 보이기/숨기기
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // 트레이 컨텍스트 메뉴 생성
  updateTrayMenu();
}

// 트레이 메뉴 업데이트 함수
async function updateTrayMenu() {
  if (!tray) return;

  try {
    // MCP 스토어에서 카테고리 정보 가져오기
    const storeData = await store.get('mcpStore') || {};
    const categories = Object.values(storeData.categories || {})
      .filter(cat => !cat.delYn);
    
    // ConfigTargets 가져오기
    const configTargets = Object.values(storeData.configTargets || {})
      .filter(target => !target.delYn);

    // 디버깅 로그
    console.log('=== TRAY MENU UPDATE DEBUG ===');
    console.log('Categories count:', categories.length);
    console.log('Categories:', categories.map(cat => ({ id: cat.id, name: cat.name, target: cat.target })));
    console.log('ConfigTargets count:', configTargets.length);
    console.log('ConfigTargets:', configTargets.map(target => ({ id: target.id, name: target.name })));
    console.log('ActiveCategories:', storeData.activeCategories);
    console.log('==============================');

    // 기본 메뉴 아이템들
    const menuItems = [
      {
        label: 'MCP 관리 도구',
        enabled: false
      },
      { type: 'separator' },
      {
        label: mainWindow && mainWindow.isVisible() ? '앱 숨기기' : '앱 보이기',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isVisible()) {
              mainWindow.hide();
            } else {
              mainWindow.show();
              mainWindow.focus();
            }
          }
        }
      },
      {
        label: '트레이로 최소화',
        click: () => {
          if (mainWindow) {
            mainWindow.hide();
            if (tray) {
              tray.displayBalloon({
                iconType: 'info',
                title: 'MCP 관리 도구',
                content: '앱이 시스템 트레이로 최소화되었습니다.'
              });
            }
          }
        }
      },
      { type: 'separator' }
    ];

    // 각 ConfigTarget에 대해 카테고리 메뉴 생성
    configTargets.forEach(target => {
      const activeCategory = storeData.activeCategories?.[target.id];
      
      // 해당 타겟의 카테고리들 필터링 (기본 ID는 이제 고정값 사용)
      const targetCategories = categories.filter(cat => cat.target === target.id || cat.target === 'all');
      
      console.log(`Target ${target.name} (${target.id}):`, {
        availableCategories: targetCategories.map(cat => ({ id: cat.id, name: cat.name, target: cat.target })),
        activeCategory: activeCategory
      });
      
      const targetCategoryItems = targetCategories.map(category => ({
        label: category.name,
        type: 'radio',
        checked: activeCategory === category.id,
        click: () => switchToCategory(category.id, target.id)
      }));

      menuItems.push({
        label: `${target.name} 카테고리`,
        submenu: targetCategoryItems.length > 0 ? targetCategoryItems : [
          { label: '카테고리 없음', enabled: false }
        ]
      });
    });

    // 종료 메뉴 추가
    menuItems.push(
      { type: 'separator' },
      {
        label: '종료',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    );

    const contextMenu = Menu.buildFromTemplate(menuItems);
    tray.setContextMenu(contextMenu);
  } catch (error) {
    console.error('Error updating tray menu:', error);
  }
}

// ==================== MCP 설정 관련 함수 ====================
// 카테고리 전환 함수
async function switchToCategory(categoryId, target) {
  try {
    // 직접 스토어에서 활성 카테고리 설정
    const storeData = await store.get('mcpStore') || {};
    storeData.activeCategories = storeData.activeCategories || {};
    storeData.activeCategories[target] = categoryId;
    await store.set('mcpStore', storeData);
    
    // MCP 설정 파일 업데이트
    await updateMCPConfig(categoryId, target);
    console.log(`Switched to category ${categoryId} for ${target}`);
    
    // 렌더러에 카테고리 변경 알림
    if (mainWindow) {
      mainWindow.webContents.send('tray:categoryChanged');
    }
  } catch (error) {
    console.error('Error switching category:', error);
  }
}

// MCP 설정 파일 업데이트 함수
async function updateMCPConfig(categoryId, target) {
  try {
    const storeData = await store.get('mcpStore') || {};
    const category = storeData.categories?.[categoryId];
    if (!category) return;

    // 카테고리의 서버들 가져오기
    const relations = Object.values(storeData.categoryServerRelations || {})
      .filter(rel => rel.categoryId === categoryId && !rel.delYn && rel.isEnabled)
      .sort((a, b) => a.order - b.order);

    const categoryServers = relations
      .map(rel => storeData.servers[rel.serverId])
      .filter(server => server && !server.delYn);

    // MCP 설정 파일 생성
    const mcpConfig = {
      mcpServers: {}
    };

    categoryServers.forEach(server => {
      try {
        // 서버 value 파싱
        let serverConfig = {};
        if (server.value) {
          serverConfig = JSON.parse(server.value);
        }

        const serverKeys = Object.values(storeData.serverKeyRelations || {})
          .filter(rel => rel.serverId === server.id && !rel.delYn)
          .map(rel => ({
            key: storeData.keys[rel.keyId],
            keyName: rel.keyName
          }))
          .filter(item => item.key && !item.key.delYn);

        const env = {};
        serverKeys.forEach(({ key, keyName }) => {
          env[keyName] = key.value;
        });

        // 파싱된 서버 설정과 키 정보를 조합
        mcpConfig.mcpServers[server.name] = {
          ...serverConfig,
          ...(Object.keys(env).length > 0 && { env })
        };
      } catch (error) {
        console.error(`Error processing server ${server.name}:`, error);
        // 파싱 실패 시 기본 구조 사용
        mcpConfig.mcpServers[server.name] = {
          command: 'echo',
          args: ['Server configuration error']
        };
      }
    });

    // 실제 파일에 저장
    const configPath = target === 'claude' 
      ? (storeData.configPaths?.claude || '') 
      : (storeData.configPaths?.cursor || '');
    
    if (configPath) {
      await fs.writeFile(configPath, JSON.stringify(mcpConfig, null, 2));
      console.log(`MCP config updated for ${target}:`, configPath);
    }
  } catch (error) {
    console.error('Error updating MCP config:', error);
  }
}

app.whenReady().then(async () => {
  store = new Store({
    name: 'settings' // settings.json (경로는 userData 아래)
  });

  // 이제부터 store 사용
  createWindow();
});

app.on('window-all-closed', (event) => {
  // macOS가 아닌 경우에도 앱을 종료하지 않고 트레이에 숨김
  // 사용자가 명시적으로 종료를 선택한 경우에만 앱 종료
  event.preventDefault();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 앱 종료 전 이벤트 처리
app.on('before-quit', (event) => {
  if (!app.isQuiting) {
    event.preventDefault();
    if (mainWindow) {
      mainWindow.hide();
    }
  }
});