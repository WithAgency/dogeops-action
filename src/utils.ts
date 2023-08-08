export function isGitHubAction() {
    return process.env.GITHUB_ACTION === 'true';
}
