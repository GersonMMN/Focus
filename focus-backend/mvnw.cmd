@echo off
setlocal enabledelayedexpansion

set "BASEDIR=%~dp0"
set "SETUP_PS1=%BASEDIR%.mvn\wrapper\setup-maven.ps1"
set "MVNHOME_FILE=%TEMP%\focus_mvn_home.txt"

powershell -NoProfile -ExecutionPolicy Bypass -File "%SETUP_PS1%" > "%MVNHOME_FILE%"

if errorlevel 1 (
    echo ERRO: Falha ao configurar o Maven.
    exit /b 1
)

for /f "usebackq delims=" %%i in ("%MVNHOME_FILE%") do set "M2_HOME=%%i"

if not exist "!M2_HOME!\bin\mvn.cmd" (
    echo ERRO: Maven nao encontrado em: !M2_HOME!
    exit /b 1
)

set "JAVA_CMD=java.exe"
if defined JAVA_HOME set "JAVA_CMD=!JAVA_HOME!\bin\java.exe"

for %%J in ("!M2_HOME!\boot\plexus-classworlds-*.jar") do set "CW_JAR=%%J"

"!JAVA_CMD!" %MAVEN_OPTS% ^
  -classpath "!CW_JAR!" ^
  "-Dclassworlds.conf=!M2_HOME!\bin\m2.conf" ^
  "-Dmaven.home=!M2_HOME!" ^
  "-Dlibrary.jansi.path=!M2_HOME!\lib\jansi-native" ^
  "-Dmaven.multiModuleProjectDirectory=!BASEDIR!" ^
  org.codehaus.plexus.classworlds.launcher.Launcher %*

exit /b %ERRORLEVEL%
