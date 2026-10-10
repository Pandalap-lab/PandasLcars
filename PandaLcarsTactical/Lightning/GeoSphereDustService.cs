using System.Globalization;
using System.Net.Http;
using System.Text.Json;
namespace PandaLcarsTactical.Lightning;
public sealed record DustFrame(DateTimeOffset Time, DateTimeOffset Run, int Width, int Height, double West, double South, double East, double North, double?[] Values);
public sealed class GeoSphereDustService(HttpClient http)
{
    private readonly SemaphoreSlim gate = new(1,1);
    private DustFrame? cached;
    private DateTimeOffset retry;
    public async Task<DustFrame> GetAsync(CancellationToken ct) {
        await gate.WaitAsync(ct);
        try {
            var now=DateTimeOffset.UtcNow;
            var hour=new DateTimeOffset(now.Year,now.Month,now.Day,now.Hour,0,0,TimeSpan.Zero);
            if(cached?.Time==hour)return cached;
            if(now<retry)throw new IOException("GeoSphere-Abrufpause; erneuter Versuch folgt.");
            retry=now.AddMinutes(2);
            var stamp=hour.ToString("yyyy-MM-dd'T'HH':00'",CultureInfo.InvariantCulture);
            var url="https://dataset.api.hub.geosphere.at/v1/grid/forecast/chem_dust-v1-1h-0p2deg?parameters=dust&bbox=20,-20,64,40&start="+stamp+"&end="+stamp;
            using var response=await http.GetAsync(url,HttpCompletionOption.ResponseHeadersRead,ct);
            response.EnsureSuccessStatusCode();
            using var stream=await response.Content.ReadAsStreamAsync(ct);
            using var buffer=new MemoryStream();var chunk=new byte[65536];int n;
            while((n=await stream.ReadAsync(chunk,ct))>0){if(buffer.Length+n>32*1024*1024)throw new IOException("GeoSphere-Antwort zu groß.");buffer.Write(chunk,0,n);}
            var decoded=Decode(buffer.ToArray());
            if(decoded.Time!=hour)throw new InvalidDataException("Unerwartete Prognosezeit.");
            cached=decoded;return cached;
        } finally {gate.Release();}
    }
    public static DustFrame Decode(byte[] json) {
        using var doc=JsonDocument.Parse(json);var root=doc.RootElement;
        var time=DateTimeOffset.Parse(root.GetProperty("timestamps")[0].GetString()!,CultureInfo.InvariantCulture);
        var run=DateTimeOffset.Parse(root.GetProperty("reference_time").GetString()!,CultureInfo.InvariantCulture);
        const int width=300,height=220;var values=new double?[width*height];int count=0;
        foreach(var f in root.GetProperty("features").EnumerateArray()) {
            var coords=f.GetProperty("geometry").GetProperty("coordinates");
            var x=(int)Math.Round((coords[0].GetDouble()+20)/.2);var y=(int)Math.Round((coords[1].GetDouble()-20)/.2);
            if(x<0||x>=width||y<0||y>=height)continue;
            var p=f.GetProperty("properties").GetProperty("parameters").GetProperty("dust");
            if(p.GetProperty("unit").GetString()!="mg m-2")throw new InvalidDataException("Unbekannte Staubeinheit.");
            var v=p.GetProperty("data")[0];
            if(v.ValueKind==JsonValueKind.Number && v.TryGetDouble(out var d)&&double.IsFinite(d)&&d>=0){values[(height-1-y)*width+x]=d;count++;}
        }
        if(count==0)throw new InvalidDataException("Keine gültigen Staubwerte.");
        return new(time,run,width,height,-20.1,19.9,39.9,63.9,values);
    }
}
