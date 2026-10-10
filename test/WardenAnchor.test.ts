import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { keccak256, toHex } from "viem";

const logId = keccak256(toHex("run-1"));
const head1 = keccak256(toHex("entry-1"));
const head2 = keccak256(toHex("entry-2"));

describe("WardenAnchor", async () => {
  const { viem } = await network.connect();
  const [publisher, other] = await viem.getWalletClients();

  async function deploy() {
    return viem.deployContract("WardenAnchor");
  }

  it("records the anchor and emits Anchored", async () => {
    const c = await deploy();
    await viem.assertions.emitWithArgs(
      c.write.anchor([logId, 3n, head1]),
      c,
      "Anchored",
      [publisher.account.address, logId, 3n, head1],
    );
    const a = await c.read.latest([publisher.account.address, logId]);
    assert.equal(a.entryCount, 3n);
    assert.equal(a.headHash, head1);
    assert.ok(a.blockNumber > 0n);
  });

  it("accepts a longer log and replaces the head", async () => {
    const c = await deploy();
    await c.write.anchor([logId, 3n, head1]);
    await c.write.anchor([logId, 5n, head2]);
    const a = await c.read.latest([publisher.account.address, logId]);
    assert.equal(a.entryCount, 5n);
    assert.equal(a.headHash, head2);
  });

  it("rejects a shorter or equal log (truncation cannot be anchored over a newer head)", async () => {
    const c = await deploy();
    await c.write.anchor([logId, 5n, head2]);
    await viem.assertions.revertWithCustomError(c.write.anchor([logId, 3n, head1]), c, "NotAnAdvance");
    await viem.assertions.revertWithCustomError(c.write.anchor([logId, 5n, head1]), c, "NotAnAdvance");
  });

  it("rejects an empty log", async () => {
    const c = await deploy();
    await viem.assertions.revertWithCustomError(c.write.anchor([logId, 0n, head1]), c, "EmptyLog");
  });

  it("keys anchors by publisher, so nobody can overwrite another publisher's log", async () => {
    const c = await deploy();
    await c.write.anchor([logId, 5n, head2]);
    await c.write.anchor([logId, 1n, head1], { account: other.account });
    const mine = await c.read.latest([publisher.account.address, logId]);
    const theirs = await c.read.latest([other.account.address, logId]);
    assert.equal(mine.entryCount, 5n);
    assert.equal(theirs.entryCount, 1n);
  });
});
