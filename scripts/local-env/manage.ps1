param(
  [Parameter(Position = 0)]
  [ValidateSet('setup', 'start', 'stop', 'status')]
  [string]$Action = 'status'
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runtimeRoot = Join-Path $env:LOCALAPPDATA 'PI-CUBE\Runtime'
$trustedPostgresBin = Join-Path $env:ProgramFiles 'PI-CUBE\PostgreSQL\14.24\pgsql\bin'
$postgresBin = if ($env:PI_CUBE_POSTGRES_BIN) {
  $env:PI_CUBE_POSTGRES_BIN
} else {
  $trustedPostgresBin
}
$postgresData = Join-Path $runtimeRoot 'PostgreSQL\data\pi-cube-dev'
$postgresLog = Join-Path $runtimeRoot 'PostgreSQL\logs\pi-cube-dev.log'
$postgresPort = 55432
$backendPort = 4101
$webPort = 5100
$pgCtl = Join-Path $postgresBin 'pg_ctl.exe'
$initDb = Join-Path $postgresBin 'initdb.exe'
$psql = Join-Path $postgresBin 'psql.exe'
$createdb = Join-Path $postgresBin 'createdb.exe'

$minioRoot = Join-Path $runtimeRoot 'MinIO'
$minioExe = Join-Path $env:ProgramFiles 'PI-CUBE\MinIO\minio.exe'
$minioData = Join-Path $minioRoot 'data'
$minioLog = Join-Path $minioRoot 'logs\minio.log'
$minioPidFile = Join-Path $minioRoot 'minio.pid'
$minioPort = 9100
$minioConsolePort = 9101

function New-RandomHex([int]$ByteCount = 32) {
  $bytes = [byte[]]::new($ByteCount)
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  } finally {
    $generator.Dispose()
  }
  return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
}

function Read-DotEnv([string]$Path) {
  $values = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $values
  }
  foreach ($rawLine in Get-Content -LiteralPath $Path) {
    $line = $rawLine.Trim()
    if (-not $line -or $line.StartsWith('#') -or -not $line.Contains('=')) {
      continue
    }
    $parts = $line.Split('=', 2)
    $values[$parts[0].Trim()] = $parts[1].Trim().Trim('"').Trim("'")
  }
  return $values
}

