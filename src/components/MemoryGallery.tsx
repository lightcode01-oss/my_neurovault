import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Search, ExternalLink, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { getPublicGatewayUrl, findWorkingGateway, looksLikeValidCid, getGatewayList } from '../lib/ipfs';
import { toast } from 'sonner';
import { ScrollReveal } from './ScrollReveal';

interface Memory {
  id: number;
  title: string;
  summary: string;
  category: string;
  agent: string;
  timestamp: string;
  validationScore: number;
  status: 'validated' | 'pending' | 'challenged';
  cid: string;
  tags: string[];
  reward: number;
}

const mockMemories: Memory[] = [
  {
    id: 1,
    title: 'Quantum Entanglement in Computing',
    summary: 'Comprehensive analysis of how quantum entanglement enables superposition states in quantum computers, allowing for parallel computation at scales impossible with classical systems.',
    category: 'technology',
    agent: '0x742d...3f91',
    timestamp: '2 hours ago',
    validationScore: 95,
    status: 'validated',
    cid: 'bafybeie5nqv6kd3qnfjupgvz34woh3oksc3iau6abmyajn7qvtf6d2ho34',
    tags: ['quantum', 'computing', 'physics'],
    reward: 450,
  },
  {
    id: 2,
    title: 'CRISPR Gene Editing Mechanisms',
    summary: 'Detailed breakdown of Cas9 protein mechanics in targeted DNA modification, including guide RNA design principles and off-target effect mitigation strategies.',
    category: 'science',
    agent: '0x8a3c...2e4d',
    timestamp: '5 hours ago',
    validationScore: 88,
    status: 'validated',
    cid: 'QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH',
    tags: ['biology', 'genetics', 'crispr'],
    reward: 380,
  },
  {
    id: 3,
    title: 'Byzantine Fault Tolerance in Distributed Systems',
    summary: 'Analysis of consensus mechanisms that maintain system integrity when some nodes behave maliciously or fail, with applications to blockchain protocols.',
    category: 'technology',
    agent: '0x5f2a...8b7c',
    timestamp: '8 hours ago',
    validationScore: 92,
    status: 'validated',
    cid: 'QmSgvgwxZGaBLqkGyWemEDqikCqU52XxsYLKtdy3vGZ8uq',
    tags: ['distributed-systems', 'blockchain', 'consensus'],
    reward: 420,
  },
  {
    id: 4,
    title: 'Neural Network Attention Mechanisms',
    summary: 'Deep dive into transformer architecture attention layers and how they enable models to weigh the importance of different input elements dynamically.',
    category: 'technology',
    agent: '0x1d9f...6c2a',
    timestamp: '12 hours ago',
    validationScore: 0,
    status: 'pending',
    cid: 'bafybeie5nqv6kd3qnfjupgvz34woh3oksc3iau6abmyajn7qvtf6d2ho34',
    tags: ['ai', 'neural-networks', 'transformers'],
    reward: 0,
  },
  {
    id: 5,
    title: 'Dark Matter Distribution Patterns',
    summary: 'Observations from gravitational lensing studies revealing non-uniform dark matter distribution in galaxy clusters and implications for cosmological models.',
    category: 'science',
    agent: '0x9b4e...1f3d',
    timestamp: '1 day ago',
    validationScore: 85,
    status: 'validated',
    cid: 'QmabZ1pL9npKXJg8JGdMwQMJo2NCVy9yDVYjhiHK4LTJQH',
    tags: ['astrophysics', 'dark-matter', 'cosmology'],
    reward: 340,
  },
  {
    id: 6,
    title: 'Zero-Knowledge Proof Applications',
    summary: 'Exploration of zk-SNARKs and zk-STARKs in privacy-preserving verification, with focus on scalability solutions for blockchain systems.',
    category: 'technology',
    agent: '0x4c7b...9a2f',
    timestamp: '1 day ago',
    validationScore: 78,
    status: 'challenged',
    cid: 'QmSgvgwxZGaBLqkGyWemEDqikCqU52XxsYLKtdy3vGZ8uq',
    // Replace truncated mock CIDs with valid-looking placeholders (Qm + 44 chars)
    tags: ['cryptography', 'zero-knowledge', 'privacy'],
    reward: 0,
  },
];

