'use client'
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EdgesGeometry } from 'three';

const PolygonalSphere = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const sphereRef = useRef(null);
  const groupRef = useRef(null);
  const isDraggingRef = useRef(false);
  const mouseDownPositionRef = useRef({ x: 0, y: 0 });
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  const [selectedCoords, setSelectedCoords] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

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
    containerRef.current.appendChild(renderer.domElement);

    // Group setup
    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);

    // Create sphere with shaders
    const sphereGeometry = new THREE.IcosahedronGeometry(1, 2);
    const sphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 orange = vec3(1.0, 0.6, 0.0);
          vec3 red = vec3(1.0, 0.1, 0.0);
          gl_FragColor = vec4(mix(orange, red, intensity), 1.0);
        }
      `,
      flatShading: true,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereRef.current = sphere;
    group.add(sphere);

    // Add edges
    const edgesGeometry = new EdgesGeometry(sphereGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    edges.scale.setScalar(1.001);
    group.add(edges);

    // Add glow effect
    const glowGeometry = new THREE.IcosahedronGeometry(1.1, 2);
    const glowMaterial = new THREE.ShaderMaterial({
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

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Event handlers
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      edgesGeometry.dispose();
      edgesMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
    };
  }, []);



//   const RandomInputGenerator = () => {
//     // State to store our random inputs
//     const [inputs, setInputs] = useState({
//       peak_cs: 0,
//       total_counts: 0,
//       x_pos_asec: 0,
//       y_pos_asec: 0,
//       radial: 0,
//       active_region_ar: 0,
//       energy_low_ev: 0,
//       energy_high_ev: 0,
//       duration_s: 0 // This is our target variable
//     });
  
    // Function to generate random number within a range
    const getRandomNumber = (min, max, isInteger = true) => {
      const random = Math.random() * (max - min) + min;
      return isInteger ? Math.floor(random) : random;
    };


  const handleClick = async (event) => {

    // const response = await fetch(`http://localhost:5000/predict?planet_name=${planetName}`);
    // if (!response.ok) throw new Error('Failed to fetch prediction');
    // const data = await response.json();

    // console.log(data);



    if (!sphereRef.current || !cameraRef.current) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObject(sphereRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const SOLAR_RADIUS_ARCSEC = 959.63;
      const coords = {
        x_asec: Math.atan2(point.x, point.z) * SOLAR_RADIUS_ARCSEC,
        y_asec: Math.asin(point.y) * SOLAR_RADIUS_ARCSEC,
        distance: Math.sqrt(Math.atan2(point.x, point.z) * SOLAR_RADIUS_ARCSEC * Math.atan2(point.x, point.z) * SOLAR_RADIUS_ARCSEC
         + Math.asin(point.y) * SOLAR_RADIUS_ARCSEC * Math.asin(point.y) * SOLAR_RADIUS_ARCSEC),
         peak_cs: getRandomNumber(0, 1000),
         total_counts: getRandomNumber(0, 10000, false),
         active_region_ar: getRandomNumber(0, 5000),
         energy_low_ev: getRandomNumber(0, 1000),
         energy_high_ev: getRandomNumber(1000, 10000)
      };
      
      setSelectedCoords(coords);
      setIsLoading(true);

      try {
        const response = await fetch('http://localhost:3000/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(coords)
        });
        console.log(response);

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
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-screen" />
      
      {/* Fixed overlay for coordinates */}
      <div className="absolute top-0 left-0 w-full" style={{ zIndex: 1000 }}>
        {/* Dark gradient background */}
        <div className="w-full py-6" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)', }}>
          
          
          
          {selectedCoords ? (
            <div className="text-center">
              {/* Large coordinate display */}
              <div className="text-6xl text-white font-bold tracking-wider mb-2">
                <span className="mx-6">
                  X: {selectedCoords.x_asec.toFixed(1)}″
                </span>
                <span className="mx-6">
                  Y: {selectedCoords.y_asec.toFixed(1)}″
                </span>
                {/* <span className="mx-6">
                  RADIAL: {selectedCoords.distance.toFixed(1)}″
                </span> */}
                <span className="mx-6">
                  Duration: {selectedCoords.peak_cs.toFixed(1)}″
                </span>
                {/* <span className="mx-6">
                  Total Counts: {selectedCoords.total_counts.toFixed(1)}″
                </span>

                <span className="mx-6">
                  Active Region AR: {selectedCoords.active_region_ar.toFixed(1)}″
                </span>
                <span className="mx-6">
                  Energy Low Ev: {selectedCoords.energy_low_ev.toFixed(1)}″
                </span>
                <span className="mx-6">
                  Energy High Ev: {selectedCoords.energy_high_ev.toFixed(1)}″
                </span> */}
              </div>
              
              {/* Prediction or loading state */}
              {isLoading ? (
                <div className="text-3xl text-orange-300 mt-4">
                  Loading prediction...
                </div>
              ) : prediction ? (
                <div className="text-3xl text-orange-300 mt-4">
                  Prediction: {prediction}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-3xl text-white text-center opacity-75">
              Click on the sun to measure coordinates
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



export default PolygonalSphere;