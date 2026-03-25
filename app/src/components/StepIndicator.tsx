import { Check, FileText, Image, BookOpen, PenTool, Video, Upload, Lightbulb } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  { id: 0, title: '搜索书籍', icon: <BookOpen className="w-5 h-5" /> },
  { id: 1, title: '上传PDF', icon: <Upload className="w-5 h-5" /> },
  { id: 2, title: '输入需求', icon: <Lightbulb className="w-5 h-5" /> },
  { id: 3, title: '知识点', icon: <FileText className="w-5 h-5" /> },
  { id: 4, title: '脚本编辑', icon: <PenTool className="w-5 h-5" /> },
  { id: 5, title: '图片预览', icon: <Image className="w-5 h-5" /> },
  { id: 6, title: '生成视频', icon: <Video className="w-5 h-5" /> },
];

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full bg-white border-b border-gray-200 py-4">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isClickable = onStepClick && step.id <= currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
                    isClickable ? 'hover:opacity-80' : 'cursor-default'
                  }`}
                  onClick={() => isClickable && onStepClick(step.id)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : step.icon}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                      isCompleted
                        ? 'text-green-600'
                        : isCurrent
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all duration-500 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
