---
layout: page
title: Tags
permalink: /tags
---

<p class="post-date">Browse every publication by topic. Select a tag to see all posts that share it.</p>

<div class="tag-cloud">
  {% assign sorted_tags = site.tags | sort %}
  {% for tag_pair in sorted_tags %}
    {% assign tag_name = tag_pair[0] %}
    {% assign tag_count = tag_pair[1].size %}
    <a class="tag-button" href="{{ site.github.url }}/tags/{{ tag_name | slugify }}">
      {{ tag_name }} <span class="tag-count">{{ tag_count }}</span>
    </a>
  {% endfor %}
</div>
