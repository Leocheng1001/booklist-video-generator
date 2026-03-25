// 工作流状态
export const WorkflowStatus = {
  IDLE: 'idle',
  DOWNLOADING: 'downloading',
  SUMMARIZING: 'summarizing',
  SCRIPTING: 'scripting',
  REVIEW_SCRIPT: 'review_script',
  GENERATING_IMAGES: 'generating_images',
  REVIEW_IMAGES: 'review_images',
  COMPOSING_VIDEO: 'composing_video',
  REVIEW_VIDEO: 'review_video',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const;

export type WorkflowStatusType = typeof WorkflowStatus[keyof typeof WorkflowStatus];

// 项目数据
export interface Project {
  id: string;
  status: WorkflowStatusType;
  bookName: string;
  bookPdfUrl: string;
  userRequirement: string;
  knowledgePoints: KnowledgePoint[];
  script: Script | null;
  images: GeneratedImage[];
  videoUrl: string;
  progress: number;
  currentStep: number;
  errorMessage?: string;
}

// 知识点
export interface KnowledgePoint {
  id: string;
  title: string;
  content: string;
  category: 'concept' | 'insight' | 'quote' | 'advice' | 'case';
}

// 脚本
export interface Script {
  id: string;
  title: string;
  scenes: Scene[];
  totalDuration: number;
}

// 分镜
export interface Scene {
  id: number;
  content: string;
  visualDesc: string;
  duration: number;
  imageUrl?: string;
}

// 生成的图片
export interface GeneratedImage {
  id: string;
  sceneId: number;
  url: string;
  prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
}

// 书籍信息
export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  pdfUrl?: string;
}

// API响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
