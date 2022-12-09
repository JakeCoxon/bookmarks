/*

Tailwind - The Utility-First CSS Framework

A project by Adam Wathan (@adamwathan), Jonathan Reinink (@reinink),
David Hemphill (@davidhemphill) and Steve Schoger (@steveschoger).

Welcome to the Tailwind config file. This is where you can customize
Tailwind specifically for your project. Don't be intimidated by the
length of this file. It's really just a big JavaScript object and
we've done our very best to explain each section.

View the full documentation at https://tailwindcss.com.

*/

const global = this;

/* Utilities */
// const pxToRem = (px, base = 16) => `${px / base}rem`;
const pxToRem = (px, base = 16) => `${px}px`;
const getScaleValues = (step = 4, limit = 64) => {
  let scale = {};

  Array(limit / step)
    .fill()
    .map((value, key) => pxToRem(key + 1))
    .forEach((value, key) => {
      scale[(key + 1) * step] = value;
    });

  return scale;
};

/* Config */
// const defaultConfig = require('tailwindcss/defaultConfig')()

const colCalc = (maxCols, t, gutter) => {
  const mul = `(${t} / ${maxCols})`;
  // return `calc(100% - ${mul} - ${gutter}px * (1 - ${mul}))`;
  return `calc((((100% - ((${maxCols} - 1) * ${gutter}px)) / ${maxCols}) * ${t}) + ((${t} - 1) * ${gutter}px))`;
};
//`calc((((100% - ((${t} - 1) * ${g}px)) / ${t}) * ${n}) + ((${g} - 1) * ${g}px))`;

const colors = {
  transparent: "transparent",
  black: "#000",
  white: "#fff",
  primary: "var(--color-primary)",
  secondary: "var(--color-secondary)",

  // https://tailwind.ink stripe palette

  // gray https://www.tailwindshades.com/#color=217%2C17%2C15&step-up=10&step-down=3&hue-shift=-16&name=shark&base-stop=6&overrides=e30%3D
  gray: {
    50: "#A5B3C0",
    100: "#97A6B5",
    200: "#798CA0",
    300: "#5F7186",
    400: "#4A5768",
    500: "#353E4B",
    600: "#20252D",
    700: "#191D24",
    800: "#13161B",
    900: "#0D0E12",
  },
  blue: {
    50: "#F5FCFF",
    100: "#D9EDFF",
    200: "#ACCFFC",
    300: "#85ACF4",
    400: "#758CEC",
    500: "#5C66D2",
    600: "#414AA6",
    700: "#313B84",
    800: "#262C62",
    900: "#152041",
  },
  teal: {
    50: "#EEFDFE",
    100: "#CFF3FB",
    200: "#8ED8E9",
    300: "#62BDE4",
    400: "#4D9DCE",
    500: "#277FB5",
    600: "#1C5B92",
    700: "#154876",
    800: "#0F3451",
    900: "#082530",
  },
  emerald: {
    50: "#F2FEEE",
    100: "#CFF7C9",
    200: "#91E396",
    300: "#52D080",
    400: "#3EB574",
    500: "#288D60",
    600: "#216B44",
    700: "#18533A",
    800: "#113B34",
    900: "#0A2627",
  },
  orange: {
    50: "#FBF9EA",
    100: "#F6E4BA",
    200: "#E7C07B",
    300: "#DC9742",
    400: "#CB7519",
    500: "#AD5102",
    600: "#893301",
    700: "#6C2706",
    800: "#501A0F",
    900: "#361206",
  },
  chestnut: {
    50: "#FEFAEE",
    100: "#FCE2C0",
    200: "#EFB586",
    300: "#E78B5F",
    400: "#D7664B",
    500: "#B34434",
    600: "#912728",
    700: "#731620",
    800: "#550F1C",
    900: "#3B0B14",
  },
  cerise: {
    50: "#FEF7F4",
    100: "#FBE0DD",
    200: "#F2AFB3",
    300: "#EC798B",
    400: "#DC5472",
    500: "#BC3263",
    600: "#98184D",
    700: "#73123F",
    800: "#560E39",
    900: "#3B0427",
  },
  purple: {
    50: "#FEF7FF",
    100: "#F8DDF4",
    200: "#E8ADE1",
    300: "#D882D9",
    400: "#BF62CF",
    500: "#9B47B2",
    600: "#743095",
    700: "#57237E",
    800: "#3D1867",
    900: "#2A0D53",
  },
  indigo: {
    50: "#F8F9FE",
    100: "#E7E5FC",
    200: "#C6C0E9",
    300: "#AE9DDE",
    400: "#9B7AD8",
    500: "#7F58BE",
    600: "#5F4199",
    700: "#4A2D7F",
    800: "#362164",
    900: "#20144C",
  },
};

