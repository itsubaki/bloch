"use client"

import * as THREE from "three"
import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Complex, QuantumState, quantumGates } from "@/lib/quantum"

export default function Bloch() {
  const [quantumState, setQuantumState] = useState(new QuantumState(new Complex(1), new Complex(0)))
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [showMobilePanel, setShowMobilePanel] = useState(false)

  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>(null)
  const rendererRef = useRef<THREE.WebGLRenderer>(null)
  const vectorRef = useRef<THREE.ArrowHelper>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(isDarkMode ? 0x0a0a0f : 0xf8fafc)
    sceneRef.current = scene

    const width = window.innerWidth
    const height = window.innerHeight

    const camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 1000)
    camera.position.set(3, 3, 3)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    const grid = new THREE.LineBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.4,
    })

    // Latitude lines
    const createLatitudeLine = (radius: number, y: number) => {
      const points = []
      const segments = 64
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2
        points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius))
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      return new THREE.Line(geometry, grid)
    }

    for (let i = -4; i <= 4; i++) {
      const y = i * 0.4
      const radius = Math.sqrt(4 - y * y)
      if (radius > 0.1) {
        const latLine = createLatitudeLine(radius, y)
        scene.add(latLine)
      }
    }

    // Longitude lines
    const createLongitudeLine = (angle: number) => {
      const points = []
      const segments = 32
      for (let i = 0; i <= segments; i++) {
        const phi = (i / segments) * Math.PI
        const x = Math.sin(phi) * Math.cos(angle) * 2
        const y = Math.cos(phi) * 2
        const z = Math.sin(phi) * Math.sin(angle) * 2
        points.push(new THREE.Vector3(x, y, z))
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      return new THREE.Line(geometry, grid)
    }

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      const longLine = createLongitudeLine(angle)
      scene.add(longLine)
    }

    // Equator line
    const equatorMaterial = new THREE.LineBasicMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.6,
      linewidth: 2,
    })

    const equatorPoints = []
    const segments = 64
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      equatorPoints.push(new THREE.Vector3(Math.cos(angle) * 2, 0, Math.sin(angle) * 2))
    }

    const equatorGeometry = new THREE.BufferGeometry().setFromPoints(equatorPoints)
    const equatorLine = new THREE.Line(equatorGeometry, equatorMaterial)
    scene.add(equatorLine)

    // X, Y, Z axes
    const axisLength = 2.0
    const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-axisLength, 0, 0),
      new THREE.Vector3(axisLength, 0, 0),
    ])
    const xAxisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 })
    const xAxisLine = new THREE.Line(xAxisGeometry, xAxisMaterial)
    scene.add(xAxisLine)

    const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -axisLength, 0),
      new THREE.Vector3(0, axisLength, 0),
    ])
    const yAxisMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 })
    const yAxisLine = new THREE.Line(yAxisGeometry, yAxisMaterial)
    scene.add(yAxisLine)

    const zAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -axisLength),
      new THREE.Vector3(0, 0, axisLength),
    ])
    const zAxisMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 })
    const zAxisLine = new THREE.Line(zAxisGeometry, zAxisMaterial)
    scene.add(zAxisLine)

    const [x, y, z] = quantumState.toCoordinates()
    const stateVector = new THREE.ArrowHelper(
      new THREE.Vector3(x, y, z).normalize(),
      new THREE.Vector3(0, 0, 0),
      2,
      0xff6b35,
      0.2,
      0.1,
    )

    vectorRef.current = stateVector
    scene.add(stateVector)

    // State labels
    const createTextGeometry = (text: string, position: THREE.Vector3, color: number) => {
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")!
      canvas.width = 64
      canvas.height = 64
      context.fillStyle = `#${(isDarkMode ? 0xffffff : 0x000000).toString(16).padStart(6, "0")}`
      context.font = "32px Arial"
      context.textAlign = "center"
      context.fillText(text, 32, 40)

      const texture = new THREE.CanvasTexture(canvas)
      const material = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(material)
      sprite.position.copy(position)
      sprite.scale.set(0.5, 0.5, 1)
      scene.add(sprite)
    }

    createTextGeometry("|0⟩", new THREE.Vector3(0, 2.6, 0), 0x000000)
    createTextGeometry("|1⟩", new THREE.Vector3(0, -2.6, 0), 0x000000)
    createTextGeometry("|+⟩", new THREE.Vector3(0, 0, 2.6), 0x000000)
    createTextGeometry("|-⟩", new THREE.Vector3(0, 0, -2.6), 0x000000)
    createTextGeometry("|i⟩", new THREE.Vector3(2.6, 0, 0), 0x000000)
    createTextGeometry("|-i⟩", new THREE.Vector3(-2.6, 0, 0), 0x000000)

    // Camera controls
    let mouseDown = false
    let mouseX = 0
    let mouseY = 0
    let touches: Touch[] = []
    let lastPinchDistance = 0

    const onMouseDown = (event: MouseEvent) => {
      mouseDown = true
      mouseX = event.clientX
      mouseY = event.clientY
    }

    const onMouseUp = () => {
      mouseDown = false
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!mouseDown) return

      const deltaX = event.clientX - mouseX
      const deltaY = event.clientY - mouseY

      const sphericalCoords = new THREE.Spherical()
      sphericalCoords.setFromVector3(camera.position)

      sphericalCoords.theta -= deltaX * 0.01
      sphericalCoords.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalCoords.phi + deltaY * 0.01))

      camera.position.setFromSpherical(sphericalCoords)
      camera.lookAt(0, 0, 0)

      mouseX = event.clientX
      mouseY = event.clientY
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()

      const sphericalCoords = new THREE.Spherical()
      sphericalCoords.setFromVector3(camera.position)

      sphericalCoords.radius = Math.max(2, Math.min(10, sphericalCoords.radius + event.deltaY * 0.01))

      camera.position.setFromSpherical(sphericalCoords)
      camera.lookAt(0, 0, 0)
    }

    const onTouchStart = (event: TouchEvent) => {
      event.preventDefault()
      touches = Array.from(event.touches)

      if (touches.length === 1) {
        mouseDown = true
        mouseX = touches[0].clientX
        mouseY = touches[0].clientY
      } else if (touches.length === 2) {
        mouseDown = false
        const dx = touches[0].clientX - touches[1].clientX
        const dy = touches[0].clientY - touches[1].clientY
        lastPinchDistance = Math.sqrt(dx * dx + dy * dy)
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault()
      touches = Array.from(event.touches)

      if (touches.length === 1 && mouseDown) {
        const deltaX = touches[0].clientX - mouseX
        const deltaY = touches[0].clientY - mouseY

        const sphericalCoords = new THREE.Spherical()
        sphericalCoords.setFromVector3(camera.position)

        sphericalCoords.theta -= deltaX * 0.01
        sphericalCoords.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalCoords.phi + deltaY * 0.01))

        camera.position.setFromSpherical(sphericalCoords)
        camera.lookAt(0, 0, 0)

        mouseX = touches[0].clientX
        mouseY = touches[0].clientY
      } else if (touches.length === 2) {
        const dx = touches[0].clientX - touches[1].clientX
        const dy = touches[0].clientY - touches[1].clientY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (lastPinchDistance > 0) {
          const scale = distance / lastPinchDistance

          const sphericalCoords = new THREE.Spherical()
          sphericalCoords.setFromVector3(camera.position)
          sphericalCoords.radius = Math.max(2, Math.min(10, sphericalCoords.radius / scale))

          camera.position.setFromSpherical(sphericalCoords)
          camera.lookAt(0, 0, 0)
        }

        lastPinchDistance = distance
      }
    }

    const onTouchEnd = (event: TouchEvent) => {
      event.preventDefault()
      touches = Array.from(event.touches)

      if (touches.length === 0) {
        mouseDown = false
        lastPinchDistance = 0
      } else if (touches.length === 1) {
        mouseDown = true
        mouseX = touches[0].clientX
        mouseY = touches[0].clientY
        lastPinchDistance = 0
      }
    }

    renderer.domElement.addEventListener("mousedown", onMouseDown)
    renderer.domElement.addEventListener("mouseup", onMouseUp)
    renderer.domElement.addEventListener("mousemove", onMouseMove)
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false })
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: false })
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: false })
    renderer.domElement.addEventListener("touchend", onTouchEnd, { passive: false })

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = width / height
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(width, height)
      }
    }
    window.addEventListener("resize", handleResize)

    // Cleanup on unmount
    return () => {
      renderer.domElement.removeEventListener("mousedown", onMouseDown)
      renderer.domElement.removeEventListener("mouseup", onMouseUp)
      renderer.domElement.removeEventListener("mousemove", onMouseMove)
      renderer.domElement.removeEventListener("wheel", onWheel)
      renderer.domElement.removeEventListener("touchstart", onTouchStart)
      renderer.domElement.removeEventListener("touchmove", onTouchMove)
      renderer.domElement.removeEventListener("touchend", onTouchEnd)
      window.removeEventListener("resize", handleResize)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [isDarkMode])

  useEffect(() => {
    if (vectorRef.current && sceneRef.current) {
      const [x, y, z] = quantumState.toCoordinates()
      sceneRef.current.remove(vectorRef.current)

      const newVector = new THREE.ArrowHelper(
        new THREE.Vector3(x, y, z).normalize(),
        new THREE.Vector3(0, 0, 0),
        Math.sqrt(x * x + y * y + z * z) * 2,
        0xff6b35,
        0.2,
        0.1,
      )

      vectorRef.current = newVector
      sceneRef.current.add(newVector)
    }
  }, [quantumState])

  const apply = (g: string) => {
    setQuantumState(quantumState.apply(g))
  }

  const reset = () => {
    setQuantumState(new QuantumState(new Complex(1), new Complex(0)))

    if (cameraRef.current) {
      cameraRef.current.position.set(3, 3, 3)
      cameraRef.current.lookAt(0, 0, 0)
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Desktop Controls */}
      <div className="md:flex hidden absolute top-4 right-4 z-50 items-start gap-2">
        <Button
          onClick={toggleDarkMode}
          variant="outline"
          size="icon"
          className={`w-10 h-10 backdrop-blur-md border rounded-lg shadow-xl transition-colors ${isDarkMode
            ? "bg-gray-800/90 border-gray-700 hover:bg-gray-700/95 text-white"
            : "bg-background/90 hover:bg-background/95"
            }`}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isDarkMode
                ? "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                : "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              }
            />
          </svg>
        </Button>

        <a
          href="https://github.com/itsubaki/bloch"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center w-10 h-10 backdrop-blur-md border rounded-lg shadow-xl transition-colors ${isDarkMode
            ? "bg-gray-800/90 border-gray-700 hover:bg-gray-700/95 text-white"
            : "bg-background/90 hover:bg-background/95"
            }`}
          title="View on GitHub"
        >
          <img src="/github-mark.svg" alt="GitHub" className={`w-6 h-6 ${isDarkMode ? "invert" : ""}`} />
        </a>

        <div className={`w-64 backdrop-blur-md border rounded-lg shadow-xl max-h-[calc(100vh-2rem)] overflow-y-auto ${isDarkMode ? "bg-gray-800/90 border-gray-700" : "bg-background/90"}`}>
          <div className="p-3 space-y-3">
            <Card className={isDarkMode ? "bg-gray-900/50 border-gray-700" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-base ${isDarkMode ? "text-white" : ""}`}>
                  Quantum Gate
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                {Object.entries(quantumGates).map(([key, gate]) => (
                  <Button
                    key={key}
                    onClick={() => apply(key)}
                    className={`w-full justify-start text-sm h-8 ${isDarkMode ? "bg-gray-800 border-gray-600 hover:bg-gray-700 text-white" : ""}`}
                    variant="outline"
                    style={{ borderColor: gate.color }}
                  >
                    <span className="font-mono mr-2" style={{ color: gate.color }}>
                      {key}
                    </span>
                    {gate.name}
                  </Button>
                ))}

                <Button onClick={reset} variant="destructive" className="w-full text-sm h-8">
                  Reset
                </Button>
              </CardContent>
            </Card>

            <Card className={isDarkMode ? "bg-gray-900/50 border-gray-700" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-base ${isDarkMode ? "text-white" : ""}`}>Quantum State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className={`font-mono text-xs p-2 rounded ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-muted"}`}>
                    a = {quantumState.a.toString()}
                    <br />
                    b = {quantumState.b.toString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="md:hidden">
        <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
          <div className="flex flex-row items-center gap-2">
            <Button
              onClick={toggleDarkMode}
              variant="outline"
              size="icon"
              className={`w-10 h-10 backdrop-blur-md border rounded-lg shadow-xl transition-colors ${isDarkMode
                ? "bg-gray-800/90 border-gray-700 hover:bg-gray-700/95 text-white"
                : "bg-background/90 hover:bg-background/95"
                }`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isDarkMode
                    ? "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    : "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  }
                />
              </svg>
            </Button>

            <a
              href="https://github.com/itsubaki/bloch"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center w-10 h-10 backdrop-blur-md border rounded-lg shadow-xl transition-colors ${isDarkMode
                ? "bg-gray-800/90 border-gray-700 hover:bg-gray-700/95 text-white"
                : "bg-background/90 hover:bg-background/95"
                }`}
              title="View on GitHub"
            >
              <img src="/github-mark.svg" alt="GitHub" className={`w-6 h-6 ${isDarkMode ? "invert" : ""}`} />
            </a>

            <Button
              onClick={() => setShowMobilePanel(!showMobilePanel)}
              className={`w-10 h-10 rounded-full backdrop-blur-md border shadow-xl transition-all ${isDarkMode
                ? "bg-gray-800/90 border-gray-700 hover:bg-gray-700/95 text-white"
                : "bg-background/90 hover:bg-background/95"
                }`}
            >
              <svg className="w-5 h-5" fill={isDarkMode ? "currentColor" : "#000000"} viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </Button>
          </div>

          {showMobilePanel && (
            <div className={`w-52 max-h-96 backdrop-blur-md border rounded-lg shadow-xl overflow-y-auto transition-all ${isDarkMode ? "bg-gray-800/95 border-gray-700" : "bg-background/95"}`}>
              <div className="p-3 space-y-3">
                <div className="space-y-2">
                  <div className={`text-xs font-medium ${isDarkMode ? "text-white" : ""}`}>
                    Quantum Gate
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(quantumGates).map(([key, gate]) => (
                      <Button
                        key={key}
                        onClick={() => apply(key)}
                        className={`text-xs h-7 ${isDarkMode ? "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white" : ""}`}
                        variant="outline"
                        style={{ borderColor: gate.color }}
                      >
                        <span className="font-mono" style={{ color: gate.color }}>
                          {key}
                        </span>
                      </Button>
                    ))}
                  </div>
                  <Button onClick={reset} variant="destructive" className="w-full text-xs h-7">
                    Reset
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className={`text-xs font-medium ${isDarkMode ? "text-white" : ""}`}>
                    Quantum State
                  </div>
                  <div className={`font-mono text-xs p-2 rounded ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-muted"}`}>
                    a = {quantumState.a.real.toFixed(4)} + {quantumState.a.imag.toFixed(4)}i
                    <br />
                    b = {quantumState.b.real.toFixed(4)} + {quantumState.b.imag.toFixed(4)}i
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
