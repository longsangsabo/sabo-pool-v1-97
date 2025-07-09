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
import MainLayout from "@/components/MainLayout";
import DailyNotificationSystem from "@/components/DailyNotificationSystem";
import RealtimeNotificationSystem from "@/components/RealtimeNotificationSystem";
import { createLazyComponent, PageLoadingFallback } from "@/components/ui/lazy-components";

// Optimized Query Client with enhanced caching strategy
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes for stable data
      gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
      retry: (failureCount, error: any) => {
        // Don't retry 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Lazy load all page components with optimized loading states
const LazySimpleDashboard = createLazyComponent(
  () => import("./pages/SimpleDashboard"),
  <PageLoadingFallback pageTitle="Dashboard" />,
  "SimpleDashboard"
);

const LazyTournamentsPage = createLazyComponent(
  () => import("./pages/TournamentsPage"),
  <PageLoadingFallback pageTitle="Tournaments" />,
  "TournamentsPage"
);

const LazyTournamentDetailsPage = createLazyComponent(
  () => import("./pages/TournamentDetailsPage"),
  <PageLoadingFallback pageTitle="Tournament Details" />,
  "TournamentDetailsPage"
);

const LazyEnhancedChallengesPageV2 = createLazyComponent(
  () => import("./pages/EnhancedChallengesPageV2"),
  <PageLoadingFallback pageTitle="Challenges" />,
  "EnhancedChallengesPageV2"
);

const LazyLeaderboardPage = createLazyComponent(
  () => import("./pages/LeaderboardPage"),
  <PageLoadingFallback pageTitle="Leaderboard" />,
  "LeaderboardPage"
);

const LazyEnhancedLeaderboardPage = createLazyComponent(
  () => import("./pages/EnhancedLeaderboardPage"),
  <PageLoadingFallback pageTitle="Enhanced Leaderboard" />,
  "EnhancedLeaderboardPage"
);

const LazyClubsPage = createLazyComponent(
  () => import("./pages/ClubsPage"),
  <PageLoadingFallback pageTitle="Clubs" />,
  "ClubsPage"
);

const LazyClubDetailPage = createLazyComponent(
  () => import("./pages/ClubDetailPage"),
  <PageLoadingFallback pageTitle="Club Details" />,
  "ClubDetailPage"
);

const LazyProfilePage = createLazyComponent(
  () => import("./pages/ProfilePage"),
  <PageLoadingFallback pageTitle="Profile" />,
  "ProfilePage"
);

const LazyDashboardPage = createLazyComponent(
  () => import("./pages/DashboardPage"),
  <PageLoadingFallback pageTitle="Dashboard" />,
  "DashboardPage"
);

const LazySettingsPage = createLazyComponent(
  () => import("./pages/SettingsPage"),
  <PageLoadingFallback pageTitle="Settings" />,
  "SettingsPage"
);

const LazyNotificationsPage = createLazyComponent(
  () => import("./pages/NotificationsPage"),
  <PageLoadingFallback pageTitle="Notifications" />,
  "NotificationsPage"
);

// Auth pages with specific loading states
const LazyLoginPage = createLazyComponent(
  () => import("./pages/LoginPage"),
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-full max-w-md space-y-6 px-4">
      <div className="h-8 bg-muted animate-pulse rounded" />
      <div className="space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
      </div>
    </div>
  </div>,
  "LoginPage"
);

const LazyRegisterPage = createLazyComponent(
  () => import("./pages/RegisterPage"),
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-full max-w-md space-y-6 px-4">
      <div className="h-8 bg-muted animate-pulse rounded" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  </div>,
  "RegisterPage"
);

// Admin pages - load only when needed
const LazyAdminDashboard = createLazyComponent(
  () => import("./pages/AdminDashboard"),
  <PageLoadingFallback pageTitle="Admin Dashboard" />,
  "AdminDashboard"
);

const LazyAdminUsers = createLazyComponent(
  () => import("./pages/admin/AdminUsers"),
  <PageLoadingFallback pageTitle="Admin Users" />,
  "AdminUsers"
);

const LazyAdminTournaments = createLazyComponent(
  () => import("./pages/admin/AdminTournaments"),
  <PageLoadingFallback pageTitle="Admin Tournaments" />,
  "AdminTournaments"
);

// Other frequently used pages
const LazyMarketplacePage = createLazyComponent(
  () => import("./pages/MarketplacePage"),
  <PageLoadingFallback pageTitle="Marketplace" />,
  "MarketplacePage"
);

const LazyWalletPage = createLazyComponent(
  () => import("./pages/WalletPage"),
  <PageLoadingFallback pageTitle="Wallet" />,
  "WalletPage"
);

const LazyMatchHistoryPage = createLazyComponent(
  () => import("./pages/MatchHistoryPage"),
  <PageLoadingFallback pageTitle="Match History" />,
  "MatchHistoryPage"
);

// Less frequently used pages - lazy load with smaller priority
const LazyAboutPage = createLazyComponent(() => import("./pages/AboutPage"));
const LazyFAQPage = createLazyComponent(() => import("./pages/FAQPage"));
const LazyHelpPage = createLazyComponent(() => import("./pages/HelpPage"));
const LazyPrivacyPage = createLazyComponent(() => import("./pages/PrivacyPage"));
const LazyTermsPage = createLazyComponent(() => import("./pages/TermsPage"));

// Auth wrapper with optimization
import AuthWrapper from "./components/AuthWrapper";

const App = () => {
  console.log("Optimized App component loading...");

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <TooltipProvider>
              <AuthProvider>
                <AvatarProvider>
                  <LanguageProvider>
                    <BrowserRouter>
                      <RealtimeNotificationSystem />
                      <Suspense fallback={<PageLoadingFallback />}>
                        <Routes>
                          <Route path="/" element={<MainLayout />}>
                            {/* Core app routes */}
                            <Route index element={<LazySimpleDashboard />} />
                            <Route path="dashboard" element={<AuthWrapper><LazyDashboardPage /></AuthWrapper>} />
                            
                            {/* Tournaments - high priority */}
                            <Route path="tournaments" element={<LazyTournamentsPage />} />
                            <Route path="tournaments/:id" element={<LazyTournamentDetailsPage />} />
                            
                            {/* Challenges - high priority */}
                            <Route path="challenges" element={<LazyEnhancedChallengesPageV2 />} />
                            
                            {/* Leaderboard - medium priority */}
                            <Route path="leaderboard" element={<LazyLeaderboardPage />} />
                            <Route path="enhanced-leaderboard" element={<LazyEnhancedLeaderboardPage />} />
                            
                            {/* Clubs - medium priority */}
                            <Route path="clubs" element={<LazyClubsPage />} />
                            <Route path="club/:id" element={<LazyClubDetailPage />} />
                            
                            {/* User pages - medium priority */}
                            <Route path="profile" element={<AuthWrapper><LazyProfilePage /></AuthWrapper>} />
                            <Route path="settings" element={<LazySettingsPage />} />
                            <Route path="notifications" element={<AuthWrapper><LazyNotificationsPage /></AuthWrapper>} />
                            
                            {/* Marketplace & Financial - medium priority */}
                            <Route path="marketplace" element={<LazyMarketplacePage />} />
                            <Route path="wallet" element={<LazyWalletPage />} />
                            <Route path="matches" element={<LazyMatchHistoryPage />} />
                            
                            {/* Static/Info pages - low priority */}
                            <Route path="about" element={<LazyAboutPage />} />
                            <Route path="help" element={<LazyHelpPage />} />
                            <Route path="faq" element={<LazyFAQPage />} />
                            <Route path="privacy" element={<LazyPrivacyPage />} />
                            <Route path="terms" element={<LazyTermsPage />} />
                          </Route>
                          
                          {/* Admin routes - only load when accessed */}
                          <Route path="/admin" element={<LazyAdminDashboard />} />
                          <Route path="/admin/users" element={<LazyAdminUsers />} />
                          <Route path="/admin/tournaments" element={<LazyAdminTournaments />} />
                          
                          {/* Auth routes - critical but separate bundle */}
                          <Route path="/login" element={<LazyLoginPage />} />
                          <Route path="/register" element={<LazyRegisterPage />} />
                          
                          {/* Fallback */}
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
              </AuthProvider>
            </TooltipProvider>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
