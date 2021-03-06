var EPUBJS = EPUBJS || {};
EPUBJS.reader = {};
EPUBJS.reader.plugins = {}; //-- Attach extra Controllers as plugins (like search?)

(function (root, $) {

    var previousReader = root.ePubReader || {};

    var ePubReader = root.ePubReader = function (path, options) {
        return new EPUBJS.Reader(path, options);
    };

    //exports to multiple environments
    if (typeof define === 'function' && define.amd) {
        //AMD
        define(function () {
            return Reader;
        });
    } else if (typeof module != "undefined" && module.exports) {
        //Node
        module.exports = ePubReader;
    }

})(window, jQuery);

EPUBJS.Reader = function (bookPath, _options) {
    var reader = this;
    var book;
    var plugin;
    var $viewer = $("#viewer");
    var search = window.location.search;
    var parameters;

    this.settings = EPUBJS.core.defaults(_options || {}, {
        bookPath: bookPath,
        restore: false,
        reload: false,
        bookmarks: undefined,
        annotations: undefined,
        contained: undefined,
        bookKey: undefined,
        styles: undefined,
        sidebarReflow: false,
        generatePagination: false,
        history: true
    });

    // Overide options with search parameters
    if (search) {
        parameters = search.slice(1).split("&");
        parameters.forEach(function (p) {
            var split = p.split("=");
            var name = split[0];
            var value = split[1] || '';
            reader.settings[name] = decodeURIComponent(value);
        });
    }

    this.setBookKey(this.settings.bookPath); //-- This could be username + path or any unique string

    if (this.settings.restore && this.isSaved()) {
        this.applySavedSettings();
    }

    this.settings.styles = {
        fontSize: "100%",
        manager: "continuous",
        flow: "scrolled",
        width: "100%",
        height: "100%"
    };

    this.book = book = new ePub(this.settings.bookPath, this.settings);


    this.offline = false;
    this.sidebarOpen = false;
    if (!this.settings.bookmarks) {
        this.settings.bookmarks = [];
    }

    if (!this.settings.annotations) {
        this.settings.annotations = [];
    }

    if (this.settings.generatePagination) {
        book.generatePagination($viewer.width(), $viewer.height());
    }

    this.rendition = book.renderTo("viewer", {
        ignoreClass: "annotator-hl",
        manager: "continuous",
        flow: "scrolled",
        width: "100%",
        height: "100%",
        stylesheet: new URL("css/epub.css", location.href)
    });

    if (this.settings.previousLocationCfi) {
        this.displayed = this.rendition.display(this.settings.previousLocationCfi);
    } else {
        this.displayed = this.rendition.display();
    }

    book.ready.then(function () {
        reader.ReaderController = EPUBJS.reader.ReaderController.call(reader, book);
        reader.SettingsController = EPUBJS.reader.SettingsController.call(reader, book);
        reader.ControlsController = EPUBJS.reader.ControlsController.call(reader, book);
        reader.SidebarController = EPUBJS.reader.SidebarController.call(reader, book);
        reader.BookmarksController = EPUBJS.reader.BookmarksController.call(reader, book);
        reader.NotesController = EPUBJS.reader.NotesController.call(reader, book);

        // location!!
        function setupProgressBar(rendition) {
            // https://github.com/futurepress/epub.js/issues/744#issuecomment-492300092
            // Display the book
            var displayed = rendition.display(window.location.hash.substr(1) || undefined);
            displayed.then(function () {
                console.log('rendition.currentLocation():', rendition.currentLocation());
            });
            // Generate location and pagination
            book.ready.then(function () {
                var stored = localStorage.getItem(book.key() + '-locations');
                if (stored) {
                    return book.locations.load(stored);
                } else {
                    return book.locations.generate(1024); // Generates CFI for every X characters (Characters per/page)
                }
            }).then(function () { // This promise will take a little while to return (About 20 seconds or so for Moby Dick)
                localStorage.setItem(book.key() + '-locations', book.locations.save());
            });
            // When navigating to the next/previous page
            var progressElement = document.querySelector("#progress");
            rendition.on('relocated', function (locations) {
                var progress = book.locations.percentageFromCfi(locations.start.cfi);
                var currentPage = book.locations.locationFromCfi(locations.start.cfi);
                var totalPage = book.locations.total;
                progressElement.value = progress;
                console.log(progress, currentPage, totalPage)
            });
        }

        setupProgressBar(this.rendition);
        // ~~~
        window.addEventListener("hashchange", this.hashChanged.bind(this), false);
        document.addEventListener('keydown', function (event) {
            this.adjustFontSize.call(this, event)
            reader.ReaderController.arrowKeys.call(this, event)
            reader.ReaderController.scrollKeys.call(this, event)
        }.bind(this), {
            passive: false
        });

        this.rendition.on("keydown", this.adjustFontSize.bind(this));
        this.rendition.on("keydown", reader.ReaderController.arrowKeys.bind(this));
        this.rendition.on("keydown", reader.ReaderController.scrollKeys.bind(this));

        this.rendition.on("selected", this.selectedRange.bind(this));
    }.bind(this)).then(function () {
        reader.ReaderController.hideLoader();
    }.bind(this));

    // Call Plugins
    for (plugin in EPUBJS.reader.plugins) {
        if (EPUBJS.reader.plugins.hasOwnProperty(plugin)) {
            reader[plugin] = EPUBJS.reader.plugins[plugin].call(reader, book);
        }
    }

    book.loaded.metadata.then(function (meta) {
        reader.MetaController = EPUBJS.reader.MetaController.call(reader, meta);
    });

    book.loaded.navigation.then(function (navigation) {
        reader.TocController = EPUBJS.reader.TocController.call(reader, navigation);
    });

    window.addEventListener("beforeunload", this.unload.bind(this), false);

    return this;
};

