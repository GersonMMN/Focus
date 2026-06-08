$propsFile = Join-Path $PSScriptRoot "maven-wrapper.properties"
$props = @{}
Get-Content $propsFile | ForEach-Object {
    if ($_ -match '^(.+?)=(.+)$') { $props[$matches[1]] = $matches[2] }
}
$url = $props['distributionUrl']
$ver = ([IO.Path]::GetFileNameWithoutExtension($url) -replace '^apache-maven-','') -replace '-bin$',''
$dir = Join-Path $env:USERPROFILE ".m2\wrapper\dists\apache-maven-$ver-bin"
$mvnHome = Join-Path $dir "apache-maven-$ver"

if (-not (Test-Path (Join-Path $mvnHome "bin\mvn.cmd"))) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    $zip = Join-Path $dir "mvn.zip"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Write-Host "Baixando Apache Maven $ver..."
    Invoke-WebRequest -Uri $url -OutFile $zip
    Write-Host "Extraindo..."
    Expand-Archive -Path $zip -DestinationPath $dir -Force
    Remove-Item $zip
    Write-Host "Maven $ver pronto."
}

Write-Output $mvnHome
