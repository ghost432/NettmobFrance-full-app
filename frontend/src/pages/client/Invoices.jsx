import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  FileText, Download, Calendar, Euro, Clock,
  User, AlertCircle, CheckCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

const ClientInvoices = () => {
  useDocumentTitle('Factures');
  usePageTitle('Mes Factures');

  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices/client/my-invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      toast.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Brouillon', className: 'bg-gray-500' },
      en_attente: { label: 'À payer', className: 'bg-orange-600' },
      issued: { label: 'À payer', className: 'bg-orange-600' },
      payee: { label: 'Payée', className: 'bg-green-600' },
      paid: { label: 'Payée', className: 'bg-green-600' },
      annulee: { label: 'Annulée', className: 'bg-red-600' },
      cancelled: { label: 'Annulée', className: 'bg-red-600' }
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/client/${invoiceId}/html`);
      const htmlContent = response.data;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.print();
      };
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const displayName = user?.profile?.company_name || user?.email?.split('@')[0] || 'Client';

  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return inv.status === 'issued' || inv.status === 'en_attente';
    if (activeTab === 'paid') return inv.status === 'paid' || inv.status === 'payee';
    return true;
  });

  // Calculer total_amount = amount + commission pour chaque facture
  const calculateTotalAmount = (invoice) => {
    const amount = parseFloat(invoice.amount || 0);
    const commission = parseFloat(invoice.commission_amount || 0);
    return amount + commission;
  };

  const totalToPay = invoices
    .filter(inv => inv.status === 'issued' || inv.status === 'en_attente')
    .reduce((sum, inv) => sum + calculateTotalAmount(inv), 0);

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid' || inv.status === 'payee')
    .reduce((sum, inv) => sum + calculateTotalAmount(inv), 0);

  if (loading) {
    return (
      <DashboardLayout
        title="Mes Factures"
        description="Gérez vos factures"
        menuItems={clientNavigation}
        getRoleLabel={() => 'Client'}
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
      menuItems={clientNavigation}
      getRoleLabel={() => 'Client'}
      getDisplayName={() => displayName}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
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
              <CardTitle className="text-sm font-medium">À payer</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {invoices.filter(inv => inv.status === 'issued' || inv.status === 'en_attente').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalToPay.toFixed(2)}€
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Payées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {invoices.filter(inv => inv.status === 'paid' || inv.status === 'payee').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalPaid.toFixed(2)}€
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Commission NMF</CardTitle>
              <Euro className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {invoices
                  .reduce((sum, inv) => sum + parseFloat(inv.commission_amount || 0), 0)
                  .toFixed(2)}€
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">À payer</TabsTrigger>
            <TabsTrigger value="paid">Payées</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Liste des factures</CardTitle>
                <CardDescription>
                  Factures incluant la commission NettmobFrance de 20%
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredInvoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Aucune facture</p>
                    <p className="text-sm text-muted-foreground">
                      Vos factures apparaîtront ici
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredInvoices.map((invoice) => {
                      // Générer numéro de facture
                      const invoiceNumber = `CLI-${String(invoice.id).padStart(6, '0')}`;
                      // Calculer montants
                      const amount = parseFloat(invoice.amount || 0);
                      const commission = parseFloat(invoice.commission_amount || 0);
                      const totalAmount = amount + commission;

                      return (
                        <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-lg">
                                    {invoiceNumber}
                                  </h3>
                                  {getStatusBadge(invoice.status)}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Automob:</span>
                                    <a
                                      href={`/public/automob/${encodeURIComponent(`${invoice.automob_first_name}-${invoice.automob_last_name}`.toLowerCase())}`}
                                      className="font-medium text-primary hover:underline"
                                    >
                                      {invoice.automob_first_name} {invoice.automob_last_name}
                                    </a>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Mission:</span>
                                    <span className="font-medium">{invoice.mission_name || invoice.mission_title}</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Date:</span>
                                    <span>
                                      {invoice.generated_at
                                        ? new Date(invoice.generated_at).toLocaleDateString('fr-FR')
                                        : 'N/A'
                                      }
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Heures:</span>
                                    <span className="font-medium">
                                      {invoice.total_hours ? parseFloat(invoice.total_hours).toFixed(2) : '0.00'}h
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-2 space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Prestations:</span>
                                    <span className="font-medium">{amount.toFixed(2)}€</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Commission (20%):</span>
                                    <span className="font-medium text-yellow-600">
                                      {commission.toFixed(2)}€
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t">
                                    <span className="font-semibold">Total à payer:</span>
                                    <span className="text-2xl font-bold text-orange-600">
                                      {totalAmount.toFixed(2)}€
                                    </span>
                                  </div>
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
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ClientInvoices;
