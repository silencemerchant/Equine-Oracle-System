import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Clock, Loader2, MapPin, Radio, Ruler } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function LiveFeed() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: races, isLoading } = trpc.races.todaysRaces.useQuery();
  const { data: meetings, isLoading: meetingsLoading } = trpc.races.todaysMeetings.useQuery();

  const handleSelectRace = (race: any) => {
    // Navigate to predict page with race data
    setLocation(
      `/predict?raceId=${race.id}&track=${encodeURIComponent(race.meeting_name)}&distance=${race.distance}&type=${encodeURIComponent(race.type)}&date=${race.race_date_nz}`
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "upcoming":
        return <Badge variant="secondary">Upcoming</Badge>;
      case "live":
        return (
          <Badge variant="default" className="animate-pulse">
            <Radio className="mr-1 h-3 w-3" />
            Live
          </Badge>
        );
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTrackConditionColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case "heavy":
        return "text-red-400";
      case "soft":
        return "text-orange-400";
      case "good":
        return "text-green-400";
      case "firm":
        return "text-blue-400";
      default:
        return "text-muted-foreground";
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
              <Button variant="ghost">Manual Entry</Button>
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/history">
                  <Button variant="ghost">History</Button>
                </Link>
                <Link href="/subscription">
                  <Button variant="outline">Subscription</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-12">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
            <Radio className="h-4 w-4" />
            <span>Live Race Feed</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Today's Races</h1>
          <p className="text-muted-foreground">
            Select a race to auto-populate prediction details
          </p>
        </div>

        {/* Meetings Overview */}
        {!meetingsLoading && meetings && meetings.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Race Meetings</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {meetings.map((meeting) => (
                <Card key={meeting.id} className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>Meeting {meeting.id}</span>
                      <span className="text-sm font-normal text-muted-foreground">{meeting.name}</span>
                    </CardTitle>
                    <CardDescription>{meeting.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{meeting.race_count} races</span>
                      {meeting.track_condition && (
                        <span className={getTrackConditionColor(meeting.track_condition)}>
                          {meeting.track_condition}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Races List */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">All Races</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !races || races.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center">
                <Radio className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">No races available</h3>
                <p className="mb-6 text-muted-foreground">
                  Check back later for today's race schedule
                </p>
                <Link href="/predict">
                  <Button>Enter Race Manually</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {races.map((race) => (
                <Card
                  key={race.id}
                  className="cursor-pointer border-border bg-card transition-colors hover:border-primary/50"
                  onClick={() => handleSelectRace(race)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge className="bg-primary/20 text-primary">Race {race.race_number}</Badge>
                          {getStatusBadge(race.status)}
                        </div>
                        <CardTitle className="mb-2 text-xl text-foreground">
                          {race.race_name}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {race.meeting_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Ruler className="h-4 w-4" />
                            {race.distance}m
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {race.start_time_nz}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type: </span>
                        <span className="font-medium text-foreground">{race.type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Track: </span>
                        <span className={`font-medium ${getTrackConditionColor(race.track_condition)}`}>
                          {race.track_condition}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Surface: </span>
                        <span className="font-medium text-foreground">{race.track_surface}</span>
                      </div>
                      {race.weather && (
                        <div>
                          <span className="text-muted-foreground">Weather: </span>
                          <span className="font-medium text-foreground">{race.weather}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <Button className="w-full sm:w-auto" size="sm">
                        Select Race & Predict
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
