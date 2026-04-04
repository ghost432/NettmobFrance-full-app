#!/bin/bash

# Script pour exécuter toutes les migrations SQL
# Usage: ./run_all_migrations.sh

echo "🔄 Exécution des migrations SQL..."

# Charger les variables d'environnement
if [ -f ../.env ]; then
  export $(cat ../.env | grep -v '^#' | xargs)
fi

# Configuration par défaut
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-root}
DB_NAME=${DB_NAME:-automob_db}

echo "📊 Base de données: $DB_NAME"
echo "🖥️  Host: $DB_HOST:$DB_PORT"
echo "👤 User: $DB_USER"
echo ""

# Fonction pour exécuter un fichier SQL
run_migration() {
  local file=$1
  echo "⏳ Exécution de: $file"
  
  mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$file"
  
  if [ $? -eq 0 ]; then
    echo "✅ $file exécuté avec succès"
  else
    echo "❌ Erreur lors de l'exécution de $file"
    return 1
  fi
  echo ""
}

# Liste des migrations à exécuter dans l'ordre
migrations=(
  "verify_all_tables.sql"
  "create_mission_applications_table.sql"
)

# Exécuter les migrations
for migration in "${migrations[@]}"; do
  if [ -f "$migration" ]; then
    run_migration "$migration"
  else
    echo "⚠️  Fichier non trouvé: $migration"
  fi
done

echo "✅ Toutes les migrations ont été exécutées !"
echo ""
echo "🔍 Vérification des tables créées..."

# Vérifier les tables
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
  SELECT 
    TABLE_NAME as 'Table',
    TABLE_ROWS as 'Lignes',
    ROUND(DATA_LENGTH/1024/1024, 2) as 'Taille (MB)'
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = '$DB_NAME'
  AND TABLE_NAME IN ('missions', 'mission_applications', 'mission_competences', 'identity_verifications_new')
  ORDER BY TABLE_NAME;
"

echo ""
echo "✨ Migrations terminées avec succès !"
