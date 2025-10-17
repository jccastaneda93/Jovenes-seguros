# Simple static file server for Windows PowerShell using HttpListener
# Usage: Open PowerShell in this folder and run: .\serve-local.ps1 -Port 8000
param(
    [int]$Port = 8000
)

Add-Type -AssemblyName System.Web
$prefix = "http://+:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try {
    $listener.Start()
    Write-Host "Serving $PWD at http://localhost:$Port/  (Ctrl+C to stop)"
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        Start-Job -ScriptBlock {
            param($context, $pwd)
            try {
                $req = $context.Request
                $res = $context.Response
                $urlPath = $req.Url.LocalPath.TrimStart('/')
                if ([string]::IsNullOrEmpty($urlPath)) { $urlPath = 'index.html' }
                $filePath = Join-Path $pwd $urlPath
                if (-not (Test-Path $filePath)) {
                    $res.StatusCode = 404
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                    $res.OutputStream.Write($buffer,0,$buffer.Length)
                    $res.Close()
                    return
                }
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $res.ContentLength64 = $bytes.Length
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $mime = 'application/octet-stream'
                switch ($ext) {
                    '.html' { $mime = 'text/html; charset=utf-8' }
                    '.htm' { $mime = 'text/html; charset=utf-8' }
                    '.js' { $mime = 'application/javascript' }
                    '.css' { $mime = 'text/css' }
                    '.png' { $mime = 'image/png' }
                    '.jpg' { $mime = 'image/jpeg' }
                    '.jpeg' { $mime = 'image/jpeg' }
                    '.svg' { $mime = 'image/svg+xml' }
                    '.json' { $mime = 'application/json' }
                    default { }
                }
                $res.ContentType = $mime
                $res.OutputStream.Write($bytes,0,$bytes.Length)
                $res.Close()
            } catch {
                try { $context.Response.Close() } catch {}
            }
        } -ArgumentList $ctx, (Get-Location).Path | Out-Null
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
