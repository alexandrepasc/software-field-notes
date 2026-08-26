---
layout: post
title: "Quickshell Sway Modes Plugin"
author: "Alexandre Pascoal"
categories: [development]
tags: [linux, qml, quickshell, dms, sway]
image: 2026-08-23-system-updates-qml-plugin/main-img.jpg
---

Keeping with the same theme of the post [Quickshell System Updates Plugin](https://alexandrepasc.github.io/software-field-notes/system-updates-qml-plugin). I created another plugin to integrate the [Dank Material Shell](https://danklinux.com/) and [SwayWM](https://swaywm.org/).

## Problem

_Sway_ have a keybind configuration that enables the user to create "layers", similar to the [vim](https://www.vim.org/) modes, or the layers present in a computer keyboard. This allow a key or key combination to have different actions depending on what mode is active.

As an example, I have the `CMD+M` to open the mail client in **normal mode** and have the same key combination to open the mastodon client in the **social mode**. To define this in _Sway_, and not expanding on this, we define the mode, the keybinds in it, and a keybind to activate it.

```
mode "print" {
	# Print Area
	bindsym A mode "default" ; exec dms screenshot # Print Area
	# Print Screen
	bindsym S mode "default" ; exec dms screenshot full # Print Screen
	# Print Window
	bindsym W mode "default" ; exec dms screenshot window # Print Window
	# Exit Print Mode
	bindsym Escape mode "default" ; # Exit Print Mode
}
# Open Print Mode
bindsym Print mode "print" ; # Open Print Mode
```

The problem with this is that when using the _OS_ we don't have any information in what mode we are, and if we have cats that jumps to the keyboard we are in trouble :)

## Solution

In _DMS_ exists a plugin that displays the mode that is active but it only works for _Hyprland_, but I'm using _sway_ so... you know what I did.

I created a plugin to display the name of the active mode in the _Dank Bar_, using the theme style. It only displays the name of the mode if the active is not the _default_.

## Resolution

_Sway_ has the binging state available using the command `swaymsg -t get_binding_state`, the returns a _json_ with the name of the active state.

```
swaymsg -t get_binding_state
{
  "name": "default"
}
```

I used the `Process QtObject` to execute the `swaymsg` call and retrieve the response. The [Process](https://quickshell.org/docs/v0.3.1/types/Quickshell.Io/Process/) has a list of properties from where I used the `id`, `command`, and `stdout`.

With the `command` I execute the command and with the `stdout` retrieved the response, the `id` it's the identification of the `Process` component so we can call it from other code component.

With the response data and using the [SplitParser]{https://quickshell.org/docs/v0.3.1/types/Quickshell.Io/SplitParser/?highlight=splitparser} I managed to `trim` and `split` the data (not my brightest work) to have the name of the current active _mode_.

Created two global variables to store the name of the _mode_ and if the name should or not be displayed (if is or not the `default` _mode_), these variables are updated in the `Process`, and be used in the `horizontalBarPill` to display or not the name.

I'm not sure if the monitoring of the binding state could be done another way or not, but I used the [Timer](https://doc.qt.io/qt-6/qml-qtqml-timer.html) from _QtQuick_ to execute the `Process` every `200` milliseconds.

## Conclusion

As in the other post, my knowledge in [Quickshell](https://quickshell.org/) is not the medium. But the ability to create this types of applications gives me some curiosity to play with the framework every time I find some of these cases, and to improve the apps that I build.

This plugin has room to be improved, the retrieve the data from the `swaymsg` I'm pretty sure that if I invest some time could be better developed. Another point that I missed and didn't took time to implement is the `verticalBarPill`, at the moment the plugin only displays the text horizontally so it won't be visible in a vertical bar.

If you are interested in using, improving, or just take a look at it, you can find it in the _Codeberg_ repo [quickshell-sway-modes-plugin](https://codeberg.org/alexandrepascoal/quickshell-sway-modes-plugin).

If you find an issue with it, or have some improvement to it fill free to ping me or make a propose in the repo.
