---
title: "Turning words into numbers: bag of words"
description: "Computers only work with numbers. So how do you turn a sentence into numbers? We start with one of the oldest answers, and build a spam filter along the way."
pubDate: 2026-10-24
series: "How LLMs work"
part: 1
---

This post is the first in a series where I endeavor to explain how large language models (LLMs) work, for people who have little or no technical background. By the end, you'll understand how an LLM like Claude or ChatGPT turns your questions into answers, with no math or coding background needed. We'll take it step by step, one problem at a time.

And the first problem hits us before we can even begin to think about anything AI-related. Computers do not understand text. These days, Claude answers even your most obscure questions, so it's easy to think it reads words the way you do, but it does not. The only thing computers are comfortable working with is numbers. Which brings us to our first challenge: how do we turn words and sentences into numbers that a computer can work with?

Now, we could jump directly to how LLMs solve this, but that would require introducing so many topics and terms that your head would probably explode. Instead, let's take a look at one of the first successful solutions computer scientists came up with: **bag of words**. It won't get us all the way to Claude, but understanding where it falls short will show us exactly what pushed researchers toward the ideas behind modern LLMs.

Bag of words has been around since the 1950s. The term is usually traced to linguist Zellig Harris, who used it in a 1954 paper. He actually mentions it somewhat dismissively, pointing out that language is more than a bag of words. As you'll see, there is a certain irony to this term being used for the model we are about to examine, since its biggest weakness is exactly the one Harris pointed out.

Before we start judging it, however, let's see what it can actually do! Let's say you're an IT guy at a big company, where people are flooded with spam every day. Inheritance offers from Nigerian princes and coupons for miracle hair growth pills litter the inboxes. You're tasked by the CEO with filtering them out. But how?

Well, you need to be able to tell regular emails and spam apart. You take a sample of both and notice some words, like "free", "money" and "winner", appear much more often in spam than in regular emails. Interesting! If your filter could check how many of these words, let's call them spam words, appear in an email, you might have a basis for filtering out spam!

You put together a list of spam words and set up a filter. All is well for a few days. Then you get a call from HR saying their "Free lunch Friday" email ended up in everyone's spam folder. Remember, the computer isn't reading anything. It doesn't understand the meaning of any word or sentence. It just looks for matching letters, so if "free" is considered a spam word, emails about free lunches get thrown in the spam folder too. Meanwhile, the spammers have caught on, and now everyone gets emails titled "fr33 m0neyzzz" instead. You could keep updating your list forever, but surely there has to be a better way.

And then it hits you. The problem isn't the filter, it's you! You're the one guessing which words are spammy. What if, instead, you based that decision on the data at hand, namely the thousands of emails you have at your disposal? Plenty of them are spam and plenty of them aren't. What if you had the computer go through all of them and, for every word, keep track of how often it shows up in spam and how often in regular emails?

Let's show this with a simple example. Say you're working with four short emails that you've already sorted yourself, so you know which ones are spam and which aren't:

|                   | Email               |
| ----------------- | ------------------- |
| Spam Example 1    | "win free money"    |
| Spam Example 2    | "free money now"    |
| Regular Example 1 | "free lunch friday" |
| Regular Example 2 | "meeting friday"    |

Before we start counting the words, we let the computer make a list of every unique word across all emails:

```
win, free, money, now, lunch, friday, meeting
```

That's seven words in total. Let's call this our **vocabulary**. In this example, we keep it quite small for learning purposes, but if you went through thousands of emails, it would be a much bigger list.

Then, as you envisioned, the computer counts how many times each word in the vocabulary appears in each email:

|                   | win | free | money | now | lunch | friday | meeting |
| ----------------- | --- | ---- | ----- | --- | ----- | ------ | ------- |
| Spam Example 1    | 1   | 1    | 1     | 0   | 0     | 0      | 0       |
| Spam Example 2    | 0   | 1    | 1     | 1   | 0     | 0      | 0       |
| Regular Example 1 | 0   | 1    | 0     | 0   | 1     | 1      | 0       |
| Regular Example 2 | 0   | 0    | 0     | 0   | 0     | 1      | 1       |

Unbeknownst to you, this is actually a big moment... You turned words into numbers! As a matter of fact, each email can now be converted to an ordered list of numbers that represent how many times each word in the vocabulary appears in it. Take "win free money". As far as the computer is concerned, that email is now simply `[1, 1, 1, 0, 0, 0, 0]`.

The technical term for an ordered list of numbers like this is a _vector_. I'm introducing it now because it will only grow in importance as this series progresses. Notice that every email gets a vector of exactly the same length, always one number for each word in our vocabulary, and always in the same order. The first number always counts "win", the second always counts "free", and so on. That is what lets the computer compare emails with each other.

Back to our spam filter. Looking at the table, some interesting results start to show.

It seems "money" appears in both spam emails and no regular ones, so it's a strong spam signal! On the other hand, "free" appears in both groups, so it's not a surefire indicator for spam content. And "friday" only appears in regular emails, so it actually points away from spam.

