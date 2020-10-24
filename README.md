# Développement

- Récupération des packages : `npm install`
- Démarrer l'application : `npm start`

# Déploiement

- Vérifier que le certificat est bien présent (MySPC.pfx)
- Génération de l'installeur : `npm run pack` ou `npm run build`
- Publier (Linux) : `GH_TOKEN=xxx npm run publish-linux`
- Publier (Window) : `$Env:GITHUB_TOKEN="xxx"` puis `npm run publish-win`


## Publication

`npm run dist-win`

`GH_TOKEN=xxxnpm run publish-win`
