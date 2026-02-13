
$files = Get-ChildItem -Path "d:\Coding\SmartCareerAI\frontend\src" -Recurse -Include *.tsx,*.ts

foreach ($file in $files) {
    $content = Get-Content -LiteralPath $file.Path -Raw
    $originalContent = $content

    # 1. Fix duplicated credentials
    $content = $content -replace "credentials: 'include', credentials: 'include'", "credentials: 'include'"
    
    # 2. Fix missing closing brace after headers: {}
    # Pattern: headers: {} followed immediately by ) -> should be headers: {} })
    # Using regex escape for curly braces and parenthesis
    $content = $content -replace "headers: \{\}\)", "headers: {} })"
    
    # Pattern: headers: {}), -> headers: {} }),
    $content = $content -replace "headers: \{\}\),", "headers: {} }),"

    # Pattern: headers: {}; -> headers: {} }); (less likely but possible if spread across lines, but my previous replace was on single line)
    
    if ($content -ne $originalContent) {
        Set-Content -LiteralPath $file.Path -Value $content
        Write-Host "Fixed syntax in $($file.Path)"
    }
}
