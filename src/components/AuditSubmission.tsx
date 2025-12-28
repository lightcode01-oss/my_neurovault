import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Upload, Loader2, CheckCircle2, FileCode, DollarSign } from 'lucide-react';
import { Checkbox } from './ui/checkbox';

export function AuditSubmission() {
  const [contractCode, setContractCode] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');
  const [expedited, setExpedited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractCode || !contractAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    // Simulate AI analysis + blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    toast.success('Audit submitted successfully!', {
      description: 'AI agents are analyzing your contract. Results in ~10 minutes.',
      icon: <CheckCircle2 className="w-4 h-4" />,
    });

    setContractCode('');
    setContractAddress('');
    setBountyAmount('');
    setExpedited(false);
    setIsSubmitting(false);
  };

  const sampleVulnerableContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableBank {
    mapping(address => uint256) public balances;
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    // ⚠️ REENTRANCY VULNERABILITY
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount);
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        
        balances[msg.sender] -= amount;
    }
}`;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 border border-blue-500/20 rounded-xl p-8 backdrop-blur-sm">
          <h2 className="text-3xl text-white mb-2">Submit Contract for Audit</h2>
          <p className="text-blue-300/70 mb-8">
            Get AI-powered security analysis with on-chain verification
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="contractAddress" className="text-blue-200">Contract Address</Label>
              <Input
                id="contractAddress"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                placeholder="0x..."
                className="bg-slate-900/50 border-blue-500/30 text-white placeholder:text-blue-300/30 mt-2 font-mono"
              />
              <p className="text-xs text-blue-300/50 mt-1">
                Arbitrum contract address (or leave empty for source-only audit)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="contractCode" className="text-blue-200">Contract Source Code</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setContractCode(sampleVulnerableContract)}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Load Sample (with vulnerability)
                </Button>
              </div>
              <Textarea
                id="contractCode"
                value={contractCode}
                onChange={(e) => setContractCode(e.target.value)}
                placeholder="// Paste your Solidity contract here..."
                rows={12}
                className="bg-slate-900/50 border-blue-500/30 text-white placeholder:text-blue-300/30 font-mono text-sm"
              />
              <p className="text-xs text-blue-300/50 mt-2">
                Supports Solidity (.sol) and Rust (.rs) for Stylus contracts
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bounty" className="text-blue-200">Bug Bounty (Optional)</Label>
                <div className="relative mt-2">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <Input
                    id="bounty"
                    type="number"
                    value={bountyAmount}
                    onChange={(e) => setBountyAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-9 bg-slate-900/50 border-blue-500/30 text-white placeholder:text-blue-300/30"
                  />
                </div>
                <p className="text-xs text-blue-300/50 mt-1">ETH reward for critical findings</p>
              </div>

              <div>
                <Label className="text-blue-200 mb-2 block">Audit Options</Label>
                <div className="flex items-center space-x-2 mt-2 pt-2">
                  <Checkbox
                    id="expedited"
                    checked={expedited}
                    onCheckedChange={(checked) => setExpedited(checked as boolean)}
                    className="border-blue-500/30"
                  />
                  <label
                    htmlFor="expedited"
                    className="text-sm text-blue-200 cursor-pointer"
                  >
                    Expedited validation (+0.05 ETH)
                  </label>
                </div>
                <p className="text-xs text-blue-300/50 mt-1">Priority queue for validators</p>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-sm text-blue-200 mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                AI Audit Process:
              </h4>
              <ol className="text-sm text-blue-300/70 space-y-1 list-decimal list-inside">
                <li>Multi-agent AI analysis (GPT-4 + Claude + Slither)</li>
                <li>Static analysis for common vulnerabilities</li>
                <li>Formal verification and symbolic execution</li>
                <li>Gas optimization recommendations</li>
                <li>Upload results to IPFS with CID hash</li>
                <li>Submit to Arbitrum for on-chain registration</li>
                <li>Validator review and consensus</li>
                <li>Security Certificate NFT minted (if passed)</li>
              </ol>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Contract...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit for Audit
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <InfoCard
            title="Base Fee"
            value="Free"
            description="AI audit included"
          />
          <InfoCard
            title="Validation Fee"
            value="0.1 ETH"
            description="Expert review + NFT"
          />
          <InfoCard
            title="Avg. Processing"
            value="~10 min"
            description="AI analysis time"
          />
        </div>

        <div className="mt-6 bg-gradient-to-br from-blue-900/30 to-slate-900/30 border border-blue-500/20 rounded-xl p-6">
          <h3 className="text-white mb-4">What We Check:</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-blue-300/70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              Reentrancy vulnerabilities
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              Integer overflow/underflow
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              Access control issues
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              Front-running attacks
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              Denial of Service vectors
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              Gas optimization issues
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              Logic bugs & edge cases
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              Best practice violations
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/30 border border-blue-500/20 rounded-lg p-4">
      <div className="text-sm text-blue-300/60 mb-1">{title}</div>
      <div className="text-xl text-white mb-1">{value}</div>
      <div className="text-xs text-blue-300/50">{description}</div>
    </div>
  );
}
