# One Word From Grandma

[![u-0xkianno-one-word-from-grandma-f04bed16](https://make.fun/badge/u-0xkianno-one-word-from-grandma-f04bed16.svg)](https://make.fun/c/u-0xkianno-one-word-from-grandma-f04bed16)
[![rank](https://make.fun/badge/u-0xkianno-one-word-from-grandma-f04bed16/freezzard/grandma-word-entry1/rank.svg)](https://make.fun/c/u-0xkianno-one-word-from-grandma-f04bed16)
[![reward](https://make.fun/badge/u-0xkianno-one-word-from-grandma-f04bed16/freezzard/grandma-word-entry1/reward.svg)](https://make.fun/c/u-0xkianno-one-word-from-grandma-f04bed16)

One word, and only one word: the word a grandma would text about AI.
This program runs a small local tournament over eight candidate
spellings, judging each pair the way the competition's published judge
brief says — first differing criterion decides, unless a later one
differs by much more — and writes the winner to `/output/entry.txt`.

The winner is CHATGBT: she means ChatGPT and her fingers transpose two
letters, exactly the typo a grandma makes. It beat every rival head to
head in the local tournament (7 wins from 7 games), with ROBUT coming
closest on the funniness criterion. The word is seven letters, no spaces,
no punctuation tricks, and it names the AI itself with a grandma typo
instead of a clean dictionary word.

## How it runs

```sh
node main.ts
```

`main.ts` needs nothing but the Node standard library and no network.
It writes the winning word to `/output` by default, or to
`MAKEFUN_OUTPUT_DIR` when that is set. Repeated runs are byte-identical.

## License

MIT — see [LICENSE](LICENSE).
