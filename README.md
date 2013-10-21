ReSpec-Issues
================

ReSpec-Issues is a small utility to turn ReSpec issues into GitHub issues
and link these together via the data-number attribute. It also allows to
easily update them by regularly running the script.

This script simply iterates through all the issues it finds in the the spec and
creates or updates them on GitHub. It then adds the data-number attribute that
references the GitHub issue directly back into the file. You can then simply
push those changes back to the GH repository and you're done.

You'll need to [generate a GH token][token] for this script to work and pass it
to the script as an env variable or through the command line args.

Install
-------

Install as a global npm package:

```
$ npm install -g respec-issues
```

Usage
-----

1.  First, set the `issueBase` property of the `respecConfig` object to:
    
    ```
    http://github.com/:owner/:repo/issues
    ```
    
2.  [Generate a GH token][token]
    
3.  Just run the following from the CLI.
    
    ```
    $ respec-issues ./path/to/spec/file [your-github-token]
    ```
    
    Note that you can also pass the [GitHub token][token] as the `GITHUB_TOKEN`
    env variable.
    
4.  Commit the changes in the spec to the repo.
    
5.  When you remove the issue from the spec, remember to add say so in the commit
    message (e.g. `"... closes #32."`) as GitHub will pick it that up and close
    the issue for you.

[token]: https://help.github.com/articles/creating-an-access-token-for-command-line-use