import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { Play, ShieldAlert, Cpu, ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react";

interface ThreeViewerProps {
  modelUrl?: string; // If present, loads a real 3D model instead of the procedurally generated ones!
  meshType: "vase" | "mug" | "rocket" | "creative_fox" | "gear";
  geometryStyle: "organic" | "cylindrical" | "boxy" | "smooth" | "mechanical";
  modelColor: string;
  scale: number;
  rotation: { x: number; y: number; z: number };
  smoothing: number; // 0 to 3
  detailsLevel: number; // 0 to 100
  wireframe: boolean;
  showTexture: boolean;
  lightIntensity: number;
  lightColor: string;
  artifactsRemoved: boolean;
  repaired: boolean;
  gridVisible: boolean;
  printerBedVisible: boolean;
  onExport: (format: string, objBlob: Blob) => void;
}

export default function ThreeViewer({
  modelUrl,
  meshType,
  geometryStyle,
  modelColor,
  scale,
  rotation,
  smoothing,
  detailsLevel,
  wireframe,
  showTexture,
  lightIntensity,
  lightColor,
  artifactsRemoved,
  repaired,
  gridVisible,
  printerBedVisible,
  onExport,
}: ThreeViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<any>(null);
  const meshGroupRef = useRef<THREE.Group>(null);
  const artifactsGroupRef = useRef<THREE.Group>(null);
  const repairIndicatorRef = useRef<THREE.Mesh>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Expose an imperative download method
  const handleGenerateAndExportFile = (format: string) => {
    if (!meshGroupRef.current) return;

    // Build OBJ file contents procedurally
    let objText = `# PhotoTo3D AI Generator\n# Exported in format: ${format}\n# Object Type: ${meshType}\n# Scale: ${scale}\n`;
    let vertexOffset = 1;

    // Traverse all meshes in the group
    meshGroupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry;
        
        // Ensure we have access to position attributes
        const positionAttr = geometry.getAttribute("position");
        if (!positionAttr) return;

        // Apply child's local transform matrices
        child.updateMatrixWorld(true);
        const matrix = child.matrixWorld;

        // Append vertices
        for (let i = 0; i < positionAttr.count; i++) {
          const v = new THREE.Vector3(
            positionAttr.getX(i),
            positionAttr.getY(i),
            positionAttr.getZ(i)
          );
          v.applyMatrix4(matrix);
          objText += `v ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}\n`;
        }

        // Append faces (assuming triangles)
        const indexAttr = geometry.getIndex();
        if (indexAttr) {
          for (let i = 0; i < indexAttr.count; i += 3) {
            const a = indexAttr.getX(i) + vertexOffset;
            const b = indexAttr.getX(i + 1) + vertexOffset;
            const c = indexAttr.getX(i + 2) + vertexOffset;
            objText += `f ${a} ${b} ${c}\n`;
          }
        } else {
          for (let i = 0; i < positionAttr.count; i += 3) {
            const a = i + vertexOffset;
            const b = i + 1 + vertexOffset;
            const c = i + 2 + vertexOffset;
            objText += `f ${a} ${b} ${c}\n`;
          }
        }
        vertexOffset += positionAttr.count;
      }
    });

    const blob = new Blob([objText], { type: "text/plain" });
    onExport(format, blob);
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent or managed by CSS

    // 2. Camera Setup
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 5, 12);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Clear previous canvasses if any
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't go deep under floor
    controls.minDistance = 3;
    controls.maxDistance = 25;
    orbitRef.current = controls;

    // 5. Lighting Setup
    // Key directional light casting shadows
    const dirLight = new THREE.DirectionalLight(lightColor, 1.5);
    dirLight.position.set(5, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -6;
    scene.add(dirLight);

    // Dynamic accent light
    const pointLight = new THREE.PointLight(modelColor, 1.0, 15);
    pointLight.position.set(-6, 3, -4);
    scene.add(pointLight);

    // Ambient fill light
    const ambientLight = new THREE.AmbientLight("#475569", 0.6);
    scene.add(ambientLight);

    // 6. Print Bed Grid Help
    const gridHelper = new THREE.GridHelper(10, 20, "#6366f1", "#334155");
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    // Plate cylinder representation
    const bedGeo = new THREE.CylinderGeometry(5.2, 5.2, 0.1, 40);
    const bedMat = new THREE.MeshStandardMaterial({
      color: "#1e1e2f",
      roughness: 0.8,
      metalness: 0.6,
      transparent: true,
      opacity: 0.15,
    });
    const bedPlate = new THREE.Mesh(bedGeo, bedMat);
    bedPlate.position.y = -4.05;
    bedPlate.receiveShadow = true;
    scene.add(bedPlate);

    // Inner bounding box boundary indicator
    const boundsGeo = new THREE.BoxGeometry(7, 7, 7);
    const boundsEdges = new THREE.EdgesGeometry(boundsGeo);
    const boundsLine = new THREE.LineSegments(
      boundsEdges,
      new THREE.LineBasicMaterial({ color: "#f43f5e", transparent: true, opacity: 0.12 })
    );
    boundsLine.position.y = -0.5;
    scene.add(boundsLine);

    // 7. Base Objects Groups
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    const artifactsGroup = new THREE.Group();
    scene.add(artifactsGroup);
    artifactsGroupRef.current = artifactsGroup;

    // Glow indicator when repairing or fragile
    const ringGeo = new THREE.RingGeometry(3.5, 3.6, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: "#2ecc71",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const repairIndicator = new THREE.Mesh(ringGeo, ringMat);
    repairIndicator.rotation.x = Math.PI / 2;
    repairIndicator.position.y = -3.9;
    scene.add(repairIndicator);
    repairIndicatorRef.current = repairIndicator;

    // 8. Generate Procedural Model Content or Load Real model from URL
    const rebuildModelGrip = () => {
      // Clear previous shapes
      while (meshGroup.children.length > 0) {
        meshGroup.remove(meshGroup.children[0]);
      }

      if (modelUrl) {
        console.log("Loading real tridimensional model from URL:", modelUrl);
        const isGlb = modelUrl.endsWith(".glb") || modelUrl.includes("glb") || modelUrl.includes("gltf");
        if (isGlb) {
          const loader = new GLTFLoader();
          loader.load(
            modelUrl,
            (gltf) => {
              const loadedMesh = gltf.scene;

              // Apply correct scale, orientation, lighting, and position so it fits beautifully
              const box = new THREE.Box3().setFromObject(loadedMesh);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());

              const maxDim = Math.max(size.x, size.y, size.z);
              const targetSize = 4.8;
              const scaleFactor = targetSize / (maxDim || 1);
              loadedMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

              loadedMesh.position.x = -center.x * scaleFactor;
              loadedMesh.position.y = -center.y * scaleFactor - 1.5; // position nicely above print bed
              loadedMesh.position.z = -center.z * scaleFactor;

              loadedMesh.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                  
                  if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach((mat) => {
                      if ("wireframe" in mat) {
                        mat.wireframe = wireframe;
                      }
                      if (!showTexture && "color" in mat && typeof mat.color.set === "function") {
                        mat.color.set(modelColor);
                      }
                    });
                  }
                }
              });

              meshGroup.add(loadedMesh);
              console.log("GLB Model loaded successfully!");
            },
            undefined,
            (error) => {
              console.error("Error loading GLB real model from backend, using basic procedural representation:", error);
            }
          );
        } else {
          // OBJ file load
          const loader = new OBJLoader();
          loader.load(
            modelUrl,
            (obj) => {
              const box = new THREE.Box3().setFromObject(obj);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());

              const maxDim = Math.max(size.x, size.y, size.z);
              const targetSize = 4.8;
              const scaleFactor = targetSize / (maxDim || 1);
              obj.scale.set(scaleFactor, scaleFactor, scaleFactor);

              obj.position.x = -center.x * scaleFactor;
              obj.position.y = -center.y * scaleFactor - 1.5;
              obj.position.z = -center.z * scaleFactor;

              obj.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                  
                  if (!showTexture) {
                    child.material = new THREE.MeshStandardMaterial({
                      color: modelColor,
                      roughness: 0.18,
                      metalness: 0.75,
                      wireframe: wireframe,
                    });
                  } else {
                    child.material = new THREE.MeshStandardMaterial({
                      color: modelColor,
                      roughness: 0.3,
                      metalness: 0.1,
                      wireframe: wireframe,
                    });
                  }
                }
              });

              meshGroup.add(obj);
              console.log("OBJ Model loaded successfully!");
            },
            undefined,
            (error) => {
              console.error("Error loading OBJ real model from backend, using basic procedural representation:", error);
            }
          );
        }
        return;
      }

      // Material formulation
      let material;
      if (showTexture) {
        // High fidelity procedural grid lines texture
        const size = 512;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Fill gradient base matching colors
          ctx.fillStyle = modelColor;
          ctx.fillRect(0, 0, size, size);
          // Draw high tech printing layers grid
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 4;
          for (let i = 0; i < size; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, size);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(size, i);
            ctx.stroke();
          }
          // Highlight nodes
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          for (let x = 0; x <= size; x += 32) {
            for (let y = 0; y <= size; y += 32) {
              ctx.fillRect(x - 3, y - 3, 6, 6);
            }
          }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);

        material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.3,
          metalness: 0.1,
          wireframe: wireframe,
        });
      } else {
        // Premium metallic look
        material = new THREE.MeshStandardMaterial({
          color: modelColor,
          roughness: 0.18,
          metalness: 0.75,
          wireframe: wireframe,
        });
      }

      // 9. Different Mesh Types Configurations
      if (meshType === "vase") {
        // Designer Vase
        const points = [];
        const segments = 16 + smoothing * 16;
        for (let i = 0; i < 20; i++) {
          const t = i / 19;
          // Spline mathematically shaped with custom details
          const r =
            1.8 +
            Math.sin(t * Math.PI * 2.5) * 0.9 +
            Math.sin(t * Math.PI * 0.8) * 0.4 +
            (detailsLevel / 230) * Math.sin(t * Math.PI * 15) * 0.15;
          points.push(new THREE.Vector2(r, i * 0.38 - 3.8));
        }
        const geo = new THREE.LatheGeometry(points, segments);
        const mesh = new THREE.Mesh(geo, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        meshGroup.add(mesh);

      } else if (meshType === "mug") {
        // Futuristic Mug with full geometry
        const bodyGeo = new THREE.CylinderGeometry(2.1, 1.9, 4.2, 24 + smoothing * 8);
        const bodyMesh = new THREE.Mesh(bodyGeo, material);
        bodyMesh.position.y = -1.7;
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        meshGroup.add(bodyMesh);

        // Core top inner shadow to fake hollow
        const innerGeo = new THREE.CylinderGeometry(1.92, 1.8, 0.4, 24 + smoothing * 8);
        const darkMaterial = new THREE.MeshStandardMaterial({
          color: "#111116",
          roughness: 0.9,
          wireframe: wireframe
        });
        const innerMesh = new THREE.Mesh(innerGeo, darkMaterial);
        innerMesh.position.y = 0.38;
        meshGroup.add(innerMesh);

        // Solid handle
        const handleGeo = new THREE.TorusGeometry(1.3, 0.28, 12 + smoothing * 4, 24 + smoothing * 8);
        const handleMesh = new THREE.Mesh(handleGeo, material);
        handleMesh.position.set(1.7, -1.7, 0);
        handleMesh.rotation.y = Math.PI / 2;
        handleMesh.castShadow = true;
        meshGroup.add(handleMesh);

      } else if (meshType === "rocket") {
        // Low Poly / Smooth retro rocket
        const cylinderSegments = 16 + smoothing * 8;
        
        // Rocket Main Cabin
        const bodyGeo = new THREE.CylinderGeometry(1.2, 1.2, 3.8, cylinderSegments);
        const bodyMesh = new THREE.Mesh(bodyGeo, material);
        bodyMesh.position.y = -1.2;
        bodyMesh.castShadow = true;
        meshGroup.add(bodyMesh);

        // Nose Cone
        const tipGeo = new THREE.ConeGeometry(1.2, 2.0, cylinderSegments);
        const tipMesh = new THREE.Mesh(tipGeo, material);
        tipMesh.position.y = 1.7;
        tipMesh.castShadow = true;
        meshGroup.add(tipMesh);

        // Wing parts
        for (let i = 0; i < 3; i++) {
          const wingGeom = new THREE.BoxGeometry(0.18, 1.6, 1.1);
          // Apply custom detail vertex offset
          const wing = new THREE.Mesh(wingGeom, material);
          const angle = (i * Math.PI * 2) / 3;
          wing.position.set(Math.cos(angle) * 1.2, -2.4, Math.sin(angle) * 1.2);
          wing.rotation.y = -angle;
          wing.rotation.z = -0.3;
          wing.castShadow = true;
          meshGroup.add(wing);
        }

        // Exhaust exhaust plume base
        const fireGeo = new THREE.ConeGeometry(0.7, 1.2, cylinderSegments);
        const fireMat = new THREE.MeshStandardMaterial({
          color: "#ff5722",
          emissive: "#ff3300",
          roughness: 0.1,
          wireframe: wireframe
        });
        const fireMesh = new THREE.Mesh(fireGeo, fireMat);
        fireMesh.position.y = -3.5;
        fireMesh.rotation.x = Math.PI;
        meshGroup.add(fireMesh);

      } else if (meshType === "creative_fox") {
        // Polyhedron styled Zen Fox
        const detailSubdiv = Math.min(smoothing, 2);

        // Solid low poly head
        const headGeo = new THREE.DodecahedronGeometry(1.1, detailSubdiv);
        const head = new THREE.Mesh(headGeo, material);
        head.position.set(0, 0.4, 0.3);
        head.castShadow = true;
        meshGroup.add(head);

        // Snout
        const muzzleGeo = new THREE.ConeGeometry(0.40, 1.1, 4);
        const muzzle = new THREE.Mesh(muzzleGeo, material);
        muzzle.rotation.x = Math.PI / 2.3;
        muzzle.position.set(0, 0.2, 1.3);
        muzzle.castShadow = true;
        meshGroup.add(muzzle);

        // Left Ear
        const leftEarGeo = new THREE.ConeGeometry(0.32, 0.9, 4);
        const leftEar = new THREE.Mesh(leftEarGeo, material);
        leftEar.position.set(-0.5, 1.3, -0.1);
        leftEar.rotation.z = 0.3;
        leftEar.rotation.y = 0.1;
        leftEar.castShadow = true;
        meshGroup.add(leftEar);

        // Right Ear
        const rightEarGeo = new THREE.ConeGeometry(0.32, 0.9, 4);
        const rightEar = new THREE.Mesh(rightEarGeo, material);
        rightEar.position.set(0.5, 1.3, -0.1);
        rightEar.rotation.z = -0.3;
        rightEar.rotation.y = -0.1;
        rightEar.castShadow = true;
        meshGroup.add(rightEar);

        // Sitting Torso
        const torsoGeo = new THREE.CylinderGeometry(0.9, 1.5, 3.1, 6 + smoothing * 3);
        const torso = new THREE.Mesh(torsoGeo, material);
        torso.position.set(0, -1.8, -0.1);
        torso.castShadow = true;
        meshGroup.add(torso);

        // Elegant geometric tail
        const tailGeo = new THREE.ConeGeometry(0.55, 1.9, 4);
        const tail = new THREE.Mesh(tailGeo, material);
        tail.position.set(0, -2.2, -1.3);
        tail.rotation.x = -Math.PI / 4;
        tail.castShadow = true;
        meshGroup.add(tail);

      } else if (meshType === "gear") {
        // High fidelity solid technical gear
        const resolution = 20 + smoothing * 12;
        const gearGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.9, resolution);
        const gearMesh = new THREE.Mesh(gearGeo, material);
        gearMesh.position.y = -1.6;
        gearMesh.castShadow = true;
        gearMesh.receiveShadow = true;
        meshGroup.add(gearMesh);

        // Dynamic Teeth (12 of them)
        const teethCount = 12;
        for (let i = 0; i < teethCount; i++) {
          const toothGeo = new THREE.BoxGeometry(0.68, 1.0, 0.75);
          const tooth = new THREE.Mesh(toothGeo, material);
          const angle = (i * Math.PI * 2) / teethCount;
          tooth.position.set(Math.cos(angle) * 2.5, -1.6, Math.sin(angle) * 2.5);
          tooth.rotation.y = -angle;
          tooth.castShadow = true;
          meshGroup.add(tooth);
        }

        // Center shaft axis solid
        const axGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.3, 12);
        const axle = new THREE.Mesh(axGeo, material);
        axle.position.y = -1.6;
        meshGroup.add(axle);

        // Draw deep inner ring hole to look industrial
        const holeGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.35, 12);
        const darkMaterial = new THREE.MeshStandardMaterial({
          color: "#0d0d11",
          roughness: 0.9,
          wireframe: wireframe
        });
        const axleHole = new THREE.Mesh(holeGeo, darkMaterial);
        axleHole.position.y = -1.6;
        meshGroup.add(axleHole);
      }

      // Apply dynamic detail displacements based on details level slider (micro displacements)
      meshGroup.traverse((node) => {
        if (node instanceof THREE.Mesh && node.geometry) {
          const geom = node.geometry;
          const pos = geom.getAttribute("position");
          if (pos && detailsLevel > 30 && meshType !== "creative_fox") {
            // Apply subtle procedural noise to vertices
            for (let i = 0; i < pos.count; i++) {
              const x = pos.getX(i);
              const y = pos.getY(i);
              const z = pos.getZ(i);

              // Pseudo-noise factor
              const factor = (detailsLevel / 1600) * Math.sin(y * 8) * Math.sin(x * 6);
              pos.setX(i, x + factor * (x / 2.5));
              pos.setZ(i, z + factor * (z / 2.5));
            }
            geom.computeVertexNormals();
            pos.needsUpdate = true;
          }
        }
      });
    };

    rebuildModelGrip();

    // 10. Generate Satellite Artifacts (if not removed)
    const rebuildArtifacts = () => {
      while (artifactsGroup.children.length > 0) {
        artifactsGroup.remove(artifactsGroup.children[0]);
      }

      if (!artifactsRemoved) {
        // Spawn 4 tiny floating spheres orbits
        const artMaterial = new THREE.MeshStandardMaterial({
          color: "#ff5722",
          roughness: 0.6,
          emissive: "#dd3300",
        });

        for (let i = 0; i < 4; i++) {
          const sphereGeo = new THREE.SphereGeometry(0.12, 6, 6);
          const s = new THREE.Mesh(sphereGeo, artMaterial);
          // Distribute in sphere coordinates
          const theta = (i * Math.PI) / 2;
          s.position.set(Math.cos(theta) * 3.4, -2.5 + i * 0.8, Math.sin(theta) * 3.4);
          artifactsGroup.add(s);
        }
      }
    };

    rebuildArtifacts();

    // 11. Helper visibility switches
    gridHelper.visible = gridVisible;
    bedPlate.visible = printerBedVisible;

    // 12. Animation loop
    let animeFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animeFrameId = requestAnimationFrame(animate);

      // Automatic slow rotation
      if (meshGroup) {
        // Base mesh transformations from parent prop
        meshGroup.scale.set(scale, scale, scale);
        meshGroup.rotation.x = rotation.x;
        meshGroup.rotation.y = rotation.y + clock.getElapsedTime() * 0.15; // Slow ambient spin
        meshGroup.rotation.z = rotation.z;
      }

      // Rotate and drift floating artifacts around
      if (artifactsGroup && !artifactsRemoved) {
        artifactsGroup.rotation.y = clock.getElapsedTime() * 0.5;
        artifactsGroup.children.forEach((child, index) => {
          child.position.y += Math.sin(clock.getElapsedTime() * 2 + index) * 0.004;
        });
      }

      // Handle repair scan glow effects
      if (repairIndicator) {
        if (repaired) {
          repairIndicator.material.color.set("#2ecc71");
          repairIndicator.position.y = -3.9 + Math.sin(clock.getElapsedTime() * 3.2) * 1.5;
          repairIndicator.material.opacity = Math.max(0, 0.8 - (repairIndicator.position.y + 4) / 4);
        } else {
          repairIndicator.material.opacity = 0;
        }
      }

      // Update lights intensity dynamically
      dirLight.intensity = lightIntensity;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 13. Window Re-sizing with ResizeObserver (Strict Compliance with Canvas rules!)
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const newWidth = entry.contentRect.width;
      const newHeight = entry.contentRect.height;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    });

    resizeObserver.observe(mountRef.current);

    // Expose local file trigger to window so parent can trigger custom button exports
    (window as any)._photoTo3D_exportTrigger = handleGenerateAndExportFile;

    // Cleanup
    return () => {
      cancelAnimationFrame(animeFrameId);
      resizeObserver.disconnect();
      if (mountRef.current) {
        mountRef.current.innerHTML = "";
      }
      controls.dispose();
      renderer.dispose();
      delete (window as any)._photoTo3D_exportTrigger;
    };
  }, [
    modelUrl,
    meshType,
    geometryStyle,
    modelColor,
    scale,
    rotation,
    smoothing,
    detailsLevel,
    wireframe,
    showTexture,
    lightIntensity,
    lightColor,
    artifactsRemoved,
    repaired,
    gridVisible,
    printerBedVisible,
  ]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!mountRef.current) return;
    if (!document.fullscreenElement) {
      mountRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.error(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(err => console.error(err));
    }
  };

  const handleZoom = (direction: "in" | "out") => {
    if (!orbitRef.current) return;
    const offset = direction === "in" ? 0.85 : 1.15;
    orbitRef.current.object.position.multiplyScalar(offset);
    orbitRef.current.update();
  };

  const resetCamera = () => {
    if (!orbitRef.current) return;
    orbitRef.current.object.position.set(0, 5, 12);
    orbitRef.current.target.set(0, 0, 0);
    orbitRef.current.update();
  };

  return (
    <div className="relative w-full h-full bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden flex flex-col group/viewer">
      {/* 3D Print Stage Grid Header Label */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-full text-[11px] font-mono font-medium tracking-tight text-indigo-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>VISUALIZADOR REAL-TIME THREE.JS</span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center space-x-1.5">
        <button
          onClick={() => handleZoom("in")}
          className="p-1.5 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
          title="Zoom +"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => handleZoom("out")}
          className="p-1.5 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
          title="Zoom -"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={resetCamera}
          className="p-1.5 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
          title="Resetar Câmera"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
          title="Tela Cheia"
        >
          <Maximize size={14} />
        </button>
      </div>

      {/* The Actual Canvas element container */}
      <div id="three-canvas-mount" ref={mountRef} className="w-full flex-1 min-h-[300px] cursor-grab active:cursor-grabbing outline-none" />

      {/* Control instructions overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none text-[11px] font-mono text-slate-500 bg-slate-950/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800/40">
        <span className="hidden sm:inline">Botão Esquerdo: Rotacionar • Scroll: Zoom • Botão Direito: Pan</span>
        <span className="sm:hidden">Toque / Arrume para navegar o objeto 3D</span>
        <span>Polígonos: ~{(15000 + (smoothing * 3000) + (detailsLevel * 90)).toLocaleString()}</span>
      </div>
    </div>
  );
}
