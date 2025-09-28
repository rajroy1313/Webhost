import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, GitBranch, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GitHubRepoInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (isValid: boolean, repoInfo?: any) => void;
}

export function GitHubRepoInput({ value, onChange, onValidation }: GitHubRepoInputProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    repoInfo?: any;
  } | null>(null);

  const validateRepository = async (repoUrl: string) => {
    if (!repoUrl.trim()) {
      setValidationResult(null);
      onValidation?.(false);
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch("/api/github/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryUrl: repoUrl }),
        credentials: "include",
      });

      const result = await response.json();
      setValidationResult(result);
      onValidation?.(result.valid, result.repoInfo);
    } catch (error) {
      setValidationResult({ valid: false, error: "Failed to validate repository" });
      onValidation?.(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setValidationResult(null);
    
    // Auto-validate after 1 second of no typing
    const timeoutId = setTimeout(() => {
      validateRepository(newValue);
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  const getStatusIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (validationResult?.valid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (validationResult && !validationResult.valid) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <GitBranch className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="githubRepo">GitHub Repository URL</Label>
        <div className="relative">
          <Input
            id="githubRepo"
            type="url"
            placeholder="https://github.com/owner/repository"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            className={cn(
              "pr-10",
              validationResult?.valid && "border-green-500",
              validationResult && !validationResult.valid && "border-red-500"
            )}
            data-testid="input-github-repo"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getStatusIcon()}
          </div>
        </div>
        {validationResult && !validationResult.valid && (
          <p className="text-sm text-red-500" data-testid="validation-error">
            {validationResult.error}
          </p>
        )}
      </div>

      {validationResult?.valid && validationResult.repoInfo && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Repository Validated
              </span>
            </div>
            <div className="text-sm text-green-600 dark:text-green-400" data-testid="repo-info">
              <div><strong>Name:</strong> {validationResult.repoInfo.name}</div>
              {validationResult.repoInfo.description && (
                <div><strong>Description:</strong> {validationResult.repoInfo.description}</div>
              )}
              {validationResult.repoInfo.language && (
                <div><strong>Language:</strong> {validationResult.repoInfo.language}</div>
              )}
              <div>
                <strong>Visibility:</strong> {validationResult.repoInfo.private ? "Private" : "Public"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground">
        <p>Supported formats:</p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>https://github.com/owner/repository</li>
          <li>https://github.com/owner/repository.git</li>
          <li>git@github.com:owner/repository.git (converted automatically)</li>
        </ul>
      </div>
    </div>
  );
}