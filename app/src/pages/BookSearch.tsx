import { useState } from 'react';
import { Search, Book, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useWorkflowStore } from '@/stores/workflowStore';
import { bookApi, projectApi } from '@/api';
import type { Book as BookType } from '@/types';
import { toast } from 'sonner';

export function BookSearch() {
  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [books, setBooks] = useState<BookType[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const { initProject, setCurrentStep } = useWorkflowStore();

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error('请输入书籍名称');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const response = await bookApi.search(keyword);
      if (response.success && response.data) {
        setBooks(response.data || []);
        if (response.data.length === 0) {
          toast.info('未找到相关书籍，请尝试其他关键词');
        }
      } else {
        toast.error(response.error || '搜索失败');
      }
    } catch {
      toast.error('搜索出错，请稍后重试');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = async (book: BookType) => {
    // 调用后端API创建项目
    const response = await projectApi.create(book.title);
    if (response.success && response.data) {
      // 使用后端返回的真实项目ID
      initProject(book.title, response.data.id);
      toast.success(`已选择《${book.title}》`);
      setCurrentStep(1);
    } else {
      toast.error(response.error || '创建项目失败');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          搜索你想要的书籍
        </h1>
        <p className="text-gray-600">
          输入书籍名称，我们将帮你搜索并生成短视频
        </p>
      </div>

      <div className="flex gap-3 mb-8">
        <Input
          placeholder="输入书籍名称，例如：原子习惯、深度工作..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-12 text-lg"
        />
        <Button
          onClick={handleSearch}
          disabled={isSearching}
          className="h-12 px-6"
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Search className="w-5 h-5 mr-2" />
          )}
          搜索
        </Button>
      </div>

      {hasSearched && !isSearching && books.length === 0 && (
        <div className="text-center py-12">
          <Book className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-2">未找到相关书籍</p>
          <p className="text-sm text-gray-400">
            你可以直接上传PDF文件继续
          </p>
        </div>
      )}

      {books.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {books.map((book) => (
            <Card
              key={book.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
              onClick={() => handleSelectBook(book)}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className="w-20 h-28 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Book className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {book.author}
                  </p>
                  <Button size="sm" variant="outline" className="mt-2">
                    选择此书
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasSearched && (
        <div className="mt-8 text-center">
          <p className="text-gray-500 mb-4">或者</p>
          <Button
            variant="outline"
            onClick={async () => {
              const bookName = keyword || '未命名书籍';
              const response = await projectApi.create(bookName);
              if (response.success && response.data) {
                initProject(bookName, response.data.id);
                setCurrentStep(1);
              } else {
                toast.error(response.error || '创建项目失败');
              }
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            直接上传PDF文件
          </Button>
        </div>
      )}
    </div>
  );
}
