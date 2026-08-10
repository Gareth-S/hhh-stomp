# Song2HTML

Song2HTML is a simple, local-first digital music stand for musicians.

The basic idea is deliberately uncomplicated:

Take a song containing lyrics and chords, turn it into a readable HTML page, and provide the bits of functionality needed to use it comfortably on stage.

The project is being built with plain HTML, CSS and JavaScript, with a small amount of PHP where a local server is useful for saving data.

## What it does

Song2HTML currently provides:

- HTML song pages generated from song text
- Chords and lyrics displayed together
- Section and line anchors
- User notes attached to:
  - the whole song
  - sections
  - individual lyric lines
- Per-user notes
- Editable notes through a simple editor
- Local JSON storage for user notes
- Song catalogue and setlist handling
- Drag-and-drop setlist ordering using SortableJS
- Visual indication of songs already in the current setlist
- Visual indication of deliberate duplicate songs in a setlist
- Themes
- Adjustable text size
- A shared navigation/burger menu

## The general idea

The project is intended to be useful on a band's own local network rather than depending on an internet service.

## Offline first
One of the design goals is for the application to become a Progressive Web App (PWA).

The exact implementation is still being worked out.

At the moment, some JSON data is loaded using fetch(), so those parts currently require the application to be served rather than simply opened as file://.

This is intentional for now and will be replaced or supplemented as the offline architecture develops.

## Technology
The project deliberately avoids a large framework.
But is also an experiment in vibe coding with ai :)

The current stack is:

-HTML
-CSS
-JavaScript
-JSON
-PHP where required for local saving
-SortableJS for drag-and-drop setlist handling

The aim is to keep the application understandable and editable by hand.

Development approach
This project is being built incrementally.

The guiding principle is:

KISS — Keep It Simple, Stupid.

Small working changes are preferred over trying to design the entire application in advance.

Git is used to keep known-good checkpoints so experiments can be made without being afraid of breaking something.

The UI is also being developed deliberately simply at first. Once the underlying functionality works, styling and more advanced behaviour can be added without unnecessarily complicating the core code.

Current status
The project is currently in V1 development.

The basic song display and user-note system are working.

The song catalogue and setlist UI are now being developed.

The immediate goals are:

complete setlist editing

save and reload setlists

establish the bandleader/master-setlist behaviour

finish the basic V1 UI

continue improving offline operation

eventually package the application as a PWA

There are plenty of ideas for later versions, but they can wait until V1 actually works.

Future possibilities
Some ideas currently on the list include:

PWA installation

service-worker/offline caching

improved local synchronisation

band-wide setlist synchronisation

backup/sharing over the internet

more sophisticated song/setlist management

tempo-related stage features

additional live performance controls

These are possibilities rather than promises.

The priority is getting the boring stuff working reliably first.



