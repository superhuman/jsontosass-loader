"use strict";

var loaderUtils = require("loader-utils");
var fs = require('fs');
var path = require("path");
module.exports = function(content) {

  var query = loaderUtils.getOptions(this);

	var contentPath = path.resolve(query.path);
  var parsedContentPath = path.parse(path.resolve(query.path));
	var obj = {};

	if(parsedContentPath.ext === ".json") {
		obj = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
	} else
	if(parsedContentPath.ext === ".js") {
		obj = JSON.parse(JSON.stringify(require(contentPath)));

		var propName = false
			|| query.p
			|| query.prop
			|| query.props
			|| query.property
			|| query.properties
			|| query.propName
			|| query.propNames
			|| false;

		if(propName) {
			var propNames = propName.split(".");
			propNames.forEach(function(prop) {
				obj = obj[prop];
			});
		}
	} else {
		throw "Invalid jsontosass file type (" + parsedContentPath.ext + ")";
	}

	this.cacheable();
	this.addDependency(contentPath);


  function jsonToSassVars (obj, indent) {
    // Make object root properties into sass variables
    var sass = "";
    for (var key in obj) {
      sass += "$" + key + ":" + JSON.stringify(obj[key], null, indent) + ";\n";
    }

    if (!sass) {
      return sass
    }

    // Store string values (so they remain unaffected)
    var storedStrings = [];
    sass = sass.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, function (str) {

      var id = "___JTS" + storedStrings.length;
      storedStrings.push({id: id, value: str});
      return id;
    });

    // Convert js lists and objects into sass lists and maps
    sass = sass.replace(/[{\[]/g, "(").replace(/[}\]]/g, ")");

    // Put string values back (now that we're done converting)
    storedStrings.forEach(function (str) {
      str.value = str.value.replace(/["']/g, '');
      sass = sass.replace(str.id, str.value);
    });

    return sass;
  }


  var sass = jsonToSassVars(obj);

  return sass ? sass + '\n' + content : content;
}
