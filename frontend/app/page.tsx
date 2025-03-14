import * as React from 'react'
import Navbar from "../src/components/layout/Navbar"

export default function Home() {
  return (
    <main>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold">Welcome to Hayag Dashboard</h1>
        <p className="mt-4">Please be patient, we are working on it hehe.</p>
      </div>
    </main>
  )
}