'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { cn } from "@/lib/utils";
import { border, gap, radius, surface, text } from "@/lib/design-tokens";

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

  // Extract suffix from filename (part after the last _ before .json)
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
      setError('Please select or drop JSON files');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const groups = groupFilesBySuffix(files);

      if (groups.length === 0) {
        setError('No matching file pairs found');
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
        setError('An error occurred while processing JSON');
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
      setError('Unable to load sample data');
    }
  };

  return (
    <div className="space-y-6">
      {/* Load Sample Button */}
      <div className="flex justify-center">
        <button
          onClick={loadSampleData}
          className={cn("px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white", radius.chip, "transition-colors")}
        >
          Load Sample Data
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/10 light:bg-neutral-900/[0.06] backdrop-blur-lg rounded-xl p-8 border-2 border-dashed transition-all ${
          isDragging
            ? 'border-purple-500 bg-purple-500/20'
            : 'border-white/20 hover:border-white/40 light:border-neutral-900/15 light:hover:border-neutral-900/30'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center text-white/70 light:text-neutral-700">
            <Icon name="folder" size={56} />
          </div>
          <h2 className={cn("text-2xl font-bold", text.primary)}>
            Drag and drop files or folder here
          </h2>
          <p className="text-gray-300 light:text-neutral-600">
            Supports multiple JSON files at once. Automatically pairs files based on filename suffix.
          </p>

          <div className={cn("flex flex-col sm:flex-row", gap.loose, "justify-center pt-4")}>
            {/* Multiple File Upload */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className={cn("px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white", radius.chip, "transition-colors inline-flex items-center", gap.tight)}>
                <Icon name="fileText" size={16} /> Choose Files
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
              <div className={cn("px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white", radius.chip, "transition-colors inline-flex items-center", gap.tight)}>
                <Icon name="folderOpen" size={16} /> Choose Folder
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
          className={cn(surface.raised, "backdrop-blur-lg", radius.control, "p-6", border.strong)}
        >
          <h3 className={cn("text-xl font-bold", text.primary, "mb-4")}>
            Selected {files.length} file(s):
          </h3>
          <div className={cn("grid md:grid-cols-2 lg:grid-cols-3", gap.tight, "max-h-64 overflow-y-auto")}>
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-gray-900/50 light:bg-neutral-100 rounded px-3 py-2 text-gray-300 light:text-neutral-600 text-sm truncate flex items-center gap-1.5"
                title={file.name}
              >
                <Icon name="fileText" size={13} className="shrink-0" /> {file.name}
              </div>
            ))}
          </div>

          {/* File Groups Preview */}
          <div className="mt-6">
            <h4 className={cn("text-lg font-bold", text.primary, "mb-3")}>
              Mapped File Pairs:
            </h4>
            {groupFilesBySuffix(files).map((group, index) => (
              <div
                key={index}
                className={cn("bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 light:border-purple-500/40", radius.chip, "p-4 mb-3")}
              >
                <div className={cn("flex items-center", gap.tight, "mb-2")}>
                  <span className={cn("px-3 py-1 bg-purple-600 text-white", radius.pill, "text-sm font-bold")}>
                    {group.suffix}
                  </span>
                </div>
                <div className={cn("grid md:grid-cols-2", gap.tight, "text-sm")}>
                  <div className={cn("text-red-300 light:text-red-700 flex items-center", gap.tight)}>
                    <span className={cn("w-2 h-2", radius.pill, "bg-red-400 shrink-0")} /> {group.exceptionFile?.name}
                  </div>
                  <div className={cn("text-green-300 light:text-green-700 flex items-center", gap.tight)}>
                    <span className={cn("w-2 h-2", radius.pill, "bg-green-400 shrink-0")} /> {group.parameterFile?.name}
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
              className={cn("px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold", radius.chip, "disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 inline-flex items-center", gap.tight)}
            >
              {loading ? (
                <>
                  <Icon name="loader" size={16} className="animate-spin" /> Validating...
                </>
              ) : (
                <>
                  <Icon name="search" size={16} /> Validate All
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn("bg-red-500/20 border border-red-500", radius.chip, "p-4")}
        >
          <p className={cn("text-red-300 light:text-red-700 font-semibold flex items-center", gap.tight)}>
            <Icon name="xCircle" size={16} /> Error: {error}
          </p>
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
            <div className={cn(surface.raised, "backdrop-blur-lg", radius.control, "p-6", border.strong)}>
              <h2 className={cn("text-2xl font-bold", text.primary, "mb-4 flex items-center", gap.tight)}>
                <Icon name="activity" size={20} /> Results Summary
              </h2>
              <div className={cn("grid md:grid-cols-3", gap.loose)}>
                <div className={cn("bg-blue-500/20", radius.chip, "p-4 border border-blue-500/30 light:border-blue-500/35")}>
                  <p className="text-blue-300 light:text-blue-700 text-sm">Total Pairs</p>
                  <p className={cn(text.primary, "text-3xl font-bold")}>{results.length}</p>
                </div>
                <div className={cn("bg-green-500/20", radius.chip, "p-4 border border-green-500/30 light:border-green-500/35")}>
                  <p className="text-green-300 light:text-green-700 text-sm">Valid Pairs</p>
                  <p className={cn(text.primary, "text-3xl font-bold")}>
                    {results.filter((r) => r.missingIds.length === 0).length}
                  </p>
                </div>
                <div className={cn("bg-red-500/20", radius.chip, "p-4 border border-red-500/30 light:border-red-500/35")}>
                  <p className="text-red-300 light:text-red-700 text-sm">Pairs with Errors</p>
                  <p className={cn(text.primary, "text-3xl font-bold")}>
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
                className={cn(surface.raised, "backdrop-blur-lg", radius.control, "p-6", border.strong)}
              >
                <div className={cn("flex items-center", gap.base, "mb-4")}>
                  <span className={cn("px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white", radius.pill, "text-lg font-bold")}>
                    {result.suffix}
                  </span>
                  {result.missingIds.length === 0 ? (
                    <Icon name="checkCircle" size={22} className="text-green-400" />
                  ) : (
                    <Icon name="alertTriangle" size={22} className="text-red-400" />
                  )}
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <p className={cn("text-red-300 light:text-red-700 flex items-center", gap.tight)}>
                    <span className={cn("w-2 h-2", radius.pill, "bg-red-400 shrink-0")} /> Exception: <span className="font-mono">{result.exceptionFile}</span>
                  </p>
                  <p className={cn("text-green-300 light:text-green-700 flex items-center", gap.tight)}>
                    <span className={cn("w-2 h-2", radius.pill, "bg-green-400 shrink-0")} /> Parameter: <span className="font-mono">{result.parameterFile}</span>
                  </p>
                </div>

                <div className={cn("grid md:grid-cols-3", gap.loose, "mb-4")}>
                  <div className={cn("bg-blue-500/20", radius.chip, "p-3 border border-blue-500/30 light:border-blue-500/35")}>
                    <p className="text-blue-300 light:text-blue-700 text-xs">Checked IDs</p>
                    <p className={cn(text.primary, "text-2xl font-bold")}>{result.totalChecked}</p>
                  </div>
                  <div className={cn("bg-green-500/20", radius.chip, "p-3 border border-green-500/30 light:border-green-500/35")}>
                    <p className="text-green-300 light:text-green-700 text-xs">Valid IDs</p>
                    <p className={cn(text.primary, "text-2xl font-bold")}>{result.totalAvailable}</p>
                  </div>
                  <div className={cn("bg-red-500/20", radius.chip, "p-3 border border-red-500/30 light:border-red-500/35")}>
                    <p className="text-red-300 light:text-red-700 text-xs">Missing IDs</p>
                    <p className={cn(text.primary, "text-2xl font-bold")}>{result.missingIds.length}</p>
                  </div>
                </div>

                {result.missingIds.length > 0 ? (
                  <div>
                    <h3 className={cn("text-lg font-bold text-red-300 light:text-red-700 mb-3 flex items-center", gap.tight)}>
                      <Icon name="alertTriangle" size={18} /> Missing IDs:
                    </h3>
                    <div className={cn("bg-gray-900/50 light:bg-neutral-100", radius.chip, "p-4 max-h-64 overflow-y-auto")}>
                      <div className={cn("grid grid-cols-2 md:grid-cols-4", gap.tight)}>
                        {result.missingIds.map((id) => (
                          <div
                            key={id}
                            className="bg-red-500/20 border border-red-500/30 light:border-red-500/35 rounded px-3 py-2 text-red-300 light:text-red-700 font-mono text-sm"
                          >
                            {id}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={cn("bg-green-500/20 border border-green-500", radius.chip, "p-4")}>
                    <p className={cn("text-green-300 light:text-green-700 font-semibold text-center flex items-center justify-center", gap.tight)}>
                      <Icon name="checkCircle" size={16} /> All IDs are valid!
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
