import { getMenuItems, getOrders } from "./apps-script";

export async function warmScriptCache(): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, 5_000);
  });
  const warm = Promise.all([getMenuItems().catch(() => undefined), getOrders().catch(() => undefined)]).then(
    () => undefined,
  );

  try {
    await Promise.race([warm, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
