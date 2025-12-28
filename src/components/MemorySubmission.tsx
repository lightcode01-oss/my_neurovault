import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { Upload, Loader2, CheckCircle2, Sparkles, ExternalLink, RotateCcw, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollReveal } from './ScrollReveal';
import { useWallet } from '../hooks/useWallet';
import { useSubmitMemory } from '../hooks/useSubmitMemory';
import { MemoryPayload } from '../types/memory';
import { getPublicGatewayUrl, findWorkingGateway, looksLikeValidCid, getGatewayList } from '../lib/ipfs';
import { useEffect } from 'react';

export function MemorySubmission() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [showRetrySuccess, setShowRetrySuccess] = useState(false);
  const { address, connected } = useWallet();
  const { submit, loading, progress, status, txHash, error, cid, retryLast, lastPayload, wasmIndex, backendResponse } = useSubmitMemory() as any;
  useEffect(() => {
    function onBackendFail(e: Event) {
      try {
        const detail = (e as CustomEvent).detail || {};
        const msg = detail.body || `Backend POST failed (${detail.status || 'unknown'})`;
        toast.error(`Failed to persist memory to backend: ${msg}`);
      } catch (err) {
        toast.error('Failed to persist memory to backend');
      }
    }

    window.addEventListener('neurovault:backend:post_failed', onBackendFail as EventListener);
    return () => window.removeEventListener('neurovault:backend:post_failed', onBackendFail as EventListener);
  }, []);
  const [recentFallback, setRecentFallback] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('stylus.fallback.memories');
      const list = raw ? JSON.parse(raw) : [];
      setRecentFallback(list.slice(-5).reverse());
    } catch (e) {
      setRecentFallback([]);
    }
    function onStorage(e: StorageEvent) {
      if (e.key === 'stylus.fallback.memories') {
        try {
          const raw = localStorage.getItem('stylus.fallback.memories');
          const list = raw ? JSON.parse(raw) : [];
          setRecentFallback(list.slice(-5).reverse());
        } catch (e) { setRecentFallback([]); }
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation (category optional; default to 'general' if not provided)
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (title.trim().length < 3) {
      toast.error('Title must be at least 3 characters');
      return;
    }

    if (content.trim().length < 10) {
      toast.error('Content must be at least 10 characters');
      return;
    }

    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const memory: MemoryPayload = {
        agent: address || 'web-ui',
        title: title.trim(),
        summary: content.trim(),
        category: category || 'general',
        metadata: {
          submittedFrom: 'web-ui',
        },
      };

      await submit(memory);
      toast.success('Memory submitted successfully!');

      // Reset form
      setContent('');
      setTitle('');
      setCategory('');
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  const handleRetry = async () => {
    try {
      await retryLast();
      toast.success('Retry successful!');
      setShowRetrySuccess(true);
      setTimeout(() => setShowRetrySuccess(false), 3000);
    } catch (err) {
      toast.error('Retry failed. Please try again.');
      console.error('Retry error:', err);
    }
  };

  // Get status display text and color
  const getStatusDisplay = () => {
    switch (status) {
      case 'uploading':
        return { text: `Uploading to IPFS (${progress}%)`, color: 'text-blue-400' };
      case 'awaiting-signature':
        return { text: 'Awaiting your signature...', color: 'text-yellow-400' };
      case 'tx-pending':
        return { text: 'Submitting transaction...', color: 'text-orange-400' };
      case 'confirmed':
        return { text: 'Transaction confirmed!', color: 'text-green-400' };
      case 'error':
        return { text: 'Submission failed', color: 'text-red-400' };
      default:
        return { text: '', color: '' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <motion.div 
            className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 border border-purple-500/20 rounded-xl p-8 backdrop-blur-sm relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Animated particles in background */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${10 + i * 15}%`,
                }}
              >
                <motion.div
                  className="w-2 h-2 bg-cyan-400/20 rounded-full"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{
                    duration: 2 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              </div>
            ))}

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl text-white mb-2 flex items-center gap-2">
                  Submit AI Memory
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </h2>
                <p className="text-purple-300/70 mb-8">
                  Create a new knowledge unit to be validated and stored on-chain
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label htmlFor="title" className="text-purple-200">Memory Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Quantum Computing Fundamentals"
                    disabled={loading}
                    className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-purple-300/30 mt-2 focus:border-purple-500/60 transition-colors disabled:opacity-50"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Label htmlFor="category" className="text-purple-200">Category</Label>
                  <Select value={category} onValueChange={setCategory} disabled={loading}>
                    <SelectTrigger className="bg-slate-900/50 border-purple-500/30 text-white mt-2 focus:border-purple-500/60 transition-colors disabled:opacity-50">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="philosophy">Philosophy</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                      <SelectItem value="general">General Knowledge</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Label htmlFor="content" className="text-purple-200">Memory Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter the knowledge or insight you want to preserve..."
                    rows={8}
                    disabled={loading}
                    className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-purple-300/30 mt-2 focus:border-purple-500/60 transition-colors disabled:opacity-50"
                  />
                  <p className="text-xs text-purple-300/50 mt-2">
                    Content will be processed by AI, embedded, signed, and uploaded to IPFS
                  </p>
                </motion.div>

                {/* Progress bar during upload */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${statusDisplay.color}`}>
                          {statusDisplay.text}
                        </span>
                        <span className="text-xs text-purple-300/50">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </motion.div>
                )}

                {/* Error display with retry option */}
                {error && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-red-300 font-medium">Submission failed</p>
                        <p className="text-red-300/70 text-sm mt-1">{error.message || 'An error occurred during submission'}</p>
                      </div>
                    </div>
                    {lastPayload && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="w-full"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retry Last Submission
                      </Button>
                    )}
                  </motion.div>
                )}

                {/* Success notification */}
                {showRetrySuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-green-300 font-medium">Retry successful!</p>
                      <p className="text-green-300/70 text-sm">Your memory is now pending validation</p>
                    </div>
                  </motion.div>
                )}

                <motion.div 
                  className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <h4 className="text-sm text-purple-200 mb-2">Submission Process:</h4>
                  <ol className="text-sm text-purple-300/70 space-y-1 list-decimal list-inside">
                    <li>AI generates summary + embedding vector</li>
                    <li>Content signed with your agent key (ECDSA)</li>
                    <li>Uploaded to IPFS → CID generated</li>
                    <li>Registered on Arbitrum with CID hash</li>
                    <li>Submitted for validator review</li>
                  </ol>
                </motion.div>

                {/* Test-visible status (helps unit tests observe transient states) */}
                <div data-testid="submit-status" className="text-xs text-transparent">
                  {status}{cid ? ` ${cid}` : ''}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    type="submit"
                    disabled={loading || !connected}
                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 relative overflow-hidden group disabled:opacity-50"
                  >
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center"
                        >
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing & Uploading...
                        </motion.div>
                      ) : !connected ? (
                        <motion.div
                          key="not-connected"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Connect Wallet to Submit
                        </motion.div>
                      ) : (
                        <motion.div
                          key="submit"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Submit Memory
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </form>

              {/* Transaction status section */}
              {(txHash || cid) && (
                <motion.div
                  className="mt-6 space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {cid && (
                      <motion.div 
                        className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 hover:border-blue-500/40"
                      >
                      <p className="text-blue-300 text-xs font-medium mb-2">IPFS Upload Successful</p>
                      <p className="text-blue-100 text-sm font-mono break-all mb-3">{cid}</p>
                      <a
                        href={getPublicGatewayUrl(cid)}
                        onClick={async (e) => {
                          e.preventDefault();
                          if (!looksLikeValidCid(cid)) {
                            toast.error('CID looks truncated or invalid — open the full CID or check the record.');
                            return;
                          }
                          try {
                            const url = await findWorkingGateway(cid);
                            const fallback = getPublicGatewayUrl(cid);
                            if (!url || url === fallback) {
                              const options = getGatewayList(cid);
                              const open = window.confirm('Could not automatically find a responsive IPFS gateway. Open a list of gateway options in new tabs?');
                              if (open) options.forEach((u: string) => window.open(u, '_blank', 'noopener'));
                            } else {
                              window.open(url, '_blank', 'noopener');
                            }
                          } catch (err) {
                            const options = getGatewayList(cid);
                            const open = window.confirm('Could not automatically find a responsive IPFS gateway. Open a list of gateway options in new tabs?');
                            if (open) options.forEach((u: string) => window.open(u, '_blank', 'noopener'));
                          }
                        }}
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View on IPFS
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {typeof wasmIndex === 'number' && (
                        <div className="mt-3 text-sm text-purple-200">
                          <span className="text-xs text-purple-300/70">WASM Index:</span>{' '}
                          <span className="font-mono">#{wasmIndex}</span>
                        </div>
                      )}
                      {backendResponse && (
                        <div className="mt-2 text-sm text-blue-200">
                          <span className="text-xs text-blue-300/70">Backend ID:</span>{' '}
                          <span className="font-mono">#{(backendResponse?.id ?? backendResponse?.ID ?? '')}</span>
                        </div>
                      )}
                      {backendResponse && (
                        <div className="mt-4 bg-slate-900/20 border border-purple-500/10 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-purple-300/70">Validation Status</div>
                              <div className="text-sm text-white">
                                {backendResponse?.validations && backendResponse.validations.length > 0 ? (
                                  <>
                                    <span className="font-medium mr-2">{backendResponse.validations[0].valid ? 'PASSED' : 'FAILED'}</span>
                                    <span className="text-xs text-purple-300/70">score: {Math.round(backendResponse.validations[0].score)}</span>
                                    <div className="text-xs text-purple-300/60 mt-1">{backendResponse.validations[0].reason}</div>
                                  </>
                                ) : (
                                  <span className="text-sm text-orange-300">PENDING</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <button
                                className="inline-flex items-center gap-2 bg-purple-700 px-3 py-1 rounded text-sm"
                                onClick={async () => {
                                  try {
                                    const id = backendResponse?.id;
                                    if (!id) return;
                                    const resp = await fetch(`${(import.meta.env as any).VITE_BACKEND_URL.replace(/\/$/, '')}/validate`, {
                                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ memory_id: id })
                                    });
                                    if (resp.ok) {
                                      toast.success('Validation re-run requested');
                                    } else {
                                      toast.error('Failed to request validation');
                                    }
                                  } catch (err) {
                                    toast.error('Failed to request validation');
                                  }
                                }}
                              >
                                Re-run validation
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Recent fallback memories (local dev only) */}
                  {recentFallback.length > 0 && (
                    <motion.div className="mt-4 bg-slate-900/30 border border-purple-500/20 rounded-lg p-3">
                      <p className="text-xs text-purple-300/60 mb-2">Recent local submissions (dev fallback)</p>
                      <ul className="space-y-1 text-sm">
                        {recentFallback.map((c) => (
                          <li key={c} className="flex items-center justify-between">
                            <a href={getPublicGatewayUrl(c)} onClick={async (e) => { e.preventDefault(); if (!looksLikeValidCid(c)) { toast.error('CID looks truncated or invalid — open the full CID or check the record.'); return; } try { const url = await findWorkingGateway(c); const fallback = getPublicGatewayUrl(c); if (!url || url === fallback) { const options = getGatewayList(c); const open = window.confirm('Could not automatically find a responsive IPFS gateway. Open a list of gateway options in new tabs?'); if (open) options.forEach((u) => window.open(u, '_blank', 'noopener')); } else { window.open(url, '_blank', 'noopener'); } } catch { const options = getGatewayList(c); const open = window.confirm('Could not automatically find a responsive IPFS gateway. Open a list of gateway options in new tabs?'); if (open) options.forEach((u) => window.open(u, '_blank', 'noopener')); } }} rel="noreferrer" className="text-blue-300 font-mono truncate max-w-xs">{c}</a>
                            <a href={getPublicGatewayUrl(c)} onClick={async (e) => { e.preventDefault(); if (!looksLikeValidCid(c)) { toast.error('CID looks truncated or invalid — open the full CID or check the record.'); return; } try { const url = await findWorkingGateway(c); const fallback = getPublicGatewayUrl(c); if (!url || url === fallback) { const options = getGatewayList(c); const open = window.confirm('Could not automatically find a responsive IPFS gateway. Open a list of gateway options in new tabs?'); if (open) options.forEach((u) => window.open(u, '_blank', 'noopener')); } else { window.open(url, '_blank', 'noopener'); } } catch { const options = getGatewayList(c); const open = window.confirm('Could not automatically find a responsive IPFS gateway. Open a list of gateway options in new tabs?'); if (open) options.forEach((u) => window.open(u, '_blank', 'noopener')); } }} rel="noreferrer" className="text-blue-400 ml-2">View</a>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {txHash && (
                      <motion.div 
                        className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 hover:border-green-500/40"
                      >
                      <p className="text-green-300 text-xs font-medium mb-2">Transaction Confirmed</p>
                      <a
                        href={`${(import.meta.env as any).VITE_BLOCK_EXPLORER_BASE}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 text-sm font-mono flex items-center gap-2 break-all"
                      >
                        {txHash.slice(0, 10)}...{txHash.slice(-8)}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div 
            className="mt-8 grid md:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <InfoCard
              title="Gas Fee Estimate"
              value="~0.002 ETH"
              description="On Arbitrum network"
              delay={0.9}
            />
            <InfoCard
              title="Potential Reward"
              value="100-500 MCT"
              description="If validated successfully"
              delay={1.0}
            />
          </motion.div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default MemorySubmission;

function InfoCard({ title, value, description, delay }: { title: string; value: string; description: string; delay: number }) {
  return (
    <motion.div 
      className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/40 transition-colors"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="text-sm text-purple-300/60 mb-1">{title}</div>
      <div className="text-xl text-white mb-1">{value}</div>
      <div className="text-xs text-purple-300/50">{description}</div>
    </motion.div>
  );
}
