var fs = require('fs')

var readJSONFromFile = function (filename) {
    var content = fs.readFileSync(filename, "utf8");
    // Remove trailing BOM
    content = content.replace(/^\uFEFF/, '');

    return JSON.parse(content);
}

var lastSlashIndex = process.argv[1].lastIndexOf("/");
if (lastSlashIndex < 0) {
    lastSlashIndex = process.argv[1].lastIndexOf("\\");
}
var rootDir = process.argv[1].substring(0, lastSlashIndex + 1);

exports.readJSONFromFile = readJSONFromFile;
exports.rootDir = rootDir;
