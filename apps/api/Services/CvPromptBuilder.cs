using System.Text.Json;

namespace CvBuilderApi.Services;

public static class CvPromptBuilder
{
    public const string SystemPrompt = """
        Tu es un expert en rédaction de CV professionnels francophones.
        Tu reçois les données brutes d'un CV et tu dois les enrichir professionnellement.

        RÈGLES STRICTES :
        - Réponds UNIQUEMENT avec un JSON valide, aucun texte avant ni après
        - Respecte exactement la structure JSON fournie
        - Améliore le champ "summary" avec un profil professionnel percutant (3-5 phrases)
        - Reformule les expériences dans le champ "experience" de manière claire et valorisante
        - Reformule les formations dans le champ "formation" de manière claire
        - Laisse les champs "fullName", "emails", "phones", "address", "linkedIn", "gitHub" EXACTEMENT tels quels
        - Si un tableau est vide, laisse-le vide
        - La langue de sortie doit être le français
        """;

    public static string BuildUserPrompt(JsonElement cvData, string templateKey = "classic")
    {
        var raw = JsonSerializer.Serialize(cvData, new JsonSerializerOptions { WriteIndented = false });
        var styleHint = templateKey switch
        {
            "modern" => "\nStyle visuel : Modern — favorise un langage dynamique, des verbes d'action, des formulations concises et percutantes.",
            "minimal" => "\nStyle visuel : Minimal — favorise un langage sobre, direct et épuré, sans fioritures.",
            _ => ""
        };
        return $"""
            Voici les données brutes du CV :{styleHint}

            {raw}

            Enrichis ce CV et retourne UNIQUEMENT le JSON amélioré avec la même structure.
            """;
    }
}
