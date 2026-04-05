import { fireEvent, render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useBlochScene } from "@/hooks/use-bloch-scene"
import { Complex, QuantumState } from "@/lib/quantum"

const NON_STRING_LABEL_VALUE = 123

const createMockCanvasContext = () =>
({
  fillStyle: "",
  font: "",
  textAlign: "center",
  textBaseline: "middle",
  fillText: vi.fn(),
} as unknown as CanvasRenderingContext2D)

const createGetContextMock = (context: CanvasRenderingContext2D | null) =>
  ((contextId: string) => (contextId === "2d" ? context : null)) as typeof HTMLCanvasElement.prototype.getContext

const mockCanvasGetContext = (context: CanvasRenderingContext2D | null = createMockCanvasContext()) =>
  vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockImplementation(createGetContextMock(context))

const { mockRendererInstances, MockWebGLRenderer } = vi.hoisted(() => {
  const instances: Array<{
    domElement: HTMLCanvasElement
    setSize: ReturnType<typeof vi.fn>
    render: ReturnType<typeof vi.fn>
    dispose: ReturnType<typeof vi.fn>
    addEventListenerSpy: ReturnType<typeof vi.spyOn>
    removeEventListenerSpy: ReturnType<typeof vi.spyOn>
  }> = []

  class MockWebGLRenderer {
    domElement = document.createElement("canvas")
    setSize = vi.fn()
    render = vi.fn()
    dispose = vi.fn()
    addEventListenerSpy = vi.spyOn(this.domElement, "addEventListener")
    removeEventListenerSpy = vi.spyOn(this.domElement, "removeEventListener")

    constructor() {
      instances.push(this)
    }
  }

  return {
    mockRendererInstances: instances,
    MockWebGLRenderer,
  }
})

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
  applyGate = () => undefined,
  reset = () => undefined,
}: {
  quantumState: QuantumState
  isDarkMode: boolean
  applyGate?: (gate: string) => void
  reset?: () => void
}) {
  const { mountRef, resetCamera } = useBlochScene({ quantumState, isDarkMode, applyGate, reset })

  return (
    <>
      <div data-testid="mount" ref={mountRef} />
      <button onClick={resetCamera} type="button">
        reset
      </button>
    </>
  )
}

function DetachedTestComponent({
  quantumState,
  isDarkMode,
  applyGate = () => undefined,
  reset = () => undefined,
}: {
  quantumState: QuantumState
  isDarkMode: boolean
  applyGate?: (gate: string) => void
  reset?: () => void
}) {
  useBlochScene({ quantumState, isDarkMode, applyGate, reset })

  return null
}

function ResetOnlyTestComponent({
  quantumState,
  isDarkMode,
  applyGate = () => undefined,
  reset = () => undefined,
}: {
  quantumState: QuantumState
  isDarkMode: boolean
  applyGate?: (gate: string) => void
  reset?: () => void
}) {
  const { resetCamera } = useBlochScene({ quantumState, isDarkMode, applyGate, reset })

  return (
    <button onClick={resetCamera} type="button">
      reset camera
    </button>
  )
}

