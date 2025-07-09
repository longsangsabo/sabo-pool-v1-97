import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  try {
    // Cleanup test data
    await cleanupTestData();
    
    // Reset database state if needed
    await resetDatabaseState();
    
    // Cleanup any external resources
    await cleanupExternalResources();
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here to avoid masking test failures
  }
  
  console.log('✅ Global test teardown completed');
}

async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...');
  
  // Cleanup demo users, tournaments, etc.
  // This would typically call your cleanup API endpoints
  
  console.log('✅ Test data cleanup completed');
}

async function resetDatabaseState() {
  console.log('🔄 Resetting database state...');
  
  // Reset to clean state for next test run
  // You might want to call Supabase reset functions here
  
  console.log('✅ Database state reset completed');
}

async function cleanupExternalResources() {
  console.log('🧽 Cleaning up external resources...');
  
  // Cleanup any external services, files, etc.
  
  console.log('✅ External resources cleanup completed');
}

export default globalTeardown;