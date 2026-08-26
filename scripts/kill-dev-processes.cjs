const { execSync } = require("child_process");

console.log("[RUHGEN Build] Checking for lingering dev server processes...");

const isWin = process.platform === "win32";

const targets = ["next dev", "node --watch", "concurrently"];

for (const target of targets) {
  try {
    if (isWin) {
      // Windows check via PowerShell
      const psCmd = `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${target}*' -and $_.ProcessId -ne $PID } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
      execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: "ignore" });
    } else {
      // Linux / Unix / macOS
      execSync(`pkill -f "${target}" || true`, { stdio: "ignore" });
    }
  } catch (_) {
    // Ignore if process not found or permission error
  }
}

console.log("[RUHGEN Build] Resident dev process cleanup complete.");
