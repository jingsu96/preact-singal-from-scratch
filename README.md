# Singal

Signal is the most popular concept of frontend state management in 2023, it has been widely adopted in many frontend frameworks, such as Preact, Vue, Angular, and Svelte.

The basic concept of signal is to provide a way to manage the state of the application, and to notify the view to update when the state has been changed. you can see this article to get more information about the [signal](https://preactjs.com/blog/introducing-signals)

this repository is a step by step to implement a singal from scratch.

Since the signal has been rewritten once, we will sepearte the implementation into two parts, the first part is the v1 (before @preact/signal@v1.1.1), and the second part is the version after v1.1.1.

## v1

- singal: An object with a `.value` property for state representation. Signals update components automatically when their `.value` changes, improving app efficiency without manual optimization.
- effect: A function that runs when a signal's value changes. It's used to update the UI when the signal's value changes.
- computed: A type of signal derived from others, updating its value automatically based on changes in dependent signals. It offers a way to create reactive states that update the UI without direct intervention.
