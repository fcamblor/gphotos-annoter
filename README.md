# GPhotos Estate Annotator

Extension Chrome pour annoter les photos Google Photos dans le cadre d'un inventaire successoral. Permet de placer des points colorés sur les objets, d'exprimer son intérêt, et d'échanger des messages.

## Prérequis

- Node.js 18+
- Un projet Google Cloud avec l'API Google Sheets activée
- Un identifiant OAuth 2.0 de type "Extension Chrome"

## Installation

### 1. Configuration Google Cloud

1. Créer un projet sur [Google Cloud Console](https://console.cloud.google.com)

   ```bash
   gcloud projects create MON-PROJET-ID --name="GPhotos Annotator"
   gcloud config set project MON-PROJET-ID
   ```

2. Activer l'API **Google Sheets API**

   ```bash
   gcloud services enable sheets.googleapis.com
   ```

3. Créer des identifiants OAuth 2.0 :
   - Type : **Extension Chrome**
   - ID de l'extension : (récupéré après chargement de l'extension, voir étape 3)

   > **Note :** `gcloud` ne supporte pas la création d'identifiants OAuth de type "Extension Chrome". Cette étape doit être réalisée via la [console Google Cloud → Identifiants](https://console.cloud.google.com/apis/credentials).

4. Copier le **Client ID** dans `wxt.config.ts` → `manifest.oauth2.client_id`

### 2. Préparer la spreadsheet

La spreadsheet doit contenir 3 onglets avec les headers suivants :

- **db-interessés** : `name`
- **db-item** : `id`, `name`, `placeholders`, `color`, `interested_people`
- **db-item-message** : `item_id`, `author`, `timestamp`, `content`

Remplir `db-interessés` avec les noms des personnes concernées.

### 3. Build et chargement

```bash
npm install
npm run build
```

1. Ouvrir `chrome://extensions`
2. Activer le **Mode développeur**
3. Cliquer **Charger l'extension non empaquetée** → sélectionner le dossier `.output/chrome-mv3/`
4. Noter l'**ID de l'extension** et le reporter dans Google Cloud (étape 1.3)

### 4. Développement

```bash
npm run dev
```

Le mode dev active le hot-reload via WXT avec rechargement automatique.

## Utilisation

1. Ouvrir un album Google Photos partagé
2. Au premier lancement, sélectionner votre nom
3. **Double-clic** sur l'image → créer un nouveau point / rattacher à un objet existant
4. **Hover** sur un point → aperçu rapide (nom, intéressés, nb messages)
5. **Clic** sur un point → panneau complet (messages, intérêts, actions)

## Configuration

Cliquer sur l'icône de l'extension dans la barre Chrome pour :
- Modifier l'ID de la spreadsheet
- Changer d'utilisateur
