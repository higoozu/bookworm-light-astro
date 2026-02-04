import plugin from "tailwindcss/plugin";

const gridColumns = 12;
const gridGutterWidth = "2rem";
const gridGutters = {
  0: "0",
  1: "0.5rem",
  2: "0.75rem",
  3: "1.25rem",
  4: "2rem",
  5: "3.5rem",
};
const respectImportant = true;
const columns = Array.from({ length: gridColumns }, (_, i) => i + 1);
const rowColsSteps = columns.slice(0, Math.floor(gridColumns / 2));
const columnWidth = (num) => `${(100 / gridColumns) * num}%`;

const colValues = Object.fromEntries(
  columns.map((num) => [num, columnWidth(num)]),
);
const offsetValues = Object.fromEntries(
  [0, ...columns.slice(0, -1)].map((num) => [num, columnWidth(num)]),
);
const orderValues = Object.fromEntries(
  [0, ...columns].map((num) => [num, String(num)]),
);
const rowColsValues = Object.fromEntries(
  rowColsSteps.map((num) => [num, `${100 / num}%`]),
);
const gutterValues = Object.fromEntries(Object.entries(gridGutters));

module.exports = plugin.withOptions(() => {
  return ({ addComponents, addUtilities, matchUtilities }) => {
    const baseUtilities = {
      ".row": {
        "--bs-gutter-x": gridGutterWidth,
        "--bs-gutter-y": 0,
        display: "flex",
        flexWrap: "wrap",
        marginTop: "calc(var(--bs-gutter-y) * -1)",
        marginRight: "calc(var(--bs-gutter-x) / -2)",
        marginLeft: "calc(var(--bs-gutter-x) / -2)",
        "& > *": {
          boxSizing: "border-box",
          flexShrink: 0,
          width: "100%",
          maxWidth: "100%",
          paddingRight: "calc(var(--bs-gutter-x) / 2)",
          paddingLeft: "calc(var(--bs-gutter-x) / 2)",
          marginTop: "var(--bs-gutter-y)",
        },
      },
      ".col": { flex: "1 0 0%" },
      ".col-auto": { flex: "0 0 auto", width: "auto" },
      ".row-cols-auto": { "& > *": { flex: "0 0 auto", width: "auto" } },
      ".order-first": { order: "-1" },
      ".order-last": { order: String(gridColumns + 1) },
    };

    // row
    addComponents(baseUtilities, { respectImportant });

    matchUtilities(
      {
        "row-cols": (value) => ({
          "& > *": { flex: "0 0 auto", width: value },
        }),
      },
      { values: rowColsValues },
    );

    matchUtilities(
      {
        col: (value) => ({
          flex: "0 0 auto",
          width: value,
        }),
      },
      { values: colValues },
    );

    matchUtilities(
      {
        offset: (value) => ({ marginLeft: value }),
      },
      { values: offsetValues },
    );

    matchUtilities(
      {
        order: (value) => ({ order: value }),
      },
      { values: orderValues },
    );

    matchUtilities(
      {
        g: (value) => ({ "--bs-gutter-x": value, "--bs-gutter-y": value }),
        gx: (value) => ({ "--bs-gutter-x": value }),
        gy: (value) => ({ "--bs-gutter-y": value }),
      },
      { values: gutterValues },
    );
  };
});
