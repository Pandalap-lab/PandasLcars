using System.Security.Cryptography;
using System.Text;

namespace PandaLcarsTactical.Security;

// DPAPI binds the encrypted file to this Windows user. No plaintext settings or logs.
public sealed class ApiKeyStore
{
    private readonly string path = Path.Combine(Environment.GetFolderPath(
        Environment.SpecialFolder.LocalApplicationData), "PandaLcarsTactical", "kachelmann.key");
    public bool HasKey => File.Exists(path);
    public void Save(string key)
    {
        if (string.IsNullOrWhiteSpace(key)) throw new ArgumentException("Bitte einen Schlüssel eingeben.");
        byte[] bytes = Encoding.UTF8.GetBytes(key.Trim());
        try
        {
            byte[] encrypted = ProtectedData.Protect(bytes, null, DataProtectionScope.CurrentUser);
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            string temporary = path + ".tmp";
            File.WriteAllBytes(temporary, encrypted);
            File.Move(temporary, path, overwrite: true);
        }
        finally { CryptographicOperations.ZeroMemory(bytes); }
    }
    public string? Read()
    {
        if (!HasKey) return null;
        byte[] bytes = ProtectedData.Unprotect(File.ReadAllBytes(path), null, DataProtectionScope.CurrentUser);
        try { return Encoding.UTF8.GetString(bytes); }
        finally { CryptographicOperations.ZeroMemory(bytes); }
    }
    public void Delete() { if (HasKey) File.Delete(path); }
}
