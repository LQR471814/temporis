# Temporis

> This project is currently a WIP.

![example](./screenshot.png)

# Todo

- Correctness:
    - [x] Bug: Make "other tasks" of a timeframe not include
      children of child tasks.
    - [x] Bug: Make estimates of parent task update when child
      tasks update their durations.
    - [ ] Bug: Make estimates update properly, don't delete +
      create when moving tasks.
- Features:
    - [ ] Feature: Add UI to view the children tasks and total
      duration of a given task in the properties pane
    - [ ] Feature: Add UI to view the actual (estimated) time in
      hours for children percentages.
    - [ ] Feature: Add a button to delete the task without also
      deleting all of its children.
    - [ ] Feature: Multiple executors.
- Semantics / Minor correctness:
    - [x] Bug: Make children percentage UI accept percentages
      instead of proportions.
    - [ ] Bug: Sometimes tasks do not properly move when doing DND
      while operating the "Create Task" menu.
    - [ ] Enhance: Refactor hierarchy enums to use a number.
- Nice to haves:
    - [ ] Enhance: Make the UI higher contrast.
    - [ ] Enhance: Make a proper dark mode.
    - [ ] Enhance: Make dragging tasks between the vertical and
      horizontal components not get hidden by CSS overflow
      controls.
    - [ ] Enhance: Space usage of properties pane.
    - [ ] Enhance: Make typescript solid-js directives work with
      Typescript.

