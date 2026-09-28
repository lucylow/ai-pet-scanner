import { describe, expect, it, vi } from "vitest";
import { purchaseAndFinishIfVerified, type PurchaseAdapter, type PurchaseResult } from "../lib/billing";

const purchase: PurchaseResult = {
  transactionId: "txn-1",
  productId: "pet_plus_monthly",
  purchasedAt: "2026-08-22T00:00:00.000Z",
};

function adapter(): PurchaseAdapter {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    getProducts: vi.fn().mockResolvedValue([]),
    purchase: vi.fn().mockResolvedValue(purchase),
    restore: vi.fn().mockResolvedValue([]),
    finish: vi.fn().mockResolvedValue(undefined),
  };
}

describe("verified purchase boundary", () => {
  it("finishes a transaction only after verification succeeds", async () => {
    const store = adapter();
    const verify = vi.fn().mockResolvedValue(true);

    await expect(purchaseAndFinishIfVerified(store, "pet_plus_monthly", verify)).resolves.toMatchObject({ status: "verified" });
    expect(verify).toHaveBeenCalledWith(purchase);
    expect(store.finish).toHaveBeenCalledWith("txn-1");
  });

  it("keeps an unverified transaction unfinished and denies entitlement evidence", async () => {
    const store = adapter();
    const verify = vi.fn().mockResolvedValue(false);

    await expect(purchaseAndFinishIfVerified(store, "pet_plus_monthly", verify)).resolves.toMatchObject({ status: "verification_failed" });
    expect(store.finish).not.toHaveBeenCalled();
  });

  it("fails closed when the verifier throws", async () => {
    const store = adapter();
    const verify = vi.fn().mockRejectedValue(new Error("server unavailable"));

    await expect(purchaseAndFinishIfVerified(store, "pet_plus_monthly", verify)).resolves.toMatchObject({ status: "verification_failed" });
    expect(store.finish).not.toHaveBeenCalled();
  });
});
