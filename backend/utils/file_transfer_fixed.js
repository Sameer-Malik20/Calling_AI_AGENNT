const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class FileTransfer {
    constructor(sshConfig = {}) {
        this.sshConfig = {
            host: sshConfig.host || process.env.UBUNTU_IP || '10.187.56.151',
            user: sshConfig.user || process.env.UBUNTU_USER || 'root',
            keyPath: sshConfig.keyPath || process.env.SSH_KEY_PATH || null,
            port: sshConfig.port || 22
        };
    }

    /**
     * Transfer file from Windows to Ubuntu using PowerShell SSH
     */
    async uploadToUbuntu(localFilePath, remoteFilePath) {
        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(localFilePath)) {
                    throw new Error(`Local file not found: ${localFilePath}`);
                }

                console.log(`[FILE TRANSFER] Uploading: ${localFilePath} → ${remoteFilePath}`);

                // Try multiple methods for file transfer
                const methods = [
                    () => this._uploadViaSCP(localFilePath, remoteFilePath),
                    () => this._uploadViaPowerShell(localFilePath, remoteFilePath),
                    () => this._uploadViaSSHNet(localFilePath, remoteFilePath)
                ];

                this._tryMethods(methods)
                    .then(() => {
                        console.log(`[FILE TRANSFER] ✔ Upload complete: ${remoteFilePath}`);
                        resolve(remoteFilePath);
                    })
                    .catch(error => {
                        console.error(`[FILE TRANSFER] ✗ All upload methods failed: ${error.message}`);
                        reject(error);
                    });
            } catch (error) {
                console.error(`[FILE TRANSFER] ✗ Upload failed: ${error.message}`);
                reject(error);
            }
        });
    }

    /**
     * Transfer file from Ubuntu to Windows using PowerShell SSH
     */
    async downloadFromUbuntu(remoteFilePath, localFilePath) {
        return new Promise((resolve, reject) => {
            try {
                const localDir = path.dirname(localFilePath);
                if (!fs.existsSync(localDir)) {
                    fs.mkdirSync(localDir, { recursive: true });
                }

                console.log(`[FILE TRANSFER] Downloading: ${remoteFilePath} → ${localFilePath}`);

                // Try multiple methods for file download
                const methods = [
                    () => this._downloadViaSCP(remoteFilePath, localFilePath),
                    () => this._downloadViaPowerShell(remoteFilePath, localFilePath),
                    () => this._downloadViaSSHNet(remoteFilePath, localFilePath)
                ];

                this._tryMethods(methods)
                    .then(() => {
                        console.log(`[FILE TRANSFER] ✔ Download complete: ${localFilePath}`);
                        resolve(localFilePath);
                    })
                    .catch(error => {
                        console.error(`[FILE TRANSFER] ✗ All download methods failed: ${error.message}`);
                        reject(error);
                    });
            } catch (error) {
                console.error(`[FILE TRANSFER] ✗ Download failed: ${error.message}`);
                reject(error);
            }
        });
    }

    /**
     * Execute remote command on Ubuntu
     */
    async executeRemote(command) {
        return new Promise((resolve, reject) => {
            try {
                const methods = [
                    () => this._executeViaPlink(command),
                    () => this._executeViaPowerShell(command),
                    () => this._executeViaSSHNet(command)
                ];

                this._tryMethods(methods)
                    .then(output => {
                        resolve(output);
                    })
                    .catch(error => {
                        console.warn(`[SSH] ⚠ All remote execution methods failed: ${error.message}`);
                        resolve("");
                    });
            } catch (error) {
                console.warn(`[SSH] ⚠ Remote execution skipped: ${error.message}`);
                resolve("");
            }
        });
    }

    /**
     * Try multiple methods until one succeeds
     */
    async _tryMethods(methods) {
        let lastError = null;
        for (const method of methods) {
            try {
                await method();
                return;
            } catch (error) {
                lastError = error;
                console.log(`[FILE TRANSFER] Method failed, trying next: ${error.message}`);
            }
        }
        throw lastError;
    }

    /**
     * Upload via SCP (Windows OpenSSH)
     */
    async _uploadViaSCP(localFilePath, remoteFilePath) {
        const remotePath = `${this.sshConfig.user}@${this.sshConfig.host}:${remoteFilePath}`;
        const cmd = `scp -P ${this.sshConfig.port} "${localFilePath}" "${remotePath}"`;
        execSync(cmd, { stdio: 'pipe' });
    }

    /**
     * Download via SCP (Windows OpenSSH)
     */
    async _downloadViaSCP(remoteFilePath, localFilePath) {
        const remotePath = `${this.sshConfig.user}@${this.sshConfig.host}:${remoteFilePath}`;
        const cmd = `scp -P ${this.sshConfig.port} "${remotePath}" "${localFilePath}"`;
        execSync(cmd, { stdio: 'pipe' });
    }

    /**
     * Execute via Plink
     */
    async _executeViaPlink(command) {
        const plink = 'C:\\Program Files\\PuTTY\\plink.exe';
        if (!fs.existsSync(plink)) {
            throw new Error('Plink not found');
        }
        const cmd = `"${plink}" -P ${this.sshConfig.port} ${this.sshConfig.user}@${this.sshConfig.host} "${command}"`;
        const output = execSync(cmd, { encoding: 'utf8' });
        return output.trim();
    }

    /**
     * Upload via PowerShell with PuTTY PSCP
     */
    async _uploadViaPowerShell(localFilePath, remoteFilePath) {
        const psCmd = `
$LocalFile = '${localFilePath.replace(/'/g, "''")}'
$RemoteFile = '${remoteFilePath}'
$RemoteHost = '${this.sshConfig.user}@${this.sshConfig.host}'
$Port = ${this.sshConfig.port}
$pscp = 'C:\\Program Files\\PuTTY\\pscp.exe'

if (Test-Path $pscp) {
    & $pscp -P $Port "$LocalFile" "$RemoteHost:$RemoteFile"
    if ($LASTEXITCODE -eq 0) {
        Write-Output "Upload successful"
        exit 0
    } else {
        Write-Error "Upload failed with code $LASTEXITCODE"
        exit 1
    }
} else {
    Write-Error "pscp.exe not found"
    exit 2
}
`;
        execSync(`powershell -Command "${psCmd.replace(/"/g, '\"')}"`, { stdio: 'pipe' });
    }

    /**
     * Download via PowerShell with PuTTY PSCP
     */
    async _downloadViaPowerShell(remoteFilePath, localFilePath) {
        const psCmd = `
$RemoteFile = '${remoteFilePath}'
$LocalFile = '${localFilePath.replace(/'/g, "''")}'
$RemoteHost = '${this.sshConfig.user}@${this.sshConfig.host}'
$Port = ${this.sshConfig.port}
$pscp = 'C:\\Program Files\\PuTTY\\pscp.exe'

if (Test-Path $pscp) {
    & $pscp -P $Port "$RemoteHost:$RemoteFile" "$LocalFile"
    if ($LASTEXITCODE -eq 0) {
        Write-Output "Download successful"
        exit 0
    } else {
        Write-Error "Download failed with code $LASTEXITCODE"
        exit 1
    }
} else {
    Write-Error "pscp.exe not found"
    exit 2
}
`;
        execSync(`powershell -Command "${psCmd.replace(/"/g, '\"')}"`, { stdio: 'pipe' });
    }

    /**
     * Execute via PowerShell with PuTTY Plink
     */
    async _executeViaPowerShell(command) {
        const psCmd = `
$cmd = '${command.replace(/'/g, "''")}'
$host = '${this.sshConfig.user}@${this.sshConfig.host}'
$port = ${this.sshConfig.port}
$ssh = 'C:\\Program Files\\PuTTY\\plink.exe'

if (Test-Path $ssh) {
    $output = & $ssh -P $port "$host" "$cmd" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Output $output
        exit 0
    } else {
        Write-Error "Command failed with code $LASTEXITCODE"
        exit 1
    }
} else {
    Write-Error "plink.exe not found"
    exit 2
}
`;
        const output = execSync(`powershell -Command "${psCmd.replace(/"/g, '\"')}"`, { encoding: 'utf8' });
        return output.trim();
    }

    /**
     * Placeholder for SSH.NET method
     */
    async _uploadViaSSHNet(localFilePath, remoteFilePath) {
        throw new Error('SSH.NET not implemented');
    }

    /**
     * Placeholder for SSH.NET method
     */
    async _downloadViaSSHNet(remoteFilePath, localFilePath) {
        throw new Error('SSH.NET not implemented');
    }

    /**
     * Placeholder for SSH.NET method
     */
    async _executeViaSSHNet(command) {
        throw new Error('SSH.NET not implemented');
    }
}

module.exports = FileTransfer;
