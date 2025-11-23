/**
 * Client Management Dashboard
 * For LOWKEY CONSULTANTS admin panel
 * Manage clients, deployments, and billing
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    tier: 'basic' as const,
    supportLevel: 'basic' as const,
    contactEmail: '',
    contactPhone: '',
  });

  // Queries
  const { data: clients, isLoading: clientsLoading, refetch: refetchClients } = trpc.clients.getAll.useQuery();
  const { data: lowkeyInfo } = trpc.clients.getLowkeyInfo.useQuery();

  // Mutations
  const createClientMutation = trpc.clients.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Client created! License Key: ${data.licenseKey}`);
      setShowCreateForm(false);
      setFormData({
        companyName: '',
        tier: 'basic',
        supportLevel: 'basic',
        contactEmail: '',
        contactPhone: '',
      });
      refetchClients();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateClient = async () => {
    if (!formData.companyName || !formData.contactEmail) {
      toast.error('Please fill in required fields');
      return;
    }

    createClientMutation.mutate(formData);
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      api_starter: 'bg-green-100 text-green-800',
      api_professional: 'bg-orange-100 text-orange-800',
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Client Management</h1>
          <p className="text-muted-foreground">Manage LOWKEY CONSULTANTS clients and deployments</p>
        </div>

        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="company">Company Info</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            {/* Create Client Card */}
            {!showCreateForm ? (
              <Button onClick={() => setShowCreateForm(true)} className="mb-4">
                <Plus className="w-4 h-4 mr-2" />
                New Client
              </Button>
            ) : (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Create New Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name *</label>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Enter company name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tier *</label>
                      <select
                        value={formData.tier}
                        onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                        className="w-full px-3 py-2 border border-input rounded-md"
                      >
                        <option value="basic">Basic (NZ$29)</option>
                        <option value="pro">Pro (NZ$79)</option>
                        <option value="api_starter">API Starter (NZ$199)</option>
                        <option value="api_professional">API Professional (NZ$499)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Support Level</label>
                      <select
                        value={formData.supportLevel}
                        onChange={(e) => setFormData({ ...formData, supportLevel: e.target.value as any })}
                        className="w-full px-3 py-2 border border-input rounded-md"
                      >
                        <option value="basic">Basic</option>
                        <option value="priority">Priority</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Email *</label>
                    <Input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="contact@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Phone</label>
                    <Input
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="+64 ..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateClient}
                      disabled={createClientMutation.isPending}
                    >
                      {createClientMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create Client
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clients List */}
            {clientsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : clients && clients.length > 0 ? (
              <div className="grid gap-4">
                {clients.map((client) => (
                  <Card key={client.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{client.companyName}</h3>
                          <p className="text-sm text-muted-foreground">ID: {client.id}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getTierColor(client.tier)}>
                            {client.tier.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(client.status)}>
                            {client.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{client.contactEmail}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Support Level</p>
                          <p className="font-medium">{client.supportLevel || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Deployed</p>
                          <p className="font-medium">
                            {client.deploymentDate
                              ? new Date(client.deploymentDate).toLocaleDateString()
                              : 'Not deployed'}
                          </p>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No clients yet. Create one to get started.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Company Info Tab */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>LOWKEY CONSULTANTS Information</CardTitle>
              </CardHeader>
              <CardContent>
                {lowkeyInfo && lowkeyInfo.status !== 'not_configured' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Company Name</p>
                        <p className="font-medium">{lowkeyInfo.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Company Number</p>
                        <p className="font-medium">{lowkeyInfo.companyNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(lowkeyInfo.status)}>
                          {lowkeyInfo.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Contact Email</p>
                        <p className="font-medium">{lowkeyInfo.contactEmail || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Company information not configured yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{clients?.length || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Active Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {clients?.filter(c => c.status === 'active').length || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Suspended</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {clients?.filter(c => c.status === 'suspended').length || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Clients by Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['basic', 'pro', 'api_starter', 'api_professional'].map(tier => (
                    <div key={tier} className="flex justify-between items-center">
                      <span className="text-sm">{tier.replace('_', ' ').toUpperCase()}</span>
                      <Badge>{clients?.filter(c => c.tier === tier).length || 0}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
