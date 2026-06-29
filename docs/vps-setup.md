# Guide de déploiement VPS — TheCvBuilder API

> **OS cible** : Ubuntu 22.04 LTS  
> **Stack** : PostgreSQL 16 · .NET 8 · Nginx · Certbot  
> **Architecture** : Frontend Vercel → API sur VPS → PostgreSQL sur VPS

## Architecture de déploiement

```
Utilisateur
    │
    ├──▶ Vercel (gratuit)          ← Next.js (apps/web)  ← git push suffit
    │         │
    │         └──▶ VPS             ← ASP.NET Core API (apps/api)
    │                   │
    │                   └──▶ PostgreSQL  (même VPS)
    │
    └──▶ Supabase                  ← Auth uniquement (JWT)
```

**Ce guide concerne uniquement le VPS** (API .NET + PostgreSQL).  
Le frontend Next.js se déploie séparément sur Vercel — voir section 13.

---

## 0. Prérequis

Avant de commencer, tu as besoin de :
- Un VPS Ubuntu 22.04 avec accès root SSH
- Un nom de domaine pointant vers l'IP du VPS (ex. `api.thecvbuilder.com`)
- Tes clés Supabase (Project Ref, JWT Secret, Service Role Key)
- Tes clés FedaPay live (Secret Key, Webhook Secret)

---

## 1. Connexion et sécurisation initiale

```bash
# Connexion au VPS
ssh root@<vps-ip>

# Mettre à jour le système
apt update && apt upgrade -y

# Créer un utilisateur non-root pour l'application
adduser cvbuilder
usermod -aG sudo cvbuilder

# Copier ta clé SSH vers le nouvel utilisateur (depuis ta machine locale)
# Depuis ton poste : ssh-copy-id cvbuilder@<vps-ip>

# Passer sur le nouvel utilisateur
su - cvbuilder
```

---

## 2. Pare-feu (UFW)

```bash
# Activer UFW
sudo ufw enable

# Autoriser SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Bloquer l'accès direct au port de l'API (passera par Nginx)
# sudo ufw deny 5000  ← inutile, il est fermé par défaut

# Vérifier l'état
sudo ufw status
```

---

## 3. Installation de PostgreSQL 16

```bash
# Ajouter le dépôt officiel PostgreSQL
sudo apt install -y curl ca-certificates
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail \
  https://www.postgresql.org/media/keys/ACCC4CF8.asc
sudo sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] \
  https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list'

sudo apt update
sudo apt install -y postgresql-16

# Démarrer et activer PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Vérifier
sudo systemctl status postgresql
```

---

## 4. Création de la base de données et de l'utilisateur

```bash
# Passer sur l'utilisateur postgres
sudo -u postgres psql

# Dans le shell PostgreSQL :
CREATE DATABASE cvbuilder;
CREATE USER cvbuilder WITH PASSWORD 'MON_MOT_DE_PASSE_FORT';
GRANT ALL PRIVILEGES ON DATABASE cvbuilder TO cvbuilder;
\c cvbuilder
GRANT ALL ON SCHEMA public TO cvbuilder;
\q
```

> **Important** : Remplace `MON_MOT_DE_PASSE_FORT` par un vrai mot de passe fort.  
> Garde-le précieusement, tu en auras besoin pour la connexion string.

---

## 5. Application du schéma SQL

```bash
# Copier le fichier schema.sql sur le VPS (depuis ta machine locale)
scp apps/api/Database/schema.sql cvbuilder@<vps-ip>:~/schema.sql

# Sur le VPS : appliquer le schéma (tables + index + seed templates)
psql -U cvbuilder -d cvbuilder -h localhost -f ~/schema.sql

# Vérifier que les tables ont été créées
psql -U cvbuilder -d cvbuilder -h localhost -c "\dt"

# Vérifier que les templates ont été insérés (doit retourner 15 lignes)
psql -U cvbuilder -d cvbuilder -h localhost -c "SELECT name, template_key, is_premium FROM templates ORDER BY is_premium, name;"
```

---

## 6. Installation de .NET 8 Runtime

```bash
# Ajouter le dépôt Microsoft
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

sudo apt update
sudo apt install -y aspnetcore-runtime-8.0

# Vérifier
dotnet --version
# Doit afficher : 8.x.x
```

---

## 7. Publication et déploiement de l'API

### Sur ta machine locale :

```bash
# Build de production (depuis le dossier apps/api)
cd apps/api
dotnet publish -c Release -o ./publish

# Copier les fichiers publiés sur le VPS
scp -r ./publish/* cvbuilder@<vps-ip>:~/app/
```

### Sur le VPS :

```bash
# Créer le dossier de l'application
mkdir -p ~/app
# (les fichiers ont déjà été copiés par la commande scp ci-dessus)

# Tester que l'application démarre correctement
cd ~/app
ASPNETCORE_ENVIRONMENT=Production dotnet CvBuilderApi.dll
# Ctrl+C pour arrêter après vérification
```

---

## 8. Configuration de l'application

```bash
# Créer le fichier de configuration production
nano ~/app/appsettings.Production.json
```

