import { useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';

export const MissionDetail = () => {
  const { id } = useParams();
  useDocumentTitle(`Mission #${id} - Admin`);
  
  // Ici vous devriez implémenter la récupération des détails de la mission
  // et la gestion des états comme dans les autres composants
  
  return (
    <DashboardLayout
      title={`Mission #${id}`}
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
    >
      <Card>
        <CardHeader>
          <CardTitle>Détails de la mission</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Implémentez l'affichage des détails de la mission ici */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Informations générales</h3>
              <p>Titre: {mission.title}</p>
              <p>Description: {mission.description}</p>
              <p>Statut: <Badge>{mission.status}</Badge></p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Localisation</h3>
              <p>Adresse: {mission.address}</p>
              <p>Ville: {mission.city} ({mission.postal_code})</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Dates et horaires</h3>
              <p>Du {formatDate(mission.start_date)} à {formatTime(mission.start_time)}</p>
              <p>Au {formatDate(mission.end_date)} à {formatTime(mission.end_time)}</p>
              <p>Période: {mission.work_time === 'jour' ? 'Jour' : 'Nuit'}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Informations financières</h3>
              <p>Tarif horaire: {mission.hourly_rate} €/h</p>
              <p>Nombre d'Auto-Mobs: {mission.nb_automobs}</p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline">Modifier</Button>
              <Button variant="destructive">Supprimer</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default MissionDetail;
