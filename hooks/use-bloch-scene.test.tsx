import { fireEvent, render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useBlochScene } from "@/hooks/use-bloch-scene"
import { Complex, QuantumState } from "@/lib/quantum"

const rendererInstances: MockWebGLRenderer[] = []

class MockWebGLRenderer {
  domElement = document.createElement("canvas")
  setSize = vi.fn()
  render = vi.fn()
  dispose = vi.fn()
  addEventListenerSpy = vi.spyOn(this.domElement, "addEventListener")
  removeEventListenerSpy = vi.spyOn(this.domElement, "removeEventListener")

  constructor() {
    rendererInstances.push(this)
  }
}

vi.mock("three", async () => {
  const actual = await vi.importActual<typeof import("three")>("three")

  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  }
})

import * as THREE from "three"

function TestComponent({
  quantumState,
  isDarkMode,
}: {
  quantumState: QuantumState
  isDarkMode: boolean
}) {
  const { mountRef, resetCamera } = useBlochScene({ quantumState, isDarkMode })

  return (
    <>
      <div data-testid="mount" ref={mountRef} />
      <button onClick={resetCamera} type="button">
        reset
      </button>
    </>
  )
}

describe("useBlochScene", () => {
  beforeEach(() => {
    rendererInstances.length = 0
    vi.clearAllMocks()

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    })
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 768,
    })

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillStyle: "",
      font: "",
      textAlign: "center",
      textBaseline: "middle",
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D)

    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1))
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
  })

  it("initializes the scene, resets the camera, and responds to resize events", () => {
    const quantumState = new QuantumState(new Complex(1, 0), new Complex(0, 0))
    const { getByTestId, getByRole } = render(
      <TestComponent isDarkMode quantumState={quantumState} />,
    )

    const renderer = rendererInstances[0]
    const mount = getByTestId("mount")
    const scene = renderer.render.mock.calls[0][0] as THREE.Scene
    const camera = renderer.render.mock.calls[0][1] as THREE.PerspectiveCamera

    expect(mount).toContainElement(renderer.domElement)
    expect(renderer.setSize).toHaveBeenCalledWith(1024, 768)
    expect(scene.background).toEqual(new THREE.Color(0x0a0a0f))
    expect(camera.position.toArray()).toEqual([3, 3, 3])

    fireEvent.mouseDown(renderer.domElement, { clientX: 10, clientY: 10 })
    fireEvent.mouseMove(renderer.domElement, { clientX: 50, clientY: 25 })
    expect(camera.position.toArray()).not.toEqual([3, 3, 3])

    fireEvent.click(getByRole("button", { name: "reset" }))
    expect(camera.position.toArray()).toEqual([3, 3, 3])

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 640,
    })
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 480,
    })

    fireEvent(window, new Event("resize"))

    expect(camera.aspect).toBe(640 / 480)
    expect(renderer.setSize).toHaveBeenLastCalledWith(640, 480)
  })

  it("updates the vector and label textures when props change", () => {
    const initialState = new QuantumState(new Complex(1, 0), new Complex(0, 0))
    const nextState = new QuantumState(new Complex(0, 0), new Complex(1, 0))
    const { rerender } = render(
      <TestComponent isDarkMode quantumState={initialState} />,
    )

    const renderer = rendererInstances[0]
    const scene = renderer.render.mock.calls[0][0] as THREE.Scene
    const initialVector = scene.children.find((child) => child instanceof THREE.ArrowHelper)
    const labelSprites = scene.children.filter((child) => child instanceof THREE.Sprite) as THREE.Sprite[]
    const initialMaps = labelSprites.map((sprite) => sprite.material.map)

    expect(initialVector).toBeInstanceOf(THREE.ArrowHelper)
    expect(labelSprites).toHaveLength(6)

    rerender(<TestComponent isDarkMode={false} quantumState={nextState} />)

    const updatedVector = scene.children.find((child) => child instanceof THREE.ArrowHelper)
    const updatedSprites = scene.children.filter((child) => child instanceof THREE.Sprite) as THREE.Sprite[]

    expect(scene.background).toEqual(new THREE.Color(0xf8fafc))
    expect(updatedVector).toBeInstanceOf(THREE.ArrowHelper)
    expect(updatedVector).not.toBe(initialVector)
    expect(updatedSprites).toHaveLength(6)

    updatedSprites.forEach((sprite, index) => {
      expect(sprite.material.map).not.toBe(initialMaps[index])
      expect(sprite.material.needsUpdate).toBe(true)
    })
  })

  it("removes listeners and disposes renderer resources on unmount", () => {
    const quantumState = new QuantumState(new Complex(1, 0), new Complex(0, 0))
    const removeWindowListenerSpy = vi.spyOn(window, "removeEventListener")
    const { getByTestId, unmount } = render(
      <TestComponent isDarkMode quantumState={quantumState} />,
    )

    const renderer = rendererInstances[0]
    const mount = getByTestId("mount")

    expect(mount).toContainElement(renderer.domElement)

    unmount()

    expect(mount).not.toContainElement(renderer.domElement)
    expect(renderer.dispose).toHaveBeenCalledTimes(1)
    expect(renderer.removeEventListenerSpy.mock.calls).toEqual(
      expect.arrayContaining([
        ["mousedown", expect.any(Function)],
        ["mouseup", expect.any(Function)],
        ["mousemove", expect.any(Function)],
        ["wheel", expect.any(Function)],
        ["touchstart", expect.any(Function)],
        ["touchmove", expect.any(Function)],
        ["touchend", expect.any(Function)],
      ]),
    )
    expect(removeWindowListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function))
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1)
  })
})
