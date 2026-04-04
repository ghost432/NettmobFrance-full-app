# 🔑 Télécharger la Clé Privée Firebase

## Étapes à Suivre MAINTENANT:

1. **Allez sur** https://console.firebase.google.com/
2. **Sélectionnez** votre projet "nettmobfrance-92e4a"
3. **Cliquez sur** l'icône ⚙️ (Paramètres) en haut à gauche
4. **Sélectionnez** "Paramètres du projet"
5. **Allez dans** l'onglet "Comptes de service"
6. **Cliquez sur** "Générer une nouvelle clé privée"
7. **Téléchargez** le fichier JSON
8. **Renommez-le** en `firebase-service-account.json`
9. **Placez-le** dans ce dossier: `/backend/config/firebase-service-account.json`

## ⚠️ IMPORTANT

- Ce fichier contient des informations sensibles
- Ne le commitez JAMAIS dans Git
- Il est déjà dans le .gitignore

## ✅ Vérification

Une fois placé, le fichier devrait être ici:
```
/home/thierry-ninja/Desktop/windsurf-project-4/backend/config/firebase-service-account.json
```

Vous pouvez vérifier avec:
```bash
ls -la /home/thierry-ninja/Desktop/windsurf-project-4/backend/config/
```

## 📝 Après le Téléchargement

Une fois le fichier placé, supprimez ce fichier de guide et redémarrez le serveur backend.
