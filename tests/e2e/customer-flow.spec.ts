import { expect, test } from "@playwright/test";
import type { MenuItem, Order } from "../../src/lib/types";

const items: MenuItem[] = [
  { id: 2, name: "FRIED RICE", price: 110, stock: 50, image: "/placeholder-food.svg" },
  { id: 3, name: "PANEER TIKKA", price: 180, stock: 4, image: "/placeholder-food.svg" },
];

test("customer can browse, order, and track from the browser", async ({ page }) => {
  const placed: Order[] = [];

  await page.route("**/api/items", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items }) });
  });

  await page.route("**/api/my-orders", async (route) => {
    const body = route.request().postDataJSON() as { orderIds: number[] };
    const wanted = new Set(body.orderIds || []);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ orders: placed.filter((order) => wanted.has(order.id)) }),
    });
  });

  await page.route("**/api/orders", async (route) => {
    const body = route.request().postDataJSON() as { items: { itemId: number; qty: number }[] };
    const lines = body.items || [];
    const total = lines.reduce(
      (sum, line) => sum + line.qty * (items.find((item) => item.id === line.itemId)?.price || 0),
      0,
    );
    placed.push({
      id: 101,
      itemId: lines[0].itemId,
      qty: lines.reduce((sum, line) => sum + line.qty, 0),
      total,
      items: lines.map((line) => ({
        ...line,
        name: items.find((item) => item.id === line.itemId)?.name,
      })),
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
    });
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ orderId: 101, total, items: lines, orderStatus: "PENDING", paymentStatus: "PENDING" }),
    });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today's menu" })).toBeVisible();
  await expect(page.getByText("FRIED RICE")).toBeVisible();
  await expect(page.getByText("Only 4 left — grab fast")).toBeVisible();
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await expect(page.getByLabel("Cart with 1 items")).toBeVisible();
  await expect(page.getByLabel("Add one FRIED RICE")).toBeVisible();
  await page.getByLabel("Add one FRIED RICE").click();
  await expect(page.getByLabel("Cart with 2 items")).toBeVisible();
  await page.getByLabel("Remove one FRIED RICE").click();
  await expect(page.getByLabel("Cart with 1 items")).toBeVisible();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByLabel("Cart with 2 items")).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByText("FRIED RICE")).toBeVisible();
  await expect(page.getByText("PANEER TIKKA")).toBeVisible();
  await page.getByRole("link", { name: "Continue to checkout" }).click();

  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible();
  await expect(page.getByText(/Order #101 has been recorded as one bill/)).toBeVisible();
  await expect(page.getByText("#102", { exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: "Track my orders" }).click();
  await expect(page.getByRole("heading", { name: "My orders" })).toBeVisible();
  await expect(page.getByText("Order #101")).toBeVisible();
  await expect(page.getByText("FRIED RICE x 1, PANEER TIKKA x 1")).toBeVisible();
  await expect(page.locator("text=PENDING").first()).toBeVisible();
});
