import { Outlet } from 'react-router'

import { Header } from '../Header'
import classes from "./Layout.module.scss"

export function Layout() {
  
  return (
    <>
      <Header />
      <div className={classes.contentSpacer} />
      <Outlet />
    </>
  )
}