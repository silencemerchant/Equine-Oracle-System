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
                        onChange={(e) => setFormData({ ...formData, tier: