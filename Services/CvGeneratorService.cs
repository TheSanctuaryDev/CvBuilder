using System.Net.Http.Json;
using System.Text.Json;
using CvBuilderApp.Models;
using CvBuilderApp.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace CvBuilderApp.Services
{
    public class CvGeneratorService : ICvGeneratorService
    {
        private readonly string _apiKey;
        private readonly HttpClient _httpClient;
        private readonly IWebHostEnvironment _env;
        private readonly AppDbContext _context;

        public CvGeneratorService(
            HttpClient httpClient,
            IConfiguration config,
            IWebHostEnvironment env,
            AppDbContext context)
        {
            _httpClient = httpClient;
            _env = env;
            _context = context;
            _apiKey = config["Gemini:ApiKey"] ?? throw new Exception("Clé API Gemini manquante dans appsettings.json");
            _httpClient.Timeout = TimeSpan.FromSeconds(300);
        }

        public async Task<CvGenerationResult> GenerateCvHtmlAsync(CvData currentData, string category, string templateId)
        {
            string templateFolder = Path.Combine(_env.WebRootPath, "templates", category, templateId);
            string htmlPath = Path.Combine(templateFolder, "template.html");
            string cssPath = Path.Combine(templateFolder, "style.css");

            if (!File.Exists(htmlPath) || !File.Exists(cssPath))
                throw new FileNotFoundException($"Le template est introuvable : {templateFolder}");

            string photoUrl = string.IsNullOrEmpty(currentData.PhotoPath) ? "" : $"/img/{currentData.PhotoPath}";

            // ✅ Point 2 — Blueprint depuis cache ou Gemini
            string blueprint = await GetOrCreateBlueprintAsync(category, templateId, htmlPath, cssPath);

            // ✅ Point 3 — Génération avec streaming
            return await GenerateCvWithBlueprintAsync(currentData, blueprint, photoUrl);
        }

        // ============================================================
        // POINT 2 — CACHE DES BLUEPRINTS
        // ============================================================

        /// <summary>
        /// Retourne le blueprint depuis le cache DB si disponible,
        /// sinon appelle Gemini pour l'analyser et le met en cache.
        /// </summary>
        private async Task<string> GetOrCreateBlueprintAsync(
            string category,
            string templateId,
            string htmlPath,
            string cssPath)
        {
            string templateKey = $"{category}/{templateId}";

            // 1. Chercher dans le cache DB
            var cached = await _context.TemplateBlueprintCaches
                .FirstOrDefaultAsync(x => x.TemplateKey == templateKey);

            if (cached != null)
            {
                // ✅ Blueprint trouvé en cache → zéro appel Gemini pour l'analyse
                return cached.BlueprintJson;
            }

            // 2. Pas en cache → analyser avec Gemini
            string htmlTemplate = await File.ReadAllTextAsync(htmlPath);
            string cssContent = await File.ReadAllTextAsync(cssPath);
            string blueprint = await AnalyseTemplateAsync(htmlTemplate, cssContent);

            // 3. Sauvegarder en cache
            _context.TemplateBlueprintCaches.Add(new TemplateBlueprintCache
            {
                TemplateKey = templateKey,
                BlueprintJson = blueprint,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return blueprint;
        }

        /// <summary>
        /// Force la régénération du blueprint pour un template donné.
        /// Utile quand tu modifies un template et veux invalider le cache.
        /// </summary>
        public async Task InvalidateBlueprintCacheAsync(string category, string templateId)
        {
            string templateKey = $"{category}/{templateId}";
            var cached = await _context.TemplateBlueprintCaches
                .FirstOrDefaultAsync(x => x.TemplateKey == templateKey);

            if (cached != null)
            {
                _context.TemplateBlueprintCaches.Remove(cached);
                await _context.SaveChangesAsync();
            }
        }

        // ============================================================
        // ANALYSE DU TEMPLATE — appel Gemini normal (pas de streaming)
        // ============================================================

        private async Task<string> AnalyseTemplateAsync(string htmlTemplate, string cssContent)
        {
            string analysePrompt = $@"
Tu es un expert en analyse de templates HTML/CSS pour CV professionnels haut de gamme.

Analyse PRÉCISÉMENT ce template HTML et ce fichier CSS, puis retourne un blueprint JSON décrivant son ADN visuel complet avec une précision chirurgicale.
Toutes les valeurs que tu retournes doivent être extraites du template réel — ne suppose rien.

=== TEMPLATE HTML ===
{htmlTemplate}

=== FICHIER CSS ===
{cssContent}

=== CE QUE TU DOIS EXTRAIRE ===

1. PALETTE : toutes les couleurs présentes avec leurs codes hex exacts.
   Inclus AUSSI : couleurs de hover, couleurs de bordure subtiles, dégradés (gradient exact), couleurs d'ombre.

2. MISE EN PAGE : type de layout, ratio précis des colonnes, côté sidebar, technique pleine hauteur.
   Inclus AUSSI : padding exact de chaque colonne, gap entre colonnes, max-width du conteneur global.

3. TYPOGRAPHIE : pour chaque niveau, note font-family, font-size, font-weight, text-transform, letter-spacing, line-height, color.

4. DÉCORATIONS : liste EXHAUSTIVE de chaque élément décoratif avec le style CSS exact.
   Inclus ABSOLUMENT :
   - Les micro-détails : points de séparation, tirets décoratifs, pastilles colorées, lignes fines entre items
   - Les effets de bordure : border-left coloré sur les titres, underline partiel, border-bottom sur sections
   - Les effets de fond : background sur badges de compétences, tags colorés, barres de progression
   - Les ombres subtiles : box-shadow sur la sidebar, drop-shadow sur la photo
   - Les espacements entre sections (margin-bottom exact)
   - Les FORMES DÉCORATIVES : divs ayant une forme spéciale (cercle, triangle, rectangle, losange, demi-cercle, vague)
     créées via border-radius, clip-path, transform, ou CSS pur. Note leur position exacte (top/left/right/bottom),
     leur taille (width/height), leur couleur, leur z-index, et leur positionnement (absolute/relative/fixed).
   - Les LIGNES DÉCORATIVES : lignes horizontales ou verticales légèrement plus foncées ou plus claires que le fond,
     créées via border, background-color, ou ::before/::after. Note leur épaisseur, couleur exacte, opacité, et position.
   - Les ICÔNES ET PUCES DE LISTE CHIC : remplacement des puces ul/li classiques par des icônes Font Awesome,
     des caractères Unicode spéciaux (›, •, ◆, ✦, etc.), des SVG inline, ou des pseudo-éléments ::before stylisés.
     Note le caractère exact, la couleur, la taille, et le positionnement.
   - Les ÉLÉMENTS DÉCORATIFS DE FOND : formes en arrière-plan (cercles transparents, formes géométriques en opacity réduite,
     watermarks décoratifs) servant uniquement à l'esthétique.
   - Les COINS ET ANGLES DÉCORATIFS : éléments positionnés aux coins des sections ou du document pour créer un effet de cadre.
   - Les SÉPARATEURS STYLISÉS : hr ou divs servant de séparateur avec un style particulier (dégradé, pointillés, double ligne).

5. SECTION CONTACT : emplacement, structure HTML exacte, classes CSS, icônes Font Awesome.

6. SECTION PHOTO : emplacement, forme, styles CSS exacts incluant border, box-shadow, object-fit, filter si présent.

7. STRUCTURE DES SECTIONS : pour chaque section, copie la structure HTML type avec classes CSS réelles.
   Inclus AUSSI la structure des items individuels (chaque expérience, chaque compétence, etc.)
   Inclus ÉGALEMENT les sections : ContestsWon, References, Interests si présentes dans le template.

8. EFFETS VISUELS AVANCÉS :
   - Transitions CSS présentes (hover effects)
   - Dégradés (linear-gradient, radial-gradient)
   - Pseudo-éléments (::before, ::after) avec leur contenu et style exact
   - Variables CSS (--color-primary, etc.) si présentes
   - Bordures arrondies (border-radius) sur chaque élément
   - Separateurs visuels entre items (border-bottom, margin, padding)

9. CLASSES CSS CLÉS : toutes les classes importantes avec leur rôle.

10. FONT AWESOME : version et lien CDN exact.

11. CSS COMPLET : copie l'intégralité du CSS sans aucune modification.

=== FORMAT DE SORTIE (STRICT) ===
Retourne UNIQUEMENT un JSON valide, sans texte ni markdown autour.
Utilise des guillemets simples (') dans les valeurs HTML.

{{
  ""palette"": {{
    ""background"": ""[hex]"",
    ""sidebar"": ""[hex]"",
    ""accent"": ""[hex]"",
    ""accentSecondaire"": ""[hex si présent]"",
    ""text"": ""[hex]"",
    ""textLight"": ""[hex]"",
    ""border"": ""[hex]"",
    ""badgeBackground"": ""[hex si présent]"",
    ""badgeText"": ""[hex si présent]"",
    ""gradient"": ""[valeur CSS complète si présent]"",
    ""shadow"": ""[valeur box-shadow si présente]""
  }},
  ""layout"": {{
    ""type"": ""[one-column ou two-column]"",
    ""ratio"": ""[ex: 30/70]"",
    ""sidebarSide"": ""[left ou right]"",
    ""fullHeightColumns"": true,
    ""techniqueFullHeight"": ""[technique exacte]"",
    ""paddingSidebar"": ""[valeur exacte]"",
    ""paddingMain"": ""[valeur exacte]"",
    ""gapColonnes"": ""[valeur exacte]""
  }},
  ""typographie"": {{
    ""nom"": ""[styles CSS exacts complets]"",
    ""titrePoste"": ""[styles CSS exacts complets]"",
    ""titreSection"": ""[styles CSS exacts complets]"",
    ""corps"": ""[styles CSS exacts complets]"",
    ""soustitre"": ""[styles CSS exacts complets]"",
    ""dateEtLieu"": ""[styles CSS exacts complets]"",
    ""badge"": ""[styles CSS exacts complets si présent]""
  }},
  ""decorations"": [
    {{
      ""element"": ""[nom précis de l'élément]"",
      ""type"": ""[forme|ligne|icone|puce|fond|coin|separateur|ombre]"",
      ""style"": ""[style CSS exact et complet]"",
      ""html"": ""[structure HTML complète si applicable, ex: <div class='deco-circle'></div>]"",
      ""pseudoElement"": ""[::before ou ::after si applicable avec contenu et CSS complet]"",
      ""position"": ""[description de l'emplacement : ex: coin supérieur droit de la sidebar, entre chaque item d'expérience]"",
      ""forme"": ""[cercle|triangle|rectangle|losange|demi-cercle|ligne-h|ligne-v|vague|autre — null si non applicable]"",
      ""dimensions"": ""[width et height exacts si applicable]"",
      ""couleur"": ""[hex exact]"",
      ""opacite"": ""[valeur opacity si présente]"",
      ""zIndex"": ""[valeur z-index si présente]"",
      ""caractereUnicode"": ""[caractère exact si puce ou icône Unicode, ex: ◆ ✦ › • ]"",
      ""classesCss"": ""[toutes les classes CSS de l'élément]""
    }}
  ],
  ""separateurs"": {{
    ""entreItems"": ""[style CSS exact]"",
    ""entreSections"": ""[style CSS exact]"",
    ""titreDeSectionDecoration"": ""[style CSS exact]"",
    ""typeVisuel"": ""[ligne simple|dégradé|pointillés|double ligne|ombre|invisible]"",
    ""couleur"": ""[hex exact]"",
    ""epaisseur"": ""[valeur px]"",
    ""opacite"": ""[valeur si présente]""
  }},
  ""contact"": {{
    ""emplacement"": ""[emplacement]"",
    ""structureHtml"": ""[bloc HTML type]"",
    ""classesCss"": ""[classes]"",
    ""iconesFontAwesome"": true
  }},
  ""photo"": {{
    ""emplacement"": ""[emplacement]"",
    ""forme"": ""[ronde/carrée/ovale]"",
    ""styles"": ""[styles CSS exacts complets]"",
    ""shadow"": ""[box-shadow exact si présent]"",
    ""border"": ""[border exact si présent]""
  }},
  ""sections"": {{
    ""experience"": {{
      ""classeConteneur"": ""[classe]"",
      ""structureItem"": ""[HTML type complet]"",
      ""separateurItem"": ""[style CSS du séparateur entre items]""
    }},
    ""formation"": {{
      ""classeConteneur"": ""[classe]"",
      ""structureItem"": ""[HTML type complet]"",
      ""separateurItem"": ""[style CSS]""
    }},
    ""competences"": {{
      ""classeConteneur"": ""[classe]"",
      ""structureItem"": ""[HTML type complet]"",
      ""styleTag"": ""[style CSS des badges/tags si présents]""
    }},
    ""contestsWon"": {{
      ""classeConteneur"": ""[classe ou null si absent du template]"",
      ""structureItem"": ""[HTML type complet d'un concours gagné, ex: <li class='contest-item'>Nom du concours</li>]"",
      ""separateurItem"": ""[style CSS du séparateur entre items]""
    }},
    ""references"": {{
      ""classeConteneur"": ""[classe ou null si absent du template]"",
      ""structureItem"": ""[HTML type complet d'une référence, ex: <div class='reference-item'><span class='ref-name'>Nom</span><span class='ref-poste'>Poste</span><span class='ref-contact'>Contact</span></div>]"",
      ""separateurItem"": ""[style CSS du séparateur entre items]""
    }},
    ""interests"": {{
      ""classeConteneur"": ""[classe ou null si absent du template]"",
      ""structureItem"": ""[HTML type complet d'un intérêt, ex: <span class='interest-tag'>Photographie</span>]"",
      ""styleTag"": ""[style CSS si affichés en badges/tags, ex: background:#f0f0f0; border-radius:4px; padding:4px 8px]""
    }}
  }},
  ""effetsVisuels"": {{
    ""pseudoElementsAvant"": ""[tous les ::before avec leur CSS exact]"",
    ""pseudoElementsApres"": ""[tous les ::after avec leur CSS exact]"",
    ""transitions"": ""[toutes les transitions CSS]"",
    ""degrades"": ""[tous les gradients présents]"",
    ""variablesCss"": ""[toutes les variables CSS --var]""
  }},
  ""classesCssClés"": [
    {{""classe"": ""[nom]"", ""role"": ""[rôle]""}}
  ],
  ""fontAwesome"": {{
    ""version"": ""[4, 5 ou 6]"",
    ""cdnLink"": ""[balise link complète]""
  }},
  ""cssComplet"": ""[INTÉGRALITÉ du CSS sans modification]""
}}
";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[] { new { text = analysePrompt } }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.1f,
                    topP = 0.9f,
                    topK = 20,
                    maxOutputTokens = 8192
                }
            };

            // ✅ Analyse = appel normal (pas de streaming, output petit)
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={_apiKey}";
            var response = await SendWithRetryAsync(url, requestBody);
            var geminiResponse = await response.Content.ReadFromJsonAsync<GeminiResponse>();
            string? raw = geminiResponse?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

            if (string.IsNullOrEmpty(raw))
                throw new Exception("L'analyse du template a renvoyé une réponse vide.");

            return CleanJsonString(raw);
        }

        // ============================================================
        // POINT 3 — GÉNÉRATION CV AVEC STREAMING
        // ============================================================

        private async Task<CvGenerationResult> GenerateCvWithBlueprintAsync(CvData currentData, string blueprint, string photoUrl)
        {
            string systemInstruction = $@"
Tu es un moteur expert de génération de CV HTML/CSS pour une application professionnelle appelée CvBuilderApp.

==========
CONTEXTE
==========
Tu reçois :
- Un blueprint JSON (analyse complète et fidèle du template original) : {blueprint}
- Un objet JSON CvData contenant les informations utilisateur
- Une variable photoUrl : {photoUrl}

Le blueprint contient TOUT ce dont tu as besoin pour reproduire le template fidèlement :
couleurs exactes, structures HTML des sections, classes CSS, décorations, typographie, ratio des colonnes, CSS complet.
→ Utilise blueprint.cssComplet comme base CSS dans le <style> du HTML final.
→ Utilise blueprint.fontAwesome.cdnLink pour inclure Font Awesome dans le <head>.
→ Reproduis CHAQUE élément de blueprint.decorations avec son style CSS exact.
→ Utilise blueprint.contact.structureHtml comme modèle pour la section contact.
→ Applique blueprint.photo.styles pour la photo du candidat.

=====================================================
RÈGLES DE PRIORITÉ EN CAS DE CONFLIT (LIRE EN PREMIER)
=====================================================
En cas de contradiction apparente entre deux règles, applique TOUJOURS cet ordre de priorité :
1. Ne jamais inventer d'informations factuelles. (ABSOLU)
2. Tenir sur une seule page A4 — si le contenu est trop long, CONDENSER les descriptions plutôt que supprimer des entrées.
3. Conserver un maximum d'informations utilisateur (condensé > supprimé).
4. Respecter le design et la structure du template fourni.

========================
OBJECTIFS PRINCIPAUX  
========================
1. Amélioration des données :
   - Corriger fautes d'orthographe et grammaire.
   - Reformuler avec un ton professionnel et percutant. (STRICT)
   - NE JAMAIS inventer d'informations factuelles. (STRICT)
   - Générer un résumé professionnel même si l'utilisateur n'en a pas fourni, en utilisant les autres données disponibles dans le CvData pour construire un résumé cohérent et pertinent.
   - Ne jamais oublier de mettre les liens de projet à coté des icones dans les expériences et les liens de contact à coté des icones dans les différentes sections pour ceux qui auront le CV en version papier.
2. Génération du CV :
   - Injecter les données dans la structure HTML du blueprint.
   - Maintenir un rendu propre et professionnel.
   - Rendre le contenu dynamique (adapter la longueur des textes au design).
   - NE JAMAIS UTILISER DEUX PAGES POUR LE CV, même si le contenu est long. Si le contenu est trop abondant, condense les descriptions (réduis leur longueur) plutôt que de supprimer des entrées. (STRICT)
   - INJECTER impérativement blueprint.cssComplet dans une balise <style> à l'intérieur du <head> du HTML final.
   - Le résultat doit être un document HTML UNIQUE et AUTONOME (Self-contained).
@""================================================================
CONSIGNE DE PRÉ-GÉNÉRATION : RESTITUTION PARFAITE DU DESIGN
================================================================
Avant toute injection de données, exploite le blueprint pour reproduire l'ADN visuel à 100% :

COLONNES & FOND :
- Les colonnes doivent avoir leur couleur de fond exacte (blueprint.palette.sidebar et blueprint.palette.background).
- La couleur de fond de chaque colonne DOIT s'étendre jusqu'au bas absolu de la page A4, sans aucune coupure.
- Utilise display:table sur le conteneur et display:table-cell sur les colonnes si blueprint.layout.techniqueFullHeight l'indique.
- Applique exactement blueprint.layout.paddingSidebar et blueprint.layout.paddingMain.

SÉPARATEURS & MICRO-DÉTAILS (CRITIQUE POUR LE RENDU CHIC) :
- Reproduis CHAQUE séparateur de blueprint.separateurs entre chaque item et entre chaque section.
- Reproduis CHAQUE pseudo-élément (::before, ::after) de blueprint.effetsVisuels.pseudoElementsAvant et pseudoElementsApres avec leur CSS exact.
- Les bordures décoratives sur les titres de section (border-left, border-bottom, underline partiel) doivent être reproduites à l'identique.
- Les pastilles, points, tirets décoratifs doivent apparaître exactement où le blueprint les indique.
- Les ombres (box-shadow) sur la sidebar, la photo, les cartes doivent être appliquées.

BADGES & COMPÉTENCES :
- Si blueprint.sections.competences.styleTag est présent, utilise-le pour chaque badge de compétence.
- Couleurs exactes : blueprint.palette.badgeBackground et blueprint.palette.badgeText.
- Espacement entre badges : cohérent et aéré.

TYPOGRAPHIE DE PRÉCISION :
- Applique line-height, letter-spacing, text-transform de blueprint.typographie sur CHAQUE niveau.
- Les dates et lieux utilisent blueprint.typographie.dateEtLieu exactement.

PHOTO :
- Applique blueprint.photo.shadow et blueprint.photo.border en plus des styles de base.
- La photo doit être parfaitement centrée dans son conteneur avec object-fit: cover.

EFFETS VISUELS :
- Applique toutes les variables CSS de blueprint.effetsVisuels.variablesCss dans le :root.
- Applique tous les gradients de blueprint.effetsVisuels.degrades.

OBJECTIF FINAL : le CV généré doit être visuellement indiscernable du template original,
avec un rendu chic, aéré, professionnel et impressionnant. Chaque micro-détail compte.""

============================================================
SÉPARATION STRICTE DESIGN / CONTENU (RÈGLE D'OR)
============================================================
- SOURCE DE VÉRITÉ UNIQUE : Seul l'objet JSON CvData fourni par l'utilisateur fait foi pour le contenu.
- INJECTION : Utilise le design du blueprint (classes CSS, couleurs, structures) mais remplace 100% du texte par les données issues de CvData.
- SI UNE DONNÉE MANQUE : Si une section est présente dans le blueprint mais vide dans CvData, supprime cette section du HTML final (sauf directive contraire pour l'enrichissement professionnel).
- SI TU DOIS créer UNE SECTION QUI N'EST PAS DE BASE DANS LA TEMPLATE , assure-toi que son design s'intègre parfaitement au style du template, en utilisant les formes et design existantes et les couleurs de la palette.
===========================================================================
RÈGLE LA PLUS IMPORTANTE (CRITIQUE POUR LA QUALITÉ DU RÉSULTAT)
===========================================================================
-TOUTE PREMIÈRE RÈGLE : TU AS LE DROIT D’ALLER JUSQU’À 900 LIGNES DE CODE HTML ET CSS COMBINÉES POUR RESPECTER LE DESIGN ET LA STRUCTURE DU TEMPLATE (CRITIQUE ET STRICT).
-SI la template na pas reservé de place pour la photo , ignore la variable photoUrl et ne génère pas d'élément <img> (CRITIQUE ET STRICT).
- Génère un CV en respectant strictement la structure, le design, les espacements, la typographie et la hiérarchie visuelle du blueprint fourni.
- Tu as la liberté de supprimer les blocs ou balises si les données sont absentes, mais tu dois impérativement respecter au moins 80% de la structure HTML et du design CSS fournis, sans altérer les classes et les styles fondamentaux.
- Ne supprime pas des informations dans les expériences (lien de projet, durée, etc.) ni dans les autres sections. Si le contenu est trop long pour tenir sur une page, condense les descriptions.
- Utilise toujours les icônes Font Awesome pour les contacts et, si nécessaire, dans les expériences (liens de projet), en respectant la palette du blueprint.
- Intègre tous les liens (contact et projets) dans des balises <a> fonctionnelles avec le style text-decoration: none; color: inherit (TOUJOURS ET STRICT), et affiche toujours le lien à côté de l'icône (format lisible pour version papier, éventuellement raccourci).
- Ne supprime aucune information pertinente (durée, liens, détails d'expérience, etc.).
- Pas de raccourcissement inutile des informations personnelles (experiences, compétences).
- Assure une intégration visuelle harmonieuse des icônes (couleurs, tailles, cohérence CSS) et évite toute couleur bleue par défaut des liens.
- Assure une cohérence visuelle absolue en harmonisant les alignements, les espacements (paddings/margins) et la hiérarchie typographique pour que le rendu final soit parfaitement équilibré, symétrique et digne d'un design professionnel haut de gamme.
- EN CAS DE COLONNES PRESENTES : L'arrière-plan des colonnes doit impérativement s'étendre en aplat de couleur continu jusqu'au bord inférieur de la page A4, sans aucune marge blanche. Utilise la technique blueprint.layout.techniqueFullHeight.(CRITIQUE POUR LA QUALITÉ DU RÉSULTAT)
-Dans le cas ou il y'a plusieurs numero de telephone ou adresse email, assure toi de les afficher tous en respectant les directives d'iconographie et de liens, et en maintenant une présentation claire et professionnelle.
====================================
DIRECTIVES ICONOGRAPHIE (STRICT)
====================================
- INTERDICTION FORMELLE d'utiliser des emojis (ex: 📱, 📧, 📍). Si l'utilisateur fournit des emojis dans ses données, SUPPRIME-LES systématiquement.
- Utilise EXCLUSIVEMENT les balises Font Awesome (version indiquée dans blueprint.fontAwesome).
  Téléphone : <i class='fas fa-phone'></i>
  Email : <i class='fas fa-envelope'></i>
  Adresse : <i class='fas fa-map-marker-alt'></i>
  LinkedIn : <i class='fab fa-linkedin'></i>
  Site/Lien : <i class='fas fa-globe'></i>
  GitHub : <i class='fab fa-github'></i>
- Assure-toi que les icônes sont insérées juste avant le texte correspondant.
- Pour chaque icône cliquable (contact ou projet), encapsule-la dans un lien hypertexte fonctionnel avec le style : style='text-decoration: none; color: inherit;'
- Pour les liens longs (LinkedIn, GitHub, etc.), affiche uniquement le domaine + chemin court (ex: linkedin.com/in/username) à côté de l'icône pour la version papier.
- Mets systématiquement le lien textuel à côté de l'icône pour les versions papier (contacts ET liens de projet dans les expériences).
- Utilise blueprint.contact.structureHtml comme modèle exact pour chaque item de contact.
- N'hésites pas à ajouter des icônes là où c'est approprié pour améliorer la clarté visuelle.

==============================
GESTION DE LA PHOTO (STRICT)
==============================
- Utilise la variable photoUrl pour la balise <img>.
- Si photoUrl est vide, null ou contient 'no-photo' : supprimer l'élément <img> et son conteneur parent.
- Si présente : applique les styles exacts de blueprint.photo.styles (object-fit: cover inclus).
- la photo doit être parfaitement intégrée et bien centrée au design, avec la forme (ronde/carrée/ovale) définie dans blueprint.photo.forme.

========================
OPTIMISATION DU CONTENU EN CAS DE DONNÉES LIMITÉES (CRITIQUE)
========================
Tu dois produire un CV visuellement riche et professionnel, même lorsque les informations sont limitées.
1. Mise en valeur intelligente : reformule et développe légèrement les informations existantes pour leur donner plus d'impact (sans inventer de faits).
2. Équilibrage visuel : ajuste la longueur des textes et l'espacement pour éviter les zones vides visibles.
3. Exploitation maximale : si certaines sections sont peu remplies, valorise davantage celles qui contiennent des informations.
4. Suppression stratégique : supprime complètement les sections vides plutôt que de laisser des espaces inutiles. Ne jamais afficher une section sans contenu.
5. Enrichissement autorisé (sans invention) : tu peux préciser, reformuler ou détailler une information existante. INTERDICTION ABSOLUE d'inventer une expérience, une entreprise, une date ou une compétence non fournie.
6. Objectif final : le CV doit paraître complet, structuré et professionnel.

RÈGLE FINALE : masque intelligemment le manque de contenu par la qualité de la rédaction, la structure et la mise en page — sans jamais inventer d'informations.

==============================================
GESTION DES SECTIONS VIDES (NETTOYAGE RADICAL)
==============================================
- Si une propriété de CvData est vide : supprimer ENTIÈREMENT le bloc HTML lié.
- Supprimer les titres de sections si aucune donnée n'est présente dans cette catégorie.

==================================================
CONTRAINTES PDF (Playwright/Chromium)
==================================================
- Format A4 (210mm x 297mm).
- AUTORISÉ : Flexbox, CSS Grid, toutes les propriétés CSS modernes.
- Conteneur principal : width:210mm; min-height:297mm; margin:0; padding:0; box-shadow:none;
- <body> : margin:0; padding:0; background-color:transparent;
- Google Fonts : autorisé via <link> dans le <head> si le template en utilise.
- Icones Font Awesome : autorisées via le lien CDN.(OBLIGATOIRE)
- page-break-inside:avoid sur les blocs d'expérience.
- PrintBackground activé : les couleurs de fond sont rendues fidèlement.
- Unités : mm, px, rem, % — tout est supporté.

===================
DÉTECTION DE LANGUE
===================
Analyse la langue utilisée par l'utilisateur dans sa saisie. Le CV généré doit être intégralement rédigé dans cette même langue.

================================================================
RÈGLES DE RENDU VISUEL (CRITIQUE POUR L'EXPÉRIENCE UTILISATEUR)
================================================================
- Le CV doit occuper TOUTE la surface de la page PDF, bord à bord, sans marge extérieure, sans fond gris, sans ombre.
- La balise <body> doit avoir : margin: 0; padding: 0; background-color: transparent;
- Le conteneur principal du CV doit avoir : width: 210mm; min-height: 297mm; margin: 0; padding: 0; box-shadow: none;
- INTERDICTION d'ajouter un fond coloré sur le <body> ou une ombre (box-shadow) autour du conteneur principal.

===================================================================
INSTRUCTION DE STRUCTURATION VISUELLE (IMPORTANT)
===================================================================
- Reproduis EXACTEMENT chaque décoration listée dans blueprint.decorations avec son style CSS exact.
- Toutes les bordures et lignes doivent impérativement utiliser les codes couleurs de blueprint.palette.(STRICT)

=============================================================
RÈGLES DE DESIGN & DE RÉDACTION (IMPORTANT)
=============================================================
- Langues : niveau en texte uniquement (ex: 'Anglais : Courant').
- Couleurs autorisées UNIQUEMENT si dans blueprint.palette.
- INTERDICTION d'utiliser des balises <link> pour le CSS interne. Tout le style doit être dans le bloc <style>.
- Exception : utilise blueprint.fontAwesome.cdnLink dans le <head> pour Font Awesome.(OBLIGATOIRE)
- Exception : utilise le lien Google Fonts du template si présent dans blueprint.

====================================
RÈGLES DE STRUCTURE JSON (CRITIQUE)
====================================
- Formation, Experiences et Skills DOIVENT être des tableaux JSON de chaînes de caractères.
- Si une section est vide, renvoie un tableau vide [] et non null.
- Le champ Languages doit être une chaîne de caractères unique (string).
- INTERDICTION de renvoyer des objets {{}} pour les champs de texte.

================================================================
AUTO-VÉRIFICATION OBLIGATOIRE AVANT SORTIE
================================================================
□ Toutes les données CvData intégrées (expériences, formations, liens, contacts, etc.).
□ Toutes les décorations de blueprint.decorations reproduites avec leur style exact.
□ Icônes Font Awesome présentes dans la section contact (modèle blueprint.contact.structureHtml respecté).
□ Lien textuel affiché à côté de chaque icône (contacts ET projets).
□ Colonnes pleine hauteur selon blueprint.layout.techniqueFullHeight.
□ Aucun emoji, aucune information inventée.
□ HTML valide, CSS valide, JSON valide, tous les liens correctement formés.
□ Cohérence visuelle : alignements, espacements, typographie harmonisés.
□ blueprint.cssComplet injecté dans <style>, blueprint.fontAwesome.cdnLink dans <head>.

→ Si tu détectes la moindre non-conformité, corrige immédiatement avant de produire la réponse finale.
RÈGLE FINALE : tu ne dois renvoyer QUE la version finale corrigée et conforme. Aucune explication, aucun commentaire, uniquement le résultat final.

========================
CONTRAINTE DE SÉRIALISATION JSON (CRITIQUE)
========================
1. Tous les champs texte DOIVENT être des chaînes de caractères simples.
2. INTERDICTION ABSOLUE de renvoyer un objet JSON ({{{{}}}}) ou un tableau ([]) à la place d'un texte. Seuls Formation, Experiences et Skills peuvent être des tableaux.

=====================================
RÈGLE D'ÉCHAPPEMENT JSON (CRITIQUE) :
=====================================
- Dans la valeur de finalHtml, tous les guillemets doubles doivent être échappés en \"".
- Tous les retours à la ligne doivent être remplacés par \n.
- Utilise des guillemets simples (') pour TOUS les attributs HTML (class='', id='', style='').
- N'utilise JAMAIS de guillemets doubles dans le HTML généré, même pour les attributs.

====================================
FORMAT DE SORTIE (CONTRAT TECHNIQUE)
====================================
Retourner UNIQUEMENT un JSON valide. Pas de texte de présentation. Pas de markdown.

{{
  ""finalHtml"": ""<!DOCTYPE html><html>...</html>"",
  ""updatedData"": {{ ... }}
}}
";

            // ✅ Point 3 — Endpoint streaming SSE
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:streamGenerateContent?alt=sse&key={_apiKey}";

            var requestBody = new
            {
                systemInstruction = new
                {
                    parts = new[] { new { text = systemInstruction } }
                },
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[]
                        {
                            new { text = $"Voici les données utilisateur au format JSON à traiter :\n{JsonSerializer.Serialize(currentData)}" }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.2f,
                    topP = 0.8f,
                    topK = 20,
                    maxOutputTokens = 8192
                }
            };

            // ✅ Requête streaming avec retry
            var response = await SendStreamingRequestAsync(url, requestBody);

            // ✅ Lecture du flux SSE et reconstitution du texte complet
            string rawJson = await ReadStreamingResponseAsync(response);

            if (string.IsNullOrEmpty(rawJson))
                throw new Exception("L'IA a renvoyé une réponse vide.");

            rawJson = CleanJsonString(rawJson);

            // ✅ Ajout : vérifier que le JSON est parseable avant tout
            if (rawJson == "{}" || rawJson.Length < 50)
                throw new Exception("La génération a produit une réponse incomplète. Veuillez réessayer.");

            JsonDocument doc;
            try
            {
                doc = JsonDocument.Parse(rawJson);
            }
            catch (JsonException ex)
            {
                throw new Exception($"Réponse IA mal formée. Veuillez réessayer. (Détail : {ex.Message})");
            }
            using (doc)
            {
                var root = doc.RootElement;

                if (!root.TryGetProperty("finalHtml", out var htmlProp))
                    throw new Exception("La réponse IA ne contient pas le HTML final. Veuillez réessayer.");

                var htmlContent = htmlProp.GetString() ?? "";
                if (string.IsNullOrWhiteSpace(htmlContent))
                    throw new Exception("Le HTML généré est vide. Veuillez réessayer.");

                // ✅ AJOUT : vérifier que le HTML est vraiment complet
                if (!htmlContent.TrimEnd().EndsWith("</html>", StringComparison.OrdinalIgnoreCase))
                    throw new Exception("Le HTML généré est incomplet (réponse tronquée). Veuillez réessayer.");

                CvData? updatedData = null;
                if (root.TryGetProperty("updatedData", out var updatedDataElement)
                    && updatedDataElement.ValueKind == JsonValueKind.Object
                    && updatedDataElement.EnumerateObject().Any())
                {
                    try
                    {
                        var deserialized = JsonSerializer.Deserialize<CvData>(updatedDataElement.GetRawText());
                        if (deserialized != null && !string.IsNullOrEmpty(deserialized.FullName))
                            updatedData = deserialized;
                    }
                    catch { updatedData = null; }
                }

                return new CvGenerationResult(updatedData ?? currentData, htmlContent);
            }
              }

        // ============================================================
        // POINT 3 — ENVOI STREAMING AVEC RETRY
        // ============================================================

            /// <summary>
            /// Envoie la requête en mode streaming avec retry + exponential backoff.
            /// HttpCompletionOption.ResponseHeadersRead = Nginx reçoit les headers immédiatement → plus de 504.
            /// </summary>
        private async Task<HttpResponseMessage> SendStreamingRequestAsync(string url, object requestBody)
        {
            int maxRetries = 4;
            int[] backoffSeconds = { 2, 5, 15, 40 };

            for (int attempt = 0; attempt <= maxRetries; attempt++)
            {
                try
                {
                    var request = new HttpRequestMessage(HttpMethod.Post, url)
                    {
                        Content = JsonContent.Create(requestBody)
                    };

                    // ✅ ResponseHeadersRead = commence à lire dès que les headers arrivent
                    var response = await _httpClient.SendAsync(
                        request,
                        HttpCompletionOption.ResponseHeadersRead);

                    if (response.IsSuccessStatusCode)
                        return response;

                    if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests ||
                        response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable ||
                        response.StatusCode == System.Net.HttpStatusCode.InternalServerError)
                    {
                        if (attempt == maxRetries)
                            throw new Exception("Le service de génération est momentanément indisponible. Veuillez réessayer.");

                        await Task.Delay(TimeSpan.FromSeconds(backoffSeconds[attempt]));
                        continue;
                    }

                    string errorMsg = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Erreur API Gemini : {response.StatusCode} - {errorMsg}");
                }
                catch (TaskCanceledException)
                {
                    if (attempt == maxRetries)
                        throw new Exception("Le service de génération ne répond pas. Veuillez réessayer.");

                    await Task.Delay(TimeSpan.FromSeconds(backoffSeconds[attempt]));
                }
                catch (HttpRequestException)
                {
                    if (attempt == maxRetries)
                        throw new Exception("Erreur de connexion au service de génération. Veuillez réessayer.");

                    await Task.Delay(TimeSpan.FromSeconds(backoffSeconds[attempt]));
                }
            }

            throw new Exception("Erreur inattendue lors de la génération.");
        }

        /// <summary>
        /// Lit le flux SSE de Gemini et reconstitue le texte complet.
        /// Chaque ligne SSE : data: {"candidates":[{"content":{"parts":[{"text":"..."}]}}]}
        /// </summary>
        private async Task<string> ReadStreamingResponseAsync(HttpResponseMessage response)
        {
            var fullText = new System.Text.StringBuilder();

            using var stream = await response.Content.ReadAsStreamAsync();
            using var reader = new System.IO.StreamReader(stream);

            while (!reader.EndOfStream)
            {
                string? line = await reader.ReadLineAsync();

                if (string.IsNullOrWhiteSpace(line))
                    continue;

                // Les lignes SSE commencent par "data: "
                if (!line.StartsWith("data: "))
                    continue;

                string jsonChunk = line.Substring(6).Trim();

                // Fin du stream SSE
                if (jsonChunk == "[DONE]")
                    break;

                try
                {
                    using var chunkDoc = JsonDocument.Parse(jsonChunk);
                    var chunkRoot = chunkDoc.RootElement;

                    var text = chunkRoot
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();

                    if (!string.IsNullOrEmpty(text))
                        fullText.Append(text);
                }
                catch
                {
                    // Chunk mal formé → on ignore et on continue
                    continue;
                }
            }

            return fullText.ToString();
        }

        // ============================================================
        // POINT 1 — RETRY INTELLIGENT (pour AnalyseTemplateAsync)
        // ============================================================

        private async Task<HttpResponseMessage> SendWithRetryAsync(string url, object requestBody)
        {
            int maxRetries = 4;
            int[] backoffSeconds = { 2, 5, 15, 40 };

            HttpResponseMessage? response = null;

            for (int attempt = 0; attempt <= maxRetries; attempt++)
            {
                try
                {
                    response = await _httpClient.PostAsJsonAsync(url, requestBody);
                }
                catch (TaskCanceledException)
                {
                    if (attempt == maxRetries)
                        throw new Exception("Le service de génération ne répond pas. Veuillez réessayer dans quelques instants.");

                    await Task.Delay(TimeSpan.FromSeconds(backoffSeconds[attempt]));
                    continue;
                }
                catch (HttpRequestException)
                {
                    if (attempt == maxRetries)
                        throw new Exception("Erreur de connexion au service de génération. Veuillez réessayer.");

                    await Task.Delay(TimeSpan.FromSeconds(backoffSeconds[attempt]));
                    continue;
                }

                // ✅ Succès
                if (response.IsSuccessStatusCode)
                    return response;

                // 429 — Too Many Requests
                if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                {
                    if (attempt == maxRetries)
                        throw new Exception("Le service de génération est momentanément saturé. Veuillez réessayer dans quelques instants.");

                    int retrySeconds = 60;
                    try
                    {
                        string rawError = await response.Content.ReadAsStringAsync();
                        using var errorDoc = JsonDocument.Parse(rawError);
                        var retryDelayStr = errorDoc.RootElement
                            .GetProperty("error")
                            .GetProperty("details")
                            .EnumerateArray()
                            .Where(d => d.TryGetProperty("retryDelay", out _))
                            .Select(d => d.GetProperty("retryDelay").GetString())
                            .FirstOrDefault();

                        if (retryDelayStr != null)
                        {
                            string secondsStr = retryDelayStr.TrimEnd('s').Split('.')[0];
                            if (int.TryParse(secondsStr, out int parsed))
                                retrySeconds = Math.Min(parsed + 2, 120);
                        }
                    }
                    catch { }

                    int waitSeconds = Math.Max(retrySeconds, backoffSeconds[attempt]);
                    await Task.Delay(TimeSpan.FromSeconds(waitSeconds));
                    continue;
                }

                // 503 — Service Unavailable
                if (response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable)
                {
                    if (attempt == maxRetries)
                        throw new Exception("Le service de génération est temporairement indisponible. Veuillez réessayer dans quelques instants.");

                    await Task.Delay(TimeSpan.FromSeconds(backoffSeconds[attempt]));
                    continue;
                }

                // 500 — Internal Server Error
                if (response.StatusCode == System.Net.HttpStatusCode.InternalServerError)
                {
                    if (attempt == maxRetries)
                        throw new Exception("Une erreur interne est survenue. Veuillez réessayer.");

                    await Task.Delay(TimeSpan.FromSeconds(backoffSeconds[attempt]));
                    continue;
                }

                // Autre erreur non récupérable → stop immédiat
                string errorMsg = await response.Content.ReadAsStringAsync();
                throw new Exception($"Erreur API Gemini : {response.StatusCode} - {errorMsg}");
            }

            throw new Exception("Erreur inattendue lors de la génération.");
        }

        // ============================================================
        // UTILITAIRES
        // ============================================================

        private string CleanJsonString(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return "{}";

            if (input.Contains("```"))
            {
                int codeStart = input.IndexOf("```");
                int firstNewline = input.IndexOf('\n', codeStart);
                if (firstNewline != -1)
                    input = input.Substring(firstNewline + 1);

                int codeEnd = input.LastIndexOf("```");
                if (codeEnd != -1)
                    input = input.Substring(0, codeEnd);

                input = input.Trim();
            }

            int start = input.IndexOf('{');
            if (start == -1) return "{}";

            int depth = 0;
            bool inString = false;
            bool escape = false;

            for (int i = start; i < input.Length; i++)
            {
                char c = input[i];

                if (escape) { escape = false; continue; }
                if (c == '\\' && inString) { escape = true; continue; }
                if (c == '"') { inString = !inString; continue; }
                if (inString) continue;

                if (c == '{') depth++;
                else if (c == '}')
                {
                    depth--;
                    if (depth == 0)
                        return input.Substring(start, (i - start) + 1);
                    if (depth < 0) break;
                }
            }

            return TryExtractHtmlFromTruncatedJson(input.Substring(start));
        }

        private string TryExtractHtmlFromTruncatedJson(string truncatedJson)
        {
            try
            {
                int htmlKeyIdx = truncatedJson.IndexOf("\"finalHtml\"");
                if (htmlKeyIdx == -1) return "{}";

                int htmlValueStart = truncatedJson.IndexOf('"', htmlKeyIdx + 11) + 1;
                if (htmlValueStart == 0) return "{}";

                var sb = new System.Text.StringBuilder();
                bool esc = false;

                for (int i = htmlValueStart; i < truncatedJson.Length; i++)
                {
                    char c = truncatedJson[i];
                    if (esc) { sb.Append(c); esc = false; continue; }
                    if (c == '\\') { esc = true; continue; }
                    if (c == '"') break;
                    sb.Append(c);
                }

                string extractedHtml = sb.ToString()
                    .Replace("\\n", "\n")
                    .Replace("\\t", "\t")
                    .Replace("\\'", "'");

                return "{\"finalHtml\":" + JsonSerializer.Serialize(extractedHtml) + ",\"updatedData\":{}}";
            }
            catch
            {
                return "{}";
            }
        }
    }

    public class GeminiResponse
    {
        public List<Candidate> Candidates { get; set; } = new();
    }

    public class Candidate
    {
        public Content Content { get; set; } = new();
    }

    public class Content
    {
        public List<Part> Parts { get; set; } = new();
    }

    public class Part
    {
        public string Text { get; set; } = "";
    }
}