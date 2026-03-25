import { StepIndicator } from '@/components/StepIndicator';
import { BookSearch } from '@/pages/BookSearch';
import { PdfUpload } from '@/pages/PdfUpload';
import { RequirementInput } from '@/pages/RequirementInput';
import { KnowledgeEdit } from '@/pages/KnowledgeEdit';
import { ScriptEdit } from '@/pages/ScriptEdit';
import { ImagePreview } from '@/pages/ImagePreview';
import { VideoResult } from '@/pages/VideoResult';
import { useWorkflowStore } from '@/stores/workflowStore';
import { Toaster } from '@/components/ui/sonner';
import { BookOpen } from 'lucide-react';

function App() {
  const { currentStep, setCurrentStep, project } = useWorkflowStore();

  const handleStepClick = (step: number) => {
    // 只允许跳转到已完成的步骤或当前步骤
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BookSearch />;
      case 1:
        return <PdfUpload />;
      case 2:
        return <RequirementInput />;
      case 3:
        return <KnowledgeEdit />;
      case 4:
        return <ScriptEdit />;
      case 5:
        return <ImagePreview />;
      case 6:
        return <VideoResult />;
      default:
        return <BookSearch />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              书单视频生成器
            </span>
          </div>
          {project && (
            <div className="text-sm text-gray-600">
              当前项目：<span className="font-medium">{project.bookName}</span>
            </div>
          )}
        </div>
      </header>

      {/* Step Indicator */}
      <StepIndicator 
        currentStep={currentStep} 
        onStepClick={handleStepClick}
      />

      {/* Main Content */}
      <main className="py-8">
        {renderStepContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>书单视频生成器 - AI驱动的短视频创作工具</p>
        </div>
      </footer>

      {/* Toast notifications */}
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
