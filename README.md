
# song2html

Purpose

Convert fixed-column chord sheets into HTML.

Goals

- Human readable HTML
- External CSS
- External JavaScript
- Static pages
- No frameworks

Parser Status

✓ Title
✓ Notes
✓ Sections
✓ Bar lines
□ Chord/Lyric pairs   Chordpro
□ HTML generation (leave room for notes - how to embed - further tweaks)

overview of page
titlebar/heading = Song Title[link to song list(s)], previous & next song(according to lists), tempo LED)
Band & personal notes - discuss personal notes - ideal seperate text files perhaps linked to line numbers)

Song body / with personal notes

footer = previous & next song home/song lists

discuss notes, tempo LED, song lists, title & settings page.




Let's continue song2html v0.3. We have title, notes, sections and bar lines working."

-----------------

design rules



KISS

Readable code.

Readable HTML.

External CSS.

External JavaScript.

No frameworks.

No build step.

Static HTML.

Parser separate from renderer.

One responsibility per module.

Everything should still make sense in five years.


=========================


1 other thing while i remember, setting/notes etc must be as sticky as possible, so Tom always has his last settings and notes on his moblie without needing to identify himself - ideally if possble, these will carry over from the hot spot to the zips and back

-->

Ah, **excellent thing to mention before we go too far**. This is exactly the kind of requirement that is easy to accidentally make difficult later.

And I think it actually reinforces some of the design choices we've already made.

The key word you used is:

> **sticky**

Meaning:

* Tom opens the page → his preferences are still there.
* Tom moves from rehearsal hotspot → gig hotspot → zip copy → still his preferences.
* Tom should not have to log in or identify himself every time.

That suggests we should **not make the notes/settings depend on the server**.

---

## The simple web way: local storage

Modern browsers have a built-in little storage area called:

```text
localStorage
```

Think of it as a tiny cupboard inside the browser.

Example:

```text
Tom's phone
|
|-- Browser
    |
    |-- localStorage
         |
         |-- theme = dark
         |-- fontSize = large
         |-- notes = tom
         |-- lastSong = imagine
```

The website can save:

```javascript
localStorage.setItem(
    "fontSize",
    "large"
);
```

and later retrieve it:

```javascript
let size =
    localStorage.getItem("fontSize");
```

No login.

No database.

No internet.

---

## This fits your hotspot idea nicely

Imagine:

```
Raspberry Pi / laptop hotspot

        |
        |
     browser
        | 
        |
    localStorage
```

Tom's phone remembers Tom.

Not because the hotspot knows Tom...

because **Tom's browser knows Tom**.

---

## The zip file idea also works

Suppose Tom downloads:

```
songbook.zip
```

and opens it later.

The HTML/JS is identical.

His browser still has:

```
localStorage:
    musician = Tom
    theme = night
    font = large
    notes = tom
```

So it feels seamless.

---

## The one catch

Browser storage is tied to the website address.

These are considered different:

```
file:///home/tom/songbook/index.html
```

and

```
http://192.168.4.1/songbook/index.html
```

The browser may treat them as separate places.

This is something we need to think about.

---

## A possible future solution

Have a tiny settings file that can be exported/imported.

Example:

```json
tom.settings.json
```

contains:

```json
{
    "theme": "dark",
    "fontSize": "large",
    "notes": "tom",
    "tempo": true
}
```

Then:

* localStorage = automatic day-to-day memory
* settings file = backup / transfer

---

## For notes specifically

I would actually avoid storing Tom's notes in localStorage.

Your idea of:

```
imagine.tom.txt
```

is much better.

Why?

Because:

* Tom can edit it.
* It can be backed up.
* It can move between devices.
* It can be shared.

So perhaps:

```
Permanent:
    tom.txt notes

Temporary:
    localStorage:
        selected musician = Tom
        display options
        last song
        font size
```

---

## One more thought: "identify himself"

You said:

> without needing to identify himself

I think there is a very elegant solution.

Not:

```
LOGIN:
username:
password:
```

❌

Instead:

First time:

```
Who are you?

[ Tom ]
[ Dick ]
[ Sally ]
```

Then the browser remembers:

```
localStorage.musician = Tom
```

After that:

```
Welcome back Tom
```

No account.

No password.

Just a preference.

---

## This also affects the future JSON idea

The setlist could remain shared:

```
setlists/
    saturday.json
```

The song remains shared:

```
songs/
    imagine.txt
```

The person-specific layer remains separate:

```
notes/
    imagine.tom.txt
    imagine.sally.txt
```

The phone remembers:

```
"I'm Tom"
```

That's a really clean separation.

---

So my mental architecture now becomes:

```
              Shared
                |
        -----------------
        |       |       |
     Songs   Setlists  Band notes


              Personal
                |
        -----------------
        |
    Tom settings
    Tom notes
    Tom preferences


              Browser
                |
          localStorage
```

And the nice thing is: **none of this requires changing song2html.py.**

The parser can remain blissfully unaware that Tom, Dick and Sally exist. 😄

This is definitely worth having in the README as a future design requirement though. It is one of those "future Gareth will thank current Gareth" decisions.


