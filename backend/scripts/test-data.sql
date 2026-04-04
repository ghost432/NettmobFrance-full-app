-- Script pour ajouter des données de test pour le système d'avis et le dashboard

-- Données de test pour les avis (si vous avez des utilisateurs existants)
-- Remplacez les user_id par des IDs réels de votre base

-- Exemple d'avis de test (à adapter selon vos utilisateurs existants)
INSERT INTO user_feedback (
  user_id, user_email, user_role, user_display_name,
  rating, feedback, suggestions, category, created_at
) VALUES 
(
  1, 'test@client.com', 'client', 'Entreprise Test SARL',
  5, 'Interface très intuitive et moderne ! J\'apprécie beaucoup les nouvelles fonctionnalités.',
  'Peut-être ajouter un mode sombre pour les longues sessions de travail.',
  'interface', NOW() - INTERVAL 2 DAY
),
(
  2, 'automob@test.com', 'automob', 'Jean Dupont',
  4, 'Globalement très satisfait de la nouvelle version. Plus rapide qu\'avant.',
  'Les notifications pourraient être plus discrètes.',
  'performance', NOW() - INTERVAL 1 DAY
),
(
  1, 'client2@test.com', 'client', 'Tech Innov SAS',
  3, 'Correct mais quelques bugs lors de la publication de missions.',
  'Améliorer la validation des formulaires.',
  'bugs', NOW() - INTERVAL 5 HOUR
),
(
  3, 'marie@automob.com', 'automob', 'Marie Martin',
  5, 'Excellente mise à jour ! Les nouvelles fonctionnalités sont très utiles.',
  'Continuer dans cette direction, c\'est parfait !',
  'fonctionnalites', NOW() - INTERVAL 3 HOUR
),
(
  4, 'startup@client.com', 'client', 'StartUp Digital',
  2, 'Interface confuse, difficile de trouver certaines options.',
  'Revoir l\'organisation des menus et ajouter un guide d\'utilisation.',
  'interface', NOW() - INTERVAL 1 HOUR
);

-- Marquer certains utilisateurs comme ayant déjà donné leur avis
UPDATE users SET feedback_given = 1 WHERE id IN (1, 2, 3, 4) AND feedback_given IS NOT NULL;

-- Vérifier les données insérées
SELECT 
  f.id,
  f.user_display_name,
  f.user_role,
  f.rating,
  f.category,
  f.feedback,
  DATE_FORMAT(f.created_at, '%d/%m/%Y %H:%i') as date_creation
FROM user_feedback f 
ORDER BY f.created_at DESC;
