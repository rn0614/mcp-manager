import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ModalProvider } from './components/shared/ModalProvider'

// 개발 환경에서 mock API 로드
if (import.meta.env.DEV) {
  import('./utils/mockElectronAPI').then(() => {
    console.log('Mock ElectronAPI loaded successfully');
  }).catch(error => {
    console.error('Failed to load mock ElectronAPI:', error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </StrictMode>,
)
