#ifndef AppVersion
  #define AppVersion "0.6.7"
#endif
[Setup]
AppId={{14879574-8B63-46B1-9669-6E8293A87C88}
AppName=PandasLcars
AppVersion={#AppVersion}
AppPublisher=Pandalap-lab
AppPublisherURL=https://github.com/Pandalap-lab/PandasLcars
DefaultDirName={localappdata}\Programs\PandasLcars
DefaultGroupName=PandasLcars
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0.19041
OutputDir=..\artifacts
OutputBaseFilename=PandasLcars-Setup
SetupIconFile=..\PandaLcarsTactical\Assets\panda-spock.ico
UninstallDisplayIcon={app}\PandasLcars.exe
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
CloseApplications=yes
RestartApplications=no
SetupMutex=PandasLcarsSetup
[Languages]
Name: "german"; MessagesFile: "compiler:Languages\German.isl"
[Tasks]
Name: "desktopicon"; Description: "Desktop-Verknüpfung erstellen"; Flags: unchecked
Name: "autostart"; Description: "PandasLcars bei Windows-Anmeldung starten (bevorzugt Monitor 3)"
[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "PandasLcars"; ValueData: """{app}\PandasLcars.exe"" --autostart"; Tasks: autostart; Flags: uninsdeletevalue
[Files]
Source: "..\artifacts\app\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
[Icons]
Name: "{group}\PandasLcars"; Filename: "{app}\PandasLcars.exe"
Name: "{autodesktop}\PandasLcars"; Filename: "{app}\PandasLcars.exe"; Tasks: desktopicon
[Run]
Filename: "{app}\PandasLcars.exe"; Description: "PandasLcars starten"; Flags: nowait postinstall skipifsilent
