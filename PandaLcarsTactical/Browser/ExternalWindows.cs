using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using PandaLcarsTactical.Settings;

namespace PandaLcarsTactical.Browser;

// Only place the window created or activated by the user's launch action.
// Never terminate a browser or move unrelated windows of the same application.
public static class ExternalWindows
{
    private static readonly SemaphoreSlim launches = new(1);
    public static MonitorChoice? UpperMonitor(List<MonitorChoice> monitors) =>
        monitors.Where(m => !m.Primary && m.Y < (monitors.FirstOrDefault(x=>x.Primary)?.Y ?? 0))
            .OrderBy(m=>m.Y).ThenBy(m=>Math.Abs(m.X)).FirstOrDefault()
        ?? monitors.FirstOrDefault(m=>m.Primary);

    public static async Task<bool> LaunchAsync(string application, Func<Task> launch, MonitorChoice? monitor = null, bool small = false)
    {
        await launches.WaitAsync();
        try
        {
            var before = Windows(application);
            await launch();
            monitor ??= UpperMonitor(DisplaySettings.Monitors());
            if (monitor is null) return false;
            for(int i=0;i<40;i++)
            {
                await Task.Delay(200);
                var current=Windows(application);
                var handle=current.FirstOrDefault(h=>!before.Contains(h));
                // URI activations can reuse an existing foreground window.
                if(handle==IntPtr.Zero && i>=5 && !small && application!="firefox")
                { var foreground=GetForegroundWindow(); if(current.Contains(foreground))handle=foreground; }
                if(handle==IntPtr.Zero)continue;
                if(IsIconic(handle)||IsZoomed(handle))ShowWindow(handle,9);
                var width=Math.Min(monitor.Width-40,small?Math.Max(640,(int)(monitor.Width*.68)):Math.Max(800,(int)(monitor.Width*.85)));
                var height=Math.Min(monitor.Height-70,small?Math.Max(440,(int)(monitor.Height*.72)):Math.Max(600,(int)(monitor.Height*.85)));
                return SetWindowPos(handle,IntPtr.Zero,monitor.X+(monitor.Width-width)/2,monitor.Y+25,width,height,0x0014);
            }
            return false;
        }
        finally { launches.Release(); }
    }
    private static HashSet<IntPtr> Windows(string application)
    {
        var result=new HashSet<IntPtr>();
        EnumWindows((handle,_)=>{
            if(!IsWindowVisible(handle))return true;
            var cls=new StringBuilder(256);GetClassName(handle,cls,cls.Capacity);
            if(application=="firefox" && cls.ToString()!="MozillaWindowClass")return true;
            if(application=="explorer" && cls.ToString()!="CabinetWClass")return true;
            bool matches=ProcessName(handle).Equals(application,StringComparison.OrdinalIgnoreCase);
            if(!matches && application=="SystemSettings" && ProcessName(handle)=="ApplicationFrameHost")
                EnumChildWindows(handle,(child,_)=>{if(ProcessName(child).Equals(application,StringComparison.OrdinalIgnoreCase))matches=true;return !matches;},IntPtr.Zero);
            if(matches)result.Add(handle);return true;
        },IntPtr.Zero);
        return result;
    }
    private static string ProcessName(IntPtr handle)
    {
        GetWindowThreadProcessId(handle,out var pid);
        try{using var p=Process.GetProcessById((int)pid);return p.ProcessName;}catch(ArgumentException){return "";}catch(System.ComponentModel.Win32Exception){return "";}
    }
    private delegate bool Callback(IntPtr handle,IntPtr data);
    [DllImport("user32.dll")]private static extern bool EnumWindows(Callback callback,IntPtr data);
    [DllImport("user32.dll")]private static extern bool EnumChildWindows(IntPtr parent,Callback callback,IntPtr data);
    [DllImport("user32.dll")]private static extern bool IsWindowVisible(IntPtr handle);
    [DllImport("user32.dll")]private static extern bool IsIconic(IntPtr handle);
    [DllImport("user32.dll")]private static extern bool IsZoomed(IntPtr handle);
    [DllImport("user32.dll")]private static extern bool ShowWindow(IntPtr handle,int command);
    [DllImport("user32.dll")]private static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll",CharSet=CharSet.Unicode)]private static extern int GetClassName(IntPtr handle,StringBuilder name,int count);
    [DllImport("user32.dll")]private static extern uint GetWindowThreadProcessId(IntPtr handle,out uint pid);
    [DllImport("user32.dll")]private static extern bool SetWindowPos(IntPtr handle,IntPtr after,int x,int y,int width,int height,uint flags);
}
