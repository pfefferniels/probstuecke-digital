## Probstücke Digital

This is the code for the frontend of *Probstücke Digital*, built with [Next.js](https://nextjs.org/). The encodings can be found [here](https://github.com/pfefferniels/probstuecke-data).

### Getting started

The encodings are included as the git submodule `probstuecke-data`:

```shell
git clone --recurse-submodules https://github.com/pfefferniels/probstuecke-digital.git
# or, in an existing clone:
git submodule update --init
```

Then install and start:

```shell
npm install --legacy-peer-deps
npm run dev
```

The site will be running at http://localhost:3000.

### Updating the data

The submodule follows the `main` branch of [probstuecke-data](https://github.com/pfefferniels/probstuecke-data) and does not need to be updated by hand. Whenever `main` there has changed and passed its checks, probstuecke-data asks this repository to update; the deploy workflow then commits the new state of the submodule to `main` here ("Update the data", with the list of what was merged there) and deploys the website. Every other deploy (a push to `main`, or *Run workflow* under Actions → Deploy to GitHub Pages) does the same, so the website catches up even if a notification got lost. Since the workflow commits to `main`, pull before you push.

The workflow only moves the submodule forward along `main` of probstuecke-data. A branch here that needs data which is not on that `main` yet can point the submodule to a commit on a branch of probstuecke-data: once merged, the website keeps that commit (the deploy warns about it) until it is part of `main` of probstuecke-data, and then follows `main` again.

In a local clone:

```shell
git pull
git submodule update            # the data the website uses
git submodule update --remote   # or the newest data on main of probstuecke-data
```

### Build for production

```shell
npm run build
npm run start
```

### Quality checks

```shell
npm run typecheck   # TypeScript type checking
npm run lint        # ESLint
npm run knip        # Dead code analysis
```

### Licence

The code of this website is licensed under the [MIT licence](LICENSE). The encodings in `probstuecke-data` are licensed under CC BY 4.0.
