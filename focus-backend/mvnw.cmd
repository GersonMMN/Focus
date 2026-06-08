@echo off
setlocal enabledelayedexpansion

echo [1/3] Configurando Maven...

set "BASEDIR=%~dp0"
set "SETUP_PS1=%BASEDIR%.mvn\wrapper\setup-maven.ps1"
set "MVNHOME_FILE=%TEMP%\focus_mvn_home.txt"

powershell -NoProfile -ExecutionPolicy Bypass -File "%SETUP_PS1%" > "%MVNHOME_FILE%"

if errorlevel 1 (
    echo ERRO: Falha ao configurar o Maven.
    pause
    exit /b 1
)

for /f "usebackq delims=" %%i in ("%MVNHOME_FILE%") do set "M2_HOME=%%i"

if "!M2_HOME!"=="" (
    echo ERRO: Caminho do Maven nao encontrado.
    pause
    exit /b 1
)

if not exist "!M2_HOME!\bin\mvn.cmd" (
    echo ERRO: Maven nao encontrado em: !M2_HOME!
    pause
    exit /b 1
)

echo [2/3] Maven: !M2_HOME!
echo [3/3] Iniciando Spring Boot...

set "JAVA_CMD=java.exe"
if not defined JAVA_HOME set "JAVA_HOME=C:\Users\thiag\AppData\Roaming\.tlauncher\starter\jre_default\jre-17.0.10-windows-x64"
if defined JAVA_HOME set "JAVA_CMD=!JAVA_HOME!\bin\java.exe"

echo Java: !JAVA_CMD!

for %%J in ("!M2_HOME!\boot\plexus-classworlds-*.jar") do set "CW_JAR=%%J"

echo JAR: !CW_JAR!

if "!CW_JAR!"=="" (
    echo ERRO: Launcher JAR nao encontrado em !M2_HOME!\boot\
    pause
    exit /b 1
)

"!JAVA_CMD!" %MAVEN_OPTS% ^
  -classpath "!CW_JAR!" ^
  "-Dclassworlds.conf=!M2_HOME!\bin\m2.conf" ^
  "-Dmaven.home=!M2_HOME!" ^
  "-Dlibrary.jansi.path=!M2_HOME!\lib\jansi-native" ^
  "-Dmaven.multiModuleProjectDirectory=!BASEDIR!" ^
  org.codehaus.plexus.classworlds.launcher.Launcher %*

if errorlevel 1 (
    echo ERRO: Falha ao iniciar o Spring Boot.
    pause
)
