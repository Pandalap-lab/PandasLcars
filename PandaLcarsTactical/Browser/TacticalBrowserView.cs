using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;

namespace PandaLcarsTactical.Browser;

public sealed class TacticalBrowserView : Grid, IDisposable
{
    private readonly IEmbeddedBrowser browser;
    private readonly TextBlock status = new() { TextWrapping = TextWrapping.Wrap, FontSize = 12, Visibility = Visibility.Collapsed };
    private readonly TextBox address = new() { IsReadOnly = true, MinWidth = 60, MinHeight = 28, Height = 28, FontSize = 12, Padding = new Thickness(6, 2, 6, 2) };
    private readonly Button back = new() { Content = "←", MinHeight = 28 };
    private bool disposed;
    public event Action? CloseRequested;
    public TacticalBrowserView(IEmbeddedBrowser browser, string name, bool portal = false)
    {
        this.browser = browser;
        Background = new SolidColorBrush(Microsoft.UI.Colors.Black);
        Padding = new Thickness(4);
        RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
        var toolbar = new Grid { ColumnSpacing = 4, Margin = new Thickness(0, 0, 0, 4) };
        ToolTipService.SetToolTip(toolbar, name);
        for (int i = 0; i < 5; i++) toolbar.ColumnDefinitions.Add(new ColumnDefinition { Width = i == 2 ? new GridLength(1, GridUnitType.Star) : GridLength.Auto });
        var reload = new Button { Content = "↻" };
        var firefox = new Button { Content = "FIREFOX ↗" };
        var close = new Button { Content = portal ? "ZURÜCK ZU LCARS" : "BACK", Background = new SolidColorBrush(Windows.UI.Color.FromArgb(255, 255, 173, 72)), Foreground = new SolidColorBrush(Microsoft.UI.Colors.Black) };
        foreach (var button in new[] { back, reload, firefox, close })
        {
            button.FontSize = 12; button.MinHeight = 28; button.Height = 28;
            button.Padding = new Thickness(8, 2, 8, 2);
        }
        foreach (var (button, label) in new[] { (back, "Vorherige Webseite"), (reload, "Seite neu laden"), (firefox, "In Firefox öffnen"), (close, "Zurück zu LCARS") })
        {
            ToolTipService.SetToolTip(button, label);
            Microsoft.UI.Xaml.Automation.AutomationProperties.SetName(button, label);
        }
        Microsoft.UI.Xaml.Automation.AutomationProperties.SetName(address, "Aktuelle Webadresse");
        var controls = new FrameworkElement[] { back, reload, address, firefox, close };
        for (int i = 0; i < controls.Length; i++) { SetColumn(controls[i], i); toolbar.Children.Add(controls[i]); }
        Children.Add(toolbar);
        status.Margin = new Thickness(4, 0, 4, 4); SetRow(status, 1); Children.Add(status);
        SetRow(browser.View, 2); Children.Add(browser.View);
        close.Click += (_, _) => CloseRequested?.Invoke();
        back.Click += (_, _) => browser.GoBack(); reload.Click += (_, _) => browser.Reload();
        firefox.Click += async (_, _) =>
        {
            try { if (!await FirefoxLauncher.OpenAsync(address.Text)) ShowStatus("Firefox geöffnet; Fensterposition bitte prüfen."); }
            catch (Exception ex) when (ex is not OutOfMemoryException) { ShowStatus(ex.Message); }
        };
        browser.StatusChanged += UpdateStatus;
    }
    private void UpdateStatus(string text)
    {
        if (disposed) return;
        ShowStatus(text); back.IsEnabled = browser.CanGoBack;
        if (browser.Source is { } url) address.Text = url;
    }
    private void ShowStatus(string text)
    {
        if (disposed) return;
        status.Text = text;
        // Routine loading/ready messages need no permanent extra browser row.
        status.Visibility = text is "Bereit" or "Navigation bereit" or "Lädt …" or "TACTICAL Browser wird gestartet …"
            ? Visibility.Collapsed : Visibility.Visible;
        ToolTipService.SetToolTip(address, address.Text + "\n" + text);
    }
    public async Task OpenAsync(string url)
    {
        address.Text = url; back.IsEnabled = false; ShowStatus("TACTICAL Browser wird gestartet …");
        try { await browser.InitializeAsync(); if (!disposed) browser.Navigate(url); }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        { if (!disposed) ShowStatus("Browser konnte nicht starten. Ansicht schließen und erneut versuchen oder in Firefox öffnen."); }
    }
    public void RetryFailedNavigation() { if (!disposed && browser is WebViewBrowser web) web.RetryFailedNavigation(); }
    public void Dispose() { disposed = true; browser.StatusChanged -= UpdateStatus; browser.Dispose(); }
}
