import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, Crown, Loader2, Sparkles, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Subscription() {
  const { user, isAuthenticated } = useAuth();
  const { data: currentSubscription, isLoading: subLoading } = trpc.subscription.current.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );
  const { data: tiers, isLoading: tiersLoading } = trpc.subscription.tiers.useQuery();

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to manage your subscription</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case "elite":
        return <Crown className="h-5 w-5" />;
      case "premium":
        return <Sparkles className="h-5 w-5" />;
      case "basic":
        return <Zap className="h-5 w-5" />;
      default:
        return <Check className="h-5 w-5" />;
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case "elite":
        return "border-primary bg-primary/10";
      case "premium":
        return "border-primary/60 bg-primary/5";
      default:
        return "border-border bg-card";
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
              <Button variant="ghost">Make Prediction</Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost">History</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-12">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Subscription Plans</h1>
          <p className="text-muted-foreground">
            Choose the plan that fits your betting strategy
          </p>
        </div>

        {/* Current Subscription */}
        {subLoading ? (
          <div className="mb-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          currentSubscription && (
            <Card className="mb-8 border-primary/20 bg-primary/5">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">Current Plan</div>
                  <div className="flex items-center gap-2">
                    {getTierIcon(currentSubscription.tierName)}
                    <span className="text-xl font-bold capitalize text-foreground">
                      {currentSubscription.tierName}
                    </span>
                    {currentSubscription.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Pricing Tiers */}
        {tiersLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {tiers?.map((tier) => {
              const isCurrentTier = currentSubscription?.tierName === tier.name;
              return (
                <Card
                  key={tier.id}
                  className={`${getTierColor(tier.name)} ${
                    tier.name === "elite" ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      {getTierIcon(tier.name)}
                      <CardTitle className="text-foreground">{tier.displayName}</CardTitle>
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-foreground">
                        ${(tier.price / 100).toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <CardDescription>
                      {tier.predictionsPerDay === 999999
                        ? "Unlimited"
                        : tier.predictionsPerDay}{" "}
                      predictions per day
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="mb-6 space-y-2">
                      {tier.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isCurrentTier ? "outline" : "default"}
                      disabled={isCurrentTier}
                    >
                      {isCurrentTier ? "Current Plan" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="mb-6 text-center text-2xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-3xl space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">How accurate are the predictions?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our machine learning models are trained on extensive historical data and achieve
                  accuracy rates of over 54% for win predictions. Premium tiers use ensemble
                  methods combining multiple models for even better results.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you can cancel your subscription at any time. Your access will continue
                  until the end of your current billing period.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards, debit cards, and digital payment methods
                  through our secure payment processor.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
