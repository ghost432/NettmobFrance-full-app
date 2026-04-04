-- Mettre à jour le statut des missions qui ont des candidatures acceptées
-- mais sont encore en statut "ouvert"

-- Mettre à jour les missions avec au moins une candidature acceptée
UPDATE missions m
SET m.status = 'en_cours'
WHERE m.status = 'ouvert'
AND EXISTS (
  SELECT 1 
  FROM mission_applications ma 
  WHERE ma.mission_id = m.id 
  AND ma.status = 'accepte'
);

-- Afficher le résultat
SELECT 
  m.id,
  m.mission_name,
  m.status,
  COUNT(ma.id) as accepted_applications
FROM missions m
LEFT JOIN mission_applications ma ON m.id = ma.mission_id AND ma.status = 'accepte'
WHERE m.status = 'en_cours'
GROUP BY m.id, m.mission_name, m.status
HAVING accepted_applications > 0;
