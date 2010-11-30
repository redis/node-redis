Changelog
=========

## v0.3.9 - November 30, 2010

Fix parser bug on failed EXECs.

## v0.3.8 - November 10, 2010

Fix for null MULTI response when WATCH condition fails.

## v0.3.7 - November 9, 2010

Add "drain" and "idle" events.

## v0.3.6 - November 3, 2010

Add all known Redis commands from Redis master, even ones that are coming in 2.2 and beyond.

Send a friendlier "error" event message on stream errors like connection refused / reset.

## v0.3.5 - October 21, 2010

A few bug fixes.

* Fixed bug with `nil` multi-bulk reply lengths that showed up with `BLPOP` timeouts.
* Only emit `end` once when connection goes away.
* Fixed bug in `test.js` where driver finished before all tests completed.

## unversioned wasteland

See the git history for what happened before.
