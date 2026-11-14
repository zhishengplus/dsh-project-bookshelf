# Project Bookshelf · 项目书架

Recognize a workspace by its cover. Pick a chapter to reopen the conversation where you left off.

[Download v1.1.0](https://github.com/zhishengplus/dsh-project-bookshelf/releases/latest) · [中文](README.md)

![Six fictional workspaces on the collection shelf](docs/media/catalog.png)

## Install

In DeepSeek Harness, enable **Custom Plugin Index** under experimental plugins. From **Plugins → Discover**, add this index, select **Project Bookshelf** and install it:

```text
https://raw.githubusercontent.com/zhishengplus/dsh-project-bookshelf/main/market.json
```

For the Web CLI:

```sh
dsh plugin --profile web add https://github.com/zhishengplus/dsh-project-bookshelf/releases/download/v1.1.0/dsh-project-bookshelf-1.1.0.tgz
```

## Open the first book

The plugin replaces the workspace browsing area with a bookshelf by default. Your existing projects become books and their conversations become chapters. Select the featured cover to search by folder, alias, category or conversation title. Pick a chapter to reopen it.

The screenshots use fictional projects. Your installed bookshelf reads the project names, conversation titles and messages from your own DSH instance.

Select **Original workspace** at the bottom to use the native list. Select **Bookshelf mode** beside New session to return. Both views share the same projects, conversations, pins and archives. Your view preference survives reloads.

![Switching between the bookshelf and the native workspace](docs/media/switch.gif)

![Opening the collection and choosing a different project](docs/media/browse.gif)

The pencil opens a live cover proof with 12 paper colors and 12 printed motifs. The folder name stays on the cover even when you give the workspace a display alias. Press **Ctrl / ⌘ + Enter** to save. Cover alerts may highlight pending requests or unread completions.

Display names are saved through DSH. Cover preferences use host workspace metadata when available and client-local storage on other versions. Verified on the official DSH Web 0.2.2-rc.3 release on Windows. All public images show fictional workspaces in an isolated profile.

[MIT License](LICENSE) · [Report an issue](https://github.com/zhishengplus/dsh-project-bookshelf/issues)
