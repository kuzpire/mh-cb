(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ClanBanner = factory();
})(typeof globalThis !== "undefined" ? globalThis : (typeof self !== "undefined" ? self : this), function () {
  "use strict";

  var DYE = {
    WHITE: "#F9FFFE", ORANGE: "#F9801D", MAGENTA: "#C74EBD", LIGHT_BLUE: "#3AB3DA",
    YELLOW: "#FED83D", LIME: "#80C71F", PINK: "#F38BAA", GRAY: "#474F52",
    LIGHT_GRAY: "#9D9D97", CYAN: "#169C9C", PURPLE: "#8932B8", BLUE: "#3C44AA",
    BROWN: "#835432", GREEN: "#5E7C16", RED: "#B02E26", BLACK: "#1D1D21",
  };

  var FRONT_VIEWBOX = "1 1 20 40";

  var uid = 0;

  function hexToScale(hex) {
    var h = hex.replace("#", "");
    return {
      r: parseInt(h.slice(0, 2), 16) / 255,
      g: parseInt(h.slice(2, 4), 16) / 255,
      b: parseInt(h.slice(4, 6), 16) / 255,
    };
  }

  function tintFilter(id, hex) {
    var k = hexToScale(hex);
    return (
      '<filter id="' + id + '" color-interpolation-filters="sRGB" ' +
      'x="0" y="0" width="100%" height="100%">' +
      '<feColorMatrix type="matrix" values="' +
      k.r + " 0 0 0 0  0 " + k.g + " 0 0 0  0 0 " + k.b + " 0 0  0 0 0 1 0" +
      '"/></filter>'
    );
  }

  function layer(href, filterId) {
    return (
      '<g filter="url(#' + filterId + ')">' +
      '<svg x="0" y="0" width="20" height="40" viewBox="' + FRONT_VIEWBOX + '" ' +
      'preserveAspectRatio="none">' +
      '<image href="' + href + '" xlink:href="' + href + '" ' +
      'x="0" y="0" width="64" height="64" ' +
      'style="image-rendering:pixelated;image-rendering:crisp-edges"/>' +
      "</svg></g>"
    );
  }

  function parse(banner) {
    var baseColor = "CYAN";
    var layers = [];
    if (banner) {
      var parts = String(banner).split(";");
      if (parts[0]) baseColor = parts[0].trim().toUpperCase();
      if (parts[1]) {
        parts[1].split(",").forEach(function (entry) {
          var kv = entry.split(":");
          var pattern = (kv[0] || "").trim().toLowerCase();
          var color = (kv[1] || "").trim().toUpperCase();
          if (pattern) layers.push({ pattern: pattern, color: color });
        });
      }
    }
    return { baseColor: baseColor, layers: layers };
  }

  function bannerSvg(banner, opts) {
    opts = opts || {};
    var textureBase = opts.textureBase || "assets/banner/";
    var resolve =
      opts.resolve ||
      function (name) {
        return textureBase + name + ".png";
      };
    var width = opts.width == null ? "100%" : opts.width;
    var height = opts.height == null ? "100%" : opts.height;

    var parsed = parse(banner);
    var prefix = "cb" + ++uid + "-";

    var filters = {};
    function filterFor(colorName) {
      var hex = DYE[colorName] || DYE.WHITE;
      var id = prefix + (DYE[colorName] ? colorName : "WHITE");
      if (!filters[id]) filters[id] = tintFilter(id, hex);
      return id;
    }

    var body = "";
    body += layer(resolve("base"), filterFor(parsed.baseColor));
    parsed.layers.forEach(function (l) {
      body += layer(resolve(l.pattern), filterFor(l.color));
    });

    var defs = "<defs>";
    for (var id in filters) defs += filters[id];
    defs += "</defs>";

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" ' +
      'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
      'viewBox="0 0 20 40" width="' + width + '" height="' + height + '" ' +
      'preserveAspectRatio="none" shape-rendering="crispEdges">' +
      defs + body +
      "</svg>"
    );
  }

  return { bannerSvg: bannerSvg, DYE: DYE };
});
