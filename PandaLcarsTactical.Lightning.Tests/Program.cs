using PandaLcarsTactical.Lightning;
using System.Net;
using System.Text;
using System.Text.Json;
using System.IO.Compression;
static void Check(bool ok, string message) { if (!ok) throw new Exception(message); }
var bytes=File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory,"Fixtures","lightning-lfl.zip"));
var from=DateTimeOffset.Parse("2026-10-10T18:10:09Z");var to=from.AddMinutes(10);
var frame=LightningDecoder.Decode(bytes,"fixture",from,to);
Check(frame.Points.Length==34048 && frame.Rejected==0 && !frame.QualityWarning,"real fixture count/quality");
Check(frame.Points.Count(p=>p.Longitude>=-15&&p.Longitude<=40&&p.Latitude>=30&&p.Latitude<=65)==3869,"packed coordinates");
Check(frame.Points.All(p=>p.Time>=from.AddMinutes(-1)&&p.Time<=to.AddMinutes(1)&&p.Confidence>=0&&p.Confidence<=1.01),"time/confidence");
Console.WriteLine("PASS real NetCDF: 34048 flashes, 3869 Europe, timestamps and quality");
using(var bad=new MemoryStream()){
 bad.Write(bytes);bad.Position=0;
 using(var zip=new ZipArchive(bad,ZipArchiveMode.Update,true)){var manifest=zip.GetEntry("manifest.xml")!;string text;using(var r=new StreamReader(manifest.Open()))text=r.ReadToEnd();manifest.Delete();using var w=new StreamWriter(zip.CreateEntry("manifest.xml").Open());w.Write(text.Replace("4269258f0916d6071e5c7436f938ca40","00000000000000000000000000000000"));}
 try {LightningDecoder.Decode(bad.ToArray(),"bad",from,to);throw new Exception("Corrupt file accepted");}catch(InvalidDataException){}
}
System.Globalization.CultureInfo.CurrentCulture = new System.Globalization.CultureInfo("de-AT");
var fake=new ApiFake(bytes);
using(var client=new EumetsatClient(()=>new("test-key","test-secret"),fake)){
 var result=await client.GetAsync();var cached=await client.GetAsync();
 Check(result.Points.Length==34048 && ReferenceEquals(result,cached),"API result/cache");
 Check(fake.Tokens==2&&fake.Downloads==2,"401 refresh once, then cache");
}
var malicious=new ApiFake(bytes){ForeignLink=true};
using(var client=new EumetsatClient(()=>new("test-key","test-secret"),malicious)){
 try{await client.GetAsync();throw new Exception("Foreign URL accepted");}catch(InvalidDataException){}
 Check(malicious.Downloads==0,"Credentials must never reach foreign URL");
}
Console.WriteLine("PASS ZIP checksum, token refresh, bounded cache and foreign-host rejection");
var dustJson="""
{"timestamps":["2026-10-10T18:00Z"],"reference_time":"2026-10-10T00:00Z","features":[
{"geometry":{"coordinates":[-20,20]},"properties":{"parameters":{"dust":{"unit":"mg m-2","data":[533.43]}}}},
{"geometry":{"coordinates":[39.8,63.8]},"properties":{"parameters":{"dust":{"unit":"mg m-2","data":[0]}}}},
{"geometry":{"coordinates":[0,40]},"properties":{"parameters":{"dust":{"unit":"mg m-2","data":[null]}}}}
]}
""";
var dust=GeoSphereDustService.Decode(Encoding.UTF8.GetBytes(dustJson));
Check(dust.Values[219*300]==533.43 && dust.Values[299]==0,"dust geographic orientation and zero");
Check(dust.Values.Count(v=>v.HasValue)==2,"dust missing values stay transparent");
try{GeoSphereDustService.Decode(Encoding.UTF8.GetBytes(dustJson.Replace("mg m-2","ug m-3")));throw new Exception("Wrong dust units accepted");}catch(InvalidDataException){}
Console.WriteLine("PASS dust orientation, units, zero and missing data");
sealed class ApiFake(byte[] zip):HttpMessageHandler {
 public int Tokens,Downloads;public bool ForeignLink;
 protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage r,CancellationToken ct){
  if(r.RequestUri!.Host!="api.eumetsat.int")throw new Exception("Foreign request");
  string path=r.RequestUri.AbsolutePath;
  object data;
  if(path=="/token") {Tokens++;if(r.Headers.Authorization?.Scheme!="Basic")throw new Exception("Missing Basic");data=new {access_token="test-token-"+Tokens,expires_in=3600};}
  else if(path.Contains("/dates/")){if(!System.Text.RegularExpressions.Regex.IsMatch(path,@"/dates/\d{4}/\d{2}/\d{2}/products$"))throw new Exception("Locale-dependent catalogue date");if(r.Headers.Authorization is not null)throw new Exception("Unneeded credential");data=new {products=new[]{new {id="fixture",date="2026-10-10T18:10:09Z/2026-10-10T18:20:09Z",links=new[]{new {rel="product/details",href="https://api.eumetsat.int/details"}}}}};}
  else if(path=="/details")data=new {properties=new {date="2026-10-10T18:10:09Z/2026-10-10T18:20:09Z",links=new {data=new[]{new {href=ForeignLink?"https://example.com/steal":"https://api.eumetsat.int/download"}}}}};
  else {Downloads++;if(r.Headers.Authorization?.Scheme!="Bearer")throw new Exception("Missing Bearer");return Task.FromResult(Downloads==1?new HttpResponseMessage(HttpStatusCode.Unauthorized):new HttpResponseMessage(HttpStatusCode.OK){Content=new ByteArrayContent(zip)});}
  return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK){Content=new StringContent(JsonSerializer.Serialize(data),Encoding.UTF8,"application/json")});
 }
}
