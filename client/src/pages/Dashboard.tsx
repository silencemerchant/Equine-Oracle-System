import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Copy, Eye, EyeOff, Loader2, Plus, Trash2, CreditCard } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  // Subscription queries
  const subscriptionStatus = trpc.subscription.getStatus.useQuery();
  const subscriptionTiers = trpc.subscription.getTiers.useQuery();
  const createSubscription = trpc.subscription.create.useMutation();
  const cancelSubscription = trpc.subscription.cancel.useMutation();
  const getBillingPortalUrl = trpc.subscription.getBillingPortalUrl.useQuery(
    { returnUrl: window.location.origin + "/dashboard" },
    { enabled: !!subscriptionStatus.data?.hasSubscription }
  );

  // API key queries
  const apiKeys = trpc.apiKey.list.useQuery();
  const createApiKey = trpc.apiKey.create.useMutation();
  const revokeApiKey = trpc.apiKey.revoke.useMutation();

  const handleCreateSubscription = async (tierId: string) => {
    try {
      const result = await createSubscription.mutateAsync({ tierId: tierId as any });
      if (result.clientSecret) {
        // In production, redirect to Stripe checkout or use Stripe.js
        toast.success("Subscription created! Redirecting to payment...");
        // TODO: Implement Stripe payment flow
      }
    } catch (error) {
      toast.error("Failed to create subscription");
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    try {
      await cancelSubscription.mutateAsync();
      toast.success("Subscription canceled");
      subscriptionStatus.refetch();
    } catch (error) {
      toast.error("Failed to cancel subscription");
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }
    setIsCreatingKey(true);
    try {
      const result = await createApiKey.mutateAsync({ name: newKeyName });
      toast.success("API key created! Copy it now - you won't see it again");
      setNewKeyName("");
      apiKeys.refetch();
    } catch (error) {
      toast.error("Failed to create API key");
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (id: number) => {
    if (!confirm("Revoke this API key? It will stop working immediately.")) return;
    try {
      await revokeApiKey.mutateAsync({ id });
      toast.success("API key revoked");
      apiKeys.refetch();
    } catch (error) {
      toast.error("Failed to revoke API key");
    }
  };

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  };

  const handleOpenBillingPortal = () => {
    if (getBillingPortalUrl.data?.url) {
      window.location.href = getBillingPortalUrl.data.url;
    }
  };

  if (!user) {
    return <div className="p-8 text-center">Please log in to access your dashboard</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">Manage your subscription and API access</p>

        <Tabs defaultValue="subscription" className="space-y-8">
          <TabsList>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            {subscriptionStatus.isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : subscriptionStatus.data?.hasSubscription ? (
              <div className="space-y-6">
                {/* Current Subscription */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Subscription</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Plan</p>
                        <p className="text-lg font-semibold capitalize">{subscriptionStatus.data.tier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={subscriptionStatus.data.status === "active" ? "default" : "secondary"}>
                          {subscriptionStatus.data.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Renews</p>
                        <p className="text-lg font-semibold">
                          {subscriptionStatus.data.currentPeriodEnd
                            ? new Date(subscriptionStatus.data.currentPeriodEnd).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleOpenBillingPortal}
                        disabled={getBillingPortalUrl.isLoading}
                        variant="outline"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Manage Billing
                      </Button>
                      <Button onClick={handleCancelSubscription} variant="destructive">
                        Cancel Subscription
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-amber-900">No Active Subscription</CardTitle>
                    <CardDescription className="text-amber-800">
                      Choose a plan to get started with Equine Oracle predictions
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subscriptionTiers.data?.map((tier) => (
                    <Card key={tier.id} className={tier.id === "pro" ? "border-blue-500 border-2" : ""}>
                      <CardHeader>
                        <CardTitle>{tier.name}</CardTitle>
                        <div className="mt-2">
                          <span className="text-3xl font-bold">NZ${tier.price}</span>
                          <span className="text-muted-foreground ml-2">/month</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2">
                          {tier.features.map((feature, idx) => (
                            <li key={idx} className="text-sm flex items-start">
                              <span className="mr-2">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          onClick={() => handleCreateSubscription(tier.id)}
                          disabled={createSubscription.isPending}
                          className="w-full"
                          variant={tier.id === "pro" ? "default" : "outline"}
                        >
                          {createSubscription.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Choose Plan"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            {!subscriptionStatus.data?.hasSubscription ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-amber-900">Subscription Required</CardTitle>
                  <CardDescription className="text-amber-800">
                    You need an active subscription to create API keys
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Create New Key */}
                <Card>
                  <CardHeader>
                    <CardTitle>Create New API Key</CardTitle>
                    <CardDescription>Generate a new API key for programmatic access</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="key-name">Key Name</Label>
                      <Input
                        id="key-name"
                        placeholder="e.g., Production Server"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCreateApiKey} disabled={isCreatingKey}>
                      {isCreatingKey ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Key
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* API Keys List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your API Keys</CardTitle>
                    <CardDescription>Manage your API keys and access tokens</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {apiKeys.isLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="animate-spin" />
                      </div>
                    ) : apiKeys.data && apiKeys.data.length > 0 ? (
                      <div className="space-y-4">
                        {apiKeys.data.map((key) => (
                          <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-semibold">{key.name}</p>
                              <p className="text-sm text-muted-foreground font-mono">{key.keyPreview}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Created: {new Date(key.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleRevokeApiKey(key.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No API keys yet. Create one to get started.</p>
                    )}
                  </CardContent>
                </Card>

                {/* API Documentation */}
                <Card>
                  <CardHeader>
                    <CardTitle>API Documentation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Base URL</h4>
                      <code className="bg-muted p-2 rounded text-sm block">
                        https://api.equine-oracle.com/v1
                      </code>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Authentication</h4>
                      <code className="bg-muted p-2 rounded text-sm block">
                        Authorization: Bearer YOUR_API_KEY
                      </code>
                    </div>
                    <Button variant="outline" asChild>
                      <a href="/api-docs" target="_blank" rel="noopener noreferrer">
                        View Full Documentation
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
