using PureHDF;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Xml.Linq;
namespace PandaLcarsTactical.Lightning;
public sealed record LightningPoint(double Longitude, double Latitude, DateTimeOffset Time, double Confidence);
public sealed record LightningFrame(string Product, DateTimeOffset From, DateTimeOffset To, LightningPoint[] Points, int Rejected, bool QualityWarning);
public static class LightningDecoder
{
    public static LightningFrame Decode(byte[] archive, string product, DateTimeOffset from, DateTimeOffset to)
    {
        using var zip = new ZipArchive(new MemoryStream(archive), ZipArchiveMode.Read);
        var entry = zip.Entries.Single(e => e.Name.Contains("CHK-BODY") && e.Name.EndsWith(".nc"));
        if (entry.Length > 64 * 1024 * 1024) throw new InvalidDataException("Blitzdatei zu groß.");
        using var stream = new MemoryStream(); using (var input = entry.Open()) input.CopyTo(stream);
        using var manifestStream = zip.GetEntry("manifest.xml")!.Open();
        var manifest = XDocument.Load(manifestStream);
        var obj = manifest.Descendants().Single(e => e.Name.LocalName == "dataObject" && (string?)e.Attribute("ID") == entry.FullName);
        var checksum = obj.Elements().Single(e => e.Name.LocalName == "checksum").Value;
        if (!Convert.ToHexString(MD5.HashData(stream.ToArray())).Equals(checksum, StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("Blitzdatei beschädigt.");
        stream.Position = 0; using var file = H5File.Open(stream);
        var lat = file.Dataset("latitude"); var lon = file.Dataset("longitude");
        var ys = lat.Read<short[]>(); var xs = lon.Read<short[]>();
        var times = file.Dataset("flash_time").Read<double[]>();
        var confidence = file.Dataset("flash_filter_confidence"); var cs = confidence.Read<byte[]>();
        if (ys.Length > 1000000 || xs.Length != ys.Length || times.Length != ys.Length || cs.Length != ys.Length) throw new InvalidDataException("Ungültige Blitzdaten.");
        double scaleY = lat.Attribute("scale_factor").Read<float>(), scaleX = lon.Attribute("scale_factor").Read<float>();
        double offsetY = lat.Attribute("add_offset").Read<float>(), offsetX = lon.Attribute("add_offset").Read<float>();
        double scaleC = confidence.Attribute("scale_factor").Read<float>(), offsetC = confidence.Attribute("add_offset").Read<float>();
        var fillY = lat.Attribute("_FillValue").Read<short>(); var fillX = lon.Attribute("_FillValue").Read<short>();
        var fillC = confidence.Attribute("_FillValue").Read<byte>();
        var epoch = new DateTimeOffset(2000, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var points = new List<LightningPoint>(); int rejected = 0;
        for (int i = 0; i < ys.Length; i++) {
            double y = ys[i] * scaleY + offsetY, x = xs[i] * scaleX + offsetX, c = cs[i] * scaleC + offsetC;
            if (ys[i] == fillY || xs[i] == fillX || cs[i] == fillC || Math.Abs(y) > 90 || Math.Abs(x) > 180 || !double.IsFinite(times[i]) || times[i] < 0 || times[i] > 4e9) { rejected++; continue; }
            var time = epoch.AddSeconds(times[i]);
            if (time < from.AddMinutes(-1) || time > to.AddMinutes(1)) { rejected++; continue; }
            points.Add(new(x, y, time, c));
        }
        bool warning = new[]{"l1b_geolocation_warning", "l1b_missing_warning", "l1b_radiometric_warning"}.Any(n => file.Dataset(n).Read<byte>() != 0);
        return new(product, from, to, points.ToArray(), rejected, warning);
    }
}
