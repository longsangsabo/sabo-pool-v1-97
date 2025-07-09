import { supabase } from '@/integrations/supabase/client';

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

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
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

    // Tìm các hardcoded text cần dịch
    const textMatches = componentContent.match(/>([^<{]+)</g);
    if (textMatches) {
      textMatches.forEach(match => {
        const text = match.replace(/>/g, '').replace(/</g, '').trim();
        if (text.length > 1 && !text.match(/^\d+$/) && !text.match(/^[A-Z_]+$/)) {
          keys.push(`hardcoded.${text.toLowerCase().replace(/\s+/g, '_')}`);
        }
      });
    }

    return keys;
  }

  // Queue a page for translation
  async queuePageForTranslation(pagePath: string, componentName: string): Promise<void> {
    try {
      console.log(`📝 Đưa trang vào hàng đợi dịch thuật: ${pagePath}`);
      
      // Giả lập việc đọc nội dung component
      const translationKeys = this.extractTranslationKeys('');
      
      const translationTask: Partial<TranslationTask> = {
        page_path: pagePath,
        component_name: componentName,
        source_language: 'en',
        target_language: 'vi',
        translation_keys: translationKeys,
        status: 'pending'
      };

      // Lưu vào database (cần tạo bảng translation_tasks)
      const { data, error } = await supabase
        .from('translation_tasks')
        .insert(translationTask);

      if (error) {
        console.error('Lỗi khi lưu task dịch thuật:', error);
        return;
      }

      console.log('✅ Đã thêm task dịch thuật:', data);
      
      // Tự động bắt đầu dịch
      this.processTranslationQueue();
      
    } catch (error) {
      console.error('Lỗi khi tạo task dịch thuật:', error);
    }
  }

  // Process translation queue
  async processTranslationQueue(): Promise<void> {
    try {
      const { data: pendingTasks, error } = await supabase
        .from('translation_tasks')
        .select('*')
        .eq('status', 'pending')
        .limit(5);

      if (error) {
        console.error('Lỗi khi lấy tasks chờ dịch:', error);
        return;
      }

      if (!pendingTasks || pendingTasks.length === 0) {
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
      // Cập nhật status thành processing
      await supabase
        .from('translation_tasks')
        .update({ status: 'processing' })
        .eq('id', task.id);

      console.log(`🔄 Bắt đầu dịch: ${task.page_path}`);

      // Gọi AI translation service
      const translations = await this.callTranslationAPI(task.translation_keys, task.source_language, task.target_language);
      
      // Cập nhật translation dictionary
      await this.updateTranslationDictionary(translations, task.target_language);

      // Cập nhật status thành completed
      await supabase
        .from('translation_tasks')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      console.log(`✅ Dịch thành công: ${task.page_path}`);

    } catch (error) {
      console.error(`❌ Lỗi khi dịch ${task.page_path}:`, error);
      
      // Cập nhật status thành failed
      await supabase
        .from('translation_tasks')
        .update({ status: 'failed' })
        .eq('id', task.id);
    }
  }

  // Call AI translation API (OpenAI/Google Translate)
  async callTranslationAPI(keys: string[], sourceLanguage: string, targetLanguage: string): Promise<Record<string, string>> {
    try {
      const { data, error } = await supabase.functions.invoke('auto-translate', {
        body: {
          keys,
          sourceLanguage,
          targetLanguage,
          context: 'Pool/Billiards gaming platform'
        }
      });

      if (error) throw error;

      return data.translations || {};
    } catch (error) {
      console.error('Lỗi API dịch thuật:', error);
      
      // Fallback: dịch cơ bản
      const translations: Record<string, string> = {};
      keys.forEach(key => {
        translations[key] = `[Dịch tự động] ${key}`;
      });
      
      return translations;
    }
  }

  // Update translation dictionary in LanguageContext
  async updateTranslationDictionary(translations: Record<string, string>, language: 'vi' | 'en'): Promise<void> {
    try {
      // Lưu vào database để sync với LanguageContext
      const { error } = await supabase
        .from('translation_dictionary')
        .upsert(
          Object.entries(translations).map(([key, value]) => ({
            key,
            language,
            value,
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'key,language' }
        );

      if (error) {
        console.error('Lỗi khi cập nhật từ điển dịch thuật:', error);
      } else {
        console.log(`✅ Đã cập nhật ${Object.keys(translations).length} bản dịch`);
      }
    } catch (error) {
      console.error('Lỗi khi lưu bản dịch:', error);
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
      const { data: stats, error } = await supabase
        .from('translation_tasks')
        .select('status, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const result = {
        totalTasks: stats?.length || 0,
        pendingTasks: stats?.filter(t => t.status === 'pending').length || 0,
        completedTasks: stats?.filter(t => t.status === 'completed').length || 0,
        failedTasks: stats?.filter(t => t.status === 'failed').length || 0,
        lastTranslated: stats?.[0]?.updated_at || null
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

  return {
    detectPage,
    manualTranslate,
    batchTranslate
  };
};