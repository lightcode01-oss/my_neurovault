/**
 * Memory Visualization Page
 * Interactive network graph of memories and their relationships
 *
 * Features:
 * - Display memories as nodes in a force-directed graph
 * - Click on memory to see details
 * - Color-code by validation status
 * - Filter by category
 * - TODO: Implement actual react-force-graph visualization
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Grid3x3, Filter } from 'lucide-react';
import { getPublicGatewayUrl, findWorkingGateway, looksLikeValidCid } from '../lib/ipfs';
import { toast } from 'sonner';

interface BackendMemory {
  id: number;
  ipfs_cid: string;
  content_hash: string;
  title: string;
  category: string;
  submitter: string;
  submitted_at: string;
  validation_score: number;
  validation_count: number;
  is_validated: boolean;
}

interface SelectedMemory extends BackendMemory {
  validations?: any[];
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const CATEGORIES = [
  'all',
  'history',
  'science',
  'art',
  'culture',
  'technology',
];

export default function VisualizePage() {
  const [memories, setMemories] = useState<BackendMemory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<SelectedMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch memories from backend
  const fetchMemories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${BACKEND_URL}/memories`);
      if (selectedCategory !== 'all') {
        url.searchParams.set('category', selectedCategory);
      }
      url.searchParams.set('limit', '100');

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch memories: ${response.statusText}`);
      }

      const data = await response.json();
      setMemories(data);
      setSelectedMemory(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to fetch memories:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Fetch details for selected memory
  const fetchMemoryDetails = useCallback(async (memoryId: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/memories/${memoryId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch memory details');
      }

      const data = await response.json();

      // TODO: Fetch validations from backend if available
      setSelectedMemory({
        ...data,
        validations: [],
      });
    } catch (err) {
      console.error('Failed to fetch memory details:', err);
      setError('Failed to load memory details');
    }
  }, []);

  // Load memories on mount and category change
  useEffect(() => {
    fetchMemories();
  }, [selectedCategory, fetchMemories]);

  // Filter memories by category
  const filteredMemories = selectedCategory === 'all'
    ? memories
    : memories.filter((m) => m.category === selectedCategory);

  // Group by validation status for stats
  const stats = {
    total: memories.length,
    validated: memories.filter((m) => m.is_validated).length,
    pending: memories.filter((m) => !m.is_validated).length,
    avgScore: memories.length > 0
      ? Math.round(
          memories.reduce((sum, m) => sum + m.validation_score, 0) / memories.length
        )
      : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Memory Network</h1>
          <p className="text-slate-400">
            Explore {filteredMemories.length} memories across the validation network
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
              <p className="text-sm text-slate-400">Total Memories</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-400">{stats.validated}</div>
              <p className="text-sm text-slate-400">Validated</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
              <p className="text-sm text-slate-400">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-400">{stats.avgScore}</div>
              <p className="text-sm text-slate-400">Avg Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All' : cat}
              </Badge>
            ))}
          </div>

          {/* View Mode */}
          <div className="ml-auto flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMemories()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Memory Grid/List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                : 'space-y-4'
              }>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredMemories.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center text-slate-400">
                  No memories found in this category
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                : 'space-y-4'
              }>
                {filteredMemories.map((memory) => (
                  <Card
                    key={memory.id}
                    className={`bg-slate-800 border-slate-700 cursor-pointer transition-all hover:border-blue-500 ${
                      selectedMemory?.id === memory.id
                        ? 'border-blue-500 ring-2 ring-blue-500'
                        : ''
                    }`}
                    onClick={() => fetchMemoryDetails(memory.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-white line-clamp-2">
                            {memory.title}
                          </CardTitle>
                          <CardDescription className="text-slate-400 text-xs">
                            #{memory.id} • {new Date(memory.submitted_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {memory.is_validated && (
                          <Badge className="bg-green-600 text-white">Validated</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="outline">{memory.category}</Badge>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Score:</span>
                          <span className="text-slate-200 font-semibold">
                            {memory.validation_score}/1000
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Validations:</span>
                          <span className="text-slate-200">{memory.validation_count}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedMemory ? (
              <Card className="bg-slate-800 border-slate-700 sticky top-6">
                <CardHeader>
                  <CardTitle className="text-white">Memory Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-1">{selectedMemory.title}</h3>
                    <p className="text-sm text-slate-400">{selectedMemory.category}</p>
                  </div>

                  <div className="space-y-2 border-t border-slate-700 pt-4">
                    <div>
                      <p className="text-xs text-slate-500">Memory ID</p>
                      <p className="text-sm text-white font-mono">{selectedMemory.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Submitter</p>
                      <p className="text-sm text-white font-mono">
                        {selectedMemory.submitter.slice(0, 6)}...
                        {selectedMemory.submitter.slice(-4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">IPFS CID</p>
                      <p className="text-xs text-white font-mono truncate">
                        {selectedMemory.ipfs_cid}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Validation Score</span>
                      <span className="text-sm font-semibold text-white">
                        {selectedMemory.validation_score}/1000
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Validation Count</span>
                      <span className="text-sm font-semibold text-white">
                        {selectedMemory.validation_count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Status</span>
                      <Badge
                        className={selectedMemory.is_validated
                          ? 'bg-green-600 text-white'
                          : 'bg-yellow-600 text-white'
                        }
                      >
                        {selectedMemory.is_validated ? 'Validated' : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  {selectedMemory.ipfs_cid && (
                    <a
                      href={getPublicGatewayUrl(selectedMemory.ipfs_cid)}
                      onClick={async (e) => {
                        e.preventDefault();
                        if (!looksLikeValidCid(selectedMemory.ipfs_cid)) {
                          toast.error('CID looks truncated or invalid — open the full CID or check the record.');
                          return;
                        }
                        try {
                          const url = await findWorkingGateway(selectedMemory.ipfs_cid);
                          window.open(url, '_blank', 'noopener');
                        } catch (err) {
                          window.open(getPublicGatewayUrl(selectedMemory.ipfs_cid), '_blank', 'noopener');
                        }
                      }}
                      rel="noopener noreferrer"
                      className="inline-flex items-center w-full justify-center gap-2 text-sm font-medium transition-all rounded-md h-9 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                    >
                      View on IPFS
                    </a>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center text-slate-400">
                  Select a memory to view details
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* TODO Section */}
        <div className="mt-12 p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="font-semibold text-white mb-2">TODO: Future Enhancements</h3>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Implement react-force-graph for node-based visualization</li>
            <li>• Add search and advanced filtering</li>
            <li>• Display validation relationships between memories</li>
            <li>• Show validator reputation scores</li>
            <li>• Real-time updates via WebSocket</li>
            <li>• Export network graph as SVG/PNG</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
