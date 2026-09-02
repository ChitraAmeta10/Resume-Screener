import { useEffect, useRef } from "react";
import * as THREE from "three";

function createResumeTexture(candidateName: string, role: string, score: string, skills: string[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 700;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background Card
  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.roundRect(0, 0, 512, 700, 24);
  ctx.fill();

  // Glass Border
  ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
  ctx.lineWidth = 4;
  ctx.roundRect(2, 2, 508, 696, 24);
  ctx.stroke();

  // Top Header Bar
  ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
  ctx.roundRect(24, 24, 464, 90, 16);
  ctx.fill();

  // Avatar Circle
  ctx.fillStyle = "#38BDF8";
  ctx.beginPath();
  ctx.arc(68, 69, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0B0F19";
  ctx.font = "bold 24px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(candidateName.slice(0, 2).toUpperCase(), 68, 77);

  // Name & Role
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 24px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(candidateName, 112, 58);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "16px Inter, sans-serif";
  ctx.fillText(role, 112, 86);

  // Score Pill
  ctx.fillStyle = "#10B981";
  ctx.roundRect(390, 44, 82, 38, 10);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "center";
  ctx.fillText(score, 431, 69);

  // Skills Row
  let chipX = 24;
  skills.forEach((skill) => {
    ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
    ctx.roundRect(chipX, 134, 100, 32, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#BAE6FD";
    ctx.font = "600 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(skill, chipX + 50, 155);
    chipX += 114;
  });

  // Simulated Resume Wireframe Paragraph Lines
  const lineYStarts = [190, 290, 410, 530];
  lineYStarts.forEach((startY) => {
    ctx.fillStyle = "rgba(56, 189, 248, 0.3)";
    ctx.roundRect(24, startY, 140, 12, 4);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      const width = i === 2 ? 280 : 464;
      ctx.roundRect(24, startY + 24 + i * 20, width, 8, 4);
      ctx.fill();
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createSkillPillTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "rgba(11, 15, 25, 0.85)";
  ctx.roundRect(4, 4, 248, 88, 20);
  ctx.fill();

  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 3;
  ctx.roundRect(4, 4, 248, 88, 20);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 32px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, 128, 58);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const RESUME_DATA = [
  { name: "Chitra Ameta", role: "AI Backend Lead", score: "96%", skills: ["Python", "FastAPI", "SQL", "Docker"] },
  { name: "Alex Rivera", role: "Full-Stack Dev", score: "92%", skills: ["React", "TypeScript", "Node", "Redis"] },
  { name: "Elena Rostova", role: "ML Engineer", score: "95%", skills: ["PyTorch", "Python", "LLMs", "AWS"] },
  { name: "David Kim", role: "Python Core Dev", score: "89%", skills: ["Django", "Postgres", "GCP", "CI/CD"] },
  { name: "Sarah Chen", role: "Cloud Architect", score: "91%", skills: ["K8s", "Docker", "Terraform", "Go"] },
  { name: "Marcus Vance", role: "Senior Engineer", score: "88%", skills: ["Python", "FastAPI", "Next.js", "SQL"] },
];

const SKILL_TOKENS = ["Python", "FastAPI", "PostgreSQL", "React", "Docker", "RAG & LLM", "99.4% Match", "Sub-Second"];

export default function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 3, 60);
    pointLight.position.set(0, 10, 15);
    scene.add(pointLight);

    // 3. Floating 3D Resume Sheets
    const resumeGroup = new THREE.Group();
    const resumeMeshes: THREE.Mesh[] = [];

    const sheetGeo = new THREE.PlaneGeometry(5.1, 7.0);

    RESUME_DATA.forEach((data, i) => {
      const texture = createResumeTexture(data.name, data.role, data.score, data.skills);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.82,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(sheetGeo, mat);
      
      // Distribute in 3D cloud
      const angle = (i / RESUME_DATA.length) * Math.PI * 2;
      const radius = 11 + Math.random() * 5;
      mesh.position.x = Math.cos(angle) * radius + (Math.random() - 0.5) * 3;
      mesh.position.y = (Math.random() - 0.5) * 14;
      mesh.position.z = -2 + (Math.random() - 0.5) * 8;

      mesh.rotation.x = (Math.random() - 0.5) * 0.4;
      mesh.rotation.y = (Math.random() - 0.5) * 0.6;
      mesh.rotation.z = (Math.random() - 0.5) * 0.3;

      resumeMeshes.push(mesh);
      resumeGroup.add(mesh);
    });

    scene.add(resumeGroup);

    // 4. Floating 3D Skill Pills
    const skillGroup = new THREE.Group();
    const skillMeshes: THREE.Mesh[] = [];
    const pillGeo = new THREE.PlaneGeometry(3.2, 1.2);

    SKILL_TOKENS.forEach((token, i) => {
      const texture = createSkillPillTexture(token);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(pillGeo, mat);
      mesh.position.x = (Math.random() - 0.5) * 26;
      mesh.position.y = (Math.random() - 0.5) * 18;
      mesh.position.z = 2 + (Math.random() - 0.5) * 6;

      mesh.rotation.z = (Math.random() - 0.5) * 0.2;

      skillMeshes.push(mesh);
      skillGroup.add(mesh);
    });

    scene.add(skillGroup);

    // 5. 3D Laser Scanning Beams
    const beamGeo = new THREE.PlaneGeometry(36, 0.08);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const laserBeam = new THREE.Mesh(beamGeo, beamMat);
    laserBeam.position.z = 1;
    scene.add(laserBeam);

    // 6. Mouse & Scroll Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let scrollY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.001;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.001;
    };

    const onScroll = () => {
      scrollY = window.scrollY * 0.002;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // 7. 60fps Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Camera Damping
      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;

      camera.position.x = targetX * 10;
      camera.position.y = -targetY * 6 - scrollY * 2;
      camera.lookAt(0, -scrollY * 1.5, 0);

      // Gentle floating physics for resume sheets
      resumeMeshes.forEach((mesh, idx) => {
        mesh.position.y += Math.sin(elapsed * 1.2 + idx) * 0.008;
        mesh.rotation.y += 0.0015;
        mesh.rotation.z += Math.cos(elapsed * 0.8 + idx) * 0.001;
      });

      // Gentle floating for skill tokens
      skillMeshes.forEach((mesh, idx) => {
        mesh.position.y += Math.cos(elapsed * 1.4 + idx) * 0.009;
        mesh.position.x += Math.sin(elapsed * 0.9 + idx) * 0.005;
      });

      // Animated Laser Scan sweep
      laserBeam.position.y = Math.sin(elapsed * 1.8) * 10;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="lthree-canvas-wrap" />;
}
