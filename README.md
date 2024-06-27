# Sync External Contributions [![npm](https://img.shields.io/npm/v/sync-external-contributions.svg)](https://www.npmjs.com/package/sync-external-contributions)

![header](https://user-images.githubusercontent.com/7189823/30006552-96e72362-90c8-11e7-8034-56f45bf72771.jpg)

Utilize [git-standup](https://github.com/kamranahmedse/git-standup) to read all your authored contributions on local repositories and generate a GitHub contribution activity for each commit linked to you.

**Privacy Focused:** The script respects your NDA and privacy by not copying commit content. Instead, it lists all authored commit SHAs and writes them to a file, ensuring a secure process.

## Purpose

This script is designed for situations where your work is not hosted on GitHub. Missing GitHub contributions can misrepresent your activity, especially when working on projects or contracts that use different source control systems.

## Considerations

### Should External Contributions Be Included?

The inclusion of external contributions in your GitHub activity is debatable. However, since GitHub allows displaying private contributions, including these can reflect your complete activity.

## Usage

First, you'll need a git repository where the contributions will be synced.

Create it where you want it (e.g. `~/external-contributions`), run `git init` inside and push your initial commit with an empty file named `COMMITS`.

Create your repository on GitHub and add it as origin, origin will be automatically synced after each runs.

To sync every commits that you've done in `~/some-project` into `~/external-contributions`:

```
npx sync-external-contributions --source ~/some-project --destination ~/external-contributions
```

```
Options

  --source string[]      Source repositories to fetch commits
  --destination string   Destination repository to sync contributions into
  --days number          Specify the number of days back to include
  --folder-depth         Specify the number of subfolders to look for repos in source
  --dry-run              Will execute script without syncing
  --force                Force push to the destination (implicit with reset)
  --reset                Reset the destination repository
  --silent               Will not prompt
  -h, --help
```

## License

sync-external-contributions is [MIT Licensed](LICENSE).
