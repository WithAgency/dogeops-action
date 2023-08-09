"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGitHubAction = void 0;
/**
 * Returns true if the current environment is a GitHub Action.
 */
function isGitHubAction() {
    return process.env.GITHUB_ACTION === 'true';
}
exports.isGitHubAction = isGitHubAction;
//# sourceMappingURL=utils.js.map