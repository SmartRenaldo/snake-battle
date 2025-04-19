// src/components/StartScreen3DSnake.tsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";

interface StartScreen3DSnakeProps {
  width: number;
  height: number;
}

const StartScreen3DSnake: React.FC<StartScreen3DSnakeProps> = ({
  width,
  height,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set up scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Set up camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 20;

    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create snake parts
    const snakeParts: THREE.Mesh[] = [];
    const snakeLength = 20;
    const baseRadius = 0.8;
    const headRadius = 1.2;

    // Create head with special material
    const headGeometry = new THREE.SphereGeometry(headRadius, 24, 24);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      specular: 0x33ff33,
      shininess: 30,
      emissive: 0x003300,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.z = 0;
    snakeParts.push(head);
    scene.add(head);

    // Add eyes to head
    const eyeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.6, 0.6, 0.8);
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.6, 0.6, 0.8);
    head.add(rightEye);

    const leftPupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      pupilMaterial
    );
    leftPupil.position.z = 0.2;
    leftEye.add(leftPupil);

    const rightPupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      pupilMaterial
    );
    rightPupil.position.z = 0.2;
    rightEye.add(rightPupil);

    // Create snake body segments
    for (let i = 1; i < snakeLength; i++) {
      const segmentGeometry = new THREE.SphereGeometry(
        baseRadius * (1 - i / (snakeLength * 1.5)), // Gradually get smaller
        16,
        16
      );
      const segmentMaterial = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0x00aa00 : 0x008800,
        shininess: 20,
      });

      const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
      // Position will be set during animation
      snakeParts.push(segment);
      scene.add(segment);
    }

    // Animation settings
    let time = 0;
    const amplitude = 2; // How high the snake moves
    const frequency = 0.5; // How fast the snake waves
    const circleRadius = 10; // Radius of circular path
    const rotationSpeed = 0.3; // Speed of rotation around circle

    // Animation loop
    const animate = () => {
      time += 0.01;

      // Move head in a circle
      const angle = time * rotationSpeed;
      head.position.x = Math.cos(angle) * circleRadius;
      head.position.y = Math.sin(angle) * circleRadius;

      // Make head look in the direction of movement
      head.lookAt(
        Math.cos(angle + 0.1) * circleRadius,
        Math.sin(angle + 0.1) * circleRadius,
        0
      );

      // Make body follow head with wave motion
      for (let i = 1; i < snakeParts.length; i++) {
        const segment = snakeParts[i];
        const prevSegment = snakeParts[i - 1];

        // Create a wave effect with sine function
        const waveOffset = i * 0.2; // Distance between segments
        const waveTime = time - waveOffset;

        // Calculate position as offset from previous segment
        segment.position.x =
          prevSegment.position.x - Math.cos(angle - waveOffset) * 1.1;
        segment.position.y =
          prevSegment.position.y - Math.sin(angle - waveOffset) * 1.1;

        // Add vertical wave movement
        segment.position.z =
          Math.sin(waveTime * frequency) * amplitude * (1 - i / snakeLength);
      }

      // Rotate scene slightly for dynamic view
      scene.rotation.z = Math.sin(time * 0.1) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        pointerEvents: "none", // Allow clicks to pass through to the canvas
      }}
    />
  );
};

export default StartScreen3DSnake;
