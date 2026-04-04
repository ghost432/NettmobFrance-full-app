/**
 * Génère des données de graphique pour les missions par semaine
 */
export const generateWeeklyMissionsData = (missions) => {
  const weeks = [];
  const now = new Date();
  
  // Générer les 12 dernières semaines
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekMissions = missions.filter(m => {
      const completedDate = new Date(m.completed_at || m.end_date);
      return completedDate >= weekStart && completedDate <= weekEnd;
    });
    
    weeks.push({
      period: `S${52 - i}`,
      missions: weekMissions.length,
      fullDate: weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    });
  }
  
  return weeks;
};

/**
 * Génère des données de graphique pour les missions par mois
 */
export const generateMonthlyMissionsData = (missions) => {
  const months = [];
  const now = new Date();
  
  // Générer les 12 derniers mois
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    const monthMissions = missions.filter(m => {
      const completedDate = new Date(m.completed_at || m.end_date);
      return completedDate.getMonth() === monthDate.getMonth() && 
             completedDate.getFullYear() === monthDate.getFullYear();
    });
    
    months.push({
      period: monthDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      missions: monthMissions.length
    });
  }
  
  return months;
};

/**
 * Génère des données de graphique pour les revenus par semaine
 */
export const generateWeeklyRevenueData = (missions) => {
  const weeks = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekMissions = missions.filter(m => {
      const completedDate = new Date(m.completed_at || m.end_date);
      return completedDate >= weekStart && completedDate <= weekEnd;
    });
    
    const totalRevenue = weekMissions.reduce((sum, m) => {
      return sum + (parseFloat(m.price || m.amount || 0));
    }, 0);
    
    weeks.push({
      period: `S${52 - i}`,
      revenue: totalRevenue,
      fullDate: weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    });
  }
  
  return weeks;
};

/**
 * Génère des données de graphique pour les revenus par mois
 */
export const generateMonthlyRevenueData = (missions) => {
  const months = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    const monthMissions = missions.filter(m => {
      const completedDate = new Date(m.completed_at || m.end_date);
      return completedDate.getMonth() === monthDate.getMonth() && 
             completedDate.getFullYear() === monthDate.getFullYear();
    });
    
    const totalRevenue = monthMissions.reduce((sum, m) => {
      return sum + (parseFloat(m.price || m.amount || 0));
    }, 0);
    
    months.push({
      period: monthDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      revenue: totalRevenue
    });
  }
  
  return months;
};

/**
 * Génère des données de graphique pour les vues de profil par semaine
 * Note: Cette fonction génère des données simulées car les vues ne sont pas trackées par date
 */
export const generateWeeklyProfileViewsData = (totalViews) => {
  const weeks = [];
  const now = new Date();
  
  // Simuler une distribution des vues sur les 12 dernières semaines
  const avgViewsPerWeek = totalViews / 12;
  
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7));
    
    // Ajouter une variation aléatoire de ±30%
    const variation = 0.7 + Math.random() * 0.6;
    const views = Math.round(avgViewsPerWeek * variation);
    
    weeks.push({
      period: `S${52 - i}`,
      views: views,
      fullDate: weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    });
  }
  
  return weeks;
};

/**
 * Génère des données de graphique pour les vues de profil par mois
 */
export const generateMonthlyProfileViewsData = (totalViews) => {
  const months = [];
  const now = new Date();
  
  const avgViewsPerMonth = totalViews / 12;
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    // Ajouter une variation aléatoire de ±30%
    const variation = 0.7 + Math.random() * 0.6;
    const views = Math.round(avgViewsPerMonth * variation);
    
    months.push({
      period: monthDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      views: views
    });
  }
  
  return months;
};

/**
 * Calcule la note moyenne à partir des avis
 */
export const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  
  const sum = reviews.reduce((total, review) => {
    return total + (parseFloat(review.rating) || 0);
  }, 0);
  
  return sum / reviews.length;
};

/**
 * Génère des données de graphique pour les missions publiées par semaine (CLIENT)
 */
export const generateWeeklyPublishedMissionsData = (missions) => {
  const weeks = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekMissions = missions.filter(m => {
      const createdDate = new Date(m.created_at);
      return createdDate >= weekStart && createdDate <= weekEnd;
    });
    
    weeks.push({
      period: `S${52 - i}`,
      missions: weekMissions.length,
      fullDate: weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    });
  }
  
  return weeks;
};

/**
 * Génère des données de graphique pour les missions publiées par mois (CLIENT)
 */
export const generateMonthlyPublishedMissionsData = (missions) => {
  const months = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    const monthMissions = missions.filter(m => {
      const createdDate = new Date(m.created_at);
      return createdDate.getMonth() === monthDate.getMonth() && 
             createdDate.getFullYear() === monthDate.getFullYear();
    });
    
    months.push({
      period: monthDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      missions: monthMissions.length
    });
  }
  
  return months;
};

/**
 * Génère des données de graphique pour les dépenses par semaine (CLIENT)
 */
export const generateWeeklyExpensesData = (missions) => {
  const weeks = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekMissions = missions.filter(m => {
      const completedDate = new Date(m.completed_at || m.end_date);
      return completedDate >= weekStart && completedDate <= weekEnd && 
             (m.status === 'completed' || m.status === 'termine');
    });
    
    const totalExpenses = weekMissions.reduce((sum, m) => {
      return sum + (parseFloat(m.price || m.amount || 0));
    }, 0);
    
    weeks.push({
      period: `S${52 - i}`,
      expenses: totalExpenses,
      fullDate: weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    });
  }
  
  return weeks;
};

/**
 * Génère des données de graphique pour les dépenses par mois (CLIENT)
 */
export const generateMonthlyExpensesData = (missions) => {
  const months = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    const monthMissions = missions.filter(m => {
      const completedDate = new Date(m.completed_at || m.end_date);
      return completedDate.getMonth() === monthDate.getMonth() && 
             completedDate.getFullYear() === monthDate.getFullYear() &&
             (m.status === 'completed' || m.status === 'termine');
    });
    
    const totalExpenses = monthMissions.reduce((sum, m) => {
      return sum + (parseFloat(m.price || m.amount || 0));
    }, 0);
    
    months.push({
      period: monthDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      expenses: totalExpenses
    });
  }
  
  return months;
};

/**
 * Génère des données de graphique pour les candidatures reçues par semaine (CLIENT)
 */
export const generateWeeklyApplicationsData = (applications) => {
  const weeks = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekApplications = applications.filter(a => {
      const appliedDate = new Date(a.applied_at || a.created_at);
      return appliedDate >= weekStart && appliedDate <= weekEnd;
    });
    
    weeks.push({
      period: `S${52 - i}`,
      applications: weekApplications.length,
      fullDate: weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    });
  }
  
  return weeks;
};

/**
 * Génère des données de graphique pour les candidatures reçues par mois (CLIENT)
 */
export const generateMonthlyApplicationsData = (applications) => {
  const months = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    const monthApplications = applications.filter(a => {
      const appliedDate = new Date(a.applied_at || a.created_at);
      return appliedDate.getMonth() === monthDate.getMonth() && 
             appliedDate.getFullYear() === monthDate.getFullYear();
    });
    
    months.push({
      period: monthDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      applications: monthApplications.length
    });
  }
  
  return months;
};
