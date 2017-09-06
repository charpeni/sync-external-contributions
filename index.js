const exec = require('sync-exec');
const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const prompt = require('prompt-sync')();

const optionDefinitions = [
  {
    name: 'source',
    type: String,
    multiple: true,
    description: 'Source repositories to fetch commits',
  },
  {
    name: 'destination',
    type: String,
    description: 'Destination repository to sync contributions into',
  },
  {
    name: 'days',
    type: Number,
    description: 'Specify the number of days back to include',
    defaultValue: 999999,
  },
  {
    name: 'folder-depth',
    type: Number,
    description: 'Specify the level of subfolders to look for repos (default: 1)',
    defaulValue: 1,
  },
  {
    name: 'dry-run',
    type: Boolean,
    description: 'Will execute script without syncing',
  },
  {
    name: 'force',
    type: Boolean,
    description: 'Force push to the destination (implicit with reset)',
  },
  {
    name: 'reset',
    type: Boolean,
    description: 'Reset the destination repository',
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    defaultOption: true,
    defaultValue: false,
  },
];

const options = commandLineArgs(optionDefinitions);

if (options.help === true || !options.source || !options.destination) {
  const sections = [
    {
      header: 'sync-external-contributions',
      content: 'Syncronize your external contributions into a fake GitHub repo',
    },
    {
      header: 'Options',
      optionList: optionDefinitions,
    },
  ];

  const usage = getUsage(sections);
  console.log(usage);
}

if (!options['dry-run'] && options.reset) {
  const resetPrompt = prompt(`Are you sure you want to reset ${options.destination}? (N/y) `);

  if (['y', 'Y'].includes(resetPrompt)) {
    const firstCommit = '`git rev-list --all | tail -1`';
    const resetStdout = exec(`cd ${options.destination} && git reset --hard ${firstCommit}`).stdout;

    if (resetStdout) {
      console.log(`${options.destination} were successfully reset.`);
    } else {
      console.log('An error occured while resetting the destination repository');
    }
  }
}

const { stdout } = exec(`cd ${options.source} && git standup -d ${options.days} -m${options['folder-depth']} -D iso-strict`);

const commits = stdout
  .split('\n')
  .reduce((formattedCommits, commit) => {
    let formattedCommit;

    if (commit.match(/^\w{7,9}\s[-]*/)) {
      formattedCommit = {
        commit: commit.substring(0, 7),
        date: commit
          .match(/[(]\d{4}-\d{2}-\d{2}[T]\d{2}[:]\d{2}:\d{2}[^)]*/)[0]
          .replace(/\(|\)/g, ''),
        author: commit.match(/[^<]*(?:<([^>]*)>)$/)[1],
      };
    }

    return formattedCommit ? [...formattedCommits, formattedCommit] : formattedCommits;
  }, []);

console.log(`${commits.length} commits were found`);

const syncPrompt = prompt(`Are you sure you want to sync your contributions of ${options.source} into ${options.destination}? (Y/n) `);

if (!['y', 'Y', ''].includes(syncPrompt)) {
  process.exit();
}

const commitSorted = commits.sort((a, b) => {
  if (a.date > b.date) {
    return 1;
  } else if (a.date < b.date) {
    return -1;
  }

  return 0;
});

const outputFile = 'COMMITS';

const nbNewCommits = commitSorted.reduce((count, commit) => {
  const grepStdout = exec(`cd ${options.destination} && grep -R ${commit.commit} ${outputFile}`).stdout;
  const isNewCommit = !grepStdout;

  if (isNewCommit) {
    if (!options['dry-run']) {
      exec(`cd ${options.destination} && echo "${commit.commit}" >> ${outputFile} && git add . && git commit -m "${commit.commit}" --date="${commit.date}"`);
    }
    return count + 1;
  }

  return count;
}, 0);

console.log(`${nbNewCommits} commits have been created`);

if (options['dry-run']) {
  console.log('Dry run executed');
} else if (!nbNewCommits) {
  console.log('Nothing to do');
} else {
  let pushCommand = `cd ${options.destination} && git push origin master`;

  if (options.force || options.reset) {
    pushCommand += ' -f';
  }

  const { stderr } = exec(pushCommand);

  if (!stderr) {
    console.log('External contributions were successfully syncronized to GitHub');
  } else {
    console.error(stderr);
  }
}
