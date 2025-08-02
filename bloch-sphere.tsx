"use client"

import { useRef, useEffect, useState } from "react"
import * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

class Complex {
  constructor(
    public real: number,
    public imag = 0,
  ) {}

  multiply(other: Complex): Complex {
    return new Complex(this.real * other.real - this.imag * other.imag, this.real * other.imag + this.imag * other.real)
  }

  add(other: Complex): Complex {
    return new Complex(this.real + other.real, this.imag + other.imag)
  }

  conjugate(): Complex {
    return new Complex(this.real, -this.imag)
  }

  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag)
  }

  toString(): string {
    return `${this.real.toFixed(3)} + ${this.imag.toFixed(3)}i`
  }
}

class QuantumState {
  constructor(
    public alpha: Complex,
    public beta: Complex,
  ) {}

  toCoordinates(): [number, number, number] {
    const alphaConj = this.alpha.conjugate()
    const betaConj = this.beta.conjugate()

    const x = 2 * alphaConj.multiply(this.beta).real
    const y = this.alpha.magnitude() ** 2 - this.beta.magnitude() ** 2
    const z = 2 * alphaConj.multiply(this.beta).imag

    return [x, y, z]
  }

  applyGate(gate: string): QuantumState {
    const gateMatrix = quantumGates[gate as keyof typeof quantumGates].matrix

    const alpha = gateMatrix[0][0].multiply(this.alpha).add(gateMatrix[0][1].multiply(this.beta))
    const beta = gateMatrix[1][0].multiply(this.alpha).add(gateMatrix[1][1].multiply(this.beta))

    return new QuantumState(alpha, beta)
  }
}


const quantumGates = {
  I: {
    name: "Identity",
    matrix: [
      [new Complex(1, 0), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(1, 0)],
    ],
    color: "#6b7280",
  },
  X: {
    name: "Pauli-X",
    matrix: [
      [new Complex(0, 0), new Complex(1, 0)],
      [new Complex(1, 0), new Complex(0, 0)],
    ],
    color: "#ef4444",
  },
  Y: {
    name: "Pauli-Y",
    matrix: [
      [new Complex(0, 0), new Complex(0, -1)],
      [new Complex(0, 1), new Complex(0, 0)],
    ],
    color: "#f59e0b",
  },
  Z: {
    name: "Pauli-Z",
    matrix: [
      [new Complex(1, 0), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(-1, 0)],
    ],
    color: "#3b82f6",
  },
  H: {
    name: "Hadamard",
    matrix: [
      [
        new Complex(1 / Math.sqrt(2), 0),
        new Complex(1 / Math.sqrt(2), 0),
      ],
      [
        new Complex(1 / Math.sqrt(2), 0),
        new Complex(-1 / Math.sqrt(2), 0),
      ],
    ],
    color: "#10b981",
  },
  S: {
    name: "S Gate",
    matrix: [
      [new Complex(1, 0), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(0, 1)],
    ],
    color: "#8b5cf6",
  },
  T: {
    name: "T Gate",
    matrix: [
      [new Complex(1, 0), new Complex(0, 0)],
      [
        new Complex(0, 0),
        new Complex(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)),
      ],
    ],
    color: "#f97316",
  },
}

