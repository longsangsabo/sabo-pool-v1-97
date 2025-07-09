// Simplified Translation Service - Local Storage Based
// This version works without database dependencies

interface TranslationTask {
  id: string;
  page_path: string;
  component_name: string;
  source_language: 'vi' | 'en';
  target_language: 'vi' | 'en';
  translation_keys: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

interface PageContent {
  path: string;
  component: string;
  translationKeys: string[];
  lastModified: string;
}

class TranslationService {
  private static instance: TranslationService;
  private knownPages: Set<string> = new Set();
  private tasks: TranslationTask[] = [];

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  constructor() {
    // Load tasks from localStorage
    const savedTasks = localStorage.getItem('translation_tasks');
    if (savedTasks) {
      try {
        this.tasks = JSON.parse(savedTasks);
      } catch (error) {
        console.error('Error loading translation tasks:', error);
        this.tasks = [];
      }
    }
  }

  private saveTasks(): void {
    try {
      localStorage.setItem('translation_tasks', JSON.stringify(this.tasks));
    } catch (error) {
      console.error('Error saving translation tasks:', error);
    }
  }

  // Detect new pages by monitoring route changes
  detectNewPage(pagePath: string, componentName: string): void {
    if (!this.knownPages.has(pagePath)) {
      console.log(`🆕 Phát hiện trang mới: ${pagePath}`);
      this.knownPages.add(pagePath);
      this.queuePageForTranslation(pagePath, componentName);
    }
  }

  // Extract translation keys from component content
  extractTranslationKeys(componentContent: string): string[] {
    const keys: string[] = [];
    
    // Tìm các pattern t('key') và t("key")
    const singleQuoteMatches = componentContent.match(/t\('([^']+)'\)/g);
    const doubleQuoteMatches = componentContent.match(/t\("([^"]+)"\)/g);
    
    if (singleQuoteMatches) {
      singleQuoteMatches.forEach(match => {
        const key = match.match(/t\('([^']+)'\)/)?.[1];
        if (key && !keys.includes(key)) {
          keys.push(key);
        }
      });
    }
    
    if (doubleQuoteMatches) {
      doubleQuoteMatches.forEach(match => {
        const key = match.match(/t\("([^"]+)"\)/)?.[1];
        if (key && !keys.includes(key)) {
          keys.push(key);
        }
      });
    }

    return keys;
  }

  // Queue a page for translation
  async queuePageForTranslation(pagePath: string, componentName: string): Promise<void> {
    try {
      console.log(`📝 Đưa trang vào hàng đợi dịch thuật: ${pagePath}`);
      
      // Generate sample translation keys for demo
      const translationKeys = [
        `${componentName.toLowerCase()}.title`,
        `${componentName.toLowerCase()}.description`,
        `${componentName.toLowerCase()}.button.action`
      ];
      
      const newTask: TranslationTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        page_path: pagePath,
        component_name: componentName,
        source_language: 'en',
        target_language: 'vi',
        translation_keys: translationKeys,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.tasks.push(newTask);
      this.saveTasks();

      console.log('✅ Đã thêm task dịch thuật:', newTask);
      
      // Auto-process with a small delay
      setTimeout(() => {
        this.processTranslationQueue();
      }, 1000);
      
    } catch (error) {
      console.error('Lỗi khi tạo task dịch thuật:', error);
    }
  }

  // Process translation queue
  async processTranslationQueue(): Promise<void> {
    try {
      const pendingTasks = this.tasks.filter(task => task.status === 'pending').slice(0, 5);

      if (pendingTasks.length === 0) {
        return;
      }

      console.log(`🔄 Xử lý ${pendingTasks.length} tasks dịch thuật`);

      for (const task of pendingTasks) {
        await this.translateTask(task);
      }

    } catch (error) {
      console.error('Lỗi khi xử lý hàng đợi dịch thuật:', error);
    }
  }