Contenu à coller (remplace toutes les valeurs `<...>`) :

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=cvbuilder;Username=cvbuilder;Password=MON_MOT_DE_PASSE_FORT;Port=5432;"
  },
  "Supabase": {
    "ProjectRef": "TON_PROJECT_REF_SUPABASE",
    "JwtSecret": "TON_JWT_SECRET_SUPABASE",
    "ServiceRoleKey": "TON_SERVICE_ROLE_KEY_SUPABASE"
  },
  "FedaPay": {
    "SecretKey": "sk_live_XXXXXXXXXXXXXXXX",
    "WebhookSecret": "whs_live_XXXXXXXXXXXXXXXX",
    "Environment": "live"
  },
  "FrontendUrl": "https://thecvbuilder.vercel.app",
  "AllowedOrigins": "https://thecvbuilder.vercel.app",
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

> **Où trouver les clés Supabase :**  
> - Dashboard Supabase → Settings → API  
> - `ProjectRef` : l'ID dans l'URL (`https://supabase.com/dashboard/project/XXXXX`)  
> - `JwtSecret` : JWT Secret (sous "JWT Settings")  
> - `ServiceRoleKey` : service_role key (sous "Project API keys")

> **Où trouver les clés FedaPay :**  
> - Dashboard FedaPay → API Keys → Live

---

## 9. Service systemd (démarrage automatique)

```bash
# Créer le service systemd
sudo nano /etc/systemd/system/cvbuilder-api.service
```

Contenu à coller :

```ini
[Unit]
Description=TheCvBuilder API (.NET 8)
After=network.target postgresql.service

[Service]
WorkingDirectory=/home/cvbuilder/app
ExecStart=/usr/bin/dotnet /home/cvbuilder/app/CvBuilderApi.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=cvbuilder-api
User=cvbuilder
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5000
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
```

```bash
# Activer et démarrer le service
sudo systemctl daemon-reload
sudo systemctl enable cvbuilder-api
sudo systemctl start cvbuilder-api

# Vérifier que l'API tourne
sudo systemctl status cvbuilder-api

# Tester que l'API répond en local
curl http://localhost:5000/api/templates
# Doit retourner un JSON avec les 15 templates
```

---

## 10. Installation de Nginx

```bash
sudo apt install -y nginx

# Démarrer et activer Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 11. Configuration Nginx (reverse proxy)

```bash
# Créer la config pour l'API
sudo nano /etc/nginx/sites-available/cvbuilder-api
```

Contenu à coller (remplace `api.thecvbuilder.com` par ton domaine) :

```nginx
server {
    listen 80;
    server_name api.thecvbuilder.com;

    # Taille max upload (CV export PDF)
    client_max_body_size 10M;

    location / {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout pour les exports PDF (Playwright)
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
    }
}
```

```bash
# Activer le site et tester la config
sudo ln -s /etc/nginx/sites-available/cvbuilder-api /etc/nginx/sites-enabled/
sudo nginx -t
# Doit afficher : syntax is ok / test is successful

sudo systemctl reload nginx
```

---

## 12. Certificat SSL (HTTPS) avec Certbot

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir le certificat SSL (remplace par ton domaine et email)
sudo certbot --nginx -d api.thecvbuilder.com --email ton@email.com --agree-tos --non-interactive

# Vérifier le renouvellement automatique
sudo certbot renew --dry-run
```

Après Certbot, Nginx est automatiquement mis à jour pour écouter sur le port 443 avec HTTPS.

---

## 13. Variables d'environnement pour le frontend (Vercel)

Dans le dashboard Vercel de ton projet Next.js, ajoute ces variables :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.thecvbuilder.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://TON_PROJECT_REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ta clé `anon` Supabase |

---

## 14. Configuration du webhook FedaPay

Dans le dashboard FedaPay → Webhooks, ajouter :

- **URL** : `https://api.thecvbuilder.com/api/payments/webhook`
- **Événements** : `transaction.approved`, `transaction.canceled`, `transaction.declined`

Copie le **Webhook Secret** généré dans `appsettings.Production.json` → `FedaPay:WebhookSecret`.

---

## 15. Vérification finale

```bash
# 1. API accessible en HTTPS
curl https://api.thecvbuilder.com/api/templates

# 2. Templates présents en base
psql -U cvbuilder -d cvbuilder -h localhost -c \
  "SELECT count(*) FROM templates WHERE is_active = TRUE;"
# Résultat attendu : 15

# 3. Service API en bonne santé
sudo systemctl status cvbuilder-api

# 4. Logs en temps réel
sudo journalctl -u cvbuilder-api -f

# 5. Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 16. Mise à jour de l'application (redéploiement)

Quand tu veux déployer une nouvelle version :

```bash
# Sur ta machine locale
cd apps/api
dotnet publish -c Release -o ./publish

# Copier sur le VPS
scp -r ./publish/* cvbuilder@<vps-ip>:~/app/

# Sur le VPS : redémarrer le service
sudo systemctl restart cvbuilder-api
sudo systemctl status cvbuilder-api
```

---

## Récapitulatif des ports

| Port | Usage | Accès |
|---|---|---|
| 22 | SSH | Public (ton IP uniquement idéalement) |
| 80 | HTTP → redirect HTTPS | Public |
| 443 | HTTPS (Nginx) | Public |
| 5000 | API .NET (interne) | Localhost uniquement |
| 5432 | PostgreSQL | Localhost uniquement |
