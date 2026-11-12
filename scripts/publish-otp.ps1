Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host '=== publish dsh-session-groups 0.2.1 ===' -ForegroundColor Cyan
Write-Host 'Wait for a FRESH 6-digit code. Do NOT reuse the login code.' -ForegroundColor Yellow
$otp = Read-Host 'Enter a NEW npm 6-digit OTP'
if ([string]::IsNullOrWhiteSpace($otp)) {
  Write-Host 'No OTP entered; cancelled.' -ForegroundColor Red
  exit 1
}

npm publish --access public --otp=$otp
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Publish failed. Wait for the next code and run this again.' -ForegroundColor Red
  exit 1
}
Write-Host ''
Write-Host 'Publish command finished. If staged, approve or wait.' -ForegroundColor Green
