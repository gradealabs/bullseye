# Contributing

## Quick Start

    npm install
    npm run setup

## Commit Message Format

When installing the project dependencies locally a commit-msg hook will be
installed that will prevent commits from being created that do not following
the following format:

**Short Commits**

Short commits are commits without a body. They are typically created by running
`git commit -m "'refactor|feat|test|fix|style|docs|chore|perf(<Scope>): <Subject>'"`

**Long Commits**

Long commits are commits that have a body. They are typically created by running
`git commit` then entering your commit message:

    refactor|feat|test|fix|style|docs|chore|perf:(<Scope>): <Subject>
    <BLANK LINE>
    <Body>
    <BLANK LINE>
    <Footer>

Where `<Body>` can be a single paragraph or several paragraphs separated by a
blank line.

It's important that when a new feature is added that has a breaking change to
the app as perceived by its users that there be a paragraph in the body with the
words `BREAKING CHANGE` (casing is not important).

Example:

    BREAKING CHANGE: Replace the update() API so that a key is no longer
    accepted.

    Before:
    thing.update(myKey, name)

    After:
    thing.update(name)

