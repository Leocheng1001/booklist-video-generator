import { useState } from 'react';
import { Image, RefreshCw, Check, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWorkflowStore } from '@/stores/workflowStore';
import { imageApi, videoApi } from '@/api';
import { WorkflowStatus } from '@/types';
import { toast } from 'sonner';

export function ImagePreview() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  
  const { project, images, script, setVideoUrl, setCurrentStep, setProjectStatus } = useWorkflowStore();

  const handleRegenerate = async (imageId: string) => {
    setRegeneratingId(imageId);
    try {
      const response = await imageApi.regenerate(project!.id, imageId);
      if (response.success && response.data) {
        // updateImage(imageId, response.data.url);
        toast.success('图片重新生成成功');
      } else {
        toast.error(response.error || '重新生成失败');
      }
    } catch (error) {
      toast.error('重新生成出错');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true);
    setProjectStatus(WorkflowStatus.COMPOSING_VIDEO, 90);

    try {
      const response = await videoApi.generate(project!.id);
      if (response.success && response.data) {
        setVideoUrl(response.data.url);
        toast.success('视频生成成功');
        setCurrentStep(6);
      } else {
        toast.error(response.error || '生成失败');
      }
    } catch (error) {
      toast.error('生成出错，请稍后重试');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const allImagesReady = images.every((img) => img.status === 'completed');
  const completedCount = images.filter((img) => img.status === 'completed').length;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          配图预览
        </h2>
        <p className="text-gray-600">
          AI为每个分镜生成的配图，你可以重新生成不满意的图片
        </p>
        <div className="mt-3">
          <Badge variant="secondary" className="text-sm">
            <Check className="w-4 h-4 mr-1" />
            {completedCount} / {images.length} 张图片已生成
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {images.map((img, index) => (
          <Card key={img.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-100 relative group">
              {img.status === 'completed' ? (
                <>
                  <img
                    src={img.url}
                    alt={`Scene ${img.sceneId}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedImage(img.url)}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRegenerate(img.id)}
                      disabled={regeneratingId === img.id}
                    >
                      {regeneratingId === img.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      重新生成
                    </Button>
                  </div>
                </>
              ) : img.status === 'generating' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-gray-500">生成中...</p>
                  </div>
                </div>
              ) : img.status === 'error' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                    <p className="text-sm text-gray-500">生成失败</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => handleRegenerate(img.id)}
                    >
                      重试
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-12 h-12 text-gray-300" />
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">分镜 {index + 1}</Badge>
                <span className="text-xs text-gray-500">
                  {script?.scenes[index]?.duration || 3}秒
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {script?.scenes[index]?.content || ''}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(4)}
        >
          上一步
        </Button>
        <Button
          onClick={handleGenerateVideo}
          disabled={isGeneratingVideo || !allImagesReady}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          {isGeneratingVideo ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              合成视频中...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              确认并生成视频
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>图片预览</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
