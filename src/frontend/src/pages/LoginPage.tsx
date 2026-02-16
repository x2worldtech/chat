import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

function Globe() {
  const globeRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.002;
    }
  });
  
  return (
    <Sphere ref={globeRef} args={[2.5, 64, 64]} rotation={[0, 0, 0.1]}>
      <meshStandardMaterial
        color="#ffffff"
        wireframe
        wireframeLinewidth={1}
      />
    </Sphere>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      <Globe />
    </>
  );
}

function AnimatedText() {
  const originalText = 'Secure Chat';
  const [displayText, setDisplayText] = useState(originalText);
  const [isSecuring, setIsSecuring] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const textLength = originalText.length;
        
        if (isSecuring) {
          // Replace letters with asterisks one by one
          if (prevIndex < textLength) {
            const newText = originalText
              .split('')
              .map((char, idx) => {
                if (idx <= prevIndex) {
                  return char === ' ' ? ' ' : '*';
                }
                return char;
              })
              .join('');
            setDisplayText(newText);
            return prevIndex + 1;
          } else {
            // Pause briefly when fully secured, then start revealing
            setTimeout(() => setIsSecuring(false), 800);
            return prevIndex;
          }
        } else {
          // Reveal letters one by one
          if (prevIndex > 0) {
            const newText = originalText
              .split('')
              .map((char, idx) => {
                if (idx < textLength - prevIndex) {
                  return char;
                }
                return char === ' ' ? ' ' : '*';
              })
              .join('');
            setDisplayText(newText);
            return prevIndex - 1;
          } else {
            // Pause briefly when fully revealed, then start securing again
            setTimeout(() => setIsSecuring(true), 1500);
            setDisplayText(originalText);
            return 0;
          }
        }
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isSecuring, originalText]);

  return (
    <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight font-mono">
      {displayText}
    </h1>
  );
}

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="login-page-container">
      {/* 3D Globe Background */}
      <div className="globe-background">
        <Canvas
          camera={{ position: [0, 0, 12], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
            minPolarAngle={Math.PI / 2}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
      </div>

      {/* Login Content */}
      <div className="login-content">
        <div className="flex flex-col items-center gap-8">
          <AnimatedText />
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="px-8 py-6 text-lg font-medium"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Logging in...
              </>
            ) : (
              'Sign in with Internet Identity'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
