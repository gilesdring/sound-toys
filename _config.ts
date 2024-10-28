import lume from "lume/mod.ts";
import base_path from "lume/plugins/base_path.ts";
import esbuild from "lume/plugins/esbuild.ts";
import transformImages from "lume/plugins/transform_images.ts";
import postcss from "lume/plugins/postcss.ts";

const site = lume({
  src: "./src",
  location: new URL("https://gilesdring.com/sound-toys/"),
});

site
  .use(esbuild({
    options: {
      format: "iife",
      globalName: "soundToys",
      // minify: true,
    },
  }))
  .use(transformImages())
  .use(base_path())
  .use(postcss());
  // .copy([".png", ".jpg"]);

export default site;
