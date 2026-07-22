import assert from "node:assert/strict";
import test from "node:test";
import { mascotaEstaInactiva } from "./mascota.mjs";

test("muestra la tumba solo despues de siete dias completos", () => {
  const ahora = Date.parse("2026-07-22T12:00:00.000Z");

  assert.equal(mascotaEstaInactiva(null, ahora), false);
  assert.equal(mascotaEstaInactiva("2026-07-15T12:00:00.000Z", ahora), false);
  assert.equal(mascotaEstaInactiva("2026-07-15T11:59:59.999Z", ahora), true);
});
