'use client';

import { useState } from 'react';

import Icon from '@/components/ui/Icon';
import { cn } from "@/lib/utils";

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
        let exceptionParams: { tb_def_parameter__id: number }[] = [];
        if (json1['public.tb_def_exception_parameter']) {
          exceptionParams = json1['public.tb_def_exception_parameter'];
        } else if (Array.isArray(json1)) {
          exceptionParams = json1;
        }

        // Extract id from parameter file
        let parameters: { id: number }[] = [];
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
    } catch {
      setError('Unable to load sample data');
    }
  };

  return (
    <div className="space-y-6 min-w-0 text-portfolio-dust">
      {/* Load Sample Button */}
      <div className="flex justify-center">
        <button
          onClick={loadSampleData}
          className="portfolio-action portfolio-action-secondary px-6 py-2 rounded-lg transition-colors"
        >
          Load Sample Data
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        className={cn("portfolio-solid rounded-lg p-5 sm:p-8 !border-2 !border-dashed", isDragging ? "!border-portfolio-accretion" : "!border-portfolio-control hover:!border-portfolio-accretion")}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Icon name="folder" size={56} />
          </div>
          <h2 className="text-2xl font-bold text-portfolio-ink">
            Drag and drop files or folder here
          </h2>
          <p className="text-portfolio-dust">
            Supports multiple JSON files at once. Automatically pairs files based on filename suffix.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {/* Multiple File Upload */}
            <label className="cursor-pointer rounded-lg focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-portfolio-accretion">
              <input
                type="file"
                accept=".json"
                multiple
                onChange={handleFileSelect}
                className="sr-only"
              />
              <div className="portfolio-action portfolio-action-secondary px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2">
                <Icon name="fileText" size={16} /> Choose Files
              </div>
            </label>

            {/* Folder Upload */}
            <label className="cursor-pointer rounded-lg focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-portfolio-accretion">
              <input
                type="file"
                accept=".json"
                // @ts-expect-error - webkitdirectory is not in React's input attribute types
                webkitdirectory="true"
                directory="true"
                onChange={handleFileSelect}
                className="sr-only"
              />
              <div className="portfolio-action portfolio-action-secondary px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2">
                <Icon name="folderOpen" size={16} /> Choose Folder
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div
          className="portfolio-solid rounded-lg p-6 border border-portfolio-hairline"
        >
          <h3 className="text-xl font-bold text-portfolio-ink mb-4">
            Selected {files.length} file(s):
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 min-w-0 gap-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-portfolio-hull border border-portfolio-hairline rounded px-3 py-2 text-portfolio-dust text-sm font-mono break-all min-w-0 flex items-center gap-1.5"
                title={file.name}
              >
                <Icon name="fileText" size={13} className="shrink-0" /> {file.name}
              </div>
            ))}
          </div>

          {/* File Groups Preview */}
          <div className="mt-6">
            <h4 className="text-lg font-bold text-portfolio-ink mb-3">
              Mapped File Pairs:
            </h4>
            {groupFilesBySuffix(files).map((group, index) => (
              <div
                key={index}
                className="portfolio-solid p-4 mb-3 font-mono break-all"
              >
                <div className="flex flex-wrap items-center text-portfolio-dust gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-portfolio-hull border border-portfolio-hairline text-portfolio-ink font-mono break-all text-sm font-bold">
                    {group.suffix}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-2 text-sm break-all">
                  <div className="flex flex-wrap items-center text-portfolio-dust gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" /> {group.exceptionFile?.name}
                  </div>
                  <div className="flex flex-wrap items-center text-portfolio-dust gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" /> {group.parameterFile?.name}
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
              className="portfolio-action portfolio-action-primary px-8 py-3 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Icon name="loader" size={16} /> Validating...
                </>
              ) : (
                <>
                  <Icon name="search" size={16} /> Validate All
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          role="alert" className="portfolio-solid rounded-lg p-4"
        >
          <p className="text-portfolio-ink font-semibold flex items-center gap-2">
            <Icon name="xCircle" size={16} /> Error: {error}
          </p>
        </div>
      )}

      {/* Results Display */}
      <>
        {results.length > 0 && (
          <div
            className="space-y-6 min-w-0 text-portfolio-dust"
          >
            {/* Summary */}
            <div className="portfolio-solid rounded-lg p-6 border border-portfolio-hairline">
              <h2 className="text-2xl font-bold text-portfolio-ink mb-4 flex items-center gap-2">
                <Icon name="activity" size={20} /> Results Summary
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-portfolio-hull border border-portfolio-hairline p-4">
                  <p className="text-sm text-portfolio-dust">Total Pairs</p>
                  <p className="text-portfolio-ink text-3xl font-bold">{results.length}</p>
                </div>
                <div className="rounded-lg bg-portfolio-hull border border-portfolio-hairline p-4">
                  <p className="text-sm text-portfolio-dust">Valid Pairs</p>
                  <p className="text-portfolio-ink text-3xl font-bold">
                    {results.filter((r) => r.missingIds.length === 0).length}
                  </p>
                </div>
                <div className="rounded-lg bg-portfolio-hull border border-portfolio-hairline p-4">
                  <p className="text-sm text-portfolio-dust">Pairs with Errors</p>
                  <p className="text-portfolio-ink text-3xl font-bold">
                    {results.filter((r) => r.missingIds.length > 0).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            {results.map((result, index) => (
              <div
                key={index}
                className="portfolio-solid rounded-lg p-6 border border-portfolio-hairline"
              >
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-4 py-2 rounded-full bg-portfolio-hull border border-portfolio-hairline text-portfolio-ink font-mono break-all text-lg font-bold">
                    {result.suffix}
                  </span>
                  {result.missingIds.length === 0 ? (
                    <Icon name="checkCircle" size={22} className="text-portfolio-dust" />
                  ) : (
                    <Icon name="alertTriangle" size={22} className="text-portfolio-dust" />
                  )}
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <p className="flex flex-wrap items-center text-portfolio-dust gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" /> Exception: <span className="font-mono break-all">{result.exceptionFile}</span>
                  </p>
                  <p className="flex flex-wrap items-center text-portfolio-dust gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" /> Parameter: <span className="font-mono break-all">{result.parameterFile}</span>
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="rounded-lg bg-portfolio-hull border border-portfolio-hairline p-3">
                    <p className="text-xs text-portfolio-dust">Checked IDs</p>
                    <p className="text-portfolio-ink text-2xl font-bold">{result.totalChecked}</p>
                  </div>
                  <div className="rounded-lg bg-portfolio-hull border border-portfolio-hairline p-3">
                    <p className="text-xs text-portfolio-dust">Valid IDs</p>
                    <p className="text-portfolio-ink text-2xl font-bold">{result.totalAvailable}</p>
                  </div>
                  <div className="rounded-lg bg-portfolio-hull border border-portfolio-hairline p-3">
                    <p className="text-xs text-portfolio-dust">Missing IDs</p>
                    <p className="text-portfolio-ink text-2xl font-bold">{result.missingIds.length}</p>
                  </div>
                </div>

                {result.missingIds.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Icon name="alertTriangle" size={18} /> Missing IDs:
                    </h3>
                    <div className="rounded-lg bg-portfolio-hull border border-portfolio-hairline p-4 max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-2 md:grid-cols-4 min-w-0 gap-2">
                        {result.missingIds.map((id) => (
                          <div
                            key={id}
                            className="bg-portfolio-hull border border-portfolio-hairline rounded px-3 py-2 text-portfolio-ink font-mono break-all text-sm"
                          >
                            {id}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="portfolio-solid rounded-lg p-4">
                    <p className="text-portfolio-ink font-semibold text-center flex items-center justify-center gap-2">
                      <Icon name="checkCircle" size={16} /> All IDs are valid!
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    </div>
  );
}
