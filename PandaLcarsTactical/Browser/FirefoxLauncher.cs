using System.Diagnostics;
using Microsoft.Win32;
using PandaLcarsTactical.QuickLaunch;

namespace PandaLcarsTactical.Browser;

public static class FirefoxLauncher
{
    public static void OpenHome()
    {
        var executable = Find() ?? throw new InvalidOperationException("Firefox nicht gefunden. Bitte Firefox installieren.");
        Process.Start(new ProcessStartInfo(executable) { UseShellExecute = false });
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
    public static void Open(string url)
    {
        var executable = Find() ?? throw new InvalidOperationException("Firefox nicht gefunden. Bitte Firefox installieren oder den Link manuell kopieren.");
        var start = new ProcessStartInfo(executable) { UseShellExecute = false };
        start.ArgumentList.Add("-new-tab");
        start.ArgumentList.Add(LinkStore.NormalizeUrl(url));
        Process.Start(start);
    }
}
