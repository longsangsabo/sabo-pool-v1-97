import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ui/error-boundary";
import { AuthProvider } from "@/hooks/useAuth";
import { AvatarProvider } from "@/contexts/AvatarContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MonitoringProvider } from "@/contexts/MonitoringProvider";
import MainLayout from "@/components/MainLayout";
import DailyNotificationSystem from "@/components/DailyNotificationSystem";
import RealtimeNotificationSystem from "@/components/RealtimeNotificationSystem";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Import components directly instead of lazy loading to avoid loading issues
import SimpleDashboard from "./pages/SimpleDashboard";
import SimpleBookingPage from "./pages/SimpleBookingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import SimpleClubHomePage from "./pages/SimpleClubHomePage";
import SimpleClubBookingPage from "./pages/SimpleClubBookingPage";
import SimpleClubAboutPage from "./pages/SimpleClubAboutPage";
import SimpleClubContactPage from "./pages/SimpleClubContactPage";
import SystemAuditPage from "./pages/SystemAuditPage";
import TestPage from "./pages/TestPage";
import EnhancedLoginPage from "./pages/EnhancedLoginPage";
import EnhancedRegisterPage from "./pages/EnhancedRegisterPage";
import EnhancedChallengesPageV2 from "./pages/EnhancedChallengesPageV2";
import CreateTournamentExample from "./pages/CreateTournamentExample";

// Import all other pages
import AboutPage from "./pages/AboutPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AuthTestPage from "./pages/AuthTestPage";
import BlogPage from "./pages/BlogPage";
import ChallengesPage from "./pages/ChallengesPage";
import ChatPage from "./pages/ChatPage";
import ClubDetailPage from "./pages/ClubDetailPage";
import ClubsPage from "./pages/ClubsPage";

import Dashboard from "./pages/Dashboard";
import DashboardPage from "./pages/DashboardPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import AuthWrapper from "./components/AuthWrapper";
import DashboardOverview from "./pages/DashboardOverview";
import DiscoveryPage from "./pages/DiscoveryPage";
import EnhancedChallengesPage from "./pages/EnhancedChallengesPage";
import EnhancedDiscoveryPage from "./pages/EnhancedDiscoveryPage";
import EnhancedLeaderboardPage from "./pages/EnhancedLeaderboardPage";
import EnhancedMarketplacePage from "./pages/EnhancedMarketplacePage";
import FAQPage from "./pages/FAQPage";
import FeedPage from "./pages/FeedPage";
import HelpPage from "./pages/HelpPage";
import Index from "./pages/Index";
import InboxPage from "./pages/InboxPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import NotificationsPage from "./pages/NotificationsPage";
import LiveStreamPage from "./pages/LiveStreamPage";
import MarketplacePage from "./pages/MarketplacePage";
import MatchHistoryPage from "./pages/MatchHistoryPage";
import MembershipPage from "./pages/MembershipPage";
import NotFound from "./pages/NotFound";
import PaymentClubMembershipPage from "./pages/PaymentClubMembershipPage";
import PaymentMembershipPage from "./pages/PaymentMembershipPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PrivacyPage from "./pages/PrivacyPage";
import ProfilePage from "./pages/ProfilePage";
import RankingPage from "./pages/RankingPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SecurityPage from "./pages/SecurityPage";
import SettingsPage from "./pages/SettingsPage";
import SocialFeedPage from "./pages/SocialFeedPage";
import SystemHealthPage from "./pages/SystemHealthPage";
import TermsPage from "./pages/TermsPage";
import TournamentDiscoveryPage from "./pages/TournamentDiscoveryPage";
import TournamentsPage from "./pages/TournamentsPage";
import WalletPage from "./pages/WalletPage";
import SiteMapPage from "./pages/SiteMapPage";
import PracticeFinderPage from "./pages/PracticeFinderPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTournaments from "./pages/admin/AdminTournaments";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminClubs from "./pages/admin/AdminClubs";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminAutomation from "./pages/admin/AdminAutomation";
import AdminDevelopment from "./pages/admin/AdminDevelopment";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTestRanking from "./pages/admin/AdminTestRanking";
import AdminLayout from "./components/AdminLayout";
import AdminAIAssistant from "./pages/admin/AdminAIAssistant";
import ClubManagementPage from "./pages/ClubManagementPage";
import ClubRegistrationPage from "./pages/ClubRegistrationPage";
import TournamentDetailsPage from "./pages/TournamentDetailsPage";
import { AdminMonitoringPage } from "./pages/admin/AdminMonitoringPage";

