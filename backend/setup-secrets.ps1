# PowerShell Setup Script for Docker Secrets (Windows)
# Requires PowerShell 5.0 or higher

param(
    [switch]$Force = $false
)

# Check PowerShell version
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Error "PowerShell 5.0 or higher required. Current version: $($PSVersionTable.PSVersion)"
    exit 1
}

Write-Host "Setting up Docker Secrets for Issue Tracker Backend..." -ForegroundColor Cyan

# Create secrets directory
if (-not (Test-Path "secrets")) {
    New-Item -ItemType Directory -Name "secrets" | Out-Null
}

Write-Host "Generating secure credentials..." -ForegroundColor Yellow

# Function to generate secure passwords
function New-SecurePassword {
    param(
        [int]$Length = 32
    )
    
    # Use cryptographically secure random generation
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    
    return [Convert]::ToBase64String($bytes)
}

# Generate database password
$dbPasswordFile = "secrets/db_password.txt"
if ((-not (Test-Path $dbPasswordFile)) -or $Force) {
    Write-Host "Generating database password..." -ForegroundColor Green
    $dbPassword = New-SecurePassword -Length 32
    $dbPassword | Out-File -FilePath $dbPasswordFile -Encoding UTF8 -NoNewline
    Write-Host "Database password generated" -ForegroundColor Green
}
else {
    Write-Host "Database password already exists" -ForegroundColor Blue
}

# Generate JWT secret
$jwtSecretFile = "secrets/jwt_secret.txt"
if ((-not (Test-Path $jwtSecretFile)) -or $Force) {
    Write-Host "Generating JWT secret..." -ForegroundColor Green
    $jwtSecret = New-SecurePassword -Length 64
    $jwtSecret | Out-File -FilePath $jwtSecretFile -Encoding UTF8 -NoNewline
    Write-Host "JWT secret generated" -ForegroundColor Green
}
else {
    Write-Host "JWT secret already exists" -ForegroundColor Blue
}

# Create .env file
$envFile = ".env"
if ((-not (Test-Path $envFile)) -or $Force) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    # Read passwords
    $dbPassword = Get-Content $dbPasswordFile -Raw
    $jwtSecret = Get-Content $jwtSecretFile -Raw
    
    # Create .env content
    $envContent = @"
# Backend Configuration
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# Database Configuration
POSTGRES_PASSWORD=$dbPassword
DATABASE_URL="postgresql://issuetracker:$dbPassword@localhost:5432/issuetracker_db"

# Authentication
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=7d

# Password Hashing
BCRYPT_ROUNDS=12

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host ".env file created" -ForegroundColor Green
}
else {
    Write-Host ".env file already exists" -ForegroundColor Blue
}

# Set permissions (Windows ACL)
Write-Host "Setting security permissions..." -ForegroundColor Yellow

try {
    # Make readable only for current user
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    
    # Secrets files
    Get-ChildItem "secrets/*.txt" | ForEach-Object {
        $acl = Get-Acl $_.FullName
        $acl.SetAccessRuleProtection($true, $false)
        $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule($currentUser, "FullControl", "Allow")
        $acl.SetAccessRule($accessRule)
        Set-Acl $_.FullName $acl
    }
    
    # .env file
    if (Test-Path $envFile) {
        $acl = Get-Acl $envFile
        $acl.SetAccessRuleProtection($true, $false)
        $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule($currentUser, "FullControl", "Allow")
        $acl.SetAccessRule($accessRule)
        Set-Acl $envFile $acl
    }
    
    Write-Host "Permissions set" -ForegroundColor Green
}
catch {
    Write-Warning "Could not set permissions: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start services: npm run docker:run"
Write-Host "2. Run Prisma migrations: npm run prisma:migrate"
Write-Host "3. Open GraphiQL: http://localhost:4000/graphiql"
Write-Host "4. Database management: http://localhost:8080"
Write-Host ""
Write-Host "Important:" -ForegroundColor Red
Write-Host "- Secrets are stored in ./secrets/"
Write-Host "- .env file contains all environment variables"
Write-Host "- Add secrets/ and .env to .gitignore!"
Write-Host ""

# Check .gitignore
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    
    if ($gitignoreContent -notmatch "secrets/") {
        Write-Warning "Warning: Add 'secrets/' to .gitignore!"
    }
    
    if ($gitignoreContent -notmatch "\.env") {
        Write-Warning "Warning: Add '.env' to .gitignore!"
    }
}
else {
    Write-Warning "No .gitignore found. Create one and add secrets/ and .env!"
}

Write-Host ""
Write-Host 'Parameters:' -ForegroundColor Blue
Write-Host '  -Force    : Overwrites existing files'
Write-Host ""
Write-Host 'Example: .\setup-secrets.ps1 -Force' -ForegroundColor Blue 