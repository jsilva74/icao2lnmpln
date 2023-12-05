import { DateTime } from 'luxon'
import { useRef, useState } from 'react'
import { orderBy } from 'lodash'
import airports from './assets/airports.json'
import './App.css'
import useApphStore from './store'
import { v4 as UuidV4 } from 'uuid'
import logo from './assets/logo.png'
import { downloadZip } from 'client-zip'
import { version } from '../package.json'

const flightPlan = `<?xml version="1.0" encoding="UTF-8"?>
<LittleNavmap xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://www.littlenavmap.org/schema/lnmpln.xsd">
  <Flightplan>
    <Header>
      <FlightplanType>{{RULE}}</FlightplanType>
      <CruisingAlt>{{ALT}}</CruisingAlt>
      <CruisingAltF>{{ALT}}.00000000</CruisingAltF>
      <CreationDate>{{DATE}}</CreationDate>
      <FileVersion>1.0</FileVersion>
      <ProgramName>icao2lnmpln</ProgramName>
      <ProgramVersion>{{VERSION}}</ProgramVersion>
      <Documentation>https://github.com/jsilva74/icao2lnmpln#readme</Documentation>
    </Header>
    <AircraftPerformance>
      <Type>{{ACFT_TYPE}}</Type>
      <Name>{{ACFT_TYPE}} Performance Normal Operation</Name>
    </AircraftPerformance>
    <Waypoints>{{WAYPOINTS}}
    </Waypoints>
  </Flightplan>
</LittleNavmap>`
const waypoint = `\n      <Waypoint>
        <Name>{{NAME}}</Name>
        <Ident>{{ICAO}}</Ident>
        <Type>{{TYPE}}</Type>
        <Pos Lon="{{LONG}}" Lat="{{LAT}}" Alt="{{ELEV}}.00"/>
        <Comment>{{COMMENT}}</Comment>
      </Waypoint>`
