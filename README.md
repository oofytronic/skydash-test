# SkyDash CMS

**An experimental CMS looking to help users work locally first and manage content effectively. Eventually Decentralized.**

This is a test repository for SkyDash. The `skydash` repository contains all of the SkyDash code. The test site includes the home page and an article page.

## Features
- Media library
- Collections
- Instances
- Users
- Roles
- Visual Editing (via data-attributes)
- Local-first Storage (via IndexedDB)

## How to Test it Out
1. Download the test site.
2. Spin up a development server like `live-server`
3. At the bottom of the website you'll find a modal where you can create a user.
4. Once you've created a user you can click on the modal to open up the dashboard.
5. From the dashboard you can open the media library, edit the user information, create collections and instances and update information.
6. On the homepage and article page you can hover over elements and you'll find a visual editing UI. Click within the element and highlight over some text and then style it with one of the buttons.
7. Any change you make is saved locally.

## The Future
SkyDash as it currently stands is just an experiment to see if this type of workflow would be appealing to both developers and users. The future SkyDash would be a script a website owner could add to their custom website. The script would look for data-attributes on elements to display the necessary visual editing interface. SkyDash would come with a full-featured, decentralized user management system and storage system using IndexedDB and IPFS. This would allow website owners to maintain autonomy over their websites and edit their content without the large overhead cloud-based solutions usually come with.