import {DateTime} from "luxon";
import {useRef, useState} from 'react';
import { orderBy } from 'lodash';
import airports from './assets/airports.json';
import './App.css'
import useApphStore from "./store";
import {v4 as UuidV4} from "uuid";
import logo from './assets/logo.png'
import { downloadZip } from 'client-zip'
import {version} from '../package.json'

const flightPlan = `<?xml version="1.0" encoding="UTF-8"?>
<LittleNavmap xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://www.littlenavmap.org/schema/lnmpln.xsd">
  <Flightplan>
    <Header>
      <FlightplanType>VFR</FlightplanType>
      <CruisingAlt>1000</CruisingAlt>
      <CruisingAltF>1000.00000000</CruisingAltF>
      <CreationDate>{{DATE}}</CreationDate>
      <FileVersion>1.2</FileVersion>
      <ProgramName>Little Navmap</ProgramName>
      <ProgramVersion>2.8.12</ProgramVersion>
      <Documentation>https://www.littlenavmap.org/lnmpln.html</Documentation>
    </Header>
    <AircraftPerformance>
      <Type>C172</Type>
      <Name>Performance Profile Example</Name>
    </AircraftPerformance>
    <Waypoints>{{WAYPOINTS}}
    </Waypoints>
  </Flightplan>
</LittleNavmap>`;
const waypoint = `\n      <Waypoint>
        <Name>{{NAME}}</Name>
        <Ident>{{ICAO}}</Ident>
        <Type>AIRPORT</Type>
        <Pos Lon="{{LONG}}" Lat="{{LAT}}" Alt="{{ELEV}}.00"/>
      </Waypoint>`;
const fillTemplate = (template, variables) => {
  variables.forEach(([variable, content]) => {
    const regex = new RegExp(`{{${variable}}}`, 'g');
    template = template.replace(regex, content);
  });
  return template;
};
const App=()=> {
  const icaosRef = useRef()
  const [icaos, setIcaos] = useState('');
  const [generating, setGenerating] = useState(false);
  const recent = useApphStore(state => state.recent)
  const updateRecent = useApphStore(state => data => state.updateRecent(data))
  const removeRecent = useApphStore(state => data => state.removeRecent(data))

  const run = async () => {
    try {
      const array = icaos
        .replace(/[^A-Z0-9]/g, ' ')
        .split(' ')
        .filter((v) => v);
      const invalid = array.filter(
        (icao) => !airports.find((airport) => airport.icao === icao),
      );
      if (invalid.length) {
        const error = `ICAO codes not found in FSEconomy world:\n${invalid.sort().join(', ')}`
        alert(error);
        throw  new Error(error)
      }
      const files = [];
      const [first] = array;
      const [last] = array.slice().reverse();
      const selected = array.map((icao, index) => {
        const airport = airports.find((airport) => airport.icao === icao);
        return {
          leg: index,
          icao: airport.icao,
          name: airport.name,
          longitude: airport.longitude,
          latitude: airport.latitude,
          elevation: airport.elevation,
        };
      });
      orderBy(selected, 'leg').forEach((from, index) => {
        const to = selected[index + 1]
        if (!to) return true
        const waypoints = [from, to].map(({icao, name, latitude, longitude, elevation}) => {
          return fillTemplate(waypoint, [
            ['ICAO', icao],
            ['NAME', name],
            ['LONG', longitude],
            ['LAT', latitude],
            ['ELEV', elevation],
          ]);
        })
          .join('');
        const template = fillTemplate(flightPlan, [
          ['DATE', new Date().toISOString()],
          ['WAYPOINTS', waypoints],
        ]);
        const blob = new Blob([template], {type: 'text/xml'});
        files.push({name: `${first}-${last} ${index + 1}_${selected.length - 1} - ${from.icao} to ${to.icao}.lnmpln`, lastModified: DateTime.now().toJSDate(), input: blob})
      })
      const link = document.createElement('a');
      const blob = await downloadZip(files).blob()
      link.href = window.URL.createObjectURL(blob);
      link.download = `Route ${first} to ${last}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert(`Plan was exported to your Downloads folder`)
      updateRecent({id: UuidV4(), icaos: icaos.replace(/\s\s+/g, ' ').replace(/[^A-Z0-9]/g, ' '), time: DateTime.now().valueOf()})
      setIcaos('')
    } catch (error) {
      console.log(error)
    } finally {
      setGenerating(false)
      icaosRef.current.focus()
    }
  };

  return (
    <div className="container">
      <header>
        <div><img src={logo} width={48}/> </div>
        <div><h1>ICAO codes to Little Navmap Plan</h1></div>
      </header>
      <div className={'form'}>
        <div>
          <form onSubmit={(ev) => ev.preventDefault()}>
            <div className="row">
              <div>
            <textarea
              ref={icaosRef}
              value={icaos || ''}
              onChange={(ev) => setIcaos(ev.target.value?.toUpperCase())}
              placeholder="Type or paste the ICAO codes (existent in FSEconomy world) here separated by comma, semi-comma, space or whatever"
              autoFocus
            />
              </div>
            </div>
            <div className={'row'}>
              <div>
                <button
                  type="button"
                  onClick={run}
                  disabled={icaos.trim().length < 7 || generating}
                >
                  Generate LNM plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIcaos('')
                    icaosRef.current.focus()
                  }}
                  style={{marginLeft:20}}
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      <div className={'recent'}>
        <h3>Recent Generated</h3>
        <ol>
          {orderBy(recent, ['time'], ['desc']).map(({id, icaos})=> (
            <li key={id} onClick={() => setIcaos(icaos)} onDoubleClick={() => removeRecent([id])} title={icaos}>{icaos}</li>
          ))}
        </ol>
      </div>
      </div>
      <footer>
        <div>icao2lnmpln  - v.{version}</div>
      </footer>
    </div>
  );
}

export default App
