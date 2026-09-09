// Datos de los proyectos de investigación (bilingüe). Fuente única compartida por
// scripts/seed-research.mjs (DB) y el actualizador de static-data.json.
// Campos por item: title, description, institution(+Url), department(+Url),
// startDate, endDate (vacío = "Presente"), images[], bullets[], tech[].

export const researchEn = [
  {
    title: "Brain-Computer Interface",
    description:
      "State-funded project, focused on the creation of an essential communication system for hemiplegic patients.",
    institution: "UTEC",
    institutionUrl: "",
    department: "Departamento de Ingeniería Electrónica",
    departmentUrl: "",
    startDate: "",
    endDate: "",
    images: [],
    bullets: [
      "Enhanced Brain-Computer Interface performance by 10% using advanced digital signal processing and ML algorithms.",
      "Built a custom C++ user interface for brain signal acquisition based on ERP and sensorimotor rhythms.",
      "Optimized EEG data acquisition and channel selection by applying Python's statistical and CSP methods.",
    ],
    tech: ["Python", "TensorFlow", "Torch", "C++", "MATLAB", "EEG Signals Analysis"],
  },
  {
    title: "Mining Robot",
    description:
      "State-funded project, focused on building an autonomous robot to detect toxic gases in underground mines.",
    institution: "Universidad Nacional de Ingeniería (UNI)",
    institutionUrl: "",
    department: "Centro de Tecnologías de Información y Comunicaciones (CTIC)",
    departmentUrl: "",
    startDate: "",
    endDate: "",
    images: [],
    bullets: [
      "Improved the robotic exo-arm's movement precision by 5% by implementing Fuzzy Logic and Advanced Controllers.",
      "Developed a real-time object recognition system for polygons and hand gestures using Python and OpenCV.",
      "Designed and implemented robust navigation and route planning algorithms using both MATLAB and C++.",
    ],
    tech: ["Python", "Genetic Algorithms", "C++", "MATLAB", "Robotics"],
  },
  {
    title: "NeuroVision — Deep Learning for 3D Brain Neuroimaging Segmentation",
    description:
      "Research workspace for reproducible 3D segmentation of brain MRI and CT. It targets three public studies — pediatric tumor (BraTS-PEDs), ischemic stroke (ISLES'22) and intracranial hemorrhage (MBH-Seg) — training and validating MONAI/PyTorch networks per subject with clinical-style metrics, and is explicitly not presented as a medical device.",
    institution: "",
    institutionUrl: "",
    department: "",
    departmentUrl: "",
    startDate: "",
    endDate: "",
    images: [],
    bullets: [
      "Implemented 18 executable 3D segmentation networks (six per study) on MONAI/PyTorch — 3D U-Net, SegResNet, Attention U-Net, DynUNet, SwinUNETR, UNETR and V-Net; every selection reaches its real constructor with a forward/backward pass and documents parameter counts and primary references.",
      "Built a resumable training pipeline that checkpoints model, optimizer and AMP scaler together with the full RNG state (Python, NumPy, Torch CPU and CUDA) into atomic last.pt/best.pt files plus a JSON resume sidecar, keyed per (study + architecture + hyperparameters), with explicit CPU/GPU execution and mixed precision on CUDA.",
      "Validation runs 3D sliding-window inference and reports Dice, IoU, precision, sensitivity, specificity, 95% Hausdorff distance (MONAI) and absolute volume error; where labels are not public (e.g. BraTS Validation), metrics are returned as unavailable instead of being estimated.",
      "Wrote dataset connectors for three public studies without altering the source: BraTS-PEDs (257 labeled training subjects, whole-tumor target, DiceCE loss), ISLES'22 (DWI+ADC+FLAIR, DiceFocal loss for small lesions) and MBH-Seg (NCCT with multi-annotator masks fused by strict-majority consensus).",
      "Added a typed FastAPI backend whose long-running jobs stream progress over Server-Sent Events (persisted across restarts and cancellable), plus a React/TypeScript educational guide and an interactive glossary with SVG figures (voxel, planes, Dice/IoU, Hausdorff).",
    ],
    tech: ["PyTorch", "MONAI", "FastAPI", "Python", "React", "TypeScript", "nibabel", "NumPy", "SciPy", "Vite"],
  },
]

