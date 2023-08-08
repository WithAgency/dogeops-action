"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGitHubAction = void 0;
function isGitHubAction() {
    return process.env.GITHUB_ACTION === 'true';
}
exports.isGitHubAction = isGitHubAction;
//# sourceMappingURL=utils.js.map