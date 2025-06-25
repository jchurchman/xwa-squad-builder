import { useParams } from 'react-router'

export function SquadBuilder() {
  const { faction, lang } = useParams()
  
  // Your component logic here
  return <div>Squad Builder for {faction} in {lang}</div>
}