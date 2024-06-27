#!/usr/bin/env node

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
    description:
      'Specify the level of subfolders to look for repos (default: 1)',
    defaultValue: 1,
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
  {
    name: 'silent',
    type: Boolean,
    description: 'Will not prompt',
    defaultValue: false,
  },
];

const options = commandLineArgs(optionDefinitions);

if (options.help === true || !options.source || !options.destination) {
  const sections = [
    {
      header: 'sync-external-contributions',
      content:
        'Synchronize your external contributions into your GitHub account',
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
  let resetPrompt;

  if (!options.silent) {
    resetPrompt = prompt(
      `Are you sure you want to reset ${options.destination}? (N/y) `,
    );
  } else {
    resetPrompt = 'y';
  }

  if (['y', 'Y'].includes(resetPrompt)) {
    const firstCommit = '`git rev-list --all | tail -1`';
    const resetStdout = exec(
      `cd ${options.destination} && git reset --hard ${firstCommit}`,
    ).stdout;

    if (resetStdout && !options.silent) {
      console.log(
        `${options.destination} (destination) was successfully reset.`,
      );
    } else {
      console.log(
        'An error occurred while resetting the destination repository',
      );
    }
  }
}

const { stdout } = exec(
  `cd ${options.source} && npx git-standup -d ${options.days} -m${options['folder-depth']} -D iso-strict`,
);

const commits = stdout.split('\n').reduce((formattedCommits, commit) => {
  let formattedCommit;

  if (commit.match(/^\w{7,10}\s[-]*/)) {
    formattedCommit = {
      commit: commit.split('-')[0],
      date: commit
        .match(/[(]\d{4}-\d{2}-\d{2}[T]\d{2}[:]\d{2}:\d{2}[^)]*/)[0]
        .replace(/\(|\)/g, ''),
    };
  }

  return formattedCommit
    ? [...formattedCommits, formattedCommit]
    : formattedCommits;
}, []);

if (!options.silent) {
  if (commits.length === 0) {
    console.error("Couldn't find any commits");
  } else if (commits.length === 1) {
    console.log(`${commits.length} commit was found`);
  } else {
    console.log(`${commits.length} commits were found`);
  }
}

if (!commits.length) {
  process.exit();
}

let syncPrompt;

if (!options.silent) {
  syncPrompt = prompt(
    `Are you sure you want to sync your contributions of ${options.source} into ${options.destination}? (Y/n) `,
  );
} else {
  syncPrompt = 'y';
}

if (!['y', 'Y', ''].includes(syncPrompt)) {
  process.exit();
}

const commitSorted = commits.sort((a, b) => {
  if (a.date > b.date) {
    return 1;
  }
  if (a.date < b.date) {
    return -1;
  }

  return 0;
});

const outputFile = 'COMMITS';

const nbNewCommits = commitSorted.reduce((count, commit) => {
  const grepStdout = exec(
    `cd ${options.destination} && grep -R ${commit.commit} ${outputFile}`,
  ).stdout;
  const isNewCommit = !grepStdout;

  if (isNewCommit) {
    if (!options['dry-run']) {
      exec(
        `cd ${options.destination} && echo "${commit.commit}" >> ${outputFile} && git add . && git commit -m "${commit.commit}" --date="${commit.date}"`,
      );
    }
    return count + 1;
  }

  return count;
}, 0);

if (!options.silent) {
  console.log(`${nbNewCommits} commits have been created`);
}

if (options['dry-run'] && !options.silent) {
  console.log('Dry run executed');
} else if (!nbNewCommits && !options.silent) {
  console.log('Nothing to do');
} else {
  let pushCommand = `cd ${options.destination} && git push origin main`;

  if (options.force || options.reset) {
    pushCommand += ' -f';
  }

  const { stderr } = exec(pushCommand);
  if (!options.silent) {
    if (!stderr) {
      console.log(
        'External contributions were successfully synchronized to GitHub',
      );
    } else {
      console.error(stderr);
    }
  }
}
