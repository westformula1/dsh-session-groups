param([string]$Otp)

Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host '=== dsh-session-groups npm publish ===' -ForegroundColor Cyan
Write-Host 'npm 2FA requires one current 6-digit code.' -ForegroundColor Gray

npm whoami 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Log in to npm first (username / password / OTP)...' -ForegroundColor Yellow
  npm login --auth-type=legacy
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'npm login failed.' -ForegroundColor Red
    exit 1
  }
}

if ([string]::IsNullOrWhiteSpace($Otp)) {
  $Otp = Read-Host 'Enter current npm 6-digit OTP'
}
if ([string]::IsNullOrWhiteSpace($Otp)) {
  Write-Host 'No OTP entered; cancelled.' -ForegroundColor Red
  exit 1
}

npm publish --access public --otp=$Otp
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Publish failed.' -ForegroundColor Red
  exit 1
}

Write-Host ''
Write-Host 'Publish command finished. If npm stages it, approve on npm or wait.' -ForegroundColor Green
