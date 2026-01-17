// Rainbow Track - 3-lane curved track with jelly-like material
import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { useGameStore } from '../store/gameStore';

// Custom rainbow track shader material
const RainbowTrackMaterial = shaderMaterial(
  {
    uTime: 0,
    uSpeed: 1,
    uDistance: 0
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uDistance;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    // Rainbow color based on lane position
    vec3 getRainbowColor(float x) {
      // Left lane: red -> orange
      // Center lane: green -> cyan
      // Right lane: blue -> purple
      
      float normalizedX = (x + 1.0) * 0.5; // 0 to 1
      
      vec3 leftColor = mix(vec3(1.0, 0.2, 0.2), vec3(1.0, 0.6, 0.2), normalizedX * 3.0);
      vec3 centerColor = mix(vec3(0.2, 0.8, 0.4), vec3(0.2, 0.9, 0.9), normalizedX);
      vec3 rightColor = mix(vec3(0.3, 0.4, 1.0), vec3(0.7, 0.3, 0.9), (normalizedX - 0.66) * 3.0);
      
      if (normalizedX < 0.33) {
        return leftColor;
      } else if (normalizedX < 0.66) {
        return centerColor;
      } else {
        return rightColor;
      }
    }
    
    void main() {
      // Get rainbow color based on x position
      float laneX = vUv.x * 2.0 - 1.0;
      vec3 baseColor = getRainbowColor(laneX);
      
      // Scrolling effect
      float scroll = uDistance * 0.1;
      
      // Lane divider lines
      float laneLine1 = smoothstep(0.01, 0.0, abs(vUv.x - 0.333));
      float laneLine2 = smoothstep(0.01, 0.0, abs(vUv.x - 0.666));
      vec3 lineColor = vec3(1.0, 1.0, 1.0);
      
      // Emissive glow pulsing
      float pulse = 0.5 + 0.5 * sin(uTime * 2.0 + vUv.y * 10.0 - scroll);
      float emissive = 0.3 + pulse * 0.2;
      
      // Edge glow
      float edgeGlow = smoothstep(0.5, 0.0, abs(vUv.x - 0.5)) * 0.3;
      
      // Combine
      vec3 finalColor = baseColor * (0.6 + emissive);
      finalColor = mix(finalColor, lineColor, (laneLine1 + laneLine2) * 0.5);
      finalColor += edgeGlow;
      
      // Jelly-like translucency effect
      float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 1.0, 0.0))), 2.0);
      finalColor += fresnel * 0.2;
      
      // Alpha based on position for fade effect
      float alpha = 0.85 - fresnel * 0.2;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ RainbowTrackMaterial });

// Single track segment
function TrackSegment({ position, index }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const { distance, playerSpeed, gameState } = useGameStore();
  
  useFrame((state, delta) => {
    if (!materialRef.current) return;
    
    materialRef.current.uTime = state.clock.elapsedTime;
    materialRef.current.uDistance = distance;
    materialRef.current.uSpeed = playerSpeed;
  });
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[8, 30, 1, 1]} />
      <rainbowTrackMaterial
        ref={materialRef}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Track manager - infinite scrolling track
export function Track() {
  const groupRef = useRef();
  const { distance, gameState } = useGameStore();
  
  // Track segments
  const segmentLength = 30;
  const numSegments = 6;
  const segmentsRef = useRef([]);
  
  // Initialize segment positions
  useMemo(() => {
    for (let i = 0; i < numSegments; i++) {
      segmentsRef.current[i] = i * segmentLength;
    }
  }, []);
  
  useFrame(() => {
    if (gameState !== 'playing') return;
    
    // Recycle segments that go behind camera
    const playerZ = 0;
    const recycleThreshold = -segmentLength;
    const furthestZ = Math.max(...segmentsRef.current);
    
    for (let i = 0; i < numSegments; i++) {
      const segmentZ = segmentsRef.current[i] - (distance % (segmentLength * numSegments));
      
      if (segmentZ < recycleThreshold) {
        segmentsRef.current[i] += segmentLength * numSegments;
      }
    }
  });
  
  return (
    <group ref={groupRef}>
      {Array.from({ length: numSegments }).map((_, i) => (
        <TrackSegment
          key={i}
          position={[0, -0.5, i * segmentLength - 30]}
          index={i}
        />
      ))}
      
      {/* Track side walls/rails */}
      <TrackRails />
    </group>
  );
}

// Glowing side rails
function TrackRails() {
  const leftRailRef = useRef();
  const rightRailRef = useRef();
  const { distance } = useGameStore();
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Pulsing glow
    if (leftRailRef.current) {
      leftRailRef.current.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.2;
    }
    if (rightRailRef.current) {
      rightRailRef.current.material.emissiveIntensity = 0.5 + Math.sin(time * 2 + Math.PI) * 0.2;
    }
  });
  
  const railGeometry = useMemo(() => {
    return new THREE.BoxGeometry(0.2, 0.5, 200);
  }, []);
  
  return (
    <>
      <mesh
        ref={leftRailRef}
        position={[-4.2, -0.25, 70]}
        geometry={railGeometry}
      >
        <meshStandardMaterial
          color="#ff6b6b"
          emissive="#ff6b6b"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh
        ref={rightRailRef}
        position={[4.2, -0.25, 70]}
        geometry={railGeometry}
      >
        <meshStandardMaterial
          color="#9c27b0"
          emissive="#9c27b0"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
    </>
  );
}
