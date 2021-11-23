const simpleGit = require('simple-git');
const fse = require('fs-extra');
const path = require('path');

let erros = []

console.log('repo-helper : ' + process.argv.join(', '))

let targetCommand = process.argv[2] || 'default'
console.log('targetCommand : ' + targetCommand)

async function updateRepo (basePath) {
  let packagePath = path.join(basePath, './package.json');
  if (!fse.existsSync(packagePath)) {
    return;
  }

  let package = fse.readJSONSync(packagePath);
  if (!package.repos) {
    return;
  }

  for (let repoPath in package.repos) {
    let { url, branch, recursive, commands } = package.repos[repoPath];

    if (!commands) {
      commands = ['default']
    }
    else if (!Array.isArray(commands)) {
      commands = [commands]
    }

    if (commands.indexOf(targetCommand) === -1) {
      continue;
    }

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
      erros.push({
        err,
        url
      });
    }

    if (recursive !== false) {
      targetCommand = 'default'
      await updateRepo(dst);
    }
  }
}


async function run () {
  let basePath = process.cwd();
  await updateRepo(basePath);

  console.log();

  if (erros.length) {
    erros.forEach(info => {
      console.log('------------------------------------');
      console.log(`Update repo [${info.url}] failed : `);

      console.error(info.err);
    })
  }
  else {
    console.info('Update repos successfully.');
  }
}

run();

