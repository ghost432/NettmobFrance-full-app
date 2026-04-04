# 📱 Guide : Afficher "NettmobFrance" comme Expéditeur SMS

## 🎯 Objectif
Remplacer le numéro de téléphone Twilio par "NettmobFrance" comme nom d'expéditeur dans les SMS.

## ✅ Code Backend Déjà Prêt
Le code dans `/backend/services/twilioService.js` supporte **3 options** d'expéditeur (par ordre de priorité) :

1. **Messaging Service** (`TWILIO_MESSAGING_SERVICE_SID`) ⭐ **RECOMMANDÉ**
2. **Alphanumeric Sender ID** (`TWILIO_ALPHA_SENDER_ID`)
3. **Numéro de téléphone** (`TWILIO_PHONE_NUMBER`)

---

## 📋 Option 1 : Messaging Service (RECOMMANDÉ)

### Avantages
- ✅ Gère automatiquement plusieurs pays
- ✅ Peut inclure plusieurs expéditeurs (numéros + Alpha Sender)
- ✅ Meilleure délivrabilité
- ✅ Fallback automatique si Alpha Sender non supporté

### Configuration sur Twilio Console

#### Étape 1 : Créer un Messaging Service
1. Allez sur https://console.twilio.com/us1/develop/sms/services
2. Cliquez **Create Messaging Service**
3. Remplissez :
   - **Friendly Name** : `NettmobFrance SMS`
   - **Use case** : `Notify my users`
4. Cliquez **Create Messaging Service**

#### Étape 2 : Configurer l'Alphanumeric Sender ID
1. Dans votre Messaging Service, allez dans **Sender Pool**
2. Cliquez **Add Senders**
3. Choisissez **Alpha Sender**
4. Configurez :
   - **Alpha Sender** : `NettmobFrance` (11 caractères max, pas d'espaces ni caractères spéciaux)
   - **Country/Region** : Cochez `France`
5. Cliquez **Add Alpha Sender**

⚠️ **Important** :
- Twilio peut demander une vérification (1-2 jours ouvrables)
- Remplissez le formulaire de vérification si demandé
- Vous recevrez un email de confirmation

#### Étape 3 : Ajouter votre numéro Twilio comme fallback (optionnel)
1. Dans **Sender Pool**, cliquez **Add Senders**
2. Choisissez **Phone Number**
3. Sélectionnez votre numéro Twilio existant
4. Cliquez **Add Phone Number**

Cela permet d'envoyer depuis votre numéro si Alpha Sender n'est pas supporté (ex: USA, Canada).

#### Étape 4 : Configurer le .env
```bash
# .env backend
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxx  # ⬅️ SID du Messaging Service
```

Pour trouver le SID :
- Dans Twilio Console → **Messaging** → **Services**
- Cliquez sur "NettmobFrance SMS"
- Copiez le **Messaging Service SID** (commence par `MG...`)

---

## 📋 Option 2 : Alphanumeric Sender ID Direct

### Avantages
- ✅ Plus simple (pas de Messaging Service)
- ✅ Affichage direct du nom

### Inconvénients
- ❌ Ne fonctionne que dans certains pays
- ❌ Pas de fallback automatique

### Configuration sur Twilio Console

#### Étape 1 : Enregistrer l'Alpha Sender
1. Allez sur https://console.twilio.com/us1/develop/sms/settings/alpha-sender
2. Cliquez **Register New Alpha Sender**
3. Remplissez :
   - **Alpha Sender** : `NettmobFrance`
   - **Country** : France
   - **Use Case** : Marketing / Transactional
4. Soumettez la demande

⚠️ La vérification peut prendre 1-2 jours.

#### Étape 2 : Configurer le .env
```bash
# .env backend
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxx
TWILIO_ALPHA_SENDER_ID=NettmobFrance  # ⬅️ Nom de l'expéditeur
```

---

## 🌍 Pays Supportés pour Alphanumeric Sender ID

✅ **Supportés** (SMS affiche "NettmobFrance") :
- 🇫🇷 France
- 🇬🇧 Royaume-Uni
- 🇩🇪 Allemagne
- 🇪🇸 Espagne
- 🇮🇹 Italie
- 🇧🇪 Belgique
- 🇨🇭 Suisse
- Et la plupart des pays européens

❌ **Non supportés** (SMS affiche le numéro) :
- 🇺🇸 USA
- 🇨🇦 Canada
- 🇲🇽 Mexique
- Et certains pays d'Asie/Amérique

Voir la liste complète : https://support.twilio.com/hc/en-us/articles/223133767

---

## ⚙️ Variables d'Environnement Résumé

```bash
# Option 1 : Messaging Service (RECOMMANDÉ)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxx

# Option 2 : Alpha Sender Direct
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxx
TWILIO_ALPHA_SENDER_ID=NettmobFrance

# Option 3 : Numéro de téléphone (par défaut, si rien d'autre)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+33XXXXXXXXX
```

---

## 🧪 Tester

Après configuration :

1. **Redémarrez le backend** :
   ```bash
   cd backend
   node server.js
   ```

2. **Envoyez un SMS test** depuis l'admin :
   - Allez sur `/admin/send-sms`
   - Cliquez sur "Test (moi uniquement)"
   - Vérifiez sur votre téléphone

3. **Résultat attendu** :
   - ✅ Expéditeur : `NettmobFrance` (si Alpha Sender configuré)
   - ❌ Expéditeur : `+33XXXXXXX` (si pas encore approuvé ou pays non supporté)

---

## ⚠️ Limitations Importantes

1. **Les destinataires ne peuvent PAS répondre** aux SMS avec Alpha Sender
   - Les réponses seront perdues
   - Si vous voulez recevoir des réponses, utilisez un numéro Twilio classique

2. **Caractères limités** :
   - Maximum 11 caractères
   - Pas d'espaces
   - Lettres et chiffres uniquement
   - Exemples valides : `NettmobFR`, `Nettmob`, `NMF2024`
   - Exemples invalides : `Nettmob France`, `Nett-mob`, `Nettmob!`

3. **Coûts** :
   - Les SMS avec Alpha Sender coûtent légèrement plus cher
   - Vérifiez les tarifs Twilio pour la France

---

## 📞 Support Twilio

Si vous avez des problèmes :
- Email : support@twilio.com
- Console : https://console.twilio.com/support
- Documentation : https://www.twilio.com/docs/messaging/services

---

## 🔄 Ordre de Priorité du Code

Le code `twilioService.js` vérifie dans cet ordre :

1. Si `TWILIO_MESSAGING_SERVICE_SID` existe → Utilise le Messaging Service ⭐
2. Sinon, si `TWILIO_ALPHA_SENDER_ID` existe → Utilise l'Alpha Sender direct
3. Sinon, si `TWILIO_PHONE_NUMBER` existe → Utilise le numéro
4. Sinon → Erreur

**Recommandation** : Utilisez `TWILIO_MESSAGING_SERVICE_SID` pour plus de flexibilité.

---

## ✅ Checklist Rapide

- [ ] Créer un Messaging Service sur Twilio Console
- [ ] Ajouter un Alpha Sender "NettmobFrance" dans le Sender Pool
- [ ] Ajouter `TWILIO_MESSAGING_SERVICE_SID=MGxxx...` dans le .env backend
- [ ] Redémarrer le backend
- [ ] Tester avec un SMS
- [ ] Attendre l'approbation Twilio (1-2 jours si nécessaire)
- [ ] Vérifier que l'expéditeur affiche "NettmobFrance"

---

**Date** : 18 novembre 2025  
**Status** : Code prêt, configuration Twilio requise
