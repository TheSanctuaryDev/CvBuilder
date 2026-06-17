namespace CvBuilderApp.Models
{
    public class CvTemplate
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? PreviewImage { get; set; }
        public bool IsPremium { get; set; }
        public string? TemplateKey { get; set; }
        public string? HtmlContent { get; set; }
    }
}
