using System.Security.Cryptography;
using System.Text.Json;
namespace PandaLcarsTactical.Lightning;
public sealed record EumetsatCredentials(string Key, string Secret);
[System.Runtime.Versioning.SupportedOSPlatform("windows")]
public sealed class EumetsatKeyStore
{
    private readonly string path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "eumetsat.key");
    public EumetsatCredentials? Read()
    {
        if (!File.Exists(path)) return null;
        var bytes = ProtectedData.Unprotect(File.ReadAllBytes(path), null, DataProtectionScope.CurrentUser);
        try { return JsonSerializer.Deserialize<EumetsatCredentials>(bytes); }
        finally { CryptographicOperations.ZeroMemory(bytes); }
    }
    public void Save(string key, string secret)
    {
        if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(secret)) throw new ArgumentException("Key und Secret fehlen.");
        var bytes = JsonSerializer.SerializeToUtf8Bytes(new EumetsatCredentials(key.Trim(), secret.Trim()));
        try {
            var encrypted = ProtectedData.Protect(bytes, null, DataProtectionScope.CurrentUser);
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            File.WriteAllBytes(path + ".tmp", encrypted); File.Move(path + ".tmp", path, true);
        } finally { CryptographicOperations.ZeroMemory(bytes); }
    }
    public void Delete() { if (File.Exists(path)) File.Delete(path); }
}

