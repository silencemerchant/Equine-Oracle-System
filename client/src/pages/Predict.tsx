import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Radio, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Predict() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  const [selectedMeeting, setSelectedMeeting] = useState("");
  const [selectedRace, setSelectedRace] = useState("");
  const [selectedHorse, setSelectedHorse] = useState("");

  // Fetch all meetings
  const { data: meetings, isLoading: meetingsLoading } = trpc.races.todaysMeetings.useQuery();

  // Fetch races for selected meeting
  const { data: racesForMeeting, isLoading: racesLoading } = trpc.races.racesByMeeting.useQuery(
    { meetingId: selectedMeeting },
    { enabled: !!selectedMeeting }
  );

  // Fetch runners for selected race
  const { data: runners, isLoading: runnersLoading } = trpc.races.runners.useQuery(
    { raceId: selectedRace },
    { enabled: !!selectedRace }
  );

  const createPrediction = trpc.prediction.create.useMutation({
    onSuccess: () => {
      toast.success("Prediction created successfully!");
      setLocation("/history");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create prediction");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMeeting || !selectedRace || !selectedHorse) {
      toast.error("Please select a meeting, race, and horse");
      return;
    }

    const race = racesForMeeting?.find((r) => r.id === selectedRace);
    if (!race) {
      toast.error("Race not found");
      return;
    }

    createPrediction.mutate({
      horseName: selectedHorse,
      track: race.meeting_name,
      raceType: race.type,
      distance: race.distance,
      raceDate: race.race_date_nz,
      daysSinceLastRace: undefined,
      winningStreak: undefined,
      losingStreak: undefined,
      details: undefined,
      stakes: undefined,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to make predictions</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
            <Link href="/live">
              <Button variant="ghost">
                <Radio className="mr-2 h-4 w-4" />
                Live Races
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost">History</Button>
            </Link>
            <Link href="/subscription">
              <Button variant="outline">Subscription</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Quick Prediction</span>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">Select & Predict</h1>
            <p className="text-muted-foreground">
              Choose a meeting, race, and horse to get an AI-powered prediction
            </p>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Make a Prediction</CardTitle>
              <CardDescription>Select meeting → race → horse</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Select Meeting */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      1
                    </div>
                    <label className="text-lg font-semibold text-foreground">Select Meeting</label>
                  </div>
                  {meetingsLoading ? (
                    <div className="flex h-10 items-center justify-center rounded-md border border-input">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : meetings && meetings.length > 0 ? (
                    <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Choose a meeting..." />
                      </SelectTrigger>
                      <SelectContent>
                        {meetings.map((meeting) => (
                          <SelectItem key={meeting.id} value={meeting.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{meeting.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({meeting.race_count} races)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-md border border-input bg-muted/50 p-3 text-sm text-muted-foreground">
                      No meetings available today
                    </div>
                  )}
                </div>

                {/* Step 2: Select Race */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        selectedMeeting
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      2
                    </div>
                    <label className="text-lg font-semibold text-foreground">Select Race</label>
                  </div>
                  {!selectedMeeting ? (
                    <div className="rounded-md border border-input bg-muted/50 p-3 text-sm text-muted-foreground">
                      Select a meeting first
                    </div>
                  ) : racesLoading ? (
                    <div className="flex h-10 items-center justify-center rounded-md border border-input">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : racesForMeeting && racesForMeeting.length > 0 ? (
                    <Select value={selectedRace} onValueChange={setSelectedRace}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Choose a race..." />
                      </SelectTrigger>
                      <SelectContent>
                        {racesForMeeting.map((race) => (
                          <SelectItem key={race.id} value={race.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Race {race.race_number}</span>
                              <span className="text-xs text-muted-foreground">
                                {race.distance}m @ {race.start_time_nz}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-md border border-input bg-muted/50 p-3 text-sm text-muted-foreground">
                      No races available for this meeting
                    </div>
                  )}
                </div>

                {/* Step 3: Select Horse */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        selectedRace
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      3
                    </div>
                    <label className="text-lg font-semibold text-foreground">Select Horse</label>
                  </div>
                  {!selectedRace ? (
                    <div className="rounded-md border border-input bg-muted/50 p-3 text-sm text-muted-foreground">
                      Select a race first
                    </div>
                  ) : runnersLoading ? (
                    <div className="flex h-10 items-center justify-center rounded-md border border-input">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : runners && runners.length > 0 ? (
                    <Select value={selectedHorse} onValueChange={setSelectedHorse}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Choose a horse..." />
                      </SelectTrigger>
                      <SelectContent>
                        {runners.map((runner) => (
                          <SelectItem key={runner.runner_number} value={runner.runner_name}>
                            <div className="flex items-center gap-3">
                              <span className="rounded bg-muted px-2 py-0.5 text-xs font-bold">
                                {runner.runner_number}
                              </span>
                              <span className="font-medium">{runner.runner_name}</span>
                              {runner.barrier && (
                                <span className="text-xs text-muted-foreground">
                                  Barrier {runner.barrier}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-md border border-input bg-muted/50 p-3 text-sm text-muted-foreground">
                      No horses available for this race
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="h-12 w-full text-base"
                  disabled={
                    createPrediction.isPending || !selectedMeeting || !selectedRace || !selectedHorse
                  }
                >
                  {createPrediction.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Prediction
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