function Ensure-EnvironmentFiles {
  $rootEnvPath = Join-Path $projectRoot '.env.local'
  $backendEnvPath = Join-Path $projectRoot 'backend\.env'
  if (-not (Test-Path -LiteralPath $rootEnvPath)) {
    $databasePassword = New-RandomHex 24
    $minioPassword = New-RandomHex 24
    $onlyOfficeSecret = New-RandomHex 32
    $databaseUrl = "postgresql://pi_cube:$databasePassword@127.0.0.1:$postgresPort/pi_cube"
    $rootEnv = @"
NODE_ENV=development
APP_URL=http://localhost:$webPort
NEXT_PUBLIC_APP_URL=http://localhost:$webPort
BACKEND_URL=http://localhost:$backendPort
NEXT_PUBLIC_API_BASE_URL=http://localhost:$backendPort
CORS_ORIGINS=http://localhost:$webPort,http://127.0.0.1:$webPort
LOCAL_ADMIN_ONE_CLICK_ENABLED=false
LOCAL_ADMIN_EMAIL=
LOCAL_ADMIN_PASSWORD=
PUBLIC_REGISTRATION_ENABLED=false
DATABASE_URL=$databaseUrl
PGDATABASE_URL=$databaseUrl
PG_HOST=127.0.0.1
PG_PORT=$postgresPort
PG_USER=pi_cube
PG_PASSWORD=$databasePassword
PG_DATABASE=pi_cube
PG_SSL_MODE=disable
PG_SSL_REJECT_UNAUTHORIZED=true
S3_ACCESS_KEY_ID=pi_cube_admin
S3_SECRET_ACCESS_KEY=$minioPassword
S3_BUCKET=pi-cube-files
S3_REGION=us-east-1
S3_ENDPOINT=http://127.0.0.1:$minioPort
S3_PUBLIC_ENDPOINT=http://127.0.0.1:$minioPort
S3_FORCE_PATH_STYLE=true
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=
AI_TEXT_MODEL=
AI_VISION_MODEL=
ALIPAY_APPID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
ALIPAY_REDIRECT_URI=http://localhost:$webPort/api/alipay/callback
YSWITH_APP_KEY=
YSWITH_APP_SECRET=
ONLYOFFICE_URL=
NEXT_PUBLIC_ONLYOFFICE_URL=
ONLYOFFICE_JWT_ENABLED=false
ONLYOFFICE_JWT_SECRET=$onlyOfficeSecret
ALLOW_DATABASE_MIGRATION_API=false
"@
    Set-Content -LiteralPath $rootEnvPath -Value $rootEnv -Encoding utf8
    Write-Host 'Created .env.local with generated local-only credentials.'
  }

  $values = Read-DotEnv $rootEnvPath
  foreach ($required in @('DATABASE_URL', 'PG_PASSWORD', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET')) {
    if (-not $values[$required]) {
      throw ".env.local is missing $required"
    }
  }

  if (-not (Test-Path -LiteralPath $backendEnvPath)) {
    $backendEnv = @"
NODE_ENV=development
PORT=$backendPort
BODY_LIMIT=50mb
APP_URL=http://localhost:$webPort
CORS_ORIGINS=http://localhost:$webPort,http://127.0.0.1:$webPort
PUBLIC_REGISTRATION_ENABLED=false
DATABASE_URL=$($values.DATABASE_URL)
PGDATABASE_URL=$($values.DATABASE_URL)
PG_HOST=127.0.0.1
PG_PORT=$postgresPort
PG_USER=pi_cube
PG_PASSWORD=$($values.PG_PASSWORD)
PG_DATABASE=pi_cube
PG_SSL_MODE=disable
S3_ACCESS_KEY_ID=$($values.S3_ACCESS_KEY_ID)
S3_SECRET_ACCESS_KEY=$($values.S3_SECRET_ACCESS_KEY)
S3_BUCKET=$($values.S3_BUCKET)
S3_REGION=us-east-1
S3_ENDPOINT=http://127.0.0.1:$minioPort
S3_PUBLIC_ENDPOINT=http://127.0.0.1:$minioPort
S3_FORCE_PATH_STYLE=true
ALIPAY_APPID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
ALIPAY_REDIRECT_URI=http://localhost:$webPort/api/alipay/callback
YSWITH_APP_KEY=
YSWITH_APP_SECRET=
"@
    Set-Content -LiteralPath $backendEnvPath -Value $backendEnv -Encoding utf8
    Write-Host 'Created backend/.env with generated local-only credentials.'
  }
  return $values
}

function Assert-PostgresBinaries {
  foreach ($binary in @($pgCtl, $initDb, $psql, $createdb)) {
    if (-not (Test-Path -LiteralPath $binary)) {
      throw "PostgreSQL binary not found: $binary. Set PI_CUBE_POSTGRES_BIN to a PostgreSQL bin directory."
    }
  }
}

function Test-PostgresRunning {
  if (-not (Test-Path -LiteralPath (Join-Path $postgresData 'PG_VERSION'))) {
    return $false
  }
  & $pgCtl status -D $postgresData *> $null
  return $LASTEXITCODE -eq 0
}

function Initialize-Postgres([hashtable]$Values) {
  Assert-PostgresBinaries
  if (Test-Path -LiteralPath (Join-Path $postgresData 'PG_VERSION')) {
    return
  }
  New-Item -ItemType Directory -Force -Path $postgresData, (Split-Path $postgresLog) | Out-Null
  $passwordFile = Join-Path $env:TEMP "pi-cube-postgres-$([guid]::NewGuid().ToString('N')).txt"
  try {
    Set-Content -LiteralPath $passwordFile -Value $Values.PG_PASSWORD -NoNewline -Encoding utf8
    & $initDb -D $postgresData -U pi_cube --pwfile=$passwordFile --auth-host=scram-sha-256 --auth-local=scram-sha-256 --encoding=UTF8
    if ($LASTEXITCODE -ne 0) {
      throw "initdb failed with exit code $LASTEXITCODE"
    }
  } finally {
    Remove-Item -LiteralPath $passwordFile -Force -ErrorAction SilentlyContinue
  }
  Add-Content -LiteralPath (Join-Path $postgresData 'postgresql.conf') -Encoding utf8 -Value "`nlisten_addresses = '127.0.0.1'`nport = $postgresPort`nmax_connections = 50`n"
}

function Start-Postgres([hashtable]$Values) {
  if (Test-PostgresRunning) {
    Write-Host "PostgreSQL is already running on port $postgresPort."
  } else {
    & $pgCtl start -D $postgresData -l $postgresLog -w
    if ($LASTEXITCODE -ne 0) {
      throw "PostgreSQL failed to start. Check $postgresLog"
    }
  }
  $previousPassword = $env:PGPASSWORD
  try {
    $env:PGPASSWORD = $Values.PG_PASSWORD
    $databaseResult = @(& $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='pi_cube'")
    if ($LASTEXITCODE -ne 0) {
      throw "Database availability check failed with exit code $LASTEXITCODE"
    }
    $databaseExists = ($databaseResult -join '').Trim()
    if ($databaseExists -ne '1') {
      & $createdb -h 127.0.0.1 -p $postgresPort -U pi_cube pi_cube
      if ($LASTEXITCODE -ne 0) {
        throw "createdb failed with exit code $LASTEXITCODE"
      }
    }
    & $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d pi_cube -v ON_ERROR_STOP=1 -f (Join-Path $projectRoot 'database\init\00-extensions.sql') | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "PostgreSQL extension setup failed with exit code $LASTEXITCODE"
    }
    $tableResult = @(& $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d pi_cube -tAc "SELECT count(*) FROM pg_tables WHERE schemaname='public'")
    if ($LASTEXITCODE -ne 0) {
      throw "Database schema check failed with exit code $LASTEXITCODE"
    }
    $tableCount = [int](($tableResult -join '').Trim())
    if ($tableCount -eq 0) {
      & $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d pi_cube -v ON_ERROR_STOP=1 -f (Join-Path $projectRoot 'database\init\10-application-schema.sql') | Out-Null
      if ($LASTEXITCODE -ne 0) {
        throw "Application schema setup failed with exit code $LASTEXITCODE"
      }
    }
    & $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d pi_cube -v ON_ERROR_STOP=1 -f (Join-Path $projectRoot 'migrations\20260828_sync_settlement_application_schema.sql') | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Settlement application schema migration failed with exit code $LASTEXITCODE"
    }
    & $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d pi_cube -v ON_ERROR_STOP=1 -f (Join-Path $projectRoot 'migrations\20260824_add_base_management_fields.sql') | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Base management schema migration failed with exit code $LASTEXITCODE"
    }
    & $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d pi_cube -v ON_ERROR_STOP=1 -f (Join-Path $projectRoot 'migrations\20260828_add_access_control_and_metrics.sql') | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Access control and metrics schema migration failed with exit code $LASTEXITCODE"
    }
    & $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d pi_cube -v ON_ERROR_STOP=1 -f (Join-Path $projectRoot 'migrations\20260828_add_account_invitations_and_lifecycle.sql') | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Account invitation and lifecycle schema migration failed with exit code $LASTEXITCODE"
    }
    & $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d pi_cube -v ON_ERROR_STOP=1 -f (Join-Path $projectRoot 'migrations\20260828_refine_base_domain_model.sql') | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Base domain model schema migration failed with exit code $LASTEXITCODE"
    }
    & $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d pi_cube -v ON_ERROR_STOP=1 -f (Join-Path $projectRoot 'migrations\20260829_reuse_base_operator_organizations.sql') | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Base operator organization reuse migration failed with exit code $LASTEXITCODE"
    }
    & $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d pi_cube -v ON_ERROR_STOP=1 -f (Join-Path $projectRoot 'migrations\20260829_add_property_utility_payments.sql') | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Property utility payment schema migration failed with exit code $LASTEXITCODE"
    }
    & $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d pi_cube -v ON_ERROR_STOP=1 -f (Join-Path $projectRoot 'migrations\20260829_add_meter_billing_configuration.sql') | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Meter billing configuration migration failed with exit code $LASTEXITCODE"
    }
    & $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d pi_cube -v ON_ERROR_STOP=1 -f (Join-Path $projectRoot 'migrations\20260830_add_base_property_fee_policy.sql') | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Base property fee policy migration failed with exit code $LASTEXITCODE"
    }
    & $psql -h 127.0.0.1 -p $postgresPort -U pi_cube -d pi_cube -v ON_ERROR_STOP=1 -f (Join-Path $projectRoot 'migrations\20260830_add_meter_fee_applicability.sql') | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Meter fee applicability migration failed with exit code $LASTEXITCODE"
    }
  } finally {
    $env:PGPASSWORD = $previousPassword
  }
}

