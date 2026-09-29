using System.Net;
using System.Text.Json;
using PandaLcarsTactical.Weather;

var fixture = """
{"utc_offset_seconds":7200,"timezone":"Europe/Vienna","current":{"time":"2026-09-25T12:30","interval":900,"temperature_2m":16.5,"relative_humidity_2m":50,"precipitation":0,"cloud_cover":80,"pressure_msl":1020,"wind_speed_10m":10},"daily":{"time":["2026-09-25","2026-09-26","2026-09-27"],"temperature_2m_min":[10,11,12],"temperature_2m_max":[20,21,22],"weather_code":[0,3,61]}}
""";
void Check(bool ok,string label) { if(!ok)throw new Exception(label); Console.WriteLine("PASS " + label); }
WeatherReport Parse(string json) { using var d=JsonDocument.Parse(json); return OpenMeteoProvider.Parse(d.RootElement,GeoPlace.Vienna); }
var r=Parse(fixture);
Check(r.Celestial?.Sunrise is not null && r.Celestial.Sunset is not null, "Weather includes local sun and moon calculations");
var polar = CelestialTimes.Calculate(new("Tromsø",69.6492,18.9553),new(2026,6,21),"Europe/Oslo");
Check(polar.Sunrise is null && polar.Sunset is null,"Midnight sun does not invent rise/set events");
foreach(var entry in new[]{(GeoPlace.Vienna,"Europe/Vienna",new DateOnly(2026,3,29)),(GeoPlace.Vienna,"Europe/Vienna",new DateOnly(2026,10,25)),(new GeoPlace("Delhi",28.6139,77.209),"Asia/Kolkata",new DateOnly(2026,9,27)),(new GeoPlace("Auckland",-36.85,174.76),"Pacific/Auckland",new DateOnly(2026,9,27))}){
 var times=CelestialTimes.Calculate(entry.Item1,entry.Item3,entry.Item2);
 Check(new[]{times.Sunrise,times.Sunset,times.Moonrise,times.Moonset}.All(t=>t is null || DateOnly.FromDateTime(t.Value.DateTime)==entry.Item3),"Events stay within selected local date including DST/half-hour offsets");
 Check(times.Sunrise is {} sr && times.Sunset is {} ss && sr<ss,"Sunrise precedes sunset at test locations");
}
Check(r.Current.ValidAt.UtcDateTime.Hour==10 && r.Current.ValidAt.Minute==30,"Local API timestamp converted to UTC");
Check(r.Daily.Count==3 && r.Daily[2].Date==new DateOnly(2026,9,27),"Three local forecast dates preserved");
Check(r.Current.IntervalMinutes==15,"Precipitation interval retained");
foreach(var invalid in new[]{fixture.Replace("16.5","null"),fixture.Replace("[20,21,22]","[20]"),fixture.Replace("[20,21,22]","[0,21,22]"),fixture.Replace("2026-09-27","2026-09-29")}) {
 bool rejected=false;try{Parse(invalid);}catch{rejected=true;}Check(rejected,"Invalid or incomplete forecast rejected");
}
bool coordinatesRejected=false;try{new GeoPlace("test",double.NaN,0).Validate();}catch(ArgumentException){coordinatesRejected=true;}Check(coordinatesRejected,"NaN coordinates rejected");
using var client=new HttpClient(new FixtureHandler(fixture));
var liveShape=await new OpenMeteoProvider(client).GetAsync(new GeoPlace("Berlin",52.52,13.405),CancellationToken.None);
Check(liveShape.Place.Name=="Berlin","Selected destination retained");
using var canceled=new CancellationTokenSource();canceled.Cancel();bool canceledOk=false;
try{await new OpenMeteoProvider(client).GetAsync(GeoPlace.Vienna,canceled.Token);}catch(OperationCanceledException){canceledOk=true;}Check(canceledOk,"Canceled request cannot return data");
var radarNow=DateTimeOffset.UtcNow;
string RadarJson(string host,long time,string? path=null)=>JsonSerializer.Serialize(new {host,radar=new {past=new[]{new {time,path=path??("/v2/radar/"+time)}}}});
RadarFrame Radar(string json){using var doc=JsonDocument.Parse(json);return RainViewerProvider.Parse(doc.RootElement,radarNow);}
var validRadar=RadarJson("https://tilecache.rainviewer.com",radarNow.AddMinutes(-10).ToUnixTimeSeconds());
Check(Radar(RadarJson("https://tilecache.rainviewer.com",radarNow.AddMinutes(-10).ToUnixTimeSeconds(),"/v2/radar/461ca2a5948c")).Url.Contains("461ca2a5948c"),"Live opaque radar frame IDs supported");
Check(Radar(validRadar).Url.Contains("/{z}/{x}/{y}/2/1_0.png"),"Radar URL uses bounded tile format");
foreach(var invalid in new[]{RadarJson("https://example.com",radarNow.ToUnixTimeSeconds()),RadarJson("https://tilecache.rainviewer.com",radarNow.AddHours(-2).ToUnixTimeSeconds()),RadarJson("https://tilecache.rainviewer.com",radarNow.ToUnixTimeSeconds(),"/v2/radar/../../secret"),RadarJson("https://tilecache.rainviewer.com",radarNow.AddHours(1).ToUnixTimeSeconds())}){
 bool rejected=false;try{Radar(invalid);}catch{rejected=true;}Check(rejected,"Untrusted/stale/future radar rejected");
}
if(OperatingSystem.IsWindows()){
 using var monitor=new PandaLcarsTactical.SystemInfo.SystemMonitor();
 var initial=monitor.Read();await Task.Delay(2100);var measured=monitor.Read();
 Check(initial.Cpu is null,"CPU first interval is unavailable, not fabricated");
 Check(measured.Cpu is >=0 and <=100 && measured.Ram is >0 and <=100 && measured.Disk is >=0 and <=100,"Live Windows CPU/memory/disk counters return valid values");
 Check(measured.DownloadMbps is >=0 && measured.UploadMbps is >=0,"Network rates use elapsed interval");
 Check(measured.Gpu is null or >=0 and <=100,"GPU reports valid value or unavailable");
 Console.WriteLine("System sample: "+JsonSerializer.Serialize(measured));
}
var testFolder = Path.Combine(Path.GetTempPath(), "PandaLcarsTests-" + Guid.NewGuid());
string Release(string version, string host = "https://github.com/Pandalap-lab/PandasLcars", bool preview = false) => JsonSerializer.Serialize(new {
 tag_name = "v" + version, draft = false, prerelease = preview,
 assets = new[] {"PandasLcars-Setup.exe", "SHA256SUMS.txt"}.Select(name => new {name, browser_download_url = host + "/releases/download/v" + version + "/" + name}) });
