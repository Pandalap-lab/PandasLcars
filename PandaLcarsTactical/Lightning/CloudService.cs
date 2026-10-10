using System.Net.Http;
using System.Xml.Linq;
namespace PandaLcarsTactical.Lightning;
public sealed record CloudFrame(DateTimeOffset Time, string Layer);
public sealed class CloudService(HttpClient http)
{
    private CloudFrame? cached; private DateTimeOffset next;
    public async Task<CloudFrame> GetAsync(CancellationToken ct) {
        if (cached is not null && DateTimeOffset.UtcNow < next) return cached;
        var xml = await http.GetStringAsync("https://view.eumetsat.int/geoserver/wms?service=WMS&request=GetCapabilities&version=1.3.0", ct);
        var doc = XDocument.Parse(xml); XNamespace ns = "http://www.opengis.net/wms";
        var layer = doc.Descendants(ns + "Layer").Single(l => (string?)l.Element(ns + "Name") == "msg_fes:clm");
        var time = layer.Elements(ns + "Dimension").Single(d => (string?)d.Attribute("name") == "time").Attribute("default")!.Value;
        cached = new(DateTimeOffset.Parse(time), "msg_fes:clm"); next = DateTimeOffset.UtcNow.AddMinutes(5); return cached;
    }
}