// Enhanced loading fallback with LoadingSpinner
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LoadingSpinner size="lg" text="Đang tải trang..." />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  console.log("App component is loading...");

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <TooltipProvider>
              <AuthProvider>
                <MonitoringProvider>
                  <AvatarProvider>
                  <LanguageProvider>
                <BrowserRouter>
                  <RealtimeNotificationSystem />
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<MainLayout />}>
                        {/* Routes with navigation */}
                        {/* Trang chính */}
                        <Route index element={<SimpleDashboard />} />
                        <Route path="dashboard" element={<AuthWrapper><DashboardPage /></AuthWrapper>} />
                        <Route path="dashboard-overview" element={<DashboardOverview />} />
                        <Route path="index" element={<Index />} />
                        
                        {/* Social & Feed */}
                        <Route path="feed" element={<FeedPage />} />
                        <Route path="social-feed" element={<SocialFeedPage />} />
                        <Route path="discovery" element={<DiscoveryPage />} />
                        <Route path="enhanced-discovery" element={<EnhancedDiscoveryPage />} />
                        
                        {/* Tournaments & Challenges */}
                        <Route path="tournaments" element={<TournamentsPage />} />
                        <Route path="tournaments/:id" element={<TournamentDetailsPage />} />
                        <Route path="tournament-discovery" element={<TournamentDiscoveryPage />} />
                        <Route path="tournament-example" element={<CreateTournamentExample />} />
                        
                        <Route path="challenges" element={<EnhancedChallengesPageV2 />} />
                        <Route path="challenges-v2" element={<EnhancedChallengesPageV2 />} />
                        <Route path="enhanced-challenges" element={<EnhancedChallengesPage />} />
                        
                        {/* Clubs & Membership */}
                        <Route path="clubs" element={<ClubsPage />} />
                        <Route path="club/:id" element={<ClubDetailPage />} />
                        <Route path="club-registration" element={<ClubRegistrationPage />} />
                        <Route path="membership" element={<MembershipPage />} />
                        
                        {/* Leaderboard & Ranking */}
                        <Route path="leaderboard" element={<LeaderboardPage />} />
                        <Route path="enhanced-leaderboard" element={<EnhancedLeaderboardPage />} />
                        <Route path="ranking" element={<RankingPage />} />
                        
                        {/* Marketplace & Wallet */}
                        <Route path="marketplace" element={<MarketplacePage />} />
                        <Route path="enhanced-marketplace" element={<EnhancedMarketplacePage />} />
                        <Route path="wallet" element={<WalletPage />} />
                        
                        {/* Payment */}
                        <Route path="payment-membership" element={<PaymentMembershipPage />} />
                        <Route path="payment-club-membership" element={<PaymentClubMembershipPage />} />
                        <Route path="payment-result" element={<PaymentResultPage />} />
                        <Route path="payment-success" element={<PaymentSuccessPage />} />
                        
                        {/* Profile & Settings */}
                        <Route path="profile" element={<AuthWrapper><ProfilePage /></AuthWrapper>} />
                        <Route path="players/:userId" element={<PublicProfilePage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="security" element={<SecurityPage />} />
                        
                        {/* Chat & History */}
                        <Route path="chat" element={<ChatPage />} />
                        <Route path="matches" element={<MatchHistoryPage />} />
                        <Route path="my-matches" element={<MatchHistoryPage />} />
                        <Route path="live-stream" element={<LiveStreamPage />} />
                        <Route path="notifications" element={<AuthWrapper><NotificationsPage /></AuthWrapper>} />
                        <Route path="inbox" element={<AuthWrapper><InboxPage /></AuthWrapper>} />
                        
                        {/* Information pages */}
                        <Route path="about" element={<AboutPage />} />
                        <Route path="help" element={<HelpPage />} />
                        <Route path="faq" element={<FAQPage />} />
                        <Route path="blog" element={<BlogPage />} />
                        <Route path="terms" element={<TermsPage />} />
                        <Route path="privacy" element={<PrivacyPage />} />
                        
                        {/* Admin & Analytics */}
                        <Route path="analytics" element={<AnalyticsPage />} />
                        <Route path="system-health" element={<SystemHealthPage />} />
                        <Route path="system-audit" element={<SystemAuditPage />} />
                        
                        {/* Test page */}
                        <Route path="test" element={<TestPage />} />
                        <Route path="sitemap" element={<SiteMapPage />} />
                        <Route path="practice" element={<AuthWrapper><PracticeFinderPage /></AuthWrapper>} />
                        <Route path="club-management" element={<AuthWrapper><ClubManagementPage /></AuthWrapper>} />
                      </Route>
                      
                       {/* Admin routes - nested with AdminLayout wrapper */}
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="tournaments" element={<AdminTournaments />} />
                        <Route path="transactions" element={<AdminTransactions />} />
                        <Route path="clubs" element={<AdminClubs />} />
                        <Route path="analytics" element={<AdminAnalytics />} />
                        <Route path="ai-assistant" element={<AdminAIAssistant />} />
                        <Route path="automation" element={<AdminAutomation />} />
                        <Route path="development" element={<AdminDevelopment />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="test-ranking" element={<AdminTestRanking />} />
                        <Route path="monitoring" element={<AdminMonitoringPage />} />
                      </Route>
                      
                      {/* Auth routes - standalone without layout */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/auth/login" element={<LoginPage />} />
                      <Route path="/auth/register" element={<EnhancedRegisterPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/auth/callback" element={<AuthCallbackPage />} />
                      <Route path="/auth-test" element={<AuthTestPage />} />
                      
                      {/* Simple Club Pages - standalone without layout */}
                      <Route path="/simple-club" element={<SimpleClubHomePage />} />
                      <Route path="/simple-booking" element={<SimpleClubBookingPage />} />
                      <Route path="/simple-about" element={<SimpleClubAboutPage />} />
                      <Route path="/simple-contact" element={<SimpleClubContactPage />} />
                      <Route path="/booking" element={<SimpleBookingPage />} />
                      
                      <Route path="*" element={
                        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                          <div className="text-center">
                            <h1 className="text-2xl mb-4">Trang không tìm thấy</h1>
                            <a href="/" className="text-primary hover:underline">Về trang chủ</a>
                          </div>
                        </div>
                      } />
                    </Routes>
                  </Suspense>
                  <DailyNotificationSystem />
                  <Toaster />
                  <Sonner />
                </BrowserRouter>
                </LanguageProvider>
                </AvatarProvider>
                </MonitoringProvider>
              </AuthProvider>
            </TooltipProvider>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;