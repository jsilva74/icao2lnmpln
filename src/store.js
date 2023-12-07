import { orderBy, take } from 'lodash'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create()(
  persist(
    (set) => ({
      sim: 'msfs',
      aircraft: 'C172',
      rules: 'VFR',
      altitude: 1000,
      recent: [],
      updateSim: (data) => set((state) => ({ ...state, sim: data })),
      updateAircraft: (data) => set((state) => ({ ...state, aircraft: data })),
      updateRules: (data) => set((state) => ({ ...state, rules: data })),
      updateAltitude: (data) => set((state) => ({ ...state, altitude: data })),
      updateRecent: (data) =>
        set((state) => ({
          ...state,
          recent: [...take(orderBy(state.recent, ['time'], ['desc']), 9), data],
        })),
      removeRecent: (data) =>
        set((state) => ({
          ...state,
          recent: state.recent.filter(({ id }) => !data.includes(id)),
        })),
    }),
    {
      name: '@icao2lnmpln',
    },
  ),
)

export default useAppStore
