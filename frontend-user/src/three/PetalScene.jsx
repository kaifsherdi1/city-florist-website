import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PALETTE = ['#9e1b32', '#b3263e', '#d9707e', '#eab3b5', '#f4e7da', '#d8b47a'];

/** A rose-petal outline, bent into a soft cup so light rolls across it. */
function usePetalGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.5);
    s.bezierCurveTo(0.45, -0.35, 0.55, 0.25, 0.28, 0.48);
    s.bezierCurveTo(0.12, 0.6, -0.12, 0.6, -0.28, 0.48);
    s.bezierCurveTo(-0.55, 0.25, -0.45, -0.35, 0, -0.5);
    const geo = new THREE.ShapeGeometry(s, 24);
    // Cup the petal by pushing vertices back toward the edges and tip.
    const tess = geo.toNonIndexed();
    const pos = tess.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, x * x * 0.9 + (y + 0.5) * (y + 0.5) * 0.18);
    }
    tess.computeVertexNormals();
    geo.dispose();
    return tess;
  }, []);
}

function Petals({ count, scroll, pointer }) {
  const mesh = useRef(null);
  const geometry = usePetalGeometry();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const petals = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: THREE.MathUtils.randFloatSpread(14),
        y: THREE.MathUtils.randFloatSpread(10),
        z: THREE.MathUtils.randFloat(-6, 2.5),
        s: THREE.MathUtils.randFloat(0.22, 0.5),
        speed: THREE.MathUtils.randFloat(0.18, 0.45),
        sway: THREE.MathUtils.randFloat(0.4, 1.2),
        phase: Math.random() * Math.PI * 2,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        spin: THREE.MathUtils.randFloat(0.2, 0.8) * (Math.random() > 0.5 ? 1 : -1),
      })),
    [count]
  );

  useEffect(() => {
    const color = new THREE.Color();
    petals.forEach((_, i) => {
      color.set(PALETTE[i % PALETTE.length]);
      mesh.current.setColorAt(i, color);
    });
    mesh.current.instanceColor.needsUpdate = true;
  }, [petals]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const sc = scroll.current;
    petals.forEach((p, i) => {
      p.y -= p.speed * dt * (1 + sc * 3);
      if (p.y < -6) {
        p.y = 6;
        p.x = THREE.MathUtils.randFloatSpread(14);
      }
      dummy.position.set(p.x + Math.sin(t * p.sway + p.phase) * 0.6, p.y, p.z + sc * 4);
      dummy.rotation.set(p.rx + t * p.spin, p.ry + t * p.spin * 0.7, Math.sin(t * 0.5 + p.phase) * 0.6);
      dummy.scale.setScalar(p.s);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;

    // Gentle parallax toward the pointer.
    const g = mesh.current.parent;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, pointer.current.x * 0.15, 0.04);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.current.y * 0.1, 0.04);
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, count]} frustumCulled={false}>
      <meshPhysicalMaterial
        side={THREE.DoubleSide}
        roughness={0.55}
        sheen={1}
        sheenRoughness={0.4}
        sheenColor="#ffd6dc"
        clearcoat={0.15}
        transmission={0}
      />
    </instancedMesh>
  );
}

/** Soft, twinkling gold dust drifting upward. */
function GoldDust({ count }) {
  const points = useRef(null);
  const { positions, seeds, texture } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = THREE.MathUtils.randFloatSpread(14);
      positions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(9);
      positions[i * 3 + 2] = THREE.MathUtils.randFloat(-4, 3);
      seeds[i] = Math.random() * 10;
    }
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,240,210,1)');
    grad.addColorStop(0.25, 'rgba(226,201,154,0.8)');
    grad.addColorStop(1, 'rgba(226,201,154,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return { positions, seeds, texture: new THREE.CanvasTexture(c) };
  }, [count]);

  useFrame((state, delta) => {
    const pos = points.current.geometry.attributes.position;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + Math.min(delta, 0.05) * (0.12 + (seeds[i] % 1) * 0.2);
      if (y > 5) y = -5;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.6 + seeds[i]) * 0.002);
    }
    pos.needsUpdate = true;
    points.current.material.opacity = 0.65 + Math.sin(t * 1.5) * 0.15;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.12}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#e2c99a"
      />
    </points>
  );
}

function CameraRig({ scroll }) {
  useFrame(({ camera }) => {
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 8 - scroll.current * 3, 0.08);
  });
  return null;
}

export default function PetalScene({ scroll }) {
  const holder = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [visible, setVisible] = useState(true);
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (holder.current) io.observe(holder.current);
    return () => {
      window.removeEventListener('pointermove', onMove);
      io.disconnect();
    };
  }, []);

  return (
    <div className="petal-canvas" ref={holder} aria-hidden="true">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, mobile ? 1.5 : 1.75]}
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <fog attach="fog" args={['#14181f', 7, 17]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} color="#ffe9cf" />
        <pointLight position={[-5, -2, 3]} intensity={18} color="#c9a96e" distance={14} />
        <group>
          <Petals count={mobile ? 38 : 85} scroll={scroll} pointer={pointer} />
        </group>
        <GoldDust count={mobile ? 60 : 140} />
        <CameraRig scroll={scroll} />
      </Canvas>
    </div>
  );
}
