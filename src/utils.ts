export const isGitHubAction = () => {
    return process.env.GITHUB_ACTION === 'true';
}
