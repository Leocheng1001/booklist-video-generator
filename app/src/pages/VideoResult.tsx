import { useState } from 'react';
import { Video, Download, Share2, RotateCcw, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/stores/workflowStore';
import { toast } from 'sonner';

export function VideoResult() {
  const [isDownloading, setIsDownloading] = useState(false);
  const { project, resetProject, setCurrentStep } = useWorkflowStore();

  const handleDownload = async () => {
    if (!project?.videoUrl) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch(project.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.bookName}_短视频.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('下载开始');
    } catch (error) {
      toast.error('下载失败，请直接右键视频保存');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && project?.videoUrl) {
      try {
        await navigator.share({
          title: `《${project.bookName}》短视频`,
          text: `看看我为《${project.bookName}》生成的短视频`,
          url: project.videoUrl,
        });
      } catch (error) {
        // 用户取消分享
      }
    } else {
      // 复制链接到剪贴板
      if (project?.videoUrl) {
        navigator.clipboard.writeText(project.videoUrl);
        toast.success('链接已复制到剪贴板');
      }
    }
  };

  const handleRestart = () => {
    resetProject();
    setCurrentStep(0);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          视频生成完成！
        </h2>
        <p className="text-gray-600">
          你的《{project?.bookName}》短视频已准备就绪
        </p>
      </div>

      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-0">
          {project?.videoUrl ? (
            <div className="aspect-video bg-black">
              <video
                src={project.videoUrl}
                controls
                className="w-full h-full"
                poster="/video-poster.jpg"
              >
                你的浏览器不支持视频播放
              </video>
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <Video className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">视频加载中...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">视频时长</p>
                <p className="font-semibold">
                  {Math.ceil(project?.script?.totalDuration || 0)} 秒
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Badge className="w-5 h-5 flex items-center justify-center p-0 text-purple-600 bg-transparent">
                  {project?.script?.scenes.length || 0}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">分镜数量</p>
                <p className="font-semibold">
                  {project?.script?.scenes.length || 0} 个场景
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleDownload}
          disabled={isDownloading || !project?.videoUrl}
          className="w-full h-12"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              下载中...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              下载视频
            </>
          )}
        </Button>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleShare}
            disabled={!project?.videoUrl}
            className="flex-1 h-12"
          >
            <Share2 className="w-5 h-5 mr-2" />
            分享
          </Button>
          <Button
            variant="outline"
            onClick={handleRestart}
            className="flex-1 h-12"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            制作新视频
          </Button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 小贴士</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 视频已保存到服务器，你可以随时下载</li>
          <li>• 如需修改，可以点击"制作新视频"重新开始</li>
          <li>• 建议将视频下载到本地备份</li>
        </ul>
      </div>
    </div>
  );
}
