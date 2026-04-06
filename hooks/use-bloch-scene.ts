"use client"

import * as THREE from "three"
import { useEffect, useRef } from "react"
import { QuantumState } from "@/lib/quantum"

const LABEL_CONFIGS = [
    { text: "|0⟩", position: [0, 2.6, 0] as const },
    { text: "|1⟩", position: [0, -2.6, 0] as const },
    { text: "|+⟩", position: [0, 0, 2.6] as const },
    { text: "|-⟩", position: [0, 0, -2.6] as const },
    { text: "|i⟩", position: [2.6, 0, 0] as const },
    { text: "|-i⟩", position: [-2.6, 0, 0] as const },
]

const KEY_TO_GATE = {
    h: "H",
    s: "S",
    t: "T",
    x: "X",
    y: "Y",
    z: "Z",
} as const

const disposeMaterial = (
    material: THREE.Material | THREE.Material[],
    disposedMaterials?: Set<THREE.Material>,
) => {
    const materials = Array.isArray(material) ? material : [material]
    materials.forEach((entry) => {
        if (disposedMaterials?.has(entry)) {
            return
        }

        Object.values(entry).forEach((value) => {
            if (value instanceof THREE.Texture) {
                value.dispose()
            }
        })

        entry.dispose()
        disposedMaterials?.add(entry)
    })
}

const disposeObjectResources = (object: THREE.Object3D, disposedMaterials?: Set<THREE.Material>) => {
    const geometryHolder = object as THREE.Object3D & { geometry?: THREE.BufferGeometry }
    const materialHolder = object as THREE.Object3D & { material?: THREE.Material | THREE.Material[] }

    geometryHolder.geometry?.dispose()
    if (materialHolder.material) {
        disposeMaterial(materialHolder.material, disposedMaterials)
    }
}

const createLabelTexture = (text: string, darkMode: boolean) => {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    if (!context) {
        return null
    }

    canvas.width = 64
    canvas.height = 64
    context.fillStyle = darkMode ? "#ffffff" : "#000000"
    context.font = "32px Arial"
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(text, 32, 32)

    return new THREE.CanvasTexture(canvas)
}

const resetCameraPosition = (camera: THREE.PerspectiveCamera) => {
    camera.position.set(3, 3, 3)
    camera.lookAt(0, 0, 0)
}

const rotateCamera = (camera: THREE.PerspectiveCamera, deltaTheta: number, deltaPhi: number) => {
    const sphericalCoords = new THREE.Spherical()
    sphericalCoords.setFromVector3(camera.position)

    sphericalCoords.theta += deltaTheta
    sphericalCoords.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalCoords.phi + deltaPhi))

    camera.position.setFromSpherical(sphericalCoords)
    camera.lookAt(0, 0, 0)
}

const zoomCamera = (camera: THREE.PerspectiveCamera, deltaRadius: number) => {
    const sphericalCoords = new THREE.Spherical()
    sphericalCoords.setFromVector3(camera.position)

    sphericalCoords.radius = Math.max(2, Math.min(10, sphericalCoords.radius + deltaRadius))

    camera.position.setFromSpherical(sphericalCoords)
    camera.lookAt(0, 0, 0)
}

const getVectorLength = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z) * 2

const isEditableTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement
    && (
        target.isContentEditable
        || target.tagName === "INPUT"
        || target.tagName === "SELECT"
        || target.tagName === "TEXTAREA"
    )

