$ErrorActionPreference = 'Stop'
$taskRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$taskRaw = Join-Path $taskRoot '.playwright-mcp/wukong-natural-audio'
New-Item -ItemType Directory -Path $taskRaw -Force | Out-Null
$taskSpeaker = New-Object -ComObject SAPI.SpVoice
$taskToken = New-Object -ComObject SAPI.SpObjectToken
$taskToken.SetId('HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens\MSTTS_V110_zhCN_KangkangM')
$taskSpeaker.Voice = $taskToken
$taskSpeaker.Rate = 2
$taskSpeaker.Volume = 100
$taskLines = @(
    @{ key='call-1'; text=(-join @([char]0x770B,[char]0x68D2,[char]0xFF01)) },
    @{ key='call-2'; text=(-join @([char]0x54EA,[char]0x91CC,[char]0x8DD1,[char]0xFF01)) },
    @{ key='call-3'; text=(-join @([char]0x563F,[char]0xFF01)) },
    @{ key='call-4'; text=(-join @([char]0x5403,[char]0x4FFA,[char]0x8001,[char]0x5B59,[char]0x4E00,[char]0x68D2,[char]0xFF01)) }
)
foreach ($taskLine in $taskLines) {
    $taskStream = New-Object -ComObject SAPI.SpFileStream
    $taskPath = Join-Path $taskRaw ($taskLine.key + '.wav')
    $taskStream.Open($taskPath, 3, $false)
    $taskSpeaker.AudioOutputStream = $taskStream
    $null = $taskSpeaker.Speak($taskLine.text)
    $taskStream.Close()
}
$taskInfo = @{ engine='Windows SAPI'; voice=$taskSpeaker.Voice.GetDescription(); rate=2; lines=$taskLines }
$taskInfo | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $taskRaw 'voice-source.json') -Encoding UTF8
$taskInfo | ConvertTo-Json -Depth 4 -Compress
