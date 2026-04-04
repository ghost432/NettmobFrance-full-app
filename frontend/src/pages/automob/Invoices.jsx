import { useState, useEffect, useMemo } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePageTitle } from '@/hooks/usePageTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Download, Calendar, Euro, Clock, 
  Building2, CheckCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

const Invoices = () => {
  useDocumentTitle('Factures');
  usePageTitle('Mes Factures');
  
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
    fetchProfile();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices/automob/my-invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      toast.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/automob/profile');
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      en_attente: { label: 'En attente', className: 'bg-orange-600' },
      payee: { label: 'Payée', className: 'bg-green-600' },
      annulee: { label: 'Annulée', className: 'bg-red-600' }
    };

    const config = statusConfig[status] || statusConfig.en_attente;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      // Ouvrir le HTML dans une nouvelle fenêtre pour impression/PDF
      const response = await api.get(`/invoices/automob/${invoiceId}/html`);
      const htmlContent = response.data;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Attendre que le contenu soit chargé puis déclencher l'impression
      printWindow.onload = () => {
        printWindow.print();
      };
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const displayName = useMemo(() => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || 'Automob';
  }, [profile, user]);

  if (loading) {
    return (
      <DashboardLayout
        title="Mes Factures"
        description="Gérez vos factures"
        menuItems={automobNavigation}
        getRoleLabel={() => 'Automob'}
        getDisplayName={() => displayName}
      >
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Mes Factures"
      description="Consultez et téléchargez vos factures"
      menuItems={automobNavigation}
      getRoleLabel={() => 'Automob'}
      getDisplayName={() => displayName}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Factures payées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {invoices.filter(inv => inv.status === 'payee').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Total à recevoir</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {invoices
                  .filter(inv => inv.status === 'en_attente')
                  .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)
                  .toFixed(2)}€
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des factures</CardTitle>
            <CardDescription>
              Toutes vos factures pour les missions effectuées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Aucune facture</p>
                <p className="text-sm text-muted-foreground">
                  Vos factures apparaîtront ici une fois générées
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              {invoice.invoice_number}
                            </h3>
                            {getStatusBadge(invoice.status)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Client:</span>
                              <a 
                                href={`/public/client/${encodeURIComponent((invoice.client_company || 'entreprise').toLowerCase().replace(/\s+/g, '-'))}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {invoice.client_company}
                              </a>
                            </div>

                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Mission:</span>
                              <span className="font-medium">{invoice.mission_name || invoice.mission_title}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Période:</span>
                              <span>
                                {invoice.period_start && invoice.period_end 
                                  ? `${new Date(invoice.period_start).toLocaleDateString('fr-FR')} - ${new Date(invoice.period_end).toLocaleDateString('fr-FR')}`
                                  : new Date(invoice.generated_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Heures:</span>
                              <span className="font-medium">{invoice.total_hours ? parseFloat(invoice.total_hours).toFixed(2) : '0.00'}h</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <Euro className="h-5 w-5 text-green-600" />
                            <span className="text-2xl font-bold text-green-600">
                              {invoice.amount ? parseFloat(invoice.amount).toFixed(2) : '0.00'}€
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleDownloadPDF(invoice.id)}
                            className="w-full md:w-auto"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger PDF
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
