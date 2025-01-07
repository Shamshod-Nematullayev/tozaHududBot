module.exports = {
  apps: [
    {
      name: "toza-hudud-bot",
      script: "index.js", // Replace with the actual filename of your script
      watch: true,
      ignore_watch: [
        "node_modules",
        "session.json",
        "*.png",
        "*.pdf",
        "*.PDF",
        "*.xls",
        "*.html",
        "*.htm",
        "*.xlsx",
        "uploads",
        "/uploads",
        "./uploads",
        "./.git",
        "lib",
        "error.log",
        "outputs.log",
      ],
      error_file: "errors.log",
      out_file: "outputs.log",
      env: {
        NODE_TLS_REJECT_UNAUTHORIZED: "0",
        PORT: 5000,
      },
    },
  ],
};
