@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements. See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership. The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License. You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied. See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM Apache Maven Wrapper startup batch script, version 3.2.0

@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET __MVNW_CMD__=
@SET __MVNW_ERROR__=
@SET __MVNW_SAVE_ERRORLEVEL__=
@SET __MVNW_SAVE_ERRORLEVEL__=%ERRORLEVEL%

@SETLOCAL

@SET MAVEN_PROJECTBASEDIR=%~dp0
@IF NOT "%MAVEN_BASEDIR%"=="" @SET MAVEN_PROJECTBASEDIR=%MAVEN_BASEDIR%
@IF NOT "%MAVEN_PROJECTBASEDIR:~-1%"=="\" @SET MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR%\

@SET WRAPPER_PROPERTIES=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.properties
@SET WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar

@FOR /F "usebackq tokens=1,2 delims==" %%A IN ("%WRAPPER_PROPERTIES%") DO (
    @IF "%%A"=="distributionUrl" @SET DISTRIBUTION_URL=%%B
    @IF "%%A"=="distributionSha256Sum" @SET DISTRIBUTION_SHA256SUM=%%B
)

@SET MAVEN_DIST_NAME=apache-maven
@FOR /F "tokens=* delims=" %%i IN ("%DISTRIBUTION_URL%") DO (
    @SET __MVNW_DIST_URL__=%%i
)

@REM Determine Maven version from URL
@FOR /F "tokens=3 delims=/" %%i IN ("%DISTRIBUTION_URL%") DO @SET __MVNW_MAVEN_VERSION__=%%i

@SET MAVEN_USER_HOME=%USERPROFILE%\.m2
@IF NOT "%MAVEN_USER_HOME%"=="" @SET MAVEN_USER_HOME=%MAVEN_USER_HOME%

@SET DISTRIBUTION_PATH=%MAVEN_USER_HOME%\wrapper\dists
@SET DISTRIBUTION_ZIP_PATH=%DISTRIBUTION_PATH%\apache-maven-%__MVNW_MAVEN_VERSION__%
@SET MAVEN_HOME=%DISTRIBUTION_ZIP_PATH%\apache-maven-%__MVNW_MAVEN_VERSION__%

@IF NOT EXIST "%MAVEN_HOME%\bin\mvn.cmd" (
    @ECHO Downloading Apache Maven %__MVNW_MAVEN_VERSION__% from %DISTRIBUTION_URL%
    @IF NOT EXIST "%DISTRIBUTION_ZIP_PATH%" @MKDIR "%DISTRIBUTION_ZIP_PATH%"
    @SET DOWNLOAD_ZIP=%DISTRIBUTION_ZIP_PATH%\apache-maven-%__MVNW_MAVEN_VERSION__%-bin.zip
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%DISTRIBUTION_URL%' -OutFile '!DOWNLOAD_ZIP!'}"
    IF ERRORLEVEL 1 (
        @ECHO Failed to download Maven. Please check your internet connection.
        EXIT /B 1
    )
    powershell -Command "Expand-Archive -Path '!DOWNLOAD_ZIP!' -DestinationPath '!DISTRIBUTION_ZIP_PATH!' -Force"
    IF ERRORLEVEL 1 (
        @ECHO Failed to extract Maven.
        EXIT /B 1
    )
    @DEL "!DOWNLOAD_ZIP!"
)

@SET JAVA_EXE=java.exe
@IF NOT "%JAVA_HOME%"=="" @SET JAVA_EXE=%JAVA_HOME%\bin\java.exe

@FOR %%i IN ("%MAVEN_HOME%\boot\plexus-classworlds-*.jar") DO @SET LAUNCHER_JAR=%%i

@"%JAVA_EXE%" ^
  %JVM_CONFIG_MAVEN_PROPS% ^
  %MAVEN_OPTS% ^
  %MAVEN_DEBUG_OPTS% ^
  -classpath "%LAUNCHER_JAR%" ^
  "-Dclassworlds.conf=%MAVEN_HOME%\bin\m2.conf" ^
  "-Dmaven.home=%MAVEN_HOME%" ^
  "-Dlibrary.jansi.path=%MAVEN_HOME%\lib\jansi-native" ^
  "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" ^
  org.codehaus.plexus.classworlds.launcher.Launcher %*

@SET MVNW_EXITCODE=%ERRORLEVEL%
@ENDLOCAL & EXIT /B %MVNW_EXITCODE%