const spacing = {
  px: "1px",
  0: "0",
  1: pxToRem(4),
  2: pxToRem(8),
  3: pxToRem(12),
  4: pxToRem(16),
  5: pxToRem(20),
  6: pxToRem(24),
  8: pxToRem(32),
  10: pxToRem(40),
  12: pxToRem(48),
  16: pxToRem(64),
  20: pxToRem(80),
  24: pxToRem(96),
  32: pxToRem(128),
  40: pxToRem(160),
  48: pxToRem(192),
  56: pxToRem(224),
  64: pxToRem(256),
};

const sizing = {
  auto: "auto",
  px: "1px",
  1: pxToRem(4),
  2: pxToRem(8),
  3: pxToRem(12),
  4: pxToRem(16),
  5: pxToRem(20),
  6: pxToRem(24),
  8: pxToRem(32),
  10: pxToRem(40),
  12: pxToRem(48),
  16: pxToRem(64),
  20: pxToRem(80),
  24: pxToRem(96),
  32: pxToRem(128),
  48: pxToRem(192),
  64: pxToRem(256),
};

const config = {
  colors: colors,

  screens: {
    sm: "576px",
    md: "768px",
    lg: "992px",
    xl: "1200px",
  },

  fonts: {
    sans: [
      "system-ui",
      "BlinkMacSystemFont",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "Oxygen",
      "Ubuntu",
      "Cantarell",
      "Fira Sans",
      "Droid Sans",
      "Helvetica Neue",
      "sans-serif",
    ],
    serif: [
      "Constantia",
      "Lucida Bright",
      "Lucidabright",
      "Lucida Serif",
      "Lucida",
      "DejaVu Serif",
      "Bitstream Vera Serif",
      "Liberation Serif",
      "Georgia",
      "serif",
    ],
    mono: ["Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
  },

  textSizes: {
    xs: pxToRem(12),
    sm: pxToRem(14),
    base: pxToRem(16),
    lg: pxToRem(18),
    xl: pxToRem(20),
    "2xl": pxToRem(24),
    "3xl": pxToRem(30),
    "4xl": pxToRem(36),
    "5xl": pxToRem(48),
  },

  fontWeights: {
    hairline: 100,
    thin: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  leading: {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    loose: 2,
  },

  tracking: {
    tight: "-0.05em",
    normal: "0",
    wide: "0.05em",
  },

  textColors: colors,

  backgroundColors: colors,

  backgroundSize: {
    auto: "auto",
    cover: "cover",
    contain: "contain",
  },

  borderWidths: {
    default: "1px",
    0: "0",
  },

  borderColors: global.Object.assign(
    {
      default: "currentColor",
      current: "currentColor",
    },
    colors
  ),

  borderRadius: {
    sm: pxToRem(2),
    md: pxToRem(4),
    default: pxToRem(4),
    lg: pxToRem(8),
    xl: pxToRem(10),
    full: "9999px",
  },

  width: global.Object.assign(
    {
      "1/2": "50%",
      "1/3": "33.33333%",
      "2/3": "66.66667%",
      "1/4": "25%",
      "3/4": "75%",
      "1/5": "20%",
      "2/5": "40%",
      "3/5": "60%",
      "4/5": "80%",
      "1/6": "16.66667%",
      "5/6": "83.33333%",
      full: "100%",
      screen: "100vw",
      g: {
        1: colCalc(12, 1, 16),
        2: colCalc(12, 2, 16),
        3: colCalc(12, 3, 16),
        4: colCalc(12, 4, 16),
        5: colCalc(12, 5, 16),
        6: colCalc(12, 6, 16),
        7: colCalc(12, 7, 16),
        8: colCalc(12, 8, 16),
        9: colCalc(12, 9, 16),
        10: colCalc(12, 10, 16),
        11: colCalc(12, 11, 16),
        12: colCalc(12, 12, 16),
      },
    },
    sizing
  ),

  height: global.Object.assign(
    {
      full: "100%",
      screen: "100vh",
    },
    sizing
  ),

  minWidth: {
    0: "0",
    full: "100%",
  },

  minHeight: {
    0: "0",
    full: "100%",
    screen: "100vh",
  },

  maxWidth: {
    xs: "20rem",
    sm: "30rem",
    md: "40rem",
    lg: "50rem",
    xl: "60rem",
    "2xl": "70rem",
    "3xl": "80rem",
    "4xl": "90rem",
    "5xl": "100rem",
    full: "100%",
  },

  maxHeight: {
    full: "100%",
    screen: "100vh",
  },

  padding: global.Object.assign({}, spacing),

  margin: global.Object.assign(
    {
      auto: "auto",
    },
    spacing
  ),

  negativeMargin: global.Object.assign({}, spacing),

  boxShadow: {
    default: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    outline: "0 0 0 3px rgba(66, 153, 225, 0.5)",
    none: "none",
  },

  zIndex: {
    auto: "auto",
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
  },

  opacity: {
    0: "0",
    25: "0.25",
    50: "0.5",
    75: "0.75",
    100: "1",
  },

  svgFill: {
    current: "currentColor",
  },

  svgStroke: {
    current: "currentColor",
  },

  /*
  |-----------------------------------------------------------------------------
  | Modules                  https://tailwindcss.com/docs/configuration#modules
  |-----------------------------------------------------------------------------
  |
  | Here is where you control which modules are generated and what variants are
  | generated for each of those modules.
  |
  | Currently supported variants:
  |   - responsive
  |   - hover
  |   - focus
  |   - focus-within
  |   - active
  |   - group-hover
  |
  | To disable a module completely, use `false` instead of an array.
  |
  */

  modules: {
    appearance: ["responsive"],
    backgroundAttachment: false,
    backgroundColors: [],
    backgroundPosition: false,
    backgroundRepeat: false,
    backgroundSize: false,
    borderCollapse: [],
    borderColors: [],
    borderRadius: false,
    borderStyle: false,
    borderWidths: [],
    cursor: [],
    display: ["responsive"],
    flexbox: ["responsive"],
    float: false,
    fonts: [],
    fontWeights: [],
    height: ["responsive"],
    leading: ["responsive"],
    lists: ["responsive"],
    margin: ["responsive"],
    maxHeight: ["responsive"],
    maxWidth: ["responsive"],
    minHeight: ["responsive"],
    minWidth: ["responsive"],
    negativeMargin: ["responsive"],
    objectFit: false,
    objectPosition: false,
    opacity: [],
    outline: ["focus"],
    overflow: [],
    padding: ["responsive"],
    pointerEvents: [],
    position: ["responsive"],
    resize: false,
    shadows: false,
    svgFill: [],
    svgStroke: [],
    tableLayout: false,
    textAlign: ["responsive"],
    textColors: ["responsive", "hover"],
    textSizes: ["responsive"],
    textStyle: [],
    tracking: false,
    userSelect: false,
    verticalAlign: false,
    visibility: false,
    whitespace: [],
    width: ["responsive"],
    zIndex: [],
  },

  /*
  |-----------------------------------------------------------------------------
  | Plugins                                https://tailwindcss.com/docs/plugins
  |-----------------------------------------------------------------------------
  |
  | Here is where you can register any plugins you'd like to use in your
  | project. Tailwind's built-in `container` plugin is enabled by default to
  | give you a Bootstrap-style responsive container component out of the box.
  |
  | Be sure to view the complete plugin documentation to learn more about how
  | the plugin system works.
  |
  */

  plugins: [
    // require('tailwindcss/plugins/container')({
    //   center: true,
    //   padding: '1rem',
    // }),
  ],

  /*
  |-----------------------------------------------------------------------------
  | Advanced Options         https://tailwindcss.com/docs/configuration#options
  |-----------------------------------------------------------------------------
  |
  | Here is where you can tweak advanced configuration options. We recommend
  | leaving these options alone unless you absolutely need to change them.
  |
  */

  options: {
    prefix: "",
    important: false,
    separator: ":",
  },
};

const dynamicStyles = {
  // https://tailwindcss.com/docs/background-color
  // https://tailwindcss.com/docs/background-size
  bg: [
    { prop: "backgroundColor", config: "backgroundColors" },
    { prop: "backgroundSize", config: "backgroundSize" },
  ],

  // https://tailwindcss.com/docs/border-width
  "border-t": { prop: "borderTopWidth", config: "borderWidths" },
  "border-b": { prop: "borderBottomWidth", config: "borderWidths" },
  "border-l": { prop: "borderLeftWidth", config: "borderWidths" },
  "border-r": { prop: "borderRightWidth", config: "borderWidths" },

  // https://tailwindcss.com/docs/border-color
  border: [
    { prop: "borderWidth", config: "borderWidths" },
    { prop: "borderColor", config: "borderColors" },
  ],

  // https://tailwindcss.com/docs/border-radius
  "rounded-t": { prop: "borderTopRadius", config: "borderRadius" },
  "rounded-r": { prop: "borderRightRadius", config: "borderRadius" },
  "rounded-b": { prop: "borderBottomRadius", config: "borderRadius" },
  "rounded-l": { prop: "borderLeftRadius", config: "borderRadius" },
  "rounded-tl": { prop: "borderTopLeftRadius", config: "borderRadius" },
  "rounded-tr": { prop: "borderTopRightRadius", config: "borderRadius" },
  "rounded-br": { prop: "borderBottomRightRadius", config: "borderRadius" },
  "rounded-bl": { prop: "borderBottomLeftRadius", config: "borderRadius" },
  rounded: { prop: "borderRadius", config: "borderRadius" },

  // https://tailwindcss.com/docs/opacity
  opacity: { prop: "opacity", config: "opacity" },

  // https://tailwindcss.com/docs/shadows
  shadow: { prop: "boxShadow", config: "boxShadow" },

  // https://tailwindcss.com/docs/width
  w: { prop: "width", config: "width" },

  // https://tailwindcss.com/docs/min-width
  "min-w": { prop: "minWidth", config: "minWidth" },

  // https://tailwindcss.com/docs/max-width
  "max-w": { prop: "maxWidth", config: "maxWidth" },

  // https://tailwindcss.com/docs/height
  h: { prop: "height", config: "height" },

  // https://tailwindcss.com/docs/min-height
  "min-h": { prop: "minHeight", config: "minHeight" },

  // https://tailwindcss.com/docs/max-height
  "max-h": { prop: "maxHeight", config: "maxHeight" },

  gap: { prop: "gap", config: "margin" },

  // https://tailwindcss.com/docs/spacing
  pt: { prop: "paddingTop", config: "padding" },
  pr: { prop: "paddingRight", config: "padding" },
  pb: { prop: "paddingBottom", config: "padding" },
  pl: { prop: "paddingLeft", config: "padding" },
  px: { prop: ["paddingLeft", "paddingRight"], config: "padding" },
  py: { prop: ["paddingTop", "paddingBottom"], config: "padding" },
  p: { prop: "padding", config: "padding" },

  mt: { prop: "marginTop", config: "margin" },
  mr: { prop: "marginRight", config: "margin" },
  mb: { prop: "marginBottom", config: "margin" },
  ml: { prop: "marginLeft", config: "margin" },
  mx: { prop: ["marginLeft", "marginRight"], config: "margin" },
  my: { prop: ["marginTop", "marginBottom"], config: "margin" },
  m: { prop: "margin", config: "margin" },

  "-mt": {
    prop: "marginTop",
    config: "negativeMargin",
    pre: '"-"+',
    format: (x) => `-${x}`,
  },
  "-mr": {
    prop: "marginRight",
    config: "negativeMargin",
    pre: '"-"+',
    format: (x) => `-${x}`,
  },
  "-mb": {
    prop: "marginBottom",
    config: "negativeMargin",
    pre: '"-"+',
    format: (x) => `-${x}`,
  },
  "-ml": {
    prop: "marginLeft",
    config: "negativeMargin",
    pre: '"-"+',
    format: (x) => `-${x}`,
  },
  "-mx": {
    prop: ["marginLeft", "marginRight"],
    config: "negativeMargin",
    pre: '"-"+',
    format: (x) => `-${x}`,
  },
  "-my": {
    prop: ["marginTop", "marginBottom"],
    config: "negativeMargin",
    pre: '"-"+',
    format: (x) => `-${x}`,
  },
  "-m": {
    prop: "margin",
    config: "negativeMargin",
    pre: '"-"+',
    format: (x) => `-${x}`,
  },

  // https://tailwindcss.com/docs/svg
  fill: { prop: "fill", config: "svgFill" },
  stroke: { prop: "stroke", config: "svgStroke" },

  // https://tailwindcss.com/docs/fonts
  font: [
    { prop: "fontWeight", config: "fontWeights" },
    {
      prop: "fontFamily",
      config: "fonts",
      format: (val) => val.map((x) => '"' + x + '"').join(", "),
    },
  ],
  text: [
    { prop: "color", config: "textColors" },
    { prop: "fontSize", config: "textSizes" },
  ],

  // https://tailwindcss.com/docs/line-height
  leading: { prop: "lineHeight", config: "leading" },

  // https://tailwindcss.com/docs/letter-spacing
  tracking: { prop: "letterSpacing", config: "tracking" },

  // https://tailwindcss.com/docs/z-index
  z: { prop: "zIndex", config: "zIndex" },
};

const staticStyles = {
  // https://tailwindcss.com/docs/background-position
  "bg-bottom": { backgroundPosition: "bottom" },
  "bg-center": { backgroundPosition: "center" },
  "bg-left": { backgroundPosition: "left" },
  "bg-left-bottom": { backgroundPosition: "left bottom" },
  "bg-left-top": { backgroundPosition: "left top" },
  "bg-right": { backgroundPosition: "right" },
  "bg-right-bottom": { backgroundPosition: "right bottom" },
  "bg-right-top": { backgroundPosition: "right-top" },
  "bg-top": { backgroundPosition: "top" },

  // https://tailwindcss.com/docs/background-repeat
  "bg-repeat": { backgroundRepeat: "repeat" },
  "bg-no-repeat": { backgroundRepeat: "no-repeat" },
  "bg-repeat-x": { backgroundRepeat: "repeat-x" },
  "bg-repeat-y": { backgroundRepeat: "repeat-y" },

  // https://tailwindcss.com/docs/background-attachment
  "bg-fixed": { backgroundAttachment: "fixed" },
  "bg-local": { backgroundAttachment: "local" },
  "bg-scroll": { backgroundAttachment: "scroll" },

  // https://tailwindcss.com/docs/border-style
  "border-solid": { borderStyle: "solid" },
  "border-dashed": { borderStyle: "dashed" },
  "border-dotted": { borderStyle: "dotted" },
  "border-none": { borderStyle: "none" },

  // https://tailwindcss.com/docs/display
  "display-block": { display: "block" },
  "display-inline-block": { display: "inline-block" },
  "display-inline": { display: "inline" },
  table: { display: "table" },
  "table-row": { display: "table-row" },
  "table-cell": { display: "table-cell" },
  hidden: { display: "none" },
  flex: { display: "flex" },
  "inline-flex": { display: "inline-flex" },

  // https://tailwindcss.com/docs/flexbox-direction
  "flex-row": { flexDirection: "row" },
  "flex-row-reverse": { flexDirection: "row-reverse" },
  "flex-col": { flexDirection: "column" },
  "flex-col-reverse": { flexDirection: "column-reverse" },

  // https://tailwindcss.com/docs/flexbox-wrapping
  "flex-no-wrap": { flexWrap: "nowrap" },
  "flex-wrap": { flexWrap: "wrap" },
  "flex-wrap-reverse": { flexWrap: "wrap-reverse" },

  // https://tailwindcss.com/docs/flexbox-justify-content
  "justify-start": { justifyContent: "flex-start" },
  "justify-center": { justifyContent: "center" },
  "justify-end": { justifyContent: "flex-end" },
  "justify-between": { justifyContent: "space-between" },
  "justify-around": { justifyContent: "space-around" },

  // https://tailwindcss.com/docs/flexbox-align-items
  "items-stretch": { alignItems: "stretch" },
  "items-start": { alignItems: "flex-start" },
  "items-center": { alignItems: "center" },
  "items-end": { alignItems: "flex-end" },
  "items-baseline": { alignItems: "baseline" },

  // https://tailwindcss.com/docs/flexbox-align-content
  "content-start": { alignContent: "flex-start" },
  "content-center": { alignContent: "center" },
  "content-end": { alignContent: "flex-end" },
  "content-between": { alignContent: "space-between" },
  "content-around": { alignContent: "space-around" },

  // https://tailwindcss.com/docs/flexbox-align-self
  "self-auto": { alignSelf: "auto" },
  "self-start": { alignSelf: "flex-start" },
  "self-center": { alignSelf: "center" },
  "self-end": { alignSelf: "flex-end" },
  "self-stretch": { alignSelf: "stretch" },

  // https://tailwindcss.com/docs/flexbox-flex-grow-shrink
  "flex-initial": { flex: "initial" },
  "flex-1": { flex: 1 },
  "flex-2": { flex: 2 },
  "flex-3": { flex: 3 },
  "flex-4": { flex: 4 },
  "flex-5": { flex: 5 },
  "flex-6": { flex: 6 },
  "flex-7": { flex: 7 },
  "flex-8": { flex: 8 },
  "flex-9": { flex: 9 },
  "flex-10": { flex: 10 },
  "flex-11": { flex: 11 },
  "flex-12": { flex: 12 },
  "flex-auto": { flex: "auto" },
  "flex-none": { flex: "none" },
  "flex-grow": { flexGrow: 1 },
  "flex-shrink": { flexShrink: 1 },
  "flex-no-grow": { flexGrow: 0 },
  "flex-no-shrink": { flexShrink: 0 },

  // https://tailwindcss.com/docs/floats
  "float-right": { float: "right" },
  "float-left": { float: "left" },
  "float-none": { float: "none" },
  clearfix: { "&::after": { content: '""', display: "table", clear: "both" } },

  // https://tailwindcss.com/docs/forms
  "appearance-none": { appearance: "none" },

  // https://tailwindcss.com/docs/cursor
  "cursor-auto": { cursor: "auto" },
  "cursor-default": { cursor: "default" },
  "cursor-pointer": { cursor: "pointer" },
  "cursor-wait": { cursor: "wait" },
  "cursor-move": { cursor: "move" },
  "cursor-not-allowed": { cursor: "not-allowed" },

  // https://tailwindcss.com/docs/resize
  "resize-none": { resize: "none" },
  resize: { resize: "both" },
  "resize-y": { resize: "vertical" },
  "resize-x": { resize: "horizontal" },

  // https://tailwindcss.com/docs/pointer-events
  "pointer-events-none": { pointerEvents: "none" },
  "pointer-events-auto": { pointerEvents: "auto" },

  // https://tailwindcss.com/docs/user-select
  "select-none": { userSelect: "none" },
  "select-text": { userSelect: "text" },

  // https://tailwindcss.com/docs/lists
  "list-reset": { listStyle: "none", padding: 0 },

  // https://tailwindcss.com/docs/overflow
  "overflow-auto": { overflow: "auto" },
  "overflow-hidden": { overflow: "hidden" },
  "overflow-visible": { overflow: "visible" },
  "overflow-scroll": { overflow: "scroll" },
  "overflow-x-auto": { overflowX: "auto" },
  "overflow-y-auto": { overflowY: "auto" },
  "overflow-x-hidden": { overflowX: "hidden" },
  "overflow-y-hidden": { overflowY: "hidden" },
  "overflow-x-visible": { overflowX: "visible" },
  "overflow-y-visible": { overflowY: "visible" },
  "overflow-x-scroll": { overflowX: "scroll" },
  "overflow-y-scroll": { overflowY: "scroll" },
  "scrolling-touch": { webkitOverflowScrolling: "touch" },
  "scrolling-auto": { webkitOverflowScrolling: "auto" },

  // https://tailwindcss.com/docs/positioning
  static: { position: "static" },
  fixed: { position: "fixed" },
  absolute: { position: "absolute" },
  relative: { position: "relative" },
  sticky: { position: "sticky" },
  "pin-t": { top: 0 },
  "pin-r": { right: 0 },
  "pin-b": { bottom: 0 },
  "pin-l": { left: 0 },
  "pin-y": { top: 0, bottom: 0 },
  "pin-x": { right: 0, left: 0 },
  pin: { top: 0, right: 0, bottom: 0, left: 0 },
  "pin-none": { top: "auto", right: "auto", bottom: "auto", left: "auto" },

  "inset-0": { top: 0, right: 0, bottom: 0, left: 0 },
  "inset-auto": { top: "auto", right: "auto", bottom: "auto", left: "auto" },
  "left-0": { left: 0 },
  "right-0": { right: 0 },
  "top-0": { top: 0 },
  "bottom-0": { bottom: 0 },
  "left-auto": { left: "auto" },
  "right-auto": { right: "auto" },
  "top-auto": { top: "auto" },
  "bottom-auto": { bottom: "auto" },

  // https://tailwindcss.com/docs/text-alignment
  "text-left": { textAlign: "left" },
  "text-center": { textAlign: "center" },
  "text-right": { textAlign: "right" },
  "text-justify": { textAlign: "justify" },

  // https://tailwindcss.com/docs/text-style
  italic: { fontStyle: "italic" },
  roman: { fontStyle: "normal" },
  uppercase: { textTransform: "uppercase" },
  lowercase: { textTransform: "lowercase" },
  capitalize: { textTransform: "capitalize" },
  "normal-case": { textTransform: "none" },
  underline: { textDecoration: "underline" },
  "line-through": { textDecoration: "line-through" },
  "no-underline": { textDecoration: "none" },
  antialiased: {
    webkitFontSmoothing: "antialiased",
    mozOsxFontSmoothing: "grayscale",
  },
  "subpixel-antialiased": {
    webkitFontSmoothing: "auto",
    mozOsxFontSmoothing: "auto",
  },

  // https://tailwindcss.com/docs/whitespace-and-wrapping
  "whitespace-normal": { whiteSpace: "normal" },
  "whitespace-no-wrap": { whiteSpace: "nowrap" },
  "whitespace-pre": { whiteSpace: "pre" },
  "whitespace-pre-line": { whiteSpace: "pre-line" },
  "whitespace-pre-wrap": { whiteSpace: "pre-wrap" },
  "break-words": { wordWrap: "break-word" },
  "break-normal": { wordWrap: "normal" },
  truncate: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  // https://tailwindcss.com/docs/vertical-alignment
  "align-baseline": { verticalAlign: "baseline" },
  "align-top": { verticalAlign: "top" },
  "align-middle": { verticalAlign: "middle" },
  "align-bottom": { verticalAlign: "bottom" },
  "align-text-top": { verticalAlign: "text-top" },
  "align-text-bottom": { verticalAlign: "text-bottom" },

  // https://tailwindcss.com/docs/visibility
  visible: { visibility: "visible" },
  invisible: { visibility: "hidden" },

  // https://tailwindcss.com/docs/border-collapse
  "border-collapse": { borderCollapse: "collapse" },
  "border-separate": { borderCollapse: "separate" },

  // https://tailwindcss.com/docs/table-layout
  "table-auto": { tableLayout: "auto" },
  "table-fixed": { tableLayout: "fixed" },

  // https://tailwindcss.com/docs/outline
  "outline-none": { outline: 0 },
};

const stylesConfig = { dynamicStyles, staticStyles };

///////////////////////

const parseCss = (str) => {
  const tokens = str.split(/({|}|;|:(?!\S))/);
  let idx = 0;
  let previous = null;
  let current = tokens[0].trim();
  const advance = () => {
    previous = current;
    while (true) {
      idx++;
      current = tokens[idx]?.trim();
      if (current === undefined || current.length > 0) break;
    }
    return previous;
  };
  const match = (expected) => (tokens[idx] === expected ? (advance(), true) : false);
  const parseValue = () => {
    if (match("{")) return parseKvs();
    if (match(":")) {
      const value = current;
      advance();
      if (!match(";")) throw new Error("Missing semicolon");
      return value;
    }
  };
  const parseKv = (obj) => {
    const key = current;
    advance();
    const value = parseValue();
    obj[key] = value;
  };
  const parseKvs = () => {
    const obj = {};
    while (current && current.length && !match("}")) parseKv(obj);
    return obj;
  };
  return parseKvs();
};
// console.log(parseCss(str));

const generateTw = ({ staticStyles, dynamicStyles }, config) => {
  const obj = {};
  Object.entries(staticStyles).forEach(([key, value]) => {
    // if (typeof value === 'object') {
    //   obj[`.${key}`] = value;
    // }
    obj[`.${key}`] = Object.entries(value).reduce((acc, [key, value]) => {
      acc[kebabize(key)] = value;
      return acc;
    }, {});
  });
  Object.entries(dynamicStyles).forEach(([key, value]) => {
    (Array.isArray(value) ? value : [value]).forEach(({ prop, format, config: configName }) => {
      (Array.isArray(prop) ? prop : [prop]).forEach((prop) => {
        Object.entries(config[configName]).forEach(([keySuffix, styleValue]) => {
          const recur = (keySuffix, styleValue) => {
            if (!format && typeof styleValue === "object") {
              Object.entries(styleValue).forEach(([keySuffix2, styleValue]) => {
                recur(`${keySuffix}-${keySuffix2}`, styleValue);
              });
              return;
            }

            const keyFull = keySuffix === "default" ? `.${key}` : `.${key}-${keySuffix}`;
            obj[keyFull] = Object.assign(obj[keyFull] || {}, {
              [kebabize(prop)]: format ? format(styleValue) : styleValue,
            });
          };
          recur(keySuffix, styleValue);
        });
      });
    });
  });
  return obj;
};

const kebabize = (str) =>
  str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase());

const error = (str) => {
  throw new Error(str);
};

const overwriteStylesWithComposedStyles = (properties, lookupMap) => {
  const composedStyles = {};
  if (properties.composes) {
    const composes = properties.composes;
    delete properties.composes;
    const copyProperties = { ...properties };

    const styles = composes.split(/\s+/).reduce((acc, name) => {
      const lookup = lookupMap[`.${name}`] ?? error(`Unrecognised class name '.${name}'`);
      return Object.assign(acc, lookup);
    }, {});
    Object.entries(styles).forEach(([styleName, styleValue]) => {
      composedStyles[kebabize(styleName)] = styleValue;
    });

    // This is awkward because we want the original properties to override composedStyles
    Object.assign(properties, composedStyles, copyProperties);
  }
  Object.values(properties).forEach((value) => {
    if (typeof value == "object") overwriteStylesWithComposedStyles(value, lookupMap);
  });
};

const createCssGenerator = () => {
  const lookupMap = {};

  return {
    addStyles: (styles) => {
      Object.entries(styles).forEach(([key, value]) => {
        if (lookupMap[key]) error(`Already exists ${key}`);
        lookupMap[key] = value;
      });
    },
    addCss: (source) => {
      const classes = parseCss(source);

      Object.entries(classes).forEach(([key, properties]) => {
        overwriteStylesWithComposedStyles(properties, lookupMap);

        if (lookupMap[key]) error(`Already exists ${key}`);
        lookupMap[key] = properties;
      });
    },
    finalCss: () => {
      const acc = [];

      const push = (parent, key, value) => {
        key = key.replace("&", parent);

        const defer = [];
        const props = Object.entries(value).reduce(
          (acc, [prop, value]) => (
            typeof value === "object" ? defer.push([prop, value]) : acc.push(`${prop}: ${value};`),
            acc
          ),
          []
        );
        acc.push(`${key} { ${props.join(" ")} }\n`);
        defer.forEach(([prop, value]) => push(key, prop, value));
      };

      Object.entries(lookupMap).reduce((acc, [key, value]) => {
        push("", key, value);
        return acc;
      }, []);
      return acc.join("");
    },
  };
};

//////////////////////

const createConfiguredCssGenerator = () => {
  const cssGenerator = createCssGenerator();
  const tw = generateTw(stylesConfig, config);
  cssGenerator.addStyles(tw);
  return cssGenerator;
};

////////////////

fetch("/static/css/app.css")
  .then((x) => x.text())
  .then((css) => {
    const cssGenerator = createConfiguredCssGenerator();

    cssGenerator.addCss(css);

    console.log(cssGenerator.finalCss());

    const insertCssIntoBody = (css) =>
      (document.head.appendChild(document.createElement("style")).innerHTML = css);

    insertCssIntoBody(cssGenerator.finalCss());
  });
