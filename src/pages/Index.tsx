
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, Star, PlayCircle, Target } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>SABO Pool Arena Hub - Nền tảng Billiards Việt Nam</title>
        <meta 
          name="description" 
          content="Nền tảng quản lý arena bi-a hàng đầu Việt Nam với hệ thống xếp hạng ELO, giải đấu trực tuyến và thanh toán VNPay"
        />
        <meta name="keywords" content="billiards, pool, vietnam, tournament, ranking, arena" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">SABO Pool Arena</h1>
          </div>
          <div className="flex space-x-4">
            <Link to="/login">
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-slate-900">
                Đăng nhập
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-yellow-400 text-slate-900 hover:bg-yellow-500">
                Đăng ký
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <Badge className="mb-4 bg-yellow-400 text-slate-900">
            Nền tảng Billiards #1 Việt Nam
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Nơi Hội Tụ
            <br />
            <span className="text-yellow-400">Tay Cơ Việt</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Tham gia cộng đồng billiards lớn nhất Việt Nam. Thách đấu, xếp hạng, 
            và trở thành cao thủ với hệ thống ELO chuyên nghiệp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-yellow-400 text-slate-900 hover:bg-yellow-500 px-8 py-3 text-lg">
                <PlayCircle className="mr-2 h-5 w-5" />
                Bắt đầu ngay
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-white border-white hover:bg-white hover:text-slate-900 px-8 py-3 text-lg"
            >
              Khám phá tính năng
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Tại sao chọn SABO Pool Arena?
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Hệ thống quản lý arena billiards toàn diện với công nghệ hiện đại
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Trophy className="h-12 w-12 text-yellow-400 mb-4" />
                <CardTitle className="text-white">Hệ thống ELO chuyên nghiệp</CardTitle>
                <CardDescription className="text-gray-300">
                  Xếp hạng công bằng và chính xác theo tiêu chuẩn quốc tế
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-gray-300 space-y-2">
                  <li>• Tính toán ELO real-time</li>
                  <li>• Theo dõi thống kê chi tiết</li>
                  <li>• Lịch sử trận đấu đầy đủ</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">Cộng đồng sôi động</CardTitle>
                <CardDescription className="text-gray-300">
                  Kết nối với hàng nghìn tay cơ trên toàn quốc
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-gray-300 space-y-2">
                  <li>• Thách đấu trực tuyến</li>
                  <li>• Chat và kết bạn</li>
                  <li>• Chia sẻ kinh nghiệm</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Calendar className="h-12 w-12 text-green-400 mb-4" />
                <CardTitle className="text-white">Giải đấu thường xuyên</CardTitle>
                <CardDescription className="text-gray-300">
                  Tham gia các giải đấu với giải thưởng hấp dẫn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-gray-300 space-y-2">
                  <li>• Giải đấu hàng tuần</li>
                  <li>• Giải thưởng tiền mặt</li>
                  <li>• Hệ thống bracket tự động</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">5,000+</div>
              <div className="text-gray-300">Người chơi</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">200+</div>
              <div className="text-gray-300">Arena đối tác</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">1,000+</div>
              <div className="text-gray-300">Giải đấu</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">50K+</div>
              <div className="text-gray-300">Trận đấu</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 border-0 max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-slate-900 mb-4">
                Sẵn sàng thể hiện kỹ năng?
              </CardTitle>
              <CardDescription className="text-slate-800 text-lg">
                Tham gia ngay hôm nay và bắt đầu hành trình trở thành cao thủ billiards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/register">
                <Button 
                  size="lg" 
                  className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-3 text-lg"
                >
                  Đăng ký miễn phí
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-slate-700">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 SABO Pool Arena Hub. Tất cả quyền được bảo lưu.</p>
            <p className="mt-2">Nền tảng billiards hàng đầu Việt Nam</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
