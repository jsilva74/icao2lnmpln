<div style="display: inline-flex; align-items: center; column-gap: 12px; height: 48px;">
  <img src="./src/assets/logo.png" width="48px" />
  <h1>ICAO Codes to Little Navmap Plan</h1>
</div>

<hr/>

#### Utility to convert a list of ICAO codes (from FSEconomy world only) to Little Nav Map flight plan.

### ICAO codes not recognized by LNM
FSEconomy database is a snapshot of FS9 database, so, many of those airports even don't exist anymore or, in the best scenario, has their ICAO codes changed.

The app tries to identify a missed airport by:
1. Locating a new ICAO code for the airport _**based on user's simulator choice**_ and using it in the LNM plan (in this case, a remark will be added with the FSE ICAO code)
2. Creating a userpoint*

* this case can prevent LNM terrain profile to work. We've get in touch with Alex (LNM developer) and he'll try to solve it.

<hr/>

### For devs
#### Run in development
1. Clone this repo
2. <code>npm install</code> or <code>yarn install</code> or <code>pnpm install</code>
3. <code>npm run dev</code> or <code>yarn run dev</code> or <code>pnpm run dev</code>
4. Enjoy!

<hr/>

### Licence: MIT
