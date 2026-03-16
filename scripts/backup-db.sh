#!/bin/bash

# Configuration
DB_CONTAINER="placenxt-postgres"
DB_USER="placenxt"
DB_NAME="placenxt_db"
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${DATE}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup for ${DB_NAME}..."

# Execute pg_dump inside the docker container
# We pipe it to gzip to compress the backup
docker exec -t $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME -F p | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully!"
    echo "Backup saved to: $BACKUP_FILE"
    
    # Delete backups older than 7 days
    find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;
    echo "Cleaned up backups older than 7 days."
else
    echo "Backup failed!"
    # Remove the partial/failed backup file if it exists
    if [ -f "$BACKUP_FILE" ]; then
        rm "$BACKUP_FILE"
    fi
    exit 1
fi
