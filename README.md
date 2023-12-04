<div style="display: inline-flex; align-items: center; column-gap: 12px; height: 48px;">
  <img src="./src/assets/logo.png" width="48px" />
  <h1>ICAO Codes to Little Navmap Plan</h1>
</div>

<hr/>

#### Utility to convert a list of ICAO codes (from FSEconomy world only) to Little Nav Map flight plan.

### ICAO codes not recognized by LNM
FSEconomy database is a snapshot of FS9 database, so, many of those airports even don't exist anymore or, in best scenario, has their ICAO codes changed.

When these ICAO codes are imported to LNM, LNM will not be able to address them. In this case, you can replace the missing airport by an userpoint (<a href="https://drive.google.com/file/d/13xM0BSt6qVSF7qeE-nDDy0GkXiItpKpn/view?usp=share_link" target="_blank">Here</a> you'll find all FSE airports as LNM userpoint to import in LNM and use them as replacement for any missing airport).

<hr/>

### For devs
#### Run in development
1. Clone this repo
2. <code>npm install</code> or <code>yarn install</code> or <code>pnpm install</code>
3. <code>npm run dev</code> or <code>yarn run dev</code> or <code>pnpm run dev</code>

<hr/>

### Licence: MIT
