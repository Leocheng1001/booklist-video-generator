import { useState } from 'react';
import { Lightbulb, ArrowRight, Sparkles, Target, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/stores/workflowStore';
import { knowledgeApi } from '@/api';
import { WorkflowStatus } from '@/types';
import { toast } from 'sonner';

const exampleRequirements = [
  '帮我总结这本书的核心观点，适合职场新人',
  '提取书中的 actionable insights，做成3分钟短视频',
  '我想了解这本书如何解决拖延症问题',
  '总结作者关于时间管理的建议',
  '提取书中的金句和经典案例',
];

export function RequirementInput() {
  const [requirement, setRequirement] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { project, setUserRequirement, setCurrentStep, setKnowledgePoints, setProjectStatus } = useWorkflowStore();

  const handleExampleClick = (example: string) => {
    setRequirement(example);
  };

  const handleSubmit = async () => {
    if (!requirement.trim()) {
      toast.error('请输入你的需求');
      return;
    }

    setIsGenerating(true);
    setUserRequirement(requirement);
    setProjectStatus(WorkflowStatus.SUMMARIZING, 30);

    try {
      const response = await knowledgeApi.generate(project!.id, requirement);
      if (response.success && response.data) {
        setKnowledgePoints(response.data);
        toast.success('知识点生成成功');
        setCurrentStep(3);
      } else {
        toast.error(response.error || '生成失败');
      }
    } catch (error) {
      toast.error('生成出错，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          你想从这本书中获得什么？
        </h2>
        <p className="text-gray-600">
          描述你的需求，AI将为你提取相关的核心知识点
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">当前书籍</h3>
              <p className="text-gray-600">《{project?.bookName}》</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          你的需求或困惑
        </label>
        <Textarea
          placeholder="例如：我想了解这本书如何帮助我提高工作效率，特别是关于时间管理的部分..."
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          className="min-h-[150px] text-base"
        />
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <HelpCircle className="w-4 h-4" />
          <span>描述越详细，生成的内容越精准</span>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          快速选择示例
        </label>
        <div className="flex flex-wrap gap-2">
          {exampleRequirements.map((example, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors py-2 px-3"
              onClick={() => handleExampleClick(example)}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {example}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(1)}
        >
          上一步
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isGenerating || !requirement.trim()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              AI分析中...
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4 mr-2" />
              生成知识点
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