Check(PandaLcarsTactical.Updates.UpdateClient.Parse(Release("0.6.1"), new Version("0.6.0"))?.Tag == "v0.6.1", "New stable release offered");
Check(PandaLcarsTactical.Updates.UpdateClient.Parse(Release("0.5.1"), new Version("0.6.0")) is null, "No downgrade offered");
Check(PandaLcarsTactical.Updates.UpdateClient.Parse(Release("0.6.0"), new Version("0.6.0")) is null, "Installed version is current");
Check(PandaLcarsTactical.Updates.UpdateClient.Parse(Release("0.7.0", preview:true), new Version("0.6.0")) is null, "Prerelease not installed automatically");
bool foreignUpdateRejected=false;
try { PandaLcarsTactical.Updates.UpdateClient.Parse(Release("0.7.0", "https://example.org"), new Version("0.6.0")); } catch(InvalidDataException) { foreignUpdateRejected=true; }
Check(foreignUpdateRejected,"Foreign installer URL rejected");
Check(!PandaLcarsTactical.Updates.UpdateClient.Verify(new string('0',64), System.Security.Cryptography.SHA256.HashData(new byte[]{1})), "Tampered download rejected");
Directory.CreateDirectory(testFolder);
try
{
 var displayFile = Path.Combine(testFolder,"display.json");
 var displays = new PandaLcarsTactical.Settings.DisplaySettings(displayFile);
 var sampleDisplays = new List<PandaLcarsTactical.Settings.MonitorChoice> {new("primary","Monitor 1",0,0,1920,1080,true),new("second","Monitor 5",0,-1080,1920,1080,false),new("stable-third","Monitor 9",1920,0,1920,1080,false)};
 Check(displays.Preferred(sampleDisplays)?.Id == "stable-third", "Default selects Monitor 3");
 Check(PandaLcarsTactical.Browser.ExternalWindows.UpperMonitor(sampleDisplays)?.Id == "second", "External windows select upper monitor rather than LCARS screen");
 Check(PandaLcarsTactical.Browser.ExternalWindows.UpperMonitor(sampleDisplays.Where(m=>m.Id!="second").ToList())?.Id == "primary", "External window fallback selects primary monitor");
 displays.Save("stable-third",true);
 displays = new PandaLcarsTactical.Settings.DisplaySettings(displayFile);
 sampleDisplays[2] = sampleDisplays[2] with {Name="Monitor 2"};
 Check(displays.Preferred(sampleDisplays)?.Name=="Monitor 2" && displays.Fullscreen,"Monitor device identity persists across numbering change");
 sampleDisplays.RemoveAt(2);
 Check(displays.Preferred(sampleDisplays) is null,"Disconnected preferred display triggers fallback, not wrong monitor");
 if(OperatingSystem.IsWindows()) Console.WriteLine("Connected displays: "+string.Join(", ",PandaLcarsTactical.Settings.DisplaySettings.Monitors().Select(m=>$"{m.Name}: {m.Width}x{m.Height} at {m.X},{m.Y}")));
 var orbitFile = Path.Combine(testFolder,"iss.json");
 var orbitHandler = new OrbitFixtureHandler();
 using var orbitHttp = new HttpClient(orbitHandler);
 var orbit = new PandaLcarsTactical.IssOrbitService(orbitHttp,orbitFile);
 await Task.WhenAll(orbit.GetAsync(),orbit.GetAsync());
 Check(orbitHandler.Calls==1,"ISS concurrent requests share the cached data");
 await new PandaLcarsTactical.IssOrbitService(orbitHttp,orbitFile).GetAsync();
 Check(orbitHandler.Calls==1,"ISS cache survives app restart");
 File.WriteAllText(orbitFile,"broken");
 await new PandaLcarsTactical.IssOrbitService(orbitHttp,orbitFile).GetAsync();
 Check(orbitHandler.Calls==2,"Damaged ISS cache is replaced from fixed endpoint");
 var serviceFile = Path.Combine(testFolder, "services.json");
 var services = new PandaLcarsTactical.Settings.PersonalServices(serviceFile);
 Check(!services.IsEnabled("calendar"), "Fresh install has no personal account");
 services.SetEnabled("calendar", true);
 Check(new PandaLcarsTactical.Settings.PersonalServices(serviceFile).IsEnabled("calendar"), "Service selection persists");
 services.SetEnabled("calendar", false);
 Check(!new PandaLcarsTactical.Settings.PersonalServices(serviceFile).IsEnabled("calendar"), "Service removal persists");
 bool unknownRejected = false;
 try { services.SetEnabled("injected", true); } catch (ArgumentException) { unknownRejected = true; }
 Check(unknownRejected, "Only known services accepted");
 File.WriteAllText(serviceFile, "invalid");
 var corruptServices = new PandaLcarsTactical.Settings.PersonalServices(serviceFile);
 bool corruptPreserved = false;
 try { corruptServices.SetEnabled("photos", true); } catch (IOException) { corruptPreserved = true; }
 Check(corruptPreserved && File.ReadAllText(serviceFile) == "invalid", "Corrupt service settings preserved");
 var file = Path.Combine(testFolder, "links.json");
 var store = new PandaLcarsTactical.QuickLaunch.LinkStore(file);
 Check(store.Links.Count == 6, "Six requested standard links");
 Check(store.Links.Single(x=>x.Id=="argos").Url=="https://argosatlas.com/", "ARGOS ATLAS default has the confirmed address");
 for (int i=0; i<7; i++) store.Save(null,"Test " + i,"example.com/" + i);
 var loaded = new PandaLcarsTactical.QuickLaunch.LinkStore(file);
 Check(loaded.Links.Count == 13 && loaded.Links.Count(x=>x.Custom)==7, "More than eight links persist across restart");
 var custom = loaded.Links.Last();
 loaded.Save(custom.Id, "Änderung", "https://example.org/changed");
 Check(new PandaLcarsTactical.QuickLaunch.LinkStore(file).Links.Last().Name == "Änderung", "Edited name and URL persist");
 loaded.Delete(custom.Id);
 Check(new PandaLcarsTactical.QuickLaunch.LinkStore(file).Links.Count == 12, "Deleted custom link stays deleted");
 foreach(var bad in new[]{"javascript:alert(1)","file:///C:/Windows", "https://user:password@example.com/", "https://panda.local/Web/index.html", "data:text/html,test"})
 {
  bool rejected=false; try { loaded.Save(null,"Unsafe",bad); } catch(ArgumentException){rejected=true;}
  Check(rejected,"Non-web, credential or dashboard URL rejected");
 }
 bool standardProtected=false; try { loaded.Delete("krone"); } catch(ArgumentException){standardProtected=true;}
 Check(standardProtected,"Standard links protected from custom delete");
 File.WriteAllText(file,"broken JSON");
 var broken = new PandaLcarsTactical.QuickLaunch.LinkStore(file);
 Check(broken.Warning is not null && broken.Links.Count == 6 && File.ReadAllText(file)=="broken JSON", "Corrupt file retained and surfaced");
 var activity = new PandaLcarsTactical.SystemInfo.ActivityStatus();
 var at = DateTimeOffset.Now;
 Check(activity.Update(at,0,10,null).Mode == "WORK", "Input means WORK");
 var standby = activity.Update(at.AddSeconds(180),180,90,null);
 Check(standby.Mode == "STANDBY", "Inactivity overrides background load");
 Check(activity.Update(at.AddSeconds(181),0,10,null).Mode == "WORK", "Input wakes immediately");
 activity.WarpRequested=true;
 Check(activity.Update(at.AddSeconds(182),0,10,null).Mode == "WARP", "Manual WARP");
 Check(activity.Update(at.AddSeconds(400),180,10,null).Mode == "STANDBY" && !activity.WarpRequested,"STANDBY clears manual WARP");
 Check(activity.Update(at.AddSeconds(401),0,85,null).Mode == "WORK", "Brief CPU spike does not cause WARP");
 Check(activity.Update(at.AddSeconds(412),0,85,null).Mode == "WARP", "Sustained performance causes WARP");
 Check(activity.Update(at.AddSeconds(413),0,20,null).Mode == "WARP", "Load hysteresis avoids flicker");
 Check(activity.Update(at.AddSeconds(419),0,20,null).Mode == "WORK", "Calm returns to WORK");
 var stable = activity.Update(at.AddSeconds(420),0,20,null);
 Check(stable.Since == at.AddSeconds(419), "Transition timestamp stable between samples");
}
finally { Directory.Delete(testFolder,true); }
Console.WriteLine("All weather, radar, system, quicklaunch and activity tests passed.");
sealed class FixtureHandler(string data):HttpMessageHandler {
 protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,CancellationToken token){token.ThrowIfCancellationRequested();return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK){Content=new StringContent(data)});}
}

sealed class OrbitFixtureHandler:HttpMessageHandler {
 public int Calls;
 protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,CancellationToken token){
  if(request.RequestUri?.AbsoluteUri!="https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=JSON")throw new Exception("Unexpected orbit endpoint");
  Interlocked.Increment(ref Calls);return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK){Content=new StringContent("[{\"NORAD_CAT_ID\":25544}]")});
 }
}
