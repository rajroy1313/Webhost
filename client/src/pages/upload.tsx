import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { FileUpload } from "@/components/file-upload";
import { GitHubRepoInput } from "@/components/github-repo-input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Rocket, Plus, X, Upload as UploadIcon, GitBranch } from "lucide-react";

export default function Upload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [deploymentMethod, setDeploymentMethod] = useState<"file" | "github">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [githubRepo, setGithubRepo] = useState("");
  const [isRepoValid, setIsRepoValid] = useState(false);
  const [repoInfo, setRepoInfo] = useState<any>(null);
  const [botName, setBotName] = useState("");
  const [botDescription, setBotDescription] = useState("");
  const [runtime, setRuntime] = useState("");
  const [startCommand, setStartCommand] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async (data: {
      file?: File;
      config: any;
      repositoryUrl?: string;
    }) => {
      if (data.file) {
        // File upload
        const formData = new FormData();
        formData.append("file", data.file);
        formData.append("config", JSON.stringify(data.config));

        const response = await fetch("/api/bots/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }

        return response.json();
      } else if (data.repositoryUrl) {
        // GitHub deployment
        const response = await fetch("/api/bots/github", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repositoryUrl: data.repositoryUrl, ...data.config }),
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }

        return response.json();
      }

      throw new Error("No file or repository provided");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({
        title: "Bot deployed successfully!",
        description: "Your bot has been deployed and is ready to use.",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Deployment failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deploymentMethod === "file" && !selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (deploymentMethod === "github" && (!githubRepo || !isRepoValid)) {
      toast({
        title: "Invalid repository",
        description: "Please provide a valid GitHub repository URL.",
        variant: "destructive",
      });
      return;
    }

    if (!botName || !runtime || !startCommand) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const envVariables = envVars.reduce((acc, { key, value }) => {
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    const config = {
      name: botName,
      description: botDescription,
      runtime,
      startCommand,
      category: category || undefined,
      envVariables,
      isPublic,
    };

    if (deploymentMethod === "file") {
      uploadMutation.mutate({
        file: selectedFile!,
        config,
      });
    } else {
      uploadMutation.mutate({
        repositoryUrl: githubRepo,
        config,
      });
    }
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: "key" | "value", value: string) => {
    const updated = envVars.map((env, i) =>
      i === index ? { ...env, [field]: value } : env
    );
    setEnvVars(updated);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar botCount={0} />
        <main className="flex-1 p-6">
          <Card className="max-w-6xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground" data-testid="title-upload">
                Deploy New Bot
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                Upload your bot files and configure deployment settings
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Deployment Method Selection */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-4">Deployment Method</h4>
                    
                    {/* Method Toggle */}
                    <div className="flex p-1 bg-muted rounded-lg mb-4">
                      <button
                        type="button"
                        onClick={() => setDeploymentMethod("file")}
                        className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
                          deploymentMethod === "file"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        data-testid="tab-file-upload"
                      >
                        <UploadIcon className="w-4 h-4 mr-2" />
                        File Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeploymentMethod("github")}
                        className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
                          deploymentMethod === "github"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        data-testid="tab-github-repo"
                      >
                        <GitBranch className="w-4 h-4 mr-2" />
                        GitHub Repository
                      </button>
                    </div>

                    {/* File Upload */}
                    {deploymentMethod === "file" && (
                      <FileUpload
                        onFileSelect={setSelectedFile}
                        selectedFile={selectedFile || undefined}
                        onRemoveFile={() => setSelectedFile(null)}
                      />
                    )}

                    {/* GitHub Repository */}
                    {deploymentMethod === "github" && (
                      <GitHubRepoInput
                        value={githubRepo}
                        onChange={setGithubRepo}
                        onValidation={(valid, info) => {
                          setIsRepoValid(valid);
                          setRepoInfo(info);
                          if (valid && info) {
                            // Auto-fill some fields from repo info
                            if (!botName && info.name) setBotName(info.name);
                            if (!botDescription && info.description) setBotDescription(info.description);
                            if (!runtime && info.language) {
                              const languageMap: Record<string, string> = {
                                JavaScript: "Node.js 18",
                                TypeScript: "Node.js 18",
                                Python: "Python 3.11",
                                "Jupyter Notebook": "Python 3.11",
                              };
                              const detectedRuntime = languageMap[info.language];
                              if (detectedRuntime) setRuntime(detectedRuntime);
                            }
                          }
                        }}
                      />
                    )}
                  </div>

                  {/* Configuration */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-4">Bot Configuration</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="botName">Bot Name *</Label>
                        <Input
                          id="botName"
                          placeholder="My Amazing Bot"
                          value={botName}
                          onChange={(e) => setBotName(e.target.value)}
                          required
                          data-testid="input-bot-name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="botDescription">Description</Label>
                        <Textarea
                          id="botDescription"
                          placeholder="Describe what your bot does..."
                          value={botDescription}
                          onChange={(e) => setBotDescription(e.target.value)}
                          rows={3}
                          data-testid="input-bot-description"
                        />
                      </div>

                      <div>
                        <Label htmlFor="runtime">Runtime *</Label>
                        <Select value={runtime} onValueChange={setRuntime} required>
                          <SelectTrigger data-testid="select-runtime">
                            <SelectValue placeholder="Select runtime" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Node.js 18">Node.js 18</SelectItem>
                            <SelectItem value="Node.js 16">Node.js 16</SelectItem>
                            <SelectItem value="Python 3.11">Python 3.11</SelectItem>
                            <SelectItem value="Python 3.9">Python 3.9</SelectItem>
                            <SelectItem value="Deno 1.x">Deno 1.x</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="startCommand">Start Command *</Label>
                        <Input
                          id="startCommand"
                          placeholder="node index.js"
                          value={startCommand}
                          onChange={(e) => setStartCommand(e.target.value)}
                          required
                          data-testid="input-start-command"
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Music">Music</SelectItem>
                            <SelectItem value="Moderation">Moderation</SelectItem>
                            <SelectItem value="Games">Games</SelectItem>
                            <SelectItem value="Utility">Utility</SelectItem>
                            <SelectItem value="Fun">Fun</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-foreground">Environment Variables</Label>
                        <div className="space-y-2 mt-2">
                          {envVars.map((env, index) => (
                            <div key={index} className="flex space-x-2" data-testid={`env-var-${index}`}>
                              <Input
                                placeholder="KEY"
                                value={env.key}
                                onChange={(e) => updateEnvVar(index, "key", e.target.value)}
                                data-testid={`input-env-key-${index}`}
                              />
                              <Input
                                placeholder="VALUE"
                                value={env.value}
                                onChange={(e) => updateEnvVar(index, "value", e.target.value)}
                                data-testid={`input-env-value-${index}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEnvVar(index)}
                                className="text-muted-foreground hover:text-destructive"
                                data-testid={`button-remove-env-${index}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={addEnvVar}
                            className="text-primary hover:text-primary/80"
                            data-testid="button-add-env-var"
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Add Variable
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="public"
                          checked={isPublic}
                          onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                          data-testid="checkbox-public"
                        />
                        <Label htmlFor="public" className="text-sm text-foreground">
                          Make bot public in gallery
                        </Label>
                      </div>
                    </div>

                    <div className="mt-6 flex space-x-3">
                      <Button
                        type="submit"
                        disabled={uploadMutation.isPending}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        data-testid="button-deploy"
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        {uploadMutation.isPending ? "Deploying..." : "Deploy Bot"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={uploadMutation.isPending}
                        data-testid="button-save-draft"
                      >
                        Save Draft
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