export function useBlochScene({
    quantumState,
    isDarkMode,
    applyGate,
    resetState,
}: {
    quantumState: QuantumState
    isDarkMode: boolean
    applyGate: (gate: string) => void
    resetState: () => void
}) {
    const initialIsDarkModeRef = useRef(isDarkMode)
    const mountRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const vectorRef = useRef<THREE.ArrowHelper | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const labelSpritesRef = useRef<THREE.Sprite[]>([])

    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(initialIsDarkModeRef.current ? 0x0a0a0f : 0xf8fafc)
        sceneRef.current = scene

        const width = window.innerWidth
        const height = window.innerHeight

        const camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 1000)
        resetCameraPosition(camera)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        rendererRef.current = renderer
        mount.appendChild(renderer.domElement)

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(5, 5, 5)
        scene.add(directionalLight)

        const grid = new THREE.LineBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.4,
        })

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

        for (let i = -5; i <= 5; i++) {
            const y = i * 0.4
            const radius = Math.sqrt(4 - y * y)
            if (radius > 0.1) {
                const latLine = createLatitudeLine(radius, y)
                scene.add(latLine)
            }
        }

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

        labelSpritesRef.current = LABEL_CONFIGS.flatMap(({ text, position }) => {
            const texture = createLabelTexture(text, initialIsDarkModeRef.current)
            if (!texture) {
                return []
            }

            const material = new THREE.SpriteMaterial({ map: texture })
            const sprite = new THREE.Sprite(material)
            sprite.userData.labelText = text
            sprite.position.set(position[0], position[1], position[2])
            sprite.scale.set(0.5, 0.5, 1)
            scene.add(sprite)

            return [sprite]
        })

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

            rotateCamera(camera, -deltaX * 0.01, deltaY * 0.01)

            mouseX = event.clientX
            mouseY = event.clientY
        }

        const onWheel = (event: WheelEvent) => {
            event.preventDefault()
            zoomCamera(camera, event.deltaY * 0.01)
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

                rotateCamera(camera, -deltaX * 0.01, deltaY * 0.01)

                mouseX = touches[0].clientX
                mouseY = touches[0].clientY
            } else if (touches.length === 2) {
                const dx = touches[0].clientX - touches[1].clientX
                const dy = touches[0].clientY - touches[1].clientY
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (lastPinchDistance > 0) {
                    const scale = distance / lastPinchDistance
                    zoomCamera(camera, camera.position.length() / scale - camera.position.length())
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

        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate)
            renderer.render(scene, camera)
        }
        animate()

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

        return () => {
            renderer.domElement.removeEventListener("mousedown", onMouseDown)
            renderer.domElement.removeEventListener("mouseup", onMouseUp)
            renderer.domElement.removeEventListener("mousemove", onMouseMove)
            renderer.domElement.removeEventListener("wheel", onWheel)
            renderer.domElement.removeEventListener("touchstart", onTouchStart)
            renderer.domElement.removeEventListener("touchmove", onTouchMove)
            renderer.domElement.removeEventListener("touchend", onTouchEnd)
            window.removeEventListener("resize", handleResize)

            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current)
            }

            if (mount && renderer.domElement) {
                mount.removeChild(renderer.domElement)
            }

            const disposedMaterials = new Set<THREE.Material>()

            labelSpritesRef.current.forEach((sprite) => {
                disposeMaterial(sprite.material, disposedMaterials)
            })
            labelSpritesRef.current = []

            scene.traverse((object) => {
                if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
                    disposeObjectResources(object, disposedMaterials)
                }
            })

            renderer.dispose()
            sceneRef.current = null
            rendererRef.current = null
            vectorRef.current = null
            cameraRef.current = null
        }
    }, [])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                event.defaultPrevented
                || event.altKey
                || event.ctrlKey
                || event.metaKey
                || isEditableTarget(event.target)
            ) {
                return
            }

            const key = event.key.toLowerCase()

            if (key === "r") {
                event.preventDefault()
                resetState()
                if (cameraRef.current) {
                    resetCameraPosition(cameraRef.current)
                }
                return
            }

            if (cameraRef.current) {
                switch (key) {
                    case "arrowleft":
                        event.preventDefault()
                        rotateCamera(cameraRef.current, 0.12, 0)
                        return
                    case "arrowright":
                        event.preventDefault()
                        rotateCamera(cameraRef.current, -0.12, 0)
                        return
                    case "arrowup":
                        event.preventDefault()
                        rotateCamera(cameraRef.current, 0, -0.12)
                        return
                    case "arrowdown":
                        event.preventDefault()
                        rotateCamera(cameraRef.current, 0, 0.12)
                        return
                    case "+":
                        event.preventDefault()
                        zoomCamera(cameraRef.current, -0.5)
                        return
                    case "-":
                        event.preventDefault()
                        zoomCamera(cameraRef.current, 0.5)
                        return
                    default:
                        break
                }
            }



            const gate = KEY_TO_GATE[key as keyof typeof KEY_TO_GATE]
            if (!gate) {
                return
            }

            event.preventDefault()
            applyGate(gate)
        }

        window.addEventListener("keydown", onKeyDown)

        return () => {
            window.removeEventListener("keydown", onKeyDown)
        }
    }, [applyGate, resetState])

    useEffect(() => {
        if (!sceneRef.current) {
            return
        }

        sceneRef.current.background = new THREE.Color(isDarkMode ? 0x0a0a0f : 0xf8fafc)

        labelSpritesRef.current.forEach((sprite) => {
            const labelText = typeof sprite.userData.labelText === "string" ? sprite.userData.labelText : null
            if (!labelText) {
                return
            }

            const texture = createLabelTexture(labelText, isDarkMode)
            if (!texture) {
                return
            }

            const material = sprite.material
            material.map?.dispose()
            material.map = texture
            material.needsUpdate = true
        })
    }, [isDarkMode])

    useEffect(() => {
        if (sceneRef.current) {
            const [x, y, z] = quantumState.toCoordinates()
            const disposedMaterials = new Set<THREE.Material>()

            if (vectorRef.current) {
                const previousVector = vectorRef.current
                sceneRef.current.remove(previousVector)
                previousVector.traverse((object) => {
                    disposeObjectResources(object, disposedMaterials)
                })
            }

            const newVector = new THREE.ArrowHelper(
                new THREE.Vector3(x, y, z).normalize(),
                new THREE.Vector3(0, 0, 0),
                getVectorLength(x, y, z),
                0xff6b35,
                0.2,
                0.1,
            )

            vectorRef.current = newVector
            sceneRef.current.add(newVector)
        }
    }, [quantumState])

    const resetCamera = () => {
        if (cameraRef.current) {
            resetCameraPosition(cameraRef.current)
        }
    }

    return {
        mountRef,
        resetCamera,
    }
}
