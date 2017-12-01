# jQuery Always

[![Build Status](https://travis-ci.org/TonyBogdanov/jquery-always.svg?branch=master)](https://travis-ci.org/TonyBogdanov/jquery-always)
[![BrowserStack Status](https://www.browserstack.com/automate/badge.svg?badge_key=b0pZQ291ZURCT2VIb3I1aFV3bmNibUc0UXUraVNzUmQ4cDJhMXpHVEEvST0tLVdHME5tcFo1TnFEYlRzaEczWGpoZ2c9PQ==--924d30b80e08372598f971d7431d5fffc092a3c2)](https://www.browserstack.com/automate/public-build/b0pZQ291ZURCT2VIb3I1aFV3bmNibUc0UXUraVNzUmQ4cDJhMXpHVEEvST0tLVdHME5tcFo1TnFEYlRzaEczWGpoZ2c9PQ==--924d30b80e08372598f971d7431d5fffc092a3c2)
[![Buy Me a Coffee](http://static.tonybogdanov.com/github/coffee.svg)](http://ko-fi.co/1236KUKJNC96B)

This is a [jQuery](https://jquery.org) plugin that enables you to execute callbacks anytime an element matching a specified selector is added to the DOM.

The same callbacks will also be executed once for all matching elements already found in the DOM, ensuring your callback will always run for every element matched by the selector, now and in the future, *always*.

## The Problem

Whenever you want to execute some jQuery-based logic on an element found on the page, you would generally wait for the `DOMContentLoaded` event and then target your element:

```js
$(function () {
    $('.slider').makeSlider();
});
```
    
A huge problem with this approach arises when `.slider` elements are added *after* the `DOMContentLoaded` event has already fired - a very common situation is loading content with AJAX. When new elements are added they are ***not*** going to have the `.makeSlider();` logic executed on them since the event already fired.

Event-based logic has a sort of solution, for example, if you want to listen for clicks on `button` elements, using `$('button').on('click', ...);` won't work for dynamically added elements for the same reasons. Due to the bubbling nature of events, though, you could simply listen for clicks on a parent element you *know* exists during `DOMContentLoaded`, and simply filter the target like so:

```js
$(function () {
    $(document.body).on('click', 'button', function () {
        // ...
    });
});
```
    
Unfortunately not all functionality can be solved this way.

Going back to the first example, you'd generally want to listen for a *"element matching `.slider` inserted on the page"* type of event, so that you could call `.makeSlider();` on the element.

## The Solution

Most modern browsers (and some old ones too!) have a feature implemented called a [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) which basically allows you to *listen* for all kinds of changes to the DOM, no matter when or where they are coming from.

This plugin makes use of mutation observers to track element insertions and removals and execute the registered callbacks for elements that match the specified selector.

This way you only need to wrap your existing logic in a simple call to the plugin to ensure it will also be executed for future additions of the element.

## Installation

The plugin supports installing via [Bower](https://bower.io/#install-packages), [Composer](https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies) and [NPM](https://docs.npmjs.com/getting-started/installing-npm-packages-locally) with name `jquery-always`.

## Usage

Each call to the plugin must be performed on a *parent* element also known as a *scope*. Doing so will ensure the callbacks are executed only for insertions and removals of child elements, immediate or deep.

You can always use `document.body` as a scope for a "catch-it-all" solution, but if you *know* or only *care* about target elements inside a specific scope, you should always use it, for performance reasons.

The more-specific the scope, with less elements and operations performed on it and it's children, the less stress the plugin will cause to the browser.

Each registered callback will receive the matched DOM `Element` as `this`. If more than one element is matched by the selector, the respective callbacks will be called for each of them, thus `this` will only point to exactly **one** DOM element.

You can also call `.never()` to your scope element to detach previously attached callbacks.

### Synopsis

#### `always()`

```text
always (
    // target elements selector
    selector: string,
    
    // optional callback to be executed upon insertion
    onInserted?: (this: Element) => void,
    
    // optional callback to be executed upon removal
    onRemoved?: (this: Element) => void
): JQuery // reference to the original scope element for jQuery-like chaining
```

#### `never()`

```text
never (
    // target elements selector
    selector?: string,
    
    // optional reference to a previously registered "inserted" callback to be detached
    onInserted?: (this: Element) => void,
    
    // optional reference to a previously registered "removed" callback to be detached
    onRemoved?: (this: Element) => void
): JQuery // reference to the original scope element for jQuery-like chaining
```

### Attaching an "inserted" callback

Use the following example to add a callback to be executed when elements matching `.element` are inserted inside `#scope`.

```js
$('#scope').always('.element', function () {
    $(this).doStuff();
});
```

### Attaching a "removed" callback

Use the following example to add a callback to be executed when elements matching `.element` are removed from `#scope`.

```js
$('#scope').always('.element', undefined, function () {
    $(this).undoStuff();
});
```

### ...or both simultaneously

```js
$('#scope').always('.element', function () {
    $(this).doStuff();
}, function () {
    $(this).undoStuff();
});
```

### Removing *all* attached callbacks

```js
$('#scope').never();
```

### Removing attached callbacks matching a selector

```js
$('#scope').never('.element');
```

### Removing a specific attached callback

```js
$('#scope').never('.element', onInsertedCallbackReference, onRemovedCallbackReference);
```

## Notes

Here are a couple of *a-ha* moments to keep in mind when working with the plugin.

### The selector in `never()`

When calling `never()` you **must** specify the same selector that was used when adding the callback(s) you want to remove since callbacks are grouped by the string selectors themselves, not what they might resolve to.

E.g. calling `never('div')` will not remove callbacks registered with `always('div.some-class')` even though both selectors may match the same element.

Selectors are also case-sensitive, so this: `div` is different than this: `Div`.

### Selector normalization

In order to alleviate *some* of the restrictions imposed by the above rule, selectors will go through a selector normalization process:

1. Selector is split into parts delimited by a comma.
2. Any whitespace prefix and suffix is trimmed from each part.
3. Parts are sorted alphabetically.
3. Parts are joined back together using a comma as delimiter.

Normalization will ensure selectors like `a, b` and `a,b` and even `b,a` are treated as the same thing.

### `this` in `onRemoved`

The `this` variable available inside the `onRemoved` callback will point to the element that was just removed from the DOM. Thanks to the magic of mutation observers, the original DOM tree will continue to exist at this point, meaning you can still execute jQuery operations on `this`, like `find()`-ing child elements etc. Even so, you should keep in mind that at this point the element has been detached from the DOM, so any operations you perform on it will ***not*** be reflected in the DOM.

---

Sponsored by

[![](https://static.tonybogdanov.com/browserstack/logo.png)](https://browserstack.com)