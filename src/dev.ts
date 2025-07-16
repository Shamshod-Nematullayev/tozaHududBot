import "tsconfig-paths/register";

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 [UNHANDLED REJECTION]:", reason);
  if (reason instanceof Error && reason.stack) {
    console.error("📍 Stack Trace:\n", reason.stack);
  }
  process.exit(1);
});

(async () => {
  try {
    await import("./index");
  } catch (error) {
    console.error("🚨 [IMPORT ERROR]:", error);
    if (error instanceof Error && error.stack) {
      console.error("📍 Stack Trace:\n", error.stack);
    }
    process.exit(1);
  }
})();
