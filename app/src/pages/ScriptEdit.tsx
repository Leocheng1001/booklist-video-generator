import { useState } from 'react';
import { Clock, Image, Edit2, Check, ArrowRight, RefreshCw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/stores/workflowStore';
import { scriptApi, imageApi } from '@/api';
import { WorkflowStatus } from '@/types';
import { toast } from 'sonner';

export function ScriptEdit() {
  const [editingSceneId, setEditingSceneId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const { project, script, setImages, setCurrentStep, setProjectStatus } = useWorkflowStore();

  const handleEdit = (sceneId: number, content: string) => {
    setEditingSceneId(sceneId);
    setEditContent(content);
  };

  const handleSave = () => {
    if (editingSceneId !== null) {
      // updateScriptScene(editingSceneId, editContent);
      setEditingSceneId(null);
      toast.success('已保存修改');
    }
  };

  const handleCancel = () => {
    setEditingSceneId(null);
    setEditContent('');
  };

  const handleGenerateImages = async () => {
    setIsGeneratingImages(true);
    setProjectStatus(WorkflowStatus.GENERATING_IMAGES, 70);

    try {
      const response = await imageApi.generate(project!.id);
      if (response.success && response.data) {
        setImages(response.data);
        toast.success('图片生成成功');
        setCurrentStep(5);
      } else {
        toast.error(response.error || '生成失败');
      }
    } catch {
      toast.error('生成出错，请稍后重试');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const response = await scriptApi.generate(project!.id);
      if (response.success && response.data) {
        toast.success('脚本已重新生成');
      } else {
        toast.error(response.error || '重新生成失败');
      }
    } catch {
      toast.error('重新生成出错');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!script) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载脚本中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          视频脚本
        </h2>
        <p className="text-gray-600">
          审核并编辑分镜脚本，确认后生成配图
        </p>
      </div>

      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{script.title}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Play className="w-4 h-4" />
                  {script.scenes.length} 个分镜
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  约 {Math.ceil(script.totalDuration)} 秒
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 mb-8">
        {script.scenes.map((scene, index) => (
          <Card key={scene.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-blue-600">
                    分镜 {index + 1}
                  </Badge>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {scene.duration}秒
                  </span>
                </div>
                {!editingSceneId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(scene.id, scene.content)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {editingSceneId === scene.id ? (
                <div>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px] mb-3"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      取消
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Check className="w-4 h-4 mr-1" />
                      保存
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-800 leading-relaxed mb-3">
                    {scene.content}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Image className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">画面描述：</span>
                        {scene.visualDesc}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(3)}
        >
          上一步
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            重新生成
          </Button>
          <Button
            onClick={handleGenerateImages}
            disabled={isGeneratingImages}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {isGeneratingImages ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Image className="w-4 h-4 mr-2" />
                生成配图
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
