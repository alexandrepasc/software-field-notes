---
layout: post
title: "GIMP MCP Experiment"
author: "Alexandre Pascoal"
categories: [development]
tags: [ai, mcp, gimp, linux]
---

Liking or not the _Large Language Models_ (_LLMs_), or as we normally call them the _Artificial Intelligence_ (_AI_), is here to stay.
In the _IT_ it is being pushed to be used, in some cases we can have the opinion that it is being too far, but the reality is that there there are a lot of tasks and repetitive work that can be automated and accelerated with it.
Another point that this tool could be helpful is in tasks that we do not have experience. This could be a must being able to execute it, acquiring the insight on how to do it, and giving the change to learn new skills.

I do not have taste, for design or experience with design tools so every time I need to create an image or a design it is a problem to me. The time that I spent testing designs, exploring the tools available in the design application that I'm using is a lot of time. Since I don't have this type of tasks regularly the knowledge that I gain during the task execution, is not consolidated.

For this page I need to create a hero image for each post, as described previously this would be a pain. This page should be an informal documentation of some experiences that I do, or some notes on how to use some tool, spending time to create a hero image would go against the objective of creating a post were the only overhead is acquiring the experience and knowledge on the application, tool, or procedure that I'm writing.

Some weeks ago came to my attention that someone created an _MCP_ for the GIMP application. And since I've being using the _ChatGPT_ to generate the other posts images, and they are not what I tend to say that are good and/or professional (but better and faster that I would do manually) I thought that this could a good tool to explore.

After a fast research I discover that there are more then only one _GIMP MCP_ available, and found a list of them with some evaluation in this page [Glama Best GIMP MCP Servers](https://glama.ai/mcp/servers/integrations/gimp). Don't know que quality of this site, It's the first time that have seen it.

With the objective to create a new image and not only editing an existing one, I looked into the list and to the evaluation that it has regarding _license_, _quality_, _maintenance_, and the last updated I selected this one to test [gimp3-mcp by tifyr](https://glama.ai/mcp/servers/tifyr/gimp3-mcp).

It had the last update 11 days ago (from the date that I'm writing this post), have an _A_ rate for _license_ and _maintenance_. The only item that do not has any rate is for _quality_. It supports _GIMP 3.2_, and has the ability to create or open images, paints, edits, and exports them, and looks at the image between steps to check its work.

To install it I followed the steps in the installation section in the [github](https://github.com/tifyr/gimp3-mcp) repository. The system that I'm using for test it has a [The Void (linux)](https://voidlinux.org/) distribution, and had no issue installing it.

To test this I used the [OpenCode](https://opencode.ai/) harness, with it's free tier
