# FluentFlow

## What is fluent flow?

FluentFlow is a filtering tool for network data. The rules are written as "javascript functions" or using a fluent API (jquery like).

## Usage

Configure your rules in rules.js. Afterwards start FluentFlow using one of the following methods:

### Sniff on live interface using tshark


```node main.js -i enp3s0``` (Replace enp3s0 with your interface)

### Read a pdml file

Pdml files can be generated using wireshark or tshark.
Afterwards you can read them like this:

```node main.js -p ./example.pdml```

### Read pdml from stdin

```tshark -i enp3s0 -T pdml   2> /dev/null | node main.js -p-```