export function MemoryGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [fallbackMemories, setFallbackMemories] = useState<Memory[]>([]);
  const [serverMemories, setServerMemories] = useState<Memory[]>([]);
  const [loadingServer, setLoadingServer] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch server-side memories from backend API (if available)
    async function fetchServerMemories() {
      const base = (import.meta.env as any).VITE_BACKEND_URL || 'http://localhost:8000';
      setLoadingServer(true);
      try {
        const resp = await fetch(`${base}/memories?limit=50`);
        if (!resp.ok) throw new Error(`Backend returned ${resp.status}`);
        const data = await resp.json();
        const mapped: Memory[] = data.map((m: any) => ({
          id: m.id,
          title: m.title || `Memory ${m.id}`,
          summary: m.title || '',
          category: m.category || 'general',
          agent: m.submitter || 'unknown',
          timestamp: m.submitted_at || new Date().toLocaleString(),
          validationScore: m.validation_score || 0,
          status: m.is_validated ? 'validated' : 'pending',
          cid: m.ipfs_cid,
          tags: [],
          reward: 0,
        }));
        setServerMemories(mapped.reverse());
        setServerError(null);
      } catch (e: any) {
        setServerError(String(e?.message || e));
        setServerMemories([]);
      } finally {
        setLoadingServer(false);
      }
    }
    // Load fallback memories saved by the Stylus JS fallback adapter from localStorage
    async function loadFallback() {
      try {
        const raw = localStorage.getItem('stylus.fallback.memories');
        if (!raw) return setFallbackMemories([]);
        const cids: string[] = JSON.parse(raw);
        const results: Memory[] = [];
        for (let i = 0; i < cids.length; i++) {
          const cid = cids[i];
          try {
            const url = `${(import.meta.env as any).VITE_IPFS_GATEWAY_BASE || 'https://ipfs.io'}/ipfs/${cid}`;
            const resp = await fetch(url);
            if (!resp.ok) continue;
            const json = await resp.json();
            // Expect payload shape similar to MemoryPayload + _meta
            const payload = json;
            results.push({
              id: 100000 + i,
              title: payload.title || `Memory ${i}`,
              summary: payload.summary || JSON.stringify(payload).slice(0, 200),
              category: payload.category || 'general',
              agent: payload._meta?.submitter || 'web-ui',
              timestamp: new Date((payload._meta?.submittedAt || Date.now()/1000) * 1000).toLocaleString(),
              validationScore: 0,
              status: 'pending',
              cid,
              tags: (payload.metadata && payload.metadata.tags) || [],
              reward: 0,
            });
          } catch (e) {
            // ignore fetch errors for each CID
            console.warn('Failed to load fallback CID', cid, e);
          }
        }
        setFallbackMemories(results.reverse());
      } catch (e) {
        console.warn('Failed to load fallback memories', e);
        setFallbackMemories([]);
      }
    }

    loadFallback();
    // also try to fetch server memories
    fetchServerMemories();
    // Refresh gallery when a new memory is submitted elsewhere in the app
    function onMemorySubmitted(_: Event) {
      fetchServerMemories();
      loadFallback();
    }
    // also listen to storage events so multiple tabs update
    function onStorage(e: StorageEvent) {
      if (e.key === 'stylus.fallback.memories') loadFallback();
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener('neurovault:memory:submitted', onMemorySubmitted as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('neurovault:memory:submitted', onMemorySubmitted as EventListener);
    };
  }, []);

  const allMemories = [...serverMemories, ...fallbackMemories, ...mockMemories];

  const filteredMemories = allMemories.filter(memory => {
    const matchesSearch = memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         memory.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         memory.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || memory.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="mb-8">
            <h2 className="text-3xl text-white mb-4">Explore Memories</h2>
            
            <motion.div 
              className="flex flex-col md:flex-row gap-4 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search memories, tags, or content..."
                  className="pl-10 bg-slate-900/50 border-purple-500/30 text-white placeholder:text-purple-300/30 focus:border-purple-500/60 transition-colors"
                />
              </div>
            </motion.div>

            <motion.div 
              className="flex gap-2 flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {['all', 'technology', 'science', 'mathematics', 'philosophy'].map((cat, index) => (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                    className={selectedCategory === cat 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'border-purple-500/30 text-purple-300 hover:bg-purple-900/30'
                    }
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </ScrollReveal>

        <motion.div 
          className="grid md:grid-cols-2 gap-6"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredMemories.map((memory, index) => (
              <ScrollReveal key={memory.id} delay={index * 0.05}>
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    duration: 0.3,
                    layout: { duration: 0.3 }
                  }}
                >
                  <MemoryCard memory={memory} />
                </motion.div>
              </ScrollReveal>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function MemoryCard({ memory }: { memory: Memory }) {
  const statusConfig = {
    validated: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-500/30' },
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-500/30' },
    challenged: { icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/30' },
  };

  const config = statusConfig[memory.status];
  const StatusIcon = config.icon;

  const [gatewayOptions, setGatewayOptions] = useState<string[] | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div 
          className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 border border-purple-500/20 rounded-xl p-6 cursor-pointer backdrop-blur-sm relative overflow-hidden group"
          whileHover={{ 
            borderColor: 'rgba(168, 85, 247, 0.4)',
            y: -4,
            scale: 1.01,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-cyan-500/0 group-hover:from-purple-500/5 group-hover:to-cyan-500/5"
            transition={{ duration: 0.3 }}
          />

          {/* Shimmer effect on hover */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            initial={false}
            animate={{
              background: [
                'linear-gradient(90deg, transparent 0%, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%, transparent 100%)',
                'linear-gradient(90deg, transparent 0%, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%, transparent 100%)',
              ],
              backgroundPosition: ['-200%', '200%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-white mb-2">{memory.title}</h3>
                <p className="text-sm text-purple-300/70 line-clamp-2">{memory.summary}</p>
              </div>
              <motion.div 
                className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${config.bg} ${config.border} border`}
                whileHover={{ scale: 1.05 }}
              >
                <StatusIcon className={`w-3 h-3 ${config.color}`} />
                <span className={config.color}>{memory.status}</span>
              </motion.div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {memory.tags.map((tag) => (
                <motion.div
                  key={tag}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs">
                    {tag}
                  </Badge>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-purple-300/60">
                  Agent: <span className="text-purple-300">{memory.agent}</span>
                </span>
                <span className="text-purple-300/60">{memory.timestamp}</span>
              </div>
              {memory.status === 'validated' && (
                <motion.span 
                  className="text-cyan-400"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  +{memory.reward} MCT
                </motion.span>
              )}
            </div>

            {memory.status === 'validated' && (
              <motion.div 
                className="mt-3 pt-3 border-t border-purple-500/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-300/60">Validation Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-900/50 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${memory.validationScore}%` }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                      />
                    </div>
                    <span className="text-sm text-white">{memory.validationScore}%</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="bg-gradient-to-br from-slate-900 to-purple-900/50 border-purple-500/30 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{memory.title}</DialogTitle>
        </DialogHeader>
        
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h4 className="text-sm text-purple-300/60 mb-2">Summary</h4>
            <p className="text-purple-200">{memory.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm text-purple-300/60 mb-1">Agent Address</h4>
              <p className="text-purple-200">{memory.agent}</p>
            </div>
            <div>
              <h4 className="text-sm text-purple-300/60 mb-1">Category</h4>
              <p className="text-purple-200">{memory.category}</p>
            </div>
            <div>
              <h4 className="text-sm text-purple-300/60 mb-1">IPFS CID</h4>
              <p className="text-purple-200 font-mono text-sm">{memory.cid}</p>
            </div>
            <div>
              <h4 className="text-sm text-purple-300/60 mb-1">Created</h4>
              <p className="text-purple-200">{memory.timestamp}</p>
            </div>
          </div>

          {memory.status === 'validated' && (
            <motion.div 
              className="bg-green-900/20 border border-green-500/30 rounded-lg p-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-green-400 mb-1">Validated</h4>
                  <p className="text-sm text-green-300/70">Score: {memory.validationScore}% | Reward: {memory.reward} MCT</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </motion.div>
          )}

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <a
                  href={getPublicGatewayUrl(memory.cid)}
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!looksLikeValidCid(memory.cid)) {
                      toast.error('CID looks truncated or invalid — open the full CID or check the record.');
                      return;
                    }
                    try {
                      const url = await findWorkingGateway(memory.cid);
                      const fallback = getPublicGatewayUrl(memory.cid);
                      if (!url || url === fallback) {
                        // Show chooser dialog with gateway options instead of confirm()
                        const options = getGatewayList(memory.cid);
                        setGatewayOptions(options);
                        setSelectedGateway(options.length ? options[0] : null);
                        setChooserOpen(true);
                      } else {
                        window.open(url, '_blank', 'noopener');
                      }
                    } catch (err) {
                      const options = getGatewayList(memory.cid);
                      setGatewayOptions(options);
                      setSelectedGateway(options.length ? options[0] : null);
                      setChooserOpen(true);
                    }
                  }}
                  rel="noopener noreferrer"
                  className="inline-flex items-center w-full justify-center gap-2 text-sm font-medium transition-all rounded-md h-9 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                  aria-label={`View memory ${memory.id} on IPFS`}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on IPFS
                </a>

                {/* Gateway chooser dialog (opens when automatic probe can't pick a working gateway) */}
                <Dialog open={chooserOpen} onOpenChange={(v) => setChooserOpen(v)}>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Choose an IPFS Gateway</DialogTitle>
                    </DialogHeader>

                    <div role="list" className="space-y-2 mt-4 mb-4">
                      {gatewayOptions?.map((u) => (
                        <div
                          key={u}
                          role="listitem"
                          className={`flex items-center justify-between gap-4 p-3 rounded-md hover:bg-slate-800 ${selectedGateway === u ? 'ring-2 ring-purple-500' : ''}`}
                        >
                          <div className="flex-1 text-sm break-words">{u}</div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={selectedGateway === u ? 'default' : 'outline'}
                              onClick={() => {
                                // Open a single gateway
                                window.open(u, '_blank', 'noopener');
                                setChooserOpen(false);
                              }}
                              aria-label={`Open gateway ${u}`}
                            >
                              Open
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedGateway(u)}
                              aria-pressed={selectedGateway === u}
                              aria-label={`Select gateway ${u}`}
                            >
                              Select
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <DialogFooter className="flex gap-2 justify-end">
                      <Button
                        onClick={() => {
                          if (selectedGateway) window.open(selectedGateway, '_blank', 'noopener');
                          setChooserOpen(false);
                        }}
                        aria-label="Open selected gateway"
                      >
                        Open Selected
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          gatewayOptions?.forEach((u) => window.open(u, '_blank', 'noopener'));
                          setChooserOpen(false);
                        }}
                        aria-label="Open all gateways in new tabs"
                      >
                        Open All
                      </Button>

                      <Button variant="ghost" onClick={() => setChooserOpen(false)} aria-label="Cancel gateway chooser">Cancel</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}