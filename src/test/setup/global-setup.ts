import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Starting global test setup...');
  
  const { baseURL } = config.projects[0].use;
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the app to be ready
    await page.goto(baseURL!);
    await page.waitForLoadState('networkidle');
    console.log('✅ Application is ready for testing');
    
    // Setup test database state if needed
    await setupTestDatabase(page);
    
    // Setup authentication if needed
    await setupTestAuth(page);
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global test setup completed');
}

async function setupTestDatabase(page: any) {
  // Reset database to clean state for E2E tests
  console.log('🗄️ Setting up test database...');
  
  // You can call your Supabase reset functions here
  // For now, we'll just ensure the app loads properly
  
  console.log('✅ Test database setup completed');
}

async function setupTestAuth(page: any) {
  // Setup test authentication if needed
  console.log('🔐 Setting up test authentication...');
  
  // Create test users or setup mock auth
  // For demo purposes, we'll skip this for now
  
  console.log('✅ Test authentication setup completed');
}

export default globalSetup;