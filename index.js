'use strict';
const {
    app,
    shell,
    Menu,
    globalShortcut,
    ipcMain,
    clipboard,
    BrowserWindow
} = require("electron");
const path = require("path");
const windowStateKeeper = require('electron-window-state');
const defaultMenu = require('electron-default-menu');
const argv = require('minimist')(process.argv.slice(2));
const qs = require("querystring");
let openedFilePath;
app.once('open-file', function (event, filePath) {
    openedFilePath = filePath;
});
const openURL = (URL) => {
    if (/^https?:/.test(URL)) {
        shell.openExternal(URL, {
            activate: true
        });
    }
};
let mainWindow = null;
app.on('ready', function () {
    const mainWindowState = windowStateKeeper({
        defaultWidth: 1000,
        defaultHeight: 800,
        webPreferences: {
            nodeIntegration: false,
            webSecurity: false,
        }
    });
    mainWindow = new BrowserWindow({
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        'width': mainWindowState.width,
        'height': mainWindowState.height,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
        }
    });
    mainWindow.webContents.on('new-window', function (e) {
        openURL(e.url);
    });
    const openHTML = (filePath) => {
        const query = qs.stringify({
            bookPath: filePath
        });
        mainWindow.loadURL('file://' + __dirname + '/reader/index.html?' + query);
    };
    if (argv._ && argv._.length > 0) {
        const filePath = path.resolve(process.cwd(), argv._[0]);
        openHTML(filePath);
    } else if (argv.file) {
        const filePath = path.resolve(process.cwd(), argv.file);
        openHTML(filePath);
    } else if (openedFilePath) {
        openHTML(openedFilePath);
    } else {
        openHTML();
    }
    app.on('open-file', function (event, filePath) {
        event.preventDefault();
        openHTML(filePath);
    });
    if (process.env.NODE_ENV === "development") {
        mainWindow.webContents.openDevTools();
    }
    // Get template for default menu
    const isMac = process.platform === 'darwin';
    const template = [
        // { role: 'appMenu' }
        ...(process.platform === 'darwin' ? [{
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),
        // { role: 'fileMenu' }
        {
            label: 'File',
            submenu: [
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        // { role: 'editMenu' }
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...(isMac ? [
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    { role: 'selectAll' },
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            { role: 'startspeaking' },
                            { role: 'stopspeaking' }
                        ]
                    }
                ] : [
                    { role: 'delete' },
                    { type: 'separator' },
                    { role: 'selectAll' }
                ])
            ]
        },
        // { role: 'viewMenu' }
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forcereload' },
                { role: 'toggledevtools' },
                { type: 'separator' },
                // { role: 'resetzoom' },
                // { role: 'zoomin' },
                // { role: 'zoomout' },
                // { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        // { role: 'windowMenu' }
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' }
                ] : [
                    { role: 'close' }
                ])
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    app.on('window-all-closed', function () {
        app.quit();
    });
});
