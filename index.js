var fs = require('fs');
var YAML = require('json2yaml');
var tomlify = require('tomlify-j0.4');
var source = process.argv[2];
var frontMatterFormat = process.argv[3];
var menuNames = ["mainmenu", "blog-categories"];
var db = fs.readFileSync(source, 'utf-8');
var json = JSON.parse(db);
var final = {
  menu: {}
};

var menus = json.filter(item => {
  return item.name === "rx5ol_menu";
});

menuNames.forEach(menuName => {
  var menuItems = menus[0].data.filter(item => {
    return item.menutype === menuName;
  });
  var json = menuItems.map(item => {
    var parentMenuItem = menuItems.find(menuItem => {
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
  final.menu[menuName] = json;
});

if (frontMatterFormat === 'toml') {
  final = tomlify.toToml(final, {space: 2});
} else if (frontMatterFormat ==='yml' || frontMatterFormat ==='yaml') {
  final = YAML.stringify(final);
} else {
  if (frontMatterFormat !=='json') {
    console.log(chalk.red(`${frontMatterFormat} is not a valid output format. Use 'toml', 'yml', 'yaml' ot 'json'. JSON has been used as the default.`));
  }
  final = JSON.stringify(final);
}
var filepath = `./menu-output.${frontMatterFormat}`;
fs.writeFile(filepath, final, function(err) {
  if(err) {
    console.log(err);
  }
  console.log(`Succes! ${filepath} was saved!`);
});


// console.log(JSON.stringify(final, null, 2));