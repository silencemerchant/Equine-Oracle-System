import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Loader2, MapPin, Ruler, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function History() {
  const { user, isAuthenticated } = useAuth();
  // TODO: Implement prediction history storage in database
  // For now, showing placeholder UI
  const predictions = [];
  const isLoading = false;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to view your prediction history</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence) {
      case "Very High":
        return "default";
      case "High":
        return "secondary";
      case "Medium":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
            <span className="text-xl font-bold text-primary">{APP_TITLE}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/predict">
              <Button variant="default">New Prediction</Button>
            </Link>
            <Link href="/subscription">
              <Button variant="outline">Subscription</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Prediction History</h1>
          <p className="text-muted-foreground">View all your past race predictions and results</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !predictions || predictions.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-12 text-center">
              <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">No predictions yet</h3>
              <p className="mb-6 text-muted-foreground">
                Start making predictions to see your history here
              </p>
              <Link href="/predict">
                <Button>Make Your First Prediction</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {predictions.map((prediction) => (
              <Card key={prediction.id} className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-foreground">
                        {prediction.horseName}
                      </CardTitle>
                      <CardDescription className="mt-1 flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {prediction.track}
                        </span>
                        <span className="flex items-center gap-1">
                          <Ruler className="h-4 w-4" />
                          {prediction.distance}m
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {prediction.raceDate}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant={getConfidenceBadgeVariant(prediction.confidence || "Low")}>
                      {prediction.confidence}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Win Probability</span>
                        <span className="font-semibold text-primary">
                          {prediction.ensemble.toFixed(2)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(prediction.ensemble, 100)}%` }}
                        />
                      </div>
                    </div>

                    {(prediction.xgboost || prediction.randomForest) && (
                      <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">
                            {prediction.lightgbm.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">LightGBM</div>
                        </div>
                        {prediction.xgboost && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-foreground">
                              {prediction.xgboost.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">XGBoost</div>
                          </div>
                        )}
                        {prediction.randomForest && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-foreground">
                              {prediction.randomForest.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Random Forest</div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(prediction.createdAt).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