  // Translate a specific task
  async translateTask(task: TranslationTask): Promise<void> {
    try {
      // Update status to processing
      const taskIndex = this.tasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        this.tasks[taskIndex].status = 'processing';
        this.tasks[taskIndex].updated_at = new Date().toISOString();
        this.saveTasks();
      }

      console.log(`🔄 Bắt đầu dịch: ${task.page_path}`);

      // Simulate translation process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock translations
      const translations = await this.callTranslationAPI(task.translation_keys, task.source_language, task.target_language);
      
      // Update status to completed
      if (taskIndex !== -1) {
        this.tasks[taskIndex].status = 'completed';
        this.tasks[taskIndex].updated_at = new Date().toISOString();
        this.saveTasks();
      }

      console.log(`✅ Dịch thành công: ${task.page_path}`);

    } catch (error) {
      console.error(`❌ Lỗi khi dịch ${task.page_path}:`, error);
      
      // Update status to failed
      const taskIndex = this.tasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        this.tasks[taskIndex].status = 'failed';
        this.tasks[taskIndex].updated_at = new Date().toISOString();
        this.saveTasks();
      }
    }
  }

  // Mock AI translation API call
  async callTranslationAPI(keys: string[], sourceLanguage: string, targetLanguage: string): Promise<Record<string, string>> {
    try {
      // Mock translation mapping
      const mockTranslations: Record<string, string> = {};
      
      keys.forEach(key => {
        if (targetLanguage === 'vi') {
          // Generate Vietnamese translations based on key patterns
          if (key.includes('title')) {
            mockTranslations[key] = `Tiêu đề ${key.split('.')[0]}`;
          } else if (key.includes('description')) {
            mockTranslations[key] = `Mô tả cho ${key.split('.')[0]}`;
          } else if (key.includes('button')) {
            mockTranslations[key] = `Nút bấm`;
          } else {
            mockTranslations[key] = `[Dịch tự động] ${key}`;
          }
        } else {
          mockTranslations[key] = `[Auto-translated] ${key}`;
        }
      });
      
      return mockTranslations;
    } catch (error) {
      console.error('Lỗi API dịch thuật:', error);
      
      // Fallback: basic translation
      const translations: Record<string, string> = {};
      keys.forEach(key => {
        translations[key] = `[Dịch tự động] ${key}`;
      });
      
      return translations;
    }
  }

  // Get translation statistics
  async getTranslationStats(): Promise<{
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    failedTasks: number;
    lastTranslated: string | null;
  }> {
    try {
      const sortedTasks = [...this.tasks].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      const result = {
        totalTasks: this.tasks.length,
        pendingTasks: this.tasks.filter(t => t.status === 'pending').length,
        completedTasks: this.tasks.filter(t => t.status === 'completed').length,
        failedTasks: this.tasks.filter(t => t.status === 'failed').length,
        lastTranslated: sortedTasks[0]?.updated_at || null
      };

      return result;
    } catch (error) {
      console.error('Lỗi khi lấy thống kê dịch thuật:', error);
      return {
        totalTasks: 0,
        pendingTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        lastTranslated: null
      };
    }
  }

  // Get all tasks
  getAllTasks(): TranslationTask[] {
    return [...this.tasks].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Manually trigger translation for a specific page
  async manualTranslate(pagePath: string, componentName: string): Promise<void> {
    console.log(`🔧 Dịch thủ công: ${pagePath}`);
    await this.queuePageForTranslation(pagePath, componentName);
  }

  // Batch translate all untranslated pages
  async batchTranslateAll(): Promise<void> {
    console.log('🚀 Bắt đầu dịch hàng loạt tất cả trang');
    await this.processTranslationQueue();
  }

  // Clear all tasks (for testing)
  clearAllTasks(): void {
    this.tasks = [];
    this.saveTasks();
    console.log('🗑️ Đã xóa tất cả tasks dịch thuật');
  }
}

export const translationService = TranslationService.getInstance();

// Hook để sử dụng trong components
export const useAutoTranslation = () => {
  const detectPage = (path: string, component: string) => {
    translationService.detectNewPage(path, component);
  };

  const manualTranslate = (path: string, component: string) => {
    translationService.manualTranslate(path, component);
  };

  const batchTranslate = () => {
    translationService.batchTranslateAll();
  };

  const getStats = () => {
    return translationService.getTranslationStats();
  };

  const getTasks = () => {
    return translationService.getAllTasks();
  };

  const clearTasks = () => {
    translationService.clearAllTasks();
  };

  return {
    detectPage,
    manualTranslate,
    batchTranslate,
    getStats,
    getTasks,
    clearTasks
  };
};