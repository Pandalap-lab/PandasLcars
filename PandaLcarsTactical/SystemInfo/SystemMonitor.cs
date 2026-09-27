using System.Diagnostics;
using System.Net.NetworkInformation;
using System.Runtime.InteropServices;

namespace PandaLcarsTactical.SystemInfo;

public sealed record SystemSnapshot(double? Cpu, double? Ram, double? RamUsedGb, double? RamTotalGb,
    string DiskName, double? Disk, double? DiskUsedGb, double? DiskTotalGb, double? Gpu,
    double? DownloadMbps, double? UploadMbps, double? Battery, string Power, DateTimeOffset SampledAt);

// Read-only Windows counters; no administrator privileges or third-party service required.
public sealed class SystemMonitor : IDisposable
{
    private ulong idle, kernel, user;
    private bool cpuReady;
    private long lastNetworkTime;
    private Dictionary<string, (long Down, long Up)> previousNetwork = new();
    private IntPtr gpuQuery, gpuCounter;
    private bool gpuPrimed;
    public SystemMonitor()
    {
        if (PdhOpenQuery(null, IntPtr.Zero, out gpuQuery) == 0 &&
            PdhAddEnglishCounter(gpuQuery, @"\GPU Engine(*)\Utilization Percentage", IntPtr.Zero, out gpuCounter) == 0)
            gpuPrimed = PdhCollectQueryData(gpuQuery) == 0;
    }
    public SystemSnapshot Read()
    {
        double? cpu = null, ram = null, usedRam = null, totalRam = null, disk = null, usedDisk = null, totalDisk = null;
        if (GetSystemTimes(out var nextIdle, out var nextKernel, out var nextUser))
        {
            if (cpuReady && nextKernel >= kernel && nextUser >= user && nextIdle >= idle)
            {
                var total = nextKernel - kernel + nextUser - user;
                if (total > 0) cpu = Math.Clamp(100.0 * (1 - (double)(nextIdle - idle) / total), 0, 100);
            }
            idle = nextIdle; kernel = nextKernel; user = nextUser; cpuReady = true;
        }
        var memory = new MemoryStatus { Length = (uint)Marshal.SizeOf<MemoryStatus>() };
        if (GlobalMemoryStatusEx(ref memory) && memory.TotalPhysical > 0)
        {
            totalRam = memory.TotalPhysical / 1073741824.0;
            usedRam = (memory.TotalPhysical - memory.AvailablePhysical) / 1073741824.0;
            ram = 100 * usedRam / totalRam;
        }
        var root = Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.Windows)) ?? "C:\\";
        try
        {
            var drive = new DriveInfo(root);
            if (drive.IsReady && drive.TotalSize > 0)
            {
                totalDisk = drive.TotalSize / 1073741824.0; usedDisk = (drive.TotalSize - drive.TotalFreeSpace) / 1073741824.0;
                disk = 100 * usedDisk / totalDisk;
            }
        }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
        var network = ReadNetwork();
        double? battery = null; var power = "Nicht verfügbar";
        if (GetSystemPowerStatus(out var status))
        {
            if (status.BatteryFlag == 255) power = "Status unbekannt";
            else if ((status.BatteryFlag & 128) != 0) power = "Kein Akku";
            else
            {
                if (status.BatteryLifePercent <= 100) battery = status.BatteryLifePercent;
                power = (status.BatteryFlag & 8) != 0 ? "Wird geladen" : status.AcLineStatus == 1 ? "Netzbetrieb" : status.AcLineStatus == 0 ? "Akkubetrieb" : "Status unbekannt";
            }
        }
        return new(cpu, ram, usedRam, totalRam, root.TrimEnd('\\'), disk, usedDisk, totalDisk,
            ReadGpu(), network.Down, network.Up, battery, power, DateTimeOffset.Now);
    }
    private (double? Down, double? Up) ReadNetwork()
    {
        try
        {
            var now = Stopwatch.GetTimestamp();
            var current = new Dictionary<string, (long Down, long Up)>();
            long down = 0, up = 0;
            foreach (var adapter in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (adapter.OperationalStatus != OperationalStatus.Up ||
                    adapter.NetworkInterfaceType is not (NetworkInterfaceType.Ethernet or NetworkInterfaceType.Wireless80211)) continue;
                try
                {
                    var stats = adapter.GetIPStatistics();
                    current[adapter.Id] = (stats.BytesReceived, stats.BytesSent);
                    if (previousNetwork.TryGetValue(adapter.Id, out var old))
                    {
                        down += Math.Max(0, stats.BytesReceived - old.Down); up += Math.Max(0, stats.BytesSent - old.Up);
                    }
                }
                catch (NetworkInformationException) { }
            }
            var elapsed = (now - lastNetworkTime) / (double)Stopwatch.Frequency;
            bool ready = lastNetworkTime != 0 && elapsed > 0;
            previousNetwork = current; lastNetworkTime = now;
            return ready ? (down * 8 / elapsed / 1000000, up * 8 / elapsed / 1000000) : (null, null);
        }
        catch (NetworkInformationException) { previousNetwork.Clear(); lastNetworkTime = 0; return (null, null); }
    }
    private double? ReadGpu()
    {
        if (gpuCounter == IntPtr.Zero) return null;
        var collected = PdhCollectQueryData(gpuQuery) == 0;
        if (!collected || !gpuPrimed) { gpuPrimed = collected; return null; }
        uint bytes = 0, count = 0;
        const uint format = 0x200 | 0x8000; // DOUBLE | NOCAP100; sum processes per physical engine below.
        if (PdhGetFormattedCounterArray(gpuCounter, format, ref bytes, out count, IntPtr.Zero) != 0x800007D2 || bytes == 0 || bytes > 16000000) return null;
        var buffer = Marshal.AllocHGlobal((int)bytes);
        try
        {
            if (PdhGetFormattedCounterArray(gpuCounter, format, ref bytes, out count, buffer) != 0) return null;
            var engines = new Dictionary<string, double>();
            int size = Marshal.SizeOf<CounterItem>();
            for (int i = 0; i < count && (long)(i + 1) * size <= bytes; i++)
            {
                var item = Marshal.PtrToStructure<CounterItem>(IntPtr.Add(buffer, i * size));
                if (item.Value.Status > 1 || !double.IsFinite(item.Value.DoubleValue)) continue;
                var name = Marshal.PtrToStringUni(item.Name) ?? "";
                int luid = name.IndexOf("luid_", StringComparison.Ordinal);
                if (luid < 0) continue;
                var engine = name[luid..]; // Remove PID; retain adapter/physical-engine identity.
                engines[engine] = engines.GetValueOrDefault(engine) + Math.Max(0, item.Value.DoubleValue);
            }
            return engines.Count == 0 ? null : Math.Clamp(engines.Values.Max(), 0, 100);
        }
        finally { Marshal.FreeHGlobal(buffer); }
    }
    public void Dispose() { if (gpuQuery != IntPtr.Zero) PdhCloseQuery(gpuQuery); gpuQuery = gpuCounter = IntPtr.Zero; }
    [StructLayout(LayoutKind.Sequential)] private struct MemoryStatus
    {
        public uint Length, Load;
        public ulong TotalPhysical, AvailablePhysical, TotalPageFile, AvailablePageFile, TotalVirtual, AvailableVirtual, AvailableExtendedVirtual;
    }
    [StructLayout(LayoutKind.Sequential)] private struct PowerStatus
    {
        public byte AcLineStatus, BatteryFlag, BatteryLifePercent, SystemStatusFlag;
        public uint BatteryLifeTime, BatteryFullLifeTime;
    }
    [StructLayout(LayoutKind.Explicit, Size = 16)] private struct CounterValue
    {
        [FieldOffset(0)] public uint Status;
        [FieldOffset(8)] public double DoubleValue;
    }
    [StructLayout(LayoutKind.Sequential)] private struct CounterItem { public IntPtr Name; public CounterValue Value; }
    [DllImport("kernel32.dll")] [return: MarshalAs(UnmanagedType.Bool)] private static extern bool GetSystemTimes(out ulong idle, out ulong kernel, out ulong user);
    [DllImport("kernel32.dll")] [return: MarshalAs(UnmanagedType.Bool)] private static extern bool GlobalMemoryStatusEx(ref MemoryStatus memory);
    [DllImport("kernel32.dll")] [return: MarshalAs(UnmanagedType.Bool)] private static extern bool GetSystemPowerStatus(out PowerStatus status);
    [DllImport("pdh.dll", CharSet = CharSet.Unicode, EntryPoint = "PdhOpenQueryW")] private static extern uint PdhOpenQuery(string? source, IntPtr data, out IntPtr query);
    [DllImport("pdh.dll", CharSet = CharSet.Unicode, EntryPoint = "PdhAddEnglishCounterW")] private static extern uint PdhAddEnglishCounter(IntPtr query, string path, IntPtr data, out IntPtr counter);
    [DllImport("pdh.dll")] private static extern uint PdhCollectQueryData(IntPtr query);
    [DllImport("pdh.dll", EntryPoint = "PdhGetFormattedCounterArrayW")] private static extern uint PdhGetFormattedCounterArray(IntPtr counter, uint format, ref uint bytes, out uint count, IntPtr buffer);
    [DllImport("pdh.dll")] private static extern uint PdhCloseQuery(IntPtr query);
}
