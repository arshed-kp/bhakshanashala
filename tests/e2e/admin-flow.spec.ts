import { expect, test } from "@playwright/test";
import { adminCookieValue, e2eBaseURL } from "./helpers";
import type { MenuItem, Order } from "../../src/lib/types";

const items: MenuItem[] = [
  { id: 2, name: "FRIED RICE", price: 110, stock: 50, image: "/placeholder-food.svg" },
  { id: 3, name: "PANEER TIKKA", price: 180, stock: 4, image: "/placeholder-food.svg" },
];

let orders: Order[] = [];
let menu: MenuItem[] = [];

async function mockAdminApis(page: import("@playwright/test").Page) {
  await page.route("**/api/items", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON() as Omit<MenuItem, "id">;
      menu.push({ id: 99, ...body });
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, itemId: 99 }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: menu }) });
  });

  await page.route("**/api/items/*", async (route) => {
    if (route.request().method() !== "DELETE") {
      await route.continue();
      return;
    }
    const id = Number(route.request().url().split("/").slice(-1)[0]);
    menu = menu.filter((item) => item.id !== id);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, itemId: id }),
    });
  });

  await page.route("**/api/items/*/stock", async (route) => {
    const id = Number(route.request().url().split("/").slice(-2, -1)[0]);
    const body = route.request().postDataJSON() as { stock: number };
    menu = menu.map((item) => (item.id === id ? { ...item, stock: body.stock } : item));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, itemId: id }),
    });
  });

  await page.route("**/api/orders", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ orders }) });
  });

  await page.route("**/api/orders/**/status", async (route) => {
    const body = route.request().postDataJSON() as { orderStatus?: string; paymentStatus?: string };
    orders = orders.map((order) =>
      order.id === 101
        ? {
            ...order,
            orderStatus: body.orderStatus || order.orderStatus,
            paymentStatus: body.paymentStatus || order.paymentStatus,
          }
        : order,
    );
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, orderId: 101 }) });
  });
}

test.beforeEach(async ({ context, page }) => {
  orders = [
    {
      id: 101,
      itemId: 2,
      qty: 3,
      total: 400,
      items: [
        { itemId: 2, qty: 2, name: "FRIED RICE" },
        { itemId: 3, qty: 1, name: "PANEER TIKKA" },
      ],
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
    },
  ];
  menu = items.map((item) => ({ ...item }));
  await context.addCookies([
    {
      name: "bh_admin",
      value: adminCookieValue(),
      url: e2eBaseURL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await mockAdminApis(page);
});

test("admin can review dashboard and update order statuses", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("#101 · 2 items")).toBeVisible();

  await page.getByRole("navigation", { name: "Admin navigation" }).getByRole("link", { name: "Orders" }).click();
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
  await expect(page.getByText("FRIED RICE x 2, PANEER TIKKA x 1")).toBeVisible();
  await expect(page.getByLabel("Order status for 101")).toHaveCount(1);
  await page.getByLabel("Order status for 101").selectOption("APPROVED");
  await expect(page.getByLabel("Order status for 101")).toHaveValue("APPROVED");
  await page.getByLabel("Payment status for 101").selectOption("PAID");
  await expect(page.getByLabel("Payment status for 101")).toHaveValue("PAID");
});

test("admin can add items", async ({ page }) => {
  await page.goto("/admin/items/new");
  await page.getByLabel("Name").fill("DAL TADKA");
  await page.getByLabel("Price").fill("90");
  await page.getByLabel("Stock").fill("12");
  await page.getByLabel("Image URL").fill("/placeholder-food.svg");
  await page.getByRole("button", { name: "Save item" }).click();

  await expect(page).toHaveURL(/\/admin\/items$/);
  await expect(page.getByText("DAL TADKA")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
});

test("admin can change item stock", async ({ page }) => {
  await page.goto("/admin/items");
  await expect(page.getByText("Stock: 4")).toBeVisible();
  await page.getByLabel("Change stock for PANEER TIKKA").click();
  await page.getByRole("spinbutton", { name: "Stock for PANEER TIKKA" }).fill("9");
  await page.getByLabel("Save stock for PANEER TIKKA").click();
  await expect(page.getByText("Stock: 9")).toBeVisible();
});

test("admin can remove item", async ({ page }) => {
  page.once("dialog", (dialog) => dialog.accept());
  await page.goto("/admin/items");
  await expect(page.getByText("PANEER TIKKA")).toBeVisible();
  await page.getByLabel("Remove PANEER TIKKA").click();
  await expect(page.getByText("PANEER TIKKA")).toHaveCount(0);
});
