using System.Runtime.InteropServices;
using System.Text.Json;
using Microsoft.Win32;

namespace PandaLcarsTactical.Settings;

public sealed record MonitorChoice(string Id, string Name, int X, int Y, int Width, int Height, bool Primary);
public sealed class DisplaySettings
{
    private readonly string path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "display.json");
    public string? MonitorId { get; private set; }
    public bool Fullscreen { get; private set; } = true;
    public string? Warning { get; private set; }
    public DisplaySettings(string? settingsPath = null)
    {
        if (settingsPath is not null) path = settingsPath;
        try
        {
            if (!File.Exists(path)) return;
            using var json = JsonDocument.Parse(File.ReadAllText(path));
            MonitorId = json.RootElement.GetProperty("monitorId").GetString();
            Fullscreen = json.RootElement.GetProperty("fullscreen").GetBoolean();
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException or JsonException or KeyNotFoundException or InvalidOperationException)
        { Warning = "Bildschirmeinstellung konnte nicht gelesen werden."; }
    }
    public void Save(string? id, bool fullscreen)
    {
        AtomicFile.Write(path, JsonSerializer.Serialize(new { monitorId = id, fullscreen }));
        MonitorId = id; Fullscreen = fullscreen; Warning = null;
    }
    [System.Runtime.Versioning.SupportedOSPlatform("windows")]
    public static bool Autostart
    {
        get { using var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run"); return key?.GetValue("PandasLcars") is string; }
        set
        {
            using var key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run");
            if (value) key.SetValue("PandasLcars", "\"" + Environment.ProcessPath + "\" --autostart");
            else key.DeleteValue("PandasLcars", false);
        }
    }
    public static List<MonitorChoice> Monitors()
    {
        var result = new List<MonitorChoice>();
        EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero, (IntPtr handle, IntPtr dc, ref Rect rect, IntPtr data) =>
        {
            var info = new MonitorInfo { Size = Marshal.SizeOf<MonitorInfo>(), Device = "" };
            if (!GetMonitorInfo(handle, ref info)) return true;
            var device = new DisplayDevice { Size = Marshal.SizeOf<DisplayDevice>() };
            var id = info.Device;
            if (EnumDisplayDevices(info.Device, 0, ref device, 1) && !string.IsNullOrEmpty(device.DeviceId)) id = device.DeviceId;
            result.Add(new(id, info.Device.Replace(@"\\.\DISPLAY", "Monitor "), info.Bounds.Left, info.Bounds.Top,
                info.Bounds.Right - info.Bounds.Left, info.Bounds.Bottom - info.Bounds.Top, (info.Flags & 1) != 0));
            return true;
        }, IntPtr.Zero);
        return result.OrderBy(x => int.TryParse(x.Name.Replace("Monitor ", ""), out var n) ? n : int.MaxValue)
            .Select((m, i) => m with { Name = "Bildschirm " + (i + 1) + " · " + m.Name.Replace("Monitor ", "DISPLAY") }).ToList();
    }
    public MonitorChoice? Preferred(List<MonitorChoice> monitors) => MonitorId is null
        ? monitors.ElementAtOrDefault(2) : monitors.FirstOrDefault(x => x.Id == MonitorId);
    [StructLayout(LayoutKind.Sequential)] private struct Rect { public int Left, Top, Right, Bottom; }
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] private struct MonitorInfo
    { public int Size; public Rect Bounds, Work; public uint Flags; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string Device; }
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] private struct DisplayDevice
    { public int Size; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string Name; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string Description; public uint Flags; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string DeviceId; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string Key; }
    private delegate bool MonitorCallback(IntPtr monitor, IntPtr dc, ref Rect rect, IntPtr data);
    [DllImport("user32.dll")] private static extern bool EnumDisplayMonitors(IntPtr dc, IntPtr clip, MonitorCallback callback, IntPtr data);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern bool GetMonitorInfo(IntPtr monitor, ref MonitorInfo info);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern bool EnumDisplayDevices(string device, uint index, ref DisplayDevice info, uint flags);
}
