#!/bin/bash

echo "🔄 Migration des tables de paramètres de mission..."

mysql -u root -p'root' nettmobfrance < database/migrations/add_mission_settings_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration réussie!"
    
    echo ""
    echo "📊 Vérification des tables créées..."
    mysql -u root -p'root' nettmobfrance -e "SHOW TABLES LIKE '%billing%'; SHOW TABLES LIKE '%location%'; SHOW TABLES LIKE '%hourly%';"
    
    echo ""
    echo "📋 Vérification des données..."
    mysql -u root -p'root' nettmobfrance -e "SELECT COUNT(*) as billing_frequencies FROM billing_frequencies; SELECT COUNT(*) as location_types FROM location_types; SELECT COUNT(*) as hourly_rates FROM hourly_rates;"
else
    echo "❌ Erreur lors de la migration"
    exit 1
fi
