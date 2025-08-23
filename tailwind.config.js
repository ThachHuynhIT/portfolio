module.exports = {
  variants: {
    extend: {
      backgroundOpacity: ["active"],
    },
  },
  theme: {
    extend: {
      backgroundOpacity: {
        10: "0.1",
        20: "0.2",
        50: "0.50",
      },
      opacity: {
        15: "0.15",
        35: "0.35",
        50: "0.65",
      },
    },
  },
};
