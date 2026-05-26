using CvBuilderApp.Models;

namespace CvBuilderApp.Services
{
    /// <summary>
    /// Résultat de la génération contenant les données optimisées par l'IA 
    /// et le code HTML final injecté.
    /// </summary>
    public record CvGenerationResult(CvData Data, string HtmlContent);

    public interface ICvGeneratorService
    {
        /// <summary>
        /// Génère le contenu du CV en utilisant Gemini.
        /// </summary>
        /// <param name="currentData">Les données structurées du CV.</param>
        /// <param name="category">La catégorie du template (ex: "free", "premium").</param>
        /// <param name="templateId">L'identifiant du dossier du template (ex: "_mod-1").</param>
        /// <returns>Un objet contenant le JSON mis à jour et le HTML prêt pour le PDF.</returns>
        Task<CvGenerationResult> GenerateCvHtmlAsync(CvData currentData, string category, string templateId);
    }
}