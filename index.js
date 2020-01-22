var fs = require('fs');
var source = process.argv[2];
var frontMatterFormat = process.argv[3];
var outputDirectory = process.argv[4];
var dbPrefix = process.argv[5];
var menuNames = ["mainmenu"];
var db = fs.readFileSync(source, 'utf-8');
var json = JSON.parse(db);
var toMarkdown = require('to-markdown');
var lib = require('./lib.js');
const chalk = require('chalk');

var final = {
  pages: [],
  menus: {}
};

var menus = json.filter(item => {
  return item.name === `${dbPrefix}menu`;
});

menuNames.forEach(menuName => {
  var filteredMenuItems = menus[0].data.filter(item => {
    return item.menutype === menuName;
  });
  var json = filteredMenuItems.map(item => {
    var parentMenuItem = filteredMenuItems.find(menuItem => {
      return menuItem.id === item.parent_id;
    });
    var object = {};
    object.url = item.path;
    object.name = item.title;
    if (parentMenuItem) {
      object.parent = parentMenuItem.path;
    }
    return object;
  });
  final.menus[menuName] = json;
});

var menuItems = json.filter(item => {
  return item.name === `${dbPrefix}menu`;
})[0].data;

var k2Items = json.filter(item => {
  return item.name === `${dbPrefix}k2_items`;
})[0].data;

var k2ExtraFields = json.filter(item => {
  return item.name === `${dbPrefix}k2_extra_fields`;
})[0].data;

var k2Categories = json.filter(item => {
  return item.name === `${dbPrefix}k2_categories`;
})[0].data;

var k2AdditionalCategories = json.filter(item => {
  return item.name === `${dbPrefix}k2_additional_categories`
})[0].data;

var hugoContentItems = [];

k2Items.forEach(item => {
  var hugoContentItem = {
    frontMatter: {
      tags: [],
      categories: []
    },
    content: {}
  };
  // Data from the item itself
  hugoContentItem.frontMatter.title = item.title;
  hugoContentItem.frontMatter.weight = item.ordering;
  hugoContentItem.frontMatter.publish_date = item.publish_up;
  hugoContentItem.frontMatter.date = item.created;

  // Add the main category alias ot the frontmatter object.
  var itemCategoryObject = k2Categories.find(cat => {
    return cat.id === item.catid;
  });
  hugoContentItem.frontMatter.categories.push(itemCategoryObject.alias);
 
  // Add the aliases of the additional catgeories to the frontmatter object.
  var itemAdditionalCategories = k2AdditionalCategories.filter(k2AdditionalCategory => {
    return k2AdditionalCategory.itemID === item.id;
  });
  itemAdditionalCategories.forEach(item => {
    hugoContentItem.frontMatter.categories.push(lib.getFieldPropById(k2Categories, item.catid, 'alias'));
  });

  // Date from the related extra fields
  var itemExtraFieldsContent = JSON.parse(item.extra_fields);
  itemExtraFieldsContent = itemExtraFieldsContent || [];

  itemExtraFieldsContent.forEach(efc => {
    var extraFieldObject = k2ExtraFields.find(ef => {
      return ef.id === efc.id;
    });
    if (extraFieldObject.name === 'Intro Text') {     
      hugoContentItem.content.intro_text = toMarkdown(efc.value);
    } else if (extraFieldObject.name === 'Full Text') {
      hugoContentItem.content.full_text = toMarkdown(efc.value);
    } else {
      if (efc.value !== '') {
        hugoContentItem.frontMatter[lib.downcaseUnderscore(extraFieldObject.name)] = efc.value;
      }
    }
  });

  if (!hugoContentItem.intro_text && item.introtext.split('').length > 0) {
    hugoContentItem.content.intro_text = toMarkdown(item.introtext);
  }

  if (!hugoContentItem.full_text && item.fulltext.split('').length > 0) {
    hugoContentItem.content.full_text = toMarkdown(item.fulltext);
  }
  var itemUrl;
  
  // Get the page URL
    if (lib.getK2ItemMenuItemById(item.id, menuItems)) {
    itemUrl = lib.getK2ItemMenuItemById(item.id, menuItems).path;
  } else {
    var catPath = lib.findParents(itemCategoryObject, [itemCategoryObject.alias], k2Categories);
    itemUrl = lib.parseUrl(`${catPath.join('/')}/${item.alias}`);
  }

  hugoContentItem.url = itemUrl;
  hugoContentItem.frontMatter.url = itemUrl;
  hugoContentItems.push(hugoContentItem);
});

final.pages = hugoContentItems;

var createFilePromises = [];
final.pages.forEach(item => {
  var fileOutPutPath = lib.fileOutputPathfromUrl(item.url, outputDirectory);
  createFilePromises.push(lib.createMDFile(item, fileOutPutPath, frontMatterFormat));
});
createFilePromises.push(lib.createMenuFile(final.menus, lib.fileOutputPathfromUrl('/', outputDirectory), frontMatterFormat, outputDirectory));
return Promise.all(createFilePromises).then(response => {
  console.log(chalk.green('Finished creating files.'));
}).catch(err => {
  console.log(err);
});