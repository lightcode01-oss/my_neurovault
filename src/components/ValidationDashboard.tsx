import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Award } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ScrollReveal } from './ScrollReveal';

interface PendingMemory {
  id: number;
  title: string;
  content: string;
  category: string;
  agent: string;
  timestamp: string;
  cid: string;
  tags: string[];
}

const pendingMemories: PendingMemory[] = [
  {
    id: 4,
    title: 'Neural Network Attention Mechanisms',
    content: 'Deep dive into transformer architecture attention layers and how they enable models to weigh the importance of different input elements dynamically. The self-attention mechanism computes attention scores between all pairs of positions in a sequence, allowing the model to capture long-range dependencies more effectively than RNNs.',
    category: 'technology',
    agent: '0x1d9f...6c2a',
    timestamp: '12 hours ago',
    cid: 'QmA7r...5k8t',
    tags: ['ai', 'neural-networks', 'transformers'],
  },
  {
    id: 7,
    title: 'Photosynthesis Carbon Fixation Pathways',
    content: 'Examination of C3, C4, and CAM photosynthetic pathways, highlighting evolutionary adaptations to different environmental conditions and their efficiency in carbon dioxide fixation.',
    category: 'science',
    agent: '0x7e3d...4a9b',
    timestamp: '6 hours ago',
    cid: 'QmD8u...2v7x',
    tags: ['biology', 'photosynthesis', 'evolution'],
  },
  {
    id: 8,
    title: 'Riemann Hypothesis Implications',
    content: 'Analysis of potential consequences if the Riemann Hypothesis were proven, including impacts on prime number distribution theory and cryptographic security.',
    category: 'mathematics',
    agent: '0x2b8f...5c1e',
    timestamp: '3 hours ago',
    cid: 'QmE9v...6w3y',
    tags: ['mathematics', 'number-theory', 'cryptography'],
  },
];

