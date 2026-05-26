using Microsoft.Playwright;

namespace CvBuilderApp.Services
{
    public class PdfService : IAsyncDisposable
    {
        private IPlaywright? _playwright;
        private IBrowser? _browser;
        private readonly SemaphoreSlim _semaphore = new(1, 1);
        private bool _initialized = false;

        // Initialisation lazy — le navigateur démarre une seule fois
        private async Task EnsureInitializedAsync()
        {
            if (_initialized) return;

            await _semaphore.WaitAsync();
            try
            {
                if (_initialized) return;
                _playwright = await Playwright.CreateAsync();
                _browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
                {
                    Headless = true,
                    Args = new[]
                    {
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage" // important sur Linux/Docker
                    }
                });
                _initialized = true;
            }
            finally
            {
                _semaphore.Release();
            }
        }

        public async Task<byte[]> GeneratePdfFromHtmlAsync(string htmlContent)
        {
            await EnsureInitializedAsync();

            // Chaque PDF dans son propre contexte isolé
            var context = await _browser!.NewContextAsync();
            var page = await context.NewPageAsync();

            try
            {
                await page.SetContentAsync(htmlContent, new PageSetContentOptions
                {
                    // Attend que les polices et images soient chargées
                    WaitUntil = WaitUntilState.NetworkIdle,
                    Timeout = 30000
                });

                var pdfBytes = await page.PdfAsync(new PagePdfOptions
                {
                    Format = "A4",
                    PrintBackground = true,
                    Margin = new Margin
                    {
                        Top = "0",
                        Bottom = "0",
                        Left = "0",
                        Right = "0"
                    },
                    PreferCSSPageSize = true
                });

                return pdfBytes;
            }
            finally
            {
                await page.CloseAsync();
                await context.CloseAsync();
            }
        }

        // Synchrone pour compatibilité si tu en as besoin ailleurs
        public byte[] GeneratePdfFromHtml(string htmlContent)
            => GeneratePdfFromHtmlAsync(htmlContent).GetAwaiter().GetResult();

        public async ValueTask DisposeAsync()
        {
            if (_browser != null) await _browser.CloseAsync();
            _playwright?.Dispose();
        }
    }
}