const fillTemplate = (template, variables) => {
  variables.forEach(([variable, content]) => {
    const regex = new RegExp(`{{${variable}}}`, 'g')
    template = template.replace(regex, content)
  })
  return template
}
const sims = {
  fsx: 'FSX',
  msfs: 'MSFS',
  xplane11: 'XP11',
  // xplane12: 'XP12',
}
const flightRules = ['VFR', 'IFR']
const App = () => {
  const icaosRef = useRef()
  const [icaos, setIcaos] = useState('')
  const [generating, setGenerating] = useState(false)
  const sim = useApphStore((state) => state.sim)
  const aircraft = useApphStore((state) => state.aircraft)
  const altitude = useApphStore((state) => state.altitude)
  const rules = useApphStore((state) => state.rules)
  const recent = useApphStore((state) => state.recent)
  const updateSim = useApphStore((state) => (data) => state.updateSim(data))
  const updateAircraft = useApphStore(
    (state) => (data) => state.updateAircraft(data),
  )
  const updateAltitude = useApphStore(
    (state) => (data) => state.updateAltitude(data),
  )
  const updateRules = useApphStore((state) => (data) => state.updateRules(data))
  const updateRecent = useApphStore(
    (state) => (data) => state.updateRecent(data),
  )
  const removeRecent = useApphStore(
    (state) => (data) => state.removeRecent(data),
  )

  const run = async () => {
    try {
      const array = icaos
        .replace(/[^A-Z0-9]/g, ' ')
        .split(' ')
        .filter((v) => v)
      const invalid = array.filter((icao) => !airports[icao])
      if (invalid.length) {
        const error = `ICAO codes not found in FSEconomy world:\n${invalid
          .sort()
          .join(', ')}`
        alert(error)
        throw new Error(error)
      }
      const files = []
      const [first] = array
      const [last] = array.slice().reverse()
      const selected = array.map((icao, index) => {
        const airport = airports[icao]
        const [alias] = airport[sim]
        const type = !!alias ? 'AIRPORT' : 'USERPOINT'
        const comment =
          icao !== alias
            ? !!alias
              ? `FSE: ${icao}`
              : `Missing in ${sim.toUpperCase()}`
            : ''
        return {
          leg: index,
          icao: icao === alias ? icao : alias || icao,
          name: airport.name,
          type,
          longitude: airport.longitude,
          latitude: airport.latitude,
          elevation: airport.elevation,
          comment,
        }
      })
      orderBy(selected, 'leg').forEach((from, index) => {
        const to = selected[index + 1]
        if (!to) return true
        const waypoints = [from, to]
          .map(
            ({ icao, type, name, latitude, longitude, elevation, comment }) => {
              return fillTemplate(waypoint, [
                ['ICAO', icao],
                ['TYPE', type],
                ['NAME', name],
                ['LONG', longitude],
                ['LAT', latitude],
                ['ELEV', elevation],
                ['COMMENT', comment],
              ])
            },
          )
          .join('')
        const template = fillTemplate(flightPlan, [
          ['RULE', rules],
          ['ALT', altitude],
          ['DATE', new Date().toISOString()],
          ['ACFT_TYPE', aircraft],
          ['WAYPOINTS', waypoints],
          ['VERSION', version],
        ])
        const blob = new Blob([template], { type: 'text/xml' })
        files.push({
          name: `${first}-${last} ${index + 1}_${selected.length - 1} - ${
            from.icao
          } to ${to.icao}.lnmpln`,
          lastModified: DateTime.now().toJSDate(),
          input: blob,
        })
      })
      const link = document.createElement('a')
      const blob = await downloadZip(files).blob()
      link.href = window.URL.createObjectURL(blob)
      link.download = `Route ${first} to ${last}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      alert(`Plan was exported to your Downloads folder`)
      updateRecent({
        id: UuidV4(),
        icaos: icaos.replace(/\s\s+/g, ' ').replace(/[^A-Z0-9]/g, ' '),
        time: DateTime.now().valueOf(),
      })
      setIcaos('')
    } catch (error) {
      console.log(error)
    } finally {
      setGenerating(false)
      icaosRef.current.focus()
    }
  }

  return (
    <div className="container">
      <header>
        <div>
          <img src={logo} width={48} />
        </div>
        <div>
          <h1>ICAO codes to Little Navmap Plan</h1>
        </div>
      </header>
      <div className="form">
        <div>
          <form onSubmit={(ev) => ev.preventDefault()}>
            <div className="row">
              Simulator:
              {Object.keys(sims).map((key) => (
                <div key={key}>
                  <input
                    type="radio"
                    checked={sim === key}
                    onChange={(ev) => updateSim(key)}
                  />
                  <label>{sims[key]}</label>
                </div>
              ))}
            </div>
            <div className="row">
              Plan:
              <div
                style={{
                  display: 'inline-flex',
                  columnGap: 20,
                  marginLeft: 33,
                }}
              >
                {flightRules.map((rule) => (
                  <div key={rule}>
                    <input
                      type="radio"
                      checked={rules === rule}
                      onChange={(ev) => updateRules(rule)}
                    />
                    <label>{rule}</label>
                  </div>
                ))}
              </div>
              <div>
                <input
                  type="text"
                  value={aircraft}
                  onChange={(ev) =>
                    updateAircraft(ev.target.value?.toUpperCase() || 'C172')
                  }
                  title="Aircraft type"
                  placeholder="Aircraft type"
                  style={{ width: 60 }}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={altitude}
                  onChange={(ev) =>
                    updateAltitude(
                      ev.target.value?.replace(/[^0-9]/g, '') || 1000,
                    )
                  }
                  title="Cruising altitude (in ft)"
                  placeholder="Cruising altitude (in ft)"
                  style={{ textAlign: 'right', width: 40 }}
                />
              </div>
            </div>
            <div className="row">
              <div className="textarea">
                <textarea
                  ref={icaosRef}
                  value={icaos || ''}
                  onChange={(ev) => setIcaos(ev.target.value?.toUpperCase())}
                  placeholder="Type or paste the ICAO codes (existent in FSEconomy world) here separated by comma, semi-comma, space or whatever"
                  autoFocus
                />
              </div>
            </div>
            <div className="row">
              <div>
                <button
                  type="button"
                  onClick={run}
                  disabled={
                    !sim || !rules || icaos.trim().length < 7 || generating
                  }
                >
                  Generate plan to LNM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIcaos('')
                    icaosRef.current.focus()
                  }}
                  style={{ marginLeft: 20 }}
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
        <div className="recent">
          <h3>Recent Routes</h3>
          <ol>
            {orderBy(recent, ['time'], ['desc']).map(({ id, icaos }) => (
              <li
                key={id}
                onClick={() => setIcaos(icaos)}
                onDoubleClick={() => removeRecent([id])}
                title={icaos}
              >
                {icaos}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <footer>
        <div>icao2lnmpln - v.{version}</div>
      </footer>
    </div>
  )
}

export default App