// Default font size
var currentFontSize = 100;
EPUBJS.Reader.prototype.adjustFontSize = function (e) {
    var interval = 5;
    var PLUS = 187;
    var MINUS = 189;
    var ZERO = 48;
    var MOD = (e.ctrlKey || e.metaKey);
    if (MOD && e.keyCode == PLUS) {
        e.preventDefault();
        currentFontSize += interval;
        this.book.rendition.themes.fontSize((currentFontSize) + "%");

    }

    if (MOD && e.keyCode == MINUS) {
        e.preventDefault();
        currentFontSize -= interval
        this.book.rendition.themes.fontSize((currentFontSize) + "%");
    }

    if (MOD && e.keyCode == ZERO) {
        e.preventDefault();
        currentFontSize = 100;
        this.book.rendition.themes.fontSize(currentFontSize + "%");
    }
};

EPUBJS.Reader.prototype.addBookmark = function (cfi) {
    var present = this.isBookmarked(cfi);
    if (present > -1) return;

    this.settings.bookmarks.push(cfi);

    this.trigger("reader:bookmarked", cfi);
};

EPUBJS.Reader.prototype.removeBookmark = function (cfi) {
    var bookmark = this.isBookmarked(cfi);
    if (bookmark === -1) return;

    this.settings.bookmarks.splice(bookmark, 1);

    this.trigger("reader:unbookmarked", bookmark);
};

EPUBJS.Reader.prototype.isBookmarked = function (cfi) {
    var bookmarks = this.settings.bookmarks;

    return bookmarks.indexOf(cfi);
};

/*
EPUBJS.Reader.prototype.searchBookmarked = function(cfi) {
	var bookmarks = this.settings.bookmarks,
			len = bookmarks.length,
			i;

	for(i = 0; i < len; i++) {
		if (bookmarks[i]['cfi'] === cfi) return i;
	}
	return -1;
};
*/

EPUBJS.Reader.prototype.clearBookmarks = function () {
    this.settings.bookmarks = [];
};

//-- Notes
EPUBJS.Reader.prototype.addNote = function (note) {
    this.settings.annotations.push(note);
};

EPUBJS.Reader.prototype.removeNote = function (note) {
    var index = this.settings.annotations.indexOf(note);
    if (index === -1) return;

    delete this.settings.annotations[index];

};

EPUBJS.Reader.prototype.clearNotes = function () {
    this.settings.annotations = [];
};

//-- Settings
EPUBJS.Reader.prototype.setBookKey = function (identifier) {
    if (!this.settings.bookKey) {
        this.settings.bookKey = "epubjsreader:" + EPUBJS.VERSION + ":" + window.location.host + ":" + identifier;
    }
    return this.settings.bookKey;
};

//-- Checks if the book setting can be retrieved from localStorage
EPUBJS.Reader.prototype.isSaved = function (bookPath) {
    var storedSettings;

    if (!localStorage) {
        return false;
    }

    storedSettings = localStorage.getItem(this.settings.bookKey);

    if (storedSettings === null) {
        return false;
    } else {
        return true;
    }
};

EPUBJS.Reader.prototype.removeSavedSettings = function () {
    if (!localStorage) {
        return false;
    }

    localStorage.removeItem(this.settings.bookKey);
};

EPUBJS.Reader.prototype.applySavedSettings = function () {
    var stored;

    if (!localStorage) {
        return false;
    }

    try {
        stored = JSON.parse(localStorage.getItem(this.settings.bookKey));
    } catch (e) { // parsing error of localStorage
        return false;
    }

    if (stored) {
        // Merge styles
        if (stored.styles) {
            this.settings.styles = EPUBJS.core.defaults(this.settings.styles || {}, stored.styles);
        }
        // Merge the rest
        this.settings = EPUBJS.core.defaults(this.settings, stored);
        return true;
    } else {
        return false;
    }
};

EPUBJS.Reader.prototype.saveSettings = function () {
    if (this.book) {
        this.settings.previousLocationCfi = this.rendition.currentLocation().start.cfi;
    }

    if (!localStorage) {
        return false;
    }

    localStorage.setItem(this.settings.bookKey, JSON.stringify(this.settings));
};

EPUBJS.Reader.prototype.unload = function () {
    if (this.settings.restore && localStorage) {
        this.saveSettings();
    }
};


EPUBJS.Reader.prototype.hashChanged = function () {
    var hash = window.location.hash.slice(1);
    this.rendition.display(hash);
};

EPUBJS.Reader.prototype.selectedRange = function (cfiRange) {
    var cfiFragment = "#" + cfiRange;

    // Update the History Location
    if (this.settings.history &&
        window.location.hash != cfiFragment) {
        // Add CFI fragment to the history
        history.pushState({}, '', cfiFragment);
        this.currentLocationCfi = cfiRange;
    }
};

//-- Enable binding events to reader
RSVP.EventTarget.mixin(EPUBJS.Reader.prototype);
