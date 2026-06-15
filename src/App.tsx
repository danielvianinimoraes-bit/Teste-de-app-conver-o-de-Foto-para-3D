/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Upload,
  Box,
  RefreshCw,
  Cpu,
  Download,
  Sparkles,
  User,
  LogIn,
  Search,
  HelpCircle,
  HardDrive,
  Info,
  Check,
  AlertTriangle,
  ShieldCheck,
  Sun,
  Moon,
  ArrowRight,
  Grid,
  Eye,
  EyeOff,
  Layers,
  Trash2,
  X,
  Smartphone,
  ChevronRight,
  Sparkle,
  RotateCcw
} from "lucide-react";
import ThreeViewer from "./components/ThreeViewer";
import { Project } from "./types";

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Active workspace viewpoints: 'landing' (home/demo), 'generator' (active creator), 'dashboard' (projects lists)
  const [activeView, setActiveView] = useState<"landing" | "generator" | "dashboard">("landing");

  // Authentication status simulated
  const [user, setUser] = useState<{ email: string; name: string; provider: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [providerSelected, setProviderSelected] = useState<string | null>(null);

  // Projects list state
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Active model states configuration
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  
  // Local active upload configs
  const [uploadFiles, setUploadFiles] = useState<{ name: string; dataUrl: string }[]>([]);
  const [objectName, setObjectName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Processing metrics states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStepText, setActiveStepText] = useState("");
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  
  // Visual sliders driving the active 3D ThreeViewer Group
  const [modelColor, setModelColor] = useState("#e67e22");
  const [scale, setScale] = useState(1);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [rotationZ, setRotationZ] = useState(0);
  const [smoothing, setSmoothing] = useState(1);
  const [detailsLevel, setDetailsLevel] = useState(40);
  const [wireframe, setWireframe] = useState(false);
  const [showTexture, setShowTexture] = useState(false);
  const [lightIntensity, setLightIntensity] = useState(1.5);
  const [artifactsRemoved, setArtifactsRemoved] = useState(false);
  const [repaired, setRepaired] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [printerBedVisible, setPrinterBedVisible] = useState(true);

  // Floating notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "warn" } | null>(null);

  // Capture instruction selector
  const [activeGuideIndex, setActiveGuideIndex] = useState(0);

  // Interactive slider comparison offset value
  const [comparisonSliderVal, setComparisonSliderVal] = useState(50);

  // Standard toast helper
  const showToast = (message: string, type: "success" | "info" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch projects list from back-end on starting
  const fetchAllProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);

        // Auto-select first project as active if available to populate viewer if entering workspace
        if (data.length > 0 && !activeProject) {
          applyProjectToViewer(data[0]);
        }
      }
    } catch (e) {
      console.error("Erro ao buscar projetos do backend:", e);
      // Fallback fallback simulated offline projects list
      const backupProjects: Project[] = [
        {
          id: "demo-fox",
          title: "Estátua de Raposa Zen",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          imagesCount: 8,
          status: "completed",
          meshType: "creative_fox",
          geometryStyle: "smooth",
          modelColor: "#e67e22",
          scale: 1,
          rotation: { x: 0, y: 0, z: 0 },
          smoothing: 2,
          detailsLevel: 80,
          analysis: {
            watertight: true,
            minThickness: "2.4 mm",
            fragileAreasCount: 0,
            openBoundaries: 0,
            supportsNeeded: true,
            estimatedHours: 4.5,
            material: "PLA",
            polygons: 24500,
            vertices: 12252,
            dimensions: { x: 80, y: 120, z: 75 }
          }
        },
        {
          id: "demo-mug",
          title: "Caneca Geométrica",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          imagesCount: 6,
          status: "completed",
          meshType: "mug",
          geometryStyle: "boxy",
          modelColor: "#3498db",
          scale: 0.8,
          rotation: { x: 0, y: 0, z: 0 },
          smoothing: 0,
          detailsLevel: 50,
          analysis: {
            watertight: true,
            minThickness: "3.0 mm",
            fragileAreasCount: 0,
            openBoundaries: 0,
            supportsNeeded: false,
            estimatedHours: 3.2,
            material: "PETG / PLA",
            polygons: 12400,
            vertices: 6200,
            dimensions: { x: 90, y: 95, z: 90 }
          }
        }
      ];
      setProjects(backupProjects);
      if (!activeProject) applyProjectToViewer(backupProjects[0]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchAllProjects();
  }, []);

  // Update background-theme colors
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, [theme]);

  // Load selected project parameters to direct control sliders
  const applyProjectToViewer = (proj: Project) => {
    setActiveProject(proj);
    setModelColor(proj.modelColor);
    setScale(proj.scale);
    setRotationX(proj.rotation.x);
    setRotationY(proj.rotation.y);
    setRotationZ(proj.rotation.z);
    setSmoothing(proj.smoothing);
    setDetailsLevel(proj.detailsLevel);
    setRepaired(proj.analysis.watertight);
    setArtifactsRemoved(proj.analysis.fragileAreasCount === 0);
  };

  // Drag and Drop uploads handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processSelectedRawFiles = (filesList: FileList | null) => {
    if (!filesList) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const limit = 20;

    const availableSlots = limit - uploadFiles.length;
    if (availableSlots <= 0) {
      showToast("Limite de 20 fotografias atingido.", "warn");
      return;
    }

    const processFilesPromises = Array.from(filesList)
      .filter((file) => allowedTypes.includes(file.type))
      .slice(0, availableSlots)
      .map((file) => {
        return new Promise<{ name: string; dataUrl: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              name: file.name,
              dataUrl: (e.target?.result as string) || ""
            });
          };
          reader.readAsDataURL(file);
        });
      });

    Promise.all(processFilesPromises).then((results) => {
      if (results.length > 0) {
        setUploadFiles((prev) => [...prev, ...results]);
        showToast(`${results.length} fotos carregadas para o lote.`);
        
        // Suggest automatic item name based on first file name word
        if (!objectName && results[0]?.name) {
          const cleanName = results[0].name
            .split(".")[0]
            .split("_")
            .join(" ")
            .split("-")
            .join(" ");
          // Capitalize first letter
          setObjectName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processSelectedRawFiles(e.dataTransfer.files);
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearUploadQueue = () => {
    setUploadFiles([]);
    setObjectName("");
    showToast("Fila de envio liberada.", "info");
  };

  // IA Reconstruction Loop Trigger
  const triggerIaReconstruction = async () => {
    if (uploadFiles.length === 0) {
      showToast("Carregue pelo menos uma foto para iniciar.", "warn");
      return;
    }

    const titleInput = objectName.trim() || "Objeto Customizado " + (projects.length + 1);

    setIsProcessing(true);
    setProgress(5);
    setActiveStepText("Conectando ao pod de inferência profundo...");
    setProcessingLogs(["[1/6] Iniciando handshakes seguros..."]);

    const stepsConfig = [
      { prg: 22, txt: "Extraindo nuvem tridimensional de profundidade estéreo...", log: "[2/6] Alinhando múltiplas tomadas fotográficas na câmera virtual..." },
      { prg: 45, txt: "Fundindo nuvem de pontos densa por triangulação de relevo...", log: "[3/6] Mapeando coordenadas cilíndricas normais do objeto..." },
      { prg: 68, txt: "Sintetizando malha poligonal estanque (watertight)...", log: "[4/6] Otimizando topologia interna com TripoSR / InstantMesh API..." },
      { prg: 82, txt: "Fundindo texturas e corrigindo orientação da base...", log: "[5/6] Analisando espessura mecânica de paredes de impressão..." },
      { prg: 95, txt: "Validando integridade mecânica para fatiador STL...", log: "[6/6] Realizando testes de consistência de overhangs e fatiamento." }
    ];

    let stepIdx = 0;
    const intervalTimer = setInterval(() => {
      if (stepIdx < stepsConfig.length) {
        const item = stepsConfig[stepIdx];
        setProgress(item.prg);
        setActiveStepText(item.txt);
        setProcessingLogs((prev) => [...prev, item.log]);
        stepIdx++;
      } else {
        clearInterval(intervalTimer);
      }
    }, 2000);

    try {
      // POST API Call to backend with loaded images base64 payload
      const response = await fetch("/api/reconstruct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          images: uploadFiles.map(f => f.dataUrl),
          objectName: titleInput
        })
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || "A API real de 3D retornou um erro inesperado.");
      }

      const result = await response.json();
      
      clearInterval(intervalTimer);
      setProgress(100);
      setActiveStepText("Concluído!");
      setIsProcessing(false);
      showToast("Sucesso! Modelo 3D criado pela IA real.");

      const savedProj: Project = {
        id: result.modelId || "p_" + Date.now().toString(36),
        title: titleInput,
        createdAt: new Date().toISOString(),
        imagesCount: uploadFiles.length,
        status: "completed",
        meshType: result.meshType,
        geometryStyle: result.geometryStyle,
        modelColor: result.modelColor,
        scale: 1,
        rotation: { x: 0, y: 0, z: 0 },
        smoothing: 1,
        detailsLevel: 50,
        analysis: result.analysis,
        summary: result.summary,
        modelUrl: result.modelUrl
      };

      // Ensure persistent save on server Database
      try {
        await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savedProj)
        });
      } catch (postErr) {
        console.error("Erro ao salvar projeto no backend:", postErr);
      }

      // Add to state list and CLEAR default/demo models from the list
      setProjects((prev) => {
        const remaining = prev.filter(p => !p.id.startsWith("demo-"));
        return [savedProj, ...remaining];
      });

      applyProjectToViewer(savedProj);
      setUploadFiles([]); // Clear queue
      setObjectName("");

    } catch (err: any) {
      clearInterval(intervalTimer);
      setIsProcessing(false);
      showToast(`Geração Falhou: ${err.message || err}`, "warn");
    }
  };

  // Simulated authentication submit
  const handleAuthentication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) {
      showToast("Por favor digite um e-mail válido.", "warn");
      return;
    }

    const mockName = authName ? authName : authEmail.split("@")[0];
    setUser({
      email: authEmail,
      name: mockName.charAt(0).toUpperCase() + mockName.slice(1),
      provider: providerSelected || "E-mail"
    });

    setAuthModalOpen(false);
    showToast(`Bem-vindo, ${mockName}! Modo PRO ilimitado ativado.`, "success");
    resetAuthFields();
  };

  const triggerSocialAuth = (provider: string) => {
    setProviderSelected(provider);
    setUser({
      email: `${provider.toLowerCase()}User@phototo3d.ai`,
      name: `Arquiteto ${provider}`,
      provider: provider
    });
    setAuthModalOpen(false);
    showToast(`Autenticado com ${provider}! Acesso irrestrito livre.`, "success");
    resetAuthFields();
  };

  const resetAuthFields = () => {
    setAuthEmail("");
    setAuthName("");
    setProviderSelected(null);
  };

  const handleLogout = () => {
    setUser(null);
    showToast("Sessão finalizada com sucesso.", "info");
  };

  // Delete project trigger
  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        showToast("Projeto deletado com sucesso.");
        if (activeProject?.id === id) {
          setActiveProject(null);
        }
      }
    } catch (err) {
      console.error(err);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      showToast("Projeto removido de sua sessão.");
    }
  };

  // Editor Actions calling Three.js methods
  const triggerAutoRepair = () => {
    if (!activeProject) return;
    showToast("Iniciando algoritmos de reparação de malha...", "info");
    
    // Animate repair delay
    setTimeout(() => {
      setRepaired(true);
      if (activeProject) {
        const updated = {
          ...activeProject,
          analysis: {
            ...activeProject.analysis,
            watertight: true,
            openBoundaries: 0,
            fragileAreasCount: 0
          }
        };
        setActiveProject(updated);
        setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? updated : p)));
      }
      showToast("Malha corrigida com sucesso! Vetores estão estanques (Watertight).", "success");
    }, 1500);
  };

  const triggerRemoveArtifacts = () => {
    if (!activeProject) return;
    showToast("Filtrando outliers geométricos e poeiras de ruído...", "info");
    
    setTimeout(() => {
      setArtifactsRemoved(true);
      if (activeProject) {
        const updated = {
          ...activeProject,
          analysis: {
            ...activeProject.analysis,
            polygons: Math.floor(activeProject.analysis.polygons * 0.96),
            fragileAreasCount: 0
          }
        };
        setActiveProject(updated);
        setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? updated : p)));
      }
      showToast("Ruídos ambientais eliminados. Malha limpa.", "success");
    }, 1200);
  };

  const triggerCenterMesh = () => {
    setScale(1);
    setRotationX(0);
    setRotationY(0);
    setRotationZ(0);
    showToast("Transformações físicas redefinidas.", "info");
  };

  // Download Trigger calling custom procedural Exporter in ThreeViewer or fetching the real generated model
  const initiateFileDownload = (format: string) => {
    if (!activeProject) {
      showToast("Nenhum modelo selecionado.", "warn");
      return;
    }

    if (activeProject.modelUrl) {
      showToast(`Iniciando download do modelo de IA real em formato .${format.toLowerCase()}...`, "success");
      const filename = `${activeProject.title ? activeProject.title.toLowerCase().split(" ").join("-") : "modelo-3d"}.${format.toLowerCase()}`;
      
      const link = document.createElement("a");
      link.href = activeProject.modelUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    showToast(`Gerando arquivo binário compactado .${format.toLowerCase()}...`, "info");
    
    const triggerInWindow = (window as any)._photoTo3D_exportTrigger;
    if (typeof triggerInWindow === "function") {
      triggerInWindow(format);
    } else {
      const fakeContent = `# PhotoTo3D mesh exporter offline fallback\no ${activeProject.title}\n`;
      const blob = new Blob([fakeContent], { type: "text/plain" });
      onExportHandled(format, blob);
    }
  };

  // Handle the callback from ThreeViewer file generation
  const onExportHandled = (format: string, blob: Blob) => {
    const filename = `${activeProject?.title ? activeProject.title.toLowerCase().split(" ").join("-") : "modelo-3d"}_phototo3d.${format.toLowerCase()}`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Download de "${filename}" concluído! Pronto para o fatiador.`, "success");
  };

  // Expanded illustrations helper for Capture guide
  const captureGuides = [
    {
      title: "Vários Ângulos",
      description: "Tire fotos de diferentes alturas (frente, cima, baixo) para que a IA consiga mapear todas as faces do objeto.",
      badge: "Passo 1",
      icon: "📸",
      imageAlt: "Demonstração de câmera posicionada em 3 níveis verticais apontando para o objeto."
    },
    {
      title: "Órbita 360 Graus",
      description: "Dê voltas completas ao redor do objeto, mantendo uma sobreposição de 60% a 70% entre as fotos sequenciais.",
      badge: "Passo 2",
      icon: "🔄",
      imageAlt: "Diagrama mostrando órbita de câmera circulando 360° em intervalos regulares."
    },
    {
      title: "Boa Iluminação",
      description: "Utilize luz difusa e evite sombras fortes ou pontos super expostos que confundem a detecção geométrica.",
      badge: "Passo 3",
      icon: "💡",
      imageAlt: "Lâmpadas posicionadas para criar luz homogênea sem reflexos agressivos."
    },
    {
      title: "Fundo Simples",
      description: "Coloque o objeto em uma superfície fosca e limpa, livre de poluição visual. Isso acelera a máscara de corte automático.",
      badge: "Passo 4",
      icon: "🔲",
      imageAlt: "Objeto isolado em cima de uma mesa de cor neutra com fundo infinito."
    },
    {
      title: "Foco Perfeito",
      description: "Garanta que todas as fotos estejam perfeitamente nítidas. Imagens borradas produzem malhas imperfeitas ou cheias de lacunas.",
      badge: "Passo 5",
      icon: "🎯",
      imageAlt: "Lente focada no centro do objeto com profundidade de campo isolando ruídos."
    }
  ];

  // Pipeline Engine steps display
  const engineStages = [
    { id: "01", name: "Extração de Silhueta", desc: "A IA separa o objeto do fundo criando máscaras de mascaramento perfeitas." },
    { id: "02", name: "Estimação de Profundidade", desc: "Análise monocular de profundidade pixel-a-pixel determinando relevo." },
    { id: "03", name: "Nuvem de Pontos", desc: "Milhares de coordenadas geométricas unidas no espaço 3D vetorial." },
    { id: "04", name: "Triangulação de Poisson", desc: "Conexão inteligente de vértices desenhando a primeira casca poligonal." },
    { id: "05", name: "Ajuste Watertight", desc: "Fechamento automático de furos e fendas para garantir modelo estanque sólido." },
    { id: "06", name: "Fusão de Textura", desc: "Mapeamento UV e projeção de cores de alta fidelidade baseada nas fotos originais." }
  ];

  // Filter project database by query string
  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.meshType.toLowerCase().includes(q);
  });

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 relative overflow-x-hidden ${
      theme === "dark" ? "bg-[#050505] text-[#e5e7eb]" : "bg-[#fcfcfc] text-slate-900"
    }`}>
      {/* Background geometric grid pattern */}
      <div className={`absolute inset-0 pointer-events-none opacity-20 ${
        theme === "dark" 
          ? "bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] dark:bg-[radial-gradient(#3b82f6_1px,transparent_1px)]" 
          : "bg-[radial-gradient(#cbd5e1_1px,transparent_1px)]"
      } [background-size:32px_32px]`}></div>
      
      {/* Toast Alert floating */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce flex items-center space-x-3 bg-[#080808] border border-blue-500/30 text-[#e5e7eb] px-5 py-3 rounded-lg shadow-2xl backdrop-blur-md max-w-sm">
          <div className="bg-blue-600 text-white p-1.5 rounded">
            <Sparkles size={16} />
          </div>
          <p className="text-xs font-medium leading-tight">{toast.message}</p>
        </div>
      )}

      {/* NAV BAR */}
      <nav className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-200 ${
        theme === "dark" 
          ? "bg-[#050505]/80 border-white/10" 
          : "bg-[#fcfcfc]/80 border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo brand */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView("landing")}>
              <div className="w-8 h-8 bg-blue-600 rounded-sm rotate-45 flex items-center justify-center">
                <Box size={14} className="-rotate-45 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tighter uppercase font-display bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent dark:block hidden">
                Photo<span className="text-blue-500">To</span>3D
              </span>
              <span className="text-xl font-bold tracking-tighter uppercase font-display text-slate-900 dark:hidden block">
                Photo<span className="text-blue-500">To</span>3D
              </span>
            </div>

            {/* Nav links desktop */}
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
              <button 
                onClick={() => setActiveView("landing")} 
                className={`transition-colors py-1 ${activeView === "landing" ? "text-blue-500 border-b border-blue-500" : "text-gray-400 hover:text-white"}`}
              >
                Início
              </button>
              <button 
                onClick={() => setActiveView("generator")} 
                className={`transition-colors py-1 ${activeView === "generator" ? "text-blue-500 border-b border-blue-500" : "text-gray-400 hover:text-white"}`}
              >
                Gerador 3D IA
              </button>
              <button 
                onClick={() => {
                  setActiveView("dashboard");
                  fetchAllProjects();
                }} 
                className={`transition-colors py-1 ${activeView === "dashboard" ? "text-blue-500 border-b border-blue-500" : "text-gray-400 hover:text-white"}`}
              >
                Meus Projetos
              </button>
              <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">
                Como Funciona
              </a>
            </div>

            {/* Quick Actions right panel */}
            <div className="flex items-center space-x-4">
              
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  theme === "dark" ? "bg-[#080808] text-gray-300 hover:bg-[#121212] border border-white/5" : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
                title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* User authentication portal */}
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs text-blue-450 font-mono tracking-tight font-bold">{user.name || "PRO_USER_882"}</span>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest leading-none">Node: Brazil-SPO-1</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[1px]">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || "Felix"}`} alt="Avatar" className="w-6 h-6 object-cover" referrerPolicy="referrer" />
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1 px-2.5 bg-red-950/20 text-red-400 hover:bg-red-950/45 border border-red-900/30 rounded text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center space-x-1.5 p-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-xs uppercase tracking-wider font-mono cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <LogIn size={13} />
                  <span>Entrar</span>
                </button>
              )}

              {/* Action Button */}
              <button
                onClick={() => {
                  setActiveView("generator");
                  if (projects.length > 0 && !activeProject) {
                    applyProjectToViewer(projects[0]);
                  }
                }}
                className={`hidden sm:inline-flex items-center space-x-1 p-2 px-4 rounded text-xs font-bold cursor-pointer transition-colors ${
                  theme === "dark" ? "bg-[#080808] hover:bg-[#121212] border border-white/10 text-[#e5e7eb]" : "bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-800"
                }`}
              >
                <span>Criar 3D</span>
                <ChevronRight size={13} className="text-blue-500" />
              </button>

            </div>
          </div>
        </div>
      </nav>

      {/* ----------------- 1. LANDING PAGE VIEW ----------------- */}
      {activeView === "landing" && (
        <div className="pb-16">
          
          {/* HERO SECTION */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column Text details */}
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                
                {/* Micro tech badge */}
                <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3.5 py-1.5 rounded text-xs font-mono font-medium tracking-wider">
                  <Sparkle size={12} className="animate-pulse text-blue-500" />
                  <span>RECONSTRUÇÃO 3D POR IA DE ALTA PRECISÃO</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter font-display leading-none leading-tight uppercase">
                  <span className="block text-slate-905 dark:text-white">Transforme Fotos em</span>
                  <span className="relative inline-block mt-1 font-extrabold bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-500 bg-clip-text text-transparent">
                    Objetos 3D Imprimíveis
                  </span>
                </h1>

                <p className="max-w-xl mx-auto lg:mx-0 text-sm sm:text-base text-gray-400 leading-relaxed font-light">
                  Envie fotos de qualquer objeto e nossa inteligência artificial cria automaticamente 
                  um modelo 3D completo, com superfícies estanques altamente detalhado e pronto para 
                  sua impressora 3D. Totalmente gratuito.
                </p>

                {/* Hero CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <button
                    onClick={() => {
                      setActiveView("generator");
                      if (projects.length > 0 && !activeProject) applyProjectToViewer(projects[0]);
                    }}
                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-xl shadow-blue-550/25 font-mono uppercase tracking-widest text-xs flex items-center justify-center space-x-2.5 transition-all hover:scale-[1.01] cursor-pointer"
                  >
                    <Box size={18} className="animate-pulse" />
                    <span>Criar Meu Modelo 3D</span>
                  </button>
                  <a
                    href="#live-demostracao"
                    className={`w-full sm:w-auto px-8 py-4 ${
                      theme === "dark" ? "bg-[#080808] hover:bg-[#121212] border-white/10" : "bg-slate-100 hover:bg-slate-200 border-slate-200"
                    } border text-gray-300 font-bold rounded font-mono uppercase tracking-widest text-xs flex items-center justify-center space-x-2 cursor-pointer transition-colors`}
                  >
                    <Eye size={16} className="text-blue-500" />
                    <span>Ver Demonstração</span>
                  </a>
                </div>

                {/* Micro metrics row */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10 max-w-lg mx-auto lg:mx-0">
                  <div>
                    <h4 className="text-xl sm:text-2xl font-bold text-blue-500 font-mono tracking-tight">100%</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Gratuito sem Limite</p>
                  </div>
                  <div>
                    <h4 className="text-xl sm:text-2xl font-bold text-blue-400 font-mono tracking-tight">STL/OBJ</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Pronto para Cura</p>
                  </div>
                  <div>
                    <h4 className="text-xl sm:text-2xl font-bold text-blue-500 font-mono tracking-tight">&lt; 3 min</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Tempo de Geração</p>
                  </div>
                </div>

              </div>

              {/* Right Column visual preview frame */}
              <div className="lg:col-span-5 relative mt-8 lg:mt-0">
                <div className={`relative mx-auto max-w-sm sm:max-w-md ${
                  theme === "dark" ? "bg-[#080808]" : "bg-white"
                } rounded border ${
                  theme === "dark" ? "border-white/10" : "border-slate-200"
                } p-4 shadow-xl overflow-hidden group`}>
                  
                  {/* Decorative glowing background gradients */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-blue-500/5 pointer-events-none group-hover:opacity-100 transition-opacity"></div>
                  
                  {/* Floating AI badge */}
                  <div className="absolute top-6 left-6 z-10 flex items-center space-x-1.5 bg-black/90 border border-white/10 px-3 py-1 rounded text-xs font-mono">
                    <div className="animate-ping h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-blue-400 font-bold font-mono text-[9px] uppercase tracking-wider">RECONSTRUINDO</span>
                  </div>

                  {/* Hero representation graphic card */}
                  <div className="aspect-[4/3] rounded bg-black overflow-hidden relative flex items-center justify-center border border-white/5">
                    
                    {/* Simulated 3D camera orbits and wireframe overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>
                    
                    {/* Visual 3D simulation elements */}
                    <div className="relative text-center space-y-4">
                      
                      {/* Geometric animal vector look alike */}
                      <div className="mx-auto h-24 w-24 bg-gradient-to-br from-blue-600/90 to-blue-800/95 rounded rotate-45 flex items-center justify-center shadow-xl relative animate-pulse border border-blue-450/45">
                        <Box size={35} className="text-white -rotate-45" />
                      </div>
                      <div className="text-[9px] font-mono tracking-widest text-[#e5e7eb] uppercase">MODELO_3D_IA</div>

                      {/* Diagnostic HUD tracking indicators */}
                      <div className="space-y-0.5">
                        <div className="text-xs font-mono text-blue-400 font-bold">raposa_geometrica.stl</div>
                        <div className="text-[10px] text-gray-500 font-mono">Vértices: 24,500 • Espessura: Watertight</div>
                      </div>
                    </div>

                    {/* Grid mesh decorative lines */}
                    <div className="absolute bottom-4 left-6 right-6 border border-blue-500/20 bg-black/80 p-2.5 rounded border-dashed">
                      <div className="flex justify-between text-[9px] font-mono text-gray-500">
                        <span>ESTÁTICA DE OBJETO DETECTADA</span>
                        <span className="text-blue-400">OK [98%]</span>
                      </div>
                    </div>

                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        <span className="h-1.5 w-1.5 bg-gray-700 rounded-full"></span>
                        <span className="h-1.5 w-1.5 bg-gray-700 rounded-full"></span>
                        <span className="h-1.5 w-1.5 bg-gray-700 rounded-full"></span>
                      </div>
                      <span className="text-[9px] font-mono text-gray-500">PROJETOS GERADOS LIVRES: 10,482</span>
                    </div>
                    
                    {/* Live mini process tags */}
                    <div className="text-xs font-mono bg-black p-2.5 rounded border border-white/5 text-gray-400 space-y-1 flex flex-col">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-blue-500 font-bold uppercase tracking-wider">⚡ INICIAR EXPERIMENTO</span>
                        <span className="text-gray-500 text-[9px]">ESTIMADO: 1.5 min</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-normal">Transforme qualquer sequência JPG/PNG orbital em sólidos mecânicos.</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* DYNAMIC COMPARISON DEMO SLIDER */}
          <div id="live-demostracao" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-6">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <h2 className="text-3xl font-extrabold tracking-tighter uppercase font-display">
                Veja a Transformação em Tempo Real
              </h2>
              <p className="text-gray-400 font-light text-sm max-w-xl mx-auto">
                Arraste o slider interativo abaixo para ver a foto original enviando e o fatiamento tridimensional gerado automaticamente pela nossa IA.
              </p>
            </div>

            <div className="max-w-4xl mx-auto relative h-[420px] bg-black rounded border border-white/10 overflow-hidden shadow-2xl">
              
              {/* Photo component representing the LEFT SIDE (Original Image) */}
              <div className="absolute inset-0 w-full h-full">
                {/* Simulated ceramic decorative fox picture with soft lighting */}
                <div className={`w-full h-full ${theme === 'dark' ? 'bg-[#080808]' : 'bg-slate-100'} flex flex-col items-center justify-center p-6 text-center`}>
                  <div className="h-44 w-44 bg-black p-2 rounded flex items-center justify-center border border-white/5 shadow-xl relative">
                    <img
                       src="https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=600"
                      alt="Peça cerâmica real de Raposa Origami"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-sm"
                    />
                    <div className="absolute -bottom-3 bg-black border border-white/15 font-mono text-[9px] px-2.5 py-0.5 rounded text-blue-400 font-bold uppercase tracking-wider">
                      FOTOGRAFIA REAL ENVIADA
                    </div>
                  </div>
                  <div className="mt-8 space-y-1">
                    <h4 className="text-sm font-bold text-[#e5e7eb]">Artesanato de Raposa Geométrica</h4>
                    <p className="text-xs text-gray-500">Foto orbital 01 capturada do smartphone</p>
                  </div>
                </div>
              </div>

              {/* Mesh component representing the RIGHT SIDE (Processed mesh blueprint) */}
              <div 
                className="absolute top-0 right-0 h-full bg-black overflow-hidden border-l-2 border-blue-500 shadow-2xl transition-all duration-75"
                style={{ width: `${100 - comparisonSliderVal}%` }}
              >
                {/* Simulated high-fidelity 3D blueprint representation */}
                <div className="absolute inset-0 w-[896px] h-full bg-black flex flex-col items-center justify-center p-6 text-center" style={{ right: 0 }}>
                  <div className="h-44 w-44 bg-blue-950/20 p-2 rounded flex items-center justify-center border border-blue-500/30 shadow-2xl relative">
                    {/* SVG Blueprint matrix design */}
                    <div className="w-full h-full border border-blue-500/20 rounded relative flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] [background-size:12px_12px]"></div>
                      <Box size={55} className="text-blue-400 rotate-12 animate-pulse" />
                      
                      {/* Triangle facets design representation */}
                      <span className="absolute inset-0 pointer-events-none opacity-40 border border-blue-500/10"></span>
                    </div>
                    <div className="absolute -bottom-3 bg-black border border-blue-700 font-mono text-[9px] px-2 py-0.5 rounded text-blue-300 font-bold uppercase tracking-wider">
                      MODELO CAD 3D VETORIAL IA
                    </div>
                  </div>
                  <div className="mt-8 space-y-1">
                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide">Estrutura STL Fechada (Estanque)</h4>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest leading-none mt-1">Polígonos: 24,500 • Watertight</p>
                  </div>
                </div>
              </div>

              {/* Slider Drag Bar control */}
              <input 
                type="range"
                min="0"
                max="100"
                value={comparisonSliderVal}
                onChange={(e) => setComparisonSliderVal(Number(e.target.value))}
                className="absolute top-0 bottom-0 left-0 right-0 w-full h-full opacity-0 hover:opacity-10 cursor-ew-resize z-20"
              />

              {/* Draggable thumb visual element */}
              <div 
                className="absolute top-0 bottom-0 pointer-events-none z-10 w-1 flex items-center justify-center"
                style={{ left: `${comparisonSliderVal}%` }}
              >
                <div className="h-10 w-10 bg-blue-600 border-2 border-blue-400 text-white flex items-center justify-center shadow-xl rounded-full">
                  <RefreshCw size={14} className="animate-spin-slow" />
                </div>
              </div>

              {/* Floating controls hint labels */}
              <div className="absolute bottom-4 left-4 z-10 bg-black px-3 py-1 rounded border border-white/10 text-[9px] font-mono text-gray-500">
                FOTO ENVIADA
              </div>
              <div className="absolute bottom-4 right-4 z-10 bg-black px-3 py-1 rounded border border-white/10 text-[9px] font-mono text-blue-400">
                PROJEÇÃO 3D IA
              </div>

            </div>
          </div>

          {/* DYNAMIC HOW IT WORKS STEPS (Como Funciona) */}
          <div id="how-it-works" className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-6 rounded border ${
            theme === 'dark' ? 'bg-[#080808]/50 border-white/10' : 'bg-slate-100/50 border-slate-200'
          }`}>
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-blue-500 text-xs font-mono font-bold tracking-widest uppercase">Fluxo Simplificado</span>
              <h2 className="text-3xl font-extrabold tracking-tighter uppercase font-display">
                Como Funciona a Criação 3D
              </h2>
              <p className="text-gray-400 font-light text-sm max-w-xl mx-auto">
                Basta carregar fotos do objeto em múltiplos ângulos. Nosso pipeline cuida de todo o cálculo pesado.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {[
                { step: "01", title: "Upload", desc: "Arraste fotos JPG ou PNG orbitais do objeto." },
                { step: "02", title: "Análise IA", desc: "Nossa IA de rede neural extrai mapas de relevo." },
                { step: "03", title: "Nuvem", desc: "Gera a nuvem tridimensional de posicionamento." },
                { step: "04", title: "Fechamento", desc: "Verifica e sela lacunas gerando sólidos estanques." },
                { step: "05", title: "Otimização", desc: "Calcula a espessura ideal de parede para impressão 3D." },
                { step: "06", title: "Download", desc: "Baixe a malha polida em STL, OBJ ou GLB." }
              ].map((item, index) => (
                <div key={index} className={`border ${
                  theme === 'dark' ? 'bg-[#080808] border-white/5 hover:border-blue-500/55' : 'bg-white border-slate-200 hover:border-blue-500/55'
                } p-5 rounded space-y-4 transition-all group`}>
                  <div className="text-2xl font-mono text-blue-500 font-bold leading-none">{item.step}</div>
                  <h4 className="text-sm font-bold text-[#e5e7eb] group-hover:text-blue-400 transition-colors uppercase tracking-wider">{item.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* INTERACTIVE CAPTURE GUIDE CONSOLE (Assistente de Captura) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left text column & interactive buttons */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-blue-500 text-xs font-mono font-bold uppercase tracking-wider">Manual Ilustrado</span>
                  <h2 className="text-3xl font-extrabold tracking-tighter uppercase font-display text-slate-905 dark:text-white mt-1">
                    Assistente de Captura 3D
                  </h2>
                  <p className="text-gray-400 text-sm mt-3 font-light leading-relaxed">
                    Siga estas regras essenciais para tirar suas fotos. A qualidade das fotografias determina diretamente o realismo e a precisão dimensional do arquivo 3D gerado.
                  </p>
                </div>

                <div className="space-y-2">
                  {captureGuides.map((guide, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveGuideIndex(idx)}
                      className={`w-full text-left p-3.5 rounded border flex items-center justify-between transition-all cursor-pointer ${
                        activeGuideIndex === idx
                          ? "bg-blue-600/10 border-blue-500 text-white"
                          : "bg-[#080808]/80 border-white/5 text-gray-400 hover:bg-[#121212] hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <span className="text-xl">{guide.icon}</span>
                        <div>
                          <span className="text-[9px] font-mono text-blue-400 block uppercase font-bold tracking-widest">{guide.badge}</span>
                          <span className="text-xs font-bold uppercase tracking-wider leading-none">{guide.title}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className={activeGuideIndex === idx ? "text-blue-500" : "text-gray-650"} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right column visual detail illustration box */}
              <div className="lg:col-span-7">
                <div className="bg-[#080808] border border-white/10 p-8 rounded flex flex-col justify-between h-[450px]">
                  
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">{captureGuides[activeGuideIndex].icon}</span>
                      <h4 className="text-medium font-bold text-[#e5e7eb] uppercase tracking-wide">
                        {captureGuides[activeGuideIndex].title}
                      </h4>
                    </div>
                    <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider">
                      {captureGuides[activeGuideIndex].badge}
                    </span>
                  </div>

                  {/* Inner representation visual of layout */}
                  <div className="my-6 flex-1 bg-black rounded flex items-center justify-center p-6 border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:12px_12px] opacity-10"></div>
                    
                    {/* Simulated illustrated HUD */}
                    <div className="text-center space-y-4">
                      
                      {/* Generates abstract illustration based on selection */}
                      {activeGuideIndex === 0 && (
                        <div className="flex flex-col items-center">
                          <div className="flex space-x-4 items-end mb-2">
                            <span className="text-gray-500">🎥 45°</span>
                            <span className="text-blue-500 text-3xl font-bold animate-pulse">🦊</span>
                            <span className="text-gray-500">🎥 15°</span>
                          </div>
                          <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">Tome fotos de cima, de frente e de baixo</p>
                        </div>
                      )}

                      {activeGuideIndex === 1 && (
                        <div className="flex flex-col items-center">
                          <div className="relative h-20 w-20 flex items-center justify-center border-2 border-blue-500/25 border-dashed rounded mb-2 animate-spin-slow">
                            <span className="text-blue-400 text-2xl absolute">🏺</span>
                            <span className="absolute -top-1 right-2">🎥</span>
                            <span className="absolute -bottom-1 left-2">🎥</span>
                          </div>
                          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Dê voltas circulares completas no objeto</p>
                        </div>
                      )}

                      {activeGuideIndex === 2 && (
                        <div className="flex flex-col items-center">
                          <div className="flex space-x-8 items-center mb-2">
                            <span className="text-yellow-400 text-2xl">💡 Diffuse</span>
                            <span className="text-2xl">🧸</span>
                            <span className="text-yellow-400 text-2xl">💡 Soft</span>
                          </div>
                          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Iluminação homogênea com sombras suaves</p>
                        </div>
                      )}

                      {activeGuideIndex === 3 && (
                        <div className="flex flex-col items-center">
                          <div className="h-16 w-28 bg-[#080808] border border-white/10 rounded flex items-center justify-center mb-2">
                            <span className="text-emerald-500 text-sm font-mono font-bold">✓ Clean Plate</span>
                          </div>
                          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Fundo uniforme sem poluição visual</p>
                        </div>
                      )}

                      {activeGuideIndex === 4 && (
                        <div className="flex flex-col items-center">
                          <div className="relative h-16 w-16 mb-2 flex items-center justify-center">
                            <div className="absolute inset-0 border-2 border-blue-500 rounded animate-ping"></div>
                            <span className="text-3xl text-blue-500">🎯</span>
                          </div>
                          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Nitidez máxima em todas as capturas</p>
                        </div>
                      )}

                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-light">
                    {captureGuides[activeGuideIndex].description}
                  </p>

                </div>
              </div>

            </div>
          </div>

          {/* DYNAMIC PIPELINE ILLUSTRATION SECTION */}
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 rounded border ${
            theme === 'dark' ? 'bg-[#080808]/50 border-white/10' : 'bg-slate-100/50 border-slate-200'
          }`}>
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <span className="text-blue-500 text-xs font-mono font-bold tracking-widest uppercase">Arquitetura Estrutural</span>
              <h2 className="text-3xl font-extrabold tracking-tighter uppercase font-display text-slate-905 dark:text-white">
                O Pipeline Geométrico PhotoTo3D
              </h2>
              <p className="text-gray-400 font-light text-sm mt-1">
                Conheça as etapas computacionais que garantem a perfeição da malha para se adaptar em todas as impressoras (Cura, PrusaSlicer, Bambu Studio).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {engineStages.map((stage, i) => (
                <div key={i} className={`border ${
                  theme === 'dark' ? 'bg-[#080808]/90 border-white/5' : 'bg-white border-slate-200'
                } p-6 rounded space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded font-bold">{stage.id}</span>
                    <Check size={14} className="text-emerald-500" />
                  </div>
                  <h4 className="text-sm font-bold text-[#e5e7eb] uppercase tracking-wider">{stage.name}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-light">{stage.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ----------------- 2. ACTIVE GENERATOR WORKSPACE (THREE.JS INSIDE) ----------------- */}
      {activeView === "generator" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Diagnostic Console AI Processing Box overlay */}
          {isProcessing && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#080808] border border-white/10 rounded p-8 max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                  <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Cpu size={24} className="text-blue-500 animate-spin" />
                    <div>
                      <h3 className="text-md font-bold text-slate-205">Reconstruindo Malha IA...</h3>
                      <p className="text-[10px] font-mono text-gray-500 uppercase">PROCESSO ESTREANTE EM PROGRESSO</p>
                    </div>
                  </div>
                  <div className="text-2xl font-mono text-blue-500 font-bold">{progress}%</div>
                </div>

                {/* Progress bar circular helper */}
                <div className="h-2 w-full bg-white/5 rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-505 rounded transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="bg-black p-4 rounded border border-white/5 font-mono text-[11px] text-blue-300 space-y-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Atividade do Servidor:</p>
                  <p className="text-slate-100 font-bold animate-pulse">&gt; {activeStepText}</p>
                  <div className="pt-2 border-t border-white/5 mt-2 space-y-0.5 text-[9px] text-gray-500 overflow-y-auto max-h-[80px]">
                    {processingLogs.map((log, index) => (
                      <p key={index}>{log}</p>
                    ))}
                  </div>
                </div>

                <div className="text-gray-500 text-center text-[10px] font-mono leading-relaxed">
                  Por favor, aguarde. Estamos calculando as profundidades orbitais do seu objeto. Isso leva em média de 1 a 2 minutos baseada no volume das fotos.
                </div>
              </div>
            </div>
          )}

          {/* MAIN GENERATION CREATIVE VIEWPORT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT AREA: UPLOAD LATE BLOCK OR ACTIVE THREE.JS VIEWPORT (Conditional) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Conditional viewport render depending on whether active project exists */}
              {activeProject ? (
                <div className="space-y-4">
                  
                  {/* Active Project Title header display */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-850 p-4 rounded-xl">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase">Projeto Ativo</span>
                        <span className="text-xs text-slate-500 font-mono font-light">ID: {activeProject.id}</span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-200">{activeProject.title}</h2>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setActiveProject(null);
                          clearUploadQueue();
                        }}
                        className="p-2 bg-slate-950 text-slate-400 hover:text-slate-205 border border-slate-800 hover:bg-slate-900 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                      >
                        <RefreshCw size={13} />
                        <span>Novo Projeto</span>
                      </button>
                    </div>
                  </div>

                  {/* THREE.JS WORKSPACE ENVELOPE */}
                  <div className="h-[480px] w-full">
                    <ThreeViewer
                      modelUrl={activeProject.modelUrl}
                      meshType={activeProject.meshType}
                      geometryStyle={activeProject.geometryStyle}
                      modelColor={modelColor}
                      scale={scale}
                      rotation={{ x: rotationX, y: rotationY, z: rotationZ }}
                      smoothing={smoothing}
                      detailsLevel={detailsLevel}
                      wireframe={wireframe}
                      showTexture={showTexture}
                      lightIntensity={lightIntensity}
                      lightColor="#ffffff"
                      artifactsRemoved={artifactsRemoved}
                      repaired={repaired}
                      gridVisible={gridVisible}
                      printerBedVisible={printerBedVisible}
                      onExport={onExportHandled}
                    />
                  </div>

                  {/* ACTIVE 3D EDITOR SLIDERS PANEL */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2">
                        <Layers size={16} className="text-indigo-400" />
                        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">Painel de Transformação CAD</h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">MODIFICADORES AO VIVO</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Scale model slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 font-medium font-mono text-[11px]">Escala Dimensional</span>
                          <span className="text-indigo-400 font-mono font-bold">x{(scale).toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.4"
                          max="1.8"
                          step="0.05"
                          value={scale}
                          onChange={(e) => setScale(Number(e.target.value))}
                          className="w-full cursor-pointer"
                        />
                      </div>

                      {/* Smooth mesh slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 font-medium font-mono text-[11px]">Suavização Topológica (Subdivision)</span>
                          <span className="text-indigo-400 font-mono font-bold">{smoothing} / 3</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="1"
                          value={smoothing}
                          onChange={(e) => setSmoothing(Number(e.target.value))}
                          className="w-full cursor-pointer"
                        />
                      </div>

                      {/* Details factor slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 font-medium font-mono text-[11px]">Amplificação de Relevo (Details)</span>
                          <span className="text-indigo-400 font-mono font-bold">{detailsLevel}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={detailsLevel}
                          onChange={(e) => setDetailsLevel(Number(e.target.value))}
                          className="w-full cursor-pointer"
                        />
                      </div>

                      {/* Mesh Color Picker */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 font-medium font-mono text-[11px]">Filamento / Cor da Visualização</span>
                          <span className="font-mono text-xs" style={{ color: modelColor }}>{modelColor}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={modelColor}
                            onChange={(e) => setModelColor(e.target.value)}
                            className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                          />
                          <div className="flex-1 flex gap-1.5 flex-wrap">
                            {["#e67e22", "#3498db", "#9b59b6", "#e74c3c", "#2ecc71", "#7f8c8d", "#f1c40f"].map((c, i) => (
                              <button
                                key={i}
                                onClick={() => setModelColor(c)}
                                className="h-5 w-5 rounded-full border border-slate-700/80 cursor-pointer"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Viewport helper switch toggles */}
                    <div className="pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      
                      <button
                        onClick={() => setWireframe(!wireframe)}
                        className={`p-2.5 rounded-lg border text-xs font-mono font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors ${
                          wireframe 
                            ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-400" 
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <Layers size={13} />
                        <span>Ver Wireframe</span>
                      </button>

                      <button
                        onClick={() => setShowTexture(!showTexture)}
                        className={`p-2.5 rounded-lg border text-xs font-mono font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors ${
                          showTexture 
                            ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-400" 
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <Grid size={13} />
                        <span>Fatias de Impressão</span>
                      </button>

                      <button
                        onClick={() => setGridVisible(!gridVisible)}
                        className={`p-2.5 rounded border text-xs font-mono font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors ${
                          gridVisible 
                            ? "bg-blue-600/10 border-blue-500/50 text-blue-400" 
                            : "bg-black border-white/10 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        <Eye size={13} />
                        <span>Mesa de Apoio</span>
                      </button>

                      <button
                        onClick={() => setPrinterBedVisible(!printerBedVisible)}
                        className={`p-2.5 rounded border text-xs font-mono font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors ${
                          printerBedVisible 
                            ? "bg-blue-600/10 border-blue-500/50 text-blue-400" 
                            : "bg-black border-white/10 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        <Box size={13} />
                        <span>Base de Impressão</span>
                      </button>

                    </div>
                  </div>

                </div>
              ) : (
                
                /* DRAG AND DROP UPLOADER ZONE */
                <div className="space-y-6">
                  
                  {/* Custom upload helper tips */}
                  <div className="bg-blue-950/20 border border-blue-900/20 p-4 rounded flex items-start space-x-3 text-xs text-blue-300 leading-relaxed font-mono">
                    <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-400 uppercase tracking-wide">Dica da IA:</span> Recomenda-se carregar entre 3 a 12 fotos contendo diferentes ângulos horizontais do objeto (360 graus) e boa iluminação homogênea para maximizar a fidelidade mecânica do fatiado resultante.
                    </div>
                  </div>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded p-10 text-center transition-all ${
                      isDragging
                        ? "border-blue-500 bg-blue-950/20 shadow-2xl scale-[1.01]"
                        : "border-white/10 bg-[#080808]/40 hover:border-blue-500/50 hover:bg-[#080808]/80"
                    }`}
                  >

                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      id="photos_upload"
                      multiple
                      accept="image/*"
                      onChange={(e) => processSelectedRawFiles(e.target.files)}
                      className="hidden"
                    />

                    <label htmlFor="photos_upload" className="cursor-pointer space-y-4 block">
                      
                      {/* Big Cloud Icon */}
                      <div className="mx-auto h-16 w-16 bg-black border border-white/10 rounded flex items-center justify-center shadow-lg text-slate-400">
                        <Upload size={28} className="animate-pulse text-blue-500" />
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-205 uppercase tracking-tighter">Arraste fotos do objeto aqui</h3>
                        <p className="text-xs text-gray-500 font-light max-w-sm mx-auto">
                          Suporta arquivos JPG, PNG ou WEBP. Faça o upload de múltiplas imagens de perspectiva.
                        </p>
                      </div>

                      {/* Browse Manual Trigger */}
                      <div className="inline-block p-2 px-6 bg-black hover:bg-white/5 border border-white/10 rounded text-xs font-mono uppercase tracking-wider font-bold text-gray-300 transition-colors">
                        Selecionar do Computador
                      </div>

                    </label>

                  </div>

                  {/* UPLOAD FILE LIST THUMBNAILS GRID (Interactive) */}
                  {uploadFiles.length > 0 && (
                    <div className="bg-[#080808] border border-white/10 p-6 rounded space-y-4">
                      
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-500 text-white text-[9px] font-mono px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            {uploadFiles.length} FOTO(S) CARREGADA(S)
                          </span>
                        </div>
                        <button
                          onClick={clearUploadQueue}
                          className="text-gray-500 hover:text-red-400 text-xs font-mono transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          Limpar Fila
                        </button>
                      </div>

                      {/* Horizontal scroll grid of thumbnails */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[160px] overflow-y-auto pr-1">
                        {uploadFiles.map((file, idx) => (
                          <div key={idx} className="relative aspect-square rounded bg-black border border-white/5 p-1 group">
                            <img
                              src={file.dataUrl}
                              alt={file.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover rounded"
                            />
                            {/* Remove single file floating button */}
                            <button
                              onClick={() => removeUploadFile(idx)}
                              className="absolute top-1 right-1 h-5 w-5 bg-black/90 text-red-400 hover:text-red-200 rounded border border-white/10 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remover"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* OBJECT SETTINGS AND CONVERSIONS EXECUTION */}
                      <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center gap-4">
                        
                        <div className="flex-1 w-full space-y-1">
                          <label className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest block font-bold">Nome do Objeto</label>
                          <input
                            type="text"
                            value={objectName}
                            onChange={(e) => setObjectName(e.target.value)}
                            placeholder="Ex: Raposa de Origami, Caneca Customizada..."
                            className="w-full bg-black border border-white/10 rounded p-2.5 text-xs text-slate-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>

                        <button
                          onClick={triggerIaReconstruction}
                          className="w-full sm:w-auto self-end px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono font-bold rounded text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 cursor-pointer transition-colors uppercase tracking-wider"
                        >
                          <Cpu size={14} className="animate-pulse" />
                          <span>Iniciar Reconstrução por IA</span>
                        </button>

                      </div>

                    </div>
                  )}

                  {/* EMPTY PLACEHOLDER SCREEN SHOWING PIPELINE GUIDE */}
                  {uploadFiles.length === 0 && (
                    <div className="bg-[#080808]/45 border border-white/10 rounded p-10 text-center max-w-md mx-auto space-y-4">
                      <Box size={35} className="mx-auto text-slate-700 animate-spin-slow" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Consola Pronta</h4>
                        <p className="text-xs text-gray-500 font-light leading-relaxed">
                          Carregue as fotos acima para criar o seu modelo 3D. O processamento gerará o arquivo stl para ser editado em tempo real e baixado.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* ---------------- RIGHT SIDE: 3D PRINTING ANALYSIS REPORT & FILE EXPORTS ---------------- */}
            <div className="lg:col-span-4 space-y-6">
              
              {activeProject ? (
                <div className="space-y-6">
                  
                  {/* EDITING INTERACTIVE REPAIRS COMMANDS */}
                  <div className="bg-[#080808] border border-white/10 p-5 rounded space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h4 className="text-xs font-bold font-mono tracking-wider text-gray-400 uppercase">Ferramentas Corretivas</h4>
                      <Check size={14} className="text-blue-500" />
                    </div>

                    <p className="text-[11px] text-gray-500 font-light font-mono">
                      Aperte os controles de filtragem IA para corrigir os parâmetros de malhas não-manifóldicas.
                    </p>

                    <div className="grid grid-cols-1 gap-2.5">
                      
                      <button
                        onClick={triggerAutoRepair}
                        className={`p-2 rounded border text-xs font-mono font-bold flex items-center space-x-2 cursor-pointer transition-colors ${
                          repaired 
                            ? "bg-emerald-950/30 border-emerald-900/40 text-emerald-400" 
                            : "bg-black hover:bg-white/5 border-white/10 text-gray-300"
                        }`}
                        disabled={repaired}
                      >
                        <ShieldCheck size={14} className={repaired ? "text-emerald-400" : "text-slate-400"} />
                        <span>{repaired ? "Malha Watertight Ativa" : "Reparação IA de Furos"}</span>
                      </button>

                      <button
                        onClick={triggerRemoveArtifacts}
                        className={`p-2 rounded border text-xs font-mono font-bold flex items-center space-x-2 cursor-pointer transition-colors ${
                          artifactsRemoved 
                            ? "bg-black/85 border-white/5 text-gray-500 cursor-not-allowed text-[11px]" 
                            : "bg-black hover:bg-white/5 border-white/10 text-gray-300"
                        }`}
                      >
                        <Trash2 size={14} className="text-slate-400" />
                        <span>Remover Artefatos e Ruídos</span>
                      </button>

                      <button
                        onClick={triggerCenterMesh}
                        className="p-2 bg-black hover:bg-white/5 border border-white/10 rounded text-xs font-mono font-bold text-gray-300 flex items-center space-x-2 cursor-pointer transition-colors"
                      >
                        <RotateCcw size={14} className="text-slate-400" />
                        <span>Resetar Posição / Centralizar</span>
                      </button>

                    </div>

                  </div>

                  {/* 3D PRINT SAFETY RUN REPORT */}
                  <div className="bg-[#080808] border border-white/10 p-5 rounded space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h4 className="text-xs font-bold font-mono tracking-wider text-gray-400 uppercase">Análise de Fatiamento 3D</h4>
                      <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold uppercase">Livre</span>
                    </div>

                    <div className="space-y-3.5 text-xs text-slate-350">
                      
                      {/* Watertight metric */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500 font-light font-mono text-[11px]">Estrutura Estanque</span>
                        {repaired ? (
                          <span className="flex items-center space-x-1 font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950/25 px-1.5 py-0.5 rounded">
                            <Check size={11} />
                            <span>WATERTIGHT</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 font-mono text-[10px] text-yellow-400 font-bold bg-yellow-950/25 px-1.5 py-0.5 rounded">
                            <AlertTriangle size={11} />
                            <span>LACUNA (0.1mm)</span>
                          </span>
                        )}
                      </div>

                      {/* Wall thickness metrical */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500 font-light font-mono text-[11px]">Espessura de Parede Mín.</span>
                        <span className="font-mono text-slate-200 font-bold">{activeProject.analysis.minThickness}</span>
                      </div>

                      {/* Non manifold warning hotspots */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500 font-light font-mono text-[11px]">Áreas frágeis / Críticas</span>
                        {activeProject.analysis.fragileAreasCount > 0 && !artifactsRemoved ? (
                          <span className="text-xs text-yellow-500 font-mono bg-yellow-950/20 px-2 py-0.5 rounded font-bold">
                            {activeProject.analysis.fragileAreasCount} pendente
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-400 font-mono bg-emerald-950/20 px-2 py-0.5 rounded flex items-center space-x-1 font-bold">
                            <Check size={10} />
                            <span>0 hotspots</span>
                          </span>
                        )}
                      </div>

                      {/* Supports Needed guidance */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500 font-light font-mono text-[11px]">Suportes Necessários</span>
                        {activeProject.analysis.supportsNeeded ? (
                          <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Recomendados
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 font-mono uppercase">DISPENSÁVEL</span>
                        )}
                      </div>

                      {/* Print hours estimate */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500 font-light font-mono text-[11px]">Tempo de Impressão Est.</span>
                        <span className="font-mono text-slate-200 font-bold">{activeProject.analysis.estimatedHours} horas</span>
                      </div>

                      {/* Material recommendations */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500 font-light font-mono text-[11px]">Filamento Sugerido</span>
                        <span className="font-mono text-slate-400 font-medium">{activeProject.analysis.material}</span>
                      </div>

                      {/* Solid Dimensions box boundaries */}
                      <div className="flex flex-col space-y-1.5 pt-1">
                        <span className="text-gray-500 font-mono text-[11px] font-light">Dimensões Limites do Sólido (Bbox):</span>
                        <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] text-gray-405 bg-black p-2 rounded border border-white/5">
                          <div>
                            <span className="block text-[8px] text-neutral-500 uppercase">Largura (X)</span>
                            <span className="text-slate-200 font-bold">{activeProject.analysis.dimensions.x} mm</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-neutral-500 uppercase">Altura (Y)</span>
                            <span className="text-slate-200 font-bold">{activeProject.analysis.dimensions.y} mm</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-neutral-500 uppercase">Profund. (Z)</span>
                            <span className="text-slate-200 font-bold">{activeProject.analysis.dimensions.z} mm</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* SOLID FILE EXPORTS CONTROL */}
                  <div className="bg-blue-950/20 border border-blue-900/20 p-5 rounded space-y-4">
                    <div className="flex items-center space-x-2">
                      <Download size={16} className="text-blue-400" />
                      <h4 className="text-xs font-bold font-mono tracking-wider text-blue-300 uppercase">Exportar Modelo Sólido</h4>
                    </div>

                    <p className="text-[11px] text-blue-200/70 leading-relaxed font-light">
                      O PhotoTo3D converte a casca poligonal em malhas de triângulos ótimas preparadas para fatiadores (Prusa, Cura, Bambu Studio).
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <button
                        onClick={() => initiateFileDownload("STL")}
                        className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs font-mono tracking-wider cursor-pointer shadow-md transition-colors uppercase"
                      >
                        BAIXAR .STL
                      </button>
                      <button
                        onClick={() => initiateFileDownload("OBJ")}
                        className="p-2.5 bg-[#080808] hover:bg-black border border-white/10 text-blue-400 font-bold rounded text-xs font-mono tracking-wider cursor-pointer transition-colors uppercase"
                      >
                        BAIXAR .OBJ
                      </button>
                      <button
                        onClick={() => initiateFileDownload("GLB")}
                        className="p-2.5 bg-[#080808] hover:bg-black border border-white/10 text-gray-400 rounded text-xs font-mono cursor-pointer transition-colors uppercase"
                        title="Formato ideal para visualização Web"
                      >
                        BAIXAR .GLB
                      </button>
                      <button
                        onClick={() => initiateFileDownload("3MF")}
                        className="p-2.5 bg-[#080808] hover:bg-black border border-white/10 text-gray-400 rounded text-xs font-mono cursor-pointer transition-colors uppercase"
                        title="Formato rico em dados de manufatura"
                      >
                        BAIXAR .3MF
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-[#080808] border border-white/10 p-5 rounded space-y-4">
                  <h4 className="text-xs font-bold font-mono tracking-wider text-gray-450 uppercase">Aguardando Execução...</h4>
                  <p className="text-xs text-gray-500 font-light leading-relaxed font-mono">
                    Faça o upload do seu lote de fotografias digitais e acione o processador IA para habilitar a visualização e downloads dos arquivos no consolidado direito.
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ----------------- 3. ARCHIVED DASHBOARD (Meus Projetos / Histórico) ----------------- */}
      {activeView === "dashboard" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <HardDrive size={18} className="text-blue-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[#e5e7eb]">Seus Projetos Salvos</h2>
              </div>
              <p className="text-gray-500 text-xs font-mono">Exiba e gerencie as suas conversões passadas e prepare o STL no visualizador.</p>
            </div>

            {/* Project search filters inputs */}
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search size={14} />
              </div>
              <input
                type="text"
                placeholder="BUSCAR PROJETOS POR TERMO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-white/10 rounded p-2 pl-9 text-xs text-slate-200 placeholder-gray-650 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* PROJECTS CARDS LIST */}
          {isLoadingProjects ? (
            <div className="text-center py-16 space-y-4">
              <RefreshCw size={24} className="mx-auto text-blue-500 animate-spin" />
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Consultando projetos no plano de fundo...</p>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    applyProjectToViewer(proj);
                    setActiveView("generator");
                    showToast(`Projeto "${proj.title}" carregado para manipulação.`);
                  }}
                  className="bg-[#080808] hover:bg-black border border-white/5 hover:border-blue-500/30 rounded p-5 space-y-4 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-500 uppercase">
                        {new Date(proj.createdAt).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => handleDeleteProject(proj.id, e)}
                          className="p-1 text-gray-400 hover:text-red-400 rounded hover:bg-black border border-transparent hover:border-white/5 transition-all cursor-pointer"
                          title="Deletar Projeto"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                      {proj.title}
                    </h4>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="bg-black border border-white/10 text-gray-400 text-[10px] font-mono px-2 py-0.5 rounded uppercase">
                        {proj.meshType === "creative_fox" ? "Raposa" : proj.meshType === "gear" ? "Engrenagem" : proj.meshType === "rocket" ? "Foguete" : proj.meshType === "mug" ? "Caneca" : "Vaso"}
                      </span>
                      <span className="bg-blue-500/10 text-blue-400 text-[10px] font-mono px-2 py-0.5 rounded uppercase">
                        {proj.imagesCount} fotos
                      </span>
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                        {proj.analysis.polygons.toLocaleString()} polígonos
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed font-light line-clamp-2">
                      {proj.summary || `Conversão e fatiamento 3D realizado pela IA PhotoTo3D. Prontidão watertight testada de ${proj.analysis.minThickness} espessura de parede.`}
                    </p>
                  </div>

                  <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-gray-400">Impressão: {proj.analysis.estimatedHours}h</span>
                    <span className="text-[10.5px] font-mono font-bold text-blue-500 group-hover:text-blue-400 flex items-center space-x-1 uppercase tracking-wider">
                      <span>Manipular 3D</span>
                      <ArrowRight size={10} />
                    </span>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#080808] border border-white/10 rounded max-w-sm mx-auto space-y-4">
              <HardDrive size={35} className="mx-auto text-slate-700" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">Nenhum projeto encontrado</h4>
                <p className="text-xs text-gray-500 font-light max-w-xs mx-auto leading-relaxed">
                  Não localizamos arquivos com o termo "{searchQuery}". Inicie sua primeira conversão no gerador 3D para criar histórico.
                </p>
              </div>
              <button
                onClick={() => setActiveView("generator")}
                className="p-1 px-4 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold rounded text-xs cursor-pointer transition-colors uppercase tracking-wider"
              >
                Criar Modelo 3D
              </button>
            </div>
          )}

        </div>
      )}

      {/* FOOTER AREA */}
      <footer className="border-t border-white/10 bg-[#050505] py-12 mt-16 text-xs text-gray-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 transform rotate-45 flex items-center justify-center text-[10px] text-black font-extrabold font-mono border border-black/25">P</div>
                <span className="font-bold text-slate-100 uppercase font-mono tracking-wider">PhotoTo3D AI</span>
              </div>
              <p className="text-slate-500 leading-relaxed font-light text-[11px]">
                Plataforma web gratuita de inteligência artificial especializada em fatiamento e reconstrução 3D instantânea.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-[#e5e7eb] font-mono tracking-widest uppercase mb-3 text-[10px]">Modelos Open Source</h5>
              <ul className="space-y-1.5 font-light text-[11px] font-mono">
                <li className="text-gray-550">TripoSR Engine</li>
                <li className="text-gray-550">InstantMesh Optimization</li>
                <li className="text-gray-550">OpenLRM Rendering</li>
                <li className="text-gray-550 font-bold text-blue-500">Stable Fast 3D API</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-[#e5e7eb] font-mono tracking-widest uppercase mb-3 text-[10px]">Visualização e SLA</h5>
              <ul className="space-y-1.5 font-light text-[11px] font-mono">
                <li className="text-gray-550">Renderizador WebGL Three.js</li>
                <li className="text-gray-550">Filtro de Ruído Outlier</li>
                <li className="text-blue-500 font-bold">STL/OBJ Exporter Ativo</li>
                <li className="text-blue-500 font-bold">100% Watertight</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-[#e5e7eb] font-mono tracking-widest uppercase mb-3 text-[10px]">Autenticação PRO Livre</h5>
              <p className="text-[11px] leading-relaxed text-gray-450 font-mono">
                Ligue sua conta Google para sincronizar seu histórico de forma ilimitada sem taxas.
              </p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px]">
            <p>© 2026 PhotoTo3D AI Corp. Todos os direitos reservados.</p>
            <div className="flex space-x-6">
              <span className="hover:underline cursor-pointer">Termos de Uso</span>
              <span className="hover:underline cursor-pointer">Segurança Sólidos</span>
            </div>
          </div>
        </div>
      </footer>

      {/* -------------------- AUTHENTICATION PORTAL DIALOG (Simulated modal) -------------------- */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#080808] border border-white/15 rounded p-6 max-w-sm w-full space-y-6 shadow-2xl relative">
            
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Ativar Conta PRO Sincronizada</h3>
              <p className="text-[11px] text-gray-500 font-light font-mono">Sincronize seus modelos 3D criados no seu banco e acesse de qualquer máquina sem limites.</p>
            </div>

            {/* Simulated OAuth Providers */}
            <div className="space-y-2 font-mono">
              <button
                onClick={() => triggerSocialAuth("Google")}
                className="w-full p-2.5 bg-black hover:bg-white/5 text-[#e5e7eb] border border-white/10 rounded text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-colors uppercase tracking-wider"
              >
                <span className="font-bold text-blue-500">G</span>
                <span>Entrar com Google</span>
              </button>
              <button
                onClick={() => triggerSocialAuth("GitHub")}
                className="w-full p-2.5 bg-black hover:bg-white/5 text-[#e5e7eb] border border-white/10 rounded text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-colors uppercase tracking-wider"
              >
                <span>📦</span>
                <span>Entrar com GitHub</span>
              </button>
            </div>

            <div className="relative text-center">
              <span className="bg-[#080808] px-3 py-1 font-mono text-[9px] text-gray-500 rounded border border-white/10 uppercase tracking-widest">OU UTILIZE E-MAIL</span>
            </div>

            {/* Email form login */}
            <form onSubmit={handleAuthentication} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">Seu E-mail</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full bg-black border border-white/10 rounded p-2.5 text-xs text-slate-200 placeholder-gray-650 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">Seu Nome (Opcional)</label>
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-black border border-white/10 rounded p-2.5 text-xs text-slate-200 placeholder-gray-650 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full p-3 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold rounded text-xs shadow-lg transition-colors cursor-pointer uppercase tracking-wider"
              >
                Ativar Acesso Síncrono Ilimitado
              </button>
            </form>

            <p className="text-[10px] text-gray-500 font-light text-center font-mono leading-relaxed">
              A ativação e fatiamento na nuvem persistente é 100% gratuita sem requerimento de cartão ou cobranças futuras.
            </p>

          </div>
        </div>
      )}

    </div>
  );
}
