using System.Diagnostics;
using Microsoft.Win32;
using PandaLcarsTactical.QuickLaunch;

namespace PandaLcarsTactical.Browser;

public static class FirefoxLauncher
{
    public static Task<bool> OpenHomeAsync() => OpenAsync("about:home");
    public static Task<bool> OpenAsync(string url, PandaLcarsTactical.Settings.MonitorChoice? monitor = null, bool small = false)
    {
        var executable = Find() ?? throw new InvalidOperationException("Firefox nicht gefunden. Bitte Firefox installieren.");
        var normalized = url == "about:home" ? url : LinkStore.NormalizeUrl(url);
        return ExternalWindows.LaunchAsync("firefox", () => {
            var start = new ProcessStartInfo(executable) { UseShellExecute = false };
            start.ArgumentList.Add("--new-window");start.ArgumentList.Add(normalized);
            Process.Start(start);return Task.CompletedTask;
        }, monitor, small);
    }
    public static string? Find()
    {
        foreach (var hive in new[] { RegistryHive.CurrentUser, RegistryHive.LocalMachine })
        foreach (var view in new[] { RegistryView.Registry64, RegistryView.Registry32 })
        {
            using var root = RegistryKey.OpenBaseKey(hive, view);
            using var key = root.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\firefox.exe");
            var path = (key?.GetValue(null) as string)?.Trim('"');
            if (path is not null && File.Exists(path)) return path;
        }
        foreach (var folder in new[] { Environment.SpecialFolder.ProgramFiles, Environment.SpecialFolder.ProgramFilesX86, Environment.SpecialFolder.LocalApplicationData })
        {
            var path = Path.Combine(Environment.GetFolderPath(folder), "Mozilla Firefox", "firefox.exe");
            if (File.Exists(path)) return path;
        }
        return null;
    }
}
