using Microsoft.UI.Xaml;

namespace PandaLcarsTactical.Browser;

public interface IEmbeddedBrowser : IDisposable
{
    FrameworkElement View { get; }
    string? Source { get; }
    bool CanGoBack { get; }
    event Action<string>? StatusChanged;
    Task InitializeAsync();
    void Navigate(string url);
    void GoBack();
    void Reload();
    void Stop();
}
