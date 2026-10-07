using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;

namespace PandaLcarsTactical.Browser;

public sealed class TacticalBrowserView : Grid, IDisposable
{
    private readonly IEmbeddedBrowser browser;
    private readonly TextBlock status = new() { TextWrapping = TextWrapping.Wrap };
    private readonly TextBox address = new() { IsReadOnly = true, MinWidth = 160 };
    private readonly Button back = new() { Content = "← ZURÜCK", MinHeight = 40 };
    private bool disposed;
    public event Action? CloseRequested;
    public TacticalBrowserView(IEmbeddedBrowser browser, string name)
    {
        this.browser = browser;
        Background = new SolidColorBrush(Microsoft.UI.Colors.Black);
        Padding = new Thickness(10);
        RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
        var title = new TextBlock { Text = "TACTICAL WEB  //  " + name.ToUpperInvariant(), FontSize = 24, Foreground = new SolidColorBrush(Windows.UI.Color.FromArgb(255, 255, 173, 72)), Margin = new Thickness(8) };
        Children.Add(title);
        var toolbar = new Grid { ColumnSpacing = 8, Margin = new Thickness(0, 4, 0, 8) };
        for (int i = 0; i < 5; i++) toolbar.ColumnDefinitions.Add(new ColumnDefinition { Width = i == 2 ? new GridLength(1, GridUnitType.Star) : GridLength.Auto });
        var reload = new Button { Content = "↻ LADEN", MinHeight = 40 };
        var firefox = new Button { Content = "IN FIREFOX ÖFFNEN", MinHeight = 40 };
        var close = new Button { Content = "BACK", MinHeight = 40, Background = new SolidColorBrush(Windows.UI.Color.FromArgb(255, 255, 173, 72)), Foreground = new SolidColorBrush(Microsoft.UI.Colors.Black) };
        var controls = new FrameworkElement[] { back, reload, address, firefox, close };
        for (int i = 0; i < controls.Length; i++) { SetColumn(controls[i], i); toolbar.Children.Add(controls[i]); }
        SetRow(toolbar, 1); Children.Add(toolbar);
        status.Margin = new Thickness(8, 0, 8, 8); SetRow(status, 2); Children.Add(status);
        SetRow(browser.View, 3); Children.Add(browser.View);
        close.Click += (_, _) => CloseRequested?.Invoke();
        back.Click += (_, _) => browser.GoBack(); reload.Click += (_, _) => browser.Reload();
        firefox.Click += async (_, _) =>
        {
            try { if (!await FirefoxLauncher.OpenAsync(address.Text)) status.Text = "Firefox geöffnet; Fensterposition bitte prüfen."; }
            catch (Exception ex) when (ex is not OutOfMemoryException) { status.Text = ex.Message; }
        };
        browser.StatusChanged += UpdateStatus;
    }
    private void UpdateStatus(string text)
    {
        if (disposed) return;
        status.Text = text; back.IsEnabled = browser.CanGoBack;
        if (browser.Source is { } url) address.Text = url;
    }
    public async Task OpenAsync(string url)
    {
        address.Text = url; back.IsEnabled = false; status.Text = "TACTICAL Browser wird gestartet …";
        try { await browser.InitializeAsync(); if (!disposed) browser.Navigate(url); }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        { if (!disposed) status.Text = "Browser konnte nicht starten. Ansicht schließen und erneut versuchen oder in Firefox öffnen."; }
    }
    public void RetryFailedNavigation() { if (!disposed && browser is WebViewBrowser web) web.RetryFailedNavigation(); }
    public void Dispose() { disposed = true; browser.StatusChanged -= UpdateStatus; browser.Dispose(); }
}
