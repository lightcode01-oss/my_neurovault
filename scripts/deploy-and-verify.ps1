<#
  scripts/deploy-and-verify.ps1

  One-shot PowerShell helper to:
    - load .env.local into current session (if present)
    - ensure PRIVATE_KEY is available (prompt if not)
    - optionally start a local hardhat node
    - compile contracts, deploy upgradeable proxy with Hardhat
    - optionally run verification script (with retries)

  Usage examples:
    # Ephemeral hardhat network (no funds required)
    pwsh ./scripts/deploy-and-verify.ps1 -Network hardhat

    # Deploy to local hardhat node (starts node in background)
    pwsh ./scripts/deploy-and-verify.ps1 -Network localhost -UseLocalNode

    # Deploy to Arbitrum Sepolia (requires funded PRIVATE_KEY & RPC set in .env.local)
    pwsh ./scripts/deploy-and-verify.ps1 -Network arbitrumSepolia -Verify

  Security:
    - Never commit secrets. This script reads `.env.local` into the current session
      and may prompt you for `PRIVATE_KEY` if not set. Keys entered interactively
      are only set for the current PowerShell session.
#>

param(
  [string]$Network = 'arbitrumSepolia',
  [switch]$Verify,
  [switch]$UseLocalNode
)

function Load-EnvFile($path) {
  if (-not (Test-Path $path)) { return }
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq '' -or $line.StartsWith('#')) { return }
    if ($line -match "^([^=]+)=(.*)$") {
      $k = $Matches[1].Trim()
      $v = $Matches[2].Trim().Trim("'", '"')
      Write-Host "Loading env var: $k" -ForegroundColor DarkCyan
      $env:$k = $v
    }
  }
}

function Ensure-PrivateKey() {
  if ($env:PRIVATE_KEY -and $env:PRIVATE_KEY.Trim() -ne '') { return }
  Write-Host 'PRIVATE_KEY not found in environment. You can set it in .env.local or enter now (secure input).' -ForegroundColor Yellow
  $secure = Read-Host 'Enter PRIVATE_KEY (will not echo)' -AsSecureString
  $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $plain = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  if (-not $plain) { throw 'No private key provided' }
  $env:PRIVATE_KEY = $plain
}

function Validate-PrivateKeyFormat() {
  if (-not $env:PRIVATE_KEY) { throw 'PRIVATE_KEY missing' }
  $k = $env:PRIVATE_KEY.Trim()
  if ($k -notmatch '^0x[0-9a-fA-F]{64}$') {
    Write-Host "WARNING: PRIVATE_KEY does not look like a 0x-prefixed 64-byte hex key." -ForegroundColor Yellow
    Write-Host "Please verify before deploying to testnet/mainnet."
  }
}

function Run-Command($cmd, $args) {
  Write-Host "\n> $cmd $args" -ForegroundColor Cyan
  $proc = Start-Process -FilePath $cmd -ArgumentList $args -NoNewWindow -PassThru -Wait -RedirectStandardOutput stdout.txt -RedirectStandardError stderr.txt
  $out = Get-Content stdout.txt -Raw -ErrorAction SilentlyContinue
  $err = Get-Content stderr.txt -Raw -ErrorAction SilentlyContinue
  Remove-Item -Force stdout.txt, stderr.txt -ErrorAction SilentlyContinue
  if ($proc.ExitCode -ne 0) {
    Write-Host "Command failed with exit code $($proc.ExitCode)" -ForegroundColor Red
    if ($out) { Write-Host $out }
    if ($err) { Write-Host $err }
    throw "Command failed: $cmd $args"
  }
  return $out
}

try {
  Write-Host "Starting deploy-and-verify (Network=$Network, Verify=$($Verify.IsPresent), UseLocalNode=$($UseLocalNode.IsPresent))" -ForegroundColor Green

  # Load local .env if present
  $envPath = Join-Path (Get-Location) '.env.local'
  if (Test-Path $envPath) { Load-EnvFile $envPath }

  # Ensure PRIVATE_KEY available for non-ephemeral networks
  if ($Network -ne 'hardhat' -and $Network -ne 'localhost') {
    Ensure-PrivateKey
    Validate-PrivateKeyFormat
  }

  # If requested, start a local hardhat node in background
  if ($UseLocalNode) {
    Write-Host 'Starting local Hardhat node in a new PowerShell window...' -ForegroundColor Cyan
    Start-Process -FilePath pwsh -ArgumentList '-NoExit','-Command','npx hardhat node' -WindowStyle Normal
    Write-Host 'Waiting 4s for node to initialize...' -ForegroundColor DarkCyan
    Start-Sleep -Seconds 4
  }

  # Compile
  Write-Host 'Compiling contracts (hardhat compile)...' -ForegroundColor Cyan
  Run-Command 'npx' 'hardhat compile'

  # Deploy via Hardhat script
  $deployArgs = "run scripts/deploy.ts --network $Network"
  Write-Host "Deploying to network: $Network" -ForegroundColor Green
  $out = Run-Command 'npx' $deployArgs
  Write-Host $out

  # Display saved deployments JSON
  $deploymentsFile = Join-Path (Get-Location) 'deployments/memoryRegistry.json'
  if (Test-Path $deploymentsFile) {
    Write-Host "\nDeployment output (deployments/memoryRegistry.json):" -ForegroundColor Green
    Get-Content $deploymentsFile | ForEach-Object { Write-Host "  $_" }
  } else {
    Write-Host 'Warning: deployments/memoryRegistry.json not found.' -ForegroundColor Yellow
  }

  # Optional verification
  if ($Verify) {
    Write-Host 'Running verification script (this may retry internally)...' -ForegroundColor Cyan
    Run-Command 'npx' "hardhat run scripts/verify.ts --network $Network"
    Write-Host 'Verification job started/completed (check output above).' -ForegroundColor Green
  }

  Write-Host 'Deploy script finished successfully.' -ForegroundColor Green
} catch {
  Write-Host "Error during deployment: $_" -ForegroundColor Red
  exit 1
}
