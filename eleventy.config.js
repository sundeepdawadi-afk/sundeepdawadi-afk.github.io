/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig) {
  // Static assets live in public/ and are copied as-is to the site root
  eleventyConfig.addPassthroughCopy({ public: "/" });

  // Blog tag pages: /tags/<tag>/
  eleventyConfig.addCollection("posts", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/blog/*.md")
      .sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate))
  );

  eleventyConfig.addCollection("tagList", (collectionApi) => {
    const tagSet = new Set();
    collectionApi.getFilteredByGlob("src/blog/*.md").forEach((item) => {
      (item.data.tags || []).forEach((t) => tagSet.add(t));
    });
    return [...tagSet].sort();
  });

  // "MMM d, yyyy" style dates
  eleventyConfig.addFilter("readableDate", (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  });

  eleventyConfig.addFilter("isoDate", (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString();
  });

  // Limit + sort helpers for collections
  eleventyConfig.addFilter("head", (array, n) => (Array.isArray(array) ? array.slice(0, n) : []));

  // First n posts in the collection that aren't the current URL (for Related Post)
  eleventyConfig.addFilter("related", (collection, currentUrl, n = 2) =>
    (collection || []).filter((p) => p.url !== currentUrl).slice(0, n)
  );

  eleventyConfig.addFilter("slugifyTag", (tag) =>
    String(tag)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  );

  // Absolute URL helper for RSS/sitemap
  eleventyConfig.addFilter("absoluteUrl", (url, base) => {
    if (!url) return base || "";
    if (/^https?:\/\//.test(url)) return url;
    return new URL(url, base || "https://sundeepdawadi-afk.github.io").toString();
  });

  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));

  return {
    dir: {
      input: "src",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data",
      output: "_site",
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
