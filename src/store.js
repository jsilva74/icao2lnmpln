import { orderBy, take } from 'lodash'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useApphStore = create()(
  persist(
    (set) => ({
      sim: 'MSFS',
      recent: [],
      updateSim: (data) => set((state) => ({ ...state, sim: data })),
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

export default useApphStore
