import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, TrendingUp, AlertCircle } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

interface Horse {
  horse_name: string;
  distance: number;
  days_since_last_race: number;
  PREV_RACE_WON: number;
  WIN_STREAK: number;
  IMPLIED_PROBABILITY: number;
  NORMALIZED_VOLUME: number;
  MARKET_ACTIVITY_WINDOW_HOURS: number;
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [horses, setHorses] = useState<Horse[]>([{
    horse_name: "Thunder",
    distance: 1400,
    days_since_last_race: 14,
    PREV_RACE_WON: 1,
    WIN_STREAK: 2,
    IMPLIED_PROBABILITY: 0.25,
    NORMALIZED_VOLUME: 0.15,
    MARKET_ACTIVITY_WINDOW_HOURS: 4.5,
  }, {
    horse_name: "Lightning",
    distance: 1400,
    days_since_last_race: 7,
    PREV_RACE_WON: 0,
    WIN_STREAK: 0,
    IMPLIED_PROBABILITY: 0.20,
    NORMALIZED_VOLUME: 0.12,
    MARKET_ACTIVITY_WINDOW_HOURS: 3.2,
  }]);
  const [predictions, setPredictions] = useState<any>(null);
  const [signals, setSignals] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const predictMutation = trpc.prediction.predictRanking.useMutation();
  const signalsMutation = trpc.prediction.bettingSignals.useQuery({ predictions: predictions || { predictions: [] }, confidenceThreshold: 0.65 }, { enabled: false });

  const handlePredict = async () => {
    setLoading(true);
    try {
      const result = await predictMutation.mutateAsync(horses);
      setPredictions(result);
      
      // Get betting signals
      if (result.success || result.predictions) {
        const signalsResult = await signalsMutation.refetch();
        if (signalsResult.data) {
          setSignals(signalsResult.data);
        }
      }
    } catch (error) {
      console.error("Prediction failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "STRONG_BUY":
        return "bg-green-900 text-green-100";
      case "BUY":
        return "bg-emerald-900 text-emerald-100";
      case "HOLD":
        return "bg-yellow-900 text-yellow-100";
      case "WAIT":
        return "bg-red-900 text-red-100";
      default:
        return "bg-slate-700 text-slate-100";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "text-green-400";
    if (confidence >= 0.75) return "text-emerald-400";
    if (confidence >= 0.65) return "text-yellow-400";
    if (confidence >= 0.55) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Horse Race Prediction Engine</h2>
            <p className="text-lg text-slate-300">Advanced AI-powered predictions with confidence-based betting signals</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Card */}
            <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Race Data Input</CardTitle>
                <CardDescription>Enter horse race details for instant predictions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {horses.map((horse, idx) => (
                  <div key={idx} className="space-y-3 p-4 bg-slate-700/50 rounded-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Horse Name"
                        value={horse.horse_name}
                        onChange={(e) => {
                          const updated = [...horses];
                          updated[idx] = { ...updated[idx], horse_name: e.target.value };
                          setHorses(updated);
                        }}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                      <Input
                        type="number"
                        placeholder="Distance (m)"
                        value={horse.distance}
                        onChange={(e) => {
                          const updated = [...horses];
                          updated[idx] = { ...updated[idx], distance: parseFloat(e.target.value) };
                          setHorses(updated);
                        }}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        placeholder="Days Since Last Race"
                        value={horse.days_since_last_race}
                        onChange={(e) => {
                          const updated = [...horses];
                          updated[idx] = { ...updated[idx], days_since_last_race: parseFloat(e.target.value) };
                          setHorses(updated);
                        }}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                      <Input
                        type="number"
                        placeholder="Win Streak"
                        value={horse.WIN_STREAK}
                        onChange={(e) => {
                          const updated = [...horses];
                          updated[idx] = { ...updated[idx], WIN_STREAK: parseFloat(e.target.value) };
                          setHorses(updated);
                        }}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  onClick={handlePredict}
                  disabled={loading || predictMutation.isPending}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2"
                >
                  {loading || predictMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Get Predictions & Betting Signals
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Overall Recommendation Card */}
            {signals && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Race Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Overall Recommendation</p>
                    <Badge className={`text-lg px-3 py-1 ${
                      signals.overall_recommendation === "STRONG_BET" ? "bg-green-600" :
                      signals.overall_recommendation === "BET" ? "bg-emerald-600" :
                      signals.overall_recommendation === "CAUTIOUS_BET" ? "bg-yellow-600" :
                      "bg-red-600"
                    }`}>
                      {signals.overall_recommendation}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400 mb-1">Top Horse</p>
                    <p className="text-white font-semibold">{signals.top_horse}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400 mb-1">Top Confidence</p>
                    <p className={`text-lg font-bold ${getConfidenceColor(signals.top_confidence)}`}>
                      {(signals.top_confidence * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400 mb-1">Race Difficulty</p>
                    <Badge variant="outline" className="text-slate-300">
                      {signals.race_difficulty}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Predictions & Signals */}
          {predictions && predictions.predictions && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">Detailed Predictions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predictions.predictions.map((pred: any, idx: number) => {
                  const signal = signals?.signals?.[idx];
                  return (
                    <Card key={idx} className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-slate-400">Horse #{pred.rank}</p>
                            <p className="text-xl font-bold text-white">{pred.horse_name}</p>
                          </div>
                          {signal && (
                            <Badge className={getSignalColor(signal.signal)}>
                              {signal.signal}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-400">Ranking Score</p>
                            <p className="text-lg font-semibold text-amber-400">
                              {pred.ranking_score.toFixed(4)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Confidence</p>
                            <p className={`text-lg font-semibold ${getConfidenceColor(pred.confidence || 0)}`}>
                              {((pred.confidence || 0) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        {signal && (
                          <>
                            <div className="border-t border-slate-700 pt-3">
                              <p className="text-xs text-slate-400 mb-1">Betting Recommendation</p>
                              <p className="text-sm text-slate-200">{signal.recommendation}</p>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <p className="text-xs text-slate-400">Confidence Level</p>
                                <p className="text-sm font-semibold text-slate-200">{signal.confidence_level}</p>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-slate-400">Expected ROI</p>
                                <p className="text-sm font-semibold text-green-400">{signal.expected_roi}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Disclaimer */}
              <Card className="bg-amber-900/30 border-amber-700">
                <CardContent className="pt-6 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-100">
                      <strong>Disclaimer:</strong> Predictions are based on historical data and machine learning models. Past performance does not guarantee future results. Always bet responsibly and within your means.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
