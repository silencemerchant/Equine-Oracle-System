import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Activity, BarChart3, Shield, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
            <span className="text-xl font-bold text-primary">{APP_TITLE}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/live">
              <Button variant="ghost">Live Races</Button>
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/history">
                  <Button variant="ghost">History</Button>
                </Link>
                <Link href="/subscription">
                  <Button variant="outline">Subscription</Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="default">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Horse Racing Predictions</span>
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Predict Winners with
            <span className="text-primary"> Machine Learning</span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Harness the power of advanced AI algorithms to predict New Zealand TAB horse race
            winners with unprecedented accuracy. Get confidence scores, detailed analysis, and
            real-time predictions.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/live">
              <Button size="lg" className="w-full sm:w-auto">
                <Zap className="mr-2 h-5 w-5" />
                View Live Races
              </Button>
            </Link>
            {!isAuthenticated && (
              <a href={getLoginUrl()}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </a>
            )}
            <Link href="/subscription">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Why Choose {APP_TITLE}?
          </h2>
          <p className="text-muted-foreground">
            Advanced machine learning meets horse racing expertise
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Real-Time Predictions</CardTitle>
              <CardDescription>
                Get instant AI-powered predictions for upcoming races with confidence scores
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Access detailed performance metrics, historical trends, and model insights
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Ensemble Models</CardTitle>
              <CardDescription>
                Premium tiers use multiple ML models for superior accuracy and reliability
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Proven Accuracy</CardTitle>
              <CardDescription>
                Models trained on extensive historical data with validated performance metrics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Get predictions in seconds with our optimized prediction engine
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Prediction History</CardTitle>
              <CardDescription>
                Track all your predictions and analyze your betting performance over time
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Ready to Start Winning?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of users making smarter betting decisions with AI
            </p>
            {isAuthenticated ? (
              <Link href="/predict">
                <Button size="lg">
                  <Zap className="mr-2 h-5 w-5" />
                  Make Your First Prediction
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg">Start Free Trial</Button>
              </a>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 {APP_TITLE}. Powered by advanced machine learning.</p>
        </div>
      </footer>
    </div>
  );
}
