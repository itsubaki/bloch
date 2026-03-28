import * as THREE from "three"
import { describe, expect, it } from "vitest"
import { shadowMapType } from "@/lib/shadow-map"

describe("shadowMapType", () => {
  it("uses the supported Three.js shadow map type", () => {
    expect(shadowMapType).toBe(THREE.PCFShadowMap)
  })
})