export const researchEs = [
  {
    title: "Interfaz Cerebro-Computadora",
    description:
      "Proyecto financiado por el Estado, enfocado en la creación de un sistema de comunicación esencial para pacientes con hemiplejía.",
    institution: "UTEC",
    institutionUrl: "",
    department: "Departamento de Ingeniería Electrónica",
    departmentUrl: "",
    startDate: "",
    endDate: "",
    images: [],
    bullets: [
      "Mejoré el rendimiento de la Interfaz Cerebro-Computadora en un 10% utilizando procesamiento digital de señales avanzado y algoritmos de ML.",
      "Construí una interfaz de usuario personalizada en C++ para la adquisición de señales cerebrales basada en ERP y ritmos sensoriomotores.",
      "Optimicé la adquisición de datos EEG y la selección de canales aplicando métodos estadísticos y CSP en Python.",
    ],
    tech: ["Python", "TensorFlow", "Torch", "C++", "MATLAB", "EEG Signals Analysis"],
  },
  {
    title: "Robot Minero",
    description:
      "Proyecto financiado por el Estado, enfocado en la construcción de un robot autónomo para detectar gases tóxicos en minas subterráneas.",
    institution: "Universidad Nacional de Ingeniería (UNI)",
    institutionUrl: "",
    department: "Centro de Tecnologías de Información y Comunicaciones (CTIC)",
    departmentUrl: "",
    startDate: "",
    endDate: "",
    images: [],
    bullets: [
      "Mejoré la precisión de movimiento del exobrazo robótico en un 5% implementando Lógica Difusa y controladores avanzados.",
      "Desarrollé un sistema de reconocimiento de objetos en tiempo real para polígonos y gestos de manos utilizando Python y OpenCV.",
      "Diseñé e implementé algoritmos robustos de navegación y planificación de rutas utilizando tanto MATLAB como C++.",
    ],
    tech: ["Python", "Genetic Algorithms", "C++", "MATLAB", "Robotics"],
  },
  {
    title: "NeuroVision — Deep Learning para Segmentación 3D en Neuroimagen",
    description:
      "Entorno de investigación para segmentación 3D reproducible de MRI y CT cerebral. Aborda tres estudios públicos: tumor pediátrico (BraTS-PEDs), ictus isquémico (ISLES'22) y hemorragia intracraneal (MBH-Seg), entrenando y validando redes MONAI/PyTorch por sujeto con métricas de estilo clínico, sin presentarse como dispositivo médico.",
    institution: "",
    institutionUrl: "",
    department: "",
    departmentUrl: "",
    startDate: "",
    endDate: "",
    images: [],
    bullets: [
      "Implementación de 18 redes de segmentación 3D ejecutables (seis por estudio) sobre MONAI/PyTorch: 3D U-Net, SegResNet, Attention U-Net, DynUNet, SwinUNETR, UNETR y V-Net; cada selección llega a su constructor real con paso forward/backward y documenta número de parámetros y referencias primarias.",
      "Pipeline de entrenamiento reanudable que guarda modelo, optimizador y escalador AMP junto con el estado RNG completo (Python, NumPy, Torch CPU y CUDA) en archivos atómicos last.pt/best.pt más un sidecar JSON de reanudación, identificados por (estudio + arquitectura + hiperparámetros), con ejecución CPU/GPU explícita y precisión mixta en CUDA.",
      "La validación ejecuta inferencia 3D sliding-window y reporta Dice, IoU, precisión, sensibilidad, especificidad, distancia de Hausdorff 95 (MONAI) y error absoluto de volumen; cuando las etiquetas no son públicas (por ejemplo, BraTS Validation), las métricas se devuelven como no disponibles en lugar de estimarse.",
      "Conectores de datos para tres estudios públicos sin modificar la fuente: BraTS-PEDs (257 sujetos de entrenamiento etiquetados, objetivo whole tumor, pérdida DiceCE), ISLES'22 (DWI+ADC+FLAIR, pérdida DiceFocal para lesiones pequeñas) y MBH-Seg (NCCT con máscaras multi-anotador fusionadas por consenso de mayoría estricta).",
      "Backend FastAPI tipado cuyos trabajos prolongados transmiten progreso por Server-Sent Events (con persistencia entre reinicios y cancelación), más una guía educativa en React/TypeScript y un glosario interactivo con figuras SVG (voxel, planos, Dice/IoU, Hausdorff).",
    ],
    tech: ["PyTorch", "MONAI", "FastAPI", "Python", "React", "TypeScript", "nibabel", "NumPy", "SciPy", "Vite"],
  },
]

export const researchData = { en: { items: researchEn }, es: { items: researchEs } }
