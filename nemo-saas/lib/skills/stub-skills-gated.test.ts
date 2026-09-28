import { describe, expect, it } from "vitest";
import { run as reputation } from "./reputation_loop";
import { run as competitor } from "./competitor_pulse";
import { run as paidQa } from "./paid_qa";
import { run as landing } from "./local_landing_builder";

describe("stub skills refuse execution until milestone", () => {
  it("reputation_loop", async () => {
    await expect(reputation({})).rejects.toThrow(/not_implemented_yet:reputation_loop/);
  });
  it("competitor_pulse", async () => {
    await expect(competitor({})).rejects.toThrow(/not_implemented_yet:competitor_pulse/);
  });
  it("paid_qa", async () => {
    await expect(paidQa({})).rejects.toThrow(/not_implemented_yet:paid_qa/);
  });
  it("local_landing_builder", async () => {
    await expect(landing({})).rejects.toThrow(/not_implemented_yet:local_landing_builder/);
  });
});
