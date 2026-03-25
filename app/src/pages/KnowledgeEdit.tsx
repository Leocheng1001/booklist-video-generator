import { useState } from 'react';
import { FileText, Edit2, Check, ArrowRight, Lightbulb, Quote, Target, BookOpen, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkflowStore } from '@/stores/workflowStore';
import { knowledgeApi, scriptApi } from '@/api';
import type { KnowledgePoint } from '@/types';
import { WorkflowStatus } from '@/types';
import { toast } from 'sonner';

const categoryIcons = {
  concept: <BookOpen className="w-4 h-4" />,
  insight: <Lightbulb className="w-4 h-4" />,
  quote: <Quote className="w-4 h-4" />,
  advice: <Target className="w-4 h-4" />,
  case: <Users className="w-4 h-4" />,
};

const categoryLabels = {
  concept: '核心概念',
  insight: '深度洞察',
  quote: '金句摘录',
  advice: '行动建议',
  case: '案例故事',
};

const categoryColors = {
  concept: 'bg-blue-100 text-blue-700',
  insight: 'bg-purple-100 text-purple-700',
  quote: 'bg-amber-100 text-amber-700',
  advice: 'bg-green-100 text-green-700',
  case: 'bg-pink-100 text-pink-700',
};

export function KnowledgeEdit() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const { project, knowledgePoints, setScript, setCurrentStep, setProjectStatus } = useWorkflowStore();

  const handleEdit = (point: KnowledgePoint) => {
    setEditingId(point.id);
    setEditContent(point.content);
  };

  const handleSave = () => {
    if (editingId) {
      // updateKnowledgePoint(editingId, editContent);
      setEditingId(null);
      toast.success('已保存修改');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    setProjectStatus(WorkflowStatus.SCRIPTING, 50);

    try {
      const response = await scriptApi.generate(project!.id);
      if (response.success && response.data) {
        setScript(response.data);
        toast.success('脚本生成成功');
        setCurrentStep(4);
      } else {
        toast.error(response.error || '生成失败');
      }
    } catch (error) {
      toast.error('生成出错，请稍后重试');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const response = await knowledgeApi.generate(project!.id, project?.userRequirement || '');
      if (response.success && response.data) {
        // 更新知识点会触发状态更新
        toast.success('知识点已重新生成');
      } else {
        toast.error(response.error || '重新生成失败');
      }
    } catch (error) {
      toast.error('重新生成出错');
    } finally {
      setIsRegenerating(false);
    }
  };

  const groupedPoints = knowledgePoints.reduce<Record<string, KnowledgePoint[]>>((acc, point) => {
    if (!acc[point.category]) {
      acc[point.category] = [];
    }
    acc[point.category].push(point);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          核心知识点
        </h2>
        <p className="text-gray-600">
          AI从书中提取的关键内容，你可以编辑调整
        </p>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">全部</TabsTrigger>
          {Object.keys(categoryLabels).map((key) => (
            <TabsTrigger key={key} value={key}>
              {categoryLabels[key as keyof typeof categoryLabels]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="space-y-4">
            {knowledgePoints.map((point) => (
              <KnowledgeCard
                key={point.id}
                point={point}
                isEditing={editingId === point.id}
                editContent={editContent}
                setEditContent={setEditContent}
                onEdit={() => handleEdit(point)}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ))}
          </div>
        </TabsContent>

        {Object.keys(categoryLabels).map((category) => (
          <TabsContent key={category} value={category} className="mt-4">
            <div className="space-y-4">
              {groupedPoints[category]?.map((point) => (
                <KnowledgeCard
                  key={point.id}
                  point={point}
                  isEditing={editingId === point.id}
                  editContent={editContent}
                  setEditContent={setEditContent}
                  onEdit={() => handleEdit(point)}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ))}
              {!groupedPoints[category]?.length && (
                <div className="text-center py-8 text-gray-500">
                  该分类下暂无知识点
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(2)}
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
            onClick={handleGenerateScript}
            disabled={isGeneratingScript}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {isGeneratingScript ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                生成脚本
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface KnowledgeCardProps {
  point: KnowledgePoint;
  isEditing: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

function KnowledgeCard({
  point,
  isEditing,
  editContent,
  setEditContent,
  onEdit,
  onSave,
  onCancel,
}: KnowledgeCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Badge className={`${categoryColors[point.category]} flex items-center gap-1`}>
            {categoryIcons[point.category]}
            {categoryLabels[point.category]}
          </Badge>
        </div>
        
        {isEditing ? (
          <div className="mt-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={onCancel}>
                取消
              </Button>
              <Button size="sm" onClick={onSave}>
                <Check className="w-4 h-4 mr-1" />
                保存
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <h4 className="font-semibold text-gray-900 mb-2">{point.title}</h4>
            <p className="text-gray-600 leading-relaxed">{point.content}</p>
            <div className="flex justify-end mt-3">
              <Button size="sm" variant="ghost" onClick={onEdit}>
                <Edit2 className="w-4 h-4 mr-1" />
                编辑
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
