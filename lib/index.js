var slog = {};

slog.storages = {
  LocalStorage: require("./LocalStorage"),
  InMemoryStorage: require("./InMemoryStorage"),
};

slog.level = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
  getName: function(level) {
    for (var x in this) {
      if (this[x] === level) return x;
    }
    return level;
  },
};

var currentStorage, currentLevel;

slog.reset = function() {
  currentStorage = new slog.storages.LocalStorage();
  currentLevel = slog.level.INFO;
};

slog.reset();

slog.useStorage = function(storage) {
  currentStorage = storage;
};

slog.getStorage = function() {
  return currentStorage;
};

slog.getLevel = function() {
  return currentLevel;
};

slog.setLevel = function(level) {
  currentLevel = level;
};

slog.exportEvents = function(dryRun) {
  var events = currentStorage.getEvents();
  if (!!events && events.length) {
    var illegalFilenameChars = /[-\:\.]/g;
    var firstDate = events[0].date.replaceAll(illegalFilenameChars, "_");
    var lastDate = events[events.length - 1].date.replaceAll(illegalFilenameChars, "_");
    var blob = new Blob([JSON.stringify(events, " ", 2)], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var downloadLink = document.createElement("a");
    downloadLink.download = "dashboard-events-" + firstDate + "-" + lastDate + ".json";
    downloadLink.href = url;
    if (typeof downloadLink.click !== "function") {
      throw Error("why does that 'anchor' element have no 'click' function..?");
    }
    if (!dryRun) {
      downloadLink.click();
    }
  }
};

function write(level, message) {
  if (level < currentLevel) return;

  var event = {
    level: level,
    date: new Date(),
    message: message,
  };

  currentStorage.append(event);

  // TODO: this should be reworked to retain the appropriate "console" method.. in the meantime, this will not aim to replace all logging calls.
  // console.log(event.date.toISOString() + ": " + slog.level.getName(level) + ": " + event.message);
}

function createWriteFunc(level) {
  return function(message) {
    write(level, message);
  };
}

for (var levelName in slog.level) {
  if (slog.level.hasOwnProperty(levelName)) {
    slog[levelName.toLowerCase()] = createWriteFunc(slog.level[levelName]);
  }
}

module.exports = slog;
