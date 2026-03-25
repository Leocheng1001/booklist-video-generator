import { useState, useRef } from 'react';
import { Upload, FileText, Link, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkflowStore } from '@/stores/workflowStore';
import { bookApi } from '@/api';
import { toast } from 'sonner';

export function PdfUpload() {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [pdfUrl, setPdfUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { project, setBookPdf, setCurrentStep } = useWorkflowStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('请选择PDF文件');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('文件大小不能超过50MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (uploadMethod === 'file' && selectedFile) {
      setIsUploading(true);
      try {
        const response = await bookApi.uploadPdf(selectedFile);
        if (response.success && response.data) {
          setBookPdf(response.data.url);
          toast.success('PDF上传成功');
          setCurrentStep(2);
        } else {
          toast.error(response.error || '上传失败');
        }
      } catch (error) {
        toast.error('上传出错，请稍后重试');
      } finally {
        setIsUploading(false);
      }
    } else if (uploadMethod === 'url' && pdfUrl.trim()) {
      setIsUploading(true);
      try {
        const response = await bookApi.submitPdfUrl(pdfUrl.trim());
        if (response.success && response.data) {
          setBookPdf(response.data.url);
          toast.success('PDF链接已提交');
          setCurrentStep(2);
        } else {
          toast.error(response.error || '提交失败');
        }
      } catch (error) {
        toast.error('提交出错，请稍后重试');
      } finally {
        setIsUploading(false);
      }
    } else {
      toast.error(uploadMethod === 'file' ? '请选择PDF文件' : '请输入PDF链接');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('请拖入PDF文件');
        return;
      }
      setSelectedFile(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          上传《{project?.bookName}》的PDF
        </h2>
        <p className="text-gray-600">
          选择上传方式，提供书籍PDF以便我们分析内容
        </p>
      </div>

      <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'file' | 'url')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="file">
            <Upload className="w-4 h-4 mr-2" />
            上传文件
          </TabsTrigger>
          <TabsTrigger value="url">
            <Link className="w-4 h-4 mr-2" />
            粘贴链接
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file">
          <Card>
            <CardContent className="p-6">
              {!selectedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    点击或拖放PDF文件到此处
                  </p>
                  <p className="text-sm text-gray-500">
                    支持 PDF 格式，文件大小不超过 50MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDF 链接地址
                  </label>
                  <Input
                    placeholder="https://example.com/book.pdf"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    className="w-full"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  支持直接下载的PDF链接，链接需要公开可访问
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(0)}
        >
          上一步
        </Button>
        <Button
          onClick={handleUpload}
          disabled={isUploading || (uploadMethod === 'file' ? !selectedFile : !pdfUrl.trim())}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          {isUploading ? '上传中...' : '确认上传'}
        </Button>
      </div>
    </div>
  );
}
