Set-Location "C:\Users\AFIT\Desktop\AfriScout"

$schemaFile = "apps\api\src\database\prisma\schema.prisma"
$schemaDir  = "apps\api\src\database\prisma\schema"

$raw = Get-Content $schemaFile -Raw
$marker = "// Domain schemas are defined in"
$idx = $raw.IndexOf($marker)
if ($idx -lt 0) {
  $headerEnd = ($raw | Select-String -Pattern "^(model|enum)\s" -AllMatches).Matches
  $idx = if ($headerEnd.Count -gt 0) { $headerEnd[0].Index } else { $raw.Length }
}
$header = $raw.Substring(0, $idx).TrimEnd()

Copy-Item $schemaFile "$schemaFile.bak" -Force

$order = @(
  "user.prisma","dna.prisma","source.prisma","opportunity.prisma",
  "organization.prisma","ai.prisma","matching.prisma","pipeline.prisma",
  "notification.prisma","api.prisma","audit.prisma","system.prisma"
)

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine($header)
[void]$sb.AppendLine("")
[void]$sb.AppendLine("// =============================================================")
[void]$sb.AppendLine("// Merged models. Source of truth is the individual files under")
[void]$sb.AppendLine("// ./schema/. Re-run scripts/merge-prisma-schema.ps1 after editing")
[void]$sb.AppendLine("// any file in that folder.")
[void]$sb.AppendLine("// =============================================================")
[void]$sb.AppendLine("")

foreach ($name in $order) {
  $path = Join-Path $schemaDir $name
  if (-not (Test-Path $path)) { Write-Warning "Missing file: $name"; continue }
  [void]$sb.AppendLine("// ---------- $name ----------")
  [void]$sb.AppendLine((Get-Content $path -Raw).TrimEnd())
  [void]$sb.AppendLine("")
}

Set-Content -Path $schemaFile -Value $sb.ToString() -NoNewline
Write-Host "Merged schema written to $schemaFile"
