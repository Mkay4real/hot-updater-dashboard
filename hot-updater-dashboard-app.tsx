'use client';

import React, { useState, useEffect } from 'react';
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
  Apple
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

  const handleDeploy = async (platform: string, channel: string) => {
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, channel })
      });

      if (response.ok) {
        alert('Deployment started successfully!');
        fetchData();
        setShowDeployModal(false);
      } else {
        alert('Deployment failed!');
      }
    } catch (error) {
      console.error('Deploy error:', error);
      alert('Deployment failed!');
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
            <button
              onClick={() => setShowDeployModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
            >
              <Upload className="w-4 h-4 inline mr-2" />
              New Deployment
            </button>
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
                  <BundlesList bundles={bundles} />
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
function BundlesList({ bundles }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bundles.map((bundle: Bundle) => (
        <div
          key={bundle.id}
          className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">v{bundle.version}</h3>
            {bundle.active && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                Active
              </span>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Platform:</span>
              <span className="text-white">{bundle.platform}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Channel:</span>
              <span className="text-white">{bundle.channel}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Size:</span>
              <span className="text-white">{bundle.size}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Created:</span>
              <span className="text-white">{bundle.createdAt}</span>
            </div>
          </div>
          <button className="w-full mt-4 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all">
            <Download className="w-4 h-4 inline mr-2" />
            Download
          </button>
        </div>
      ))}
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
function DeployModal({ onClose, onDeploy }: any) {
  const [platform, setPlatform] = useState('all');
  const [channel, setChannel] = useState('production');

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
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onDeploy(platform, channel)}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Deploy
          </button>
        </div>
      </div>
    </div>
  );
}
