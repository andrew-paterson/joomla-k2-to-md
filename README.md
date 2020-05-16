## How to run it

`node index.js path-to-json frontmatter-format output-path db_prefix`

Note that the full DB prefix must be given for `db_prefix`, including the trailing underscore, eg `xp0hq_`.

## Notes

### K2 Items

* Unpublished items get `draft = true` in frontmatter.
* Trashed items get `draft = true` and `trashed = true` in frontmatter.

## Previwing the DB in the developer console

Ensure the database is saved inside `joomla-k2-md/db-previewer`.

Update the `pathToDb` in `joomla-k2-md/db-previewer/index.html` to the path your abovementioned JSON db.

From the root of `joomla-k2-md/db-previewer` start a server.

Eg `php -S localhost:8000`.

Then go to the server address (In the above example, `http://localhost:8000`).

The DB will be logged to the developer console on load.


TODO:

tags
category description
identifier for menu output, where menu has children.
Menu item urls mush have / at the start in the toml.
menu items must get weight
item images
section _index.md file from category data in DB
