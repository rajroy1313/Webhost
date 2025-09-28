import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { CloudUpload, X, FileArchive } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File;
  onRemoveFile: () => void;
}

export function FileUpload({ onFileSelect, selectedFile, onRemoveFile }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'text/javascript': ['.js'],
      'text/x-python': ['.py'],
      'application/typescript': ['.ts'],
      'application/json': ['.json'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive || selectedFile
            ? "border-primary/50 bg-primary/5"
            : "border-border hover:border-primary/50"
        )}
        data-testid="file-upload-dropzone"
      >
        <input {...getInputProps()} />
        <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-foreground font-medium mb-2">
          Drag and drop your files here
        </p>
        <p className="text-muted-foreground text-sm mb-4">
          or click to browse
        </p>
        <Button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          data-testid="button-choose-files"
        >
          Choose Files
        </Button>
        <p className="text-muted-foreground text-xs mt-3">
          Supports: ZIP, JS, PY, TS files (Max 100MB)
        </p>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg" data-testid="selected-file">
          <div className="flex items-center space-x-3">
            <FileArchive className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground" data-testid="text-filename">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-filesize">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoveFile}
            className="text-muted-foreground hover:text-destructive"
            data-testid="button-remove-file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
