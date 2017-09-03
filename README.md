# Sync External Contributions

![header](https://user-images.githubusercontent.com/7189823/30006552-96e72362-90c8-11e7-8034-56f45bf72771.jpg)

This script is used to read all your contributions you've done on local repositories with [git-standup](https://github.com/kamranahmedse/git-standup) and create a GitHub contribution activity for every commits that you're the author.

It **does not copy** content of the commit, to respect NDA and privacy it only list all commits SHA you've made and write it to a file. This is totally safe.

## Why?

I have done this script because some contracts, projects, or business were not on GitHub has source control. I found it odd that some weeks or months were missing in my GitHub contributions activity as if I was not there. 

#### Should external contributions belong there? 
Personally I'm not sure, but since private contributions can be showed and some used this to show work activity, why not.

#### Will I use this? 
I'm not sure either, but if it can help someone I'll be happy.

#### Did I've some fun doing this? 
Hell yeah.

## Requirements

- [git-standup](https://github.com/kamranahmedse/git-standup)
- Node

## Installation

```
npm install -g sync-external-contributions
```

## Usage

First, you'll need a git repository where the contributions will be synced.

Create it where you want it (ex: `~/external-contributions`), run `git init` inside and push your initial commit with an empty file named `COMMITS`.

Create your repository on GitHub and add it as origin, origin will be automatically synced after each runs.

To sync every commits that you've done in `~/fake-project` into `~/external-contributions`:
```
sync-external-contributions --source ~/fake-project --destination ~/external-contributions
```

```
Options

  --source string[]      Source repositories to fetch commits
  --destination string   Destination repository to sync contributions into
  --days number          Specify the number of days back to include
  --dry-run              Will execute script without syncing
  --force                Force push to the destination (implicit with reset)
  --reset                Reset the destination repository
  -h, --help
```