describe("useBlochScene", () => {
  beforeEach(() => {
    mockRendererInstances.length = 0
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

    mockCanvasGetContext()

    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1))
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
  })

  it("initializes the scene, resets the camera, and responds to resize events", () => {
    const quantumState = new QuantumState(new Complex(1, 0), new Complex(0, 0))
    const { getByTestId, getByRole } = render(
      <TestComponent isDarkMode quantumState={quantumState} />,
    )

    const renderer = mockRendererInstances[0]
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

    const renderer = mockRendererInstances[0]
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
    })
  })

  it("supports wheel zoom, touch rotation, and pinch zoom interactions", () => {
    const quantumState = new QuantumState(new Complex(1, 0), new Complex(0, 0))
    render(<TestComponent isDarkMode quantumState={quantumState} />)

    const renderer = mockRendererInstances[0]
    const camera = renderer.render.mock.calls[0][1] as THREE.PerspectiveCamera

    fireEvent.wheel(renderer.domElement, { deltaY: 120 })
    expect(camera.position.length()).toBeCloseTo(Math.sqrt(27) + 1.2, 4)

    fireEvent.wheel(renderer.domElement, { deltaY: -1000 })
    expect(camera.position.length()).toBeCloseTo(2, 4)

    fireEvent.touchStart(renderer.domElement, {
      touches: [{ clientX: 10, clientY: 10 }],
    })
    const positionBeforeDrag = camera.position.toArray()
    fireEvent.touchMove(renderer.domElement, {
      touches: [{ clientX: 50, clientY: 35 }],
    })
    expect(camera.position.toArray()).not.toEqual(positionBeforeDrag)

    fireEvent.touchStart(renderer.domElement, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 100, clientY: 0 },
      ],
    })
    fireEvent.touchMove(renderer.domElement, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 200, clientY: 0 },
      ],
    })
    expect(camera.position.length()).toBeCloseTo(2, 4)

    fireEvent.touchEnd(renderer.domElement, {
      touches: [{ clientX: 30, clientY: 30 }],
    })
    const positionBeforeSecondDrag = camera.position.toArray()
    fireEvent.touchMove(renderer.domElement, {
      touches: [{ clientX: 60, clientY: 45 }],
    })
    expect(camera.position.toArray()).not.toEqual(positionBeforeSecondDrag)

    fireEvent.touchEnd(renderer.domElement, { touches: [] })
    const positionBeforeIgnoredMove = camera.position.toArray()
    fireEvent.touchMove(renderer.domElement, {
      touches: [{ clientX: 80, clientY: 80 }],
    })
    expect(camera.position.toArray()).toEqual(positionBeforeIgnoredMove)

    fireEvent.mouseDown(renderer.domElement, { clientX: 25, clientY: 25 })
    fireEvent.mouseUp(renderer.domElement)
    const positionBeforeMouseMove = camera.position.toArray()
    fireEvent.mouseMove(renderer.domElement, { clientX: 70, clientY: 70 })
    expect(camera.position.toArray()).toEqual(positionBeforeMouseMove)

    fireEvent.wheel(renderer.domElement, { deltaY: 5000 })
    expect(camera.position.length()).toBeCloseTo(10, 4)
  })

  it("applies gates and reset through keyboard shortcuts", () => {
    const quantumState = new QuantumState(new Complex(1, 0), new Complex(0, 0))
    const applyGate = vi.fn()
    const reset = vi.fn()
    render(
      <TestComponent
        applyGate={applyGate}
        isDarkMode
        quantumState={quantumState}
        reset={reset}
      />,
    )

    fireEvent.keyDown(window, { key: "x" })
    fireEvent.keyDown(window, { key: "Y" })
    fireEvent.keyDown(window, { key: "z" })
    fireEvent.keyDown(window, { key: "h" })
    fireEvent.keyDown(window, { key: "s" })
    fireEvent.keyDown(window, { key: "t" })
    fireEvent.keyDown(window, { key: "r" })
    fireEvent.keyDown(window, { ctrlKey: true, key: "x" })

    const input = document.createElement("input")
    document.body.appendChild(input)
    fireEvent.keyDown(input, { key: "x" })

    expect(applyGate.mock.calls).toEqual([
      ["X"],
      ["Y"],
      ["Z"],
      ["H"],
      ["S"],
      ["T"],
    ])
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it("initializes the scene in light mode", () => {
    const quantumState = new QuantumState(new Complex(1, 0), new Complex(0, 0))
    render(<TestComponent isDarkMode={false} quantumState={quantumState} />)

    const renderer = mockRendererInstances[0]
    const scene = renderer.render.mock.calls[0][0] as THREE.Scene

    expect(scene.background).toEqual(new THREE.Color(0xf8fafc))
  })

  it("ignores touch updates until the touch state becomes actionable", () => {
    const quantumState = new QuantumState(new Complex(1, 0), new Complex(0, 0))
    render(<TestComponent isDarkMode={false} quantumState={quantumState} />)

    const renderer = mockRendererInstances[0]
    const camera = renderer.render.mock.calls[0][1] as THREE.PerspectiveCamera

    const initialLength = camera.position.length()
    fireEvent.touchMove(renderer.domElement, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 100, clientY: 0 },
      ],
    })
    expect(camera.position.length()).toBeCloseTo(initialLength, 4)

    // Three touches should leave the hook in its idle fallback state.
    fireEvent.touchStart(renderer.domElement, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 100, clientY: 0 },
        { clientX: 50, clientY: 100 },
      ],
    })
    const positionBeforeSingleTouchMove = camera.position.toArray()
    fireEvent.touchMove(renderer.domElement, {
      touches: [{ clientX: 40, clientY: 40 }],
    })
    expect(camera.position.toArray()).toEqual(positionBeforeSingleTouchMove)

    fireEvent.touchStart(renderer.domElement, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 120, clientY: 0 },
      ],
    })
    fireEvent.touchEnd(renderer.domElement, {
      touches: [
        { clientX: 10, clientY: 10 },
        { clientX: 110, clientY: 10 },
      ],
    })
    const positionAfterTwoTouchEnd = camera.position.toArray()
    fireEvent.touchMove(renderer.domElement, {
      touches: [{ clientX: 70, clientY: 70 }],
    })
    expect(camera.position.toArray()).toEqual(positionAfterTwoTouchEnd)
  })

  it("handles missing scene mounts and skips invalid or unrenderable label updates", () => {
    const quantumState = new QuantumState(new Complex(1, 0), new Complex(0, 0))
    const getContextSpy = mockCanvasGetContext()

    const detached = render(<DetachedTestComponent isDarkMode quantumState={quantumState} />)
    expect(mockRendererInstances).toHaveLength(0)
    detached.rerender(<DetachedTestComponent isDarkMode={false} quantumState={quantumState} />)

    const { rerender } = render(<TestComponent isDarkMode quantumState={quantumState} />)
    const renderer = mockRendererInstances[0]
    const scene = renderer.render.mock.calls[0][0] as THREE.Scene
    const labelSprites = scene.children.filter((child) => child instanceof THREE.Sprite) as THREE.Sprite[]

    labelSprites[0].userData.labelText = NON_STRING_LABEL_VALUE
    getContextSpy.mockImplementation(createGetContextMock(null))

    rerender(<TestComponent isDarkMode={false} quantumState={quantumState} />)

    expect(labelSprites).toHaveLength(6)
  })

  it("skips label sprite creation when canvas text rendering is unavailable", () => {
    const quantumState = new QuantumState(new Complex(1, 0), new Complex(0, 0))

    mockCanvasGetContext(null)
    render(<TestComponent isDarkMode quantumState={quantumState} />)

    const renderer = mockRendererInstances[0]
    const scene = renderer.render.mock.calls[0][0] as THREE.Scene
    const labelSprites = scene.children.filter((child) => child instanceof THREE.Sprite)

    expect(labelSprites).toHaveLength(0)
  })

  it("removes listeners and disposes renderer resources on unmount", () => {
    const quantumState = new QuantumState(new Complex(1, 0), new Complex(0, 0))
    const removeWindowListenerSpy = vi.spyOn(window, "removeEventListener")
    const { getByTestId, unmount } = render(
      <TestComponent isDarkMode quantumState={quantumState} />,
    )

    const renderer = mockRendererInstances[0]
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
    expect(removeWindowListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function))
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1)
  })

  it("safely skips reset work when the scene never mounts", () => {
    const quantumState = new QuantumState(new Complex(1, 0), new Complex(0, 0))

    const { getByRole } = render(
      <ResetOnlyTestComponent isDarkMode quantumState={quantumState} />,
    )
    expect(mockRendererInstances).toHaveLength(0)
    fireEvent.click(getByRole("button", { name: "reset camera" }))
    expect(mockRendererInstances).toHaveLength(0)
  })

  it("cleans up safely and disposes array materials", () => {
    const quantumState = new QuantumState(new Complex(1, 0), new Complex(0, 0))
    const addWindowListenerSpy = vi.spyOn(window, "addEventListener")
    const arrayMaterial = [
      new THREE.MeshBasicMaterial(),
      new THREE.MeshBasicMaterial(),
    ]
    const disposeSpies = arrayMaterial.map((material) => vi.spyOn(material, "dispose"))

    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 99))
    const { unmount } = render(<TestComponent isDarkMode quantumState={quantumState} />)

    const renderer = mockRendererInstances[0]
    const scene = renderer.render.mock.calls[0][0] as THREE.Scene
    const resizeHandler = addWindowListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "resize",
    )?.[1] as EventListener

    scene.add(new THREE.Mesh(new THREE.BufferGeometry(), arrayMaterial))

    unmount()

    expect(resizeHandler).toBeDefined()
    expect(cancelAnimationFrame).toHaveBeenCalledWith(99)
    disposeSpies.forEach((disposeSpy) => expect(disposeSpy).toHaveBeenCalledOnce())
    expect(() => resizeHandler(new Event("resize"))).not.toThrow()
  })
})
