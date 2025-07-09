
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSentry } from './lib/sentryConfig';

// Initialize Sentry for error tracking
initSentry();

console.log('🚀 Starting application...');

// Simple error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error?.message || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #1a5d4a; color: white; font-family: Arial, sans-serif; padding: 20px;">
      <div style="text-align: center;">
        <h1 style="color: #fbbf24; margin-bottom: 16px;">🚨 Lỗi Khởi Động</h1>
        <p>Không tìm thấy phần tử root.</p>
        <button onclick="location.reload()" style="background: #fbbf24; color: #1a5d4a; border: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 20px;">
          🔄 Tải Lại Trang
        </button>
      </div>
    </div>
  `;
  throw new Error('Root element not found');
}

try {
  console.log('Creating React root...');
  const root = createRoot(rootElement);
  
  console.log('Rendering App component...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  console.log('✅ App rendered successfully!');
  
} catch (error) {
  console.error('Failed to render app:', error);
  
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #1a5d4a; color: white; font-family: Arial, sans-serif; padding: 20px;">
      <div style="text-align: center;">
        <h1 style="color: #fbbf24; margin-bottom: 16px;">⚠️ Lỗi Khởi Động</h1>
        <p style="margin-bottom: 20px;">Đã xảy ra lỗi khi khởi động ứng dụng.</p>
        <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin: 20px 0;">
          <pre style="font-size: 12px; color: #d1fae5; white-space: pre-wrap;">${error.message}</pre>
        </div>
        <button onclick="location.reload()" style="background: #fbbf24; color: #1a5d4a; border: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; cursor: pointer;">
          🔄 Tải Lại Trang
        </button>
      </div>
    </div>
  `;
}
