import {
  TrendingUp,
  Users,
  Briefcase,
  Building2,
  FileText,
  DollarSign,
  Settings,
  MessageSquare,
  MessageCircle,
  UserRound,
  LayoutDashboard,
  ClipboardList,
  Globe,
  User,
  ShieldCheck,
  Send,
  Bell,
  PlusCircle,
  Timer,
  Receipt,
  Wallet,
  Euro,
  Star,
  AlertTriangle,
  MapPin,
  Clock,
  Sliders,
  Archive,
  Activity,
  Smartphone,
  UserPlus,
  CheckCircle2,
  Download,
  Mail,
  Play
} from 'lucide-react';

export const adminNavigation = [
  { label: 'Mes Statistiques', icon: TrendingUp, path: '/admin/dashboard', exact: true },
  {
    label: 'Utilisateurs',
    icon: Users,
    children: [
      { label: 'Liste des utilisateurs', icon: Users, path: '/admin/users' },
      { label: 'Créer un utilisateur', icon: UserPlus, path: '/admin/users/new' },
    ]
  },
  {
    label: 'Gérer mes missions',
    icon: Briefcase,
    children: [
      { label: 'Liste des missions', icon: Briefcase, path: '/admin/missions' },
      { label: 'Publier une mission', icon: PlusCircle, path: '/admin/missions/publish' },
      { label: 'Missions archivées', icon: Archive, path: '/admin/missions/archived' },
      { label: 'Demandes reçues', icon: Users, path: '/admin/applications' },
      { label: 'Fréquence facturation', icon: Clock, path: '/admin/missions/billing-frequency' },
      { label: 'Lieux de mission', icon: MapPin, path: '/admin/missions/locations' },
      { label: 'Tarifs horaires', icon: Euro, path: '/admin/missions/hourly-rates' },
    ]
  },
  { label: 'Factures', icon: Receipt, path: '/admin/invoices' },
  { label: 'Mon Profil', icon: UserRound, path: '/admin/profile' },
  { label: 'Wallets & Retraits', icon: Wallet, path: '/admin/wallets' },
  { label: 'Litiges', icon: AlertTriangle, path: '/admin/disputes' },
  { label: 'Vérifications Identité', icon: ShieldCheck, path: '/admin/verifications-new' },
  { label: 'Secteurs & Compétences', icon: Sliders, path: '/admin/secteurs-competences' },
  { label: 'Avis Utilisateurs', icon: MessageCircle, path: '/admin/feedback' },
  {
    label: 'Notifications',
    icon: Bell,
    children: [
      { label: 'Mes notifications', icon: Bell, path: '/admin/notifications' },
      { label: 'Envoyer notification', icon: Send, path: '/admin/broadcast' },
      { label: 'Notifications Push', icon: Send, path: '/admin/send-notifications' },
      { label: 'Envoyer SMS', icon: Smartphone, path: '/admin/send-sms' },
    ]
  },
  {
    label: 'Paramètres',
    icon: Settings,
    children: [
      { label: 'Paramètres généraux', icon: Settings, path: '/admin/settings' },
      { label: 'Paramètres système', icon: Settings, path: '/admin/system-settings' },
      { label: 'Logs d\'activité', icon: Activity, path: '/admin/activity-logs' },
      { label: 'Statistiques PWA', icon: Smartphone, path: '/admin/pwa-stats' },
      { label: 'Installer PWA', icon: Download, path: '/admin/install-pwa' },
    ]
  },
  { label: 'Support', icon: MessageSquare, path: '/admin/support' },
  { label: 'Contact', icon: Mail, path: '/admin/contact' },
  { label: 'Devis B2B', icon: Briefcase, path: '/admin/devis' },
  { label: 'Blog', icon: Globe, path: '/admin/blog' },
  { label: 'Tutoriels', icon: Play, path: '/admin/tutoriels' },
];

export const automobNavigation = [
  { label: 'Mes Statistiques', icon: LayoutDashboard, path: '/automob/dashboard', exact: true },
  {
    label: 'Gérer mes missions',
    icon: FileText,
    children: [
      { label: 'Mes candidatures', icon: FileText, path: '/automob/my-applications' },
      { label: 'Mes missions', icon: Timer, path: '/automob/my-missions' },
      { label: 'Missions terminées', icon: CheckCircle2, path: '/automob/completed-missions' },
    ]
  },
  { label: 'Factures', icon: Euro, path: '/automob/invoices' },
  {
    label: 'Mon Profil',
    icon: UserRound,
    children: [
      { label: 'Mon compte', icon: User, path: '/automob/profile', exact: true },
      { label: 'Profil public', icon: Globe, path: '/automob/profile/public', isDynamic: true },
      { label: 'Vérifier mon identité', icon: ShieldCheck, path: '/automob/verify-identity' },
    ]
  },
  { label: 'Mon Wallet', icon: Wallet, path: '/automob/wallet' },
  { label: 'Mes Avis', icon: Star, path: '/automob/reviews' },
  { label: 'Litiges', icon: AlertTriangle, path: '/automob/disputes' },
  { label: 'Notifications', icon: Bell, path: '/automob/notifications' },
  { label: 'Support', icon: MessageSquare, path: '/automob/support' },
  { label: 'Paramètres', icon: Settings, path: '/automob/settings' },
];

export const clientNavigation = [
  { label: 'Mes Statistiques', icon: LayoutDashboard, path: '/client/dashboard', exact: true },
  {
    label: 'Gérer mes missions',
    icon: FileText,
    children: [
      { label: 'Publier une mission', icon: PlusCircle, path: '/client/publish-mission' },
      { label: 'Mes missions', icon: Briefcase, path: '/client/missions' },
      { label: 'Demandes reçues', icon: Users, path: '/client/applications' },
    ]
  },
  { label: 'Factures', icon: Euro, path: '/client/invoices' },
  {
    label: 'Mon Profil',
    icon: UserRound,
    children: [
      { label: 'Mon compte', icon: User, path: '/client/profile', exact: true },
      { label: 'Profil public', icon: Globe, path: '/client/profile/public', isDynamic: true },
      { label: 'Vérifier mon identité', icon: ShieldCheck, path: '/client/verify-identity' },
    ],
  },
  { label: 'Litiges', icon: AlertTriangle, path: '/client/disputes' },
  { label: 'Notifications', icon: Bell, path: '/client/notifications' },
  { label: 'Support', icon: MessageSquare, path: '/client/support' },
  { label: 'Paramètres', icon: Settings, path: '/client/settings' },
];
