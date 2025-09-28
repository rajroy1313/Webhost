import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

export async function downloadRepository(repoUrl: string, targetPath: string): Promise<string> {
  try {
    const github = await getUncachableGitHubClient();
    
    // Parse GitHub URL to extract owner and repo
    const urlPattern = /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?(?:\/.*)?$/;
    const match = repoUrl.match(urlPattern);
    
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    
    const [, owner, repo] = match;
    const repoName = repo.replace('.git', '');
    
    // Get repository archive
    const { data } = await github.rest.repos.downloadZipballArchive({
      owner,
      repo: repoName,
    });
    
    return data as string;
  } catch (error: any) {
    console.error('Error downloading repository:', error);
    throw new Error(`Failed to download repository: ${error.message}`);
  }
}

export async function validateRepository(repoUrl: string): Promise<{ valid: boolean; error?: string; repoInfo?: any }> {
  try {
    const github = await getUncachableGitHubClient();
    
    const urlPattern = /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?(?:\/.*)?$/;
    const match = repoUrl.match(urlPattern);
    
    if (!match) {
      return { valid: false, error: 'Invalid GitHub repository URL' };
    }
    
    const [, owner, repo] = match;
    const repoName = repo.replace('.git', '');
    
    // Check if repository exists and is accessible
    const { data: repoInfo } = await github.rest.repos.get({
      owner,
      repo: repoName,
    });
    
    return { 
      valid: true, 
      repoInfo: {
        name: repoInfo.name,
        description: repoInfo.description,
        language: repoInfo.language,
        private: repoInfo.private
      }
    };
  } catch (error: any) {
    return { 
      valid: false, 
      error: error.status === 404 ? 'Repository not found or not accessible' : error.message 
    };
  }
}