To make this easier to use, the computer adds up the counts for each word, split into spam and regular:

| Word    | In spam | In regular |
| ------- | ------- | ---------- |
| win     | 1       | 0          |
| free    | 2       | 1          |
| money   | 2       | 0          |
| now     | 1       | 0          |
| lunch   | 0       | 1          |
| friday  | 0       | 2          |
| meeting | 0       | 1          |

This is what your filter has learned from the example emails. In machine learning, this is called **training**: letting the computer learn patterns from examples you yourself already know the answer to.

Now that you've trained your shiny new spam filter, you decide to let it loose on an HR email that just popped into your inbox: "Free lunch after Friday meeting".

Just as it did with the example emails, your filter converts the new email to a vector using the same vocabulary:

| Word    | Count in "Free lunch after Friday meeting" |
| ------- | ------------------------------------------ |
| win     | 0                                          |
| free    | 1                                          |
| money   | 0                                          |
| now     | 0                                          |
| lunch   | 1                                          |
| friday  | 1                                          |
| meeting | 1                                          |

The resulting vector is thus `[0, 1, 0, 0, 1, 1, 1]`. Notice that since "after" is not in the vocabulary, it does not get a spot. The filter simply ignores it.

Using that vector, the filter knows which words to look at: every word that appears in the email at least once. For each of those words, it looks up how often it appeared in spam and in regular emails during training and adds those numbers up:

| Word in email | In spam | In regular |
| ------------- | ------- | ---------- |
| free          | 2       | 1          |
| lunch         | 0       | 1          |
| friday        | 0       | 2          |
| meeting       | 0       | 1          |
| **Total**     | **2**   | **5**      |

"Free" leans towards spam, but "lunch", "friday" and "meeting" all point to a regular email. With a score of 5 for regular email against a score of 2 for spam, the email is deemed safe to go into the inbox!

Now contrast that harmless email with one that reads "win free free free money now". Again, we count the words:

| Word    | Count in "win free free free money now" |
| ------- | --------------------------------------- |
| win     | 1                                       |
| free    | 3                                       |
| money   | 1                                       |
| now     | 1                                       |
| lunch   | 0                                       |
| friday  | 0                                       |
| meeting | 0                                       |

So its vector is `[1, 3, 1, 1, 0, 0, 0]`.

Since "free" appears three times, its scores count three times too:

| Word in email | Count | In spam   | In regular |
| ------------- | ----- | --------- | ---------- |
| win           | 1     | 1 × 1 = 1 | 1 × 0 = 0  |
| free          | 3     | 3 × 2 = 6 | 3 × 1 = 3  |
| money         | 1     | 1 × 2 = 2 | 1 × 0 = 0  |
| now           | 1     | 1 × 1 = 1 | 1 × 0 = 0  |
| **Total**     |       | **10**    | **3**      |

Sheesh! 10 points for spam against 3 for regular. This one goes straight to the spam folder! Notice that even though "free" appears in regular emails too, cramming it in three times only made things worse for the spammer.

Congratulations, you just built a bag of words!

Let's recap what you did for a moment. You made the computer list every unique word in your example emails. We call this list the vocabulary. Then you had the computer go over those emails and count how often each word in the vocabulary appeared in each of them, turning every email into a vector. Since you knew which example emails were spam and which weren't, your filter learned which words are indicators of spam content and which aren't. When a new email arrives, it likewise gets converted into a vector and scored against what the filter learned, marking it as a regular email or spam.

So why name this approach bag of words? Well, imagine slicing an email into individual words, throwing them all in a bag and giving it a good shake. Peeking into said bag, you can still tell which words are in there and how many of each, but you have absolutely no idea in which order they came. That's exactly what our vectors capture here: which words appear and how often, but nothing more.

And it works surprisingly well. Early spam filters were built on very similar ideas, and for a while they were remarkably effective at keeping Nigerian princes at bay.

But remember Zellig Harris? He had a point. Language is more than a bag of words, and that's where our filter starts to run into trouble.

Consider these two sentences: "dog bites man" and "man bites dog". With bag of words, they would get exactly the same vector, since the same words appear in both sentences an equal number of times. And yet, as you and I know, their meanings could not be more different. That's the first big limitation of bag of words: once the words are in the bag, their order is lost, and with it a big part of the meaning.

But there's an even bigger problem! To bag of words, every word is just a column in a table. It has no idea what any of them mean, let alone how they relate to each other. "Dog" and "hound" mean practically the same thing to you and me, but to our filter, they are as different as "dog" and "spreadsheet". So when the spammers switch from "free money" to "complimentary cash", your filter is clueless. It has never seen those words, and it has no idea they are synonyms for words it does know! The only recourse would be to wait until enough of those emails pile up and use them to train your filter again.

Imagine, for a moment, that the numbers in the vectors themselves could carry meaning, that words like "money" and "cash" got similar numbers, so the computer could tell they're related. Wouldn't that be something? Well, that's exactly what we'll explore in the next post, where we dive into embeddings and one of the first models to make them work: word2vec.
