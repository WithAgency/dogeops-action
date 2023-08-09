/**
 * Returns true if the current environment is a GitHub Action.
 */
export function isGitHubAction() {
    return process.env.GITHUB_ACTION === 'true';
}
