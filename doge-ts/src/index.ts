import path from "path";
import * as core from '@actions/core'

interface Args {
    api_url: string,
    api_key: string,
    dogefile: string,
    event: string,
    repo: string,
    ref: string,
    verbose: boolean,
}

function getArgs(): Args {
    const args = {
        api_url: core.getInput('api_url'),
        api_key: core.getInput('api_key'),
        dogefile: core.getInput('dogefile'),
        event: core.getInput('event_name'),
        repo: core.getInput('repo') ?? process.env.GITHUB_WORKSPACE,
        ref: core.getInput('ref') ?? process.env.GITHUB_REF,
        verbose: core.getInput('verbose') === 'true' ?? false,
    }

    if (args.repo) {
        args.repo = path.resolve(args.repo);
    }

    args.dogefile = path.resolve(args.repo, args.dogefile);

    return args;
}

const args: Args = getArgs();

async function run(args: Args) {
    return args;
}

run(args).then(res => {
    console.log(res);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
