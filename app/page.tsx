'use client';

import React, { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import {
  Rocket,
  Package,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Users,
  Smartphone,
  Apple,
  Edit,
  Trash2,
  ArrowUpCircle,
  Loader2,
  GitBranch,
  Filter
} from 'lucide-react';

// Types
interface Deployment {
  id: string;
  version: string;
  platform: 'ios' | 'android' | 'all';
  channel: string;
  status: 'success' | 'failed' | 'pending';
  deployedAt: string;
  deployedBy: string;
  bundleSize: string;
  downloads: number;
}

interface Bundle {
  id: string;
  version: string;
  platform: 'ios' | 'android';
  channel: string;
  createdAt: string;
  size: string;
  active: boolean;
  enabled?: boolean;
  forceUpdate?: boolean;
  message?: string;
  fingerprintHash?: string;
  targetAppVersion?: string;
  commitHash?: string;
}

interface Stats {
  totalDeployments: number;
  activeUsers: number;
  updateRate: number;
  lastDeployment: string;
}

export default function HotUpdaterDashboard() {
  const [activeTab, setActiveTab] = useState('deployments');
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalDeployments: 0,
    activeUsers: 0,
    updateRate: 0,
    lastDeployment: ''
  });
  const [loading, setLoading] = useState(true);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch deployments
      const deploymentsRes = await fetch('/api/deployments');
      const deploymentsData = await deploymentsRes.json();
      setDeployments(deploymentsData);

      // Fetch bundles
      const bundlesRes = await fetch('/api/bundles');
      const bundlesData = await bundlesRes.json();
      setBundles(bundlesData);

      // Fetch stats
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async (platform: string, channel: string, branch?: string) => {
    try {
      setDeploying(true);
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, channel, branch })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✓ Deployment completed successfully!');
        await fetchData();
        setShowDeployModal(false);
      } else {
        alert(`✗ Deployment failed: ${data.error || 'Unknown error'}\n${data.details || ''}`);
      }
    } catch (error: any) {
      console.error('Deploy error:', error);
      alert(`✗ Deployment failed: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  };

  const handleEditBundle = (bundle: Bundle) => {
    setSelectedBundle(bundle);
    setShowEditModal(true);
  };

  const handlePromoteBundle = (bundle: Bundle) => {
    setSelectedBundle(bundle);
    setShowPromoteModal(true);
  };

  const handleSaveBundle = async (bundleData: any) => {
    try {
      const response = await fetch(`/api/bundles/${bundleData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundleData)
      });

      if (response.ok) {
        alert('✓ Bundle updated successfully!');
        await fetchData();
        setShowEditModal(false);
        setSelectedBundle(null);
      } else {
        const data = await response.json();
        alert(`✗ Update failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Update error:', error);
      alert(`✗ Update failed: ${error.message}`);
    }
  };

  const handlePromoteConfirm = async (targetChannel: string, shouldMove: boolean) => {
    if (!selectedBundle) return;

    try {
      const response = await fetch(`/api/bundles/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleId: selectedBundle.id,
          targetChannel,
          move: shouldMove
        })
      });

      if (response.ok) {
        alert(`✓ Bundle ${shouldMove ? 'moved' : 'copied'} to ${targetChannel} successfully!`);
        await fetchData();
        setShowPromoteModal(false);
        setSelectedBundle(null);
      } else {
        const data = await response.json();
        alert(`✗ Promotion failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Promotion error:', error);
      alert(`✗ Promotion failed: ${error.message}`);
    }
  };

  const handleDeleteBundle = async (bundleId: string) => {
    if (!confirm('Are you sure you want to delete this bundle? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/bundles/${bundleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('✓ Bundle deleted successfully!');
        await fetchData();
      } else {
        const data = await response.json();
        alert(`✗ Delete failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`✗ Delete failed: ${error.message}`);
    }
  };

  const handleRollback = async (deploymentId: string) => {
    if (confirm('Are you sure you want to rollback to this version?')) {
      try {
        const response = await fetch(`/api/rollback/${deploymentId}`, {
          method: 'POST'
        });

        if (response.ok) {
          alert('Rollback successful!');
          fetchData();
        } else {
          alert('Rollback failed!');
        }
      } catch (error) {
        console.error('Rollback error:', error);
        alert('Rollback failed!');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Hot Updater Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Show deploy button only in development */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => setShowDeployModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  New Deployment
                </button>
              )}
              {/* User profile button */}
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Deployments"
            value={stats.totalDeployments}
            icon={<Package className="w-8 h-8" />}
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers.toLocaleString()}
            icon={<Users className="w-8 h-8" />}
            color="from-green-500 to-emerald-500"
          />
          <StatCard
            title="Update Rate"
            value={`${stats.updateRate}%`}
            icon={<TrendingUp className="w-8 h-8" />}
            color="from-purple-500 to-pink-500"
          />
          <StatCard
            title="Last Deployment"
            value={stats.lastDeployment}
            icon={<Clock className="w-8 h-8" />}
            color="from-orange-500 to-red-500"
          />
        </div>

        {/* Tabs */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
          <div className="border-b border-white/10">
            <div className="flex space-x-8 px-6">
              <TabButton
                active={activeTab === 'deployments'}
                onClick={() => setActiveTab('deployments')}
                icon={<Rocket className="w-4 h-4" />}
                label="Deployments"
              />
              <TabButton
                active={activeTab === 'bundles'}
                onClick={() => setActiveTab('bundles')}
                icon={<Package className="w-4 h-4" />}
                label="Bundles"
              />
              <TabButton
                active={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
                icon={<TrendingUp className="w-4 h-4" />}
                label="Analytics"
              />
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : (
              <>
                {activeTab === 'deployments' && (
                  <DeploymentsList 
                    deployments={deployments} 
                    onRollback={handleRollback}
                  />
                )}
                {activeTab === 'bundles' && (
                  <BundlesList
                    bundles={bundles}
                    onEdit={handleEditBundle}
                    onPromote={handlePromoteBundle}
                    onDelete={handleDeleteBundle}
                    filterPlatform={filterPlatform}
                    filterChannel={filterChannel}
                    onFilterPlatform={setFilterPlatform}
                    onFilterChannel={setFilterChannel}
                  />
                )}
                {activeTab === 'analytics' && (
                  <Analytics deployments={deployments} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Deploy Modal */}
      {showDeployModal && (
        <DeployModal
          onClose={() => setShowDeployModal(false)}
          onDeploy={handleDeploy}
          isDeploying={deploying}
        />
      )}

      {/* Edit Bundle Modal */}
      {showEditModal && selectedBundle && (
        <EditBundleModal
          bundle={selectedBundle}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBundle(null);
          }}
          onSave={handleSaveBundle}
          onDelete={handleDeleteBundle}
          onPromote={() => {
            setShowEditModal(false);
            setShowPromoteModal(true);
          }}
        />
      )}

      {/* Promote Channel Modal */}
      {showPromoteModal && selectedBundle && (
        <PromoteChannelModal
          bundle={selectedBundle}
          onClose={() => {
            setShowPromoteModal(false);
            setSelectedBundle(null);
          }}
          onConfirm={handlePromoteConfirm}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className={`bg-gradient-to-r ${color} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-4 border-b-2 transition-all ${
        active
          ? 'border-purple-500 text-white'
          : 'border-transparent text-gray-400 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

// Deployments List Component
function DeploymentsList({ deployments, onRollback }: any) {
  return (
    <div className="space-y-4">
      {deployments.map((deployment: Deployment) => (
        <div
          key={deployment.id}
          className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${
                deployment.status === 'success' ? 'bg-green-500/20' :
                deployment.status === 'failed' ? 'bg-red-500/20' : 'bg-yellow-500/20'
              }`}>
                {deployment.status === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : deployment.status === 'failed' ? (
                  <XCircle className="w-6 h-6 text-red-400" />
                ) : (
                  <Clock className="w-6 h-6 text-yellow-400" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-white">
                    Version {deployment.version}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    deployment.platform === 'ios' ? 'bg-blue-500/20 text-blue-300' :
                    deployment.platform === 'android' ? 'bg-green-500/20 text-green-300' :
                    'bg-purple-500/20 text-purple-300'
                  }`}>
                    {deployment.platform === 'ios' && <Apple className="w-3 h-3 inline mr-1" />}
                    {deployment.platform === 'android' && <Smartphone className="w-3 h-3 inline mr-1" />}
                    {deployment.platform.toUpperCase()}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">
                    {deployment.channel}
                  </span>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                  <span>Deployed by {deployment.deployedBy}</span>
                  <span>•</span>
                  <span>{deployment.deployedAt}</span>
                  <span>•</span>
                  <span>{deployment.bundleSize}</span>
                  <span>•</span>
                  <span>{deployment.downloads} downloads</span>
                </div>
              </div>
            </div>
            {deployment.status === 'success' && (
              <button
                onClick={() => onRollback(deployment.id)}
                className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-all"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Rollback
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Bundles List Component
function BundlesList({ bundles, onEdit, onPromote, onDelete, filterPlatform, filterChannel, onFilterPlatform, onFilterChannel }: any) {
  const filteredBundles = bundles.filter((bundle: Bundle) => {
    const platformMatch = filterPlatform === 'all' || bundle.platform === filterPlatform;
    const channelMatch = filterChannel === 'all' || bundle.channel === filterChannel;
    return platformMatch && channelMatch;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 bg-white/5 rounded-lg p-4 border border-white/10">
        <Filter className="w-5 h-5 text-gray-400" />

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Platform:</label>
          <select
            value={filterPlatform}
            onChange={(e) => onFilterPlatform(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">All</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Channel:</label>
          <select
            value={filterChannel}
            onChange={(e) => onFilterChannel(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">All</option>
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-400">
          {filteredBundles.length} bundle{filteredBundles.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Bundles Table */}
      <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/30 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Channel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Enabled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Force Update</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredBundles.map((bundle: Bundle) => (
                <tr key={bundle.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">
                    {bundle.id.substring(0, 12)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-300">
                      {bundle.channel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {bundle.platform === 'ios' ? (
                        <>
                          <Apple className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-white">iOS</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-white">Android</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <span className="text-xs">🎯</span>
                      <span>{bundle.targetAppVersion || bundle.version}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bundle.enabled !== false ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bundle.forceUpdate ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-600" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                    {bundle.message || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {bundle.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => onEdit(bundle)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all mr-2"
                      title="Edit bundle"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Analytics Component
function Analytics({ deployments }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4">Deployment Trends</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          {/* Add recharts chart here */}
          <p>Chart visualization would go here</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4">Platform Distribution</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">iOS</span>
                <span className="text-white">65%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Android</span>
                <span className="text-white">35%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4">Update Adoption</h3>
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">87%</div>
            <p className="text-gray-400">of users on latest version</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Deploy Modal Component
function DeployModal({ onClose, onDeploy, isDeploying }: any) {
  const [platform, setPlatform] = useState('all');
  const [channel, setChannel] = useState('development');
  const [branch, setBranch] = useState('');
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branches, setBranches] = useState<string[]>([]);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const response = await fetch('/api/git/branches');
      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || []);
        if (data.current) {
          setBranch(data.current);
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl p-8 border border-white/10 shadow-2xl max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-6">New Deployment</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              disabled={isDeploying}
            >
              <option value="all">Both (iOS & Android)</option>
              <option value="ios">iOS only</option>
              <option value="android">Android only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Channel
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              disabled={isDeploying}
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
              <GitBranch className="w-4 h-4" />
              Git Branch (optional)
            </label>
            {loadingBranches ? (
              <div className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-gray-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading branches...
              </div>
            ) : branches.length > 0 ? (
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                disabled={isDeploying}
              >
                {branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g., main, develop"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                disabled={isDeploying}
              />
            )}
            <p className="text-xs text-gray-500 mt-1">Leave empty to use current branch</p>
          </div>
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeploying}
          >
            Cancel
          </button>
          <button
            onClick={() => onDeploy(platform, channel, branch)}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isDeploying}
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deploying...
              </>
            ) : (
              'Deploy'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Bundle Modal Component
function EditBundleModal({ bundle, onClose, onSave, onDelete, onPromote }: any) {
  const [message, setMessage] = useState(bundle.message || '');
  const [enabled, setEnabled] = useState(bundle.enabled !== false);
  const [forceUpdate, setForceUpdate] = useState(bundle.forceUpdate || false);

  const handleSave = () => {
    onSave({
      id: bundle.id,
      message,
      enabled,
      forceUpdate
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl p-8 border border-white/10 shadow-2xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Edit {bundle.id.substring(0, 12)}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Message
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              placeholder="Deployment message"
            />
          </div>

          {/* Fingerprint Hash */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Fingerprint Hash
            </label>
            <input
              type="text"
              value={bundle.fingerprintHash || ''}
              disabled
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-gray-500 font-mono text-sm"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/10">
              <div>
                <h3 className="text-white font-medium">Enabled</h3>
                <p className="text-sm text-gray-400">When disabled, this update will not be available to your users.</p>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  enabled ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/10">
              <div>
                <h3 className="text-white font-medium">Force Update</h3>
                <p className="text-sm text-gray-400">When enabled, this update will require users to update before continuing to use the application.</p>
              </div>
              <button
                onClick={() => setForceUpdate(!forceUpdate)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  forceUpdate ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    forceUpdate ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium"
          >
            Save
          </button>

          {/* Metadata Section */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Platform:</span>
                <div className="flex items-center gap-2 mt-1">
                  {bundle.platform === 'ios' ? <Apple className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  <span className="text-white">{bundle.platform === 'ios' ? 'iOS' : 'Android'}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-400">App Version:</span>
                <p className="text-white mt-1">{bundle.targetAppVersion || bundle.version}</p>
              </div>
              <div>
                <span className="text-gray-400">Channel:</span>
                <p className="text-white mt-1">{bundle.channel}</p>
              </div>
              <div>
                <span className="text-gray-400">Commit Hash:</span>
                <p className="text-white mt-1 font-mono text-xs">{bundle.commitHash || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 border-t border-white/10 pt-6">
            <button
              onClick={onPromote}
              className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Promote Channel
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this bundle?')) {
                  onDelete(bundle.id);
                  onClose();
                }
              }}
              className="flex-1 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Bundle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Promote Channel Modal Component
function PromoteChannelModal({ bundle, onClose, onConfirm }: any) {
  const [targetChannel, setTargetChannel] = useState('staging');
  const [shouldMove, setShouldMove] = useState(false);

  const channels = ['development', 'staging', 'production'].filter(c => c !== bundle.channel);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl p-8 border border-white/10 shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Promote Channel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-400 mb-6">
          Select or enter a new channel for this bundle. Choose whether to copy the bundle (keeps it in the original channel) or move it (removes from the original channel).
        </p>

        <div className="space-y-6">
          {/* Move Bundle Toggle */}
          <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/10">
            <div>
              <h3 className="text-white font-medium">Move bundle</h3>
              <p className="text-sm text-gray-400">Move to target channel (removes from current)</p>
            </div>
            <button
              onClick={() => setShouldMove(!shouldMove)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                shouldMove ? 'bg-orange-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  shouldMove ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Channel
            </label>
            <select
              value={targetChannel}
              onChange={(e) => setTargetChannel(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              {channels.map((channel) => (
                <option key={channel} value={channel}>{channel}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Current channel: <span className="text-orange-300">{bundle.channel}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(targetChannel, shouldMove)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2"
            >
              <ArrowUpCircle className="w-4 h-4" />
              {shouldMove ? 'Move' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
