var jsdom = require("jsdom");
var mkdirp = require('mkdirp');
var nodeUrl = require('url');
var YAML = require('json2yaml');
var tomlify = require('tomlify-j0.4');
var path = require('path');
var fs = require('fs');
const chalk = require('chalk');

module.exports = {
  mkdirP: function(dirPath) {
    mkdirp.sync(dirPath);
  },

  parseUrl: function(string) {
    return string.replace(/\/\/+/g, '/').replace(/\s+/g, '-');
  },

  createMDFile: function(object, fileOutPutPath, frontMatterFormat) {
    var frontMatter = object.frontMatter || {};
    var content = object.content || {};
    return new Promise((resolve, reject) => { 
      var frontMatterDelimiter;
      if (frontMatterFormat === 'toml') {
        frontMatterDelimiter = '+++';
      } else if (frontMatterFormat ==='yml' || frontMatterFormat ==='yaml') {
        frontMatterDelimiter = '---';
      }
      var final = '';
      if (frontMatterFormat === 'toml') {
        // Only for toml, because JSON doesn't have delimiters and with yml, the YAML dep adds the first delimiter for you.
        final += `${frontMatterDelimiter}\n`;
      }
      if (frontMatterFormat === 'toml') {
        final += tomlify.toToml(frontMatter, {space: 2});
      } else if (frontMatterFormat ==='yml' || frontMatterFormat ==='yaml') {
        final += YAML.stringify(frontMatter);
      } else {
        if (frontMatterFormat !=='json') {
          console.log(chalk.red(`${frontMatterFormat} is not a valid output format. Use 'toml', 'yml', 'yaml' ot 'json'. JSON has been used as the default.`));
        }
        final += JSON.stringify(frontMatter, null, 2);
      }
      if (frontMatterFormat === 'toml') {
        final += `\n${frontMatterDelimiter}\n\n`;
      } else if (frontMatterFormat ==='yml' || frontMatterFormat ==='yaml') {
        final += `${frontMatterDelimiter}\n\n`;
      } else {
        // When the frontMatter format is JSON, just add an empty line between the front matter and the content.
        final += '\n\n';
      }
      
      if (content.intro_text) {
        final += `${content.intro_text} \n`;
      }
      if (content.intro_text && content.full_text) {
        final += '<!--more-->\n';
      }
      if (content.full_text) {
        final += (content.full_text).replace(content.intro_text, '').trim();
      }
      var directoryOutPutPath = path.dirname(fileOutPutPath);
      this.mkdirP(directoryOutPutPath);
      var filepath = fileOutPutPath;
      fs.writeFile(filepath, final, function(err) {
        if(err) {
          reject(err);
        }
        resolve(`Succes! ${filepath} was saved!`);
      });
    });
  },

  fileOutputPathfromUrl: function(url, outputDirectory) {
    var directory = outputDirectory || "output";
    var fullPath = nodeUrl.parse(url).path;
    return this.parseUrl(`${directory}/${fullPath}.md`);
  },

  createMenuFile: function(allMenus, fileOutPutPath, frontMatterFormat, outputDirectory) {
    return new Promise((resolve, reject) => { 
      var final;
      if (frontMatterFormat === 'toml') {
        final = tomlify.toToml(allMenus, {space: 2});
      } else if (frontMatterFormat ==='yml' || frontMatterFormat ==='yaml') {
        final = YAML.stringify(allMenus);
      } else {
        if (frontMatterFormat !=='json') {
          console.log(chalk.red(`${frontMatterFormat} is not a valid output format. Use 'toml', 'yml', 'yaml' ot 'json'. JSON has been used as the default.`));
        }
        final = JSON.stringify(allMenus);
      }
      var filepath = `${outputDirectory}/menu-output.${frontMatterFormat}`;
      fs.writeFile(filepath, final, function(err) {
        if(err) {
          reject(err);
        }
        resolve(`Succes! ${filepath} was saved!`);
      });
    });
  },
  
  getK2ItemMenuItemById(itemId, menuItems) {
    return menuItems.find(mi => {
      var splitLink = mi.link.split(/[?=&]+/);
      if (splitLink[2] === 'com_k2' && splitLink[4] === 'item') {
        return itemId === splitLink[splitLink.length - 1];
      }
    });
  },
  
  getFieldPropById(collection, itemId, prop) {
    var object = collection.find(item => {
      return item.id === itemId;
    });
    return object[prop];
  },
  
  downcaseUnderscore(string) {
    return string.toLowerCase().replace(/ /g, '_');
  },
  
  parentCategoryObject(categoryObject, k2Categories) {
    if (categoryObject.parent && categoryObject.parent !== "0") {
      return k2Categories.find(cat => {
        return cat.id === categoryObject.parent;
      });
    }
  },
  
  findParents(current, acc, k2Categories) {
    acc = acc || [];
    var parent = this.parentCategoryObject(current, k2Categories);
    if (parent) {
      acc.unshift(parent.alias);
      return this.findParents(parent, acc);
    } else {
      return acc;
    }
  }
};