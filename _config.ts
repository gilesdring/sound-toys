import lume from "lume/mod.ts";
import base_path from "lume/plugins/base_path.ts";
import esbuild from "lume/plugins/esbuild.ts";
import metas from "lume/plugins/metas.ts";
import postcss from "lume/plugins/postcss.ts";
import transformImages from "lume/plugins/transform_images.ts";

const site = lume({
  src: "./src",
  location: new URL("https://gilesdring.com/sound-toys/"),
});

site
  .use(esbuild({
    options: {
      treeShaking: true,
      minify: true,
    },
  }))
  .use(transformImages())
  .use(base_path())
  .use(metas())
  .use(postcss());
  // .copy([".png", ".jpg"]);

site.copy('/assets/fonts');

export default site;
