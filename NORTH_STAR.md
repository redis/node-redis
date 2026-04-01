# NORTH STAR — RESP2/RESP3 Parity

## Goal
The Redis client must return identical responses regardless of which RESP version is selected by the user.

## Source of truth
`resp-diff.txt` contains all commands where the SERVER differs responses between RESP2 and RESP3. Every one of those commands is a candidate to check.

## Plan

### Phase 1 — Ensure RESP2 test coverage
For each command in `resp-diff.txt`, check its test:
- If the test structurally asserts the RESP2 response shape well enough that it would break if the shape changed → leave it alone.
- If not → improve the test to capture the structure of the RESP2 reply.
- All tests run against RESP2 (`GLOBAL.SERVERS.OPEN`).

### Phase 2 — Flip to RESP3
Switch `GLOBAL.SERVERS.OPEN` to point to RESP3 and run the tests. Any test that breaks means the command's response shape differs between RESP2 and RESP3.

### Phase 3 — Fix broken commands
For each broken command, fix its `transformReply` (or add a RESP3 transform) so that the RESP3 response is transformed to look identical to the RESP2 response.
