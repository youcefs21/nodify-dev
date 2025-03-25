# The Nodify Project

<p align="center">
  <img src="extension-v2/assets/logo.png" alt="The Nodify Project logo" width="200"/>
</p>

Take your codebase understanding to the next level!
Nodify is a VSCode extension that visualizes the flow of execution through an entire program.
Using the power of AI, contributors and users alike can instantly grasp the architecture of any codebase.

<!-- TODO put link demo vid (from youtube?) -->

# User Guide

## Accessing Nodify through VSCode Marketplace

_Note: if the extension through VSCode Marketplace does not work, please try the [debug mode](#accessing-nodify-locally-debug-mode)_

# Contribution Guide

## Accessing Nodify Locally (Debug Mode)

## Publishing the Extension

Following the guide [here](https://code.visualstudio.com/api/working-with-extensions/publishing-extension), run the following commands:

```Powershell
cd extension-v2
vsce package
vsce publish
```

If the steps below do not work, check the personal access token status used to login to vsce and [nodify-dev](https://dev.azure.com/nodify-dev/) organization membership.