function Test-MinIOHealth {
  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$minioPort/minio/health/live" -TimeoutSec 2 -UseBasicParsing
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Start-MinIO([hashtable]$Values) {
  if (Test-MinIOHealth) {
    Write-Host "MinIO is already running on port $minioPort."
    return
  }
  if (-not (Test-Path -LiteralPath $minioExe)) {
    throw "MinIO binary not found: $minioExe"
  }
  New-Item -ItemType Directory -Force -Path $minioData, (Split-Path $minioLog) | Out-Null
  $previousUser = $env:MINIO_ROOT_USER
  $previousPassword = $env:MINIO_ROOT_PASSWORD
  try {
    $env:MINIO_ROOT_USER = $Values.S3_ACCESS_KEY_ID
    $env:MINIO_ROOT_PASSWORD = $Values.S3_SECRET_ACCESS_KEY
    $process = Start-Process -FilePath $minioExe `
      -ArgumentList @('server', $minioData, '--address', "127.0.0.1:$minioPort", '--console-address', "127.0.0.1:$minioConsolePort") `
      -WindowStyle Hidden `
      -RedirectStandardOutput $minioLog `
      -RedirectStandardError "$minioLog.err" `
      -PassThru
    Set-Content -LiteralPath $minioPidFile -Value $process.Id -Encoding ascii
  } finally {
    $env:MINIO_ROOT_USER = $previousUser
    $env:MINIO_ROOT_PASSWORD = $previousPassword
  }
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if (Test-MinIOHealth) {
      return
    }
    Start-Sleep -Seconds 1
  }
  throw "MinIO failed to start. Check $minioLog.err"
}

function Stop-Postgres {
  if (-not (Test-PostgresRunning)) {
    Write-Host 'PostgreSQL is already stopped.'
    return
  }
  & $pgCtl stop -D $postgresData -m fast -w
  if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL failed to stop with exit code $LASTEXITCODE"
  }
}

function Stop-MinIO {
  if (-not (Test-Path -LiteralPath $minioPidFile)) {
    Write-Host 'MinIO is already stopped.'
    return
  }
  $processId = [int](Get-Content -LiteralPath $minioPidFile -Raw).Trim()
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if ($process) {
    $expectedPath = [System.IO.Path]::GetFullPath($minioExe)
    $actualPath = [System.IO.Path]::GetFullPath($process.Path)
    if ($actualPath -ne $expectedPath) {
      throw "Refusing to stop PID $processId because it is not the managed MinIO process."
    }
    Stop-Process -Id $processId
  }
  Remove-Item -LiteralPath $minioPidFile -Force -ErrorAction SilentlyContinue
}

function Initialize-Storage {
  Push-Location $projectRoot
  try {
    & node (Join-Path $PSScriptRoot 'bootstrap-storage.mjs')
    if ($LASTEXITCODE -ne 0) {
      throw "Storage bootstrap failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

function Show-Status {
  $postgresStatus = if (Test-PostgresRunning) { 'running' } else { 'stopped' }
  $minioStatus = if (Test-MinIOHealth) { 'running' } else { 'stopped' }
  [pscustomobject]@{ Service = 'PostgreSQL'; Status = $postgresStatus; Endpoint = "127.0.0.1:$postgresPort" }
  [pscustomobject]@{ Service = 'MinIO API'; Status = $minioStatus; Endpoint = "http://127.0.0.1:$minioPort" }
  [pscustomobject]@{ Service = 'MinIO Console'; Status = $minioStatus; Endpoint = "http://127.0.0.1:$minioConsolePort" }
}

switch ($Action) {
  'setup' {
    $values = Ensure-EnvironmentFiles
    Initialize-Postgres $values
    Start-Postgres $values
    Start-MinIO $values
    Initialize-Storage
    Show-Status
  }
  'start' {
    $values = Ensure-EnvironmentFiles
    Initialize-Postgres $values
    Start-Postgres $values
    Start-MinIO $values
    Initialize-Storage
    Show-Status
  }
  'stop' {
    Stop-MinIO
    Stop-Postgres
    Show-Status
  }
  'status' {
    Show-Status
  }
}
