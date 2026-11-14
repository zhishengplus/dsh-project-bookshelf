# Project Bookshelf · 项目书架

Recognize a workspace by its cover. Pick a chapter to reopen the conversation where you left off.

[Download v1.0.0](https://github.com/zhishengplus/dsh-project-bookshelf/releases/latest) · [中文](README.md)

![Six fictional workspaces on the collection shelf](docs/media/catalog.png)

## Install

In DeepSeek Harness, enable **Custom Plugin Index** under experimental plugins. From **Plugins → Discover**, add this index, select **Project Bookshelf** and install it:

```text
https://raw.githubusercontent.com/zhishengplus/dsh-project-bookshelf/main/market.json
```

For the Web CLI:

```sh
dsh plugin --profile web add https://github.com/zhishengplus/dsh-project-bookshelf/releases/download/v1.0.0/dsh-project-bookshelf-1.0.0.tgz
```

## Open the first book

Expand the shelf under **New session**. Your existing workspaces appear automatically. Select the featured cover to search by folder, alias or category. Pick a chapter by title or resume the most recently updated session.

![Opening the collection and choosing a different project](docs/media/browse.gif)

The pencil opens a live cover proof with 12 paper colors and 12 printed motifs. The folder name stays on the cover even when you give the workspace a display alias. Press **Ctrl / ⌘ + Enter** to save. Cover alerts may highlight pending requests or unread completions.

Cover preferences are stored in the current client. Removing the plugin from the installed plugins page preserves the original workspaces and conversations. Verified on the official DSH Web 0.2.2-rc.3 release on Windows. All public images show fictional workspaces in an isolated profile.

[MIT License](LICENSE) · [Report an issue](https://github.com/zhishengplus/dsh-project-bookshelf/issues)
