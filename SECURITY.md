# Security policy

## Supported versions

Only the latest release receives security fixes. Please update before reporting, in case the problem is already fixed (see [Updating](README.md#updating)). Pre-release builds from the `develop` branch are for testing and are fixed forward.

## Reporting a vulnerability

Please do not report security issues in public issues, pull requests or discussions.

Use GitHub's private vulnerability reporting instead: [report a vulnerability](https://github.com/RaunoT/plex-rewind/security/advisories/new). Only the maintainer can see the report.

Helpful things to include:

- What the problem is and what an attacker could do with it
- The Plex Rewind version and how you run it (Docker, reverse proxy, statistics source)
- Steps to reproduce, or a proof of concept
- A suggested fix, if you have one

Please leave out real API keys, tokens and your `NEXTAUTH_SECRET`.

## What to expect

Plex Rewind is maintained by one person in their spare time. I aim to reply within 7 days and to keep you updated until the report is resolved. Confirmed issues are fixed in a new release and published as a security advisory, crediting you unless you prefer not to be named. Please keep the details private until the fix is out.

## Scope

This covers the Plex Rewind code and its published Docker images. Problems in Plex, Tautulli, Tracearr or Overseerr should be reported to those projects.
