---
description: Version history and guidance
icon: arrows-rotate-reverse
---

# Changelog

{% updates format="full" %}
{% update date="2026-01-04" %}
## v0.7.9

Added functional Calendar app and adapted the system to accommodate.

<details>

<summary>Added</summary>

* **Calendar App:** with core functionality of adding, removing, and modifying an event. Calendar is one of the first apps that are file dependent, to enhance gameplay. It uses and references \~/.config/calendar.json to create hackable moments.
* CONTRIBUTION.md, CONTRIBUTORS.ms

</details>

<details>

<summary>Improved</summary>

* **UI Immersion:** Text is now not selectable by default, except input area such as text area and fields.
* **Apps responsive design:** The sidebar of the apps uses a new way to determine if it requires the condensed or the relaxed variation of it based on the app window width.
* **Notifications:** Instead of the debugging "toast" we use the stylized notifications (success, warning, error).
* **Text highlight:** to follow accent color in input fields.
* **Agentic IDE:** Updated .gitignore to include .agent/rules/codeQuality.md that aims to create a base knowledge for code quality scans and future documentation (CODEBASE.md will be affected by this).
* **OPEN-SOURCE.md:** to reflect newest libs and dependences.

</details>

<details>

<summary>Removed</summary>

* **Videos App (placeholder):** Aurora OS.js experience won't include video files as game world element.
* **Videos Home Directory:** \~/Videos clean-up to not give users false impressions.

</details>

<details>

<summary>Know issues</summary>

* Had to regres `react-day-picker` to 8.10.1 as 9.13.0 was newer than the requirement of shadcn library (that we depend of) and broke the functionality.

No other new known issues reported in this release. You can contribute to the next release by [oppening an Issue](https://github.com/mental-os/Aurora-OS.js/issues) on the official [Aurora OS.js GitHub repository](https://github.com/mental-os/Aurora-OS.js).

</details>
{% endupdate %}

{% update date="2026-01-02" %}
## v0.7.8

UX quality of life enhancements for interacting with files visually.

<details>

<summary>Added</summary>

* **Multi-Selection:** Drag-selection and key-down selection support in both Finder and Desktop.
* **Smart User Provisioning:** New users (and Guest) now start with clean, empty home directories, while the default user retains sample content.

</details>

<details>

<summary>Improved</summary>

* **Grid Fluency:** Desktop grid logic improved for smoother icon snapping and collision handling.
* **Modern Standards:** Default support for ES2022 enhanced across the development environment.
* **Login Screen:** Polished UI consistency for user avatars and overall interface.

</details>

<details>

<summary>Fixed</summary>

* **Enhanced Drag & Drop:** Dragging multiple files between Finder and Desktop now works seamlessly.
* **App Store:** Permission issues when launching newly installed apps via Terminal resolved.
* **Music App:** Infinite scanning loops fixed and directory targeting improved (\~/Music or \~/).

</details>

<details>

<summary>Know issues</summary>

No new known issues reported in this release. You can contribute to the next release by [oppening an Issue](https://github.com/mental-os/Aurora-OS.js/issues) on the official [Aurora OS.js GitHub repository](https://github.com/mental-os/Aurora-OS.js).

</details>
{% endupdate %}
{% endupdates %}
