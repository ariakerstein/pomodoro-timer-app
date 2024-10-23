import type { NextPage } from 'next'
import Head from 'next/head'
import PomodoroTimer from '../components/PomodoroTimer'

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Pomodoro Timer</title>
        <meta name="description" content="A simple Pomodoro timer web app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <PomodoroTimer />
    </div>
  )
}

export default Home