using System.Runtime.InteropServices;

namespace PandaLcarsTactical.SystemInfo;

public sealed record ActivitySnapshot(string Mode, DateTimeOffset Since, double IdleSeconds, double? Load, bool WarpRequested);

public sealed class ActivityStatus
{
    private string mode = "WORK";
    private DateTimeOffset since = DateTimeOffset.Now;
    private DateTimeOffset? busySince, calmSince;
    public bool WarpRequested { get; set; }
    public ActivitySnapshot Update(DateTimeOffset now, double idleSeconds, double? cpu, double? gpu)
    {
        double? load = cpu.HasValue || gpu.HasValue ? Math.Max(cpu ?? 0, gpu ?? 0) : null;
        busySince = load >= 75 ? busySince ?? now : null;
        calmSince = load < 55 || load is null ? calmSince ?? now : null;
        if (idleSeconds >= 180) WarpRequested = false;
        if (idleSeconds >= 180) { busySince = null; calmSince = null; }
        var next = idleSeconds >= 180 ? "STANDBY" :
            WarpRequested || busySince is { } busy && now - busy >= TimeSpan.FromSeconds(10) ||
            mode == "WARP" && (calmSince is null || now - calmSince < TimeSpan.FromSeconds(5)) ? "WARP" : "WORK";
        if (next != mode) { mode = next; since = now; }
        return new(mode, since, Math.Max(0, idleSeconds), load, WarpRequested);
    }
    public static double? ReadIdleSeconds()
    {
        var input = new LastInput { Size = (uint)Marshal.SizeOf<LastInput>() };
        return GetLastInputInfo(ref input) ? unchecked((uint)Environment.TickCount - input.Tick) / 1000.0 : null;
    }
    [StructLayout(LayoutKind.Sequential)] private struct LastInput { public uint Size, Tick; }
    [DllImport("user32.dll")] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetLastInputInfo(ref LastInput input);
}
