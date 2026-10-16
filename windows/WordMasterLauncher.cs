using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

[assembly: System.Reflection.AssemblyTitle("墨词 WordMaster")]
[assembly: System.Reflection.AssemblyDescription("墨词本地启动器")]
[assembly: System.Reflection.AssemblyVersion("1.1.0.0")]
static class WordMasterLauncher {
    static readonly JavaScriptSerializer Json = new JavaScriptSerializer();
    static string Root, Key;
    static bool Headless;
    static Dictionary<string, object> ReadReady(int port) {
        try {
            var request = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:" + port + "/api/desktop/runtime");
            request.Proxy = null; request.Timeout = 500; request.ReadWriteTimeout = 500;
            using (var response = request.GetResponse())
            using (var reader = new StreamReader(response.GetResponseStream())) {
                var value = Json.Deserialize<Dictionary<string, object>>(reader.ReadToEnd());
                return value.ContainsKey("application") && Convert.ToString(value["application"]) == "wordmaster"
                    && value.ContainsKey("installationKey") && Convert.ToString(value["installationKey"]) == Key ? value : null;
            }
        } catch { return null; }
    }
    static bool Occupied(int port) {
        var probe = new TcpListener(IPAddress.Loopback, port);
        try { probe.Start(); return false; }
        catch (SocketException) { return true; }
        finally { probe.Stop(); }
    }
    static string Normal(string value) { return Path.GetFullPath(value).TrimEnd('\\', '/').Replace('\\', '/').ToLowerInvariant(); }
    static string Hash(string value) { using (var sha = SHA256.Create()) { return BitConverter.ToString(sha.ComputeHash(Encoding.UTF8.GetBytes(value))).Replace("-", "").ToLowerInvariant(); } }
    static void Complete(int port, int pid, bool reused) {
        var result = new Dictionary<string, object> { {"ready", true}, {"port", port}, {"processId", pid}, {"reused", reused}, {"installationKey", Key} };
        Console.WriteLine(Json.Serialize(result));
        if (!Headless) Process.Start(new ProcessStartInfo("http://127.0.0.1:" + port + "/") { UseShellExecute = true });
    }
    [STAThread] static int Main(string[] args) {
        Headless = Array.IndexOf(args, "--headless") >= 0;
        try {
            if (Headless) {
                Console.SetOut(new StreamWriter(Console.OpenStandardOutput(), new UTF8Encoding(false)) { AutoFlush = true });
                Console.SetError(new StreamWriter(Console.OpenStandardError(), new UTF8Encoding(false)) { AutoFlush = true });
            }
            Root = AppDomain.CurrentDomain.BaseDirectory;
            Directory.SetCurrentDirectory(Root);
            foreach (var file in new [] { "runtime/node.exe", "app/main.js", "static/index.html", "node_modules/express/package.json" })
                if (!File.Exists(Path.Combine(Root, file))) throw new Exception("应用文件不完整，请重新解压完整发行包。缺少：" + file);
            string database = Environment.GetEnvironmentVariable("WORDMASTER_DB_PATH");
            if (String.IsNullOrWhiteSpace(database)) database = Path.Combine(Root, "data", "wordmaster.db");
            Key = Hash(Normal(Root) + "\n" + Normal(database));
            // Serialize launches for this installation and DB, including first-run seed.
            using (var mutex = new Mutex(false, "Local\\MociLauncher-" + Key)) {
                bool acquired = false;
                try {
                    try { acquired = mutex.WaitOne(40000); } catch (AbandonedMutexException) { acquired = true; }
                    if (!acquired) throw new Exception("墨词正在启动，请稍后再试。");
                    // Discover only a matching installation, never reuse an arbitrary HTTP 200.
                    for (int port = 3456; port <= 3476; port++)
                        if (Occupied(port) && ReadReady(port) != null) { Complete(port, 0, true); return 0; }
                    int selected = 0;
                    for (int port = 3456; port <= 3476; port++) if (!Occupied(port)) { selected = port; break; }
                    if (selected == 0) throw new Exception("本地端口 3456–3476 均被占用，请关闭不需要的墨词实例后重试。");
                    var start = new ProcessStartInfo(Path.Combine(Root, "runtime", "node.exe"), "app/main.js") {
                        WorkingDirectory = Root, UseShellExecute = true, WindowStyle = ProcessWindowStyle.Hidden
                    };
                    // Only this launcher's environment changes. Shell launch creates
                    // the hidden server with independent console handles, so closing
                    // the launcher cannot close its stdio or interrupt later saves.
                    Environment.SetEnvironmentVariable("PORT", selected.ToString());
                    Environment.SetEnvironmentVariable("WORDMASTER_HOST", "127.0.0.1");
                    Environment.SetEnvironmentVariable("WORDMASTER_DB_PATH", Path.GetFullPath(database));
                    var child = new Process { StartInfo = start };
                    child.Start();
                    for (int attempt = 0; attempt < 150; attempt++) {
                        if (ReadReady(selected) != null) { Complete(selected, child.Id, false); return 0; }
                        if (child.HasExited) throw new Exception("墨词服务启动失败（退出码 " + child.ExitCode + "）。请检查目录写入权限和发行包文件是否完整。学习数据库不会自动重置。");
                        Thread.Sleep(200);
                    }
                    // A timed-out child could still finish migrations. Leave it alive;
                    // the next launch discovers it, rather than killing a database write.
                    throw new Exception("启动时间较长，服务仍可能在准备词库。请稍后重新打开墨词。");
                } finally { if (acquired) mutex.ReleaseMutex(); }
            }
        } catch (Exception error) {
            Console.Error.WriteLine(Json.Serialize(new Dictionary<string, object> { {"ready", false}, {"error", error.Message} }));
            if (!Headless) MessageBox.Show(error.Message, "墨词启动提示", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return 1;
        }
    }
}
