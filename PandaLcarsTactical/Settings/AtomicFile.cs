namespace PandaLcarsTactical.Settings;

public static class AtomicFile
{
    public static void Write(string path, string text)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
        var temp = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            File.WriteAllText(temp, text);
            for (var attempt = 0; ; attempt++)
            {
                try { File.Move(temp, path, true); break; }
                catch (Exception e) when ((e is IOException or UnauthorizedAccessException) && attempt < 5)
                { Thread.Sleep(100 * (attempt + 1)); }
            }
        }
        finally
        {
            try { if (File.Exists(temp)) File.Delete(temp); }
            catch (IOException) { }
            catch (UnauthorizedAccessException) { }
        }
    }
}
