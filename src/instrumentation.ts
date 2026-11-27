export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { warmScriptCache } = await import("./lib/script-warm");
  await warmScriptCache();
}
