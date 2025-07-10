import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations = {
  vi: {
    // Admin Navigation
    'admin.dashboard': 'Bảng điều khiển',
    'admin.users': 'Quản lý người dùng',
    'admin.clubs': 'Quản lý câu lạc bộ',
    'admin.tournaments': 'Quản lý giải đấu',
    'admin.transactions': 'Quản lý giao dịch',
    'admin.analytics': 'Phân tích thống kê',
    'admin.ai_assistant': 'AI Assistant',
    'admin.test_ranking': 'Kiểm thử xếp hạng',
    'admin.development': 'Công cụ phát triển',
    'admin.settings': 'Cài đặt',
    'admin.home': 'Về trang chủ',
    'admin.logout': 'Đăng xuất',
    'admin.panel': 'Bảng quản trị',
    
    // Admin Dashboard
    'admin.dashboard_title': 'Admin Dashboard',
    'admin.dashboard_desc': 'Tổng quan hệ thống SABO Pool Arena',
    'admin.system_status': 'Trạng thái hệ thống',
    'admin.system_healthy': 'Hệ thống hoạt động tốt',
    'admin.system_warning': 'Cảnh báo hệ thống',
    'admin.system_error': 'Lỗi hệ thống',
    'admin.last_updated': 'Cập nhật',
    'admin.total_users': 'Tổng người dùng',
    'admin.pending_club_registrations': 'Đăng ký CLB chờ duyệt',
    'admin.approved_clubs': 'CLB đã duyệt',
    'admin.unread_notifications': 'Thông báo chưa đọc',
    'admin.today': 'hôm nay',
    'admin.approval_rate': 'tỷ lệ duyệt',
    'admin.high_priority': 'ưu tiên cao',
    'admin.quick_actions': 'Hành động nhanh',
    'admin.common_actions': 'Các thao tác thường dùng',
    'admin.approve_clubs': 'Duyệt đăng ký CLB',
    'admin.manage_tournaments': 'Quản lý giải đấu',
    'admin.manage_users': 'Quản lý người dùng',
    'admin.club_registration_status': 'Trạng thái đăng ký CLB',
    'admin.club_stats': 'Thống kê đăng ký câu lạc bộ',
    'admin.total_registrations': 'Tổng đăng ký',
    'admin.pending': 'Chờ duyệt',
    'admin.approved': 'Đã duyệt',
    'admin.rejected': 'Bị từ chối',
    'admin.system_notifications': 'Thông báo hệ thống',
    'admin.notification_status': 'Tình trạng thông báo',
    'admin.total_notifications': 'Tổng thông báo',
    'admin.unread': 'Chưa đọc',
    'admin.refresh_stats': 'Cập nhật thống kê',
    
    // Club Management
    'admin.club_management': 'Quản lý câu lạc bộ',
    'admin.pending_registrations': 'Đăng ký chờ duyệt',
    'admin.approved_clubs_tab': 'CLB đã duyệt',
    
    // User Management
    'admin.user_management': 'Quản Lý Người Dùng',
    'admin.user_management_desc': 'Quản lý thông tin và trạng thái người dùng',
    'admin.search_users': 'Tìm kiếm người dùng...',
    'admin.status': 'Trạng thái',
    'admin.all': 'Tất cả',
    'admin.active': 'Hoạt động',
    'admin.inactive': 'Không hoạt động',
    'admin.banned': 'Đã khóa',
    'admin.user_list': 'Danh sách người dùng',
    'admin.total_users_count': 'Tổng cộng {count} người dùng',
    'admin.not_updated': 'Chưa cập nhật',
    'admin.no_phone': 'Chưa có SĐT',
    'admin.not_verified': 'Chưa xác thực',
    'admin.joined': 'Tham gia',
    'admin.updated': 'Cập nhật',
    'admin.view_details': 'Xem chi tiết',
    'admin.unlock_account': 'Mở khóa tài khoản',
    'admin.ban_account': 'Khóa tài khoản',
    'admin.upgrade_premium': 'Nâng cấp Premium',
    'admin.cancel_premium': 'Hủy Premium',
    'admin.ban_user_title': 'Khóa tài khoản người dùng',
    'admin.ban_user_desc': 'Bạn có chắc chắn muốn khóa tài khoản của {name}? Vui lòng nhập lý do khóa tài khoản.',
    'admin.ban_reason_placeholder': 'Nhập lý do khóa tài khoản...',
    'admin.cancel': 'Hủy',
    'admin.processing': 'Đang xử lý...',
    'admin.no_users_found': 'Không tìm thấy người dùng nào',
    
    // Development Tools
    'admin.dev_tools': 'Công cụ phát triển',
    'admin.dev_warning': 'Những công cụ này dành cho phát triển và kiểm thử. Sử dụng cẩn thận trong môi trường production.',
    'admin.bulk_user_gen': 'Tạo Người Dùng Hàng Loạt',
    'admin.bulk_user_desc': 'Tạo nhiều người dùng test với tên và thông tin thực tế',
    'admin.quick_club': 'Tạo CLB Nhanh',
    'admin.quick_club_desc': 'Tạo câu lạc bộ test với thông tin kinh doanh thực tế và địa điểm',
    'admin.test_data': 'Dữ Liệu Test',
    'admin.test_data_desc': 'Tạo dữ liệu test toàn diện cho tất cả các tính năng',
    'admin.db_tools': 'Công Cụ Database',
    'admin.db_tools_desc': 'Xóa dữ liệu test, xuất/nhập tập dữ liệu, và quản lý trạng thái database',
    
    // Bulk User Generator
    'dev.bulk_user_title': 'Tạo Người Dùng Hàng Loạt',
    'dev.bulk_user_desc': 'Tạo nhiều người dùng test với tên Việt thực tế và hồ sơ',
    'dev.user_count': 'Số lượng người dùng (10-100)',
    'dev.skill_distribution': 'Phân bố kỹ năng',
    'dev.mixed_levels': 'Kỹ Năng Hỗn Hợp',
    'dev.all_beginner': 'Tất Cả Mới Bắt Đầu',
    'dev.all_intermediate': 'Tất Cả Trung Bình',
    'dev.all_advanced': 'Tất Cả Nâng Cao',
    'dev.all_professional': 'Tất Cả Chuyên Nghiệp',
    'dev.generate_ranking': 'Tạo dữ liệu xếp hạng',
    'dev.include_spa_points': 'Bao gồm điểm SPA',
    'dev.generating_users': 'Đang tạo người dùng...',
    'dev.generate_users': 'Tạo {count} Người Dùng',
    'dev.generating': 'Đang tạo...',
    'dev.generation_complete': 'Tạo Hoàn Thành',
    'dev.users_created': 'Đã tạo thành công {count} người dùng test với hồ sơ',
    'dev.with_ranking': 'và dữ liệu xếp hạng',
    'dev.with_spa_points': 'bao gồm điểm SPA',
    'dev.failed_generate': 'Tạo người dùng thất bại. Kiểm tra console để biết chi tiết.',
    'dev.success_generate': 'Tạo thành công {count} người dùng test!',
    
    // Quick Club Creator
    'dev.quick_club_title': 'Tạo CLB Nhanh',
    'dev.quick_club_desc': 'Tạo câu lạc bộ test với thông tin kinh doanh và địa điểm thực tế',
    'dev.club_count': 'Số lượng CLB (1-10)',
    'dev.auto_approve': 'Tự động duyệt CLB (tạo hồ sơ CLB)',
    'dev.club_features': 'Tính năng CLB được tạo:',
    'dev.realistic_names': '• Tên CLB và địa chỉ Việt Nam thực tế',
    'dev.operating_hours': '• Giờ hoạt động và số bàn ngẫu nhiên',
    'dev.pricing_structure': '• Cấu trúc giá đa dạng (cơ bản, thường, cao điểm, cuối tuần)',
    'dev.random_amenities': '• Tiện ích ngẫu nhiên (WiFi, bãi đỗ xe, nhà hàng, v.v.)',
    'dev.manager_contact': '• Thông tin liên hệ quản lý được tạo tự động',
    'dev.test_accounts': '• Tài khoản người dùng test cho quyền sở hữu CLB',
    'dev.create_clubs': 'Tạo {count} CLB Test',
    'dev.creating_clubs': 'Đang tạo CLB...',
    'dev.clubs_created': 'CLB đã tạo thành công',
    'dev.clubs_created_desc': 'Đã tạo {count} CLB test',
    'dev.with_approved_status': 'với trạng thái đã duyệt và hồ sơ CLB',
    'dev.pending_approval': 'chờ phê duyệt',
    'dev.and_more': '... và {count} CLB khác',
    
    // Test Data Populator
    'dev.test_data_title': 'Tạo Dữ Liệu Test',
    'dev.test_data_desc': 'Tạo dữ liệu test toàn diện cho tất cả các tính năng',
    'dev.select_data_types': 'Chọn loại dữ liệu cần tạo:',
    'dev.tournaments_data': 'Giải đấu với đăng ký và trạng thái khác nhau',
    'dev.matches_data': 'Kết quả trận đấu với tính toán ELO',
    'dev.challenges_data': 'Yêu cầu thách đấu giữa người dùng',
    'dev.spa_points_data': 'Trao điểm SPA cho các hoạt động khác nhau',
    'dev.notifications_data': 'Tạo thông báo hệ thống cho người dùng',
    'dev.populate_data': 'Tạo Dữ Liệu Test',
    'dev.populating': 'Đang tạo dữ liệu...',
    'dev.population_complete': 'Tạo dữ liệu hoàn thành',
    'dev.data_created': 'Đã tạo thành công dữ liệu test:',
    'dev.tournaments_created': 'Giải đấu: {count}',
    'dev.matches_created': 'Trận đấu: {count}',
    'dev.challenges_created': 'Thách đấu: {count}',
    'dev.spa_points_awarded': 'Điểm SPA: {count}',
    'dev.notifications_sent': 'Thông báo: {count}',
    
    // Database Reset Tools
    'dev.db_reset_title': 'Công Cụ Reset Database',
    'dev.db_reset_desc': 'Xóa dữ liệu test, xuất/nhập tập dữ liệu, và quản lý trạng thái database',
    'dev.warning_title': 'CẢNH BÁO:',
    'dev.warning_desc': 'Những công cụ này sẽ xóa vĩnh viễn dữ liệu. Luôn sao lưu dữ liệu quan trọng trước khi thực hiện.',
    'dev.select_tables': 'Chọn bảng để reset:',
    'dev.danger_warning': 'NGUY HIỂM:',
    'dev.danger_desc': 'Bạn đã chọn bảng chứa dữ liệu người dùng. Thao tác này chỉ xóa người dùng test, nhưng hãy thận trọng tối đa.',
    'dev.reset_tables': 'Reset Bảng Đã Chọn ({count})',
    'dev.export_data': 'Xuất Dữ Liệu',
    'dev.import_data': 'Nhập Dữ Liệu',
    'dev.safety_features': 'Tính năng An toàn:',
    'dev.profile_reset_safe': '• Reset hồ sơ chỉ xóa người dùng test (số điện thoại bắt đầu bằng 09)',
    'dev.export_backup': '• Chức năng xuất sao lưu dữ liệu trước khi reset',
    'dev.import_restore': '• Nhập cho phép khôi phục từ file sao lưu',
    'dev.confirmation_dialog': '• Hộp thoại xác nhận ngăn chặn reset vô tình',
    'dev.preserve_real_data': '• Dữ liệu người dùng thật được bảo tồn khi có thể',
    
    // Common
    'common.access_denied': 'Truy cập bị từ chối',
    'common.no_permission': 'Bạn không có quyền truy cập trang này.',
    'common.loading': 'Đang tải...',
    'common.delete': 'Xóa',
    'common.edit': 'Chỉnh sửa',
    'common.save': 'Lưu',
    'common.close': 'Đóng',
    'common.confirm': 'Xác nhận',
    'common.yes': 'Có',
    'common.no': 'Không',
    
    // Tournament Pages
    'tournament.page_title': 'Giải đấu',
    'tournament.page_subtitle': 'Tham gia các giải đấu và thi đấu với người chơi khác',
    'tournament.live_broadcast': 'Phát sóng trực tiếp',
    'tournament.create_tournament': 'Tạo giải đấu',
    'tournament.all': 'Tất cả',
    'tournament.upcoming': 'Sắp diễn ra',
    'tournament.registration_open': 'Đang mở đăng ký',
    'tournament.ongoing': 'Đang diễn ra',
    'tournament.completed': 'Đã kết thúc',
    'tournament.no_tournaments': 'Không có giải đấu nào',
    'tournament.no_tournaments_status': 'Không có giải đấu nào ở trạng thái',
    'tournament.no_tournaments_created': 'Chưa có giải đấu nào được tạo',
    'tournament.create_first': 'Tạo giải đấu đầu tiên',
    'tournament.back_to_tournaments': 'Quay lại danh sách giải đấu',
    'tournament.registration_updated': 'Trạng thái đăng ký đã được cập nhật!',
    'tournament.created_success': 'Giải đấu đã được tạo thành công!',
    
    // Tournament Status
    'tournament.status.upcoming': 'Sắp diễn ra',
    'tournament.status.registration_open': 'Đang mở đăng ký',
    'tournament.status.registration_closed': 'Đã đóng đăng ký',
    'tournament.status.ongoing': 'Đang diễn ra',
    'tournament.status.completed': 'Đã kết thúc',
    
    // Tournament Categories
    'tournament.category.amateur': 'Nghiệp dư',
    'tournament.category.professional': 'Chuyên nghiệp',
    'tournament.category.championship': 'Vô địch'
  },
  en: {
    // Admin Navigation
    'admin.dashboard': 'Dashboard',
    'admin.users': 'User Management',
    'admin.clubs': 'Club Management',
    'admin.tournaments': 'Tournament Management',
    'admin.transactions': 'Transactions',
    'admin.analytics': 'Analytics',
    'admin.ai_assistant': 'AI Assistant',
    'admin.test_ranking': 'Test Ranking',
    'admin.development': 'Development Tools',
    'admin.settings': 'Settings',
    'admin.home': 'Go to Home',
    'admin.logout': 'Logout',
    'admin.panel': 'Admin Panel',
    
    // Admin Dashboard
    'admin.dashboard_title': 'Admin Dashboard',
    'admin.dashboard_desc': 'SABO Pool Arena system overview',
    'admin.system_status': 'System Status',
    'admin.system_healthy': 'System running smoothly',
    'admin.system_warning': 'System warning',
    'admin.system_error': 'System error',
    'admin.last_updated': 'Updated',
    'admin.total_users': 'Total Users',
    'admin.pending_club_registrations': 'Pending Club Registrations',
    'admin.approved_clubs': 'Approved Clubs',
    'admin.unread_notifications': 'Unread Notifications',
    'admin.today': 'today',
    'admin.approval_rate': 'approval rate',
    'admin.high_priority': 'high priority',
    'admin.quick_actions': 'Quick Actions',
    'admin.common_actions': 'Common actions',
    'admin.approve_clubs': 'Approve Club Registrations',
    'admin.manage_tournaments': 'Manage Tournaments',
    'admin.manage_users': 'Manage Users',
    'admin.club_registration_status': 'Club Registration Status',
    'admin.club_stats': 'Club registration statistics',
    'admin.total_registrations': 'Total Registrations',
    'admin.pending': 'Pending',
    'admin.approved': 'Approved',
    'admin.rejected': 'Rejected',
    'admin.system_notifications': 'System Notifications',
    'admin.notification_status': 'Notification status',
    'admin.total_notifications': 'Total Notifications',
    'admin.unread': 'Unread',
    'admin.refresh_stats': 'Refresh Statistics',
    
    // Club Management
    'admin.club_management': 'Club Management',
    'admin.pending_registrations': 'Pending Registrations',
    'admin.approved_clubs_tab': 'Approved Clubs',
    
    // User Management
    'admin.user_management': 'User Management',
    'admin.user_management_desc': 'Manage user information and status',
    'admin.search_users': 'Search users...',
    'admin.status': 'Status',
    'admin.all': 'All',
    'admin.active': 'Active',
    'admin.inactive': 'Inactive',
    'admin.banned': 'Banned',
    'admin.user_list': 'User List',
    'admin.total_users_count': 'Total {count} users',
    'admin.not_updated': 'Not updated',
    'admin.no_phone': 'No phone',
    'admin.not_verified': 'Not verified',
    'admin.joined': 'Joined',
    'admin.updated': 'Updated',
    'admin.view_details': 'View Details',
    'admin.unlock_account': 'Unlock Account',
    'admin.ban_account': 'Ban Account',
    'admin.upgrade_premium': 'Upgrade Premium',
    'admin.cancel_premium': 'Cancel Premium',
    'admin.ban_user_title': 'Ban User Account',
    'admin.ban_user_desc': 'Are you sure you want to ban {name}\'s account? Please enter the reason for banning.',
    'admin.ban_reason_placeholder': 'Enter reason for banning...',
    'admin.cancel': 'Cancel',
    'admin.processing': 'Processing...',
    'admin.no_users_found': 'No users found',
    
    // Development Tools
    'admin.dev_tools': 'Development Tools',
    'admin.dev_warning': 'These tools are for development and testing purposes only. Use with caution in production environments.',
    'admin.bulk_user_gen': 'Bulk User Generator',
    'admin.bulk_user_desc': 'Generate multiple test users with realistic Vietnamese names and profiles',
    'admin.quick_club': 'Quick Club Creator',
    'admin.quick_club_desc': 'Generate test clubs with realistic business information and locations',
    'admin.test_data': 'Test Data',
    'admin.test_data_desc': 'Generate comprehensive test data for all features',
    'admin.db_tools': 'Database Tools',
    'admin.db_tools_desc': 'Clear test data, export/import datasets, and manage database state',
    
    // Bulk User Generator
    'dev.bulk_user_title': 'Bulk User Generator',
    'dev.bulk_user_desc': 'Generate multiple test users with realistic Vietnamese names and profiles',
    'dev.user_count': 'Number of Users (10-100)',
    'dev.skill_distribution': 'Skill Distribution',
    'dev.mixed_levels': 'Mixed Levels',
    'dev.all_beginner': 'All Beginner',
    'dev.all_intermediate': 'All Intermediate',
    'dev.all_advanced': 'All Advanced',
    'dev.all_professional': 'All Professional',
    'dev.generate_ranking': 'Generate ranking data',
    'dev.include_spa_points': 'Include SPA points',
    'dev.generating_users': 'Generating users...',
    'dev.generate_users': 'Generate {count} Users',
    'dev.generating': 'Generating...',
    'dev.generation_complete': 'Generation Complete',
    'dev.users_created': 'Successfully created {count} test users with profiles',
    'dev.with_ranking': 'and ranking data',
    'dev.with_spa_points': 'including SPA points',
    
    // Quick Club Creator
    'dev.quick_club_title': 'Quick Club Creator',
    'dev.quick_club_desc': 'Generate test clubs with realistic business information and locations',
    'dev.club_count': 'Number of Clubs (1-10)',
    'dev.auto_approve': 'Auto-approve clubs (create club profiles)',
    'dev.club_features': 'Generated Club Features:',
    'dev.realistic_names': '• Realistic Vietnamese club names and addresses',
    'dev.operating_hours': '• Random operating hours and table counts',
    'dev.pricing_structure': '• Varied pricing structures (basic, normal, peak, weekend)',
    'dev.random_amenities': '• Random amenities (WiFi, parking, restaurant, etc.)',
    'dev.manager_contact': '• Auto-generated manager contact information',
    'dev.test_accounts': '• Test user accounts for club ownership',
    'dev.create_clubs': 'Create {count} Test Clubs',
    'dev.creating_clubs': 'Creating Clubs...',
    'dev.clubs_created': 'Clubs Created Successfully',
    'dev.clubs_created_desc': 'Created {count} test clubs',
    'dev.with_approved_status': 'with approved status and club profiles',
    'dev.pending_approval': 'pending approval',
    'dev.and_more': '... and {count} more clubs',
    
    // Test Data Populator
    'dev.test_data_title': 'Test Data Populator',
    'dev.test_data_desc': 'Generate comprehensive test data for all features',
    'dev.select_data_types': 'Select data types to generate:',
    'dev.tournaments_data': 'Create tournaments with registrations and different statuses',
    'dev.matches_data': 'Generate match results with ELO calculations',
    'dev.challenges_data': 'Create challenge requests between users',
    'dev.spa_points_data': 'Award SPA points for various activities',
    'dev.notifications_data': 'Generate system notifications for users',
    'dev.populate_data': 'Populate Test Data',
    'dev.populating': 'Populating data...',
    'dev.population_complete': 'Population Complete',
    'dev.data_created': 'Successfully created test data:',
    'dev.tournaments_created': 'Tournaments: {count}',
    'dev.matches_created': 'Matches: {count}',
    'dev.challenges_created': 'Challenges: {count}',
    'dev.spa_points_awarded': 'SPA Points: {count}',
    'dev.notifications_sent': 'Notifications: {count}',
    
    // Database Reset Tools
    'dev.db_reset_title': 'Database Reset Tools',
    'dev.db_reset_desc': 'Clear test data, export/import datasets, and manage database state',
    'dev.warning_title': 'WARNING:',
    'dev.warning_desc': 'These tools will permanently delete data. Always backup important data before proceeding.',
    'dev.select_tables': 'Select Tables to Reset:',
    'dev.danger_warning': 'DANGER:',
    'dev.danger_desc': 'You have selected tables containing user data. This operation will only delete test users, but use extreme caution.',
    'dev.reset_tables': 'Reset Selected Tables ({count})',
    'dev.export_data': 'Export Data',
    'dev.import_data': 'Import Data',
    'dev.safety_features': 'Safety Features:',
    'dev.profile_reset_safe': '• Profile reset only removes test users (phone starting with 09)',
    'dev.export_backup': '• Export functionality backs up data before reset',
    'dev.import_restore': '• Import allows restoration from backup files',
    'dev.confirmation_dialog': '• Confirmation dialog prevents accidental resets',
    'dev.preserve_real_data': '• Real user data is preserved when possible',
    
    // Common
    'common.access_denied': 'Access Denied',
    'common.no_permission': 'You don\'t have permission to access this page.',
    'common.loading': 'Loading...',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.save': 'Save',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No'
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get saved language from localStorage, default to Vietnamese
    const saved = localStorage.getItem('admin-language');
    return (saved as Language) || 'vi';
  });

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin-language', language);
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    const translation = translations[language][key as keyof typeof translations[typeof language]];
    
    if (translation) {
      return translation;
    }
    
    // If not found in current language, try fallback or return key
    return fallback || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Helper function for interpolation
export const interpolate = (template: string, variables: Record<string, string | number>): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key]?.toString() || match;
  });
};