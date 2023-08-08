"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGitHubAction = void 0;
const isGitHubAction = () => {
    return process.env.GITHUB_ACTION === 'true';
};
exports.isGitHubAction = isGitHubAction;
//# sourceMappingURL=utils.js.map