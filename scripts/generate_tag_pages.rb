#!/usr/bin/env ruby
# frozen_string_literal: true

# Generates Jekyll source pages for post tags so tag browsing works on
# GitHub Pages, where custom generator plugins do not run.
#
#   bundle exec ruby scripts/generate_tag_pages.rb          # create missing pages
#   bundle exec ruby scripts/generate_tag_pages.rb --prune  # also delete stale pages
#
# Idempotent: safe to re-run. Commit the generated pages/tag-*.md files.

require "yaml"
require "fileutils"

ROOT = File.expand_path("..", __dir__)
POSTS_DIR = File.join(ROOT, "_posts")
PAGES_DIR = File.join(ROOT, "pages")
PRUNE = ARGV.include?("--prune")

# Reads the YAML front matter of a post; returns {} on parse errors.
def front_matter(path)
  content = File.read(path)
  match = content.match(/\A---\s*\n(.*?)\n---\s*\n/m)
  return {} unless match

  YAML.safe_load(match[1], permitted_classes: [Date, Time], aliases: true) || {}
rescue Psych::SyntaxError => e
  warn "WARNING: could not parse #{path}: #{e.message}"
  {}
end

# Replicates Jekyll's `slugify` filter so template links ({{ tag | slugify }})
# and the generated permalinks can never diverge.
def slugify(tag)
  str = tag.to_s.downcase.strip
  str.gsub!(/[^a-z0-9\s-]/, "")
  str.gsub!(/[\s-]+/, "-")
  str.gsub!(/\A-+|-\z/, "")
  str
end

def yaml_scalar(value)
  YAML.dump(value).strip.sub(/\A---\s*/, "")
end

def page_template(tag, slug)
  <<~FRONT_MATTER
    ---
    layout: tag
    title: #{yaml_scalar("Tag: #{tag}")}
    tag: #{yaml_scalar(tag)}
    permalink: /tags/#{slug}
    ---
  FRONT_MATTER
end

tags = []
Dir.glob(File.join(POSTS_DIR, "*.md")).sort.each do |path|
  tags.concat(Array(front_matter(path)["tags"]).map(&:to_s))
end
tags = tags.reject(&:empty?).uniq

created = 0
skipped = 0
tags.each do |tag|
  slug = slugify(tag)
  page_path = File.join(PAGES_DIR, "tag-#{slug}.md")
  if File.exist?(page_path)
    skipped += 1
    next
  end
  File.write(page_path, page_template(tag, slug))
  created += 1
  puts "created pages/tag-#{slug}.md"
end

pruned = 0
if PRUNE
  current = tags.map { |t| "tag-#{slugify(t)}.md" }
  Dir.glob(File.join(PAGES_DIR, "tag-*.md")).sort.each do |path|
    next if current.include?(File.basename(path))

    File.delete(path)
    pruned += 1
    puts "pruned #{File.basename(path)}"
  end
end

puts "#{created} created, #{skipped} already present#{PRUNE ? ", #{pruned} pruned" : ""}"