export function ValidationDashboard() {
  const [selectedMemory, setSelectedMemory] = useState<PendingMemory | null>(null);
  const [feedback, setFeedback] = useState('');

  const handleValidate = (approved: boolean) => {
    if (!selectedMemory) return;

    toast.success(
      approved ? 'Memory approved!' : 'Memory rejected',
      {
        description: approved 
          ? `+50 MCT validator reward. Memory ${selectedMemory.id} will be finalized on-chain.`
          : `Feedback submitted. Memory ${selectedMemory.id} will be challenged.`,
      }
    );

    setSelectedMemory(null);
    setFeedback('');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="mb-8">
            <h2 className="text-3xl text-white mb-2">Validation Dashboard</h2>
            <p className="text-purple-300/70">Review and validate pending memories to earn rewards</p>
          </div>
        </ScrollReveal>

        <motion.div 
          className="grid lg:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ScrollReveal delay={0.3}>
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Your Reputation Score"
              value="847"
              color="text-cyan-400"
              delay={0.3}
            />
          </ScrollReveal>
          <ScrollReveal delay={0.4}>
            <StatCard
              icon={<Award className="w-5 h-5" />}
              label="Validations This Week"
              value="23"
              color="text-purple-400"
              delay={0.4}
            />
          </ScrollReveal>
          <ScrollReveal delay={0.5}>
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="MCT Earned"
              value="1,250"
              color="text-green-400"
              delay={0.5}
            />
          </ScrollReveal>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Memories List */}
          <ScrollReveal direction="left">
            <div>
              <motion.h3 
                className="text-xl text-white mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                Pending Memories ({pendingMemories.length})
              </motion.h3>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {pendingMemories.map((memory, index) => (
                    <motion.div
                      key={memory.id}
                      onClick={() => setSelectedMemory(memory)}
                      className={`bg-gradient-to-br from-purple-900/40 to-slate-900/40 border rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden group ${
                        selectedMemory?.id === memory.id
                          ? 'border-purple-500/60 ring-2 ring-purple-500/30'
                          : 'border-purple-500/20 hover:border-purple-500/40'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ x: 4, scale: 1.01 }}
                      layout
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-cyan-500/0 group-hover:from-purple-500/5 group-hover:to-cyan-500/5"
                        transition={{ duration: 0.3 }}
                      />
                      
                      {/* Pulse effect for selected */}
                      {selectedMemory?.id === memory.id && (
                        <motion.div
                          className="absolute inset-0 border border-purple-500/30 rounded-xl"
                          animate={{
                            scale: [1, 1.02, 1],
                            opacity: [0.5, 0.8, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        />
                      )}
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white">{memory.title}</h4>
                          <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                            Pending
                          </Badge>
                        </div>
                        <p className="text-sm text-purple-300/70 line-clamp-2 mb-3">{memory.content}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-purple-300/60">Agent: {memory.agent}</span>
                          <span className="text-purple-300/60">{memory.timestamp}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </ScrollReveal>

          {/* Validation Panel */}
          <div className="lg:sticky lg:top-24 h-fit">
            <AnimatePresence mode="wait">
              {selectedMemory ? (
                <motion.div 
                  key="validation-panel"
                  className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full blur-2xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  <div className="relative z-10">
                    <h3 className="text-xl text-white mb-4">Review Memory</h3>
                    
                    <div className="space-y-4 mb-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <h4 className="text-sm text-purple-300/60 mb-1">Title</h4>
                        <p className="text-white">{selectedMemory.title}</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h4 className="text-sm text-purple-300/60 mb-1">Content</h4>
                        <p className="text-purple-200 text-sm">{selectedMemory.content}</p>
                      </motion.div>

                      <motion.div 
                        className="grid grid-cols-2 gap-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div>
                          <h4 className="text-sm text-purple-300/60 mb-1">Category</h4>
                          <p className="text-purple-200 text-sm">{selectedMemory.category}</p>
                        </div>
                        <div>
                          <h4 className="text-sm text-purple-300/60 mb-1">IPFS CID</h4>
                          <p className="text-purple-200 text-sm font-mono">{selectedMemory.cid}</p>
                        </div>
                      </motion.div>

                      <motion.div 
                        className="flex flex-wrap gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {selectedMemory.tags.map((tag, i) => (
                          <motion.div
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + i * 0.05 }}
                          >
                            <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs">
                              {tag}
                            </Badge>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>

                    <motion.div 
                      className="mb-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Label htmlFor="feedback" className="text-purple-200">Validation Feedback (Optional)</Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide reasoning for your decision..."
                        rows={3}
                        className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-purple-300/30 mt-2 focus:border-purple-500/60 transition-colors"
                      />
                    </motion.div>

                    <motion.div 
                      className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ borderColor: 'rgba(168, 85, 247, 0.5)' }}
                    >
                      <h4 className="text-sm text-purple-200 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Validation Criteria
                      </h4>
                      <ul className="text-xs text-purple-300/70 space-y-1 list-disc list-inside">
                        <li>Accuracy and factual correctness</li>
                        <li>Proper categorization and tagging</li>
                        <li>Original content (not plagiarized)</li>
                        <li>Appropriate scope and depth</li>
                        <li>Valid cryptographic signature</li>
                      </ul>
                    </motion.div>

                    <motion.div 
                      className="flex gap-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <motion.div 
                        className="flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() => handleValidate(false)}
                          variant="outline"
                          className="w-full border-red-500/30 text-red-400 hover:bg-red-900/30"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </motion.div>
                      <motion.div 
                        className="flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() => handleValidate(true)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </motion.div>
                    </motion.div>

                    <motion.p 
                      className="text-xs text-purple-300/50 text-center mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      Earn 50 MCT for each valid validation
                    </motion.p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty-panel"
                  className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 border border-purple-500/20 rounded-xl p-12 text-center backdrop-blur-sm"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <AlertCircle className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-purple-300/60">Select a memory to review</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, delay }: { icon: React.ReactNode; label: string; value: string; color: string; delay: number }) {
  return (
    <motion.div 
      className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-colors relative overflow-hidden group"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-cyan-500/0 group-hover:from-purple-500/5 group-hover:to-cyan-500/5"
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10">
        <motion.div 
          className={`mb-2 ${color}`}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          {icon}
        </motion.div>
        <div className="text-2xl text-white mb-1">{value}</div>
        <div className="text-sm text-purple-300/60">{label}</div>
      </div>
    </motion.div>
  );
}