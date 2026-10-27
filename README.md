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