export default function BlochSphere() {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const vectorRef = useRef<THREE.ArrowHelper>()
  const [quantumState, setQuantumState] = useState(new QuantumState(new Complex(1), new Complex(0)))
  const [appliedGates, setAppliedGates] = useState<string[]>([])

  useEffect(() => {
    if (!mountRef.current) return

    // シーンの設定
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf8fafc)
    sceneRef.current = scene

    // カメラの設定を変更して、|0⟩が真上を向くようにする
    const camera = new THREE.PerspectiveCamera(75, 800 / 800, 0.1, 1000)
    camera.position.set(3, 3, 3)
    camera.lookAt(0, 0, 0)

    // レンダラーの設定
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(800, 800)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // ライトの設定
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // グリッド線の作成
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.4,
    })

    // 緯度線（水平の円）を作成
    const createLatitudeLine = (radius: number, y: number) => {
      const points = []
      const segments = 64
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2
        points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius))
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      return new THREE.Line(geometry, gridMaterial)
    }

    // 経度線（垂直の半円）を作成
    const createLongitudeLine = (angle: number) => {
      const points = []
      const segments = 32
      for (let i = 0; i <= segments; i++) {
        const phi = (i / segments) * Math.PI
        const x = Math.sin(phi) * Math.cos(angle) * 2 // 2倍に
        const y = Math.cos(phi) * 2 // 2倍に
        const z = Math.sin(phi) * Math.sin(angle) * 2 // 2倍に
        points.push(new THREE.Vector3(x, y, z))
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      return new THREE.Line(geometry, gridMaterial)
    }

    // 緯度線を追加（赤道を含む5本）
    // 緯度線を追加（赤道を含む9本に増加）
    for (let i = -4; i <= 4; i++) {
      const y = i * 0.4 // -1.6, -1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2, 1.6 (0.2から0.4に変更)
      const radius = Math.sqrt(4 - y * y) // 球面上の半径 (1 - y*y から 4 - y*y に変更)
      if (radius > 0.1) {
        // 極付近は除外 (0.05から0.1に変更)
        const latLine = createLatitudeLine(radius, y)
        scene.add(latLine)
      }
    }

    // 経度線を追加（8本）
    // 経度線を追加（16本に増加）
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      const longLine = createLongitudeLine(angle)
      scene.add(longLine)
    }

    // 赤道線を強調（太い線）
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
      equatorPoints.push(new THREE.Vector3(Math.cos(angle) * 2, 0, Math.sin(angle) * 2)) // 2倍に
    }

    const equatorGeometry = new THREE.BufferGeometry().setFromPoints(equatorPoints)
    const equatorLine = new THREE.Line(equatorGeometry, equatorMaterial)
    scene.add(equatorLine)

    // 座標軸の作成（線のみ、矢印なし）
    const axisLength = 2.0 // 1.0から2.0に変更
    const axisMaterial = new THREE.LineBasicMaterial({
      linewidth: 3,
    })

    // X軸 (赤) - 線のみ
    const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-axisLength, 0, 0),
      new THREE.Vector3(axisLength, 0, 0),
    ])
    const xAxisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 })
    const xAxisLine = new THREE.Line(xAxisGeometry, xAxisMaterial)
    scene.add(xAxisLine)

    // Y軸 (青) - |0⟩方向 - 線のみ
    const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -axisLength, 0),
      new THREE.Vector3(0, axisLength, 0),
    ])
    const yAxisMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 })
    const yAxisLine = new THREE.Line(yAxisGeometry, yAxisMaterial)
    scene.add(yAxisLine)

    // Z軸 (緑) - |+⟩方向 - 線のみ
    const zAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -axisLength),
      new THREE.Vector3(0, 0, axisLength),
    ])
    const zAxisMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 })
    const zAxisLine = new THREE.Line(zAxisGeometry, zAxisMaterial)
    scene.add(zAxisLine)

    // 状態ベクトルの作成
    const [x, y, z] = quantumState.toCoordinates()
    const stateVector = new THREE.ArrowHelper(
      new THREE.Vector3(x, y, z).normalize(),
      new THREE.Vector3(0, 0, 0),
      2,
      0xff6b35,
      0.2, // 0.6から0.2に変更（矢印の頭部を小さく）
      0.1, // 0.3から0.1に変更（矢印の頭部を小さく）
    )
    // 線をさらに太くする
    stateVector.line.material.linewidth = 8 // 5から8に変更
    vectorRef.current = stateVector
    scene.add(stateVector)

    // |0⟩と|1⟩のラベル
    const createTextGeometry = (text: string, position: THREE.Vector3, color: number) => {
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")!
      canvas.width = 64
      canvas.height = 64
      context.fillStyle = `#${color.toString(16).padStart(6, "0")}`
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

    // ラベルの位置を調整して|0⟩を真上に配置
    createTextGeometry("|0⟩", new THREE.Vector3(0, 2.6, 0), 0x000000) // 1.3から2.6に
    createTextGeometry("|1⟩", new THREE.Vector3(0, -2.6, 0), 0x000000) // -1.3から-2.6に
    createTextGeometry("|+⟩", new THREE.Vector3(0, 0, 2.6), 0x000000) // 1.3から2.6に
    createTextGeometry("|-⟩", new THREE.Vector3(0, 0, -2.6), 0x000000) // -1.3から-2.6に

    // コントロールの設定
    let mouseDown = false
    let mouseX = 0
    let mouseY = 0

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

      camera.position.x = camera.position.x * Math.cos(deltaX * 0.01) - camera.position.z * Math.sin(deltaX * 0.01)
      camera.position.z = camera.position.x * Math.sin(deltaX * 0.01) + camera.position.z * Math.cos(deltaX * 0.01)

      const distance = Math.sqrt(camera.position.x ** 2 + camera.position.y ** 2 + camera.position.z ** 2)
      camera.position.y = Math.max(-distance * 0.9, Math.min(distance * 0.9, camera.position.y - deltaY * 0.01))

      camera.lookAt(0, 0, 0)
      mouseX = event.clientX
      mouseY = event.clientY
    }

    renderer.domElement.addEventListener("mousedown", onMouseDown)
    renderer.domElement.addEventListener("mouseup", onMouseUp)
    renderer.domElement.addEventListener("mousemove", onMouseMove)

    // アニメーションループ
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      renderer.domElement.removeEventListener("mousedown", onMouseDown)
      renderer.domElement.removeEventListener("mouseup", onMouseUp)
      renderer.domElement.removeEventListener("mousemove", onMouseMove)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // 状態ベクトルの更新
  useEffect(() => {
    if (vectorRef.current && sceneRef.current) {
      const [x, y, z] = quantumState.toCoordinates()
      sceneRef.current.remove(vectorRef.current)

      const newVector = new THREE.ArrowHelper(
        new THREE.Vector3(x, y, z).normalize(),
        new THREE.Vector3(0, 0, 0),
        Math.sqrt(x * x + y * y + z * z) * 2,
        0xff6b35,
        0.2, // 0.6から0.2に変更（矢印の頭部を小さく）
        0.1, // 0.3から0.1に変更（矢印の頭部を小さく）
      )

      // 線をさらに太くする
      newVector.line.material.linewidth = 8 // 5から8に変更
      vectorRef.current = newVector
      sceneRef.current.add(newVector)
    }
  }, [quantumState])

  const applyGate = (gate: string) => {
    const newState = quantumState.applyGate(gate)
    setQuantumState(newState)
    setAppliedGates((prev) => [...prev, gate])
  }

  const reset = () => {
    setQuantumState(new QuantumState(new Complex(1), new Complex(0)))
    setAppliedGates([])
  }

  const [x, y, z] = quantumState.toCoordinates()

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-6xl mx-auto">
      <div className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle>Bloch sphere</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={mountRef} className="flex justify-center" />
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-80 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Quantum Gate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(quantumGates).map(([key, gate]) => (
              <Button
                key={key}
                onClick={() => applyGate(key)}
                className="w-full justify-start"
                variant="outline"
                style={{ borderColor: gate.color }}
              >
                <span className="font-mono mr-2" style={{ color: gate.color }}>
                  {key}
                </span>
                {gate.name}
              </Button>
            ))}
            <Button onClick={reset} variant="destructive" className="w-full">
              Reset
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="text-sm">
                <strong>Coordinate</strong>
              </div>
              <div className="font-mono text-sm bg-muted p-2 rounded">
                x = {x.toFixed(3)}
                <br />y = {y.toFixed(3)}
                <br />z = {z.toFixed(3)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm">
                <strong>Quantum State</strong>
              </div>
              <div className="font-mono text-sm bg-muted p-2 rounded">
                α = {quantumState.alpha.toString()}<br />
                β = {quantumState.beta.toString()}
              </div>
            </div>

            {appliedGates.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Applied:</strong>
                </div>
                <div className="flex flex-wrap gap-1">
                  {appliedGates.map((gate, index) => (
                    <Badge key={index} variant="secondary">
                      {gate}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
