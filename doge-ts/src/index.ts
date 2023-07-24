const { Command } = require("commander"); // add this line
const figlet = require("figlet");

const program = new Command();

console.log(figlet.textSync("DogeOps Action"));

/**
 * Retrieve the version of the package from the package.json file
 */
function getPackageVersion() {
  const packageJson = require("../package.json");
  return packageJson.version;
}

program
    .version(getPackageVersion())
    .description("A CLI to start a DogeOps deployment")
    .option("-d, --dogefile <path>", "Path to the Dogefile to use")
    .option("-e, --event <name>", "Name of the event that triggered the deployment")
    .option("-r, --repo <path>", "Path to the repository to deploy")
    .option("-f, --ref <ref>", "Git ref to deploy")
    .option("-v, --verbose", "Verbose output")
    .parse(process.argv);


const options = program.opts();


