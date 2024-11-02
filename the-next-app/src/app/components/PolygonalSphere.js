
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EdgesGeometry } from 'three';

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    vec3 orange = vec3(1.0, 0.6, 0.0);
    vec3 red = vec3(1.0, 0.1, 0.0);
    gl_FragColor = vec4(mix(orange, red, intensity), 1.0);
  }
`;

const PolygonalSphere = () => {
  // All state declarations at the top
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // All refs
  const mountRef = useRef(null);
  const sphereRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const groupRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const mouseDownPositionRef = useRef({ x: 0, y: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Handler functions defined outside useEffect
  const handleClick = async (event) => {
    if (!sphereRef.current || !cameraRef.current) return;

    mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(sphereRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const SOLAR_RADIUS_ARCSEC = 959.63;
      const coords = {
        x_asec: Math.atan2(point.x, point.z) * SOLAR_RADIUS_ARCSEC,
        y_asec: Math.asin(point.y) * SOLAR_RADIUS_ARCSEC
      };
      
      setSelectedCoords(coords);
      setIsLoading(true);

      try {
        const response = await fetch('/api/solar-coordinates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            x_asec: coords.x_asec.toFixed(2),
            y_asec: coords.y_asec.toFixed(2)
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setPrediction(data.prediction);
      } catch (error) {
        console.error('Error:', error);
        setPrediction(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMouseDown = (event) => {
    isDraggingRef.current = false;
    mouseDownPositionRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    previousMousePositionRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleMouseMove = (event) => {
    if (!groupRef.current) return;

    const deltaX = event.clientX - mouseDownPositionRef.current.x;
    const deltaY = event.clientY - mouseDownPositionRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 5) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      const deltaMove = {
        x: event.clientX - previousMousePositionRef.current.x,
        y: event.clientY - previousMousePositionRef.current.y,
      };

      groupRef.current.rotation.y += deltaMove.x * 0.005;
      groupRef.current.rotation.x += deltaMove.y * 0.005;

      previousMousePositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    }
  };

  const handleMouseUp = (event) => {
    if (!isDraggingRef.current) {
      handleClick(event);
    }
    isDraggingRef.current = false;
  };

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 2;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Group setup
    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);

    // Create sphere
    const sphereGeometry = new THREE.IcosahedronGeometry(1, 2);
    const sphereMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader,
      fragmentShader,
      flatShading: true,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereRef.current = sphere;
    group.add(sphere);

    // Create edges
    const edgesGeometry = new EdgesGeometry(sphereGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ 
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    edges.scale.setScalar(1.001);
    group.add(edges);

    // Add glow
    const glowGeometry = new THREE.IcosahedronGeometry(1.1, 2);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        void main() {
          gl_FragColor = vec4(1.0, 0.5, 0.0, 0.1);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Event listeners
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      mountRef.current?.removeChild(renderer.domElement);
      
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      edgesGeometry.dispose();
      edgesMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={mountRef} className="w-full h-screen" />
      
      <div className="fixed top-0 left-0 right-0 z-10">
        <div className="flex justify-center items-center h-32 bg-gradient-to-b from-black to-transparent">
          {selectedCoords ? (
            <div className="text-center">
              <div className="text-5xl text-white font-bold tracking-wider">
                <span className="px-6">
                  X: {selectedCoords.x_asec.toFixed(1)}″
                </span>
                <span className="px-6">
                  Y: {selectedCoords.y_asec.toFixed(1)}″
                </span>
              </div>
              {isLoading ? (
                <div className="text-2xl text-orange-300 mt-2">
                  Loading prediction...
                </div>
              ) : prediction ? (
                <div className="text-2xl text-orange-300 mt-2">
                  Prediction: {prediction}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-2xl text-white opacity-50">
              Click on the sun to measure coordinates
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolygonalSphere;