<#
.SYNOPSIS
Backs up the local SmartCareerAI database from Docker.

.DESCRIPTION
This script extracts the database dump from the running PostgreSQL container
and saves it to the 'backups' directory with a timestamp.

.EXAMPLE
.\backup_db.ps1
#>

$ErrorActionPreference = "Stop"

# Configuration
$ContainerName = "smartcareer-postgres"
# Defaults corresponding to docker-compose.yml
$DbUser = "smartcareer" 
$DbName = "smartcareer_db"

$BackupDir = Join-Path $PSScriptRoot "backups"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupFile = Join-Path $BackupDir "smartcareer_backup_$Timestamp.sql"
$TempRemotePath = "/tmp/backup_$Timestamp.sql"

# 1. Create backup directory
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    Write-Host "Created backups directory: $BackupDir" -ForegroundColor Gray
}

# 2. Check if container is running
$ContainerStatus = docker ps -q -f name=$ContainerName
if (-not $ContainerStatus) {
    Write-Error "Container '$ContainerName' is not running. Please run 'docker-compose up -d postgres' first."
}

# 3. Generate Dump inside the container (avoids PowerShell encoding issues with pipes)
Write-Host "Generating database dump for '$DbName'..." -ForegroundColor Cyan
try {
    # Using 'docker exec' to run pg_dump inside the container
    docker exec $ContainerName pg_dump -U $DbUser -d $DbName -f $TempRemotePath
    
    # 4. Copy dump to host
    Write-Host "Copying dump to host..." -ForegroundColor Cyan
    docker cp "$($ContainerName):$TempRemotePath" $BackupFile
    
    # 5. Cleanup temp file in container
    docker exec $ContainerName rm $TempRemotePath
    
    Write-Host "--------------------------------------------------"
    Write-Host "Backup Success!" -ForegroundColor Green
    Write-Host "Location: $BackupFile"
    Write-Host "--------------------------------------------------"
}
catch {
    Write-Error "Backup failed: $_"
}
