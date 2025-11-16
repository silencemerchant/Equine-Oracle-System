import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Zap } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [horses, setHorses] = useState<any[]>([{
    horse_name: "Horse 1",
    distance: 1400,
    days_since_last_race: 14,
    PREV_RACE_WON: 1,
    WIN_STREAK: 2,
    IMPLIED_PROBABILITY: 0.25,
    NORMALIZED_VOLUME: 0.15,
    MARKET_ACTIVITY_WINDOW_HOURS: 4.5,
  }]);
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const predictMutation = trpc.prediction.predictRanking.useMutation();

  const handlePredict = async () => {
    setLoading(true);
    try {
      const result = await predictMutation.mutateAsync(horses);
      setPredictions(result);
    } catch (error) {
      console.error("Prediction failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-white">{APP_TITLE}</h1>
          </div>
          <div>
            {isAuthenticated ? (
              <div className="text-sm text-slate-300">Welcome, {user?.name}</div>
            ) : (
              <Button onClick={() => window.location.href = getLoginUrl()}>Sign In</Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Horse Race Prediction Engine</h2>
            <p className="text-lg text-slate-300">Advanced AI-powered predictions for horse racing using LightGBM ranking models</p>
          </div>

          {/* Prediction Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Race Prediction</CardTitle>
              <CardDescription>Enter horse race details for instant predictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Horse Input */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Horse Name"
                    value={horses[0]?.horse_name || ""}
                    onChange={(e) => {
                      const updated = [...horses];
                      updated[0] = { ...updated[0], horse_name: e.target.value };
                      setHorses(updated);
                    }}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Input
                    type="number"
                    placeholder="Distance (m)"
                    value={horses[0]?.distance || ""}
                    onChange={(e) => {
                      const updated = [...horses];
                      updated[0] = { ...updated[0], distance: parseFloat(e.target.value) };
                      setHorses(updated);
                    }}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* Predictions Result */}
              {predictions && (
                <div className="bg-slate-700 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-white">Predictions:</h3>
                  {predictions.predictions?.map((pred: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm text-slate-300">
                      <span>{pred.horse_name}</span>
                      <span className="font-mono">Score: {pred.ranking_score.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Predict Button */}
              <Button
                onClick={handlePredict}
                disabled={loading || predictMutation.isPending}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {loading || predictMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Predicting...
                  </>
                ) : (
                  "Get Predictions"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
