#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Forwards localhost:3306 on Windows to the Podman machine's MySQL port.
    Run once manually, or register as a scheduled task for persistence across reboots.

.EXAMPLE
    # Run manually (elevated):
    powershell -ExecutionPolicy Bypass -File scripts\setup-podman-portproxy.ps1

    # Register as a startup task (run once, elevated):
    powershell -ExecutionPolicy Bypass -File scripts\setup-podman-portproxy.ps1 -Register
#>
param(
    [switch]$Register
)

$PORT = 3306

function Get-PodmanMachineIP {
    $ip = podman machine ssh "ip addr show eth0 | grep -oP '(?<=inet )\d+\.\d+\.\d+\.\d+'" 2>$null
    if (-not $ip) {
        throw "Could not determine Podman machine IP. Is 'podman machine start' running?"
    }
    return $ip.Trim()
}

function Set-PortProxy {
    param([string]$TargetIP)

    # Remove any existing rule for this port
    netsh interface portproxy delete v4tov4 listenaddress=127.0.0.1 listenport=$PORT 2>$null | Out-Null
    Remove-NetFirewallRule -DisplayName "Podman MySQL ($PORT)" -ErrorAction SilentlyContinue

    # Add forwarding rule
    netsh interface portproxy add v4tov4 `
        listenaddress=127.0.0.1 `
        listenport=$PORT `
        connectaddress=$TargetIP `
        connectport=$PORT

    Write-Host "Port proxy set: localhost:$PORT -> ${TargetIP}:$PORT"
}

function Register-StartupTask {
    $scriptPath = (Resolve-Path $PSCommandPath).Path
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $action = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument "-NonInteractive -ExecutionPolicy Bypass -File `"$scriptPath`""
    $trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
    $principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 2)

    Register-ScheduledTask `
        -TaskName "PodmanMySQLPortProxy" `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Force | Out-Null

    Write-Host "Scheduled task 'PodmanMySQLPortProxy' registered for $currentUser."
}

$null = podman machine start 2>$null
$machineIP = Get-PodmanMachineIP
Set-PortProxy -TargetIP $machineIP

if ($Register) {
    Register-StartupTask
}
