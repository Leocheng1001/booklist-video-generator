import type { ApiResponse, Book, KnowledgePoint, Script, GeneratedImage, Project } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// 通用请求封装
async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络请求失败',
    };
  }
}

// 书籍相关API
export const bookApi = {
  // 搜索书籍
  search: async (keyword: string): Promise<ApiResponse<Book[]>> => {
    return request<Book[]>(`/books/search?keyword=${encodeURIComponent(keyword)}`);
  },

  // 上传PDF
  uploadPdf: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/pdfs/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      };
    }
  },

  // 提交PDF链接
  submitPdfUrl: async (url: string): Promise<ApiResponse<{ url: string }>> => {
    return request<{ url: string }>('/pdfs/url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },
};

// 知识点相关API
export const knowledgeApi = {
  // 生成知识点
  generate: async (projectId: string, requirement: string): Promise<ApiResponse<KnowledgePoint[]>> => {
    return request<KnowledgePoint[]>('/knowledge/generate', {
      method: 'POST',
      body: JSON.stringify({ projectId, requirement }),
    });
  },

  // 更新知识点
  update: async (projectId: string, points: KnowledgePoint[]): Promise<ApiResponse<void>> => {
    return request<void>('/knowledge/update', {
      method: 'POST',
      body: JSON.stringify({ projectId, points }),
    });
  },
};

// 脚本相关API
export const scriptApi = {
  // 生成脚本
  generate: async (projectId: string): Promise<ApiResponse<Script>> => {
    return request<Script>('/scripts/generate', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  },

  // 更新脚本
  update: async (projectId: string, script: Script): Promise<ApiResponse<void>> => {
    return request<void>('/scripts/update', {
      method: 'POST',
      body: JSON.stringify({ projectId, script }),
    });
  },
};

// 图片相关API
export const imageApi = {
  // 生成图片
  generate: async (projectId: string): Promise<ApiResponse<GeneratedImage[]>> => {
    return request<GeneratedImage[]>('/images/generate', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  },

  // 重新生成单张图片
  regenerate: async (projectId: string, imageId: string): Promise<ApiResponse<GeneratedImage>> => {
    return request<GeneratedImage>('/images/regenerate', {
      method: 'POST',
      body: JSON.stringify({ projectId, imageId }),
    });
  },
};

// 视频相关API
export const videoApi = {
  // 生成视频
  generate: async (projectId: string): Promise<ApiResponse<{ url: string }>> => {
    return request<{ url: string }>('/videos/generate', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  },

  // 查询项目状态
  getStatus: async (projectId: string): Promise<ApiResponse<Project>> => {
    return request<Project>(`/projects/${projectId}`);
  },
};

// 项目相关API
export const projectApi = {
  // 创建项目
  create: async (bookName: string): Promise<ApiResponse<Project>> => {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ bookName }),
    });
  },

  // 获取项目
  get: async (projectId: string): Promise<ApiResponse<Project>> => {
    return request<Project>(`/projects/${projectId}`);
  },

  // 更新项目
  update: async (projectId: string, data: Partial<Project>): Promise<ApiResponse<Project>> => {
    return request<Project>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
