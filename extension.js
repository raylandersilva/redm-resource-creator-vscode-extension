const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
    let disposable = vscode.commands.registerCommand('redm-resource-creator.createResource', async function (uri) {
        // Obter informações básicas do recurso
        const resourceName = await vscode.window.showInputBox({
            prompt: 'Enter RedM resource name',
            placeHolder: 'my_resource'
        });

        if (!resourceName) return;

        const author = await vscode.window.showInputBox({
            prompt: 'Enter author name',
            placeHolder: 'Your Name'
        });

        const description = await vscode.window.showInputBox({
            prompt: 'Enter resource description',
            placeHolder: 'A custom resource for RedM'
        });

        const version = await vscode.window.showInputBox({
            prompt: 'Enter initial version',
            placeHolder: '1.0.0',
            value: '1.0.0'
        });

        // Verificar se o usuário cancelou algum prompt
        if ([author, description, version].some(field => field === undefined)) {
            return;
        }

        const targetFolder = uri?.fsPath || 
                           vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        
        if (!targetFolder) {
            vscode.window.showErrorMessage('Open a folder/workspace first!');
            return;
        }

        const resourcePath = path.join(targetFolder, resourceName);
        
        try {
            // Create folder structure
            fs.mkdirSync(resourcePath);
            ['client', 'server', 'shared'].forEach(dir => {
                fs.mkdirSync(path.join(resourcePath, dir));
            });

            // Create files from templates
            const files = {
                'fxmanifest.lua': `fx_version 'cerulean'
game 'rdr3'
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'

author '${author || 'Your Name'}'
description '${description || 'A custom resource for RedM'}'
version '${version || '1.0.0'}'

client_scripts {
    'client/client.lua'
}

server_scripts {
    'server/server.lua'
}

shared_scripts {
    'shared/shared.lua'
}

lua54 'yes'`,
                'client/client.lua': `-- Client script for ${resourceName}
print('^2[${resourceName}]^0 client script loaded')`,
                'server/server.lua': `-- Server script for ${resourceName}
print('^2[${resourceName}]^0 server script loaded')`,
                'shared/shared.lua': `-- Shared script for ${resourceName}
Config = {}

print('^2[${resourceName}]^0 shared script loaded')`
            };

            Object.entries(files).forEach(([filePath, content]) => {
                fs.writeFileSync(path.join(resourcePath, filePath), content);
            });

            vscode.window.showInformationMessage(`Successfully created ${resourceName} resource!`);
            vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
            
            // Open the manifest file
            const manifestUri = vscode.Uri.file(path.join(resourcePath, 'fxmanifest.lua'));
            vscode.window.showTextDocument(manifestUri);
        } catch (error) {
            vscode.window.showErrorMessage(`Error creating resource: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };