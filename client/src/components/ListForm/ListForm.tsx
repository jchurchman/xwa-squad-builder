import { useMemo, useState } from "react"
import { useParams } from "react-router"

import { useApiGet } from "@hooks"
import { HydratedPilot, HydratedShip } from "@shared/types"
import { PilotForm } from "./PilotForm"
import { DefaultOptionType } from "antd/es/select"

export function ListForm() {
  const { faction } = useParams()

  const {
    // loading,
    // error,
    data: shipData
  } = useApiGet<HydratedShip[]>(`/api/ships?faction=${faction}`)

  const [selectedShip, setSelectedShip] = useState<string|null>(null)

  const {
    // loading,
    // error,
    data: pilotData,
  } = useApiGet<HydratedPilot[]>(`/api/pilots?ship=${selectedShip}`)


  const ships: DefaultOptionType[] = useMemo(() => {
    if (shipData) {
      return shipData.map(d => ({
        label: d.name,
        value: d.name,
      }));
    }

    return []
  }, [shipData])

  const pilots: DefaultOptionType[] = useMemo(() => {
    if (pilotData) {
      return pilotData.map(p => ({
        value: p.name,
        label: p.name
      }))
    }
    return [];
  }, [pilotData])
  
  return (
    <>
    List form
    <PilotForm ships={ships} onChange={setSelectedShip} pilots={pilots} />
    </>
  )
}