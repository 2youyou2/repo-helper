const simpleGit = require('simple-git');
const fse = require('fs-extra');
const path = require('path');

let basePath = process.cwd;

run(basePath);

async function run(basePath) {
  let packagePath = path.join(basePath, './package.json');
  if (!fse.existsSync(packagePath)) {
    return;
  }

  let package = fse.readJSONSync(packagePath);
  if (!package.repos) {
    return;
  }

  for (let repoPath in package.repos) {
    let { url, branch } = package.repos[repoPath];
    let dst = path.join(basePath, repoPath);
    fse.ensureDirSync(dst);

    console.log('-------------------------------------');
    console.log(`Updating git [${repoPath}] : [${url}]`);

    let git = simpleGit(dst, { binary: 'git' });
    try {
      console.log(`Init git`);
      await git.init();

      console.log(`Check git remotes`);
      let remotes = await git.getRemotes();
      if (!remotes || !remotes.find((r) => r.name === 'origin')) {
        await git.addRemote('origin', url);
      }

      console.log(`Fetch git`);
      await git.fetch(['origin']);

      // let logs = await git.log([`origin/${branch}`]);
      // console.log(`Show git : `, logs);

      // let branches = await git.branchLocal().all;
      // console.log(`Current branches : `, branches);

      console.log(`Checkout git branch : ${branch}`);
      await git.checkout(['-B', branch, `origin/${branch}`]);
      // await git.checkout([`origin/${branch}`]);
    } catch (err) {
      console.error(err);
    }

    await run(dst);
  }
}
