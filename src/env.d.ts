/// <reference types="astro/client" />

declare module "astro-pagefind/components/Search" {
  import type { AstroComponentFactory } from "astro/runtime/server/index.js";

  const Search: AstroComponentFactory;
  export default Search;
}
