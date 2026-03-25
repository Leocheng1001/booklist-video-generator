import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkflowStatusType, Project, KnowledgePoint, Script, GeneratedImage } from '@/types';
import { WorkflowStatus } from '@/types';

interface WorkflowState {
  // 当前项目
  project: Project | null;
  
  // 当前步骤
  currentStep: number;
  
  // 加载状态
  isLoading: boolean;
  
  // 错误信息
  error: string | null;

  // 派生状态
  knowledgePoints: KnowledgePoint[];
  script: Script | null;
  images: GeneratedImage[];
  
  // Actions
  initProject: (bookName: string) => void;
  setProjectStatus: (status: WorkflowStatusType, progress?: number) => void;
  setBookPdf: (pdfUrl: string) => void;
  setUserRequirement: (requirement: string) => void;
  setKnowledgePoints: (points: KnowledgePoint[]) => void;
  updateKnowledgePoint: (id: string, content: string) => void;
  setScript: (script: Script) => void;
  updateScriptScene: (sceneId: number, content: string) => void;
  setImages: (images: GeneratedImage[]) => void;
  updateImage: (imageId: string, url: string) => void;
  setVideoUrl: (url: string) => void;
  setError: (error: string | null) => void;
  setCurrentStep: (step: number) => void;
  resetProject: () => void;
}

const initialProject: Project = {
  id: '',
  status: WorkflowStatus.IDLE,
  bookName: '',
  bookPdfUrl: '',
  userRequirement: '',
  knowledgePoints: [],
  script: null,
  images: [],
  videoUrl: '',
  progress: 0,
  currentStep: 0,
};

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      project: null,
      currentStep: 0,
      isLoading: false,
      error: null,
      knowledgePoints: [],
      script: null,
      images: [],

      initProject: (bookName: string) => {
        const newProject: Project = {
          ...initialProject,
          id: Date.now().toString(),
          bookName,
          status: WorkflowStatus.IDLE,
        };
        set({ 
          project: newProject, 
          currentStep: 0, 
          error: null,
          knowledgePoints: [],
          script: null,
          images: [],
        });
      },

      setProjectStatus: (status: WorkflowStatusType, progress?: number) => {
        const { project } = get();
        if (project) {
          set({
            project: {
              ...project,
              status,
              progress: progress !== undefined ? progress : project.progress,
            },
          });
        }
      },

      setBookPdf: (pdfUrl: string) => {
        const { project } = get();
        if (project) {
          set({
            project: {
              ...project,
              bookPdfUrl: pdfUrl,
              status: WorkflowStatus.DOWNLOADING,
              progress: 20,
            },
          });
        }
      },

      setUserRequirement: (requirement: string) => {
        const { project } = get();
        if (project) {
          set({
            project: {
              ...project,
              userRequirement: requirement,
            },
          });
        }
      },

      setKnowledgePoints: (points: KnowledgePoint[]) => {
        const { project } = get();
        if (project) {
          set({
            project: {
              ...project,
              knowledgePoints: points,
              status: WorkflowStatus.SUMMARIZING,
              progress: 40,
            },
            knowledgePoints: points,
          });
        }
      },

      updateKnowledgePoint: (id: string, content: string) => {
        const { project } = get();
        if (project) {
          const updatedPoints = project.knowledgePoints.map((p) =>
            p.id === id ? { ...p, content } : p
          );
          set({
            project: {
              ...project,
              knowledgePoints: updatedPoints,
            },
            knowledgePoints: updatedPoints,
          });
        }
      },

      setScript: (script: Script) => {
        const { project } = get();
        if (project) {
          set({
            project: {
              ...project,
              script,
              status: WorkflowStatus.SCRIPTING,
              progress: 60,
            },
            script,
          });
        }
      },

      updateScriptScene: (sceneId: number, content: string) => {
        const { project } = get();
        if (project && project.script) {
          const updatedScript = {
            ...project.script,
            scenes: project.script.scenes.map((s) =>
              s.id === sceneId ? { ...s, content } : s
            ),
          };
          set({
            project: {
              ...project,
              script: updatedScript,
            },
            script: updatedScript,
          });
        }
      },

      setImages: (images: GeneratedImage[]) => {
        const { project } = get();
        if (project) {
          set({
            project: {
              ...project,
              images,
              status: WorkflowStatus.GENERATING_IMAGES,
              progress: 80,
            },
            images,
          });
        }
      },

      updateImage: (imageId: string, url: string) => {
        const { project } = get();
        if (project) {
          const updatedImages = project.images.map((img) =>
            img.id === imageId ? { ...img, url, status: 'completed' as const } : img
          );
          set({
            project: {
              ...project,
              images: updatedImages,
            },
            images: updatedImages,
          });
        }
      },

      setVideoUrl: (url: string) => {
        const { project } = get();
        if (project) {
          set({
            project: {
              ...project,
              videoUrl: url,
              status: WorkflowStatus.COMPLETED,
              progress: 100,
            },
          });
        }
      },

      setError: (error: string | null) => {
        set({ error });
        if (error) {
          const { project } = get();
          if (project) {
            set({
              project: {
                ...project,
                status: WorkflowStatus.ERROR,
                errorMessage: error,
              },
            });
          }
        }
      },

      setCurrentStep: (step: number) => {
        set({ currentStep: step });
      },

      resetProject: () => {
        set({ 
          project: null, 
          currentStep: 0, 
          error: null,
          knowledgePoints: [],
          script: null,
          images: [],
        });
      },
    }),
    {
      name: 'workflow-storage',
    }
  )
);
