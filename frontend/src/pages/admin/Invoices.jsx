import { useState, useEffect, useMemo } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePageTitle } from '@/hooks/usePageTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
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
  FileText, Download, Calendar, Euro, TrendingUp,
  Users, Building2, BarChart3, CheckCircle
} from 'lucide-react';
import { exportToCSV } from '@/utils/exportCSV';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';

const AdminInvoices = () => {
  useDocumentTitle('Factures');
  usePageTitle('Gestion Factures');

  const { user } = useAuth();
  const [allInvoices, setAllInvoices] = useState([]);
  const [summaryInvoices, setSummaryInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const [allRes, summaryRes] = await Promise.all([
        api.get('/invoices/admin/all'),
        api.get('/invoices/admin/summaries')
      ]);
      setAllInvoices(allRes.data);
      setSummaryInvoices(summaryRes.data);
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
      en_attente: { label: 'En attente', className: 'bg-orange-600' },
      issued: { label: 'Émise', className: 'bg-blue-600' },
      payee: { label: 'Payée', className: 'bg-green-600' },
      paid: { label: 'Payée', className: 'bg-green-600' },
      cancelled: { label: 'Annulée', className: 'bg-red-600' },
      annulee: { label: 'Annulée', className: 'bg-red-600' }
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await api.put(`/invoices/${invoiceId}/status`, { status: newStatus });
      toast.success(`Statut mis à jour: ${newStatus === 'payee' ? 'Payée' : newStatus}`);
      fetchInvoices(); // Recharger les factures
    } catch (error) {
      console.error('Erreur changement statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      automob: { label: 'Automob', className: 'bg-blue-500' },
      client: { label: 'Client', className: 'bg-purple-500' },
      admin_summary: { label: 'Récapitulatif', className: 'bg-indigo-600' }
    };

    const config = typeConfig[type] || typeConfig.automob;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      let url = '';
      if (invoice.invoice_type === 'admin_summary') {
        url = `/invoices/admin/summary/${invoice.id}/html`;
      } else if (invoice.invoice_type === 'client') {
        url = `/invoices/client/${invoice.id}/html`;
      } else {
        url = `/invoices/automob/${invoice.id}/html`;
      }

      const response = await api.get(url);
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

  const displayName = user?.profile?.first_name 
    ? `${user.profile.first_name} ${user.profile.last_name}` 
    : (user?.email?.split('@')[0] || 'Administrateur');

  const clientInvoices = useMemo(() => allInvoices.filter(inv => inv.invoice_type === 'client'), [allInvoices]);
  const automobInvoices = useMemo(() => allInvoices.filter(inv => inv.invoice_type === 'automob'), [allInvoices]);

  const { currentItems: paginatedAll, currentPage: pageAll, totalPages: totalPagesAll, totalItems: totalAll, setCurrentPage: setPageAll } = usePagination(allInvoices, 10);
  const { currentItems: paginatedSummary, currentPage: pageSummary, totalPages: totalPagesSummary, totalItems: totalSummary, setCurrentPage: setPageSummary } = usePagination(summaryInvoices, 10);
  const { currentItems: paginatedClients, currentPage: pageClients, totalPages: totalPagesClients, totalItems: totalClients, setCurrentPage: setPageClients } = usePagination(clientInvoices, 10);
  const { currentItems: paginatedAutomobs, currentPage: pageAutomobs, totalPages: totalPagesAutomobs, totalItems: totalAutomobs, setCurrentPage: setPageAutomobs } = usePagination(automobInvoices, 10);

  // Calculs statistiques
  // Total commission NettmobFrance (20% sur toutes les prestations)
  const totalCommission = allInvoices
    .reduce((sum, inv) => sum + parseFloat(inv.commission_amount || 0), 0);

  // Total facturé aux clients (prestations + commission)
  const totalRevenue = allInvoices
    .reduce((sum, inv) => {
      const amount = parseFloat(inv.amount || 0);
      const commission = parseFloat(inv.commission_amount || 0);
      return sum + amount + commission;
    }, 0);

  // Total à payer aux automobs (prestations uniquement)
  const totalPayouts = allInvoices
    .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

  if (loading) {
    return (
      <DashboardLayout
        title="Gestion Factures"
        description="Vue d'ensemble des factures"
        menuItems={adminNavigation}
        getRoleLabel={() => 'Admin'}
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
      title="Gestion Factures"
      description="Vue d'ensemble et gestion des factures"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Admin'}
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
              <div className="text-2xl font-bold">{allInvoices.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summaryInvoices.length} récapitulatives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Commission NMF</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold text-green-600">
                {totalCommission.toFixed(2)}€
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                20% des prestations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Revenus Clients</CardTitle>
              <Euro className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold text-blue-600">
                {totalRevenue.toFixed(2)}€
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total facturé
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Paiements Automobs</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold text-purple-600">
                {totalPayouts.toFixed(2)}€
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                À verser
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Toutes les factures</TabsTrigger>
            <TabsTrigger value="summaries">Récapitulatifs</TabsTrigger>
            <TabsTrigger value="clients">Factures Clients</TabsTrigger>
            <TabsTrigger value="automobs">Factures Automobs</TabsTrigger>
          </TabsList>

          {/* All Invoices */}
          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Toutes les factures</CardTitle>
                  <CardDescription>
                    Vue d'ensemble de toutes les factures du système
                  </CardDescription>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                  onClick={() => exportToCSV(
                    allInvoices.map(inv => ({
                      numero: inv.invoice_number || inv.id,
                      type: inv.invoice_type,
                      utilisateur: inv.user_name || inv.user_email || '',
                      montant: inv.total_amount || inv.amount || '',
                      statut: inv.status,
                      date: inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : ''
                    })),
                    'factures',
                    { numero: 'N° Facture', type: 'Type', utilisateur: 'Utilisateur', montant: 'Montant (€)', statut: 'Statut', date: 'Date' }
                  )}
                >
                  <Download className="h-4 w-4" />
                  Exporter CSV
                </button>
              </CardHeader>
              <CardContent>
                {allInvoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Aucune facture</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedAll.map((invoice) => (
                      <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold text-lg">
                                  {invoice.invoice_number}
                                </h3>
                                {getTypeBadge(invoice.invoice_type)}
                                {getStatusBadge(invoice.status)}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Client:</span>
                                  <span className="font-medium">{invoice.client_company}</span>
                                </div>

                                {invoice.automob_first_name && (
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Automob:</span>
                                    <span className="font-medium">
                                      {invoice.automob_first_name} {invoice.automob_last_name}
                                    </span>
                                  </div>
                                )}

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
                              </div>

                              <div className="flex items-center gap-4 pt-2">
                                <div>
                                  <span className="text-sm text-muted-foreground">Prestations: </span>
                                  <span className="text-lg font-bold">
                                    {parseFloat(invoice.amount || 0).toFixed(2)}€
                                  </span>
                                </div>
                                {invoice.commission_amount > 0 && (
                                  <div>
                                    <span className="text-sm text-muted-foreground">Commission (20%): </span>
                                    <span className="text-lg font-bold text-green-600">
                                      {parseFloat(invoice.commission_amount || 0).toFixed(2)}€
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-sm text-muted-foreground">Total: </span>
                                  <span className="text-lg font-bold text-blue-600">
                                    {(parseFloat(invoice.amount || 0) + parseFloat(invoice.commission_amount || 0)).toFixed(2)}€
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => handleDownloadPDF(invoice)}
                                className="w-full md:w-auto"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                              </Button>
                              {(invoice.status === 'en_attente' || invoice.status === 'issued') && (
                                <Button
                                  onClick={() => handleStatusChange(invoice.id, 'payee')}
                                  className="w-full md:w-auto bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marquer payée
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Pagination currentPage={pageAll} totalPages={totalPagesAll} onPageChange={setPageAll} itemsPerPage={10} totalItems={totalAll} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary Invoices */}
          <TabsContent value="summaries" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Factures récapitulatives</CardTitle>
                <CardDescription>
                  Récapitulatifs par mission avec tous les automobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summaryInvoices.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Aucun récapitulatif</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedSummary.map((invoice) => (
                      <Card key={invoice.id} className="hover:shadow-md transition-shadow border-indigo-200">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg text-indigo-700">
                                  {invoice.invoice_number}
                                </h3>
                                {getStatusBadge(invoice.status)}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Client:</span>
                                  <span className="font-medium">{invoice.client_company}</span>
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
                              </div>

                              <div className="pt-2 space-y-1 bg-indigo-50 p-3 rounded-lg">
                                <div className="flex justify-between text-sm">
                                  <span>Paiements automobs:</span>
                                  <span className="font-semibold">{parseFloat(invoice.amount || 0).toFixed(2)}€</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-green-700">Commission NettmobFrance (20%):</span>
                                  <span className="font-semibold text-green-700">
                                    {parseFloat(invoice.commission_amount || 0).toFixed(2)}€
                                  </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-indigo-200">
                                  <span className="font-bold">Total facturé au client:</span>
                                  <span className="text-xl font-bold text-indigo-700">
                                    {(parseFloat(invoice.amount || 0) + parseFloat(invoice.commission_amount || 0)).toFixed(2)}€
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => handleDownloadPDF(invoice)}
                                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                PDF Récapitulatif
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Pagination currentPage={pageSummary} totalPages={totalPagesSummary} onPageChange={setPageSummary} itemsPerPage={10} totalItems={totalSummary} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Invoices */}
          <TabsContent value="clients" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Factures Clients</CardTitle>
                <CardDescription>
                  Factures émises aux clients (avec commission)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paginatedClients.map((invoice) => (
                      <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">{invoice.invoice_number}</h3>
                                {getStatusBadge(invoice.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {invoice.client_company} - {invoice.mission_name}
                              </p>
                              <div className="text-sm space-y-1">
                                <div>
                                  Prestations: <span className="font-medium">
                                    {parseFloat(invoice.amount || 0).toFixed(2)}€
                                  </span>
                                </div>
                                <div>
                                  Commission NettmobFrance (20%): <span className="font-bold text-green-600">
                                    {parseFloat(invoice.commission_amount || 0).toFixed(2)}€
                                  </span>
                                </div>
                                <div className="pt-1 border-t">
                                  Total: <span className="font-bold text-blue-600">
                                    {(parseFloat(invoice.amount || 0) + parseFloat(invoice.commission_amount || 0)).toFixed(2)}€
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button onClick={() => handleDownloadPDF(invoice)} size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              PDF
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  <Pagination currentPage={pageClients} totalPages={totalPagesClients} onPageChange={setPageClients} itemsPerPage={10} totalItems={totalClients} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automob Invoices */}
          <TabsContent value="automobs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Factures Automobs</CardTitle>
                <CardDescription>
                  Factures à payer aux automobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paginatedAutomobs.map((invoice) => (
                      <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">{invoice.invoice_number}</h3>
                                {getStatusBadge(invoice.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {invoice.automob_first_name} {invoice.automob_last_name} - {invoice.mission_name}
                              </p>
                              <div className="text-sm space-y-1">
                                <div>
                                  Heures: <span className="font-medium">
                                    {parseFloat(invoice.total_hours || 0).toFixed(2)}h
                                  </span>
                                </div>
                                <div>
                                  À payer: <span className="font-bold text-blue-600">
                                    {parseFloat(invoice.amount || 0).toFixed(2)}€
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  (Commission NMF: {parseFloat(invoice.commission_amount || 0).toFixed(2)}€ déjà prélevée)
                                </div>
                              </div>
                            </div>
                            <Button onClick={() => handleDownloadPDF(invoice)} size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              PDF
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  <Pagination currentPage={pageAutomobs} totalPages={totalPagesAutomobs} onPageChange={setPageAutomobs} itemsPerPage={10} totalItems={totalAutomobs} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminInvoices;
