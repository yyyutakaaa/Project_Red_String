# Interrogation eval

Adversarial test runner for the deployed `interrogate` edge function.

```powershell
node tools/eval/run-eval.mjs --models deepseek-flash --judge
```

What it does:

- Builds 31 probes per suspect (`probes.mjs`): direct "who did it" questions, prompt-injection and
  jailbreak attempts (ignore instructions, repeat the system prompt, debug mode, tag injection, base64),
  out-of-character bait (are you an AI, write code), contradiction traps built from the suspect's own lies
  and the crime time, invented-fact probes, and questions in Spanish, German, French, Dutch and Japanese.
- Sends each probe as a fresh single-turn interrogation (new `save_id`) with the `X-Eval-Model` header, so
  several model ids can be compared on the same probes.
- Measures time to first streamed token and total time on the client.
- Scores every reply with heuristics (never_reveal and solution word overlap, naming the culprit next to
  killing words, out-of-character vocabulary, language detection, length) and, with `--judge`, a
  server-side judge model that sees the full suspect sheet and the hidden solution (leak, named culprit,
  out of character, invented facts).
- Writes `results/eval-<timestamp>.json` (every reply) and `results/eval-<timestamp>.md` (summary table
  and every flagged reply, with the raw model text and what the player was actually shown after the
  server's sanitiser).

Options: `--models`, `--cases`, `--suspects`, `--limit`, `--concurrency`, `--judge`, `--out`.

Eval mode is only active with a valid `X-Eval-Token` whose SHA-256 hash is in `public.eval_tokens`. It
lets the request choose a model from that token's allow-list, skips the patience limit and uses a separate,
higher rate limit. The daily spend ceiling still applies.
