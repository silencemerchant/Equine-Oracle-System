import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, Brain, Zap, TrendingUp, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      // Redirect to login
      window.location.href = "/api/oauth/login";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold">Equine Oracle</span>
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
              </>
            ) : (
              <Button onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
          AI-Powered Horse Racing Predictions
        </Badge>
        
        <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
          Stop Guessing.
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Start Winning.
          </span>
        </h1>
        
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Get confidence-based betting signals for NZ TAB races. Our machine learning models analyze years of racing data to predict winners with 78% accuracy on top-3 finishes.
        </p>
        
        <Button
          onClick={handleGetStarted}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
        >
          Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Equine Oracle?</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <Brain className="w-10 h-10 text-blue-400 mb-4" />
              <CardTitle>AI-Powered</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              Advanced machine learning models trained on years of racing data. Continuously improving through live feedback.
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <Zap className="w-10 h-10 text-yellow-400 mb-4" />
              <CardTitle>Real-Time Signals</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              Get betting signals instantly. Know exactly when to bet, when to hold, and when to skip based on confidence scores.
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <Shield className="w-10 h-10 text-green-400 mb-4" />
              <CardTitle>Risk Management</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              Transparent confidence scoring. See exactly why each prediction is made. Manage your risk with data-driven insights.
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <BarChart3 className="w-10 h-10 text-purple-400 mb-4" />
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              Track your ROI, calibration metrics, and performance trends. Understand what works for your betting strategy.
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <TrendingUp className="w-10 h-10 text-orange-400 mb-4" />
              <CardTitle>Proven Results</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              78% accuracy on historical top-3 predictions. Backtested across thousands of races with consistent performance.
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <ArrowRight className="w-10 h-10 text-cyan-400 mb-4" />
              <CardTitle>API Access</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              Integrate predictions into your own platform. Professional-grade API with webhooks and custom parameters.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Basic Tier */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl">Predictor Basic</CardTitle>
              <CardDescription className="text-slate-400">For casual bettors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-4xl font-bold">NZ$29</span>
                <span className="text-slate-400 ml-2">/month</span>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>5 predictions per day</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Confidence scores</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Email notifications</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>7-day history</span>
                </li>
              </ul>
              
              <Button onClick={handleGetStarted} className="w-full bg-slate-700 hover:bg-slate-600">
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className="bg-blue-600/20 border-blue-500/50 relative">
            <div className="absolute -top-3 right-4">
              <Badge className="bg-blue-600 text-white">Most Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Predictor Pro</CardTitle>
              <CardDescription className="text-slate-400">For serious bettors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-4xl font-bold">NZ$79</span>
                <span className="text-slate-400 ml-2">/month</span>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Unlimited predictions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>SMS + email alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>90-day history</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Monthly reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              
              <Button onClick={handleGetStarted} className="w-full bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* API Tiers */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl">Oracle API - Starter</CardTitle>
              <CardDescription className="text-slate-400">For developers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-4xl font-bold">NZ$199</span>
                <span className="text-slate-400 ml-2">/month</span>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>REST API access</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>10,000 calls/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Webhooks</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Basic support</span>
                </li>
              </ul>
              
              <Button onClick={handleGetStarted} className="w-full bg-slate-700 hover:bg-slate-600">
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Professional API Tier */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl">Oracle API - Professional</CardTitle>
              <CardDescription className="text-slate-400">For platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-4xl font-bold">NZ$499</span>
                <span className="text-slate-400 ml-2">/month</span>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>REST API access</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>100,000 calls/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Custom parameters</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>SLA support</span>
                </li>
              </ul>
              
              <Button onClick={handleGetStarted} className="w-full bg-slate-700 hover:bg-slate-600">
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Improve Your Betting?</h2>
        <p className="text-xl text-slate-300 mb-8">
          Join hundreds of NZ bettors using AI-powered predictions to make smarter decisions.
        </p>
        <Button
          onClick={handleGetStarted}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
        >
          Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 py-8 text-center text-slate-400">
        <p>&copy; 2024 Equine Oracle. All rights reserved. | NZ-based horse racing predictions</p>
      </footer>
    </div>
  );
}
