import React from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

interface TransactionStatusUIProps {
  status: TransactionStatus;
  txHash?: string;
  blockNumber?: number;
  confirmations?: number;
  message?: string;
  blockExplorerBase?: string;
}

/**
 * Transaction Status UI Component
 * Displays the current state of a blockchain transaction with link to explorer
 */
export default function TransactionStatusUI({
  status,
  txHash,
  blockNumber,
  confirmations = 0,
  message,
  blockExplorerBase = 'https://arbiscan.io',
}: TransactionStatusUIProps) {
  const isConfirmed = status === 'confirmed' && confirmations > 0;
  const shortHash = txHash ? `${txHash.slice(0, 8)}...${txHash.slice(-6)}` : '';
  const explorerUrl = txHash ? `${blockExplorerBase}/tx/${txHash}` : '';

  return (
    <Card className="p-4 space-y-3">
      {/* Header with status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === 'pending' && <Clock className="w-5 h-5 text-yellow-500 animate-spin" />}
          {status === 'confirmed' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {status === 'failed' && <AlertCircle className="w-5 h-5 text-red-500" />}
          <span className="font-medium text-sm">
            {status === 'pending' && 'Transaction Pending'}
            {status === 'confirmed' && 'Transaction Confirmed'}
            {status === 'failed' && 'Transaction Failed'}
          </span>
        </div>
        <Badge variant={status === 'confirmed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}>
          {status}
        </Badge>
      </div>

      {/* Transaction details */}
      {txHash && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Transaction Hash:</span>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-mono text-xs"
            >
              {shortHash}
            </a>
          </div>

          {blockNumber !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Block:</span>
              <span className="font-mono">{blockNumber}</span>
            </div>
          )}

          {confirmations > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Confirmations:</span>
              <span className="font-mono">
                {confirmations} {confirmations >= 12 ? '✓' : `(${12 - confirmations} remaining)`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Custom message */}
      {message && <p className="text-sm text-gray-700">{message}</p>}

      {/* Open explorer button */}
      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-xs text-blue-600 hover:underline mt-2"
        >
          View on Explorer →
        </a>
      )}
    </Card>
  );
}
