// Translation Scanner - Extract hardcoded text from codebase
import { translationService } from '@/services/translationService';

interface TranslationKey {
  key: string;
  text: string;
  filePath: string;
  lineNumber: number;
  context: string;
}

class TranslationScanner {
  private extractedKeys: TranslationKey[] = [];
  
  // Common patterns for hardcoded text (excluding system/framework strings)
  private readonly textPatterns = [
    // Button text, labels, titles
    /(?:>)([A-Z][^<>]*[a-zA-Z])(?:<)/g,
    // Placeholder text
    /placeholder\s*=\s*['""]([^'""]*)['"]/g,
    // Alert/toast messages
    /(?:toast\.(?:success|error|info|warning)\s*\(\s*['""])([^'""]*)['"]/g,
    // Dialog/modal content
    /(?:title|description|message)\s*:\s*['""]([^'""]*)['"]/g,
  ];

  // Extract translation keys from component content
  extractFromText(content: string, filePath: string): TranslationKey[] {
    const keys: TranslationKey[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      this.textPatterns.forEach(pattern => {
        let match;
        const patternCopy = new RegExp(pattern.source, pattern.flags);
        
        while ((match = patternCopy.exec(line)) !== null) {
          const text = match[1]?.trim();
          
          if (this.shouldIncludeText(text)) {
            const key = this.generateKey(text, filePath);
            keys.push({
              key,
              text,
              filePath,
              lineNumber: index + 1,
              context: line.trim()
            });
          }
        }
      });
    });
    
    return keys;
  }

  // Check if text should be included for translation
  private shouldIncludeText(text: string): boolean {
    if (!text || text.length < 2) return false;
    
    // Skip technical terms, class names, URLs, etc.
    const skipPatterns = [
      /^[a-z-]+$/, // CSS classes
      /^https?:\/\//, // URLs
      /^[A-Z_]+$/, // Constants
      /^\d+$/, // Numbers only
      /^[^a-zA-Z]*$/, // No letters
      /className|onClick|href|src|alt|id|key|type|role|aria-|data-/,
      /^(div|span|button|input|form|img|a|p|h[1-6])$/i, // HTML tags
    ];
    
    return !skipPatterns.some(pattern => pattern.test(text));
  }

  // Generate a translation key from text and file path
  private generateKey(text: string, filePath: string): string {
    const fileName = filePath.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || 'unknown';
    const cleanText = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
    
    return `${fileName.toLowerCase()}.${cleanText}`;
  }

  // Scan entire codebase for missing translations
  async scanCodebase(): Promise<{
    missingKeys: TranslationKey[];
    totalFiles: number;
    totalTexts: number;
  }> {
    this.extractedKeys = [];
    
    // Mock file scanning - in real implementation, you'd scan file system
    const mockFiles = [
      { path: 'src/pages/tournaments/TournamentsPage.tsx', content: this.getMockTournamentContent() },
      { path: 'src/pages/clubs/ClubsPage.tsx', content: this.getMockClubContent() },
      { path: 'src/components/Navigation.tsx', content: this.getMockNavigationContent() },
    ];
    
    let totalTexts = 0;
    
    for (const file of mockFiles) {
      const keys = this.extractFromText(file.content, file.path);
      this.extractedKeys.push(...keys);
      totalTexts += keys.length;
    }
    
    return {
      missingKeys: this.extractedKeys,
      totalFiles: mockFiles.length,
      totalTexts
    };
  }

  // Get mock content for demonstration
  private getMockTournamentContent(): string {
    return `
      <div className="tournaments-page">
        <h1>Tournaments</h1>
        <p>Join competitive tournaments and compete with other players</p>
        <Button>Create Tournament</Button>
        <Badge>Registration Open</Badge>
        <span>Entry Fee</span>
        <input placeholder="Search tournaments..." />
      </div>
    `;
  }

  private getMockClubContent(): string {
    return `
      <div className="clubs-page">
        <h1>Pool Clubs</h1>
        <p>Find and join pool clubs near you</p>
        <Button>Register New Club</Button>
        <span>Club Directory</span>
        <p>Operating Hours</p>
        <div>Business License</div>
      </div>
    `;
  }

  private getMockNavigationContent(): string {
    return `
      <nav>
        <a>Home</a>
        <a>Tournaments</a>
        <a>Clubs</a>
        <a>Rankings</a>
        <a>Profile</a>
        <Button>Login</Button>
        <Button>Sign Up</Button>
      </nav>
    `;
  }

  // Generate translation tasks for missing keys
  async generateTranslationTasks(): Promise<void> {
    const { missingKeys } = await this.scanCodebase();
    
    // Group keys by file
    const fileGroups = missingKeys.reduce((acc, key) => {
      if (!acc[key.filePath]) {
        acc[key.filePath] = [];
      }
      acc[key.filePath].push(key);
      return acc;
    }, {} as Record<string, TranslationKey[]>);
    
    // Create translation tasks for each file
    for (const [filePath, keys] of Object.entries(fileGroups)) {
      const componentName = filePath.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || 'Component';
      
      await translationService.queuePageForTranslation(
        filePath,
        componentName,
        keys.map(k => k.key)
      );
    }
  }
}

export const translationScanner = new TranslationScanner();

// Hook for components to use scanner
export const useTranslationScanner = () => {
  const scanAndTranslate = async () => {
    console.log('🔍 Scanning codebase for missing translations...');
    
    const result = await translationScanner.scanCodebase();
    console.log(`📊 Scan results: ${result.totalTexts} texts found in ${result.totalFiles} files`);
    
    if (result.missingKeys.length > 0) {
      console.log('🚀 Generating translation tasks...');
      await translationScanner.generateTranslationTasks();
      console.log(`✅ Created translation tasks for ${result.missingKeys.length} missing translations`);
    }
    
    return result;
  };

  const extractFromComponent = (content: string, filePath: string) => {
    return translationScanner.extractFromText(content, filePath);
  };

  return {
    scanAndTranslate,
    extractFromComponent
  };
};