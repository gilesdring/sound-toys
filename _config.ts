import lume from "lume/mod.ts";
import esbuild from "lume/plugins/esbuild.ts";
import base_path from "lume/plugins/base_path.ts";

const site = lume({
  src: './src',
  location: new URL('https://gilesdring.com/sound-toys/'),
});

site
  .use(esbuild({
    options: {
      format: 'iife',
      globalName: 'app',
      minify: true,
    },
  }))
  .use(base_path())
  .loadAssets(['.css'])
  .copy(['.png']);

export default site;
