# សៀវភៅបញ្ជីស្រង់វត្តមាន និងពិន្ទុ

A tablet gradebook for Cambodian primary, secondary, and university teachers. One landscape screen holds a full class of 40 students: tap a cell to mark វត្តមាន, អវត្តមាន, or ច្បាប់, and the same roster calculates monthly averages, semester GPA, and class rank without a calculator.

The sample class is ថ្នាក់ទី១០ ក at វិទ្យាល័យ ចេតិយ. Everything stays in this browser (`localStorage`). Nothing is sent to a server.

## Run

```bash
npm install
npm test
npm run dev
```

Open the app in landscape. On a narrow screen the attendance sheet switches to one week at a time so the roster still does not scroll sideways.

## What a teacher can do

- **វត្តមាន** — the whole month is a single grid. Tap a cell to cycle present, absent, excused, then clear. Tap a day number to mark that day for the whole class. វត្តមានថ្ងៃនេះ fills today. បំពេញថ្ងៃរៀន fills Monday–Friday and leaves the weekend alone.
- **ពិន្ទុ** — enter scores in the dock. Enter moves to the next subject, then the next student. Averages and ranks update immediately. A star means a subject is still blank.
- **ចំណាត់ថ្នាក់** — monthly rank, semester average, GPA on a 4-point scale, mention, and attendance counts. Ties share a rank and the next number skips.
- **លិខិត** — a Khmer progress notice. ផ្ញើ Telegram opens a Telegram share with that text. ទាញយកគ្រប់សិស្ស saves every notice as a UTF-8 file.

The gear stores school, class, teacher, subjects (coefficient and max score), and up to 40 students. Export and import a JSON backup from the same screen.

## How the numbers work

Scores are normalized onto 10, then weighted:

`មធ្យមភាគ = Σ (ពិន្ទុ ÷ ពិន្ទុអតិបរមា × 10 × មេគុណ) ÷ Σ មេគុណ`

A subject left blank is left out of that month’s average. Semester average is the mean of the monthly averages that exist.

- ឆមាសទី១ is វិច្ឆិកា–មីនា
- ឆមាសទី២ is មេសា–សីហា
- កញ្ញា and តុលា show the latest finished semester (ឆមាសទី២ of that year)

`GPA = មធ្យមភាគឆមាស ÷ 10 × 4`

Pass line defaults to 5.00 on the 10-point scale. Mentions run ល្អប្រសើរ, ល្អណាស់, ល្អ, ល្អបង្គួរ, មធ្យម, ខ្សោយ.
