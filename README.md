# mu-epub-reader

Epub viewer using Electron.

This application is forked of [futurepress/epubjs-reader: Epub.js Reader](https://github.com/futurepress/epubjs-reader).

## Features

- Standalone Electron app
- Integrate with Google Translation
- Scroll Shortcuts: 
    - <kbd>j</kbd> or <kbd>Space</kbd>: Scroll down
    - <kbd>k</kbd> or <kbd>Shift+Space</kbd>: Scroll up
- One column mode: continuous scroll like PDF
- Open file with arguments

![en](./docs/img/en.png)
![ja](./docs/img/ja.png)

> Quote from <https://www.computer-networking.info/1st/html/index.html>

## Usage

1. Click *File* > *Open File* 
2. Select epub file
3. View epub

![menu](./docs/img/menu.png)

## Installation

Download app from artifacts and Install it.

- [Download from Latest Release](https://github.com/azu/mu-epub-reader/releases/latest)

:memo: This app is not signed. So, it will appear warning about un-signed app.

## Development

Build electron app

    yarn install
    yarn run dist
    # output .app to dist/

## Related

- [azu/mu-pdf-viewer: PDF viewer on electron.](https://github.com/azu/mu-pdf-viewer)
    - PDF Viewer
- [Epub.js](http://futurepress.github.com/epub.js/) library


## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
