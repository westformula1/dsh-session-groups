Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host '=== publish with npm access token ===' -ForegroundColor Cyan
Write-Host 'Use a Granular Access Token with Bypass 2FA. No OTP needed.' -ForegroundColor Gray

$token = Read-Host 'Paste npm token (npm_...)'
if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Host 'No token entered; cancelled.' -ForegroundColor Red
  exit 1
}

$userconfig = Join-Path $env:TEMP ('npmrc-publish-' + [guid]::NewGuid().ToString('N'))
$content = "registry=https://registry.npmjs.org/`n//registry.npmjs.org/:_authToken=$token`n"
Set-Content -LiteralPath $userconfig -Value $content -Encoding Ascii -NoNewline

$env:NPM_CONFIG_USERCONFIG = $userconfig
$code = 1
try {
  npm publish --access public
  $code = $LASTEXITCODE
} finally {
  Remove-Item Env:NPM_CONFIG_USERCONFIG -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $userconfig -Force -ErrorAction SilentlyContinue
}

if ($code -ne 0) {
  Write-Host 'Publish failed. The token must be Granular, Read/write, and Bypass 2FA.' -ForegroundColor Red
  exit $code
}
Write-Host ''
Write-Host 'Publish command finished. If staged, approve or wait.' -ForegroundColor Green
