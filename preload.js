const { contextBridge, ipcRenderer } = require('electron');

// 렌더러 프로세스에 안전한 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  // 파일 시스템 관련 API
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
  
  // 설정 저장/로드 API
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  
  // MCP 설정 파일 API
  getMCPConfig: (filePath) => ipcRenderer.invoke('mcp:readConfig', filePath),
  writeMCPConfig: (filePath, config) => ipcRenderer.invoke('mcp:writeConfig', filePath, config),
  
  // MCP Store API
  getMCPStore: () => ipcRenderer.invoke('mcp:getMCPStore'),
  saveMCPStore: (store) => ipcRenderer.invoke('mcp:saveMCPStore', store),
  resetMCPStore: () => ipcRenderer.invoke('mcp:resetMCPStore'),
  
  // MCP Config API (ConfigTarget 전용)
  getMCPConfig: () => ipcRenderer.invoke('mcp:getMCPConfig'),
  
  // MCP Server API (MCPServer 전용)
  getMCPServer: () => ipcRenderer.invoke('mcp:getMCPServer'),
  
  // Category 관련 API
  createMCPCategory: (categoryData) => ipcRenderer.invoke('mcp:createMCPCategory', categoryData),
  updateMCPCategory: (categoryId, updates) => ipcRenderer.invoke('mcp:updateMCPCategory', categoryId, updates),
  deleteMCPCategory: (categoryId) => ipcRenderer.invoke('mcp:deleteMCPCategory', categoryId),
  setActiveCategory: (target, categoryId) => ipcRenderer.invoke('mcp:setActiveCategory', target, categoryId),
  
  // Server 관련 API
  createMCPServer: (serverData) => ipcRenderer.invoke('mcp:createMCPServer', serverData),
  updateMCPServer: (serverId, updates) => ipcRenderer.invoke('mcp:updateMCPServer', serverId, updates),
  deleteMCPServer: (serverId) => ipcRenderer.invoke('mcp:deleteMCPServer', serverId),
  addServerToCategory: (categoryId, serverId, order) => ipcRenderer.invoke('mcp:addServerToCategory', categoryId, serverId, order),
  removeServerFromCategory: (categoryId, serverId) => ipcRenderer.invoke('mcp:removeServerFromCategory', categoryId, serverId),
  
  // ConfigTarget 관련 API
  createMCPConfigTarget: (targetData) => ipcRenderer.invoke('mcp:createMCPConfigTarget', targetData),
  updateMCPConfigTarget: (targetId, updates) => ipcRenderer.invoke('mcp:updateMCPConfigTarget', targetId, updates),
  deleteMCPConfigTarget: (targetId) => ipcRenderer.invoke('mcp:deleteMCPConfigTarget', targetId),
    
  // 기타 설정 API
  setSelectedTarget: (target) => ipcRenderer.invoke('mcp:setSelectedTarget', target),
  
  // 트레이 API
  updateTrayMenu: () => ipcRenderer.invoke('tray:updateMenu'),
  
  // 창 제어 API
  showWindow: () => ipcRenderer.invoke('window:show'),
  hideWindow: () => ipcRenderer.invoke('window:hide'),
  minimizeToTray: () => ipcRenderer.invoke('window:minimizeToTray'),
  
  // 애플리케이션 제어 API
  getProcessList: () => ipcRenderer.invoke('app:getProcessList'),
  findProcessByName: (processName) => ipcRenderer.invoke('app:findProcessByName', processName),
  killProcessByPid: (pid) => ipcRenderer.invoke('app:killProcessByPid', pid),
  killProcessByName: (processName) => ipcRenderer.invoke('app:killProcessByName', processName),
  launchApplication: (appPath, args) => ipcRenderer.invoke('app:launchApplication', appPath, args),
  restartApplication: (processName, appPath, args) => ipcRenderer.invoke('app:restartApplication', processName, appPath, args),
  
  // Claude 경로 관리 API
  saveClaudePath: (claudePath) => ipcRenderer.invoke('claude:savePath', claudePath),
  loadClaudePath: () => ipcRenderer.invoke('claude:loadPath'),
  validateClaudePath: (claudePath) => ipcRenderer.invoke('claude:validatePath', claudePath),
  
  // IPC 이벤트 리스너
  onTrayCategoryChanged: (callback) => {
    ipcRenderer.on('tray:categoryChanged', callback);
  },
  removeTrayCategoryChangedListener: (callback) => {
    ipcRenderer.removeListener('tray:categoryChanged', callback);
  },
  
  // Store 변경 이벤트 리스너
  onStoreChanged: (callback) => {
    ipcRenderer.on('mcp:storeChanged', callback);
  },
  removeStoreChangedListener: (callback) => {
    ipcRenderer.removeListener('mcp:storeChanged', callback);
  },
});