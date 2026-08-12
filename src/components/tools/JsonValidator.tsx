'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ValidationResult {
  suffix: string;
  exceptionFile: string;
  parameterFile: string;
  missingIds: number[];
  totalChecked: number;
  totalAvailable: number;
}

interface FileGroup {
  suffix: string;
  exceptionFile?: File;
  parameterFile?: File;
}

export default function JsonValidator() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Extract suffix from filename (phần sau dấu _ cuối cùng trước .json)
  const extractSuffix = (filename: string): string => {
    const nameWithoutExt = filename.replace(/\.json$/i, '');
    const parts = nameWithoutExt.split('_');
    return parts[parts.length - 1];
  };

  // Group files by suffix
  const groupFilesBySuffix = (fileList: File[]): FileGroup[] => {
    const groups = new Map<string, FileGroup>();

    fileList.forEach((file) => {
      const suffix = extractSuffix(file.name);
      const filename = file.name.toLowerCase();

      if (!groups.has(suffix)) {
        groups.set(suffix, { suffix });
      }

      const group = groups.get(suffix)!;

      if (filename.includes('tb_def_exception_parameter')) {
        group.exceptionFile = file;
      } else if (filename.includes('tb_def_parameter') && !filename.includes('exception')) {
        group.parameterFile = file;
      }
    });

    return Array.from(groups.values()).filter(
      (group) => group.exceptionFile && group.parameterFile
    );
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const jsonFiles = Array.from(selectedFiles).filter((file) =>
        file.name.toLowerCase().endsWith('.json')
      );
      setFiles(jsonFiles);
      setError('');
      setResults([]);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.name.toLowerCase().endsWith('.json')
    );

    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
      setError('');
      setResults([]);
    }
  };

  // Validate all file pairs
  const validateAllFiles = async () => {
    if (files.length === 0) {
      setError('Vui lòng chọn hoặc kéo thả files JSON');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const groups = groupFilesBySuffix(files);

      if (groups.length === 0) {
        setError('Không tìm thấy cặp file nào có thể mapping với nhau');
        setLoading(false);
        return;
      }

      const validationResults: ValidationResult[] = [];

      for (const group of groups) {
        if (!group.exceptionFile || !group.parameterFile) continue;

        const exceptionContent = await group.exceptionFile.text();
        const parameterContent = await group.parameterFile.text();

        const json1 = JSON.parse(exceptionContent);
        const json2 = JSON.parse(parameterContent);

        // Extract tb_def_parameter__id from exception file
        let exceptionParams: any[] = [];
        if (json1['public.tb_def_exception_parameter']) {
          exceptionParams = json1['public.tb_def_exception_parameter'];
        } else if (Array.isArray(json1)) {
          exceptionParams = json1;
        }

        // Extract id from parameter file
        let parameters: any[] = [];
        if (json2['public.tb_def_parameter']) {
          parameters = json2['public.tb_def_parameter'];
        } else if (Array.isArray(json2)) {
          parameters = json2;
        }

        // Get all parameter IDs
        const validIds = new Set(parameters.map((p) => p.id));

        // Check missing IDs
        const parameterIds = exceptionParams.map((p) => p.tb_def_parameter__id);
        const uniqueParameterIds = [...new Set(parameterIds)];

        const missingIds = uniqueParameterIds.filter((id) => !validIds.has(id));

        validationResults.push({
          suffix: group.suffix,
          exceptionFile: group.exceptionFile.name,
          parameterFile: group.parameterFile.name,
          missingIds,
          totalChecked: uniqueParameterIds.length,
          totalAvailable: validIds.size,
        });
      }

      setResults(validationResults);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra khi xử lý JSON');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = async () => {
    try {
      const response1 = await fetch('/content/json/tb_def_exception_parameter_seed_buf.json');
      const response2 = await fetch('/content/json/tb_def_parameter_seed_buf.json');

      const blob1 = await response1.blob();
      const blob2 = await response2.blob();

      const file1 = new File([blob1], 'tb_def_exception_parameter_seed_buf.json', {
        type: 'application/json',
      });
      const file2 = new File([blob2], 'tb_def_parameter_seed_buf.json', {
        type: 'application/json',
      });

      setFiles([file1, file2]);
      setError('');
      setResults([]);
    } catch (err) {
      setError('Không thể tải dữ liệu mẫu');
    }
  };

  return (
    <div className="space-y-6">
      {/* Load Sample Button */}
      <div className="flex justify-center">
        <button
          onClick={loadSampleData}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Tải dữ liệu mẫu
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/10 backdrop-blur-lg rounded-xl p-8 border-2 border-dashed transition-all ${
          isDragging
            ? 'border-purple-500 bg-purple-500/20'
            : 'border-white/20 hover:border-white/40'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-4">
          <div className="text-6xl">📁</div>
          <h2 className="text-2xl font-bold text-white">
            Kéo thả files hoặc folder vào đây
          </h2>
          <p className="text-gray-300">
            Hỗ trợ nhiều file JSON cùng lúc. Tự động mapping dựa trên suffix cuối tên file.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {/* Multiple File Upload */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                📄 Chọn nhiều files
              </div>
            </label>

            {/* Folder Upload */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                // @ts-ignore - webkitdirectory is not in the types
                webkitdirectory="true"
                directory="true"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors">
                📂 Chọn folder
              </div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* File List */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-bold text-white mb-4">
            Đã chọn {files.length} file(s):
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-gray-900/50 rounded px-3 py-2 text-gray-300 text-sm truncate"
                title={file.name}
              >
                📄 {file.name}
              </div>
            ))}
          </div>

          {/* File Groups Preview */}
          <div className="mt-6">
            <h4 className="text-lg font-bold text-white mb-3">
              Các cặp file được mapping:
            </h4>
            {groupFilesBySuffix(files).map((group, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4 mb-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">
                    {group.suffix}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <div className="text-red-300">
                    🔴 {group.exceptionFile?.name}
                  </div>
                  <div className="text-green-300">
                    🟢 {group.parameterFile?.name}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Validate Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={validateAllFiles}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {loading ? '⏳ Đang kiểm tra...' : '🔍 Kiểm tra tất cả'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-500/20 border border-red-500 rounded-lg p-4"
        >
          <p className="text-red-300 font-semibold">❌ Lỗi: {error}</p>
        </motion.div>
      )}

      {/* Results Display */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {/* Summary */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">
                📊 Tổng quan kết quả
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
                  <p className="text-blue-300 text-sm">Tổng số cặp</p>
                  <p className="text-white text-3xl font-bold">{results.length}</p>
                </div>
                <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                  <p className="text-green-300 text-sm">Cặp hợp lệ</p>
                  <p className="text-white text-3xl font-bold">
                    {results.filter((r) => r.missingIds.length === 0).length}
                  </p>
                </div>
                <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
                  <p className="text-red-300 text-sm">Cặp có lỗi</p>
                  <p className="text-white text-3xl font-bold">
                    {results.filter((r) => r.missingIds.length > 0).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            {results.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-lg font-bold">
                    {result.suffix}
                  </span>
                  {result.missingIds.length === 0 ? (
                    <span className="text-green-400 text-xl">✅</span>
                  ) : (
                    <span className="text-red-400 text-xl">⚠️</span>
                  )}
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <p className="text-red-300">
                    🔴 Exception: <span className="font-mono">{result.exceptionFile}</span>
                  </p>
                  <p className="text-green-300">
                    🟢 Parameter: <span className="font-mono">{result.parameterFile}</span>
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-500/30">
                    <p className="text-blue-300 text-xs">ID kiểm tra</p>
                    <p className="text-white text-2xl font-bold">{result.totalChecked}</p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-500/30">
                    <p className="text-green-300 text-xs">ID hợp lệ</p>
                    <p className="text-white text-2xl font-bold">{result.totalAvailable}</p>
                  </div>
                  <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
                    <p className="text-red-300 text-xs">ID không tồn tại</p>
                    <p className="text-white text-2xl font-bold">{result.missingIds.length}</p>
                  </div>
                </div>

                {result.missingIds.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-bold text-red-300 mb-3">
                      ⚠️ Các ID không tồn tại:
                    </h3>
                    <div className="bg-gray-900/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {result.missingIds.map((id) => (
                          <div
                            key={id}
                            className="bg-red-500/20 border border-red-500/30 rounded px-3 py-2 text-red-300 font-mono text-sm"
                          >
                            {id}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
                    <p className="text-green-300 font-semibold text-center">
                      ✅ Tất cả ID đều hợp lệ!
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
