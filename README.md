# mu-epub-reader

Epub viewer on Electron.

This application is forked of [futurepress/epubjs-reader: Epub.js Reader](https://github.com/futurepress/epubjs-reader).

## Features

- Standalone Electron app
- Integrate with Google Translation
- Shortcuts: 
    - <kbd>j</kbd> or <kbd>Space</kbd>: Scroll down
    - <kbd>k</kbd> or <kbd>Shift+Space</kbd>: Scroll up
    - <kbd>Cmd+o</kbd>: Open file
    - <kbd>Cmd+^</kbd>: Increase font size
    - <kbd>Cmd+-</kbd>: Decrease font size
    - <kbd>Cmd+0</kbd>: Reset font size
- One column mode: continuous scroll like PDF
- Open file with arguments

![en](./docs/img/en.png)
![ja](./docs/img/ja.png)

> Quote from <https://book.systemsapproach.org/>

## Usage

1. Click *File* > *Open File* 
2. Select epub file
3. View epub

![menu](./docs/img/menu.png)

or

1. Open epub file with mu-epub-reader
2. View epub

## Installation

Download app from artifacts and Install it.

- [Download from Latest Release](https://github.com/azu/mu-epub-reader/releases/latest)

:warning: This app is not signed. So, it will appear warning about un-signed app.

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
