@echo off
setlocal
set MAVEN_VERSION=3.9.11
set BASE_DIR=%~dp0
if "%MAVEN_USER_HOME%"=="" set MAVEN_USER_HOME=%USERPROFILE%\.m2
set MAVEN_HOME=%MAVEN_USER_HOME%\wrapper\dists\apache-maven-%MAVEN_VERSION%
set MAVEN_BIN=%MAVEN_HOME%\bin\mvn.cmd
if not exist "%MAVEN_BIN%" (
  echo Downloading Apache Maven %MAVEN_VERSION% (first run only)...
  set ARCHIVE=%TEMP%\apache-maven-%MAVEN_VERSION%-bin.zip
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip' -OutFile '%TEMP%\apache-maven-%MAVEN_VERSION%-bin.zip'; New-Item -ItemType Directory -Force -Path '%MAVEN_USER_HOME%\wrapper\dists' | Out-Null; Expand-Archive -Force '%TEMP%\apache-maven-%MAVEN_VERSION%-bin.zip' '%MAVEN_USER_HOME%\wrapper\dists'; Move-Item -Force '%MAVEN_USER_HOME%\wrapper\dists\apache-maven-%MAVEN_VERSION%' '%MAVEN_HOME%'"
  if errorlevel 1 exit /b 1
)
call "%MAVEN_BIN%" -f "%BASE_DIR%pom.xml" %*
